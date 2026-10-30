// Fetch helper for /api/ws/… and small shared utilities for the workspace apps.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** An API failure: status 0 = the request never got an answer (offline, or signed out: Cloudflare Access
 *  then redirects to its login page, which fetch cannot follow); 401 = the session expired. */
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/ws/' + path, {
      method,
      headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError(navigator.onLine ? 'Can’t reach the server. You may have been signed out.' : 'You’re offline.', 0);
  }
  if (res.redirected || res.headers.get('content-type')?.includes('text/html')) throw new ApiError('Your session expired. Sign in again.', 401);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

/** Load once, reload on focus; returns [data, setData, reload, error]. */
export function useLoad<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try { setData(await api<T>(path)); setError(''); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => {
    void reload();
    const onFocus = () => { if (!document.hidden) void reload(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);
  return { data, setData, reload, error, setError, loading };
}

export function readStore<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s == null ? fallback : (JSON.parse(s) as T); } catch { return fallback; }
}
export function writeStore(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

// ---- view state on the server --------------------------------------------------------------------
// Where the owner was (tab, project, focus, filters…) is kept in the database (/api/ws/ui), so it follows
// him to any device and survives a refresh. localStorage is only a fallback while offline.
interface UiStore { values: Record<string, unknown>; set: (key: string, value: unknown) => void }
const UiCtx = createContext<UiStore | null>(null);

/** Loads the saved view state once, then renders the app. */
export function UiStateProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const pending = useRef(new Map<string, unknown>());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    api<Record<string, unknown>>('ui').then(setValues, () => setValues({}));
  }, []);
  const flush = useCallback(() => {
    const batch = [...pending.current]; pending.current.clear();
    // One write after another, so a quick A → B change can never land as B → A on the server.
    chain.current = chain.current.then(async () => {
      for (const [k, v] of batch) await api(`ui/${encodeURIComponent(k)}`, 'PUT', { value: v }).catch(() => undefined);
    });
  }, []);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flush]);
  const store = useMemo<UiStore | null>(() => values && {
    values,
    set: (key, value) => {
      if (JSON.stringify(values[key]) === JSON.stringify(value)) return;
      values[key] = value;
      pending.current.set(key, value);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
    },
  }, [values, flush]);
  if (!store) return <p className="ws-muted ws-section" aria-live="polite">Loading your workspace…</p>;
  return <UiCtx.Provider value={store}>{children}</UiCtx.Provider>;
}
export const useUiStore = () => useContext(UiCtx);

/**
 * useState that remembers its value: on the server (so it follows you across devices) when the
 * workspace's UiStateProvider is present, and in localStorage. `local` keeps it on this device only
 * (e.g. column widths, which depend on the screen).
 */
export function useStored<T>(key: string, fallback: T, opts: { local?: boolean } = {}) {
  const ui = useContext(UiCtx);
  const synced = !!ui && !opts.local;
  const [v, setV] = useState<T>(() => (synced && key in ui!.values ? (ui!.values[key] as T) : readStore(key, fallback)));
  useEffect(() => { writeStore(key, v); if (synced) ui!.set(key, v); }, [key, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, setV] as const;
}

/** Calls fn after `ms` of quiet; flush() runs a pending call now. */
export function useDebounced<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  const t = useRef<ReturnType<typeof setTimeout>>();
  const last = useRef<A>();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const flush = useCallback(() => { if (t.current && last.current) { clearTimeout(t.current); t.current = undefined; fnRef.current(...last.current); } }, []);
  const call = useCallback((...a: A) => { last.current = a; clearTimeout(t.current); t.current = setTimeout(() => { t.current = undefined; fnRef.current(...a); }, ms); }, [ms]);
  useEffect(() => () => flush(), [flush]);
  return [call, flush] as const;
}

/** Today's date in Eastern time, YYYY-MM-DD. */
export const todayET = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const dayET = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

export function relTime(iso: string | null | undefined) {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Small progress ring (SVG). */
export function Ring({ value, size = 44, stroke = 4, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <svg className="ws-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${Math.round(v * 100)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ws-ring-bg" />
      {v > 0 && <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ws-ring-fg" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{Math.round(v * 100)}%</text>
    </svg>
  );
}

export function Bar({ value, tone }: { value: number; tone?: string }) {
  return <span className="ws-bar-track"><span className="ws-bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: tone }} /></span>;
}
