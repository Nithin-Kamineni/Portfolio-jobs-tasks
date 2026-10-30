import fs from 'node:fs';
import { Router, type Response } from 'express';
import type { Ctx } from '../sync';
import { HttpError } from '../repo';
import type { RunManager } from '../runs/runner';
import { preflight } from '../runs/claude';
import { lastChromeSuccess } from '../runs/store';
import type { Run } from '../../shared/types';

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'timed_out', 'needs_user']);

function sse(res: Response) {
  res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  const send = (event: string, data: unknown) => { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
  const beat = setInterval(() => res.write(': ping\n\n'), 15_000);
  return { send, stop: () => clearInterval(beat) };
}

export function runsRouter(ctx: Ctx, runs: RunManager): Router {
  const r = Router();
  const withChildren = (run: Run) => ({ ...run, children: run.progress.pipeline ? runs.children(run.id) : [] });

  r.get('/', (req, res) => {
    const limit = Number(req.query.limit || 20);
    res.json({ runs: runs.list(limit), paused: runs.paused });
  });

  r.get('/preflight', async (req, res, next) => {
    try { res.json(await preflight(ctx.cfg.claudeCommand, lastChromeSuccess(ctx.db), { fresh: req.query.fresh === '1' })); } catch (e) { next(e); }
  });

  /** One stream for every run update (the app-bar pill and the Runs page). */
  r.get('/stream', (req, res) => {
    const s = sse(res);
    s.send('hello', { paused: runs.paused });
    const onRun = (run: Run) => s.send('run', run);
    const onFinished = (run: Run | null) => { if (run) s.send('finished', run); };
    const onPaused = (p: unknown) => s.send('paused', p);
    runs.on('run', onRun); runs.on('finished', onFinished); runs.on('paused', onPaused);
    req.on('close', () => { s.stop(); runs.off('run', onRun); runs.off('finished', onFinished); runs.off('paused', onPaused); });
  });

  r.post('/', (req, res) => {
    const { task, params } = req.body || {};
    if (!task) throw new HttpError(400, 'task is required');
    const out = runs.start(String(task), params && typeof params === 'object' ? params : {});
    res.status(out.deduped ? 200 : 201).json(out);
  });

  r.post('/resume-queue', (_req, res) => { runs.resume(); res.json({ paused: runs.paused }); });

  r.get('/:id', (req, res) => { res.json(withChildren(runs.get(Number(req.params.id)))); });

  r.get('/:id/log', (req, res) => {
    const file = runs.logPath(Number(req.params.id));
    if (!fs.existsSync(file)) throw new HttpError(404, 'No log for this run (logs older than the newest 100 runs are deleted)');
    res.type('text/plain; charset=utf-8').send(fs.readFileSync(file, 'utf8'));
  });

  /** Live events for one run: a snapshot, then every update; ends after the run finishes. */
  r.get('/:id/events', (req, res) => {
    const id = Number(req.params.id);
    const first = runs.get(id);
    const s = sse(res);
    s.send('run', withChildren(first));
    if (TERMINAL.has(first.status)) { s.send('done', first); s.stop(); res.end(); return; }
    const onRun = (run: Run) => {
      if (run.id !== id && run.parent_id !== id) return;
      const top = run.id === id ? run : runs.get(id);
      s.send('run', withChildren(top));
      if (run.id === id && TERMINAL.has(run.status)) { s.send('done', run); cleanup(); res.end(); }
    };
    const cleanup = () => { s.stop(); runs.off('run', onRun); };
    runs.on('run', onRun);
    req.on('close', cleanup);
  });

  r.post('/:id/cancel', (req, res) => { res.json(runs.cancel(Number(req.params.id))); });

  r.post('/:id/continue', (req, res) => {
    const out = runs.continueRun(Number(req.params.id), req.body?.note ? String(req.body.note) : undefined);
    res.status(out.deduped ? 200 : 201).json(out);
  });

  return r;
}
