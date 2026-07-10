import { createTheme } from '@mui/material/styles';

/** Builds a light or dark MUI theme sharing the same brand palette. */
export function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1565c0' },
      secondary: { main: '#7b1fa2' },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      ...(mode === 'light'
        ? { background: { default: '#f4f6f8', paper: '#ffffff' } }
        : { background: { default: '#0f1720', paper: '#151f2b' } })
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 }
    },
    components: {
      MuiCard: { defaultProps: { elevation: 2 } },
      MuiButton: { defaultProps: { disableElevation: true } }
    }
  });
}
