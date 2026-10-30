// JobWatcher CLI for Claude Code sessions. Every command prints JSON (errors: {"error": "..."} and exit code 1).
// Safe to run while the dashboard is open (SQLite WAL mode).
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../server/config';
import { listAuto, suggest } from '../server/deadlines';
import { openDb } from '../server/db';
import { noGit, realGit } from '../server/git';
import { importLocal, sync, type Ctx } from '../server/sync';
import { exportTracker } from '../server/exporter';
import { openWatcherErrors } from '../server/routes/meta';
import {
  addContact, addOutreach, claudeActor, claudeFacts, getCompanyNote, getJob, getSettings, HttpError, listCompanies, listCompanyNotes, listContacts, listJobs,
  listOutreach, mark, rankJob, setCompanyNote, setDescription, setRunTag, setStatus, updateContact, updateJob, updateOutreach, type ContactInput,
} from '../server/repo';
import { addManualJob, manualCompanies, markManualChecked } from '../server/manual';
import { prerank, rankingCards } from '../server/ranking';
import { RunManager } from '../server/runs/runner';
import { findCandidates, researchHttp, setCandidateStatus } from '../server/research/candidates';
import { pdfEmails, pdfForDoi } from '../server/research/pdf';
import { getPaperEmailSearch, paperEmailSearchDone, startPaperEmailSearch } from '../server/research/paperEmails';
import { buildPipelines } from '../server/runs/pipelines';
import { listRuns } from '../server/runs/store';
import { runCloudSync, wranglerD1 } from '../server/cloudSync';
import { dedupeJobs } from '../server/dedupe';
import { keepDescriptions } from '../server/descriptionKeeper';
import { keepsDescription } from '../shared/description';
import type { Run } from '../shared/types';
import { fetchDescription } from '../../watcher/lib/describe.js';

const HELP = `JobWatcher CLI (prints JSON). Run from the repo root: node dashboard/cli <command>

  sync [--no-git]                          git pull + import new watcher files (same as the Sync button)
  jobs [--status new,ranked] [--company X] [--tag T] [--priority A] [--q text] [--limit N] [--sort fit] [--referral-requested] [--full]
  jobs --for-ranking [--limit 40]          compact cards of the next new jobs to quick-rank (relevant description part only)
  job add --company … --title … --url … [--location …] [--posted YYYY-MM-DD] [--description-file f] [--source "manual:<Company>"]
                                           add a posting found by hand/Chrome (the watcher's filters apply; same URL = no-op)
  job <id> [--fetch]                       one job with description, contacts and outreach (--fetch: get a missing description)
  fetch <id>                               fetch the job's description from its posting
  fetch --missing [--limit 25] [--status new,ranked]   fetch descriptions for jobs that have none (failures are not retried)
  rank <id> --fit 0-100 --reason "…" [--stage rule|quick|final] [--model m]   Claude's fit check; new → ranked
  prerank [--no-fetch]                     fetch missing descriptions of new jobs, settle the clear cases by rule
  manual-checked <company> --found N --added M --result ok|blocked|error [--note "…"]   record a manual-company check
  manual-companies                         manual companies and when each was last checked (due = older than the setting)
  status <id> <status> [--note "…"] [--dir applications/…]
                                           statuses: new ranked apply_referral later skip applied interview closed
                                           (apply_direct = applied; the same status again with --dir only records the folder)
  note <id> "text"                         append a dated note
  company-note <company> [--set "text"]    the note shown on every role of a company (no --set: print it; --set "": clear)
  company-notes                            all company notes
  contact add --name … --company … --relationship friend|dac|advisor_intro|researcher [--email … --email-source … --confidence verified|from_paper|pattern_guess]
              [--linkedin URL --linkedin-confidence search_match|confirmed --linkedin-source "web search: …"] [--openalex-id A…]
              [--title-or-lab …] [--summary "…"] [--papers '[{"title":…,"venue":…,"year":…,"url":…}]'] [--notes …]
  contact list [--company X] [--relationship researcher]
  contact update <id> [same options as add]
  outreach add --type referral|cold_email|follow_up --contact <id> [--job <id>] [--parent <id>] [--channel linkedin|email|text]
               [--subject "…"] (--body-file draft.txt | --body "…") [--status draft|ready]
  outreach list [--status ready,sent] [--type cold_email] [--due] [--job <id>] [--company X]
  outreach update <id> [--subject …] [--body-file …] [--status …]
  research candidates [--companies A,B | --priority A,B] [--venues ISCA,MICRO,…|all] [--since 2024] [--limit 80] [--no-fetch] [--no-enrich] [--all] [--ids 1,2]
                                           researchers at the target companies from recent papers (OpenAlex + Semantic Scholar), best first
  research pdf-emails <pdf-url> | --doi <doi>   e-mails and the author block from a paper's first two pages
  research mark <id,id…> picked|skipped|new    the owner's choice on research candidates
  research paper-emails <company> [--cached]    the dashboard's "Find R&D emails from papers": addresses printed on the papers
                                           of the company's researchers (no guessing); --cached prints the last result without searching
  mark weekly_review|manual_companies_checked|watcher_errors_fixed [--note "…"]
  deadlines list                            conference deadlines already on the website (Today page), found by earlier runs
  deadlines suggest --file found.json       add/update conference deadlines on the website as hidden suggestions (JSON array of
                                           {conference, year, kind: abstract|paper, due_on, due_time?, tz: AoE|UTC, source_url, note?})
  facts                                    what the dashboard's "Your turn in Claude" hand-offs are waiting for
  companies                                target companies with open-job and contact counts
  export                                   regenerate jobs/tracker.csv
  cloud-sync [--dry] [--json] [--pull-all] two-way sync with the website database (D1, via wrangler): jobs merged field by field,
                                           company notes, events, runs, checks, companies, contacts… both ways (--dry: counts only;
                                           --pull-all: a new/second PC: back up, then replace the local data with the website's)
  dedupe [--dry]                           merge rows that are the same posting (same canonical URL / requisition); backs up first
  keep-descriptions [--no-fetch]           Referral/Applied/Interview jobs: fetch missing descriptions, write applications/<dir>/JD.md
  run <task> [--param k=v]… [--wait] [--local]   start a Claude run: through the open dashboard (one at a time), else in this process (waits)
  continue <runId> [--note "…"] [--local]  continue a run that stopped (max turns, needs you) in the same Claude session
  runs [--limit 20]                        recent Claude runs
`;

const BOOL = new Set(['due', 'full', 'fetch', 'missing', 'no-git', 'referral-requested', 'help', 'wait', 'local', 'for-ranking', 'no-fetch', 'no-enrich', 'all', 'cached', 'dry', 'json', 'pull-all']);
/** Options that may be repeated (collected into a list). */
const MULTI = new Set(['param']);

function parseArgs(argv: string[]) {
  const pos: string[] = []; const opts: Record<string, string | boolean> = {}; const multi: Record<string, string[]> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const key = (eq > 0 ? a.slice(2, eq) : a.slice(2));
      let value: string | boolean;
      if (eq > 0) value = a.slice(eq + 1);
      else if (BOOL.has(key)) value = true;
      else { if (i + 1 >= argv.length) throw new HttpError(400, `--${key} needs a value`); value = argv[++i]; }
      if (MULTI.has(key)) (multi[key] ||= []).push(String(value)); else opts[key] = value;
    } else pos.push(a);
  }
  return { pos, opts, multi };
}

const str = (v: string | boolean | undefined) => (typeof v === 'string' ? v : undefined);
const need = (v: string | undefined, what: string) => { if (!v) throw new HttpError(400, `Missing ${what}`); return v; };
const compact = ({ id, company, company_priority, title, location, status, score, fit_score, tags, flags, url, has_description, posted_date, first_seen }: ReturnType<typeof listJobs>[number]) =>
  ({ id, company, priority: company_priority, title, location, status, score, fit_score, tags, flags, url, has_description, posted_date, first_seen });

function readBody(opts: Record<string, string | boolean>): string | undefined {
  const file = str(opts['body-file']);
  if (file) {
    const p = path.resolve(file);
    if (!fs.existsSync(p)) throw new HttpError(400, `No such file: ${file}`);
    return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').trim();
  }
  return str(opts.body);
}

function contactInput(o: Record<string, string | boolean>): ContactInput {
  const c: ContactInput = {};
  const map: [string, keyof ContactInput][] = [
    ['name', 'name'], ['company', 'company'], ['title-or-lab', 'title_or_lab'], ['relationship', 'relationship'], ['linkedin', 'linkedin_url'],
    ['email', 'email'], ['email-source', 'email_source'], ['confidence', 'email_confidence'], ['summary', 'work_summary'], ['notes', 'notes'],
    ['linkedin-confidence', 'linkedin_confidence'], ['linkedin-source', 'linkedin_source'], ['openalex-id', 'openalex_id'],
  ];
  for (const [flag, key] of map) if (str(o[flag]) !== undefined) (c as Record<string, unknown>)[key] = str(o[flag]);
  if (str(o.papers) !== undefined) c.papers = str(o.papers);
  return c;
}

async function run(argv: string[]): Promise<unknown> {
  const { pos, opts, multi } = parseArgs(argv);
  const [cmd, a1, a2] = pos;
  if (!cmd || opts.help || cmd === 'help') return { help: HELP };

  const cfg = loadConfig();
  setRunTag(process.env.JOBWATCHER_RUN_ID ? Number(process.env.JOBWATCHER_RUN_ID) : null, process.env.JOBWATCHER_RUN_MODEL || null);
  const db = openDb(cfg.dbPath);
  const ctx: Ctx = { db, cfg, git: opts['no-git'] || process.env.JOBWATCHER_GIT === 'off' ? noGit : realGit };
  const changed = () => { const e = exportTracker(db, cfg.repoRoot); return e.warning ? { exportWarning: e.warning } : {}; };
  try {
    if (cmd !== 'sync' && cmd !== 'cloud-sync') importLocal(ctx); // cloud-sync brings the import ledger first (a new PC)
    switch (cmd) {
      // Inside a Claude run, sync only pulls + imports: the run's after-run commit does the committing and pushing.
      case 'sync': return await sync(ctx, process.env.JOBWATCHER_RUN_ID ? { commitAndPush: false } : {});
      case 'jobs': {
        if (opts['for-ranking']) return rankingCards(ctx, Number(str(opts.limit) || 40));
        const jobs = listJobs(db, {
          status: str(opts.status), company: str(opts.company), tag: str(opts.tag), priority: str(opts.priority), q: str(opts.q),
          sort: str(opts.sort), order: str(opts.order) === 'asc' ? 'asc' : 'desc', limit: str(opts.limit) ? Number(opts.limit) : undefined,
          referralRequested: Boolean(opts['referral-requested']),
        });
        return { count: jobs.length, jobs: opts.full ? jobs : jobs.map(compact) };
      }
      case 'job': {
        if (a1 === 'add') {
          const file = str(opts['description-file']);
          if (file && !fs.existsSync(path.resolve(file))) throw new HttpError(400, `No such file: ${file}`);
          const r = addManualJob(ctx, {
            company: str(opts.company), title: str(opts.title), url: str(opts.url), location: str(opts.location), posted: str(opts.posted),
            source: str(opts.source), description: file ? fs.readFileSync(path.resolve(file), 'utf8') : str(opts.description),
          });
          return { ...r, job: compact(r.job), ...changed() };
        }
        const id = need(a1, 'job id');
        let job = getJob(db, id, true);
        let fetchError: string | undefined;
        if (opts.fetch && !job.has_description) {
          try { job = setDescription(db, id, (await fetchDescription({ id: job.id, url: job.url })).description); }
          catch (e) { fetchError = (e as Error).message; }
        }
        const contacts = listContacts(db, { company: job.company });
        return { job, contacts, outreach: listOutreach(db, { company: job.company }).concat(listOutreach(db, { jobId: id })).filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i), ...(fetchError ? { fetchError } : {}) };
      }
      case 'fetch': {
        if (opts.missing) {
          const todo = listJobs(db, { status: str(opts.status) || 'new,ranked,apply_referral,later', sort: 'fit' })
            .filter((j) => !j.has_description && !j.description_fetched_at).slice(0, Number(str(opts.limit) || 25));
          const fetched: string[] = []; const failed: { id: string; error: string }[] = [];
          for (const j of todo) {
            try { setDescription(db, j.id, (await fetchDescription({ id: j.id, url: j.url })).description); fetched.push(j.id); }
            catch (e) {
              failed.push({ id: j.id, error: (e as Error).message });
              db.prepare('UPDATE jobs SET description_fetched_at = ? WHERE id = ?').run(new Date().toISOString(), j.id); // don't retry every time
            }
            await new Promise((r) => setTimeout(r, 400));
          }
          const left = listJobs(db, { status: 'new,ranked' }).filter((j) => !j.has_description && !j.description_fetched_at).length;
          return { fetched: fetched.length, failed, remaining: left };
        }
        const job = getJob(db, need(a1, 'job id'), false);
        const d = await fetchDescription({ id: job.id, url: job.url });
        const updated = setDescription(db, job.id, d.description);
        return { id: updated.id, via: d.via, chars: d.text.length, tags: updated.tags, flags: updated.flags, description: d.text };
      }
      case 'rank': {
        const job = rankJob(db, need(a1, 'job id'), Number(need(str(opts.fit), '--fit')), need(str(opts.reason), '--reason'), { stage: str(opts.stage), model: str(opts.model) });
        return { job: compact(job), fit_reason: job.fit_reason, rank_stage: job.rank_stage, ...changed() };
      }
      case 'prerank': { const r = await prerank(ctx, { fetch: !opts['no-fetch'] }); return { ...r, ...changed() }; }
      case 'manual-checked': {
        const found = str(opts.found); const added = str(opts.added);
        return { check: markManualChecked(db, need(a1, 'company'), { found: found == null ? undefined : Number(found), added: added == null ? undefined : Number(added), result: str(opts.result), note: str(opts.note) }) };
      }
      case 'manual-companies': return { everyHours: getSettings(db, cfg.runs).manualCheckEveryHours, companies: manualCompanies(db, getSettings(db, cfg.runs).manualCheckEveryHours) };
      case 'status': {
        const id = need(a1, 'job id');
        if (str(opts.dir)) updateJob(db, id, { application_dir: str(opts.dir)! });
        const r = setStatus(db, id, need(a2, 'status'), { note: str(opts.note), by: claudeActor() });
        // Referral/Applied/Interview: capture the description (and JD.md) while the posting is still live
        const kept = keepsDescription(r.job.status) ? await keepDescriptions(db, cfg.repoRoot, { fetcher: fetchDescription, ids: [id] }) : null;
        return { job: compact(r.job), application_dir: getJob(db, id, false).application_dir, eventId: r.eventId, ...(kept ? { descriptionSaved: kept.written, descriptionFetchFailed: kept.failed } : {}), ...changed() };
      }
      case 'note': {
        const id = need(a1, 'job id');
        const job = getJob(db, id, false);
        const line = `[${new Date().toISOString().slice(0, 10)}] ${need(a2, 'note text')}`;
        const updated = updateJob(db, id, { notes: job.notes ? `${job.notes}\n${line}` : line });
        return { id, notes: updated.notes, ...changed() };
      }
      case 'company-note': {
        const company = need(a1, 'company');
        if (typeof opts.set === 'string') return { note: setCompanyNote(db, company, opts.set) };
        return { note: getCompanyNote(db, company) };
      }
      case 'company-notes': return { notes: listCompanyNotes(db) };
      case 'contact': {
        if (a1 === 'add') return { contact: addContact(db, contactInput(opts)) };
        if (a1 === 'list') { const cs = listContacts(db, { company: str(opts.company), relationship: str(opts.relationship) }); return { count: cs.length, contacts: cs }; }
        if (a1 === 'update') return { contact: updateContact(db, Number(need(a2, 'contact id')), contactInput(opts)) };
        throw new HttpError(400, 'Use: contact add | list | update <id>');
      }
      case 'outreach': {
        if (a1 === 'add') {
          const o = addOutreach(db, {
            type: str(opts.type), contact_id: str(opts.contact) ? Number(opts.contact) : null, job_id: str(opts.job) || null,
            parent_id: str(opts.parent) ? Number(opts.parent) : null, channel: str(opts.channel) || null, subject: str(opts.subject) ?? null,
            body: readBody(opts) ?? null, status: str(opts.status), created_by: claudeActor(),
          });
          return { outreach: o, ...changed() };
        }
        if (a1 === 'list') {
          const items = listOutreach(db, { type: str(opts.type), status: str(opts.status), due: Boolean(opts.due), jobId: str(opts.job), company: str(opts.company) });
          return { count: items.length, outreach: items };
        }
        if (a1 === 'update') {
          const patch: Record<string, string> = {};
          if (str(opts.subject) !== undefined) patch.subject = str(opts.subject)!;
          const body = readBody(opts); if (body !== undefined) patch.body = body;
          if (str(opts.status)) patch.status = str(opts.status)!;
          return { outreach: updateOutreach(db, Number(need(a2, 'outreach id')), patch), ...changed() };
        }
        throw new HttpError(400, 'Use: outreach add | list | update <id>');
      }
      case 'research': {
        const csv = (v: string | boolean | undefined) => (str(v) ? str(v)!.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
        const num = (v: string | boolean | undefined) => (str(v) ? Number(str(v)) : undefined);
        if (a1 === 'candidates') {
          const ids = csv(opts.ids)?.map(Number);
          if (ids?.some((n) => !Number.isInteger(n))) throw new HttpError(400, '--ids must be candidate ids like 3,7,12');
          return await findCandidates(ctx, {
            companies: csv(opts.companies), priority: csv(opts.priority), venues: csv(opts.venues), since: num(opts.since), limit: num(opts.limit),
            noFetch: Boolean(opts['no-fetch']), enrich: !opts['no-enrich'], all: Boolean(opts.all), ids,
          });
        }
        if (a1 === 'pdf-emails') {
          const http = researchHttp(cfg);
          let url = a2;
          if (!url && str(opts.doi)) {
            url = (await pdfForDoi(http, str(opts.doi)!)) || '';
            if (!url) throw new HttpError(404, `No open-access PDF found for DOI ${str(opts.doi)} (OpenAlex, Semantic Scholar)`);
          }
          return await pdfEmails(http, need(url, 'PDF link (or --doi)'));
        }
        if (a1 === 'paper-emails') {
          const company = need(a2, 'company');
          if (opts.cached) return { search: getPaperEmailSearch(db, company) };
          startPaperEmailSearch(ctx, company);
          return { search: await paperEmailSearchDone(company) };
        }
        if (a1 === 'mark') {
          const ids = (a2 || '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
          return { candidates: setCandidateStatus(db, ids, need(pos[3], 'status (picked | skipped | new)')) };
        }
        throw new HttpError(400, 'Use: research candidates | pdf-emails <url> | mark <ids> <status>');
      }
      case 'mark': return mark(db, need(a1, 'kind'), str(opts.note));
      case 'deadlines': {
        const d1 = wranglerD1(cfg.siteDir);
        if (a1 === 'list') return { deadlines: await listAuto(d1) };
        if (a1 === 'suggest') {
          const file = path.resolve(need(str(opts.file), '--file'));
          if (!fs.existsSync(file)) throw new HttpError(400, `No such file: ${file}`);
          let list: unknown; try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw new HttpError(400, 'The file is not valid JSON'); }
          return await suggest(d1, list);
        }
        throw new HttpError(400, 'Use: deadlines list | deadlines suggest --file found.json');
      }
      case 'facts': return claudeFacts(db, openWatcherErrors(ctx), getSettings(db, cfg.runs).manualCheckEveryHours, cfg.runs.finalMinFit);
      case 'companies': return { companies: listCompanies(db) };
      case 'export': { const e = exportTracker(db, cfg.repoRoot); return e; }
      case 'dedupe': {
        let backup: string | null = null;
        if (!opts.dry) {
          backup = path.join(cfg.backupDir, `jobwatcher-before-dedupe-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
          fs.mkdirSync(cfg.backupDir, { recursive: true });
          await db.backup(backup);
        }
        const r = dedupeJobs(db, { dry: Boolean(opts.dry) });
        if (!opts.dry) exportTracker(db, cfg.repoRoot);
        return { backup, ...r };
      }
      case 'keep-descriptions': return await keepDescriptions(db, cfg.repoRoot, { fetch: !opts['no-fetch'], fetcher: fetchDescription });
      case 'cloud-sync': {
        // --pull-all (a new PC, or one whose database is stale): back up, empty the local data, copy everything from D1.
        let backup: string | null = null;
        if (opts['pull-all'] && !opts.dry && (db.prepare('SELECT count(*) AS n FROM jobs').get() as { n: number }).n > 0) {
          backup = path.join(cfg.backupDir, `jobwatcher-before-pull-all-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
          fs.mkdirSync(cfg.backupDir, { recursive: true });
          await db.backup(backup);
        }
        const r = await runCloudSync(db, wranglerD1(cfg.siteDir), { dry: Boolean(opts.dry), machine: cfg.machine, pullAll: Boolean(opts['pull-all']) });
        if (r.pulledAll && !r.dry) return { ...r, backup, ...changed() };
        return { ...r, ...(r.localChanges && !r.dry ? changed() : {}) };
      }
      case 'run': return await startRun(ctx, need(a1, 'task'), parseParams(multi.param || []), Boolean(opts.wait), Boolean(opts.local) || process.env.JOBWATCHER_CLI_LOCAL === '1');
      case 'continue': return await continueRun(ctx, Number(need(a1, 'run id')), str(opts.note), Boolean(opts.local) || process.env.JOBWATCHER_CLI_LOCAL === '1');
      case 'runs': return { runs: listRuns(db, { limit: Number(str(opts.limit) || 20) }).map(runSummary) };
      default: throw new HttpError(400, `Unknown command "${cmd}". Run "node dashboard/cli help".`);
    }
  } finally {
    db.close();
  }
}

function parseParams(list: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const kv of list) {
    const eq = kv.indexOf('=');
    if (eq <= 0) throw new HttpError(400, `--param needs key=value (got "${kv}")`);
    out[kv.slice(0, eq)] = kv.slice(eq + 1);
  }
  return out;
}

const runSummary = (r: Run) => ({
  id: r.id, task: r.task, status: r.status, params: r.params, created_at: r.created_at, started_at: r.started_at, finished_at: r.finished_at,
  counters: r.progress.counters, usage: r.progress.usage, num_turns: r.num_turns, usage_usd: r.usage_usd, error: r.error, summary: r.summary,
});
const TERMINAL = ['succeeded', 'failed', 'cancelled', 'timed_out', 'needs_user'];

/** "Continue" for a run that stopped (max turns, needs you): resumes its Claude session with an optional note. Always waits. */
async function continueRun(ctx: Ctx, id: number, note: string | undefined, local: boolean) {
  if (process.env.JOBWATCHER_RUN_ID) throw new HttpError(400, 'A Claude run cannot start another run');
  const base = `http://127.0.0.1:${ctx.cfg.port}`;
  const open = !local && await fetch(`${base}/api/meta`, { signal: AbortSignal.timeout(1500) }).then((r) => r.ok).catch(() => false);
  if (open) {
    const res = await fetch(`${base}/api/runs/${id}/continue`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    const out = await res.json() as { run?: Run; error?: string };
    if (!res.ok || !out.run) throw new HttpError(res.status, out.error || `HTTP ${res.status}`);
    let run = out.run;
    while (!TERMINAL.includes(run.status)) { await new Promise((r) => setTimeout(r, 2000)); run = await (await fetch(`${base}/api/runs/${run.id}`)).json() as Run; }
    return { via: 'dashboard', run: runSummary(run) };
  }
  const runs = new RunManager(ctx, { pipelines: buildPipelines(), onFinished: () => { exportTracker(ctx.db, ctx.cfg.repoRoot); } });
  const { run } = runs.continueRun(id, note);
  await runs.whenIdle();
  return { via: 'cli', run: runSummary(runs.get(run.id)) };
}

/** Through the open dashboard (so runs stay one at a time), else in this process (then it always waits). */
async function startRun(ctx: Ctx, task: string, params: Record<string, string>, wait: boolean, local: boolean) {
  if (process.env.JOBWATCHER_RUN_ID) throw new HttpError(400, 'A Claude run cannot start another run');
  const base = `http://127.0.0.1:${ctx.cfg.port}`;
  const open = !local && await fetch(`${base}/api/meta`, { signal: AbortSignal.timeout(1500) }).then((r) => r.ok).catch(() => false);
  if (open) {
    const res = await fetch(`${base}/api/runs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, params }) });
    const out = await res.json() as { run?: Run; deduped?: boolean; error?: string };
    if (!res.ok || !out.run) throw new HttpError(res.status, out.error || `HTTP ${res.status}`);
    let run = out.run;
    while (wait && !TERMINAL.includes(run.status)) {
      await new Promise((r) => setTimeout(r, 2000));
      run = await (await fetch(`${base}/api/runs/${run.id}`)).json() as Run;
    }
    return { via: 'dashboard', deduped: Boolean(out.deduped), run: runSummary(run) };
  }
  const runs = new RunManager(ctx, { pipelines: buildPipelines(), onFinished: () => { exportTracker(ctx.db, ctx.cfg.repoRoot); } });
  const { run, deduped } = runs.start(task, params);
  if (deduped) return { via: 'cli', deduped: true, run: runSummary(run) };
  await runs.whenIdle();
  return { via: 'cli', deduped: false, run: runSummary(runs.get(run.id)) };
}

run(process.argv.slice(2)).then(
  (out) => {
    if (out && typeof out === 'object' && 'help' in out) process.stdout.write(String((out as { help: string }).help));
    else process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  },
  (e: Error) => {
    process.stdout.write(JSON.stringify({ error: e.message }) + '\n');
    process.exitCode = 1;
  },
);
