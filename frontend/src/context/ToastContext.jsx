import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

/**
 * Lightweight toast/notification provider built on MUI Snackbar + Alert.
 * Exposes toast.success / .error / .info / .warning helpers.
 */
export function ToastProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', severity: 'info' });

  const show = useCallback((message, severity = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  const toast = {
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
    warning: (m) => show(m, 'warning')
  };

  const handleClose = (_e, reason) => {
    if (reason === 'clickaway') return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
