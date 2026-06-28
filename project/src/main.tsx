import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/auth-context.tsx';
import { LangProvider } from './lib/lang-context.tsx';
import { ThemeProvider } from './lib/theme-context.tsx';
import { NotifProvider } from './lib/notif-context.tsx';
import { ToastProvider } from './lib/toast-context.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { initSentry } from './lib/sentry.ts';
import './index.css';


// ── Sentry (monitoring des erreurs prod) ──
// Ne fait rien si VITE_SENTRY_DSN n'est pas défini ou en mode dev
initSentry();

// ── Debug console mobile (activée via ?debug=1 dans l'URL) ──
if (import.meta.env.DEV || window.location.search.includes('debug=1')) {
  import('eruda').then((eruda) => eruda.default.init());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LangProvider>
            <NotifProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NotifProvider>
          </LangProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
