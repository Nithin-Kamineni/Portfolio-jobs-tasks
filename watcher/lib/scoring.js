// Keyword scoring (config: watcher/keywords.json).

export function makeScorer(kw) {
  const lc = (a) => (a || []).map((s) => s.toLowerCase());
  const must = lc(kw.titleMustMatchAny), excl = lc(kw.titleExclude), nonUS = lc(kw.locations?.nonUS), domain = lc(kw.domainMustMatchAny);
  const weights = [...Object.entries(kw.relevance || {}), ...Object.entries(kw.penalties || {})]
    .flatMap(([w, list]) => lc(list).map((k) => [k, Number(w)]));
  const pad = (s) => ` ${String(s || '').toLowerCase()} `;
  const rx = new Map();
  const has = (text, k) => {
    if (!rx.has(k)) {
      const body = k.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      rx.set(k, new RegExp('(^|[^a-z0-9])' + body + (k.endsWith(' ') ? '([^a-z0-9]|$)' : '')));
    }
    return rx.get(k).test(text);
  };
  return {
    domainOk: (title, desc) => {
      if (!domain.length) return true;
      const t = pad(title), d = pad(desc);
      return domain.filter((k) => has(t, k) || has(d, k)).length >= (kw.domainMinHits ?? 1);
    },
    titleOk: (t) => { const s = pad(t); return must.some((k) => has(s, k)) && !excl.some((k) => has(s, k)); },
    usOk: (loc) => {
      const parts = String(loc || '').toLowerCase().split(/;|\|/).map((x) => x.trim()).filter(Boolean);
      if (!parts.length) return true;
      return parts.some((p) => !nonUS.some((k) => p.includes(k)));
    },
    score: (title, desc) => {
      const t = pad(title), d = pad(desc); let s = 0; const hits = [];
      for (const [k, w] of weights) {
        const inT = has(t, k), inD = has(d, k);
        if (inT || inD) { s += w * (inT ? 2 : 1); if (w > 0) hits.push([k.trim(), w * (inT ? 2 : 1)]); }
      }
      return { score: s, hits: [...new Set(hits.sort((a, b) => b[1] - a[1]).map((h) => h[0]))] };
    },
  };
}
