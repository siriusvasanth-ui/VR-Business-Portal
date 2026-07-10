import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ColorModeProvider } from './context/ColorModeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ColorModeProvider>
  </React.StrictMode>
);
