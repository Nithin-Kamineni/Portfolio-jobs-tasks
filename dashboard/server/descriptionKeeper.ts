// Job descriptions are never lost (The owner, 2026-10-17): companies remove postings, sometimes before the interview.
// For every job in Referral / Applied / Interview this PC
//   1. fetches the description right away when it is missing (or only a short teaser), while the posting is still live;
//   2. writes it to applications/<Company>_<Role>_<date>/JD.md (a plain file, committed to git by Sync), so it survives
//      any database problem. A JD.md written by a "process decisions" run (no marker) is left as it is; the saved
//      posting then goes to JD_full.md next to it.
// It runs on start, a few seconds after dashboard/CLI status changes, after cloud syncs (website changes) and every 10 min.
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db';
import { addEvent, getJob, nowIso, setDescription } from './repo';
import { descriptionText, KEEP_DESCRIPTION_STATUSES } from '../shared/description';

export const KEEPER_MARKER = '<!-- saved by the dashboard (server/descriptionKeeper.ts): the posting as stored in the database; rewritten when the stored description changes -->';
/** A description shorter than this (e.g. IBM's 250-character search teaser) is fetched again (a longer text replaces it). */
export const SHORT_DESCRIPTION_CHARS = 400;
const RETRY_HOURS = 6;

type Fetcher = (job: { id: string; url: string }) => Promise<{ description: string }>;

interface KeptJob {
  id: string; company: string; title: string; location: string; url: string; status: string; posted_date: string; first_seen: string;
  description: string; description_fetched_at: string | null; application_dir: string | null; applied_date: string | null; decision_at: string | null;
}

const slug = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, ' ').replace(/[\s_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70);

/** applications/<Company>_<Role>_<YYYY-MM-DD> for a job without a folder (the "process decisions" convention). */
export function applicationDirFor(job: Pick<KeptJob, 'company' | 'title' | 'applied_date' | 'decision_at' | 'first_seen'>): string {
  const role = job.title.replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\b(summer|fall|spring|winter)\b/gi, ' ').replace(/\s+-\s*$/, '');
  const day = (job.applied_date || job.decision_at || job.first_seen || nowIso()).slice(0, 10);
  return `applications/${slug(job.company.split(/[(/]/)[0])}_${slug(role)}_${day}`;
}

const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', bull: '•', middot: '·', trade: '™', reg: '®', copy: '©', eacute: 'é',
};

/** Readable Markdown-ish text from the stored description HTML (paragraphs, list items and headings kept as lines). */
export function descriptionMarkdown(html: string): string {
  let s = String(html || '');
  if (!/<[a-z][\s\S]*>/i.test(s) && /&lt;[a-z]/i.test(s)) s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'); // escaped HTML
  if (!/<[a-z][\s\S]*>/i.test(s)) return s.trim();
  return s
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '\n\n### ').replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|ol|li|section|tr)>/gi, '\n').replace(/<(p|div|ul|ol|section|tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .split('\n').map((l) => l.replace(/[ \t\xa0]+/g, ' ').trim()).join('\n')
    .replace(/^- *\n+(?=\S)/gm, '- ') // a paragraph inside a list item
    .replace(/^-\s*$/gm, '') // empty list items
    .replace(/\n{2,}(?=- )/g, '\n') // list items on consecutive lines
    .replace(/\n{3,}/g, '\n\n').trim();
}

export function jdMarkdown(job: KeptJob): string {
  const line = (k: string, v: string | null | undefined) => (v ? `- **${k}:** ${v}\n` : '');
  return `${KEEPER_MARKER}\n# ${job.company}: ${job.title}\n\n`
    + line('Company', job.company) + line('Location', job.location) + line('Posting', job.url) + line('Job id', `\`${job.id}\``)
    + line('Posted', job.posted_date) + line('First seen', job.first_seen?.slice(0, 10)) + line('Description fetched', job.description_fetched_at?.slice(0, 10))
    + `\n## Description\n\n${descriptionMarkdown(job.description) || '_No description could be fetched; open the posting while it is live and paste it here._'}\n`;
}

/** The file this job's saved posting lives in: JD.md, or JD_full.md when JD.md was written by hand / a Claude run. */
export function savedJdPath(repoRoot: string, dir: string, shared?: { id: string }): string {
  // two kept jobs in one folder (e.g. two AMD reqs applied with one application): one file per job
  if (shared) return path.join(repoRoot, dir, `JD_full_${slug(shared.id).slice(-48)}.md`);
  const jd = path.join(repoRoot, dir, 'JD.md');
  if (!fs.existsSync(jd)) return jd;
  const head = fs.readFileSync(jd, 'utf8').slice(0, 400);
  return head.includes(KEEPER_MARKER) ? jd : path.join(repoRoot, dir, 'JD_full.md');
}

/** More than one Referral/Applied/Interview job uses this application folder. */
function sharedDir(db: DB, dir: string): boolean {
  const statuses = KEEP_DESCRIPTION_STATUSES.map((st) => `'${st}'`).join(',');
  return (db.prepare(`SELECT count(*) AS n FROM jobs WHERE application_dir = ? AND status IN (${statuses})`).get(dir) as { n: number }).n > 1;
}

export interface KeepReport { checked: number; fetched: string[]; failed: { id: string; error: string }[]; written: string[]; dirsSet: string[] }

/** One pass over the jobs whose description must be kept. `ids` limits it; `fetch: false` only writes files. */
export async function keepDescriptions(db: DB, repoRoot: string, opts: { fetch?: boolean; fetcher?: Fetcher; ids?: string[]; now?: Date } = {}): Promise<KeepReport> {
  const report: KeepReport = { checked: 0, fetched: [], failed: [], written: [], dirsSet: [] };
  const statuses = KEEP_DESCRIPTION_STATUSES.map((s) => `'${s}'`).join(',');
  const load = () => db.prepare(`SELECT id, company, title, location, url, status, posted_date, first_seen, description, description_fetched_at, application_dir, applied_date, decision_at
    FROM jobs WHERE status IN (${statuses}) ORDER BY id`).all() as KeptJob[];
  let jobs = load().filter((j) => !opts.ids || opts.ids.includes(j.id));
  report.checked = jobs.length;
  const now = opts.now ?? new Date();

  // 1. fetch missing / teaser descriptions (not more often than every RETRY_HOURS per job after a failure)
  if (opts.fetch !== false && opts.fetcher) {
    for (const j of jobs) {
      if (descriptionText(j.description).length >= SHORT_DESCRIPTION_CHARS || !/^https?:\/\//.test(j.url)) continue;
      const last = db.prepare("SELECT at FROM events WHERE entity = 'job' AND entity_id = ? AND kind = 'description_fetch_failed' ORDER BY id DESC LIMIT 1").get(j.id) as { at: string } | undefined;
      if (last && now.getTime() - Date.parse(last.at) < RETRY_HOURS * 3600e3) continue;
      try {
        const d = await opts.fetcher({ id: j.id, url: j.url });
        const before = descriptionText(j.description).length;
        const after = descriptionText(setDescription(db, j.id, d.description).description).length;
        if (after > before) report.fetched.push(j.id);
      } catch (e) {
        report.failed.push({ id: j.id, error: (e as Error).message });
        addEvent(db, 'job', j.id, 'description_fetch_failed', { error: (e as Error).message.slice(0, 300) });
      }
    }
    jobs = load().filter((j) => !opts.ids || opts.ids.includes(j.id));
  }

  // 2. the plain-file copy
  for (const j of jobs) {
    let dir = j.application_dir;
    if (!dir) {
      dir = applicationDirFor(j);
      db.prepare('UPDATE jobs SET application_dir = ?, updated_at = ? WHERE id = ?').run(dir, nowIso(), j.id);
      report.dirsSet.push(j.id);
    }
    const file = savedJdPath(repoRoot, dir, sharedDir(db, dir) ? { id: j.id } : undefined);
    const text = jdMarkdown({ ...j, application_dir: dir });
    const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
    // never overwrite a saved posting with a worse one (the database text was lost or emptied): keep the file
    if (old != null && descriptionText(old).length > descriptionText(text).length + 200 && descriptionText(j.description).length < SHORT_DESCRIPTION_CHARS) continue;
    if (old === text) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    report.written.push(path.relative(repoRoot, file).replace(/\\/g, '/'));
  }
  return report;
}

/** The saved-JD file of one job (for the job panel's "Open saved JD"), or null. */
export function savedJdFor(db: DB, repoRoot: string, id: string): { file: string; rel: string } | null {
  const job = getJob(db, id, false);
  if (!job.application_dir) return null;
  const file = savedJdPath(repoRoot, job.application_dir, sharedDir(db, job.application_dir) ? { id: job.id } : undefined);
  return fs.existsSync(file) ? { file, rel: path.relative(repoRoot, file).replace(/\\/g, '/') } : null;
}

// ---------------------------------------------------------------- the background keeper (real dashboard only)

export class DescriptionKeeper {
  private timer: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private running = false;
  private again = false;
  constructor(private db: DB, private repoRoot: string, private fetcher: Fetcher, private log: (m: string) => void = () => undefined, private everyMs = 10 * 60_000) {}

  start(): void {
    this.kick(2000);
    this.interval = setInterval(() => this.kick(0), this.everyMs);
    this.interval.unref();
  }
  stop(): void { if (this.timer) clearTimeout(this.timer); if (this.interval) clearInterval(this.interval); this.timer = null; this.interval = null; }
  /** Runs a pass after `delayMs` (calls within the delay are merged). */
  kick(delayMs = 3000): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.pass(); }, delayMs);
    this.timer.unref();
  }
  async pass(): Promise<KeepReport | null> {
    if (this.running) { this.again = true; return null; }
    this.running = true;
    try {
      const r = await keepDescriptions(this.db, this.repoRoot, { fetcher: this.fetcher });
      if (r.fetched.length || r.written.length || r.failed.length) this.log(`Descriptions: ${r.fetched.length} fetched, ${r.written.length} JD file(s) written${r.failed.length ? `, ${r.failed.length} fetch(es) failed` : ''}`);
      return r;
    } catch (e) { this.log(`Description keeper failed: ${(e as Error).message}`); return null; }
    finally {
      this.running = false;
      if (this.again) { this.again = false; this.kick(1000); }
    }
  }
}

let active: DescriptionKeeper | null = null;
export const setActiveKeeper = (k: DescriptionKeeper | null) => { active = k; };
/** After a dashboard write (status change, …): a keeper pass a few seconds later. No-op without the keeper (tests). */
export const notifyKeeper = () => { active?.kick(); };
