// HTTP for the research sources (OpenAlex, Semantic Scholar, paper PDFs): a polite, cached GET.
// Responses are cached in data/research-cache/ for 7 days (the same queries repeat across runs, and OpenAlex's
// free daily budget is small). Tests set JOBWATCHER_RESEARCH_OFFLINE=1 and pre-fill the cache with recorded
// responses, so nothing reaches the network.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class ResearchError extends Error {
  constructor(message: string, public kind: 'budget' | 'http' | 'offline' | 'too_large' | 'network' = 'http', public resetsAt: string | null = null) { super(message); }
}

export interface HttpResponse { status: number; type: string; body: Buffer; fromCache: boolean }

export interface ResearchHttpOptions {
  cacheDir: string;
  ttlDays?: number;
  /** Only the cache; a miss is an error (tests). */
  offline?: boolean;
  fetchImpl?: typeof fetch;
  /** Wait between two network requests to the same host (ms). */
  intervalMs?: Record<string, number>;
  now?: () => number;
  /** First retry delay (doubles each time). */
  backoffMs?: number;
}

const UA = 'JobWatcher-dashboard/2 (personal research tool; low volume)';
const DAY = 86_400_000;

/** The cache key ignores secrets (api_key), so a key can be added or removed without losing the cache. */
export function cacheKey(url: string): string {
  const u = new URL(url);
  u.searchParams.delete('api_key');
  return crypto.createHash('sha1').update(u.toString()).digest('hex');
}

export class ResearchHttp {
  requests = 0;
  cached = 0;
  private last = new Map<string, number>();
  private opts: Required<Omit<ResearchHttpOptions, 'fetchImpl'>> & { fetchImpl: typeof fetch };

  constructor(opts: ResearchHttpOptions) {
    this.opts = {
      ttlDays: 7, offline: false, backoffMs: 1000, intervalMs: { 'api.openalex.org': 120, 'api.semanticscholar.org': 1100, 'export.arxiv.org': 3000 }, now: () => Date.now(),
      fetchImpl: globalThis.fetch.bind(globalThis), ...opts,
    };
    fs.mkdirSync(this.opts.cacheDir, { recursive: true });
  }

  private files(url: string) {
    const k = cacheKey(url);
    return { meta: path.join(this.opts.cacheDir, `${k}.json`), body: path.join(this.opts.cacheDir, `${k}.body`) };
  }

  /** Stores a response in the cache (also used by tests to load recorded fixtures). */
  put(url: string, status: number, type: string, body: Buffer | string): void {
    const f = this.files(url);
    fs.writeFileSync(f.body, body);
    fs.writeFileSync(f.meta, JSON.stringify({ url: redact(url), status, type, at: new Date(this.opts.now()).toISOString() }));
  }

  private fromCache(url: string): HttpResponse | null {
    const f = this.files(url);
    if (!fs.existsSync(f.meta) || !fs.existsSync(f.body)) return null;
    try {
      const m = JSON.parse(fs.readFileSync(f.meta, 'utf8')) as { status: number; type: string; at: string };
      if (!this.opts.offline && this.opts.now() - new Date(m.at).getTime() > this.opts.ttlDays * DAY) return null;
      return { status: m.status, type: m.type, body: fs.readFileSync(f.body), fromCache: true };
    } catch { return null; }
  }

  async get(url: string, o: { maxBytes?: number; accept?: string; retries?: number } = {}): Promise<HttpResponse> {
    const hit = this.fromCache(url);
    if (hit) { this.cached++; return hit; }
    if (this.opts.offline) throw new ResearchError(`offline: no cached response for ${redact(url)}`, 'offline');
    const host = new URL(url).host;
    const retries = o.retries ?? 3;
    for (let attempt = 0; ; attempt++) {
      const wait = (this.last.get(host) ?? 0) + (this.opts.intervalMs[host] ?? 300) - this.opts.now();
      if (wait > 0) await sleep(wait);
      this.last.set(host, this.opts.now());
      this.requests++;
      let res: Response;
      try {
        res = await this.opts.fetchImpl(url, { headers: { 'User-Agent': UA, Accept: o.accept || 'application/json' }, signal: AbortSignal.timeout(60_000), redirect: 'follow' });
      } catch (e) {
        if (attempt < retries) { await sleep(this.opts.backoffMs * 2 ** attempt); continue; }
        throw new ResearchError(`${host}: ${(e as Error).message}`, 'network');
      }
      if (res.status === 429) {
        const text = await res.text().catch(() => '');
        const retryAfter = Number(res.headers.get('retry-after') || 0);
        // OpenAlex: the free daily budget (no key) is used up. Retrying doesn't help until midnight UTC.
        if (/budget/i.test(text) || retryAfter > 120) {
          const resetsAt = new Date(this.opts.now() + (retryAfter || 3600) * 1000).toISOString();
          throw new ResearchError(`${host}: the free daily request budget is used up (resets ${resetsAt}). Cached results are still used.`, 'budget', resetsAt);
        }
        if (attempt < retries) { await sleep(Math.max(this.opts.backoffMs, retryAfter * 1000) * 2 ** attempt); continue; }
        throw new ResearchError(`${host}: rate limited (HTTP 429)`, 'http');
      }
      if (res.status >= 500 && attempt < retries) { await sleep(this.opts.backoffMs * 2 ** attempt); continue; }
      const len = Number(res.headers.get('content-length') || 0);
      if (o.maxBytes && len > o.maxBytes) throw new ResearchError(`${host}: the file is ${Math.round(len / 1e6)} MB (limit ${Math.round(o.maxBytes / 1e6)} MB)`, 'too_large');
      const body = Buffer.from(await res.arrayBuffer());
      if (o.maxBytes && body.length > o.maxBytes) throw new ResearchError(`${host}: the file is larger than ${Math.round(o.maxBytes / 1e6)} MB`, 'too_large');
      const type = res.headers.get('content-type') || '';
      // Cache successes and "not found" (e.g. a DOI Semantic Scholar doesn't know), not transient errors.
      if (res.ok || res.status === 404) this.put(url, res.status, type, body);
      return { status: res.status, type, body, fromCache: false };
    }
  }

  async json<T>(url: string): Promise<T | null> {
    const r = await this.get(url);
    if (r.status === 404) return null;
    if (r.status >= 400) throw new ResearchError(`${new URL(url).host}: HTTP ${r.status}`, 'http');
    try { return JSON.parse(r.body.toString('utf8')) as T; } catch { throw new ResearchError(`${new URL(url).host}: the answer was not JSON`, 'http'); }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const redact = (url: string) => url.replace(/([?&]api_key=)[^&]+/, '$1***');
