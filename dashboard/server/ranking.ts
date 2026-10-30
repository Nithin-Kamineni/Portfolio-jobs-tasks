// Cheap and accurate ranking (plan v2 §3.8): code settles the clear cases (rules), a light model quick-ranks compact
// cards, and Opus re-checks only the promising jobs. This file holds the code parts.
import fs from 'node:fs';
import path from 'node:path';
import type { Ctx } from './sync';
import { DASHBOARD_DIR } from './config';
import { getJob, listJobs, nowIso, rankJob, setDescription, setStatus } from './repo';
import { stripHtml } from '../../watcher/lib/util.js';
import { makeScorer } from '../../watcher/lib/scoring.js';
import type { Job } from '../shared/types';
import { fetchDescription as realFetch } from '../../watcher/lib/describe.js';

export type Fetcher = (job: { id: string; url: string }) => Promise<{ description: string }>;

// ---------- the watcher's domain rule, from watcher/keywords.json ----------
let scorerCache: { file: string; mtime: number; s: ReturnType<typeof makeScorer> } | null = null;
export function watcherScorer(repoRoot: string): ReturnType<typeof makeScorer> {
  // keywords.json lives with the watcher code (the dashboard's own repo), not in a scratch data copy
  const candidates = [path.join(repoRoot, 'watcher', 'keywords.json'), path.join(DASHBOARD_DIR, '..', 'watcher', 'keywords.json')];
  const file = candidates.find((f) => fs.existsSync(f))!;
  const mtime = fs.statSync(file).mtimeMs;
  if (!scorerCache || scorerCache.file !== file || scorerCache.mtime !== mtime) scorerCache = { file, mtime, s: makeScorer(JSON.parse(fs.readFileSync(file, 'utf8'))) };
  return scorerCache.s;
}

// ---------- rules ----------
export interface RuleVerdict { fit: number; reason: string }

/** The clear cases, settled without a model. Null → the job goes to the quick rank. */
export function ruleFor(job: Pick<Job, 'title' | 'flags' | 'description' | 'degrees'>, domainOk: (title: string, desc: string) => boolean): RuleVerdict | null {
  const flags = job.flags || [];
  if (flags.includes('Citizenship/clearance')) return { fit: 3, reason: 'Requires U.S. citizenship/clearance (F-1): rule' };
  const text = stripHtml(job.description || '');
  // Only with a real description: a JavaScript-only posting page must not be ruled out by its title alone.
  if (text.length >= 200 && !domainOk(job.title, text)) return { fit: 5, reason: 'Domain rule: no hardware topic' };
  if (flags.includes("Bachelor's only")) return { fit: 10, reason: "Bachelor's-only role (The owner is a PhD student): rule" };
  return null;
}

export interface PrerankResult {
  fetched: number; fetchFailed: number; closed: string[]; settled: { id: string; fit: number; reason: string }[]; toRank: number;
}

/**
 * `cli prerank`: fetch missing descriptions of new jobs (a 404/410 posting → closed), then settle the clear cases by rule
 * (rank_stage = 'rule'). Never touches a job that already has a score.
 */
export async function prerank(ctx: Ctx, opts: { fetch?: boolean; fetcher?: Fetcher; delayMs?: number } = {}): Promise<PrerankResult> {
  const { db, cfg } = ctx;
  const out: PrerankResult = { fetched: 0, fetchFailed: 0, closed: [], settled: [], toRank: 0 };
  const fetcher = opts.fetcher || realFetch;
  // JOBWATCHER_NO_FETCH=1: tests and e2e never fetch real posting pages here.
  if (opts.fetch !== false && (opts.fetcher || process.env.JOBWATCHER_NO_FETCH !== '1')) {
    const todo = listJobs(db, { forRanking: true }).filter((j) => !j.has_description && !j.description_fetched_at);
    for (const j of todo) {
      try { setDescription(db, j.id, (await fetcher({ id: j.id, url: j.url })).description); out.fetched++; }
      catch (e) {
        out.fetchFailed++;
        db.prepare('UPDATE jobs SET description_fetched_at = ? WHERE id = ?').run(nowIso(), j.id); // don't retry every time
        if (/\bHTTP (404|410)\b|no longer listed|Posting not found/i.test((e as Error).message)) {
          setStatus(db, j.id, 'closed', { note: `Posting gone when fetched (${(e as Error).message.slice(0, 80)})`, by: 'rules' });
          out.closed.push(j.id);
        }
      }
      if (opts.delayMs !== 0) await new Promise((r) => setTimeout(r, opts.delayMs ?? 400));
    }
  }
  const S = watcherScorer(cfg.repoRoot);
  for (const j of listJobs(db, { forRanking: true })) {
    const full = getJob(db, j.id, true);
    const v = ruleFor(full, S.domainOk);
    if (!v) continue;
    rankJob(db, j.id, v.fit, v.reason, { stage: 'rule', model: 'rules' });
    out.settled.push({ id: j.id, ...v });
  }
  out.toRank = listJobs(db, { forRanking: true }).length;
  return out;
}

// ---------- compact cards for the quick rank ----------
const KEEP_HEAD = /responsibilit|what you('|’)?ll do|what you will do|the role|about the (role|job|team|position)|job description|role description|qualification|requirement|what we('|’)?re looking for|what you (need|bring|have)|who you are|you (will|may) (have|bring)|preferred|minimum|basic|required|skills|experience|you('|’)?ll be|ways to stand out|nice to have|desired|education|your (role|impact|work)/i;
const DROP_HEAD = /benefit|perks|compensation|salary|pay (range|transparency)|equal (employment )?opportunit|\beeo\b|accommodation|diversity|about (us|the company|[A-Z][\w&.]*$)|who we are|our (company|culture|values|mission)|why (join|work)|life at|privacy|disclaimer|legal|e-?verify|how to apply|application process|location|work (model|arrangement)/i;
const DROP_LINE = /equal opportunity|without regard to|race, colou?r|sexual orientation|gender identity|veteran status|disability|reasonable accommodation|e-verify|401\(k\)|paid time off|health insurance|dental|medical, vision|base salary|salary range|pay range|compensation (range|package)|annual bonus|stock|equity (grants|awards)|\$\s?\d{2,3}(,\d{3})?\s*(-|–|to)\s*\$?\s?\d/i;

/** Plain text split into lines, with headings recognizable (HTML headings/strong or short title-like lines). */
const BR = ' \u0001 '; // a line marker stripHtml keeps (it collapses all whitespace)

function toLines(desc: string): { text: string; heading: boolean }[] {
  const marked = String(desc || '')
    .replace(/<\s*(h[1-6]|strong|b)\b[^>]*>(.*?)<\s*\/\s*\1\s*>/gis, (_m, _t, inner) => `${BR}##H## ${stripHtml(inner)}${BR}`)
    .replace(/<\s*(br|\/p|\/li|\/div|\/h[1-6]|\/ul|\/ol|li)\b[^>]*>/gi, BR)
    .replace(/\r?\n/g, BR);
  const text = stripHtml(marked).split('\u0001').map((l) => l.replace(/\s+/g, ' ').trim());
  return text.filter(Boolean).map((l) => {
    const h = l.startsWith('##H##');
    const clean = l.replace(/^##H##\s*/, '');
    // a plain-text heading: "Qualifications:" or a short line that reads like a known section name
    const titleLike = !h && clean.length <= 70 && /^[A-Z][^.!?]*:?$/.test(clean)
      && (clean.endsWith(':') || ((KEEP_HEAD.test(clean) || DROP_HEAD.test(clean)) && clean.split(' ').length <= 6));
    return { text: clean, heading: h || titleLike };
  });
}

/** The relevant part of a description (responsibilities + qualifications), boilerplate removed, at most `max` characters. */
export function relevantText(desc: string, max = 1200): string {
  const lines = toLines(desc);
  const hasHeads = lines.some((l) => l.heading && KEEP_HEAD.test(l.text));
  const kept: string[] = [];
  let mode: 'keep' | 'drop' | 'neutral' = hasHeads ? 'drop' : 'neutral';
  for (const l of lines) {
    if (l.heading) {
      mode = KEEP_HEAD.test(l.text) && !DROP_HEAD.test(l.text) ? 'keep' : DROP_HEAD.test(l.text) ? 'drop' : hasHeads ? mode : 'neutral';
      if (mode === 'keep') kept.push(`${l.text.replace(/:$/, '')}:`);
      continue;
    }
    if (mode === 'drop') continue;
    const sentences = l.text.split(/(?<=[.!?])\s+/).filter((x) => !DROP_LINE.test(x));
    if (sentences.length) kept.push(sentences.join(' '));
  }
  let out = kept.join(' ').replace(/\s+/g, ' ').trim();
  if (!out) out = lines.flatMap((l) => l.text.split(/(?<=[.!?])\s+/)).filter((x) => !DROP_LINE.test(x)).join(' ');
  if (out.length > max) out = `${out.slice(0, max).replace(/\s+\S*$/, '')} …`;
  return out;
}

export interface RankingCard {
  id: string; title: string; company: string; location: string; score: number | null; flags: string[]; tags: string[]; hits: string[];
  degrees: string; posted: string; text: string; has_description: boolean;
}

/** `cli jobs --for-ranking`: the next jobs to quick-rank (new, not ranked, highest watcher score first) as compact cards. */
export function rankingCards(ctx: Ctx, limit = 40): { count: number; remaining: number; cards: RankingCard[] } {
  const all = listJobs(ctx.db, { forRanking: true, sort: 'score' });
  const cards = all.slice(0, Math.max(1, limit)).map((j) => {
    const full = getJob(ctx.db, j.id, true);
    return {
      id: j.id, title: j.title, company: j.company.replace(/\s*\(.*$/, ''), location: j.location, score: j.score, flags: j.flags, tags: j.tags,
      hits: j.hits.slice(0, 8), degrees: j.degrees, posted: j.posted_date, has_description: j.has_description,
      text: full.description ? relevantText(full.description) : '(no description: judge from the title, tags and watcher hits)',
    };
  });
  return { count: cards.length, remaining: all.length - cards.length, cards };
}
