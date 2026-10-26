import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Which guided view the visitor entered from the tabs, if any. Objects that belong to that view open on the first
// touch instead of approaching first: the visitor is already standing in front of them.
export type GuidedSection = 'research' | 1 | 2 | 3 | 4 | null;

const GuidedViewContext = createContext<GuidedSection>(null);

export function GuidedViewProvider({ section, children }: { readonly section: GuidedSection; readonly children: ReactNode }) {
  return <GuidedViewContext.Provider value={section}>{children}</GuidedViewContext.Provider>;
}

export const useGuidedView = () => useContext(GuidedViewContext);
