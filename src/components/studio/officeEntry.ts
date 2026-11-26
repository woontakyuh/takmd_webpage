import { ACADEMIC_OFFICE } from './scene/roomEdition';
import type { CameraPose } from './scene/config';

export type OfficeEntryPhase = 'seated' | 'peeking' | 'reading' | 'revealing' | 'complete' | 'capture';

export const DESKTOP_ENTRY: CameraPose = {
  position: [-0.05, 1.187, ACADEMIC_OFFICE ? -2.264 : -2.014], target: [-0.05, 1.155, ACADEMIC_OFFICE ? -1.464 : -1.214], zoom: 1,
};
export const MOBILE_ENTRY: CameraPose = {
  position: [-0.05, 1.25, ACADEMIC_OFFICE ? -2.93 : -2.68], target: [-0.05, 1.13, ACADEMIC_OFFICE ? -1.15 : -0.9], zoom: 1,
};

export function officeEntryPhase(url: URL): OfficeEntryPhase {
  if (url.searchParams.get('office-capture') === 'seated') return 'capture';
  if (ACADEMIC_OFFICE) return 'complete';
  return url.pathname === '/' && !url.searchParams.has('exhibit') && !url.searchParams.has('office-capture') && !url.hash
    ? 'seated' : 'complete';
}

export function officeInitialView(url: URL): 0 | 1 {
  return ACADEMIC_OFFICE && url.pathname === '/' && !url.searchParams.has('exhibit')
    && !url.searchParams.has('office-capture') && !url.hash ? 1 : 0;
}
