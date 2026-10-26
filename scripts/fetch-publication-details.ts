import { writeFile } from 'node:fs/promises';
import publicationsData from '../src/data/publications.json';
import mediaData from '../src/data/studio-paper-media.json';

type CoreRecord = {
  pmid?: string;
  authorString?: string;
  abstractText?: string;
  volume?: string;
  issue?: string;
  pageInfo?: string;
  journalTitle?: string;
};
type CrossrefRecord = {
  readonly author: readonly { readonly given?: string; readonly family?: string }[];
  readonly abstract?: string;
  readonly volume?: string;
  readonly issue?: string;
  readonly page?: string;
  readonly containerTitle?: string;
};

const normalizeDoi = (value: string) => value.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
const stripMarkup = (value: string) => value.replace(/<\/?[A-Za-z][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const stringField = (record: Record<string, unknown>, key: string) => typeof record[key] === 'string' ? record[key] : undefined;
const parseCoreRecord = (payload: unknown): CoreRecord | null => {
  if (!isRecord(payload) || !isRecord(payload.resultList) || !Array.isArray(payload.resultList.result)) return null;
  const first = payload.resultList.result[0];
  if (!isRecord(first)) return null;
  return {
    pmid: stringField(first, 'pmid'),
    authorString: stringField(first, 'authorString'),
    abstractText: stringField(first, 'abstractText'),
    volume: stringField(first, 'volume'),
    issue: stringField(first, 'issue'),
    pageInfo: stringField(first, 'pageInfo'),
    journalTitle: stringField(first, 'journalTitle'),
  };
};
const parseCrossrefRecord = (payload: unknown): CrossrefRecord => {
  if (!isRecord(payload) || !isRecord(payload.message)) throw new Error('Crossref response has no message object');
  const message = payload.message;
  const author = Array.isArray(message.author) ? message.author.flatMap(value => isRecord(value) ? [{ given: stringField(value, 'given'), family: stringField(value, 'family') }] : []) : [];
  const containerTitle = Array.isArray(message['container-title']) && typeof message['container-title'][0] === 'string' ? message['container-title'][0] : undefined;
  return { author, abstract: stringField(message, 'abstract'), volume: stringField(message, 'volume'), issue: stringField(message, 'issue'), page: stringField(message, 'page'), containerTitle };
};
const localAbstracts: Readonly<Record<string, string>> = {
  '10.56718/ijp.22-003': 'Since the first use of arthroscopy for lumbar spinal surgery in 1990, endoscopic lumbar spinal surgery has evolved both technically and instrumentally. Transforaminal endoscopic lumbar discectomy (TELD) was the first and remains the most commonly used method. This study aimed to review evidence of TELD in systematic reviews and randomized controlled trials (RCTs). This narrative review included systematic reviews and RCTs that compared TELD with open discectomy (OD), microdiscectomy (MD), or tubular retractor-assisted microendoscopic discectomy (MED). PubMed was searched using the following keywords: for RCTs, ((((lumbar) AND (spine)) AND (endoscope)) AND (randomized[Title])) AND (trial[Title])); and for systematic reviews, ((((lumbar) AND (spine)) AND (endoscope)) AND (systematic[Title/Abstract]))). Two spine surgeons ultimately included 6 RCTs and 4 systematic reviews in the study. The current study reviewed the clinical outcomes, complications, recurrence, and length of hospital stay of the included studies. There were no significant differences in clinical outcomes, complications, or recurrence rates between TELD and OD, MD, or MED. However, the length of hospitalization was lower and intraoperative bleeding was lower after TELD than after MD. The quality of the evidence was moderate. The clinical outcomes of TELD and OD, MD, and MED seemed similar with a moderate quality of evidence.',
};
const publicPdfOverrides = new Set(['10.56718/ijp.22-003', '10.14444/8163']);
const stablePdfFallbacks: Readonly<Record<string, string>> = {
  '10.13004/kjnt.2025.21.e35': 'https://europepmc.org/articles/PMC12599439?pdf=render',
  '10.2196/20992': 'https://europepmc.org/articles/PMC7470182?pdf=render',
};

async function europePmc(doi: string): Promise<CoreRecord | null> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(doi)}&format=json&resultType=core`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Europe PMC ${response.status} for ${doi}`);
  const payload: unknown = await response.json();
  return parseCoreRecord(payload);
}

async function crossref(doi: string): Promise<CrossrefRecord> {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Crossref ${response.status} for ${doi}`);
  const payload: unknown = await response.json();
  return parseCrossrefRecord(payload);
}

const records = Object.fromEntries(await Promise.all(publicationsData.publications.map(async publication => {
  const doi = normalizeDoi(publication.doi);
  const media = mediaData.find(item => normalizeDoi(item.doiUrl) === doi);
  const epmc = await europePmc(doi);
  const cr = epmc ? null : await crossref(doi);
  const authors = epmc?.authorString
    ? epmc.authorString.replace(/\.$/, '').split(', ')
    : cr?.author?.map(author => [author.given, author.family].filter(Boolean).join(' ')) ?? [];
  const isPublicPdf = Boolean(media && (media.license.startsWith('CC ') || publicPdfOverrides.has(doi)));
  const abstract = epmc?.abstractText ?? cr?.abstract ?? localAbstracts[doi] ?? null;
  const abstractSource = epmc?.abstractText ? 'Europe PMC' : cr?.abstract ? 'Crossref' : localAbstracts[doi] ? 'Original author PDF' : null;
  const citationParts = [epmc?.journalTitle ?? cr?.containerTitle ?? publication.journal, epmc?.volume ?? cr?.volume, epmc?.issue ?? cr?.issue ? `(${epmc?.issue ?? cr?.issue})` : null, epmc?.pageInfo ?? cr?.page].filter(Boolean);

  return [doi, {
    doi,
    title: publication.title,
    authors,
    citation: citationParts.join(' '),
    publicationDate: publication.date,
    pmid: epmc?.pmid ?? null,
    abstract: abstract ? stripMarkup(abstract) : null,
    abstractSource,
    metadataSource: epmc ? 'Europe PMC' : 'Crossref',
    access: isPublicPdf && media ? { kind: 'public-pdf', oaStatus: media.license.startsWith('CC ') ? 'confirmed-oa' : 'free-public-pdf', url: stablePdfFallbacks[doi] ?? media.sourceUrl } : { kind: 'request-copy', oaStatus: 'restricted-or-unknown' },
  }];
})));

await writeFile(new URL('../src/data/publication-details.json', import.meta.url), `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${Object.keys(records).length} DOI-keyed publication detail records.`);
