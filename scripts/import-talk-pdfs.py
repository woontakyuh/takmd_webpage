#!/usr/bin/env python3
"""Render meeting PDFs into page images and thumbnails for the public slide reader."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


def match_presentation(pdf, source, presentations):
    metadata = pdf.parent / 'presentation.json'
    if metadata.exists():
        selected_id = json.loads(metadata.read_text())['id'].replace('-', '')
        matches = [p for p in presentations if p['id'].replace('-', '') == selected_id]
    else:
        date = re.search(r'\d{4}-\d{2}-\d{2}', str(pdf.relative_to(source)))
        matches = [p for p in presentations if date and p['date'] == date.group()]
    if len(matches) != 1:
        raise ValueError(f'{pdf.name}: expected one meeting match, found {len(matches)}. '
                         'Use a YYYY-MM-DD folder; for shared dates add presentation.json with the exact meeting id.')
    return matches[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path, help='Folder containing the meeting PDF folders')
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--dry-run', action='store_true', help='Check meeting matches without rendering or changing data')
    parser.add_argument('--filename-prefix', default='', help='Case-sensitive literal filename prefix, e.g. TVPDF_; omitted selects all PDFs')
    args = parser.parse_args()
    source, repo = args.source.resolve(), args.repo.resolve()
    if not source.is_dir():
        parser.error(f'Source folder does not exist: {source}')
    presentations = json.loads((repo / 'src/data/presentations.json').read_text())['presentations']
    jobs = []
    matched = set()
    for pdf in sorted(source.rglob('*')):
        if not pdf.is_file() or pdf.suffix.lower() != '.pdf':
            continue
        if not pdf.name.startswith(args.filename_prefix):
            continue
        presentation = match_presentation(pdf, source, presentations)
        if presentation['id'] in matched:
            raise ValueError(f"Multiple PDFs match {presentation['date']} / {presentation['name']}; keep one public deck per meeting.")
        matched.add(presentation['id'])
        jobs.append((pdf, presentation))
    if not jobs:
        print('No PDFs yet. Add one PDF per dated meeting folder; existing slide data is unchanged.')
        return
    for pdf, meeting in jobs:
        print(f"{pdf.name} -> {meeting['date']} / {meeting['name']}")
    if args.dry_run:
        print(f'Validated {len(jobs)} meeting PDF(s); no files changed.')
        return
    if not shutil.which('pdftoppm') or not shutil.which('pdfinfo'):
        parser.error('Poppler is required: install pdftoppm and pdfinfo before importing.')
    media_path = repo / 'src/data/studio-talk-media.json'
    media = json.loads(media_path.read_text())
    replacements = {}
    for pdf, meeting in jobs:
        info = subprocess.run(['pdfinfo', str(pdf)], text=True, capture_output=True, check=True).stdout
        page_match = re.search(r'^Pages:\s+(\d+)', info, re.M)
        if not page_match:
            raise ValueError(f'Could not determine page count: {pdf.name}')
        count = int(page_match.group(1))
        digest = hashlib.sha256(pdf.read_bytes()).hexdigest()[:12]
        relative = Path('studio/talks/full') / meeting['id'] / digest
        destination = repo / 'public' / relative
        existing = next((item for item in media if item['id'] == meeting['id']), None)
        if existing and existing.get('kind') == 'full' and len(existing['slides']) == count and all(
            slide['src'].startswith('/' + relative.as_posix() + '/')
            and (repo / 'public' / slide['src'].lstrip('/')).is_file()
            and (repo / 'public' / slide.get('thumbnail', '').lstrip('/')).is_file()
            for slide in existing['slides']
        ):
            print(f"Unchanged: {meeting['name']} ({count} pages)")
            continue
        slides = []
        with tempfile.TemporaryDirectory(prefix='takmd-slides-') as temporary:
            rendered = Path(temporary)
            subprocess.run(['pdftoppm', '-scale-to', '1920', '-png', str(pdf), str(rendered / 'page')], check=True, capture_output=True)
            pages = sorted(rendered.glob('page-*.png'), key=lambda p: int(p.stem.rsplit('-', 1)[1]))
            if len(pages) != count:
                raise ValueError(f'{pdf.name}: expected {count} rendered pages, got {len(pages)}')
            destination.mkdir(parents=True, exist_ok=True)
            for index, page in enumerate(pages, 1):
                filename, thumbname = f'page-{index:04d}.webp', f'thumb-{index:04d}.webp'
                with Image.open(page) as image:
                    image = image.convert('RGB')
                    image.save(destination / filename, 'WEBP', quality=88, method=6)
                    width, height = image.size
                    image.thumbnail((320, 320), Image.Resampling.LANCZOS)
                    image.save(destination / thumbname, 'WEBP', quality=76, method=6)
                slides.append({'src': '/' + (relative / filename).as_posix(),
                               'thumbnail': '/' + (relative / thumbname).as_posix(),
                               'caption': f"{meeting['name']} - Slide {index}", 'width': width, 'height': height})
        replacements[meeting['id']] = {'id': meeting['id'], 'kind': 'full', 'slides': slides}
        print(f"Rendered {count} pages: {meeting['name']}")
    merged = [replacements.pop(item['id'], item) for item in media]
    merged.extend(replacements.values())
    temporary_manifest = media_path.with_suffix('.json.tmp')
    temporary_manifest.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + '\n')
    temporary_manifest.replace(media_path)
    print(f'Imported {len(jobs)} complete presentation(s). Original PDFs remain in the source folder.')


if __name__ == '__main__':
    main()
