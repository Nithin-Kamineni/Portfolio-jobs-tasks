// Small shared helpers for the watcher and the dashboard server. Node 22+, no dependencies.

export const UA = 'Mozilla/5.0 (JobWatcher personal job-alert script; github.com/your-github-user)';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Parses CSV text (quoted cells, "" escapes, CRLF) into an array of objects keyed by the header row. */
export function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  text = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

export const csvCell = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function stripHtml(html) {
  return String(html || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * fetch() wrapper: JSON by default, 30 s timeout, a backoff on HTTP 429. Network errors ("fetch failed", timeouts)
 * and 5xx are retried 3 times (2, 5, 10 s): one flaky page must not cost a whole source (Microsoft, 2026-09-30).
 * Other HTTP errors (404, 403, …) are final at once.
 */
export async function http(url, { method = 'GET', body, headers = {}, retries = 3, text = false } = {}) {
  const backoff = [2000, 5000, 10000];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'User-Agent': UA, Accept: text ? 'text/html,application/xhtml+xml,*/*' : 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429 && attempt < retries + 2) { await sleep(15000 * (attempt + 1)); continue; }
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), { status: res.status });
      return text ? await res.text() : await res.json();
    } catch (e) {
      if (attempt >= retries || (e.status && e.status < 500)) throw e;
      await sleep(backoff[Math.min(attempt, backoff.length - 1)]);
    }
  }
}
