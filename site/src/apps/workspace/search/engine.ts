// The workspace search engine, all in the browser. It builds a word index over documents, papers,
// interview prep (tracks, modules, items), flashcards, quiz questions, interview questions, coding
// problems and deadlines, and answers a query in a few milliseconds.
//
// Matching is forgiving on purpose, so a thing that exists is found:
// - every query word must match (AND), as a whole word, a word start, inside a word ("verilog" finds
//   "SystemVerilog"), a simple word form (cache/caches/caching) or with a typo (1 edit, 2 for long words);
// - the words may also be written together or apart ("system verilog" ↔ "systemverilog");
// - if nothing has all the words, the closest results (most words matched) are shown and labelled.
// Ranking: title hits beat body hits, exact beats prefix beats inside-a-word beats typo, and the whole
// query as a phrase gets a bonus.

export type Area = 'docs' | 'papers' | 'prep' | 'cards' | 'quiz' | 'questions' | 'coding' | 'today';
export const AREA_LABEL: Record<Area, string> = {
  docs: 'Documents', papers: 'Reading list', prep: 'Interview prep', cards: 'Flashcards', quiz: 'Quiz', questions: 'Questions', coding: 'Coding', today: 'Deadlines',
};
export interface Target { path: string; at?: string; open?: boolean; kind?: 'dsa' | 'hdl' }
export interface Field { name: string; text: string; weight: number }
export interface Rec { key: string; area: Area; title: string; crumbs: string[]; fields: Field[]; go: Target }
export interface Hit { rec: Rec; score: number; words: string[]; field: string; snippet: string; matched: number }
export interface Result { hits: Hit[]; partial: boolean; tokens: string[] }

export const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
const stem = (w: string) => (w.length > 4 ? w.replace(/(ies|es|s|ing|ed|ly|er)$/, '') : w);
const MAX_SNIPPET = 160;

/** Edit distance with swapped neighbours counting as one edit; stops early above max. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [], prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}

export class Index {
  private recs: Rec[] = [];
  private normFields: string[][] = [];         // rec → field → normalized text
  private squashed: string[][] = [];           // the same without spaces
  private postings = new Map<string, number[]>(); // word → [rec * 64 + field, …]
  private vocab: string[] = [];
  private tokenCache = new Map<string, Map<string, number>>();

  constructor(recs: Rec[]) {
    this.recs = recs;
    recs.forEach((r, ri) => {
      const nf: string[] = [], sq: string[] = [];
      r.fields.forEach((f, fi) => {
        const n = norm(f.text);
        nf.push(n); sq.push(n.replace(/ /g, ''));
        for (const w of new Set(n.split(' '))) {
          if (!w) continue;
          let p = this.postings.get(w);
          if (!p) { p = []; this.postings.set(w, p); }
          p.push(ri * 64 + fi);
        }
      });
      this.normFields.push(nf); this.squashed.push(sq);
    });
    this.vocab = [...this.postings.keys()];
  }
  get size() { return this.recs.length; }

  /** Words of the index matching one query word, with a quality between 0 and 1. */
  private expand(t: string) {
    const hit = this.tokenCache.get(t);
    if (hit) return hit;
    const out = new Map<string, number>();
    const st = stem(t), typos = t.length >= 8 ? 2 : t.length >= 4 ? 1 : 0;
    for (const w of this.vocab) {
      let q = 0;
      if (w === t) q = 1;
      else if (w.startsWith(t)) q = t.length >= 2 ? 0.8 : 0.5;
      else if (st.length >= 3 && stem(w) === st) q = 0.9;
      else if (t.length >= 3 && w.includes(t)) q = 0.55;
      else if (typos && w.length >= 3 && editDistance(t, w, typos) <= typos) q = 0.4;
      if (q) out.set(w, q);
    }
    if (this.tokenCache.size > 300) this.tokenCache.clear();
    this.tokenCache.set(t, out);
    return out;
  }

  search(query: string, limit = 400): Result {
    const tokens = [...new Set(norm(query).split(' ').filter(Boolean))];
    if (!tokens.length) return { hits: [], partial: false, tokens };
    const phrase = tokens.join(' '), squashedQ = tokens.join('');
    // per record: per token, its best weighted quality and the words that matched
    const per = new Map<number, { score: number[]; words: Set<string>; fieldScore: Map<number, number> }>();
    tokens.forEach((t, ti) => {
      for (const [w, q] of this.expand(t)) {
        for (const p of this.postings.get(w)!) {
          const ri = Math.floor(p / 64), fi = p % 64;
          let e = per.get(ri);
          if (!e) { e = { score: new Array(tokens.length).fill(0), words: new Set(), fieldScore: new Map() }; per.set(ri, e); }
          const s = q * this.recs[ri].fields[fi].weight;
          if (s > e.score[ti]) e.score[ti] = s;
          e.words.add(w);
          e.fieldScore.set(fi, (e.fieldScore.get(fi) ?? 0) + s);
        }
      }
    });
    // Words written together in the text but apart in the query (or the other way round).
    if (tokens.length > 1 || squashedQ.length >= 6) {
      this.squashed.forEach((fields, ri) => fields.forEach((sq, fi) => {
        if (sq.includes(squashedQ)) {
          let e = per.get(ri);
          if (!e) { e = { score: new Array(tokens.length).fill(0), words: new Set(), fieldScore: new Map() }; per.set(ri, e); }
          const s = 0.7 * this.recs[ri].fields[fi].weight;
          e.score = e.score.map((x) => Math.max(x, s));
          e.fieldScore.set(fi, (e.fieldScore.get(fi) ?? 0) + s);
        }
      }));
    }
    const hits: Hit[] = [];
    let best = 0;
    for (const [ri, e] of per) {
      const matched = e.score.filter((x) => x > 0).length;
      best = Math.max(best, matched);
      let score = e.score.reduce((a, b) => a + b, 0);
      this.normFields[ri].forEach((n, fi) => {
        if (tokens.length > 1 && n.includes(phrase)) score += 2 * this.recs[ri].fields[fi].weight;
        if (fi === 0 && n.startsWith(tokens[0])) score += 0.5;
      });
      hits.push({ rec: this.recs[ri], score, words: [...e.words], field: '', snippet: '', matched });
      (hits[hits.length - 1] as Hit & { fs?: Map<number, number> }).fs = e.fieldScore;
    }
    // All words, or (when nothing has them all) the closest ones.
    const need = best === tokens.length ? tokens.length : Math.max(1, best);
    const kept = hits.filter((h) => h.matched >= need).sort((a, b) => b.score - a.score).slice(0, limit);
    for (const h of kept) {
      const fs = (h as Hit & { fs?: Map<number, number> }).fs!;
      // The snippet comes from the best-matching field other than the title (if any matched).
      const body = [...fs].filter(([fi]) => fi > 0).sort((a, b) => b[1] - a[1])[0];
      const f = h.rec.fields[body ? body[0] : 0];
      h.field = f.name;
      h.snippet = body ? snippet(f.text, h.words) : '';
    }
    return { hits: kept, partial: best < tokens.length, tokens };
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A regex finding any of the matched words in original (not normalized) text. */
export function wordsRe(words: string[]) {
  const list = [...new Set(words)].filter((w) => w.length > 1).sort((a, b) => b.length - a.length).slice(0, 30);
  return list.length ? new RegExp(list.map(escapeRe).join('|'), 'gi') : null;
}
function snippet(text: string, words: string[]) {
  const clean = text.replace(/[#*_`>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const re = wordsRe(words);
  const m = re ? re.exec(clean) : null;
  const at = m ? m.index : 0;
  const start = Math.max(0, at - 50);
  let s = clean.slice(start, start + MAX_SNIPPET);
  if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
  if (start + MAX_SNIPPET < clean.length) s = s.replace(/\s\S*$/, '') + '…';
  return s;
}
