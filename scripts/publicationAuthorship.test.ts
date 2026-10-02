import assert from 'node:assert/strict';
import { countPublicationRoles, publicationRoles, PUBLICATION_OWNER } from '../src/data/publicationAuthorship';

const dual = { firstAuthor: [PUBLICATION_OWNER], corresponding: ['Another author', PUBLICATION_OWNER], coAuthors: [] };
const corresponding = { firstAuthor: ['Another author'], corresponding: [PUBLICATION_OWNER], coAuthors: [] };
const coauthor = { firstAuthor: ['Another author'], corresponding: ['Another author'], coAuthors: [PUBLICATION_OWNER] };
const other = { firstAuthor: [], corresponding: [], coAuthors: [] };

assert.deepEqual(publicationRoles(dual), ['first', 'corresponding']);
assert.deepEqual(publicationRoles(corresponding), ['corresponding']);
assert.deepEqual(publicationRoles(other), ['other']);
assert.deepEqual(countPublicationRoles([dual, corresponding, coauthor, other]), {
  first: 1, corresponding: 2, coauthor: 1, other: 1,
});
assert.deepEqual(countPublicationRoles([]), { first: 0, corresponding: 0, coauthor: 0, other: 0 });
console.log('Authorship checks passed: dual roles, corresponding-only, coauthor, other and empty record.');
