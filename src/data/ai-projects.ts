export type AiProject = {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly href: string;
  readonly linkLabel: string;
};

export const aiProjects: readonly AiProject[] = [
  {
    id: 'workflow',
    title: 'AI workflow study',
    eyebrow: 'Educational workflow',
    description: 'A documented, surgeon-reviewed workflow for moving structured drafts from capture to research. It is explicitly external to direct EMR integration.',
    href: '/ai-workflow',
    linkLabel: 'Read the workflow',
  },
  {
    id: 'spinoscopy',
    title: 'K-Spinoscopy dashboard',
    eyebrow: 'Clinical AI side project',
    description: 'A real dashboard project for the K-Spinoscopy work. Its public project note is under development.',
    href: '/ai#spinoscopy',
    linkLabel: 'Read the project note',
  },
] as const;

const AI_SIGNAL = /\b(?:artificial intelligence|deep learning|machine learning|foundation models?|CNN|LLM|Claude|ChatGPT|AI)\b|인공지능/i;

export function hasAiSignal(value: string): boolean {
  return AI_SIGNAL.test(value);
}
