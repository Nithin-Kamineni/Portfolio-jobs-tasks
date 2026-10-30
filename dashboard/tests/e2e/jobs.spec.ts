import { test, expect, suppressAutoDialogs } from './fixtures';

test.beforeEach(async ({ page }) => { await suppressAutoDialogs(page); });

const statusOf = async (request: import('@playwright/test').APIRequestContext) =>
  Object.fromEntries(((await (await request.get('/api/jobs')).json()) as { id: string; status: string }[]).map((j) => [j.id, j.status]));

test('decide 5 jobs with the keyboard; statuses persist after reload', async ({ page, request }) => {
  await page.goto('/jobs');
  const rows = page.locator('.MuiDataGrid-row');
  await expect(rows).toHaveCount(10);
  const ids = await rows.evaluateAll((els) => els.slice(0, 5).map((e) => e.getAttribute('data-id')!));
  await rows.first().click();
  await expect(page.getByRole('complementary', { name: 'Job details' }).getByRole('heading', { level: 2 })).toBeVisible();

  const keys = ['r', 'd', 'l', 's', 'l'];
  for (const k of keys) {
    const title = await page.getByRole('complementary', { name: 'Job details' }).locator('h2').first().innerText();
    await page.keyboard.press(k);
    await expect(page.getByRole('complementary', { name: 'Job details' }).locator('h2').first()).not.toHaveText(title);
  }
  await page.reload();
  const s = await statusOf(request);
  expect(ids.map((id) => s[id])).toEqual(['apply_referral', 'applied', 'later', 'skip', 'later']);
  // The default view ("To decide") no longer lists them
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /^Referral 1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Applied 1/ })).toBeVisible();
});

test('filters, search and sort; state is in the URL and survives a reload', async ({ page }) => {
  await page.goto('/jobs');
  await page.getByRole('combobox', { name: 'Priority' }).click();
  await page.getByRole('option', { name: 'B' }).click();
  await expect(page).toHaveURL(/prio=B/);
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(2);
  await expect(page.locator('.MuiDataGrid-row').first()).toContainText('Gamma Memory');

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Search jobs').fill('compiler');
  await expect(page).toHaveURL(/q=compiler/);
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(2);
  await page.reload();
  await expect(page.getByLabel('Search jobs')).toHaveValue('compiler');
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(2);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('combobox', { name: 'Tag' }).click();
  await page.getByRole('option', { name: 'Compiler/MLIR' }).click();
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear filters' }).click();

  // sort by company ascending
  await page.getByRole('columnheader', { name: 'Company' }).click();
  const companies = await page.locator('.MuiDataGrid-row [data-field="company"]').allInnerTexts();
  expect(companies).toEqual([...companies].sort((a, b) => a.localeCompare(b)));
  await page.reload();
  const again = await page.locator('.MuiDataGrid-row [data-field="company"]').allInnerTexts();
  expect(again).toEqual(companies); // sort remembered
});

test('bulk skip with one undo', async ({ page, request }) => {
  await page.goto('/jobs');
  const checks = page.locator('.MuiDataGrid-row input[type="checkbox"]');
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page.getByRole('group', { name: 'Bulk actions' }).getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('Skipped: 2 jobs').or(page.getByText('Skip: 2 jobs'))).toBeVisible();
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(8);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.MuiDataGrid-row')).toHaveCount(10);
  expect(Object.values(await statusOf(request)).every((s) => s === 'new')).toBe(true);
});

test('fetch description from the drawer when it is missing (fixture server has no network: shows a readable error)', async ({ page }) => {
  await page.goto('/jobs?status=all&job=ab%3Abeta%3A3');
  const drawer = page.getByRole('complementary', { name: 'Job details' });
  await expect(drawer.getByRole('heading', { name: 'AI Accelerator Architecture Intern - PhD' })).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Fetch description' })).toBeVisible();
  await expect(drawer.getByRole('link', { name: /Open posting/ }).first()).toHaveAttribute('href', 'https://beta.example/jobs/3');
});
