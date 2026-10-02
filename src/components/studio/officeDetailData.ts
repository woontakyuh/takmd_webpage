import { PERSONAL_LINKS } from './personal';

// Source: src/pages/contact.astro, with current shared social addresses.
export const contactCards = [
  {
    label: 'Email',
    value: 'woontak.yuh@gmail.com',
    description: 'Best for collaboration, education, research, and professional inquiries.',
    href: PERSONAL_LINKS.email,
  },
  {
    label: 'Hospital',
    value: 'Davos Hospital',
    description: 'Clinical profile and hospital-facing professional information.',
    href: PERSONAL_LINKS.hospital,
  },
  {
    label: 'Google Scholar',
    value: 'Publication record',
    description: 'Citation profile and indexed publication record.',
    href: 'https://scholar.google.com/citations?user=tbTBemUAAAAJ&hl=ko&oi=ao',
  },
  {
    label: 'LinkedIn',
    value: 'Professional profile',
    description: 'Professional network, current work, and collaborations.',
    href: PERSONAL_LINKS.linkedin,
  },
  {
    label: 'ResearchGate',
    value: 'Research profile',
    description: 'Research network and publication discovery.',
    href: 'https://www.researchgate.net/profile/Woon-Tak-Yuh?ev=hdr_xprf',
  },
  {
    label: 'Instagram',
    value: '@tak_md',
    description: 'Public personal signal and occasional field notes.',
    href: PERSONAL_LINKS.instagram,
  },
] as const;

// Source: src/pages/credits.astro
export const models = [
  {
    title: 'Fender Stratocaster',
    author: 'Anderson Fogaça',
    source: 'https://sketchfab.com/3d-models/fender-stratocaster-d5dac6b9f2964601b07109c78ed9e7cd',
    note: 'Adapted with Sienna Sunburst body materials, a maple fingerboard and black dot markers, and paired with a floor stand. Original mesh and hardware details retained.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    licenseLabel: 'Creative Commons Attribution 4.0',
  },
  {
    title: 'Dypsis lutescens indoor palm',
    author: 'AllQuad',
    source: 'https://sketchfab.com/3d-models/free-dyspis-lutescens-potted-palm-92f75abd656049608248cf76a8c88136',
    note: 'Textured foliage from [FREE] Dyspis Lutescens - Potted Palm. Rescaled for the office and paired with an original white planter and light wood stand; the source pot was removed.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    licenseLabel: 'Creative Commons Attribution 4.0',
  },
  {
    title: 'Eames Soft Pad Executive Chair',
    author: 'Laci Lacko (LaciViz)',
    source: 'https://www.behance.net/gallery/72799495/Herman-Miller-FREE-3D-model',
    note: 'Original chair by Laci Lacko. Geometry optimized and materials adapted for TakMD.',
    license: 'https://www.laciviz.com/freebies.html',
    licenseLabel: 'Free commercial and non-commercial use · Author’s terms',
  },
  {
    title: 'Eames Lounge Chair & Ottoman',
    author: 'alexshupp',
    source: 'https://sketchfab.com/3d-models/herman-miller-eames-lounge-chair-d8a999565942444d844afd39dbaf5425',
    note: 'Adapted with light oak, warm beige upholstery and polished aluminium, with geometry optimized for the interactive office.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    licenseLabel: 'Creative Commons Attribution 4.0',
  },
  {
    title: 'Noguchi Coffee Table',
    author: 'Flareworks Studio / Daniel Lee',
    source: 'https://www.blendkit.com/asset-gallery-detail/499820e7-b642-4756-9042-73604627b3f1/',
    note: 'Adapted with pale ash wood and lightweight transparent glass at the supplied reference dimensions.',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    licenseLabel: 'Creative Commons Zero',
  },
] as const;

// Source: src/pages/ai-workflow.astro
export const workflowSteps = [
  {
    title: 'Encounter capture',
    description: 'History, examination, imaging impressions, and patient goals are captured into a structured clinical frame.',
  },
  {
    title: 'Surgeon-reviewed draft',
    description: 'AI-assisted summaries produce drafts for notes, patient communication, and internal reasoning, then remain subject to review.',
  },
  {
    title: 'Registry structure',
    description: 'Clean fields flow into Notion databases for case indexing, outcomes, schedule metadata, and future analysis.',
  },
  {
    title: 'Knowledge synthesis',
    description: 'Clinical observations, literature notes, and teaching concepts are linked into a reusable knowledge base.',
  },
  {
    title: 'Research surface',
    description: 'Questions become audits, abstracts, talks, or publication pipelines when the underlying data remains structured.',
  },
] as const;

// Source: src/pages/ai-workflow.astro
export const stack = [
  {
    title: 'Voice capture',
    description: 'Fast first-pass input for consult details, procedure context, and post-encounter reflection.',
  },
  {
    title: 'LLM review layer',
    description: 'Structured drafting, checklist support, and second-pass synthesis without replacing physician judgment.',
  },
  {
    title: 'Notion databases',
    description: 'Case registry, publication, presentation, and schedule data used by the public website and dashboard.',
  },
  {
    title: 'Obsidian knowledge base',
    description: 'Linked notes for concepts, hypotheses, operative lessons, and reusable teaching language.',
  },
  {
    title: 'Automation scripts',
    description: 'Repeatable file flow, JSON sync, data cleanup, and publication-ready formatting.',
  },
  {
    title: 'Dashboard layer',
    description: 'Aggregated, de-identified data surfaces for internal review and public-facing summaries.',
  },
] as const;

// Source: src/pages/ube.astro
export const principles = [
  {
    title: 'Anchor-based orientation',
    description: 'Landmarks and decompression targets are used as repeatable anchors so difficult cases stay legible under endoscopy.',
    tags: ['Orientation'],
  },
  {
    title: 'Small portal, broad view',
    description: 'The value is not only a smaller incision. It is the ability to maintain a stable field with precise tissue handling.',
    tags: ['Technique'],
  },
  {
    title: 'Clear hemostasis strategy',
    description: 'Saline irrigation, radiofrequency control, and staged progression keep visualization reliable around neural structures.',
    tags: ['Safety'],
  },
  {
    title: 'Registry-aware practice',
    description: 'Case structure, outcomes, and complications are treated as part of the surgical system, not an afterthought.',
    tags: ['Outcomes'],
  },
] as const;

export const programs = [
  {
    title: 'International UBE Training Center',
    description: 'Live observation and hands-on training for 80+ surgeons from 15+ countries since 2024.',
    tags: ['International', 'UBE'],
  },
  {
    title: 'ESS Workshop for Beginners',
    description: 'Government-funded national project with Incheon Technopark and Hayan Co., Ltd. for Korean surgeons.',
    tags: ['Beginner', 'Korea'],
  },
  {
    title: 'Cadaver workshop',
    description: 'Anatomic precision, portal planning, and full-sequence procedural rehearsal in realistic conditions.',
    tags: ['Cadaver', 'Anatomy'],
  },
  {
    title: 'Live animal and dummy labs',
    description: 'Stepwise training for instrument handling, hemostasis strategy, and safe endoscopic workflow.',
    tags: ['Hands-on', 'Simulation'],
  },
] as const;

export const researchLanes = [
  {
    title: 'Endoscopic spine surgery',
    description: 'UBE technique, technical notes, learning curves, tumor applications, and practical surgical decision-making.',
    tags: ['UBE', 'MISS'],
  },
  {
    title: 'Clinical AI and imaging',
    description: 'Deep learning work around vertebral fracture detection, radiographic measurement, and clinical prediction.',
    tags: ['AI', 'Imaging'],
  },
  {
    title: 'Outcomes and pathways',
    description: 'ERAS implementation, national sample data, cost utility, and recovery-focused spine surgery research.',
    tags: ['Outcomes', 'Registry'],
  },
  {
    title: 'Spinal tumor care',
    description: 'Research and operative video work around primary spinal tumors, metastasis, and schwannoma surgery.',
    tags: ['Tumor', 'Neurosurgery'],
  },
] as const;
