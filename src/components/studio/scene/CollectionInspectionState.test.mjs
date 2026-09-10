import { describe, expect, it } from 'bun:test';
import { nextCollectionInspection } from './CollectionInspectionState.ts';

describe('nextCollectionInspection', () => {
  it('Given the room, when a credential is clicked, then its collection opens', () => {
    expect(nextCollectionInspection(null, 'credentials', 'credential-ksns')).toBe('collection-credentials');
  });

  it('Given a settled collection, when a member is clicked, then its detail opens', () => {
    expect(nextCollectionInspection('collection-credentials', 'credentials', 'credential-ksns')).toBe('credential-ksns');
  });

  it('Given an item detail, when a sibling is clicked, then the sibling replaces it', () => {
    expect(nextCollectionInspection('award-hallym', 'awards', 'award-snuh')).toBe('award-snuh');
  });

  it('Given another collection, when an item is clicked, then the new collection opens first', () => {
    expect(nextCollectionInspection('award-hallym', 'credentials', 'credential-snu')).toBe('collection-credentials');
  });
});
