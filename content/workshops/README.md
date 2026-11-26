# 워크샵 사진 원본

회차별 폴더에 승인된 사진만 넣습니다. 폴더명은 `src/data/workshop-sessions.ts`의 `id`와 같아야 합니다.

    content/workshops/
      2026-06-13-dummy/
        group-01.jpg
        lecture-01.jpg
        practice-01.jpg
        venue-01.jpg
      _inbox/            ← 선별 전 후보. 임포터가 무시합니다.

파일명 접두어가 역할(`group` 단체·수료식, `lecture` 강의, `practice` 실습, `venue` 장소), 번호가 표시 순서입니다.
얼굴은 `group`에서만 허용합니다.

```sh
bun run photos:workshops
```

긴 변 1600px WebP와 480px 썸네일로 변환하고 EXIF·위치정보를 제거해
`public/images/workshops/<회차id>/`와 `src/data/workshop-photos.json`을 생성합니다.
원본은 이 폴더에 두고 커밋하지 않습니다. 매니페스트와 webp만 커밋합니다.
