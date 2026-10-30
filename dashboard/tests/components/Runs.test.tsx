/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaudeTouchedChip, RunButton, RunPill, useRuns } from '../../web/src/components/Runs';
import { ClaudeStepDialog, useClaudeSteps } from '../../web/src/components/ClaudeSteps';
import { CLAUDE_STEPS, type StepContext } from '../../web/src/claudeSteps';
import { markdownToHtml } from '../../web/src/lib/markdown';
import { finishedLine, progressText } from '../../web/src/runs/taskInfo';
import { weekTotals } from '../../web/src/pages/RunsPage';
import { FACTS, META, mockApi, renderWithApp } from './testUtils';
import type { ClaudeFacts, Preflight, Run } from '../../shared/types';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const PF_OK: Preflight = { ok: true, command: 'claude', resolved: 'claude.exe', version: '2.1.263 (Claude Code)', loggedIn: true, message: null, lastChromeRunAt: null, checkedAt: '' };
const counters = { ranked: 0, statuses: 0, outreach: 0, contacts: 0, jobsAdded: 0, fetched: 0, notes: 0, toolCalls: 0, denied: 0 };

function run(o: Partial<Run> = {}): Run {
  return {
    id: 5, task: 'process-new-jobs', params: { limit: 25 }, status: 'running', created_at: new Date().toISOString(), started_at: new Date(Date.now() - 65_000).toISOString(),
    finished_at: null, pid: 1, session_id: 's1', parent_id: null, summary: null, result_subtype: null, num_turns: null, usage_usd: null, error: null,
    label: 'Process new jobs', activity: 'ranking jobs',
    progress: {
      steps: [{ at: new Date().toISOString(), text: 'Ranking wd:nvidia:1: fit 82', kind: 'tool' }], counters: { ...counters, ranked: 7 }, target: 25, malformed: 0,
      lastText: 'Ranking the NVIDIA posting next.', model: 'claude-sonnet-5',
    },
    ...o,
  };
}

const withDetail = (r: Run) => ({ [`GET /runs/${r.id}`]: { ...r, children: [] } });

describe('run pill and panel', () => {
  it('pill shows the activity and progress; the panel shows live steps, Claude\'s message and Cancel', async () => {
    const user = userEvent.setup();
    const r = run();
    const api = mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': { runs: [r], paused: null }, ...withDetail(r), 'POST /runs/5/cancel': { ...r, status: 'running' } });
    renderWithApp(<RunPill />);
    const pill = await screen.findByTestId('run-pill');
    expect(pill).toHaveTextContent('✦ Claude: ranking jobs · 7/25');
    await user.click(pill);
    const panel = await screen.findByRole('dialog', { name: 'Claude run' });
    expect(within(panel).getByTestId('run-status')).toHaveTextContent('Running');
    expect(within(panel).getByTestId('run-last-text')).toHaveTextContent('Ranking the NVIDIA posting next.');
    expect(within(panel).getByTestId('run-steps')).toHaveTextContent('Ranking wd:nvidia:1: fit 82');
    expect(within(panel).getByRole('link', { name: 'Open log' })).toHaveAttribute('href', '/api/runs/5/log');
    await user.click(within(panel).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(api.find('POST', '/runs/5/cancel')).toHaveLength(1));
  });

  it('a finished run: rendered summary, counts, turns, usage (API-equivalent); Continue sends the owner\'s note', async () => {
    const user = userEvent.setup();
    const r = run({
      status: 'needs_user', finished_at: new Date().toISOString(), num_turns: 25, usage_usd: 0.42, error: 'Claude stopped after 25 turns (the limit for this task). Click Continue…',
      summary: '## Ranked 7 jobs\n\n- **NVIDIA**: fit 82\n- <script>alert(1)</script>',
      progress: { ...run().progress, usage: { input_tokens: 1000, output_tokens: 2000, cache_read_input_tokens: 40000, cache_creation_input_tokens: 7000 } },
    });
    const api = mockApi({
      'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': { runs: [r], paused: null }, ...withDetail(r),
      'POST /runs/5/continue': { run: run({ id: 6, status: 'queued' }), deduped: false }, 'GET /runs/6': { ...run({ id: 6, status: 'queued' }), children: [] },
    });
    function Open() { const { openPanel } = useRuns(); return <button onClick={() => openPanel(5)}>open</button>; }
    renderWithApp(<Open />);
    await user.click(screen.getByRole('button', { name: 'open' }));
    const panel = await screen.findByRole('dialog', { name: 'Claude run' });
    expect(await within(panel).findByTestId('run-summary')).toBeInTheDocument();
    const summary = within(panel).getByTestId('run-summary');
    expect(summary.querySelector('h4')).toHaveTextContent('Ranked 7 jobs');
    expect(summary.querySelector('strong')).toHaveTextContent('NVIDIA');
    expect(summary.innerHTML).not.toContain('<script');
    expect(within(panel).getByTestId('run-error')).toHaveTextContent(/25 turns/);
    const counts = within(panel).getByTestId('run-counts');
    expect(counts).toHaveTextContent('7 ranked');
    expect(counts).toHaveTextContent('25 turns');
    expect(counts).toHaveTextContent('50k tokens');
    expect(counts).toHaveTextContent('usage (API-equivalent) $0.42');
    expect(within(panel).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    await user.type(within(panel).getByLabelText('Tell Claude (optional)'), 'Skip the Tesla jobs');
    await user.click(within(panel).getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(api.find('POST', '/runs/5/continue')[0]?.body).toEqual({ note: 'Skip the Tesla jobs' }));
  });

  it('pipeline steps are listed with their status', async () => {
    const user = userEvent.setup();
    const r = run({ progress: { ...run().progress, pipeline: [
      { key: 'sync', label: 'Sync', status: 'done', detail: '3 new jobs' }, { key: 'rules', label: 'Rule-based pre-ranking', status: 'running' },
      { key: 'final', label: 'Final check', status: 'pending' },
    ] } });
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': { runs: [r], paused: null }, ...withDetail(r) });
    renderWithApp(<RunPill />);
    await user.click(await screen.findByTestId('run-pill'));
    const panel = await screen.findByRole('dialog', { name: 'Claude run' });
    expect(within(panel).getByTestId('pipeline-sync')).toHaveAttribute('data-status', 'done');
    expect(within(panel).getByTestId('pipeline-sync')).toHaveTextContent('3 new jobs');
    expect(within(panel).getByTestId('pipeline-rules')).toHaveAttribute('data-status', 'running');
    expect(within(panel).getByTestId('pipeline-final')).toHaveAttribute('data-status', 'pending');
  });

  it('when the run finishes: "Claude finished: ranked N jobs" with View summary', async () => {
    const user = userEvent.setup();
    let current = run({ progress: { ...run().progress, counters: { ...counters, ranked: 2 }, target: 3 } });
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': () => ({ runs: [current], paused: null }), 'GET /runs/5': () => ({ ...current, children: [] }) });
    renderWithApp(<RunPill />);
    expect(await screen.findByTestId('run-pill')).toHaveTextContent('2/3');
    current = { ...current, status: 'succeeded', finished_at: new Date().toISOString(), summary: 'Done', progress: { ...current.progress, counters: { ...counters, ranked: 3 } } };
    expect(await screen.findByText('Claude finished: ranked 3 jobs', undefined, { timeout: 4000 })).toBeInTheDocument(); // polled (no EventSource in jsdom)
    expect(screen.queryByTestId('run-pill')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View summary' }));
    expect(await screen.findByRole('dialog', { name: 'Claude run' })).toBeInTheDocument();
  });

  it('paused queue: the pill says so', async () => {
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': { runs: [run({ status: 'needs_user' })], paused: { until: new Date(Date.now() + 3600e3).toISOString(), reason: 'Paused: plan usage limit' } } });
    renderWithApp(<RunPill />);
    expect(await screen.findByTestId('run-pill')).toHaveTextContent(/Claude paused: plan usage limit, resumes in 1 hour/);
  });
});

describe('starting runs', () => {
  it('RunButton: preflight OK → POST /runs; no panel opens by itself; disabled with a tooltip while that task runs', async () => {
    const user = userEvent.setup();
    const started = run({ id: 9, task: 'follow-ups', label: 'Draft follow-ups', activity: 'drafting follow-ups', status: 'queued', params: {}, progress: { steps: [], counters, malformed: 0 } });
    let list: Run[] = [];
    const api = mockApi({
      'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': () => ({ runs: list, paused: null }), 'GET /runs/preflight': PF_OK,
      'POST /runs': () => { list = [started]; return { run: started, deduped: false }; }, 'GET /runs/9': { ...started, children: [] },
    });
    renderWithApp(<RunButton task="follow-ups">Draft follow-ups</RunButton>);
    await user.click(await screen.findByRole('button', { name: 'Draft follow-ups' }));
    await waitFor(() => expect(api.find('POST', '/runs')[0]?.body).toEqual({ task: 'follow-ups', params: {} }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Draft follow-ups' })).toBeDisabled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: 'Draft follow-ups' }).parentElement!);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Claude is already doing this');
  });

  it('a long run (90 new jobs) starts at once: no "This may take a while" dialog', async () => {
    const user = userEvent.setup();
    const started = run({ id: 3, status: 'queued' });
    const api = mockApi({
      'GET /claude-facts': { ...FACTS, newCount: 90 }, 'GET /meta': META, 'GET /runs': { runs: [], paused: null }, 'GET /runs/preflight': PF_OK,
      'POST /runs': { run: started, deduped: false }, 'GET /runs/3': { ...started, children: [] },
    });
    renderWithApp(<RunButton task="process-new-jobs">Process new jobs</RunButton>);
    await waitFor(() => expect(api.find('GET', '/claude-facts').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'Process new jobs' }));
    await waitFor(() => expect(api.find('POST', '/runs')).toHaveLength(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preflight fails → an inline message under the button (no dialog), no run; "Check again" clears it once ready', async () => {
    const user = userEvent.setup();
    let pf: Preflight = { ...PF_OK, ok: false, message: 'Claude Code was not found ("claude"). … run `claude`, log in once, then try again.' };
    const api = mockApi({
      'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /runs': { runs: [], paused: null }, 'GET /runs/preflight': () => pf,
    });
    renderWithApp(<RunButton task="follow-ups">Draft follow-ups</RunButton>);
    await user.click(await screen.findByRole('button', { name: 'Draft follow-ups' }));
    expect(await screen.findByTestId('preflight-message')).toHaveTextContent(/log in once, then try again/);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.find('POST', '/runs')).toHaveLength(0);
    pf = PF_OK;
    await user.click(screen.getByRole('button', { name: 'Check again' }));
    await waitFor(() => expect(screen.queryByTestId('preflight-message')).not.toBeInTheDocument());
  });
});

describe('hand-off dialogs: Run it now vs I\'ll do it myself', () => {
  const ALL: ClaudeFacts = { ...FACTS, newCount: 12, toPrepare: [{ id: 'a:1', company: 'Acme', title: 'PIM Intern', status: 'apply_referral' }], referralNoContact: ['Acme'], followUpsDue: 2, researcherCount: 7, watcherErrors: ['X: 429'] };
  const CTX: StepContext = { now: new Date(2026, 9, 2, 10), repoFolder: 'C:\\profitional\\Applications' };
  for (const step of CLAUDE_STEPS.filter((s) => s.task)) {
    it(step.id, async () => {
      const user = userEvent.setup();
      mockApi({ 'GET /claude-facts': ALL, 'GET /meta': META });
      const onRun = vi.fn(); const onCopyClose = vi.fn();
      renderWithApp(<ClaudeStepDialog step={step} facts={ALL} ctx={CTX} waiting={false} syncing={false} onRun={onRun}
        onClose={vi.fn()} onCopy={vi.fn()} onCopyClose={onCopyClose} onDone={vi.fn()} />);
      const dlg = await screen.findByRole('dialog');
      expect(within(dlg).getByText(/Next step for Claude/)).toBeInTheDocument();
      expect(within(dlg).getByTestId('step-why')).toHaveTextContent(step.why(ALL, CTX));
      expect(within(dlg).queryByTestId('step-command')).not.toBeInTheDocument();
      await user.click(within(dlg).getByRole('button', { name: 'Run it now' }));
      expect(onRun).toHaveBeenCalledTimes(1);
      await user.click(within(dlg).getByRole('button', { name: "I'll do it myself in Claude Code" }));
      expect(within(dlg).getByTestId('step-command')).toHaveTextContent(step.command(ALL, CTX));
      await user.click(within(dlg).getByRole('button', { name: /Copy & close/ }));
      expect(onCopyClose).toHaveBeenCalledWith(step.command(ALL, CTX));
      await user.click(within(dlg).getByRole('button', { name: 'Back' }));
      expect(within(dlg).getByRole('button', { name: 'Run it now' })).toBeInTheDocument();
    });
  }

  it('the provider\'s "Run it now" closes the dialog and starts the step\'s task with its parameters', async () => {
    const user = userEvent.setup();
    const started = run({ id: 4, task: 'process-new-jobs', params: {}, status: 'queued', label: 'Process new jobs' });
    const api = mockApi({
      'GET /claude-facts': ALL, 'GET /meta': META, 'GET /runs': { runs: [], paused: null }, 'GET /runs/preflight': PF_OK,
      'POST /runs': { run: started, deduped: false }, 'GET /runs/4': { ...started, children: [] },
    });
    function Opener() { const c = useClaudeSteps(); return <button onClick={() => c.openStep('process-new-jobs')}>open</button>; }
    renderWithApp(<Opener />);
    await waitFor(() => expect(api.find('GET', '/claude-facts').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Run it now' }));
    await waitFor(() => expect(api.find('POST', '/runs')[0]?.body).toEqual({ task: 'process-new-jobs', params: {} }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('helpers', () => {
  it('"✦ Claude" chip only within an hour of a Claude write', () => {
    const now = Date.now();
    const { rerender } = renderWithApp(<ClaudeTouchedChip at={new Date(now - 10 * 60e3).toISOString()} now={now} />);
    expect(screen.getByTestId('claude-touched')).toHaveTextContent('✦ Claude');
    rerender(<ClaudeTouchedChip at={new Date(now - 2 * 3600e3).toISOString()} now={now} />);
    expect(screen.queryByTestId('claude-touched')).not.toBeInTheDocument();
    rerender(<ClaudeTouchedChip at={null} now={now} />);
    expect(screen.queryByTestId('claude-touched')).not.toBeInTheDocument();
  });

  it('markdown: headings, lists, bold, code, links; scripts and handlers removed', () => {
    const html = markdownToHtml('# Title\n\nSome **bold** and `code`.\n\n- one\n- [two](https://x.example)\n\n1. first\n\n<img src=x onerror=alert(1)>');
    expect(html).toContain('<h3>Title</h3>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<ul><li>one</li><li><a href="https://x.example" target="_blank" rel="noopener noreferrer">two</a></li></ul>');
    expect(html).toContain('<ol><li>first</li></ol>');
    expect(html).not.toMatch(/<img/); // raw HTML is shown as text, never rendered
    const table = markdownToHtml('Ranked:\n\n| Job | Fit |\n|---|---|\n| Micron | **88** |\n| AWS | 70 |\nDone.');
    expect(table).toContain('<table><thead><tr><th>Job</th><th>Fit</th></tr></thead><tbody><tr><td>Micron</td><td><strong>88</strong></td></tr><tr><td>AWS</td><td>70</td></tr></tbody></table>');
    expect(table).toContain('<p>Done.</p>');
    expect(html).toContain('&lt;img');
  });

  it('progress text, finished line, week totals', () => {
    expect(progressText(run())).toBe('7/25');
    expect(progressText(run({ task: 'cold-emails', progress: { ...run().progress, target: undefined, counters: { ...counters, contacts: 3 } } }))).toBe('3 researchers');
    expect(progressText(run({ task: 'weekly-review' }))).toBe('');
    expect(finishedLine(run({ status: 'succeeded' }))).toBe('Claude finished: ranked 7 jobs');
    expect(finishedLine(run({ status: 'failed' }))).toBe("Claude couldn't finish: Process new jobs");
    const monday = new Date(2026, 8, 28, 9);
    const runs = [run({ created_at: new Date(2026, 8, 29).toISOString(), usage_usd: 0.5, progress: { ...run().progress, usage: { input_tokens: 1000, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }),
      run({ id: 2, created_at: new Date(2026, 8, 20).toISOString(), usage_usd: 9 })];
    expect(weekTotals(runs, new Date(monday.getTime() + 3 * 86400e3))).toEqual({ runs: 1, tokens: 1000, usd: 0.5 });
  });
});
