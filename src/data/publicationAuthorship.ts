export const PUBLICATION_OWNER = '여운탁';

interface Authorship {
  firstAuthor: readonly string[];
  corresponding: readonly string[];
  coAuthors: readonly string[];
}

type AuthorRole = 'first' | 'corresponding' | 'coauthor' | 'other';

export function publicationRoles(publication: Authorship): AuthorRole[] {
  const roles: AuthorRole[] = [];
  if (publication.firstAuthor.includes(PUBLICATION_OWNER)) roles.push('first');
  if (publication.corresponding.includes(PUBLICATION_OWNER)) roles.push('corresponding');
  if (publication.coAuthors.includes(PUBLICATION_OWNER)) roles.push('coauthor');
  return roles.length ? roles : ['other'];
}

export function countPublicationRoles(publications: readonly Authorship[]) {
  const counts = { first: 0, corresponding: 0, coauthor: 0, other: 0 };
  for (const publication of publications) {
    for (const role of publicationRoles(publication)) counts[role] += 1;
  }
  return counts;
}
