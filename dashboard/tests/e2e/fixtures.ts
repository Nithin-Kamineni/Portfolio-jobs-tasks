import { test as base, expect, type Page } from '@playwright/test';

/**
 * Every test starts from the seeded database, with clean browser storage, and fails on any console error.
 * `window.open` is stubbed: calls are recorded in window.__opened (so the Outlook link can be checked without leaving the page).
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [async ({ page, request }, use) => {
    await request.post('/api/__e2e/reset', { data: {} });
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = ((url?: string | URL) => { (window as unknown as { __opened: string[] }).__opened.push(String(url)); return null; }) as typeof window.open;
    });
    await use(errors);
    expect(errors, 'console errors').toEqual([]);
  }, { auto: true }],
});

export { expect };

/** Closes a hand-off dialog if one opened automatically. */
export async function dismissDialogs(page: Page) {
  const d = page.getByRole('dialog');
  if (await d.count()) { await page.keyboard.press('Escape'); await expect(d).toHaveCount(0); }
}

/** Turns off automatic hand-off dialogs (localStorage jw.claude.auto = false) for tests about other things. */
export async function suppressAutoDialogs(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('jw.claude.auto', 'false'); } catch { /* no storage */ } });
}

export const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
