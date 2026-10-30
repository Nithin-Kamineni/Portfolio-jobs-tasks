/** @vitest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APP_INFO, CLAUDE_STEPS, stepById, weekStart, type StepContext } from '../../web/src/claudeSteps';
import { ClaudeStepDialog, useClaudeSteps } from '../../web/src/components/ClaudeSteps';
import { FACTS, META, mockApi, renderWithApp } from './testUtils';
import type { ClaudeFacts } from '../../shared/types';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const FRIDAY = new Date(2026, 9, 2, 10); // Fri 2 Oct 2026
const MONDAY = new Date(2026, 8, 28, 10);

/** Facts under which every step is active. */
const ALL_ACTIVE: ClaudeFacts = {
  ...FACTS, newCount: 12, toPrepare: [{ id: 'a:1', company: 'Acme', title: 'PIM Intern', status: 'apply_referral' }],
  referralRequested: [], referralNoContact: ['Acme'], followUpsDue: 2, researcherCount: 7,
  watcherErrors: ['Qualcomm (pcsx): HTTP 429'], lastWeeklyReview: null, lastManualCheck: null, manualCompanies: ['Meta', 'Tesla'], manualDue: ['Meta', 'Tesla'],
};
const CTX: StepContext = { now: FRIDAY, repoFolder: 'C:\\profitional\\Applications' };

describe('claudeSteps.ts conditions', () => {
  it('every step is active under ALL_ACTIVE and none under quiet facts', () => {
    for (const s of CLAUDE_STEPS) expect(s.active(ALL_ACTIVE, CTX), s.id).toBe(true);
    const quiet: ClaudeFacts = { ...FACTS, lastWeeklyReview: FRIDAY.toISOString(), lastManualCheck: FRIDAY.toISOString() };
    for (const s of CLAUDE_STEPS) expect(s.active(quiet, CTX), s.id).toBe(false);
  });

  it('weekStart is the Monday of the week (used by the "this week" usage totals)', () => {
    expect(weekStart(FRIDAY).getDay()).toBe(1);
  });

  it('manual companies: active while a company is due (server setting), hidden by the setting', () => {
    const s = stepById('check-manual-companies');
    expect(s.active({ ...FACTS, manualDue: ['Meta'] }, CTX)).toBe(true);
    expect(s.active({ ...FACTS, manualDue: [] }, CTX)).toBe(false);
    expect(s.active({ ...FACTS, manualDue: ['Meta'] }, { ...CTX, hideManualCompanies: true })).toBe(false);
    expect(s.task).toBe('check-manual-companies');
  });

  it('only the steps that still exist: no decision, outreach or open-posting hand-offs (2026-10-17)', () => {
    expect(CLAUDE_STEPS.map((s) => s.id)).toEqual(['process-new-jobs', 'fix-watcher-errors', 'check-manual-companies']);
    expect(CLAUDE_STEPS.every((s) => !('autoOn' in s))).toBe(true);
  });


  it('every command in claudeSteps.ts is documented in CLAUDE.md', () => {
    const claudeMd = fs.readFileSync(path.resolve(__dirname, '../../../CLAUDE.md'), 'utf8');
    for (const s of CLAUDE_STEPS.filter((x) => x.commandDoc)) {
      expect(claudeMd, `CLAUDE.md is missing "${s.commandDoc}"`).toContain(`**"${s.commandDoc}"**`);
    }
  });
});

describe('ClaudeStepDialog: correct app, folder, command and copy button for every step', () => {
  for (const step of CLAUDE_STEPS) {
    it(step.id, async () => {
      const user = userEvent.setup();
      mockApi({ 'GET /claude-facts': ALL_ACTIVE, 'GET /meta': META });
      const onCopy = vi.fn(); const onCopyClose = vi.fn(); const onDone = vi.fn(); const onClose = vi.fn();
      renderWithApp(<ClaudeStepDialog step={step} facts={ALL_ACTIVE} ctx={CTX} waiting={false} syncing={false}
        onClose={onClose} onCopy={onCopy} onCopyClose={onCopyClose} onDone={onDone} />);
      const dlg = await screen.findByRole('dialog');
      expect(within(dlg).getByTestId('step-app')).toHaveTextContent(APP_INFO[step.app].label);
      expect(within(dlg).getByText(APP_INFO[step.app].where)).toBeInTheDocument();
      const command = step.command(ALL_ACTIVE, CTX);
      if (step.app === 'claude-code') expect(within(dlg).getByTestId('step-place')).toHaveTextContent('Open the folder C:\\profitional\\Applications');
      else expect(within(dlg).getByTestId('step-place')).toHaveTextContent(/Chrome/);
      expect(within(dlg).getByTestId('step-command')).toHaveTextContent(command);
      await user.click(within(dlg).getByRole('button', { name: `Copy "${command}"` }));
      expect(onCopy).toHaveBeenCalledWith(command);
      await user.click(within(dlg).getByRole('button', { name: /Copy & close/ }));
      expect(onCopyClose).toHaveBeenCalledWith(command);
      await user.click(within(dlg).getByRole('button', { name: "I've done it" }));
      expect(onDone).toHaveBeenCalled();
      expect(within(dlg).queryByRole('button', { name: 'Remind me later' })).not.toBeInTheDocument();
    });
  }
});

/** A page with a "Show me" button (the only way a step dialog opens). */
function StepsPage() {
  const { facts, isActive, openStep } = useClaudeSteps();
  return <><div data-testid="active">{facts && isActive('process-new-jobs') ? 'yes' : 'no'}</div><button onClick={() => openStep('process-new-jobs')}>Show me</button></>;
}

async function showMe(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByTestId('active')).toHaveTextContent('yes'));
  await user.click(screen.getByRole('button', { name: 'Show me' }));
  return screen.findByRole('dialog');
}

describe('ClaudeStepsProvider', () => {
  const facts: ClaudeFacts = { ...FACTS, newCount: 5 };

  it('never opens a dialog by itself (2026-10-17: no pop-ups), even while a step is pending', async () => {
    mockApi({ 'GET /claude-facts': facts, 'GET /meta': META });
    renderWithApp(<StepsPage />, { now: () => MONDAY });
    await waitFor(() => expect(screen.getByTestId('active')).toHaveTextContent('yes'));
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Show me" opens the step: Run it now, or do it yourself', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /claude-facts': facts, 'GET /meta': META });
    renderWithApp(<StepsPage />, { now: () => MONDAY });
    const dlg = await showMe(user);
    expect(within(dlg).getByRole('button', { name: 'Run it now' })).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: "I'll do it myself in Claude Code" }));
    expect(within(dlg).getByTestId('step-command')).toHaveTextContent('process new jobs');
  });

  it('"I\'ve done it" runs a Sync; while the condition holds it says "Still waiting for Claude…"', async () => {
    const user = userEvent.setup();
    const api = mockApi({ 'GET /claude-facts': facts, 'GET /meta': META, 'POST /sync': { at: '', pulled: true, warning: null, importedFiles: [], importedJobs: 0, exportWarning: null } });
    renderWithApp(<StepsPage />, { now: () => MONDAY });
    const dlg = await showMe(user);
    await user.click(within(dlg).getByRole('button', { name: "I'll do it myself in Claude Code" }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: "I've done it" }));
    await waitFor(() => expect(api.find('POST', '/sync')).toHaveLength(1));
    expect(await screen.findByTestId('step-waiting')).toHaveTextContent('Still waiting for Claude…');
  });

  it('closes by itself once Claude is done', async () => {
    const user = userEvent.setup();
    let current: ClaudeFacts = facts;
    mockApi({ 'GET /claude-facts': () => current, 'GET /meta': META, 'POST /sync': () => { current = { ...facts, newCount: 0 }; return {}; } });
    renderWithApp(<StepsPage />, { now: () => MONDAY });
    const dlg = await showMe(user);
    await user.click(within(dlg).getByRole('button', { name: "I'll do it myself in Claude Code" }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: "I've done it" }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Done: Rank the new jobs')).toBeInTheDocument();
  });

});
