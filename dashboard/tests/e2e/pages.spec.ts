import AxeBuilder from '@axe-core/playwright';
import { test, expect, suppressAutoDialogs } from './fixtures';

test.beforeEach(async ({ page }) => { await suppressAutoDialogs(page); });

test('Applications: Referral (copy message, company note, R&D emails from papers) → Applied → Interview → Back to applied', async ({ page, request }) => {
  await page.goto('/applications');
  await expect(page.getByText('No roles waiting for a referral')).toBeVisible();
  await request.post('/api/jobs/gh%3Aacme%3A2/status', { data: { status: 'apply_referral' } });
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Referral 1' })).toHaveAttribute('aria-selected', 'true');
  const acme = page.getByRole('region', { name: 'Acme Silicon' });
  await expect(acme.getByTestId('referral-message')).toContainText('Memory Reliability (ECC) Research Intern role at Acme Silicon: https://acme.example/jobs/2');
  await acme.getByRole('button', { name: /Copy the LinkedIn message/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^Hi \[Name\], I hope you're doing well!/);

  // company note: autosaves, survives a reload
  await acme.getByLabel('Note for Acme Silicon').fill('Asked Sam Friend on LinkedIn (Oct 17)');
  await expect(acme.getByText('Saved')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Acme Silicon' }).getByLabel('Note for Acme Silicon')).toHaveValue('Asked Sam Friend on LinkedIn (Oct 17)');

  // R&D emails from papers (offline fixture): only the two Acme authors, with the paper
  await acme.getByRole('button', { name: /Find R&D emails from papers/ }).click();
  await expect(acme.getByText('morgan.fixture@acme.example')).toBeVisible({ timeout: 15_000 });
  await expect(acme.getByText('tsample@acme.example')).toBeVisible();
  await expect(acme.getByText('uni.coauthor@university.example')).toHaveCount(0);
  await expect(acme.getByRole('link', { name: /ECC-Protected Processing-in-Memory/ }).first()).toHaveAttribute('href', 'https://doi.org/10.1109/isca88888.2026.00042');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Acme Silicon' }).getByText('morgan.fixture@acme.example')).toBeVisible(); // cached
  await expect(page.getByRole('region', { name: 'Acme Silicon' }).getByRole('button', { name: 'Search again' })).toBeVisible();

  await page.getByRole('region', { name: 'Acme Silicon' }).getByRole('button', { name: 'Applied' }).click();
  await expect(page.getByText('Acme Silicon: Applied')).toBeVisible();
  await page.getByRole('tab', { name: 'Applied 1' }).click();
  const applied = page.getByRole('region', { name: 'Acme Silicon' });
  await expect(applied.getByTestId('company-note-text')).toContainText('Asked Sam Friend');
  await applied.getByRole('button', { name: 'Interview' }).click();
  await page.getByRole('tab', { name: 'Interview 1' }).click();
  const iv = page.getByRole('region', { name: 'Acme Silicon' });
  await expect(iv.getByLabel('Note for Acme Silicon')).toHaveValue('Asked Sam Friend on LinkedIn (Oct 17)');
  await iv.getByRole('button', { name: 'Back to applied' }).click();
  await expect(page.getByRole('tab', { name: 'Applied 1' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const job = await (await request.get('/api/jobs/gh%3Aacme%3A2')).json();
  expect(job.job).toMatchObject({ status: 'applied', applied_date: expect.any(String) });
});

test('Home: the last-manual-search countdown (Never → fresh), KPIs per phase, no outreach', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByTestId('search-age')).toHaveText('Never');
  await expect(page.getByTestId('search-age')).toHaveAttribute('data-color', 'error');
  await request.post('/api/marks', { data: { kind: 'manual_companies_checked' } });
  await page.reload();
  await expect(page.getByTestId('search-age')).toHaveText(/^0 min \d\d s ago$/);
  await expect(page.getByTestId('search-age')).toHaveAttribute('data-color', 'success');
  const t1 = await page.getByTestId('search-age').innerText();
  await page.waitForTimeout(1500);
  expect(await page.getByTestId('search-age').innerText()).not.toBe(t1); // ticks live
  await expect(page.getByRole('link', { name: 'To decide: 10' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Follow-ups/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Outreach' })).toHaveCount(0);
  await page.getByRole('link', { name: 'To decide: 10' }).click();
  await expect(page).toHaveURL(/\/jobs\?status=new,ranked/);
  await page.goto('/outreach');
  await expect(page).toHaveURL(/\/applications$/);
});

test('dark mode toggles and is remembered', async ({ page }) => {
  await page.goto('/');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
  const toggled = await bg();
  expect(toggled).not.toBe(light);
  await page.reload();
  expect(await bg()).toBe(toggled);
});

test('Companies page: mirror, manual hint, "I checked them"', async ({ page }) => {
  await page.goto('/companies');
  await expect(page.getByRole('row', { name: /Acme Silicon/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Omega Social/ }).getByText('Manual: set a job alert')).toBeVisible();
  await expect(page.getByText(/1 companies have no public feed|companies have no public feed/)).toBeVisible();
  await page.getByRole('button', { name: 'I checked them' }).click();
  await expect(page.getByText('Noted: manual companies checked')).toBeVisible();
  await expect(page.getByText(/Last checked just now/)).toBeVisible();
});

const PAGES = ['/', '/jobs', '/jobs?status=all&job=gh%3Aacme%3A1', '/applications', '/applications?tab=applied', '/applications?tab=interview', '/companies', '/runs'];

for (const mode of ['light', 'dark'] as const) {
  test(`accessibility (${mode}): no serious or critical axe violations on any page, and no console errors`, async ({ page, request }) => {
    await request.post('/api/jobs/gh%3Aacme%3A2/status', { data: { status: 'apply_referral' } }); // non-empty Referral phase
    await request.post('/api/jobs/ab%3Abeta%3A3/status', { data: { status: 'applied' } });
    await request.post('/api/jobs/ab%3Abeta%3A3/status', { data: { status: 'interview' } });
    await page.emulateMedia({ colorScheme: mode });
    await page.addInitScript((m) => localStorage.setItem('jw.colorMode', JSON.stringify(m)), mode);
    for (const url of PAGES) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      expect(bad, `${url} [${mode}]`).toEqual([]);
    }
  });
}
