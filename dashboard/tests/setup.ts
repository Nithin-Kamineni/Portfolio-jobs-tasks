import '@testing-library/jest-dom/vitest';

// The paper search (OpenAlex, Semantic Scholar, PDFs) only reads recorded responses from the cache in tests; a miss is an error.
process.env.JOBWATCHER_RESEARCH_OFFLINE = '1';

// jsdom lacks matchMedia and scrollTo; MUI and the DataGrid use them.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: /min-width:\s*(\d+)px/.test(query) ? 1400 >= Number(query.match(/min-width:\s*(\d+)px/)![1]) : false,
      media: query, onchange: null, addListener: () => undefined, removeListener: () => undefined,
      addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false,
    }) as MediaQueryList;
  }
  window.scrollTo = (() => undefined) as typeof window.scrollTo;
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => undefined);
}

// Unmount React trees between tests (automatic only with vitest globals).
if (typeof window !== 'undefined') {
  const { afterEach } = await import('vitest');
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => { cleanup(); try { localStorage.clear(); sessionStorage.clear(); } catch { /* no storage */ } });
}
