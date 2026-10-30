#!/usr/bin/env node
// A fake `claude` for tests (config claudeCommand / JOBWATCHER_CLAUDE points here). It reads the prompt, emits canned
// stream-json (init → tool calls → result) and REALLY calls `node dashboard/cli …`, so database effects are real.
//
// Scenario: <JOBWATCHER_DATA>/fake-claude.json {"scenario": "...", "delayMs": 20} or env FAKE_CLAUDE_SCENARIO.
//   success | max_turns | crash | hang | chrome_disconnected | blocked_site | usage_limit | denied
// Every call is appended to <JOBWATCHER_DATA>/fake-claude-calls.jsonl ({argv, cwd, env subset}) so tests can check the args.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'cli', 'index.js');
const argv = process.argv.slice(2);

if (argv.includes('--version')) { process.stdout.write('9.9.9 (Fake Claude)\n'); process.exit(0); }

const dataDir = process.env.JOBWATCHER_DATA || path.join(process.cwd(), 'data');
let conf = {};
try { conf = JSON.parse(fs.readFileSync(path.join(dataDir, 'fake-claude.json'), 'utf8')); } catch { /* defaults */ }
const scenario = conf.scenario || process.env.FAKE_CLAUDE_SCENARIO || 'success';
const delay = Number(conf.delayMs ?? process.env.FAKE_CLAUDE_DELAY ?? 15);

const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const prompt = opt('-p') || '';
const resume = opt('--resume');
const chrome = argv.includes('--chrome');
try {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.appendFileSync(path.join(dataDir, 'fake-claude-calls.jsonl'), JSON.stringify({
    argv, cwd: process.cwd(), scenario, env: { JOBWATCHER_RUN_ID: process.env.JOBWATCHER_RUN_ID, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? null },
  }) + '\n');
} catch { /* ignore */ }

const session = resume || randomUUID();
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let turns = 0; let toolN = 0;

async function cli(...args) {
  const id = `toolu_${++toolN}`;
  const command = `node dashboard/cli ${args.map((a) => (/[\s"']/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(' ')}`;
  turns++;
  out({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] }, session_id: session });
  await sleep(delay);
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: process.env, cwd: process.cwd(), timeout: 60_000 });
  out({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: r.stdout || r.stderr, is_error: r.status !== 0 }] }, session_id: session });
  await sleep(delay);
  try { return JSON.parse(r.stdout); } catch { return {}; }
}
const say = async (text) => { out({ type: 'assistant', message: { content: [{ type: 'text', text }] }, session_id: session }); await sleep(delay); };
const result = (o) => out({
  type: 'result', subtype: 'success', is_error: false, num_turns: turns || 1, duration_ms: 1234, total_cost_usd: 0.0123, session_id: session,
  usage: { input_tokens: 1000 + turns * 10, output_tokens: 200, cache_read_input_tokens: 5000, cache_creation_input_tokens: 300 }, permission_denials: [], ...o,
});

out({
  type: 'system', subtype: 'init', session_id: session, model: opt('--model') === 'opus' ? 'claude-opus-5-5' : 'claude-sonnet-5-5', cwd: process.cwd(),
  tools: ['Read', 'Glob', 'Grep', 'Bash', 'Edit', 'Write', 'WebSearch', 'WebFetch', ...(chrome ? ['mcp__claude-in-chrome__navigate'] : [])],
  mcp_servers: chrome ? [{ name: 'claude-in-chrome', status: scenario === 'chrome_disconnected' ? 'failed' : 'connected' }] : [],
});
await sleep(delay);

const limitFrom = (re, fallback) => { const m = prompt.match(re); return m ? Number(m[1]) : fallback; };

async function main() {
  if (scenario === 'crash') { process.stderr.write('fake claude: something broke\n'); process.exit(2); }
  if (scenario === 'hang') { await say('Working on it…'); setInterval(() => undefined, 1 << 30); return; }
  if (scenario === 'usage_limit') { result({ is_error: true, result: "You've hit your usage limit · resets 3pm" }); return; }
  if (scenario === 'denied') {
    const id = 'toolu_x';
    out({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command: 'git push' } }] } });
    out({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: 'Permission to use Bash with command git push has been denied.', is_error: true }] } });
    result({ result: 'I could not push (not allowed).', permission_denials: [{ tool_name: 'Bash' }] });
    return;
  }
  if (resume) { await say(`Continuing (${prompt.includes('the owner says:') ? 'with a note' : 'no note'}).`); result({ result: 'Continued and finished.' }); return; }
  const ranking = /"process new jobs" command exactly/.test(prompt) || /Quick-rank step/.test(prompt);
  if (scenario === 'max_turns' && !ranking) { await cli('jobs', '--limit', '1'); result({ subtype: 'error_max_turns', is_error: true, result: '' }); return; }

  if (/"process new jobs" command exactly/.test(prompt) || /Quick-rank step/.test(prompt)) {
    const limit = limitFrom(/at most (\d+) jobs/, limitFrom(/--limit (\d+)/, 40));
    const quick = /Quick-rank step/.test(prompt);
    const list = quick ? await cli('jobs', '--for-ranking', '--limit', String(limit)) : await cli('jobs', '--status', 'new', '--limit', String(limit), '--sort', 'score');
    const jobs = (list.jobs || list.cards || []).slice(0, limit);
    await say(`Ranking ${jobs.length} job(s).`);
    for (const j of jobs) {
      if (scenario === 'max_turns' && turns >= 2) { result({ subtype: 'error_max_turns', is_error: true, result: '' }); return; }
      const fit = Math.max(0, Math.min(100, Number(j.score ?? 30) + 20));
      await cli('rank', j.id, '--fit', String(fit), '--reason', `Fake rank: ${j.title}`, ...(quick ? ['--stage', 'quick'] : []));
    }
    result({ result: `## Ranked ${jobs.length} jobs\n\n- Top: ${jobs[0]?.title || 'none'}` });
    return;
  }
  if (/Final-check step/.test(prompt)) {
    const ids = [...prompt.matchAll(/^\s+- (\S+): /gm)].map((m) => m[1]);
    for (const id of ids) {
      await cli('job', id);
      await cli('rank', id, '--fit', '77', '--reason', 'Fake final check: confirmed', '--stage', 'final');
    }
    result({ result: `Checked ${ids.length} jobs.` });
    return;
  }
  if (/"check manual companies" command \(CLAUDE\.md\) for ONE company only: (.+)\./.test(prompt)) {
    const company = prompt.match(/for ONE company only: (.+)\./)[1];
    if (scenario === 'blocked_site') {
      await say('The site shows a bot check.');
      await cli('manual-checked', company, '--found', '0', '--added', '0', '--result', 'blocked');
      result({ result: `${company}: blocked by a bot check. Nothing added.` });
      return;
    }
    const scratch = (prompt.match(/under (data\/scratch\/run-\d+)\//) || [])[1] || 'data';
    fs.mkdirSync(path.join(process.cwd(), scratch), { recursive: true });
    const desc = path.join(process.cwd(), scratch, 'desc.txt');
    fs.writeFileSync(desc, 'PhD intern on the memory systems team: HBM, processing-in-memory, computer architecture research. Requires PhD student status.');
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const added = await cli('job', 'add', '--company', company, '--title', 'PhD Research Intern, Memory Systems Architecture', '--url', `https://${slug}.example/jobs/pim-intern?utm_source=x`,
      '--location', 'Menlo Park, CA', '--posted', '2026-09-28', '--description-file', desc, '--source', `manual:${company}`);
    const rejected = await cli('job', 'add', '--company', company, '--title', 'Marketing Intern', '--url', `https://${slug}.example/jobs/marketing`, '--location', 'Menlo Park, CA', '--source', `manual:${company}`);
    const n = added.job ? 1 : 0;
    await cli('manual-checked', company, '--found', '2', '--added', String(n), '--result', 'ok');
    result({ result: `${company}: found 2 intern postings, added ${n}${rejected.error ? ' (1 was not a match)' : ''}.` });
    return;
  }
  if (/"cold emails(?: for <Company>)?" command as defined/.test(prompt)) {
    const count = limitFrom(/at most (\d+) new researchers/, /\(1–3 people\)/.test(prompt) ? 3 : 10);
    const ids = (prompt.match(/--ids ([\d,]+)/) || [])[1];
    const companies = (prompt.match(/--companies "([^"]+)"/) || [])[1];
    const jobId = (prompt.match(/with --job (\S+?)\.?$/m) || [])[1];
    const found = await cli('research', 'candidates', ...(ids ? ['--ids', ids] : companies ? ['--companies', companies] : ['--priority', 'A,B']), '--since', '2024', '--limit', '20');
    const scratch = (prompt.match(/under (data\/scratch\/run-\d+)\//) || [])[1] || 'data';
    fs.mkdirSync(path.join(process.cwd(), scratch), { recursive: true });
    let added = 0; let withEmail = 0;
    for (const c of (found.candidates || []).filter((x) => !x.contact_id)) {
      if (added >= count) break;
      const paper = c.papers.find((p) => p.pdf_url) || c.papers[0];
      let email = null;
      if (paper?.pdf_url) {
        const r = await cli('research', 'pdf-emails', paper.pdf_url);
        const first = c.name.split(' ')[0].toLowerCase();
        email = (r.emails || []).find((e) => e.toLowerCase().startsWith(first)) || null;
      }
      const slug = c.name.toLowerCase().replace(/[^a-z]+/g, '-');
      const contact = await cli('contact', 'add', '--name', c.name, '--company', c.company, '--relationship', 'researcher',
        ...(c.openalex_id ? ['--openalex-id', c.openalex_id] : []),
        ...(email ? ['--email', email, '--email-source', `${paper.venue} ${paper.year} paper PDF`, '--confidence', 'from_paper'] : []),
        '--linkedin', `https://www.linkedin.com/in/${slug}-example`, '--linkedin-source', `web search: "${c.name}" ${c.company} LinkedIn`,
        '--summary', `Works on ${c.topics.join(', ') || 'hardware'}.`, '--papers', JSON.stringify(c.papers.slice(0, 2).map((p) => ({ title: p.title, venue: p.venue, year: p.year, url: p.doi ? `https://doi.org/${p.doi}` : undefined }))));
      if (!contact.contact) continue;
      added++; if (email) withEmail++;
      const body = path.join(process.cwd(), scratch, `email-${contact.contact.id}.txt`);
      fs.writeFileSync(body, `Dear Dr. ${c.name.split(' ').pop()},\n\nI read your paper "${paper?.title}". My PhD work is on processing-in-memory and ECC.\n\nCV attached.\n\nBest,\nthe owner`);
      await cli('outreach', 'add', '--type', 'cold_email', '--contact', String(contact.contact.id), ...(jobId ? ['--job', jobId] : []), '--subject', `Your ${paper?.venue} paper`, '--body-file', body);
    }
    result({ result: `## Cold emails\n\n- ${added} researcher(s) added, ${withEmail} with an e-mail from the paper\n- LinkedIn links are unverified` });
    return;
  }
  if (/"weekly review" command/.test(prompt)) {
    await cli('jobs', '--limit', '3');
    await cli('mark', 'weekly_review');
    result({ result: '## Weekly review\n\n- 3 jobs looked at\n- Nothing due' });
    return;
  }
  await say('Nothing special to do in the fake.');
  result({ result: 'Done (fake).' });
}

main().catch((e) => { process.stderr.write(String(e?.stack || e)); process.exit(1); });
