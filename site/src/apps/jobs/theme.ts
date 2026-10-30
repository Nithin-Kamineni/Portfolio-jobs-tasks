import { alpha, createTheme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type { Theme as SiteTheme } from '../../components/site/ThemeToggle';

// The portfolio's three themes (src/styles/styles.css tokens), as MUI palettes. MUI needs real colours
// for its alpha/contrast maths, so the values are repeated here; keep them in step with styles.css.
const PALETTES = {
  dark: {
    bg: '#06080c', paper: '#0c1017', line: '#243044', text: '#e6edf3', text2: '#a3b0c0',
    cyan: '#22d3ee', copper: '#cd8c52', green: '#34d399', amber: '#f5a524', rose: '#fb7185', violet: '#a78bfa',
  },
  dim: {
    bg: '#121821', paper: '#1a2230', line: '#334056', text: '#edf1f6', text2: '#b2bdca',
    cyan: '#45d3e8', copper: '#d69a63', green: '#4ade9a', amber: '#f5a524', rose: '#fb7185', violet: '#b6a3fc',
  },
  light: {
    bg: '#f5f3ee', paper: '#fffdf9', line: '#d5d0c5', text: '#161b22', text2: '#4a5361',
    cyan: '#0e7490', copper: '#a8622a', green: '#047857', amber: '#b45309', rose: '#be123c', violet: '#6d28d9',
  },
} satisfies Record<SiteTheme, Record<string, string>>;

const SANS = "'Inter', 'Inter Fallback', system-ui, sans-serif";
const DISPLAY = "'Space Grotesk', 'Space Grotesk Fallback', 'Inter', sans-serif";
const MONO = "'JetBrains Mono', 'JetBrains Mono Fallback', ui-monospace, monospace";

export function createAppTheme(site: SiteTheme) {
  const p = PALETTES[site];
  return createTheme({
    palette: {
      mode: site === 'light' ? 'light' : 'dark',
      primary: { main: p.cyan },
      secondary: { main: p.copper },
      success: { main: p.green },
      warning: { main: p.amber },
      error: { main: p.rose },
      info: { main: p.violet },
      background: { default: p.bg, paper: p.paper },
      divider: p.line,
      text: { primary: p.text, secondary: p.text2 },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: SANS,
      h4: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: -0.4 },
      h5: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: -0.2 },
      h6: { fontFamily: DISPLAY, fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      overline: { fontFamily: MONO, letterSpacing: '0.12em' },
      caption: { fontFamily: MONO },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      // Keep the portfolio's dotted background (styles.css body); MUI only sets the same base colour.
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: p.bg } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider, borderRadius: 14 }) },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 }, sizeSmall: { height: 22 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.default, 0.86),
            backdropFilter: 'blur(10px)',
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiDrawer: { styleOverrides: { paper: ({ theme }) => ({ backgroundColor: alpha(theme.palette.background.default, 0.92) }) } },
      MuiDataGrid: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            '& .MuiDataGrid-columnHeaders': { fontWeight: 600 },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          }),
        },
      },
    },
  });
}
