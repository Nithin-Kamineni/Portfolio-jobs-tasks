// Going to a search result: the target page is told which item to show (pages that filter or fold
// their content make sure that item is visible), then the found words are scrolled into view and
// flashed for ~2 s. Also used by links like the Today page's "open this checklist item".
import { useEffect, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Target } from './engine';

export interface Jump extends Target { find: string; words: string[]; field?: string; t: number }
let pending: Jump | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function setJump(j: Omit<Jump, 't'>) { pending = { ...j, t: Date.now() }; emit(); }
function clearJump(j: Jump) { if (pending === j) { pending = null; emit(); } }
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

/** The pending jump for this page's items (its `at` starts with `prefix`), e.g. useJumpTarget('paper'). */
export function useJumpTarget(prefix: string): Jump | null {
  const j = useSyncExternalStore(subscribe, () => pending);
  return j && j.at?.startsWith(prefix + '-') && Date.now() - j.t < 15000 ? j : null;
}
export const targetId = (j: Jump | null) => (j?.at ? j.at.slice(j.at.indexOf('-') + 1) : null);

/** Mounted once (Shell): turns ?find= links into jumps, and runs the scroll + flash after navigation. */
export function JumpRunner() {
  const loc = useLocation();
  const nav = useNavigate();
  const j = useSyncExternalStore(subscribe, () => pending);
  // ?find=… (&at=…) in the address: a link from inside the workspace (e.g. Today → a document).
  useEffect(() => {
    const p = new URLSearchParams(loc.search);
    const find = p.get('find');
    if (!find) return;
    setJump({ path: loc.pathname, at: p.get('at') ?? undefined, find, words: find.toLowerCase().split(/\s+/).filter((w) => w.length > 1) });
    p.delete('find'); p.delete('at');
    nav({ pathname: loc.pathname, search: p.toString() ? `?${p}` : '' }, { replace: true });
  }, [loc.search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!j || !loc.pathname.startsWith(j.path)) return;
    let stop = false;
    const started = Date.now();
    const tryFind = () => {
      if (stop) return;
      const root = (j.at ? document.querySelector<HTMLElement>(`[data-find="${CSS.escape(j.at)}"]`) : null)
        ?? (!j.at || Date.now() - started > 4000 ? document.querySelector<HTMLElement>(j.path.startsWith('/docs/') ? '.doc-page .ProseMirror' : '.ws-main') : null);
      const range = root ? findText(root, j) : null;
      if (range) { reveal(range, root!); clearJump(j); return; }
      if (Date.now() - started > 6000) { if (root) flashBox(root); clearJump(j); return; }
      setTimeout(tryFind, 150);
    };
    const t = setTimeout(tryFind, 60);
    return () => { stop = true; clearTimeout(t); };
  }, [j, loc.pathname]);
  return null;
}

// ---- finding the words in the page ------------------------------------------------------------------
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function findText(root: HTMLElement, j: Jump): Range | null {
  const nodes: Text[] = [], starts: number[] = [];
  let all = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const el = n.parentElement;
      if (!el || el.closest('script,style,.ws-search,[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
      return el.getClientRects().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) { starts.push(all.length); nodes.push(n); all += n.data; }
  if (!all) return null;
  // The whole query as a phrase first (any spacing/punctuation between the words), then each matched word.
  const tokens = j.find.trim().split(/[^\p{L}\p{N}+#]+/u).filter(Boolean);
  const tries: RegExp[] = [];
  if (tokens.length) tries.push(new RegExp(tokens.map(esc).join('[^\\p{L}\\p{N}]*'), 'iu'));
  for (const w of [...new Set([...j.words, ...tokens.map((t) => t.toLowerCase())])].sort((a, b) => b.length - a.length)) if (w.length > 1) tries.push(new RegExp(esc(w), 'i'));
  for (const re of tries) {
    const m = re.exec(all);
    if (!m) continue;
    const at = (pos: number) => { let i = starts.length - 1; while (i > 0 && starts[i] > pos) i--; return { node: nodes[i], off: pos - starts[i] }; };
    const a = at(m.index), b = at(m.index + m[0].length - 1);
    const r = document.createRange();
    r.setStart(a.node, a.off); r.setEnd(b.node, b.off + 1);
    return r;
  }
  return null;
}

function reveal(range: Range, root: HTMLElement) {
  const el = range.startContainer.parentElement ?? root;
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  whenStill(() => range.getBoundingClientRect().top, () => flashRects([...range.getClientRects()]));
}
function flashBox(el: HTMLElement) {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  whenStill(() => el.getBoundingClientRect().top, () => flashRects([el.getBoundingClientRect()], true));
}
/** Runs `done` once the (smooth) scrolling has stopped moving the target. */
function whenStill(top: () => number, done: () => void) {
  let last = NaN, still = 0, n = 0;
  const tick = () => {
    const t = top();
    still = Math.abs(t - last) < 1 ? still + 1 : 0; last = t;
    if (still >= 2 || ++n > 25) done(); else setTimeout(tick, 60);
  };
  setTimeout(tick, 60);
}
function flashRects(rects: DOMRect[], box = false) {
  for (const r of rects.slice(0, 8)) {
    if (!r.width || !r.height) continue;
    const d = document.createElement('div');
    d.className = box ? 'ws-flash ws-flash-box' : 'ws-flash';
    d.setAttribute('aria-hidden', 'true');
    Object.assign(d.style, { left: `${r.left + scrollX - 3}px`, top: `${r.top + scrollY - 2}px`, width: `${r.width + 6}px`, height: `${r.height + 4}px` });
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2400);
  }
}
