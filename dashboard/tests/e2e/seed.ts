// Builds the e2e fixture: a throwaway repo folder + database with fictional jobs, contacts and outreach.
// Every person and address here is made up (example.com); nothing refers to real people.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DB } from '../../server/db';
import { loadConfig, type Config } from '../../server/config';
import { importLocal } from '../../server/sync';
import { noGit } from '../../server/git';
import { addContact, addOutreach, markSent } from '../../server/repo';
import { ResearchHttp } from '../../server/research/http';
import { s2Url, worksUrl } from '../../server/research/openalex';
import { makePdf } from '../fixtures/research/makePdf';

/** "Find R&D emails from papers" for Acme Silicon, offline: one fictional paper by two Acme authors and a university co-author. */
const ACME_DOI = '10.1109/isca88888.2026.00042';
const ACME_PDF = 'https://arxiv.example/pdf/2601.00042';
const ACME_WORKS = {
  meta: { count: 1, next_cursor: null },
  results: [{
    id: 'https://openalex.org/W9200000001', doi: `https://doi.org/${ACME_DOI}`, title: 'ECC-Protected Processing-in-Memory for LLM Inference (fixture)',
    publication_year: 2026, publication_date: '2026-06-20',
    locations: [{ source: null, raw_source_name: '2026 ACM/IEEE 53rd Annual International Symposium on Computer Architecture (ISCA)', pdf_url: null }],
    best_oa_location: null,
    authorships: [
      { author_position: 'first', author: { id: 'https://openalex.org/A9200000001', display_name: 'Morgan Fixture' }, institutions: [], raw_affiliation_strings: ['Acme Silicon, Austin, TX, USA'], countries: ['US'] },
      { author_position: 'middle', author: { id: 'https://openalex.org/A9200000002', display_name: 'Uni Coauthor' }, institutions: [{ id: 'https://openalex.org/I2', display_name: 'Example University', country_code: 'US' }], raw_affiliation_strings: ['Example University'], countries: ['US'] },
      { author_position: 'last', author: { id: 'https://openalex.org/A9200000003', display_name: 'Taylor Sample' }, institutions: [], raw_affiliation_strings: ['Acme Silicon'], countries: ['US'] },
    ],
    primary_topic: { display_name: 'Advanced Memory and Neural Computing' }, keywords: [{ display_name: 'Processing-in-memory' }],
  }],
};

function primeAcmePapers(dataDir: string): void {
  const http = new ResearchHttp({ cacheDir: path.join(dataDir, 'research-cache'), offline: true });
  for (const y of new Set([2024, new Date().getFullYear() - 2])) http.put(worksUrl({ raw: 'Acme Silicon' }, y), 200, 'application/json', JSON.stringify(ACME_WORKS));
  http.put(s2Url(ACME_DOI), 200, 'application/json', JSON.stringify({ paperId: 'y', externalIds: { DOI: ACME_DOI }, openAccessPdf: { url: ACME_PDF, status: 'GREEN' } }));
  http.put(ACME_PDF, 200, 'application/pdf', makePdf([[
    'ECC-Protected Processing-in-Memory for LLM Inference', 'Morgan Fixture, Uni Coauthor, Taylor Sample', 'Acme Silicon, Austin, TX; Example University',
    'morgan.fixture@acme.example  tsample@acme.example  uni.coauthor@university.example', 'Abstract', 'We protect PIM with ECC.',
  ]]));
}

export const E2E_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.tmp', 'e2e');

const COMPANIES = `company,priority,enabled,ats,tenant,host,site,search_terms,careers_url,fit_notes
Acme Silicon,A,yes,greenhouse,acme,,,,https://acme.example/careers,Memory systems and PIM
Beta Compute,A,yes,ashby,beta,,,,https://beta.example/careers,AI accelerators
Gamma Memory,B,yes,workday,gamma,gamma.example,External,,https://gamma.example/careers,HBM and ECC
Delta Labs,C,yes,lever,delta,,,,https://delta.example/careers,Compilers
Omega Social,A,yes,manual,,,,,https://omega.example/careers,Accelerator team; no feed
`;

const JOBS: [string, string, string, string, number, string][] = [
  // id, company, title, location, score, posted
  ['gh:acme:1', 'Acme Silicon', 'PhD Intern, Processing-in-Memory Architecture', 'Austin, TX', 58, '2026-09-25'],
  ['gh:acme:2', 'Acme Silicon', 'Memory Reliability (ECC) Research Intern', 'Austin, TX', 52, '2026-09-20'],
  ['ab:beta:3', 'Beta Compute', 'AI Accelerator Architecture Intern - PhD', 'Santa Clara, CA', 49, '2026-09-26'],
  ['ab:beta:4', 'Beta Compute', 'ML Compiler (MLIR) Intern', 'Santa Clara, CA', 44, '2026-09-10'],
  ['wd:gamma:5', 'Gamma Memory', 'HBM Design Verification Intern', 'Boise, ID', 38, '2026-08-01'],
  ['wd:gamma:6', 'Gamma Memory', 'DRAM Performance Modeling Intern', 'Boise, ID', 35, '2026-09-15'],
  ['lv:delta:7', 'Delta Labs', 'Compiler Research Intern (LLVM)', 'Remote, US', 30, '2026-09-01'],
  ['lv:delta:8', 'Delta Labs', 'RTL Design Intern', 'Remote, US', 22, '2026-09-18'],
  ['gh:acme:9', 'Acme Silicon', 'GPU Kernel Performance Intern', 'Austin, TX', 20, '2026-09-22'],
  ['ab:beta:10', 'Beta Compute', 'Hardware Security Intern (clearance required)', 'Arlington, VA', 12, '2026-09-12'],
];

/** Writes the fixture repo files (companies.csv, inbox, digest, last_run.json, a fake resume). */
export function seedFiles(root = E2E_ROOT): void {
  fs.mkdirSync(root, { recursive: true });
  for (const d of ['jobs', 'targets', 'watcher', 'Resume']) fs.rmSync(path.join(root, d), { recursive: true, force: true });
  const w = (rel: string, text: string) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  w('targets/companies.csv', COMPANIES);
  w('targets/openalex_institutions.json', JSON.stringify({ _about: 'e2e fixture', 'Acme Silicon': { raw: ['Acme Silicon'] } }));
  w('targets/people.csv', 'name,company,team_or_lab,relationship,how_met,paper_or_topic,email_or_linkedin,email_source,status,date_contacted,follow_up_due,notes\n');
  w('Resume/Resume.pdf', '%PDF-1.4 fixture');
  const inbox = JOBS.map(([id, company, title, location, score, posted], i) => JSON.stringify({
    id, company, title, location, url: `https://${company.split(' ')[0].toLowerCase()}.example/jobs/${i + 1}`, source: company, posted,
    first_seen: '2026-09-29T22:09:00.000Z', score, hits: ['phd'],
    description: i % 3 === 2 ? '' : `<p>Join the ${company} team working on ${title.toLowerCase()}.</p><ul><li>PhD student in EE/CE</li><li>Verilog or C++</li></ul>`,
  })).join('\n') + '\n';
  w('jobs/inbox/2026-09-29_2209.jsonl', inbox);
  w('jobs/digests/2026-09-29_2209.md', '# Job digest: 2026-09-29 22:09 UTC\n\n**10 new matching role(s).**\n');
  w('watcher/state/last_run.json', JSON.stringify({ at: new Date(Date.now() - 3 * 3600e3).toISOString(), matches: 10, errors: [], stats: [] }));
}

export const FAKE_CLAUDE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fakes', 'claude.mjs');

/** The e2e server runs the fake claude (tests/fakes/claude.mjs), never the real one. */
export const e2eConfig = (root = E2E_ROOT): Config => loadConfig({ repoRoot: root, dataDir: path.join(root, 'data'), port: Number(process.env.PORT || 5188), claudeCommand: FAKE_CLAUDE });

/** Empties the database and loads the fixture (jobs from the inbox, then contacts and outreach). */
export function seedDb(db: DB, cfg: Config): void {
  db.exec('DELETE FROM runs; DELETE FROM outreach; DELETE FROM contacts; DELETE FROM events; DELETE FROM imports; DELETE FROM jobs; DELETE FROM companies; DELETE FROM manual_checks; DELETE FROM job_aliases; DELETE FROM settings; DELETE FROM research_candidates;');
  for (const f of ['fake-claude.json']) fs.rmSync(path.join(cfg.dataDir, f), { force: true });
  importLocal({ db, cfg, git: noGit });
  db.exec('DELETE FROM company_notes; DELETE FROM paper_email_searches;');
  primeAcmePapers(cfg.dataDir);

  // Referral side: a friend at Acme with a ready draft; a DAC contact at Beta, message sent 9 days ago (follow-up due).
  const friend = addContact(db, { name: 'Sam Friend', company: 'Acme Silicon', relationship: 'friend', linkedin_url: 'https://www.linkedin.com/in/sam-friend-example' });
  addOutreach(db, { type: 'referral', contact_id: friend.id, job_id: 'gh:acme:2', body: 'Hi Sam, hope you are well! I am applying to the Memory Reliability (ECC) Research Intern role at Acme. Would you be open to referring me?', status: 'ready' });
  const dac = addContact(db, { name: 'Riley Dac', company: 'Beta Compute', relationship: 'dac', linkedin_url: 'https://www.linkedin.com/in/riley-dac-example' });
  const sentRef = addOutreach(db, { type: 'referral', contact_id: dac.id, job_id: 'ab:beta:3', body: 'Hi Riley, great to meet you at DAC. Would you refer me for the AI Accelerator Architecture Intern role?' });
  markSent(db, sentRef.id);
  const nineDaysAgo = new Date(Date.now() - 9 * 86400e3);
  const p = (n: number) => String(n).padStart(2, '0');
  const local = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  db.prepare('UPDATE outreach SET sent_at = ?, follow_up_due = ? WHERE id = ?').run(nineDaysAgo.toISOString(), local(new Date(Date.now() - 2 * 86400e3)), sentRef.id);

  // Cold-email side: one address from a paper, one pattern guess.
  const r1 = addContact(db, {
    name: 'Dr. Alex Example', company: 'Gamma Memory', title_or_lab: 'Memory Pathfinding', relationship: 'researcher', email: 'alex.example@gamma.example',
    email_source: 'ISCA 2026 paper PDF (fixture)', email_confidence: 'from_paper', work_summary: 'Studies near-memory processing for LLM inference on HBM stacks.',
    linkedin_url: 'https://www.linkedin.com/in/alex-example-fixture', linkedin_confidence: 'search_match', linkedin_source: 'web search: "Alex Example" Gamma Memory LinkedIn',
    papers: [{ title: 'Near-HBM Processing for LLM Decoding (fixture)', venue: 'ISCA', year: 2026, url: 'https://doi.example/isca26' }],
  });
  addOutreach(db, {
    type: 'cold_email', contact_id: r1.id, job_id: 'wd:gamma:6', subject: 'Question about your ISCA 2026 near-HBM paper',
    body: 'Dear Dr. Example,\n\nI read your ISCA 2026 paper on near-HBM processing with great interest. My PhD work at UF is on in-memory computing and ECC for AI hardware.\n\nWould you have 15 minutes to chat about Summer 2027 internships on your team?\n\nBest regards,\nYour Name\n(CV attached)',
    status: 'ready',
  });
  const r2 = addContact(db, {
    name: 'Dr. Jordan Guess', company: 'Delta Labs', title_or_lab: 'Compiler Research', relationship: 'researcher', email: 'jordan.guess@delta.example',
    email_source: 'first.last pattern (fixture)', email_confidence: 'pattern_guess', work_summary: 'Works on MLIR dialects for accelerators.',
    papers: [{ title: 'An MLIR Dialect for PIM (fixture)', venue: 'CGO', year: 2026 }],
  });
  addOutreach(db, { type: 'cold_email', contact_id: r2.id, subject: 'MLIR for PIM', body: 'Dear Dr. Guess,\n\nShort note about MLIR and PIM.\n\nBest,\nthe owner', status: 'draft' });

  // Research candidates from papers (P6), fictional.
  const at = new Date().toISOString();
  const cand = db.prepare(`INSERT INTO research_candidates(openalex_id, name, company, institution, country, papers_json, topics_json, score, status, first_seen, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`);
  const paper = (title: string, venue: string, position: string, topics: string[]) => JSON.stringify([{ title, venue, year: 2026, doi: null, url: null, pdf_url: null, position, topics }]);
  cand.run('A9100000001', 'Casey Candidate', 'Gamma Memory', 'Gamma Memory Inc.', 'US', paper('ECC-Aware Near-Memory Accelerators (fixture)', 'MICRO', 'first', ['PIM/CIM', 'Reliability/ECC']), '["PIM/CIM","Reliability/ECC"]', 81, at, at);
  cand.run('A9100000002', 'Drew Candidate', 'Delta Labs', 'Delta Labs', 'US', paper('MLIR Scheduling for PIM (fixture)', 'ASPLOS', 'last', ['Compilers/MLIR', 'PIM/CIM']), '["Compilers/MLIR","PIM/CIM"]', 64, at, at);
  cand.run('A9100000003', 'Eli Candidate', 'Gamma Memory', 'Gamma Memory GmbH', 'DE', paper('HBM Refresh Study (fixture)', 'HPCA', 'middle', ['Memory systems']), '["Memory systems"]', 38, at, at);
}
