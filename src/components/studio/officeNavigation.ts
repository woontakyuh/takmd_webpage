import type { ExhibitId } from './types';

export type OfficeView = {
  readonly focused: ExhibitId | null;
  readonly selected: ExhibitId | null;
  readonly details: string | null;
};
export const OFFICE_HOME: OfficeView = { focused: null, selected: null, details: null };
const EXHIBITS: readonly string[] = ['spine', 'research', 'education', 'ai', 'bjj', 'surfing', 'projects', 'family', 'award', 'award-photo', 'bookshelf', 'books'];
const isExhibit = (value: string | null): value is ExhibitId => value !== null && EXHIBITS.includes(value);

export function officeViewFromUrl(url: URL): OfficeView {
  const exhibit = url.searchParams.get('exhibit');
  return {
    focused: isExhibit(exhibit) ? exhibit : null,
    selected: isExhibit(exhibit) && url.searchParams.get('stage') !== 'approach' ? exhibit : null,
    details: url.searchParams.get('detail'),
  };
}

export function officePathView(path: string, current: OfficeView): OfficeView | null {
  const url = new URL(path, 'https://takmd.com');
  const route = url.pathname.replace(/\/$/, '') || '/';
  let selected: ExhibitId;
  switch (route) {
    case '/': return url.searchParams.has('exhibit') ? officeViewFromUrl(url) : OFFICE_HOME;
    case '/cv': if (url.hash === '#details') return { ...current, details: path }; selected = 'ai'; break;
    case '/research': if (url.hash === '#overview') return { ...current, details: path }; selected = 'research'; break;
    case '/education': if (url.hash === '#overview') return { ...current, details: path }; selected = 'education'; break;
    case '/ube': selected = 'spine'; break;
    case '/ai': if (url.hash) return { ...current, details: path }; selected = 'projects'; break;
    case '/jiu-jitsu': selected = 'bjj'; break;
    case '/surfing': selected = 'surfing'; break;
    default:
      if (/^\/(contact|credits|ai-workflow|dashboard|media|knowledge)(\/|$)/.test(route) || (route === '/workshops' || route.startsWith('/workshops/'))) {
        return { ...current, details: path };
      }
      return null;
  }
  return { focused: selected, selected, details: null };
}

export function officeViewUrl(href: string, view: OfficeView): string {
  const url = new URL(href);
  url.pathname = '/';
  url.hash = '';
  for (const key of ['exhibit', 'stage', 'detail']) url.searchParams.delete(key);
  if (view.focused) url.searchParams.set('exhibit', view.focused);
  if (view.focused && !view.selected) url.searchParams.set('stage', 'approach');
  if (view.details) url.searchParams.set('detail', view.details);
  return `${url.pathname}${url.search}`;
}

export function requestOfficePath(path: string): void {
  window.dispatchEvent(new CustomEvent('office:navigate', { detail: path }));
}
