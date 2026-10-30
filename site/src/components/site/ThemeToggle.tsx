// Dark → dim → light. The first paint already has the right theme (inline script in Base.astro);
// this button only cycles it, stores it and keeps every copy of the button in sync.

import { useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'dim' | 'light';
const ORDER: Theme[] = ['dark', 'dim', 'light'];
const NAME: Record<Theme, string> = { dark: 'Dark', dim: 'Dim', light: 'Light' };
const EVENT = 'themechange';

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme as Theme | undefined;
  return t && ORDER.includes(t) ? t : 'dark';
}

function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
}

const subscribe = (on: () => void) => {
  window.addEventListener(EVENT, on);
  return () => window.removeEventListener(EVENT, on);
};

/**
 * Re-renders when the theme changes (for canvas code that reads colours). The prerendered HTML
 * assumes dark; the real theme is applied as soon as the island hydrates.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => 'dark');
}

const ICON: Record<Theme, JSX.Element> = {
  dark: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  dim: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2v14a7 7 0 0 1 0-14z" />,
  light: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M11 1.5h2v3h-2zM11 19.5h2v3h-2zM1.5 11h3v2h-3zM19.5 11h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z" />
    </>
  ),
};

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTheme();
  const next = ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];
  return (
    <button
      type="button"
      className={`theme-btn ${className}`}
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${NAME[t]}. Switch to ${NAME[next]}.`}
      title={`${NAME[t]} theme · click for ${NAME[next]}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">{ICON[t]}</svg>
    </button>
  );
}
