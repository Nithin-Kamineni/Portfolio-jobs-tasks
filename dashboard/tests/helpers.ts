// Test helpers: a throwaway repo folder (with the files the dashboard reads) and a fresh database.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, type DB } from '../server/db';
import { loadConfig, type Config } from '../server/config';
import type { GitRunner, GitResult } from '../server/git';
import type { Ctx } from '../server/sync';

export const COMPANIES_CSV = `company,priority,enabled,ats,tenant,host,site,search_terms,careers_url,fit_notes
NVIDIA,A,yes,workday,nvidia,nvidia.wd5.myworkdayjobs.com,NVIDIAExternalCareerSite,,https://nvidia.example/careers,"PhD Research Intern, architecture"
Micron,A,yes,workday,micron,micron.wd1.myworkdayjobs.com,External,,https://micron.example/careers,Memory systems
Etched,B,yes,ashby,etched,,,,https://jobs.ashbyhq.com/etched,Transformer ASIC
Meta,A,yes,manual,,,,,https://www.metacareers.com/jobs,MTIA
Tesla (AI hardware),C,yes,manual,,,,,https://www.tesla.com/careers,AI hardware
Groq,C,no,manual,,,,,https://groq.example,disabled
`;

export const TRACKER_CSV = `id,date_found,company,title,location,score,url,source,status,applied_date,referral,resume_version,notes
wd:micron:JR111017,2026-09-29,Micron,Intern - AI Hardware and Memory Systems,"Folsom, CA",59,https://micron.wd1.myworkdayjobs.com/External/job/Folsom-CA/Intern---AI-Hardware_JR111017,Micron,new,,,,
wd:nvidia:JR2026584,2026-09-29,NVIDIA,"PhD Research Intern, AI Accelerator Design and VLSI - 2027","US, CA, Santa Clara",50,https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/PhD-Research-Intern_JR2026584,NVIDIA,new,,,,
simplify:abc-1,2026-09-29,Etched,RTL Design Intern,"San Jose, CA",12,https://jobs.ashbyhq.com/etched/11111111-2222-3333-4444-555555555555,SimplifyJobs,new,,,,
`;

export const DIGEST_MD = `# Job digest: 2026-09-29 22:09 UTC

**3 new matching role(s).** Say "process new jobs" in Claude Code to check each one against your resume.

## Strong matches (score ≥ 15)
| Score | Company | Role | Location | Posted | Why it matched |
|---|---|---|---|---|---|
| 59 | Micron | [Intern - AI Hardware and Memory Systems](https://micron.wd1.myworkdayjobs.com/External/job/Folsom-CA/Intern---AI-Hardware_JR111017) | Folsom, CA | Posted 14 Days Ago | memory system, phd, computer architecture, ai accelerator |
| 50 | NVIDIA | [PhD Research Intern, AI Accelerator Design and VLSI - 2027](https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/PhD-Research-Intern_JR2026584) | US, CA, Santa Clara | Posted Today | phd, ai accelerator, research intern, asic |

## Other matches
| 12 | Etched | [RTL Design Intern](https://jobs.ashbyhq.com/etched/11111111-2222-3333-4444-555555555555) | San Jose, CA | 2026-08-01 | rtl, asic (PhD/Master's) |

## Sources with errors
- Qualcomm (pcsx): HTTP 429 for https://careers.qualcomm.com/api
- SimplifyJobs: fetch failed

<details><summary>Run stats</summary>

- NVIDIA: 10 listed, 1 new matches
</details>`;

export const FAKE_CLAUDE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fakes', 'claude.mjs');

/** Picks the fake claude's scenario for the next runs (success | max_turns | crash | hang | chrome_disconnected | blocked_site | usage_limit | denied). */
export function fakeScenario(dataDir: string, scenario: string, delayMs = 10): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'fake-claude.json'), JSON.stringify({ scenario, delayMs }));
}

/** The fake claude's recorded calls ({argv, scenario, env}). */
export function fakeCalls(dataDir: string): { argv: string[]; scenario: string; env: Record<string, string | null> }[] {
  const f = path.join(dataDir, 'fake-claude-calls.jsonl');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
}

export interface Fixture { root: string; cfg: Config; db: DB; ctx: Ctx; gitCalls: string[][]; cleanup: () => void }

export function inboxLine(o: Record<string, unknown>): string {
  return JSON.stringify({
    // each posting its own URL (the same URL = the same posting, merged by the importer since v2)
    company: 'NVIDIA', company_priority: 'A', title: 'Hardware Intern', location: 'Santa Clara, CA', url: `https://example.com/j/${encodeURIComponent(String(o.id ?? 'x'))}`,
    source: 'NVIDIA', ats: 'workday', posted: '2026-09-28', posted_raw: 'Posted 2 Days Ago', first_seen: '2026-09-30T12:00:00.000Z',
    score: 20, hits: ['asic'], tags: ['ASIC/RTL'], flags: [], degrees: '', sponsorship: '', description: 'Build ASIC RTL.', ...o,
  });
}

/** A temp repo with companies.csv, tracker.csv, one digest, and an empty inbox. */
export function makeFixture(opts: { tracker?: boolean; git?: GitRunner; files?: Record<string, string> } = {}): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-test-'));
  const write = (rel: string, text: string) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  write('targets/companies.csv', COMPANIES_CSV);
  write('targets/people.csv', 'name,company,team_or_lab,relationship,how_met,paper_or_topic,email_or_linkedin,email_source,status,date_contacted,follow_up_due,notes\n');
  if (opts.tracker !== false) write('jobs/tracker.csv', TRACKER_CSV);
  write('jobs/digests/2026-09-29_2209.md', DIGEST_MD);
  fs.mkdirSync(path.join(root, 'jobs', 'inbox'), { recursive: true });
  for (const [rel, text] of Object.entries(opts.files || {})) write(rel, text);
  // Tests never start the real claude: runs go to the fake (tests/fakes/claude.mjs).
  const cfg = loadConfig({ repoRoot: root, dataDir: path.join(root, 'data'), port: 0, claudeCommand: FAKE_CLAUDE });
  const db = openDb(cfg.dbPath);
  const gitCalls: string[][] = [];
  const git: GitRunner = opts.git || (async (args) => { gitCalls.push(args); return { code: 0, stdout: 'Already up to date.', stderr: '' } as GitResult; });
  const wrapped: GitRunner = opts.git ? async (args, cwd) => { gitCalls.push(args); return opts.git!(args, cwd); } : git;
  const ctx: Ctx = { db, cfg, git: wrapped };
  return { root, cfg, db, ctx, gitCalls, cleanup: () => { try { db.close(); } catch { /* closed */ } fs.rmSync(root, { recursive: true, force: true }); } };
}
