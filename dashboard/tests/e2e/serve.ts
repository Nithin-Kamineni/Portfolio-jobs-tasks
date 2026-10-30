// Playwright's web server: write the fixture, start the dashboard on PORT (default 5188) with git disabled,
// and add POST /api/__e2e/reset so every test starts from the same seeded database.
import fs from 'node:fs';
import path from 'node:path';
import { e2eConfig, seedDb, seedFiles } from './seed';
import { startServer } from '../../server/index';
import { openDb } from '../../server/db';
import { noGit } from '../../server/git';
import { upsertJobs } from '../../server/importer';

// No network for the paper search in e2e (recorded responses only).
process.env.JOBWATCHER_RESEARCH_OFFLINE = '1';

seedFiles();
const cfg = e2eConfig();
const db = openDb(cfg.dbPath);
seedDb(db, cfg);
db.close();
startServer(cfg, {
  git: noGit, sync: false,
  extend: (app, ctx, runs) => {
    app.post('/api/__e2e/reset', async (_req, res) => {
      for (const r of ctx.db.prepare("SELECT id FROM runs WHERE status IN ('queued','running')").all() as { id: number }[]) { try { runs.cancel(r.id); } catch { /* finished meanwhile */ } }
      await runs.whenIdle();
      runs.resume();
      seedFiles(); seedDb(ctx.db, cfg); res.json({ ok: true });
    });
    // Adds inbox-style job records (e.g. clear rule cases for the pipeline test).
    app.post('/api/__e2e/add-jobs', (req, res) => { res.json({ added: upsertJobs(ctx.db, Array.isArray(req.body?.jobs) ? req.body.jobs : []) }); });
    // Picks the fake claude's scenario (success | hang | crash | …) and its delay per event.
    app.post('/api/__e2e/fake-claude', (req, res) => {
      fs.mkdirSync(cfg.dataDir, { recursive: true });
      fs.writeFileSync(path.join(cfg.dataDir, 'fake-claude.json'), JSON.stringify({ scenario: req.body?.scenario || 'success', delayMs: req.body?.delayMs ?? 60 }));
      res.json({ ok: true });
    });
  },
}).catch((e) => { console.error(e); process.exit(1); });
