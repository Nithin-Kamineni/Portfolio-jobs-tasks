#!/usr/bin/env node
// Job watcher: polls target companies' public career-site feeds plus the
// SimplifyJobs internship list, filters by keywords, and reports only new jobs.
// Node 22+, no dependencies. Adapters, scoring and tagging live in watcher/lib/ (the dashboard reuses them).
//
// Usage:  node watcher/watch.js [--dry] [--company "NVIDIA"] [--no-simplify] [--reset] [--out DIR]
//   --dry          don't write anything (prints the digest to stdout)
//   --company X    only poll companies whose name contains X
//   --no-simplify  skip the SimplifyJobs list
//   --reset        forget previously seen jobs (everything is reported again)
//   --out DIR      write state, digest and inbox under DIR instead of the repo (for local tests)
//
// Outputs (normal run):
//   jobs/inbox/<YYYY-MM-DD_HHMM>.jsonl  one full job record per line (the dashboard imports these)
//   jobs/digests/<YYYY-MM-DD_HHMM>.md   human-readable digest (also the GitHub issue body)
//   watcher/state/seen.json             ids already reported or rejected
//   watcher/state/last_run.json         time, counts and source errors of the latest run
//   watcher/.out/                       issue.md + count.txt for the workflow
// jobs/tracker.csv is no longer written here; the dashboard regenerates it from its database.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV, sleep, stripHtml } from './lib/util.js';
import { adapters } from './lib/adapters.js';
import { fetchDescription } from './lib/describe.js';
import { makeScorer } from './lib/scoring.js';
import { simplifyJobs } from './lib/simplify.js';
import { deriveTags, deriveFlags, normalizePosted, atsFromUrl } from './lib/tags.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry');
const ONLY = opt('--company');
const OUT = opt('--out') ? path.resolve(opt('--out')) : ROOT;
// Descriptions fetched per company per run (jobs over the budget are not marked seen; the next run picks them up).
const MAX_DETAILS_PER_COMPANY = 200;
const MAX_DETAILS_SIMPLIFY = 150;
// Bump when the filtering logic changes: every earlier rejection is then checked again with the new rules.
const FILTER_LOGIC_VERSION = 2;
const FILTERS_KEY = '__filters';
// A description shorter than this can't show that a role has no hardware topic, so the domain rule waits for a real one.
const MIN_DESC_FOR_DOMAIN = 200;

const P = {
  companies: process.env.COMPANIES_CSV || path.join(ROOT, 'targets', 'companies.csv'),
  keywords: path.join(ROOT, 'watcher', 'keywords.json'),
  seen: path.join(ROOT, 'watcher', 'state', 'seen.json'),
  seenOut: path.join(OUT, 'watcher', 'state', 'seen.json'),
  lastRun: path.join(OUT, 'watcher', 'state', 'last_run.json'),
  digests: path.join(OUT, 'jobs', 'digests'),
  inbox: path.join(OUT, 'jobs', 'inbox'),
  out: path.join(OUT, 'watcher', '.out'),
};

const firstWord = (name) => name.toLowerCase().split(/[ (/]/)[0];

/** Names a companies.csv row goes by: "Amazon / AWS (Annapurna Labs)" → amazon, aws, annapurna labs. */
const aliases = (name) => name.toLowerCase().split(/[()/]/).map((s) => s.trim()).filter((s) => s.length >= 3);
/** The companies.csv row a SimplifyJobs company name belongs to (whole-word prefix match either way), or null. */
export function targetFor(companyName, companies) {
  const sn = String(companyName || '').toLowerCase().trim();
  return companies.find((c) => aliases(c.company).some((p) => sn === p || sn.startsWith(`${p} `) || p.startsWith(`${sn} `))) || null;
}

/**
 * Forget earlier rejections when the filters (keywords.json) or the filtering logic changed, so a job the old
 * rules dropped is judged again. Reported jobs stay seen. Entries from before the `r` flag: reported = score ≥ the
 * threshold that applied then (SimplifyJobs 10, company feeds 5).
 */
export function refreshSeen(seen, kw) {
  const hash = crypto.createHash('sha1').update(JSON.stringify([FILTER_LOGIC_VERSION, kw.titleMustMatchAny, kw.titleExclude,
    kw.locations, kw.domainMustMatchAny, kw.domainMinHits, kw.simplify?.minScore, kw.simplify?.categories, kw.simplify?.terms])).digest('hex').slice(0, 12);
  if (seen[FILTERS_KEY] === hash) return 0;
  let n = 0;
  for (const [id, v] of Object.entries(seen)) {
    if (id === FILTERS_KEY) continue;
    const reported = v.r != null ? v.r === 1 : v.s >= (id.startsWith('simplify:') ? 10 : 5);
    if (!reported) { delete seen[id]; n++; }
  }
  seen[FILTERS_KEY] = hash;
  return n;
}

/** The full record written to the inbox (one JSON object per line). */
export function inboxRecord(j, stamp) {
  const posted = normalizePosted(j.posted, stamp);
  return {
    id: j.id, company: j.company, company_priority: j.priority || '', title: j.title, location: j.location || '',
    url: j.url, source: j.source, ats: j.ats || atsFromUrl(j.url), posted, posted_raw: j.posted || '', first_seen: stamp,
    score: j.score, hits: j.hits || [],
    tags: deriveTags({ title: j.title, description: j.description, hits: j.hits }),
    flags: deriveFlags({ title: j.title, description: j.description, sponsorship: j.sponsorship, degrees: j.degrees, posted, now: stamp }),
    degrees: j.degrees || '', sponsorship: j.sponsorship || '', description: j.description || '',
  };
}

async function main() {
  const kw = JSON.parse(fs.readFileSync(P.keywords, 'utf8'));
  const S = makeScorer(kw);
  const allCompanies = parseCSV(fs.readFileSync(P.companies, 'utf8'));
  const companies = allCompanies.filter((c) => c.enabled !== 'no' && (!ONLY || c.company.toLowerCase().includes(ONLY.toLowerCase())));
  const seen = !flag('--reset') && fs.existsSync(P.seen) ? JSON.parse(fs.readFileSync(P.seen, 'utf8')) : {};
  const rechecked = refreshSeen(seen, kw);
  const prevRun = fs.existsSync(P.lastRun) ? JSON.parse(fs.readFileSync(P.lastRun, 'utf8')) : {};
  const prevCounts = prevRun.counts || {};
  const now = new Date(); const stamp = now.toISOString();
  const fresh = []; const errors = []; const manual = []; const stats = []; const counts = { ...prevCounts };
  const reject = (id, s) => { seen[id] = { t: stamp, s, r: 0 }; };

  // Every posting that passes the title, US-location and domain filters is reported; the score only orders them
  // (the dashboard's rules and ranking do the rest). Only SimplifyJobs rows from companies outside companies.csv
  // keep a score threshold (job.minScore), because that list covers thousands of unrelated companies.
  const consider = async (job, detailBudget) => {
    if (seen[job.id]) return;
    if (!S.titleOk(job.title)) { reject(job.id, -99); return; }
    const detail = job.detail || (job.fetchDescription && !stripHtml(job.description)
      ? async () => ({ description: (await fetchDescription({ id: job.id, url: job.url })).text }) : null);
    if (detail) {
      if (detailBudget.n <= 0) { detailBudget.deferred = (detailBudget.deferred || 0) + 1; return; }
      detailBudget.n--;
      try { Object.assign(job, await detail()); } catch { /* keep title-only */ }
      await sleep(200);
    }
    if (!S.usOk(job.location)) { reject(job.id, -98); return; }
    const hasDesc = stripHtml(job.description).length >= MIN_DESC_FOR_DOMAIN;
    if (!S.domainOk(job.title, job.description) && (hasDesc || !job.keepWithoutDescription)) { reject(job.id, -97); return; }
    const { score, hits } = S.score(job.title, job.description);
    const total = score + (job.bonus || 0);
    if (job.minScore != null && total < job.minScore) { seen[job.id] = { t: stamp, s: total, r: 0 }; return; }
    seen[job.id] = { t: stamp, s: total, r: 1 };
    fresh.push({ ...job, score: total, hits });
  };

  for (const c of companies) {
    const ats = (c.ats || '').toLowerCase();
    if (!adapters[ats]) { manual.push(c); continue; }
    // The defaults always run; a company's own search_terms are added to them, never replace them.
    const own = c.search_terms ? c.search_terms.split(';').map((s) => s.trim()).filter(Boolean) : [];
    const terms = [...new Set([...kw.searchTerms, ...own])];
    try {
      const jobs = await adapters[ats](c, terms);
      const budget = { n: MAX_DETAILS_PER_COMPANY }; const before = fresh.length;
      for (const j of jobs) await consider({ ...j, source: c.company, priority: c.priority, ats, fetchDescription: true, keepWithoutDescription: true }, budget);
      for (const w of jobs.warnings || []) errors.push(`${c.company} (${ats}): ${w}`);
      const was = prevCounts[c.company];
      if (!jobs.length && was > 0) errors.push(`${c.company} (${ats}): 0 jobs listed (${was} last run); the site may have changed or blocked the runner`);
      else if (was >= 20 && jobs.length < was * 0.4) errors.push(`${c.company} (${ats}): only ${jobs.length} jobs listed (${was} last run); check the adapter`);
      counts[c.company] = jobs.length;
      stats.push(`${c.company}: ${jobs.length} listed, ${fresh.length - before} new matches${budget.deferred ? `, ${budget.deferred} deferred to next run` : ''}`);
    } catch (e) {
      errors.push(`${c.company} (${ats}): ${e.message}`);
    }
    await sleep(500);
  }

  if (!flag('--no-simplify') && !ONLY) {
    try {
      const targets = companies.map((c) => [firstWord(c.company), c]).filter(([n]) => n.length > 2);
      const sj = await simplifyJobs(kw, targets.map(([n]) => n)); const before = fresh.length;
      const budget = { n: MAX_DETAILS_SIMPLIFY };
      for (const j of sj) {
        // Disabled rows count too: Tesla is off for its own site but its SimplifyJobs rows are still wanted.
        const target = targetFor(j.company, allCompanies);
        // A target company's posting is judged like a feed posting (description fetched, no score threshold).
        await consider(target
          ? { ...j, priority: target.priority, minScore: undefined, fetchDescription: true, keepWithoutDescription: true }
          : { ...j, priority: '' }, target ? budget : { n: 0 });
      }
      stats.push(`SimplifyJobs: ${sj.length} relevant-category listings, ${fresh.length - before} new matches${budget.deferred ? `, ${budget.deferred} deferred to next run` : ''}`);
    } catch (e) { errors.push(`SimplifyJobs: ${e.message}`); }
  }
  if (rechecked) stats.push(`Filters changed: ${rechecked} earlier rejections checked again`);

  // SimplifyJobs repeats postings the company feeds already have: drop those copies. Company-feed postings are
  // never merged with each other (the same title in two cities is two postings).
  const key = (j) => `${j.company.toLowerCase().split(/[ (]/)[0]}|${j.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const feedKeys = new Set(fresh.filter((j) => j.source !== 'SimplifyJobs').map(key));
  const report = fresh.filter((j) => j.source !== 'SimplifyJobs' || !feedKeys.has(key(j))).sort((a, b) => b.score - a.score);

  // ---------- outputs ----------
  const day = stamp.slice(0, 10), hhmm = stamp.slice(11, 16).replace(':', '');
  const line = (j) => `| ${j.score} | ${j.company} | [${j.title.replace(/\|/g, '/')}](${j.url}) | ${(j.location || '').replace(/\|/g, '/').slice(0, 60)} | ${j.posted || ''} | ${(j.hits || []).slice(0, 5).join(', ')}${j.degrees ? ` (${j.degrees})` : ''} |`;
  const top = report.filter((j) => j.score >= 15), rest = report.filter((j) => j.score < 15);
  const table = (rows) => rows.length ? ['| Score | Company | Role | Location | Posted | Why it matched |', '|---|---|---|---|---|---|', ...rows.map(line)].join('\n') : '_None._';
  const md = [
    `# Job digest: ${day} ${stamp.slice(11, 16)} UTC`,
    '',
    `**${report.length} new matching role(s).** Open the dashboard (start-dashboard.cmd) and click Sync; it tells you what to say in Claude Code.`,
    '',
    `## Strong matches (score ≥ 15)`, table(top), '',
    `## Other matches`, table(rest), '',
    manual.length ? `## Check these by hand (no public feed)\n${manual.map((c) => `- ${c.company}: ${c.careers_url}`).join('\n')}\n` : '',
    errors.length ? `## Sources with errors\n${errors.map((e) => `- ${e}`).join('\n')}\n` : '',
    `<details><summary>Run stats</summary>\n\n${stats.map((s) => `- ${s}`).join('\n')}\n</details>`,
  ].join('\n');

  if (DRY) { console.log(md); return; }

  for (const d of [P.digests, P.inbox, P.out, path.dirname(P.seenOut)]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(P.seenOut, JSON.stringify(seen));
  const base = `${day}_${hhmm}`;
  if (report.length) {
    fs.writeFileSync(path.join(P.digests, `${base}.md`), md);
    fs.writeFileSync(path.join(P.inbox, `${base}.jsonl`), report.map((j) => JSON.stringify(inboxRecord(j, stamp))).join('\n') + '\n');
  }
  fs.writeFileSync(P.lastRun, JSON.stringify({
    at: stamp, matches: report.length, digest: report.length ? `jobs/digests/${base}.md` : null,
    inbox: report.length ? `jobs/inbox/${base}.jsonl` : null, errors, stats, manual: manual.map((c) => c.company), counts,
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(P.out, 'issue.md'), md.length > 60000 ? md.slice(0, 60000) + '\n\n_(truncated; see the digest file)_' : md);
  fs.writeFileSync(path.join(P.out, 'count.txt'), String(report.length));
  console.log(`${report.length} new matches. ${errors.length} source errors.`);
  for (const e of errors) console.log('  ERROR ' + e);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
