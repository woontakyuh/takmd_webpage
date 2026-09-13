import type { CredentialSpec } from './CertificateFrames';
import type { CollectionItem } from './CollectionInspectionData';

const ART = '/models/personal-awards/additions/';
const landscape = { width: .321, height: .234, paperSize: [.297, .210] } as const;
const portrait = { width: .234, height: .321, paperSize: [.210, .297] } as const;

export const ADDITIONAL_DOCUMENTS = [
  {
    frame: { id: 'neurospine-reviewer-2025', name: 'Neurospine outstanding reviewer certificate', texture: `${ART}neurospine-reviewer-2025.webp`, ...landscape, position: [-2.18, 2.4, 3.12] },
    item: { id: 'honor-neurospine', collection: 'honors', label: 'Outstanding Reviewer Award', title: 'Neurospine', date: 'September 4, 2025', description: 'Recognized for expertise, diligence and integrity in peer review, and for contributions to the journal’s scientific quality.', center: [-2.18, 2.515, 3.12], copy: 'right' },
  },
  {
    frame: { id: 'kosess-academic-2025', name: 'KOSESS 2025 academic award certificate', texture: `${ART}kosess-academic-2025.webp`, ...portrait, position: [-1.83, 2.4, 3.12] },
    item: { id: 'honor-kosess', collection: 'honors', label: 'Best paper award', title: 'KOSESS Annual Meeting 2025', date: 'August 23, 2025', description: 'Awarded for “Residual Stenosis Even After Optimal UBE Lumbar ULBD Surgery: The Role of Lamina–Ventral Distance (LVD) and Ventral Epidural Fat.”', center: [-1.83, 2.557, 3.12], copy: 'upper-right', copyAvoid: 'honor-neurospine' },
  },
  {
    frame: { id: 'wcmisst-speaker-2026', name: 'WCMISST 2026 invited speaker certificate', texture: `${ART}wcmisst-speaker-2026.webp`, ...landscape, position: [1.67, 2.26, 3.12] },
    item: { id: 'certificate-wcmisst', collection: 'certificates', label: 'Invited speaker', title: '8th World Congress of Minimally Invasive Spine Surgery and Techniques', date: 'May 7–9, 2026', description: 'Presented in recognition of contributions as an invited speaker at WCMISST 2026.', center: [1.67, 2.375, 3.12], copy: 'right' },
  },
  {
    frame: { id: 'tsess-instructor-2026', name: 'TSESS 2026 workshop instructor certificate', texture: `${ART}tsess-instructor-2026.webp`, ...landscape, position: [2.08, 2.26, 3.12] },
    item: { id: 'certificate-tsess', collection: 'certificates', label: 'Workshop instructor', title: 'Taiwan Society of Endoscopic Spine Surgery', date: 'June 9, 2026', description: 'Recognized as an instructor for the 2026 TSESS Simulative Surgery Workshop, Advanced Courses.', center: [2.08, 2.375, 3.12], copy: 'left' },
  },
] as const satisfies readonly { readonly frame: CredentialSpec; readonly item: CollectionItem }[];

export const SNU_MASTERS_ITEM = {
  id: 'honor-snu-masters', collection: 'honors', label: 'Master’s degree commemorative plaque',
  title: 'Seoul National University', date: 'February 26, 2018',
  description: 'Presented by the Seoul National University Graduate School Alumni Association to mark the completion of a master’s degree in medicine.',
  center: [-1.515, 2.54, 3.12], copy: 'left',
} as const satisfies CollectionItem;
