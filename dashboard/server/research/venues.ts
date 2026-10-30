// Venues and topics for researcher finding (plan v2 §6.1).
// DBLP answers automated requests with a bot check (2026-09-30), and OpenAlex often has no venue "source" for
// conference papers, so a paper's venue is recognised from its DOI (IEEE DOIs carry the acronym, e.g.
// 10.1109/ISSCC49661.2025…) and from the names of all its locations ("Proceedings of the 52nd Annual International
// Symposium on Computer Architecture").

export interface Venue {
  key: string;
  /** 1 = the plan's core venues; the extras (The owner, 2026-09-30) count a bit less. */
  weight: number;
  names: RegExp;
  /** Names that contain the pattern but are other venues (ASP-DAC, A-SSCC, ESSCIRC, …). */
  not?: RegExp;
  doi?: RegExp;
}

export const VENUES: Venue[] = [
  { key: 'ISCA', weight: 1, names: /international symposium on computer architecture|\(isca\)/i, doi: /^10\.1109\/isca\d/i },
  { key: 'MICRO', weight: 1, names: /symposium on microarchitecture|\(micro\)/i, doi: /^10\.1109\/micro\d/i },
  { key: 'HPCA', weight: 1, names: /high[- ]performance computer architecture|\(hpca\)/i, doi: /^10\.1109\/hpca\d/i },
  { key: 'ASPLOS', weight: 1, names: /architectural support for programming languages and operating systems|\basplos\b/i },
  { key: 'DAC', weight: 1, names: /design automation conference|\(dac\)/i, not: /asia and south pacific|asp-dac|aspdac/i, doi: /^10\.1109\/dac\d/i },
  { key: 'DATE', weight: 1, names: /design,? automation (?:and|&) test in europe|\(date\)/i, doi: /^10\.23919\/date\d/i },
  { key: 'ISSCC', weight: 1, names: /international solid[- ]state circuits conference|\(isscc\)/i, not: /asian|a-sscc|european|esscirc/i, doi: /^10\.1109\/isscc\d/i },
  { key: 'IEDM', weight: 1, names: /electron devices meeting|\(iedm\)/i, doi: /^10\.1109\/iedm\d/i },
  { key: 'ICCAD', weight: 0.6, names: /international conference on computer[- ]aided design|\(iccad\)/i, doi: /^10\.1109\/iccad\d/i },
  { key: 'VLSI', weight: 0.6, names: /symposium on vlsi (?:technology|circuits)|vlsi technology and circuits/i, doi: /^10\.23919\/vlsi|^10\.1109\/vlsi(?:technologyandcir|circuits|technology)/i },
  { key: 'JSSC', weight: 0.6, names: /journal of solid[- ]state circuits/i, doi: /^10\.1109\/jssc\./i },
  { key: 'IEEE Micro', weight: 0.6, names: /^ieee micro$/i, doi: /^10\.1109\/mm\./i },
  { key: 'TCAD', weight: 0.6, names: /transactions on computer-aided design of integrated circuits/i, doi: /^10\.1109\/tcad\./i },
];

export const DEFAULT_VENUES = VENUES.map((v) => v.key);

export function venueList(keys: string[] | undefined): Venue[] {
  if (!keys?.length || keys.includes('all')) return VENUES;
  const want = new Set(keys.map((k) => k.trim().toLowerCase()));
  const out = VENUES.filter((v) => want.has(v.key.toLowerCase()));
  const unknown = [...want].filter((k) => !VENUES.some((v) => v.key.toLowerCase() === k));
  if (unknown.length) throw new Error(`Unknown venue(s): ${unknown.join(', ')} (known: ${DEFAULT_VENUES.join(', ')})`);
  return out;
}

export interface WorkLike {
  doi?: string | null;
  locations?: { source?: { display_name?: string | null } | null; raw_source_name?: string | null }[] | null;
}

/** The (highest-weight) venue a work appeared at, or null. */
export function detectVenue(w: WorkLike, venues: Venue[] = VENUES): Venue | null {
  const doi = String(w.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
  const names = (w.locations || []).flatMap((l) => [l.source?.display_name, l.raw_source_name]).filter((n): n is string => Boolean(n));
  let best: Venue | null = null;
  for (const v of venues) {
    const hit = (v.doi && v.doi.test(doi)) || names.some((n) => v.names.test(n) && !(v.not && v.not.test(n)));
    if (hit && (!best || v.weight > best.weight)) best = v;
  }
  return best;
}

// ---------- topics: how close a paper is to the owner's work (profile/master_profile.md) ----------
export interface Topic { key: string; weight: number; re: RegExp }

export const TOPICS: Topic[] = [
  { key: 'PIM/CIM', weight: 3, re: /processing[- ](?:in|near|using)[- ]memory|in[- ]memory comput|compute[- ]in[- ]memory|computing[- ]in[- ]memory|\bp[iu]m\b|\bcim\b|\bimc\b|near[- ](?:memory|data)|in[- ](?:dram|sram|flash)|memristi|\br(?:e)?ram\b|crossbar|analog (?:ai|in-memory|compute|computing)|accelerator[- ]in[- ]memory/i },
  { key: 'Reliability/ECC', weight: 3, re: /error[- ]correct|\becc\b|reliab|fault[- ]toleran|fault injection|soft error|resilien|bit[- ]flip|silent data corruption|\bras\b|\bsdc\b/i },
  { key: 'Memory systems', weight: 2, re: /\bhbm\d?\b|\bdram\b|\bsram\b|memory system|memory controller|memory hierarch|\bcxl\b|lpddr|\bddr\d\b|main memory|memory bandwidth|memory wall|3d[- ]stack/i },
  { key: 'Compilers/MLIR', weight: 2, re: /\bmlir\b|compiler|operator scheduling|tensor program|code generation|\btvm\b|dataflow mapping|mapping space/i },
  { key: 'AI accelerators', weight: 1.5, re: /accelerat|neural network|\bdnns?\b|deep learning|transformer|\bllms?\b|inference|systolic|\bnpu\b|\btpu\b|quantiz|sparsity/i },
  { key: 'Logic/EDA', weight: 1, re: /logic synthesis|boolean|high[- ]level synthesis|formal verification|design space exploration|timeloop|accelergy|ramulator/i },
];

export function paperTopics(text: string): string[] {
  return TOPICS.filter((t) => t.re.test(text)).map((t) => t.key);
}

export function topicScore(keys: string[]): number {
  return TOPICS.filter((t) => keys.includes(t.key)).reduce((s, t) => s + t.weight, 0);
}
