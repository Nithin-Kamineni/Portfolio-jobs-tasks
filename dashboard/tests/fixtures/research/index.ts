// Recorded research responses for tests. The cache is the seam: tests put these responses into
// data/research-cache/ and run offline (JOBWATCHER_RESEARCH_OFFLINE=1, set in tests/setup.ts), so nothing hits the network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResearchHttp } from '../../../server/research/http';
import { s2Url, worksUrl } from '../../../server/research/openalex';
import { makePdf } from './makePdf';

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const NVIDIA_US = 'I4210127875';
export const AMD_US = 'I4210137977';
export const SINCE = 2024;

/** Recorded from api.openalex.org (2026-09-30): NVIDIA + AMD hardware papers since 2024, trimmed. */
export const WORKS = JSON.parse(fs.readFileSync(path.join(DIR, 'openalex_works_nvidia_amd.json'), 'utf8'));

/** A map like targets/openalex_institutions.json for the test companies (tests/helpers.ts COMPANIES_CSV). */
export const TEST_MAP = {
  _about: 'test map',
  NVIDIA: { ids: [NVIDIA_US] },
  Etched: { raw: ['Etched'] },
};

/** A startup paper found by affiliation text only (fictional people; the shape is OpenAlex's). */
export const ETCHED_WORKS = {
  meta: { count: 1, next_cursor: null },
  results: [{
    id: 'https://openalex.org/W9000000001', doi: 'https://doi.org/10.1109/isca99999.2025.00077',
    title: 'Sparse Transformer Inference with Near-Memory Processing on HBM', publication_year: 2025, publication_date: '2025-06-21',
    locations: [{ source: null, raw_source_name: '2025 ACM/IEEE 52nd Annual International Symposium on Computer Architecture (ISCA)', pdf_url: null }],
    best_oa_location: null,
    authorships: [
      { author_position: 'first', author: { id: 'https://openalex.org/A9000000001', display_name: 'Pat Example' }, institutions: [], raw_affiliation_strings: ['Etched, San Jose, CA, USA'], countries: ['US'] },
      { author_position: 'middle', author: { id: 'https://openalex.org/A9000000002', display_name: 'Uni Person' }, institutions: [{ id: 'https://openalex.org/I1', display_name: 'Example University', country_code: 'US' }], raw_affiliation_strings: ['Example University'], countries: ['US'] },
      { author_position: 'last', author: { id: 'https://openalex.org/A9000000003', display_name: 'Robin Sample' }, institutions: [], raw_affiliation_strings: ['Etched AI'], countries: [] },
    ],
    primary_topic: { display_name: 'Advanced Memory and Neural Computing' }, keywords: [{ display_name: 'Processing-in-memory' }],
  }],
};

export const ETCHED_DOI = '10.1109/isca99999.2025.00077';
export const ETCHED_PDF = 'https://arxiv.example/pdf/2501.00001';
/** The shape Semantic Scholar answers with (recorded 2026-09-30), pointing at the fictional paper's PDF. */
export const S2_ANSWER = { paperId: 'x', externalIds: { DOI: ETCHED_DOI, ArXiv: '2501.00001' }, openAccessPdf: { url: ETCHED_PDF, status: 'GREEN' } };

/** The fictional paper's first page: names, affiliation, the grouped e-mail form. */
export const ETCHED_PAPER = makePdf([[
  'Sparse Transformer Inference with Near-Memory Processing on HBM',
  'Pat Example, Uni Person, Robin Sample',
  'Etched, San Jose, CA; Example University',
  '{pat, robin}@etched.example   uni.person@university.example',
  'Abstract',
  'We present a near-memory design.',
]]);

/** Loads the recorded responses into <dataDir>/research-cache. */
export function primeResearchCache(dataDir: string, o: { s2?: boolean; pdf?: boolean } = {}): ResearchHttp {
  // The fixed test year, and the default search window (current year - 2) used by routes that don't pass one.
  const years = [...new Set([SINCE, new Date().getFullYear() - 2])];
  const http = new ResearchHttp({ cacheDir: path.join(dataDir, 'research-cache'), offline: true });
  const key = process.env.OPENALEX_API_KEY;
  delete process.env.OPENALEX_API_KEY;
  try {
    for (const y of years) {
      http.put(worksUrl({ ids: [NVIDIA_US] }, y), 200, 'application/json', JSON.stringify(WORKS));
      http.put(worksUrl({ raw: 'Etched' }, y), 200, 'application/json', JSON.stringify(ETCHED_WORKS));
    }
    if (o.s2 !== false) http.put(s2Url(ETCHED_DOI), 200, 'application/json', JSON.stringify(S2_ANSWER));
    if (o.pdf !== false) http.put(ETCHED_PDF, 200, 'application/pdf', ETCHED_PAPER);
  } finally { if (key) process.env.OPENALEX_API_KEY = key; }
  return http;
}

export function writeTestMap(root: string, map: object = TEST_MAP): void {
  fs.mkdirSync(path.join(root, 'targets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'targets', 'openalex_institutions.json'), JSON.stringify(map));
}
