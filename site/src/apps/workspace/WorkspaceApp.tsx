// The Tasks area of the workspace: sub-tabs under one router (basename /app/tasks). Where you were
// (tab and sub-page, project, focus, filters, how far down each page you scrolled) is saved on the
// server, so a refresh, another device or coming back to a tab opens in the same place.
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { readStore, UiStateProvider, useUiStore, writeStore } from './api';
import { ConfirmProvider, ToastProvider } from './ui';
import ReadingList from './reading/ReadingList';
import Prep from './prep/Prep';
import Docs from './docs/Docs';
import Coding from './coding/Coding';
import Questions from './questions/Questions';
import History from './history/History';
import Today from './today/Today';
import { SearchPanel } from './search/Search';
import { JumpRunner } from './search/jump';
import './ws.css';
import './study.css';

const TABS = [
  { to: '/today', label: 'Today' },
  { to: '/reading', label: 'Reading list' },
  { to: '/prep', label: 'Interview prep' },
  { to: '/questions', label: 'Questions' },
  { to: '/docs', label: 'Tasks' },
  { to: '/coding', label: 'Coding' },
  { to: '/history', label: 'History' },
];
const LAST = 'ws.lastPath';
const LAST_BY_TAB = 'ws.lastPathByTab'; // each tab's own last sub-page (e.g. a prep track, the weekly plan)
const SCROLL = 'ws.scroll';              // scroll position per page, newest 40
const tabOf = (path: string) => TABS.find((t) => path === t.to || path.startsWith(t.to + '/'));

/** Puts the window back where it was on this page; waits (up to 4 s) for the content to load. */
function useScrollMemory(path: string) {
  const ui = useUiStore();
  useEffect(() => {
    const all = (ui?.values[SCROLL] as Record<string, number> | undefined) ?? readStore<Record<string, number>>(SCROLL, {});
    const target = all[path] ?? 0;
    let tries = 0, timer: ReturnType<typeof setTimeout> | undefined, save: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { clearTimeout(timer); timer = undefined; };
    const restore = () => {
      if (document.documentElement.scrollHeight - innerHeight >= target - 4 || tries++ > 40) { scrollTo(0, target); timer = undefined; return; }
      timer = setTimeout(restore, 100);
    };
    restore();
    // The user's own scrolling wins over a pending restore.
    const userMoved = () => stop();
    const onScroll = () => {
      if (timer) return;
      clearTimeout(save);
      save = setTimeout(() => {
        const cur = { ...((ui?.values[SCROLL] as Record<string, number> | undefined) ?? readStore<Record<string, number>>(SCROLL, {})) };
        delete cur[path];
        const next = Object.fromEntries([...Object.entries(cur), [path, Math.round(scrollY)]].slice(-40));
        writeStore(SCROLL, next);
        ui?.set(SCROLL, next);
      }, 350);
    };
    addEventListener('wheel', userMoved, { passive: true }); addEventListener('touchmove', userMoved, { passive: true }); addEventListener('keydown', userMoved);
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stop(); clearTimeout(save);
      removeEventListener('wheel', userMoved); removeEventListener('touchmove', userMoved); removeEventListener('keydown', userMoved);
      removeEventListener('scroll', onScroll);
    };
  }, [path, ui]);
}

function Shell() {
  const loc = useLocation();
  const ui = useUiStore();
  const tab = tabOf(loc.pathname);
  const byTab = { ...((ui?.values[LAST_BY_TAB] as Record<string, string> | undefined) ?? readStore<Record<string, string>>(LAST_BY_TAB, {})), ...(tab ? { [tab.to]: loc.pathname } : {}) };
  useEffect(() => {
    if (!tab) return;
    writeStore(LAST, loc.pathname);
    ui?.set(LAST, loc.pathname);
    writeStore(LAST_BY_TAB, byTab);
    ui?.set(LAST_BY_TAB, byTab);
  }, [loc.pathname, ui]); // eslint-disable-line react-hooks/exhaustive-deps
  useScrollMemory(loc.pathname);
  const last = (ui?.values[LAST] as string | undefined) ?? readStore(LAST, readStore('ws.lastTab', '/today'));
  // A tab opens on its own last sub-page (a prep track, the weekly plan, the open document…).
  const tabLink = (to: string) => byTab[to] ?? to;
  // Global search: Ctrl+K (in a document Ctrl+K adds a link, so there it is Ctrl+Shift+F, which works everywhere).
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      const inEditor = !!(e.target as HTMLElement | null)?.closest?.('.ProseMirror');
      if (mod && ((k === 'k' && !e.shiftKey && !inEditor) || (k === 'f' && e.shiftKey))) {
        e.preventDefault();
        setSearchOpen(true);
        (document.querySelector('.ws-search input') as HTMLInputElement | null)?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { document.body.classList.toggle('ws-search-open', searchOpen); return () => document.body.classList.remove('ws-search-open'); }, [searchOpen]);
  return (
    <div className="ws-app">
      <nav className="ws-subnav" aria-label="Tasks sections">
        {TABS.map((t) => <NavLink key={t.to} to={tabLink(t.to)} className={() => (tab?.to === t.to ? 'active' : '')}>{t.label}</NavLink>)}
        <button className="ws-search-btn" onClick={() => setSearchOpen(!searchOpen)} aria-pressed={searchOpen} title="Search everything (Ctrl+K)">⌕ Search <kbd>Ctrl K</kbd></button>
      </nav>
      <main className="ws-main">
      <Routes>
        <Route path="/" element={<Navigate to={TABS.some((t) => last.startsWith(t.to)) ? last : '/today'} replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/reading" element={<ReadingList />} />
        <Route path="/prep/*" element={<Prep />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/questions/:id" element={<Questions />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:id" element={<Docs />} />
        <Route path="/coding/*" element={<Coding />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} query={query} setQuery={setQuery} />
      <JumpRunner />
    </div>
  );
}

export default function WorkspaceApp() {
  return (
    <BrowserRouter basename="/app/tasks" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UiStateProvider>
        <ConfirmProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </ConfirmProvider>
      </UiStateProvider>
    </BrowserRouter>
  );
}
