import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery, type PaletteMode } from '@mui/material';
import { createAppTheme } from '../theme';
import { readStore, writeStore } from '../lib/storage';

const Ctx = createContext<{ mode: PaletteMode; toggle: () => void }>({ mode: 'light', toggle: () => undefined });

/** Light/dark theme; the choice is remembered in localStorage (default: the OS setting). */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const [mode, setMode] = useState<PaletteMode>(() => readStore<PaletteMode | null>('jw.colorMode', null) || (prefersDark ? 'dark' : 'light'));
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({
    mode,
    toggle: () => setMode((m) => { const next = m === 'dark' ? 'light' : 'dark'; writeStore('jw.colorMode', next); return next; }),
  }), [mode]);
  return (
    <Ctx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export const useColorMode = () => useContext(Ctx);
