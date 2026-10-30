import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { codeFingerprint, startSelfUpdate } from '../../server/selfUpdate';

afterEach(() => vi.useRealTimers());

function setup(o: { idle?: () => boolean; ok?: boolean } = {}) {
  vi.useFakeTimers();
  let fp = 'v1';
  const restart = vi.fn(); const check = vi.fn(async () => ({ ok: o.ok ?? true, output: 'error TS2304' })); const log = vi.fn();
  const stop = startSelfUpdate({ fingerprint: () => fp, check, restart, log, isIdle: o.idle || (() => true), intervalMs: 1000, quietMs: 3000 });
  return { set: (v: string) => { fp = v; }, restart, check, log, stop, tick: (ms: number) => vi.advanceTimersByTimeAsync(ms) };
}

describe('self-update', () => {
  it('restarts once the code has been quiet for quietMs, not while it is still changing', async () => {
    const s = setup();
    await s.tick(5000); expect(s.restart).not.toHaveBeenCalled(); // nothing changed
    s.set('v2'); await s.tick(1000);
    s.set('v3'); await s.tick(2000); expect(s.restart).not.toHaveBeenCalled(); // still being edited
    await s.tick(3000);
    expect(s.check).toHaveBeenCalledTimes(1);
    expect(s.restart).toHaveBeenCalledTimes(1);
    s.stop();
  });

  it('waits while a Claude run is active', async () => {
    let idle = false;
    const s = setup({ idle: () => idle });
    s.set('v2'); await s.tick(10_000);
    expect(s.restart).not.toHaveBeenCalled();
    idle = true; await s.tick(1000);
    expect(s.restart).toHaveBeenCalledTimes(1);
    s.stop();
  });

  it('stays on the running version when the new code does not compile (and does not re-check the same code)', async () => {
    const s = setup({ ok: false });
    s.set('v2'); await s.tick(10_000);
    expect(s.restart).not.toHaveBeenCalled();
    expect(s.check).toHaveBeenCalledTimes(1);
    expect(s.log.mock.calls[0][0]).toMatch(/does not compile/);
    s.stop();
  });

  it('codeFingerprint changes when a watched file changes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-fp-'));
    fs.mkdirSync(path.join(dir, 'server'));
    fs.writeFileSync(path.join(dir, 'server', 'a.ts'), 'one');
    const a = codeFingerprint(dir, ['server']);
    fs.writeFileSync(path.join(dir, 'server', 'a.ts'), 'two!');
    expect(codeFingerprint(dir, ['server'])).not.toBe(a);
  });
});
