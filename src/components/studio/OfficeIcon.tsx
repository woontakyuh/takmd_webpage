type IconName = 'overview' | 'clock' | 'sun' | 'moon' | 'spine' | 'research' | 'education' | 'ai' | 'bjj' | 'surfing' | 'expand' | 'collapse' | 'close' | 'rotateLeft' | 'rotateRight';

const paths: Record<IconName, string> = {
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2',
  overview: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8',
  sun: 'M12 3V1m0 22v-2M3 12H1m22 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4m0-12.8 1.4-1.4M4.2 19.8l1.4-1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  moon: 'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',
  spine: 'M12 2c-4 4 4 7 0 11s-3 6 0 9M8 5h8M8 9h8M8 13h8M7 17h10M8 21h8',
  research: 'M12 5v16M3 3h5c2 0 4 1 4 2 0-1 2-2 4-2h5v16h-5c-2 0-4 1-4 2 0-1-2-2-4-2H3Z',
  education: 'M3 3h18v13H3Zm9 13v5m-4 0h8M7 11l3-3 3 2 4-4',
  ai: 'M5 5h14v14H5ZM9 9h6v6H9ZM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4',
  bjj: 'm8 3-5 4 2 5 3-2v11h8V10l3 2 2-5-5-4-4 6-4-6Zm0 12h8m-4 0-3 6m3-6 3 6',
  surfing: 'M12 2c-4 3-6 8-5 14 1 3 3 5 5 6 2-1 4-3 5-6 1-6-1-11-5-14Zm0 0v16m-7 0h14',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  collapse: 'M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5',
  close: 'm6 6 12 12M6 18 18 6',
  rotateLeft: 'M3 9h6M3 9V3m0 6a9 9 0 1 1-.4 6',
  rotateRight: 'M21 9h-6m6 0V3m0 6a9 9 0 1 0 .4 6',
};

export function OfficeIcon({ name }: { readonly name: IconName }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
