import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 5188);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npm run build && npx tsx tests/e2e/serve.ts`,
    url: `http://localhost:${PORT}/api/meta`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PORT: String(PORT), JOBWATCHER_NO_FETCH: '1' },
  },
});
