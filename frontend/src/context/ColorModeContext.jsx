import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from '../theme/theme';

const ColorModeContext = createContext(null);
const MODE_KEY = 'vr_color_mode';

/** Provides light/dark mode with a toggle, persisted to localStorage. */
export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'light');

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(MODE_KEY, next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within a ColorModeProvider');
  return ctx;
}
