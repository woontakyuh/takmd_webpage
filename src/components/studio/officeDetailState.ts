import { OFFICE_HOME } from './officeNavigation';
import type { OfficeView } from './officeNavigation';

export function viewAfterSceneInspection(view: OfficeView, previousId: string | null, nextId: string | null): OfficeView {
  return nextId !== null && nextId !== previousId ? OFFICE_HOME : view;
}
