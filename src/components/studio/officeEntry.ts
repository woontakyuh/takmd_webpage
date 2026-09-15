import type { CameraPose } from './scene/config';

export type OfficeEntryPhase = 'seated' | 'revealing' | 'complete' | 'capture';

export const DESKTOP_ENTRY: CameraPose = {
  position: [-0.05, 1.187, -2.014], target: [-0.05, 1.155, -1.214], zoom: 1,
};
export const MOBILE_ENTRY: CameraPose = {
  position: [-0.05, 1.25, -2.68], target: [-0.05, 1.13, -0.9], zoom: 1,
};

export function officeEntryPhase(url: URL): OfficeEntryPhase {
  if (url.searchParams.get('office-capture') === 'seated') return 'capture';
  return url.pathname === '/' && !url.searchParams.has('exhibit') && !url.searchParams.has('office-capture') && !url.hash
    ? 'seated' : 'complete';
}
