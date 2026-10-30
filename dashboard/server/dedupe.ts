// Each posting once (plan v2 §3.9; the owner 2026-10-17: "many jobs repeat; they go to the same link on the career portal").
// Only the literally same posting is merged: the same canonical URL, or the same requisition number at the same company.
// A re-posted role (same company + title, new id/URL) stays a normal, visible, rankable job and is only LINKED to the
// older posting (previous_posting_id). Nothing is hidden, closed or skipped.
import type { DB } from './db';
import { companyKey } from '../shared/statuses';
import { descriptionText } from '../shared/description';

/** Query parameters that never identify a posting: click tracking, language, embedding (AMD ?lang= / ?icims=, Ashby ?embed=). */
const NOISE_PARAMS = /^(utm_.*|gh_src|source|src|ref|referrer|referer|lever-source|lever-origin|trk|trackingid|tracking_id|iis|iisn|codes|mode|jobboard|board|feed|campaign|cmp|fbclid|gclid|ccuid|sid|lang|locale|hl|icims|embed|iframe|in_iframe|mobile|_ga|_gl)$/i;

/** Path endings that are the same posting's apply/application page (Ashby …/application, Lever …/apply, …). */
const APPLY_TAIL = /\/(apply|application|applynow|apply-now|login|register|apply\/form)$/;

/**
 * The canonical form of a posting URL: the same posting always gives the same string, whichever source linked to it.
 * Lower-cased host (no "www.") and path, no fragment, no trailing slash, no tracking/language/embed parameters,
 * no /apply or /application tail, plus per-site rules (Workday locale, Greenhouse board hosts, Amazon/Apple/Google/
 * SmartRecruiters/Microsoft slugs, careers.amd.com). '' for no URL.
 */
export function normalizeUrl(url: string | null | undefined): string {
  const s = String(url || '').trim();
  if (!s) return '';
  let u: URL;
  try { u = new URL(s); } catch { return s.toLowerCase(); }
  let host = u.host.toLowerCase().replace(/^www\./, '');
  const params = [...u.searchParams.entries()];
  let path: string;
  try { path = decodeURIComponent(u.pathname); } catch { path = u.pathname; }
  path = path.toLowerCase().replace(/\/+$/, '');
  for (let i = 0; i < 3 && APPLY_TAIL.test(path); i++) path = path.replace(APPLY_TAIL, '');
  let m: RegExpMatchArray | null;

  if (/myworkdayjobs\.com$/.test(host)) path = path.replace(/^\/[a-z]{2}-[a-z]{2}(?=\/)/, ''); // /en-US/External/… = /External/…
  if (/(^|\.)greenhouse\.io$/.test(host)) {
    host = 'greenhouse.io'; // boards. / job-boards. / job-boards.eu. are the same boards
    const forBoard = params.find(([k]) => k.toLowerCase() === 'for')?.[1]; const token = params.find(([k]) => k.toLowerCase() === 'token')?.[1];
    if (/\/embed\/job_app$/.test(path) && forBoard && token) return `https://greenhouse.io/${forBoard.toLowerCase()}/jobs/${token}`;
  }
  if (host === 'amazon.jobs' && (m = path.match(/^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/jobs\/(\d+)(?:\/|$)/))) path = `/jobs/${m[1]}`;
  if (host === 'jobs.apple.com' && (m = path.match(/^(?:\/[a-z]{2}-[a-z]{2})?\/details\/([0-9a-z-]+?)(?:\/|$)/))) path = `/details/${m[1]}`;
  if (host === 'google.com' && (m = path.match(/^\/about\/careers\/applications\/jobs\/results\/(\d+)/))) path = `/about/careers/applications/jobs/results/${m[1]}`;
  if (host === 'jobs.smartrecruiters.com' && (m = path.match(/^\/([^/]+)\/(\d{6,})/))) path = `/${m[1]}/${m[2]}`;
  if (/^(apply|jobs|careers)\.careers\.microsoft\.com$|^careers\.microsoft\.com$/.test(host) && (m = path.match(/\/job\/(\d+)/))) { host = 'careers.microsoft.com'; path = `/job/${m[1]}`; }
  if (host === 'careers.amd.com' && (m = path.match(/\/jobs\/(\d+)/))) path = `/jobs/${m[1]}`;

  const keep = params.filter(([k]) => !NOISE_PARAMS.test(k)).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]).sort(([a], [b]) => a.localeCompare(b));
  const q = keep.length ? `?${keep.map(([k, v]) => `${k}=${v}`).join('&')}` : '';
  return `${u.protocol}//${host}${path}${q}`;
}

/** The previous canonical form (2026-09-30 … 2026-10-17). Only for ids derived from it (manual:… job ids stay stable). */
export function legacyNormalizeUrl(url: string | null | undefined): string {
  const s = String(url || '').trim();
  if (!s) return '';
  let u: URL;
  try { u = new URL(s); } catch { return s.toLowerCase(); }
  const TRACKING = /^(utm_.*|gh_src|source|src|ref|referrer|referer|lever-source|lever-origin|trk|trackingid|tracking_id|iis|iisn|codes|mode|jobboard|board|feed|campaign|cmp|fbclid|gclid|ccuid|sid)$/i;
  const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING.test(k)).sort(([a], [b]) => a.localeCompare(b));
  const q = keep.length ? `?${keep.map(([k, v]) => `${k.toLowerCase()}=${v}`).join('&')}` : '';
  let pathname = decodeURIComponent(u.pathname).replace(/\/+$/, '').toLowerCase();
  if (/myworkdayjobs\.com$/i.test(u.host)) pathname = pathname.replace(/^\/[a-z]{2}-[a-z]{2}(?=\/)/, '');
  return `${u.protocol}//${u.host.toLowerCase().replace(/^www\./, '')}${pathname}${q.toLowerCase()}`;
}

/**
 * The requisition number of a posting, when the URL or the source id carries one:
 * Workday "…_JR2026584" / "wd:tenant:JR2026584" (a "-1"/"-2" suffix is another copy of the same requisition, e.g. the
 * same req on MarvellCareers and MarvellCareers2), Oracle HCM ".../sites/CX/job/25016392" / "oracle:CX:25016392"
 * (careers.ti.com and edbz.fa.us2.oraclecloud.com are the same posting), Greenhouse "/jobs/1234567" or "gh_jid=…",
 * SmartRecruiters "/7440000012345-…".
 */
export function reqIdFrom(url: string | null | undefined, id = ''): string {
  const stripCopy = (r: string) => r.replace(/-\d{1,2}$/, '');
  const wdId = id.match(/^wd:[^:]+:(.+)$/);
  if (wdId) return stripCopy(wdId[1].toUpperCase());
  const orId = id.match(/^oracle:[^:]+:(\d+)$/);
  if (orId) return orId[1];
  const s = String(url || '');
  let path = s;
  try { const u = new URL(s); path = u.pathname; const gh = u.searchParams.get('gh_jid'); if (gh) return gh; } catch { /* not a URL */ }
  const wd = path.match(/myworkdayjobs\.com|\/job\//i) && path.match(/_((?:JR|R|REQ|JOB)?-?\d{4,}[A-Z0-9-]*)$/i);
  if (wd && /myworkdayjobs\.com/i.test(s)) return stripCopy(wd[1].toUpperCase());
  const oracle = path.match(/\/sites\/[^/]+\/job\/(\d{5,})(?:\/|$)/i);
  if (oracle) return oracle[1];
  if (wd) return wd[1].toUpperCase();
  const gh = path.match(/\/jobs\/(\d{6,})(?:\/|$)/);
  if (gh) return gh[1];
  const sr = path.match(/\/(\d{12,})(?:-|$)/);
  if (sr) return sr[1];
  return '';
}

const NOISE = new Set(['2025', '2026', '2027', '2028', 'summer', 'fall', 'spring', 'winter', 'autumn', 'the', 'a', 'an', 'and', 'of', 'for', 'us', 'usa']);

/** companyKey + title without punctuation, years and seasons: "NVIDIA PhD Research Intern, VLSI - 2027" → "nvidia|phd research intern vlsi". */
export function repostKey(company: string, title: string): string {
  const words = String(title || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9+#]+/g, ' ').split(' ').filter((w) => w && !NOISE.has(w));
  return words.length ? `${companyKey(company)}|${words.join(' ')}` : '';
}

/** The existing job that is literally the same posting as this record (alias, canonical URL, or req id at the same company). */
export function findSamePosting(db: DB, rec: { id: string; company: string; url?: string }): string | null {
  const alias = db.prepare('SELECT job_id FROM job_aliases WHERE alias_id = ?').get(rec.id) as { job_id: string } | undefined;
  if (alias && db.prepare('SELECT 1 FROM jobs WHERE id = ?').get(alias.job_id)) return alias.job_id;
  const canon = normalizeUrl(rec.url);
  if (canon) {
    const hit = db.prepare('SELECT id FROM jobs WHERE canonical_url = ? AND id != ? LIMIT 1').get(canon, rec.id) as { id: string } | undefined;
    if (hit) return hit.id;
  }
  const req = reqIdFrom(rec.url, rec.id);
  if (req) {
    const k = companyKey(rec.company);
    const cands = db.prepare('SELECT id, company FROM jobs WHERE req_id = ? AND id != ?').all(req, rec.id) as { id: string; company: string }[];
    const hit = cands.find((c) => companyKey(c.company) === k);
    if (hit) return hit.id;
  }
  return null;
}

const day = (iso: string) => String(iso || '').slice(0, 10);

/** The newest older posting with the same repost key (posted on an earlier day), or null. */
export function findPreviousPosting(db: DB, job: { id: string; repost_key: string | null; first_seen: string }): string | null {
  if (!job.repost_key) return null;
  const rows = db.prepare('SELECT id, first_seen FROM jobs WHERE repost_key = ? AND id != ? ORDER BY first_seen DESC').all(job.repost_key, job.id) as { id: string; first_seen: string }[];
  return rows.find((r) => day(r.first_seen) < day(job.first_seen))?.id ?? null;
}

// ---------------------------------------------------------------- merging

/** How far along a status is: the merged job keeps the furthest (an applied/interview state is never lost). */
export const STATUS_RANK: Record<string, number> = {
  interview: 8, offer: 8, applied: 7, rejected: 7, prepared: 7, apply_direct: 7, apply_referral: 5, later: 4, skip: 3, closed: 2, ranked: 1, new: 0,
};
const STAGE_RANK: Record<string, number> = { final: 3, quick: 2, rule: 1 };

type Job = Record<string, unknown> & { id: string; company: string; status: string; first_seen: string };

/** The row to keep: the company's own feed over a SimplifyJobs copy (then over a manual find), then progress, then the oldest. */
function keeperOrder(a: Job, b: Job): number {
  const src = (j: Job) => (j.id.startsWith('simplify:') ? 2 : j.id.startsWith('manual:') ? 1 : 0);
  return src(a) - src(b) || (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0) || String(a.first_seen).localeCompare(String(b.first_seen)) || a.id.localeCompare(b.id);
}

const nonEmpty = (v: unknown) => v != null && v !== '' && v !== '[]';
const minStr = (vals: unknown[]) => vals.filter(nonEmpty).map(String).sort()[0] ?? null;

/** The field values the kept row gets from the whole group (see mergeGroup). */
export function mergedFields(rows: Job[], now: string, keepId?: string): { keep: Job; set: Record<string, unknown> } {
  const sorted = [...rows].sort(keeperOrder);
  const keep = rows.find((r) => r.id === keepId) ?? sorted[0];
  const set: Record<string, unknown> = {};
  // status (+ its dates) from the furthest-along row
  const st = [...rows].sort((a, b) => (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0) || keeperOrder(a, b))[0];
  set.status = st.status;
  set.decision_at = st.decision_at ?? minStr(rows.map((r) => r.decision_at));
  const appliedRows = rows.filter((r) => (STATUS_RANK[r.status] ?? 0) >= STATUS_RANK.applied);
  set.applied_date = minStr(appliedRows.map((r) => r.applied_date)) ?? st.applied_date ?? null;
  set.outcome_date = st.outcome_date ?? minStr(rows.map((r) => r.outcome_date));
  set.referral_requested_at = minStr(rows.map((r) => r.referral_requested_at));
  set.resume_version = [st, keep, ...rows].map((r) => r.resume_version).find((v) => nonEmpty(v) && v !== 'master') ?? keep.resume_version ?? 'master';
  set.application_dir = [st, keep, ...rows].map((r) => r.application_dir).find(nonEmpty) ?? null;
  // fit: a final score over a quick/rule one, then the higher score
  const fit = [...rows].filter((r) => r.fit_score != null).sort((a, b) => (STAGE_RANK[String(b.rank_stage)] ?? 0) - (STAGE_RANK[String(a.rank_stage)] ?? 0) || Number(b.fit_score) - Number(a.fit_score) || keeperOrder(a, b))[0];
  if (fit) for (const k of ['fit_score', 'fit_reason', 'ranked_at', 'rank_stage', 'rank_model']) set[k] = fit[k] ?? null;
  // the longest description (and the tags/flags derived from it)
  const desc = [...rows].sort((a, b) => descriptionText(String(b.description ?? '')).length - descriptionText(String(a.description ?? '')).length || keeperOrder(a, b))[0];
  if (desc.id !== keep.id && descriptionText(String(desc.description ?? '')).length > descriptionText(String(keep.description ?? '')).length) {
    for (const k of ['description', 'description_fetched_at', 'tags_json', 'flags_json']) set[k] = desc[k] ?? (k.endsWith('_json') ? '[]' : null);
  }
  // notes: every distinct line, in order
  const lines: string[] = [];
  for (const r of [st, keep, ...rows]) for (const l of String(r.notes ?? '').split(/\r?\n/)) if (l.trim() && !lines.includes(l)) lines.push(l);
  set.notes = lines.length ? lines.join('\n') : null;
  set.first_seen = minStr(rows.map((r) => r.first_seen)) ?? keep.first_seen;
  const posted = [...rows].filter((r) => nonEmpty(r.posted_date)).sort((a, b) => String(a.posted_date).localeCompare(String(b.posted_date)))[0];
  if (posted) { set.posted_date = posted.posted_date; set.posted_raw = posted.posted_raw ?? ''; }
  // other fields: the kept row's, else the first non-empty one
  for (const k of ['location', 'degrees', 'sponsorship_flag', 'company_priority', 'hits_json', 'previous_posting_id', 'fill_status', 'fill_report', 'fill_at']) {
    if (!(k in keep)) continue;
    if (!nonEmpty(keep[k])) { const v = sorted.map((r) => r[k]).find(nonEmpty); if (v !== undefined) set[k] = v; }
  }
  const ids = new Set(rows.map((r) => r.id));
  if (set.previous_posting_id && ids.has(String(set.previous_posting_id))) set.previous_posting_id = null;
  if (keep.previous_posting_id && ids.has(String(keep.previous_posting_id))) set.previous_posting_id = null;
  set.updated_at = now;
  // only what changes
  for (const k of Object.keys(set)) if (k !== 'updated_at' && (set[k] ?? null) === (keep[k] ?? null)) delete set[k];
  return { keep, set };
}

/**
 * Folds a group of rows that are the same posting into one: keeps the company-feed row (not the SimplifyJobs copy),
 * with the furthest status (and its dates), the final/best fit, the longest description, every distinct note, the
 * earliest first-seen and posted dates. Events, outreach, re-post links and aliases are moved to the kept id; each
 * removed id is recorded in job_aliases (future imports map to the kept job; cloud sync deletes it in D1).
 */
export function mergeGroup(db: DB, ids: string[], reason: string, now: string, keepId?: string): { kept: string; removed: string[]; set: Record<string, unknown> } | null {
  const rows = ids.map((id) => db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined).filter((r): r is Job => Boolean(r));
  if (rows.length < 2) return null;
  const { keep, set } = mergedFields(rows, now, keepId);
  const removed = rows.filter((r) => r.id !== keep.id).map((r) => r.id);
  db.transaction(() => {
    const keys = Object.keys(set);
    if (keys.length) db.prepare(`UPDATE jobs SET ${keys.map((k) => `"${k}" = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => set[k] ?? null), keep.id);
    for (const d of removed) {
      db.prepare('UPDATE outreach SET job_id = ?, updated_at = ? WHERE job_id = ?').run(keep.id, now, d);
      db.prepare("UPDATE events SET entity_id = ? WHERE entity = 'job' AND entity_id = ?").run(keep.id, d);
      db.prepare('UPDATE jobs SET previous_posting_id = ? WHERE previous_posting_id = ? AND id != ?').run(keep.id, d, keep.id);
      db.prepare('DELETE FROM jobs WHERE id = ?').run(d);
      db.prepare('INSERT OR REPLACE INTO job_aliases(alias_id, job_id, reason, at) VALUES (?,?,?,?)').run(d, keep.id, reason, now);
      db.prepare('UPDATE job_aliases SET job_id = ? WHERE job_id = ?').run(keep.id, d);
    }
    db.prepare("INSERT INTO events(at, entity, entity_id, kind, detail_json) VALUES (?, 'job', ?, 'duplicate_merged', ?)")
      .run(now, keep.id, JSON.stringify({ removed, reason, status: set.status ?? keep.status, from: rows.map((r) => ({ id: r.id, status: r.status, fit: r.fit_score ?? null, url: r.url })) }));
  })();
  return { kept: keep.id, removed, set };
}

/** Folds the older 2-row API (kept for callers): `dupId` into `keepId`, whichever the merge rules keep. */
export function mergeInto(db: DB, keepId: string, dupId: string, reason: string, now: string): void {
  mergeGroup(db, [keepId, dupId], reason, now);
}

export interface DedupeGroup { kept: string; removed: string[]; reason: string; key: string; status: string; statuses: string[]; urls: string[]; title: string; company: string }
export interface DedupeReport { dry: boolean; jobs: number; keysChanged: number; groups: DedupeGroup[]; removed: number }

/**
 * Recomputes canonical_url / req_id for every job and merges every group of rows that are the same posting
 * (same canonical URL, or same company + requisition number; chains are joined). `dry` only reports.
 */
export function dedupeJobs(db: DB, opts: { dry?: boolean; now?: string } = {}): DedupeReport {
  const now = opts.now || new Date().toISOString();
  const all = db.prepare('SELECT id, company, title, url, status, canonical_url, req_id FROM jobs ORDER BY first_seen ASC, id ASC').all() as { id: string; company: string; title: string; url: string; status: string; canonical_url: string | null; req_id: string | null }[];
  const keyOf = new Map<string, { canon: string | null; req: string | null }>();
  let keysChanged = 0;
  for (const j of all) {
    const canon = normalizeUrl(j.url) || null; const req = reqIdFrom(j.url, j.id) || null;
    keyOf.set(j.id, { canon, req });
    if (canon !== j.canonical_url || req !== j.req_id) keysChanged++;
  }
  // union-find over shared keys
  const parent = new Map<string, string>(all.map((j) => [j.id, j.id]));
  const find = (x: string): string => { let r = x; while (parent.get(r) !== r) r = parent.get(r)!; parent.set(x, r); return r; };
  const firstByKey = new Map<string, string>(); const reasonOf = new Map<string, string>();
  for (const j of all) {
    const k = keyOf.get(j.id)!;
    for (const key of [k.canon ? `u:${k.canon}` : '', k.req ? `r:${companyKey(j.company)}:${k.req}` : ''].filter(Boolean)) {
      const first = firstByKey.get(key);
      if (!first) { firstByKey.set(key, j.id); continue; }
      const a = find(first); const b = find(j.id);
      if (a !== b) { parent.set(b, a); if (!reasonOf.has(a)) reasonOf.set(a, key); }
    }
  }
  const groups = new Map<string, string[]>();
  for (const j of all) { const r = find(j.id); groups.set(r, [...(groups.get(r) || []), j.id]); }
  const byId = new Map(all.map((j) => [j.id, j]));
  const out: DedupeGroup[] = [];
  const run = () => {
    if (!opts.dry) {
      const upd = db.prepare('UPDATE jobs SET canonical_url = ?, req_id = ? WHERE id = ?');
      for (const j of all) { const k = keyOf.get(j.id)!; if (k.canon !== j.canonical_url || k.req !== j.req_id) upd.run(k.canon, k.req, j.id); }
    }
    for (const [root, ids] of groups) {
      if (ids.length < 2) continue;
      const key = reasonOf.get(root) || '';
      const reason = key.startsWith('u:') ? 'same URL' : 'same requisition number';
      const rows = ids.map((id) => db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job);
      const { keep, set } = mergedFields(rows, now);
      out.push({
        kept: keep.id, removed: ids.filter((id) => id !== keep.id), reason, key: key.slice(2), status: String(set.status ?? keep.status),
        statuses: ids.map((id) => byId.get(id)!.status), urls: ids.map((id) => byId.get(id)!.url), title: String(keep.title ?? ''), company: keep.company,
      });
      if (!opts.dry) mergeGroup(db, ids, reason, now);
    }
  };
  if (opts.dry) run(); else db.transaction(run)();
  return { dry: Boolean(opts.dry), jobs: all.length, keysChanged, groups: out, removed: out.reduce((n, g) => n + g.removed.length, 0) };
}

/**
 * Applies aliases that arrived from another PC (cloud sync): a local job whose id is now an alias of another local job
 * is merged into it, so the PCs converge on the same kept row. Returns the merged pairs.
 */
export function applyAliases(db: DB, now = new Date().toISOString()): { alias: string; into: string }[] {
  const rows = db.prepare('SELECT a.alias_id, a.job_id, a.reason FROM job_aliases a JOIN jobs j ON j.id = a.alias_id JOIN jobs k ON k.id = a.job_id').all() as { alias_id: string; job_id: string; reason: string }[];
  const out: { alias: string; into: string }[] = [];
  for (const r of rows) {
    if (!db.prepare('SELECT 1 FROM jobs WHERE id = ?').get(r.alias_id)) continue;
    // keep the row the other PC kept, so both PCs end with the same id
    if (mergeGroup(db, [r.job_id, r.alias_id], r.reason, now, r.job_id)) out.push({ alias: r.alias_id, into: r.job_id });
  }
  return out;
}

/**
 * One-time backfill (P4): keys for every job, exact same-posting duplicates merged (dedupeJobs), re-posts linked
 * (newest → older). Returns what it did, for the progress log.
 */
export function backfillDedupe(db: DB, now = new Date().toISOString()): { merged: { kept: string; removed: string; reason: string }[]; linked: number } {
  const merged: { kept: string; removed: string; reason: string }[] = [];
  let linked = 0;
  db.transaction(() => {
    const upd = db.prepare('UPDATE jobs SET repost_key = ? WHERE id = ?');
    for (const j of db.prepare('SELECT id, company, title FROM jobs').all() as { id: string; company: string; title: string }[]) upd.run(repostKey(j.company, j.title) || null, j.id);
    for (const g of dedupeJobs(db, { now }).groups) for (const r of g.removed) merged.push({ kept: g.kept, removed: r, reason: g.reason });
    const link = db.prepare('UPDATE jobs SET previous_posting_id = ? WHERE id = ?');
    for (const j of db.prepare('SELECT id, repost_key, first_seen FROM jobs WHERE repost_key IS NOT NULL AND previous_posting_id IS NULL').all() as { id: string; repost_key: string; first_seen: string }[]) {
      const prev = findPreviousPosting(db, j);
      if (prev) { link.run(prev, j.id); linked++; }
    }
  })();
  return { merged, linked };
}
