import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === 'dark';
  const primary = dark ? '#8aa2ff' : '#3651d4';
  return createTheme({
    palette: {
      mode,
      primary: { main: primary },
      secondary: { main: dark ? '#4fd1a5' : '#08774f' },
      success: { main: dark ? '#5fd38d' : '#1e7b45' },
      warning: { main: dark ? '#f2b84b' : '#a45c00' },
      error: { main: dark ? '#ff7b7b' : '#c62828' },
      info: { main: dark ? '#6cc4ff' : '#0b69a3' },
      background: dark ? { default: '#0f1219', paper: '#171b25' } : { default: '#f5f6fa', paper: '#ffffff' },
      divider: dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,30,60,0.10)',
      text: dark ? { primary: '#e7e9f0', secondary: '#a4abbd' } : { primary: '#1b2033', secondary: '#555d73' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, Roboto, system-ui, -apple-system, sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.4 },
      h5: { fontWeight: 700, letterSpacing: -0.2 },
      h6: { fontWeight: 650 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider }) },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 }, sizeSmall: { height: 22 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(8px)',
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
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
