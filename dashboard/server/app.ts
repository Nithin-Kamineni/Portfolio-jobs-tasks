import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { Ctx } from './sync';
import { exportTracker } from './exporter';
import { HttpError } from './repo';
import { eventsRouter, jobsRouter, type DescriptionFetcher } from './routes/jobs';
import { contactsRouter, outreachRouter } from './routes/outreach';
import { metaRouter } from './routes/meta';
import { runsRouter } from './routes/runs';
import { researchRouter } from './routes/research';
import type { ResearchHttp } from './research/http';
import { RunManager, type RunManagerOptions } from './runs/runner';
import { getRun, updateRun } from './runs/store';
import { buildPipelines } from './runs/pipelines';
import { commitAfterRun, DASHBOARD_PATHS, WATCHER_PATHS } from './gitsync';
import { getSettings } from './repo';
import { notifyLocalChange } from './cloudSync';
import { notifyKeeper } from './descriptionKeeper';

export interface AppOptions {
  fetchDescription?: DescriptionFetcher;
  /** The run manager (headless Claude runs). Created here when omitted. */
  runs?: RunManager;
  runOptions?: RunManagerOptions;
  /** Built web app to serve (dashboard/web/dist). Omitted in dev and tests. */
  staticDir?: string;
  /** Delay before regenerating tracker.csv after a change (batches bursts of edits). 0 = synchronously. */
  exportDelayMs?: number;
  /** Extra routes mounted before the API 404 handler (the e2e server adds a reset route). */
  extend?: (app: express.Express, ctx: Ctx, runs: RunManager) => void;
  /** HTTP client for the paper search (tests pass one that only reads recorded responses). */
  researchHttp?: () => ResearchHttp;
}

export function createApp(ctx: Ctx, opts: AppOptions = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  // Local-only guard: refuse other Host headers (DNS rebinding) and non-JSON writes (cross-site form posts).
  app.use('/api', (req, _res, next) => {
    const host = String(req.headers.host || '').replace(/:\d+$/, '');
    if (host && !['localhost', '127.0.0.1', '[::1]'].includes(host)) return next(new HttpError(403, 'Local access only'));
    if (req.method !== 'GET' && !req.is('application/json') && req.headers['content-length'] !== '0' && req.headers['content-length'] !== undefined) {
      return next(new HttpError(415, 'Send JSON'));
    }
    next();
  });

  // Regenerate jobs/tracker.csv after every change.
  let timer: NodeJS.Timeout | null = null;
  const delay = opts.exportDelayMs ?? 1500;
  const flushExport = () => { if (timer) { clearTimeout(timer); timer = null; } return exportTracker(ctx.db, ctx.cfg.repoRoot); };
  app.use('/api', (req, res, next) => {
    if (req.method !== 'GET' && !req.path.startsWith('/sync') && !req.path.startsWith('/runs')) {
      res.on('finish', () => {
        if (res.statusCode >= 400) return;
        notifyLocalChange(); // cloud sync once edits have been quiet for ~20 s (no-op without the scheduler)
        notifyKeeper(); // a new Referral/Applied job: its description is fetched and saved as JD.md (no-op without the keeper)
        if (delay === 0) { flushExport(); return; }
        if (timer) clearTimeout(timer);
        timer = setTimeout(flushExport, delay);
        timer.unref?.();
      });
    }
    next();
  });

  app.use('/api/jobs', jobsRouter(ctx, opts.fetchDescription));
  app.use('/api/events', eventsRouter(ctx));
  app.use('/api/contacts', contactsRouter(ctx));
  app.use('/api/outreach', outreachRouter(ctx));
  app.use('/api/research', researchRouter(ctx, { http: opts.researchHttp }));
  app.use('/api', metaRouter(ctx));
  const runs: RunManager = opts.runs || new RunManager(ctx, {
    pipelines: buildPipelines({ fetcher: opts.fetchDescription }),
    ...opts.runOptions,
    onFinished: async (run) => {
      flushExport();
      notifyLocalChange();
      // "Commit and push automatically": commit what the run changed (tracker.csv, applications/, watcher/) and push.
      if (getSettings(ctx.db, ctx.cfg.runs).autoCommit) {
        const paths = run.task === 'fix-watcher-errors' ? [...DASHBOARD_PATHS, ...WATCHER_PATHS] : DASHBOARD_PATHS;
        const g = await commitAfterRun(ctx, `Dashboard: ${run.task} (run ${run.id})`, paths).catch((e: Error) => ({ committed: false, files: [], pushed: false, warning: `git: ${e.message}` }));
        if (g.committed || g.pushed || g.warning) {
          const cur = getRun(ctx.db, run.id);
          runs.emit('run', updateRun(ctx.db, run.id, { progress: { ...cur.progress, git: g } }));
        }
      }
      await opts.runOptions?.onFinished?.(run);
    },
  });
  app.use('/api/runs', runsRouter(ctx, runs));
  opts.extend?.(app, ctx, runs);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'No such API route')));

  if (opts.staticDir && fs.existsSync(opts.staticDir)) {
    app.use(express.static(opts.staticDir, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(opts.staticDir!, 'index.html')));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof HttpError ? err.status : (err as { status?: number })?.status || 500;
    const message = err instanceof Error ? err.message : String(err);
    if (status >= 500 && !(err instanceof HttpError)) console.error(err);
    res.status(status).json({ error: message });
  });

  return { app, flushExport, runs };
}
