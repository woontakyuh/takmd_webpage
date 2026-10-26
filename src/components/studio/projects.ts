import type { ProjectId } from './types';

export const projects = [
  {
    id: 'imaging', title: 'Imaging & evidence', eyebrow: 'Clinical AI / Research',
    summary: 'Research in spinal imaging, deep learning and clinically useful interpretation.',
    description: 'The publication record connects imaging methods with clinical questions. Explore the studies behind this work, from radiographs and classification to the practical evaluation of AI.',
    steps: ['Clinical question', 'Imaging methods', 'Evaluation & interpretation'],
    href: '/ai', linkLabel: 'Explore clinical AI',
  },
  {
    id: 'workflow', title: 'From practice to knowledge', eyebrow: 'Workflow / Educational example',
    summary: 'Capture, review, structure and reuse across clinical and research work.',
    description: 'An educational workflow built around physician review. Structured drafts become organized records, connected knowledge and research questions. This example runs outside direct EMR integration.',
    steps: ['Encounter capture', 'Surgeon-reviewed draft', 'Registry structure', 'Knowledge synthesis', 'Research surface'],
    href: '/ai-workflow', linkLabel: 'Explore the workflow',
  },
] as const;

export const workflowDetails = [
  'History, examination, imaging impressions and patient goals form the initial structured record.',
  'AI-assisted summaries remain drafts until reviewed by the surgeon.',
  'Consistent fields support case indexing, outcomes and later analysis.',
  'Clinical observations, literature and teaching concepts connect in a reusable knowledge base.',
  'Structured questions can become audits, abstracts, presentations and manuscripts.',
] as const;

export function projectById(id: ProjectId | null) {
  return projects.find(project => project.id === id) ?? null;
}
