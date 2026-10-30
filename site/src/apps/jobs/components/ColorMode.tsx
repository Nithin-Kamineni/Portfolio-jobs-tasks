import { useMemo, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme } from '../theme';
import { useTheme as useSiteTheme } from '../../../components/site/ThemeToggle';

/** Follows the portfolio's theme (dark, dim, light): the workspace bar's theme button switches both. */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const site = useSiteTheme();
  const theme = useMemo(() => createAppTheme(site), [site]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
