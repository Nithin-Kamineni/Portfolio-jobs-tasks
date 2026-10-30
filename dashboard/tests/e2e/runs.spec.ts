// Claude runs from the dashboard, end to end, with the fake claude (tests/fakes/claude.mjs): it calls the real CLI,
// so jobs really get ranked in the e2e database. Since 2026-10-17 nothing opens by itself: the Run panel opens from the
// app-bar pill, "View summary", or a row on the Claude runs page.
import AxeBuilder from '@axe-core/playwright';
import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect, suppressAutoDialogs } from './fixtures';

/** Starts a task through the API (there is no weekly-review button any more) and returns the run id. */
async function startRun(request: APIRequestContext, task: string): Promise<number> {
  const res = await request.post('/api/runs', { data: { task, params: {} } });
  expect(res.ok()).toBe(true);
  return (await res.json()).run.id as number;
}
/** Opens a run's panel from the Claude runs page (works whether it is still running or done). */
async function openRun(page: Page, id: number) {
  await page.goto('/runs');
  await page.locator(`.MuiDataGrid-row[data-id="${id}"]`).click();
  return page.getByRole('dialog', { name: 'Claude run' });
}

test('Process new jobs: the pill shows the step, jobs become ranked without a reload, then the summary', async ({ page, request }) => {
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'success', delayMs: 80 } });
  await suppressAutoDialogs(page);
  await page.goto('/jobs');
  await expect(page.getByRole('button', { name: /^To decide 10/ })).toBeVisible();
  await expect(page.locator('.MuiDataGrid-row').first()).toBeVisible();
  await page.getByRole('button', { name: 'Process new jobs' }).click();

  // No "This may take a while" dialog and no panel by itself: the pill shows the run; clicking it opens the panel.
  const pill = page.getByTestId('run-pill');
  await expect(pill).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await pill.click();
  const panel = page.getByRole('dialog', { name: 'Claude run' });
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('pipeline-sync')).toHaveAttribute('data-status', 'done', { timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(pill).toContainText(/Claude: ranking jobs · (Manual companies|Rule-based|Quick rank|Final check)/);

  // The grid updates while Claude works: the "Ranked" filter count goes up without a reload.
  await expect(page.getByRole('button', { name: /^Ranked [1-9]/ })).toBeVisible({ timeout: 25_000 });
  // 10 seeded jobs + the posting the manual-company run (Omega Social) added
  await expect(page.getByText('Claude finished: ranked 11 new jobs')).toBeVisible({ timeout: 40_000 });
  await expect(pill).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Ranked 11/ })).toBeVisible();
  await expect(page.getByTestId('claude-touched').first()).toBeVisible(); // "✦ Claude" on the rows it just ranked
  await expect(page.getByTestId('rank-stage').first()).toBeVisible(); // quick / checked markers next to the fit

  await page.getByRole('button', { name: 'View summary' }).click();
  await expect(panel.getByTestId('run-status')).toHaveText('Done');
  await expect(panel.getByTestId('run-summary')).toContainText('Ranked 11 new jobs');
  await expect(panel.getByTestId('run-counts')).toContainText('ranked');
  await expect(panel.getByTestId('run-counts')).toContainText('usage (API-equivalent)');

  // …and the Runs page lists it
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Claude runs' }).click();
  await expect(page.locator('.MuiDataGrid-row').first()).toContainText('Process new jobs');
  await expect(page.locator('.MuiDataGrid-row').first()).toContainText('Done');
  await expect(page.getByTestId('week-totals')).toContainText('1 run');
});

test('the Home countdown\'s "Process new jobs" starts the run; a second click on the same task is disabled', async ({ page, request }) => {
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'hang' } });
  await page.goto('/');
  await page.getByTestId('search-countdown').getByRole('button', { name: 'Process new jobs' }).click();
  await expect(page.getByTestId('run-pill')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Process new jobs' })).toBeDisabled();
  await page.mouse.move(0, 0); // the pointer is still on the button from the click (no panel covers it any more)
  await page.getByRole('button', { name: 'Process new jobs' }).locator('..').hover();
  await expect(page.getByRole('tooltip')).toHaveText('Claude is already doing this');
});

test('cancel a hanging run', async ({ page, request }) => {
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'hang' } });
  await suppressAutoDialogs(page);
  await startRun(request, 'weekly-review');
  await page.goto('/');
  await page.getByTestId('run-pill').click();
  const panel = page.getByRole('dialog', { name: 'Claude run' });
  await expect(panel.getByTestId('run-last-text')).toContainText('Working on it');
  await panel.getByRole('button', { name: 'Cancel' }).click();
  await expect(panel.getByTestId('run-status')).toHaveText('Cancelled', { timeout: 15_000 });
  await expect(panel.getByTestId('run-error')).toHaveText('Cancelled');
  await expect(page.getByTestId('run-pill')).toHaveCount(0);
});

test('the pipeline: rules settle clear cases without Claude, quick rank, Opus only for fit ≥ 60, manual step skipped when checked < 24 h; the manual posting shows in Jobs', async ({ page, request }) => {
  test.setTimeout(120_000);
  const desc = (s: string) => `${s} `.repeat(12);
  await request.post('/api/__e2e/add-jobs', { data: { jobs: [
    { id: 'rule:1', company: 'Delta Labs', title: 'Secure Hardware Intern', url: 'https://delta.example/jobs/r1', score: 60, first_seen: '2026-09-29T22:09:00.000Z', description: desc('Requires an active security clearance. ASIC design.') },
    { id: 'rule:2', company: 'Delta Labs', title: 'Business Operations Intern', url: 'https://delta.example/jobs/r2', score: 50, first_seen: '2026-09-29T22:09:00.000Z', description: desc('Support finance and sales with spreadsheets and customer reports.') },
  ] } });
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'success', delayMs: 20 } });
  await suppressAutoDialogs(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Process new jobs' }).click();
  await page.getByRole('button', { name: 'View summary' }).click({ timeout: 40_000 });
  const panel = page.getByRole('dialog', { name: 'Claude run' });
  await expect(panel.getByTestId('run-status')).toHaveText('Done', { timeout: 40_000 });
  await expect(panel.getByTestId('pipeline-manual')).toContainText('Omega Social: 1 added');
  await expect(panel.getByTestId('pipeline-rules')).toContainText('2 settled by rules');
  await expect(panel.getByTestId('pipeline-quick')).toHaveAttribute('data-status', 'done');
  await expect(panel.getByTestId('pipeline-final')).toHaveAttribute('data-status', 'done');
  const kids = panel.getByTestId('run-children').getByRole('listitem');
  await expect(kids).toHaveCount(3); // one Chrome run (Omega Social), one quick-rank run, one final-check run
  // No spot-check step any more (removed 2026-10-17): the run just ends
  await expect(panel.getByTestId('calibration')).toHaveCount(0);

  // rules: no model involved
  const r1 = await (await request.get('/api/jobs/rule%3A1')).json();
  expect(r1.job).toMatchObject({ fit_score: 3, rank_stage: 'rule', rank_model: 'rules' });
  const r2 = await (await request.get('/api/jobs/rule%3A2')).json();
  expect(r2.job).toMatchObject({ fit_score: 5, rank_stage: 'rule' });
  // quick then final only for fit ≥ 60 (fake: quick = watcher score + 20; final = 77)
  const all = await (await request.get('/api/jobs')).json() as { id: string; score: number; fit_score: number; rank_stage: string }[];
  for (const j of all.filter((x) => !x.id.startsWith('rule:'))) {
    expect(j.rank_stage, j.id).toBe(j.fit_score === 77 ? 'final' : 'quick');
  }
  expect(all.filter((j) => j.rank_stage === 'final').length).toBeGreaterThan(0);
  // the manual posting is a normal job
  await page.keyboard.press('Escape');
  await page.goto('/jobs?status=all&q=omega');
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(1);
  await expect(page.locator('.MuiDataGrid-row').first()).toContainText('Memory Systems Architecture');
  const manualJob = all.find((j) => j.id.startsWith('manual:')) as unknown as { source: string; company: string };
  expect(manualJob).toMatchObject({ source: 'manual:Omega Social', company: 'Omega Social' });

  // second press (one new job arrived): the manual company was checked < 24 h ago → no Chrome run this time
  await request.post('/api/__e2e/add-jobs', { data: { jobs: [
    { id: 'new:2', company: 'Acme Silicon', title: 'HBM Controller Intern', url: 'https://acme.example/jobs/n2', score: 45, first_seen: '2026-09-30T10:00:00.000Z', description: desc('HBM memory controller RTL design.') },
  ] } });
  await page.goto('/');
  await page.getByRole('button', { name: 'Process new jobs' }).click();
  await page.getByRole('button', { name: 'View summary' }).click({ timeout: 30_000 });
  await expect(panel.getByTestId('run-status')).toHaveText('Done', { timeout: 30_000 });
  await expect(panel.getByTestId('pipeline-manual')).toHaveAttribute('data-status', 'skipped');
  await expect(panel.getByTestId('pipeline-manual')).toContainText('checked in the last 24 h');
  await expect(panel.getByTestId('pipeline-quick')).toContainText('1 ranked');
  await expect(panel.getByTestId('run-children').getByRole('listitem')).toHaveCount(2); // quick rank + final check, no Chrome run
  await expect(panel.getByTestId('run-summary')).toContainText('Ranked 1 new job');

  // Companies page: last checked
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Companies' }).click();
  await expect(page.getByTestId('last-check-Omega Social')).toContainText('1 added');
});

test('a failed run shows Claude\'s error; Continue is offered for runs with a session', async ({ page, request }) => {
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'max_turns' } });
  await suppressAutoDialogs(page);
  const panel = await openRun(page, await startRun(request, 'weekly-review'));
  await expect(panel.getByTestId('run-status')).toHaveText('Needs you', { timeout: 20_000 });
  await expect(panel.getByTestId('run-error')).toContainText('turns');
  await request.post('/api/__e2e/fake-claude', { data: { scenario: 'success' } });
  await panel.getByLabel('Tell Claude (optional)').fill('Finish the rest');
  await panel.getByRole('button', { name: 'Continue' }).click();
  await expect(panel.getByTestId('run-status')).toHaveText('Done', { timeout: 20_000 });
  await expect(panel.getByTestId('run-summary')).toContainText('Continued and finished.');
});

for (const mode of ['light', 'dark'] as const) {
  test(`accessibility (${mode}): the Run panel and the pill`, async ({ page, request }) => {
    await request.post('/api/__e2e/fake-claude', { data: { scenario: 'hang' } });
    await suppressAutoDialogs(page);
    await page.emulateMedia({ colorScheme: mode });
    await page.addInitScript((m) => localStorage.setItem('jw.colorMode', JSON.stringify(m)), mode);
    await startRun(request, 'weekly-review');
    await page.goto('/');
    await page.getByTestId('run-pill').click();
    const panel = page.getByRole('dialog', { name: 'Claude run' });
    await expect(panel.getByTestId('run-last-text')).toBeVisible();
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = (x: typeof r) => x.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(bad(r), 'panel').toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('run-pill')).toBeVisible();
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(bad(r), 'pill').toEqual([]);
  });
}
