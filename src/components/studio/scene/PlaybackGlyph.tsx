export function PlaybackGlyph({ playing = false }: { readonly playing?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {playing ? <><path d="M8 5v14" /><path d="M16 5v14" /></> : <path d="m9 5 10 7-10 7Z" />}
  </svg>;
}
