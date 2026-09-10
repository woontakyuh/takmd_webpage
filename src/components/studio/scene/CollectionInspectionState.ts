export type CollectionId = 'credentials' | 'awards';

export function inspectionBelongsToCollection(currentId: string | null, collectionId: CollectionId): boolean {
  return currentId === `collection-${collectionId}` || currentId?.startsWith(`${collectionId.slice(0, -1)}-`) === true;
}

export function nextCollectionInspection(
  currentId: string | null,
  collectionId: CollectionId,
  itemId: string,
): string {
  return inspectionBelongsToCollection(currentId, collectionId) ? itemId : `collection-${collectionId}`;
}
