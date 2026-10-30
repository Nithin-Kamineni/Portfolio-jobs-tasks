// 2026-10-17 (The owner): nothing pops up by itself. Deciding just happens (a message with Undo at the bottom);
// Claude steps open only from "Show me". The Claude to-do button and the Home "Next steps for Claude" card were removed.
import { test, expect } from './fixtures';

const statusOf = async (request: import('@playwright/test').APIRequestContext) =>
  Object.fromEntries(((await (await request.get('/api/jobs')).json()) as { id: string; status: string }[]).map((j) => [j.id, j.status]));

test('no automatic dialogs on Home or Jobs, even with 10 unranked jobs; no Claude to-do button, Next steps card or weekly review button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('search-countdown')).toBeVisible();
  await expect(page.getByText('Watcher health')).toBeVisible();
  await expect(page.getByTestId('claude-todo')).toHaveCount(0);
  await expect(page.getByText('Next steps for Claude')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /weekly review/i })).toHaveCount(0);
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Jobs' }).click();
  await expect(page.locator('.MuiDataGrid-row').first()).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Done deciding' })).toHaveCount(0);
});

test('Apply with referral / Apply direct: no dialog at any point; Apply direct lands in Applied', async ({ page, request }) => {
  await page.goto('/jobs');
  await page.locator('.MuiDataGrid-row').first().click();
  const drawer = page.getByRole('complementary', { name: 'Job details' });
  await expect(drawer.locator('h2').first()).toBeVisible();
  const first = await page.locator('.MuiDataGrid-row').first().getAttribute('data-id');
  await drawer.getByRole('button', { name: /Apply with referral/ }).click();
  await expect(page.getByText(/^Referral: /)).toBeVisible();
  const second = await drawer.locator('h2').first().innerText();
  await drawer.getByRole('button', { name: /Apply direct/ }).click();
  await expect(page.getByText(/^Applied: /)).toBeVisible();
  await expect(drawer.locator('h2').first()).not.toHaveText(second);
  await page.waitForTimeout(5000); // the old "process decisions" pop-up came after 4 s
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const s = await statusOf(request);
  expect(s[first!]).toBe('apply_referral');
  expect(Object.values(s).filter((x) => x === 'applied')).toHaveLength(1);
  await expect(page.getByRole('button', { name: /^Referral 1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Applied 1/ })).toBeVisible();
});
