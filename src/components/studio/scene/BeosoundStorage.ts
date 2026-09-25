import { z } from 'zod';
import { ALBUM_IDS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';

export const CD_STORAGE_KEY = 'takmd.cd-slots.v1';
export const DEFAULT_CD_SLOTS: readonly AlbumId[] = [1, 2, 3, 4, 5, 6];
const albumId = z.number().refine(value => ALBUM_IDS.some(id => id === value))
  .transform(value => ALBUM_IDS.find(id => id === value) ?? 1);
const placement = z.object({ version: z.literal(1), slots: z.array(albumId.nullable()).length(6) })
  .refine(value => { const ids = value.slots.filter(id => id !== null); return new Set(ids).size === ids.length; });
export function parseCdPlacement(raw: string | null): readonly (AlbumId | null)[] {
  if (!raw) return DEFAULT_CD_SLOTS;
  try {
    const result = placement.safeParse(JSON.parse(raw));
    return result.success ? result.data.slots : DEFAULT_CD_SLOTS;
  } catch (error) {
    if (error instanceof SyntaxError) return DEFAULT_CD_SLOTS;
    throw error;
  }
}
export function loadCdPlacement(): readonly (AlbumId | null)[] {
  try { return parseCdPlacement(window.localStorage.getItem(CD_STORAGE_KEY)); }
  catch (error) { if (error instanceof DOMException) return DEFAULT_CD_SLOTS; throw error; }
}
export function saveCdPlacement(slots: readonly (AlbumId | null)[]): boolean {
  try { window.localStorage.setItem(CD_STORAGE_KEY, JSON.stringify({ version: 1, slots })); return true; }
  catch (error) { if (error instanceof DOMException) return false; throw error; }
}
