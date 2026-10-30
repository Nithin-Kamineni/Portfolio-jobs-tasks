// localStorage/sessionStorage that never throws (private windows, blocked storage).
export function readStore<T>(key: string, fallback: T, store: 'local' | 'session' = 'local'): T {
  try {
    const s = (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    return s == null ? fallback : (JSON.parse(s) as T);
  } catch { return fallback; }
}
export function writeStore(key: string, value: unknown, store: 'local' | 'session' = 'local'): void {
  try { (store === 'local' ? window.localStorage : window.sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
