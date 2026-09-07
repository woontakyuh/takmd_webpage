# Seongsu / Han River office outlook

The two public backdrop images are original AI-generated reconstructions made for this site. They are visual atmosphere assets, not photographs of a private unit, a claim about a particular floor or resident location, or a surveyed record of the view.

## Geographic and composition references

- Hanwha Engineering & Construction's public Galleria Foret project page established the Seoul Forest setting and south-facing Han River outlook: https://www.hwenc.com/majorprojects/galleria-foret.do
- Haeahn Architecture's public project page was checked for the development's site and tower axis: https://www.haeahn.com/ko/project/detail.do?prjctSeq=715
- A public broker photograph at https://galleriaforet.hnchouse.com/assets/view.jpg was used only as a temporary composition reference during generation: park and low industrial roofs in front, a tall glazed tower on the left, dense Seoul in the middle, the broad Han River and low straight bridges on the right, and a continuous mountain ridge in the distance. No reuse license was found, so the photograph is not committed or displayed by this site.

The references do not establish an exact private-unit viewpoint. The generated scene intentionally uses non-identifying, reconstructed architecture and contains no readable signs, logos, famous landmarks, interior frames, or watermarks.

## Generated deliverables

- `public/images/office-outlook/seongsu-han-river-day.webp` — late-afternoon documentary-style reconstruction, 1835 × 857, SHA-256 `825c81e2fb9d169011956b8f6481c7276db203a80970270132d16da35c21eb09`.
- `public/images/office-outlook/seongsu-han-river-night.webp` — matched blue-hour/night lighting variant, 1837 × 856, SHA-256 `eda8b9b4ba8ec55122596d32d14fca648b827c7ef9d738b09fcf6802ef36a430`.

Both were generated on 2026-09-08 with Codex's built-in OpenAI image-generation tool. The day prompt requested a new photorealistic 2:1-or-wider Seoul panorama preserving only the verified geographic composition. It explicitly excluded exact buildings, private-unit inference, readable signs, logos, watermarks, fisheye distortion, invented landmarks, fantasy architecture, and stylized color grading. The night prompt treated the day output as the invariant edit target and changed only the lighting to restrained blue hour with warm city lights, while preserving the panorama framing, skyline, river, bridges, ridge, and foreground.

The generated PNG outputs were visually inspected, then encoded as WebP at quality 84 with Sharp 0.34.5. The runtime blends the matched day and night assets from the existing solar sky colors and displays them with angular panorama coordinates on a distant plane clipped in the fragment shader to the actual window opening. Sky depth is placed behind the room to keep oblique mobile views within camera clip space. This is a 2.5D reconstruction, not a full 360-degree photographic panorama.
