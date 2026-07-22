# TakMD.com Design System

## 1. Direction

TakMD.com is an interactive deskterior homepage plus a living CV. The homepage should feel like Woon Tak Yuh's working desk turned into an interface: clinical practice, education, research, AI workflow, presentations, and personal field notes are discovered through objects, not through a generic scroll landing page.

The desk is the brand. The CV is the record. Subpages expand the record.

## 2. Homepage Principles

- Keep the deskterior concept, but do not let the photo carry the whole design.
- Use the desk photo as a stage: the enlarged monitor becomes the primary readable interface, while desk objects act as controls.
- Objects are interactive controls rendered as transparent object assets above the desk, not as visible map markers.
- Hovering the physical object should lift the asset and glow around its alpha edge; click locks a section.
- The monitor is the readable content surface. It may feel slightly expanded beyond the physical bezel, but it should still belong to the desk.
- Mobile and tablet prioritize readability: chips and a large monitor panel replace tiny object hotspots.

## 3. Visual Language

### Homepage

- Atmosphere: bright clinical studio, natural window light, warm wood, quiet medical objects.
- Shape language: daylit monitor OS, translucent glass controls, separate object asset layers, alpha-edge glow, and soft object lift.
- Accent: per-section object color only. Color indicates active state, hover preview, and the monitor action.
- Avoid: marker-dot image maps, dark hacker-room styling, gimmick terminal text, illegible microcopy, AI-generated photo artifacts.

### Public Subpages

- Atmosphere: light editorial CV and clinical record pages.
- Role: let `/cv`, `/ube`, `/education`, `/ai`, `/research`, `/media`, `/knowledge`, and `/contact` act as readable expansions of the homepage objects.
- Keep subpages calm, but not anonymous.

## 4. Color

### Daylit Desk

| Role | Value | Usage |
|------|-------|-------|
| Page base | #F4EFE5 | Homepage background |
| Monitor | rgba(253,250,243,0.94) | Interactive content panel |
| Monitor glass | rgba(255,255,255,0.72) | Chrome, nav, object dock |
| Desk shadow | rgba(88,68,42,0.18) | Table depth |
| Clinical blue | rgba(85,129,156,0.16) | Window-side ambient field |
| Warm sunlight | rgba(232,179,104,0.22) | Desk glow and object relays |
| Text strong | #182016 | Primary monitor content |
| Text muted | rgba(45,54,43,0.64) | Secondary copy |

### Light Record Pages

| Token | Value | Usage |
|-------|-------|-------|
| --color-bg | #F8F7F3 | Main page background |
| --color-surface | #FFFFFF | Cards and panels |
| --color-surface-alt | #F1EFE8 | Muted panels |
| --color-text | #171614 | Primary text |
| --color-text-secondary | #5F5B53 | Secondary text |
| --color-border | #DED9CF | Dividers and cards |
| --color-accent | #6F5A3E | Links and active states |

## 5. Typography

- Primary sans: "Avenir Next", "Helvetica Neue", Arial, system-ui, sans-serif.
- Serif: Georgia, "Times New Roman", serif.
- Mono: "SFMono-Regular", "Cascadia Code", "Liberation Mono", ui-monospace, monospace.
- Homepage display type is large, direct, and personal: "Woon Tak Yuh, MD".
- Monitor text must pass the glance test at 390px and 1440px.
- Metadata may use mono, but body content should not become terminal cosplay.

## 6. Data Surfaces

- Homepage receives small serialized previews only: metrics, latest publications, latest presentations.
- `/cv` remains the full living CV surface.
- Do not import the large dashboard app into the homepage.
- Current homepage metrics: publications, first-author count, presentations, registry cases, latest case date, training countries.

## 7. Motion & Interaction

- Motion should be physical and restrained: hover lift, alpha-edge glow, monitor panel fade.
- Scene light follows the visitor's local time: window light, ambient dim, and desk lamp glow interpolate continuously between day-phase keyframes (`desk-hero/daylight.ts`); the calendar clock object runs on the visitor's local clock. `?hour=<0-24>` overrides the phase for review.
- Desk objects are photorealistic alpha cutouts generated to match the desk photo's left-window daylight; inactive objects also receive the scene's brightness filter so they sink into the light.
- Animate transform and opacity only.
- All object controls must be real buttons with accessible labels.
- Keyboard users must be able to tab into the desk controls.
- Reduced-motion users should still get the same content.

## 8. Anti-Slop Guardrails

- No generic beige portfolio hero.
- No one-way scroll-only homepage.
- No decorative images that carry the concept by themselves.
- No unreadable monitor text.
- No fake data, fake counters, or static "coming soon" as a primary surface.
- No emoji-driven visual language.
- No visible dot-marker interaction model on the desk objects.
- No visible SVG outline maps around objects; use real transparent object assets or live DOM objects with matching alpha-style glow.
