/**
 * ErrorBoundary — Empêche les crashs blancs
 *
 * Si un composant React lance une exception non-attrapée, ce composant
 * affiche un écran de récupération propre au lieu d'une page blanche.
 *
 * Utilisation : envelopper <App /> dans main.tsx :
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface Props {
  children: ReactNode;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log local pour debug (visible dans la console)
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack });
    // En prod, on pourrait envoyer ça à Sentry ici :
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReload = () => {
    // Vide le cache du SW au cas où l'erreur vient d'un asset corrompu
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
    window.location.reload();
  };

  handleReset = () => {
    // Réinitialise sans recharger (cas où l'erreur est dans un sous-composant)
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        fontFamily: 'var(--f-body)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(248,113,113,0.10)',
          border: '1px solid rgba(248,113,113,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <AlertTriangle size={28} strokeWidth={1.8} color="#F87171" />
        </div>

        <h1 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--text)',
          margin: '0 0 12px',
          letterSpacing: '-0.01em',
        }}>
          Oups, quelque chose a planté
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          maxWidth: 320,
          lineHeight: 1.5,
          margin: '0 0 28px',
        }}>
          Une erreur inattendue est survenue. Recharger l'application devrait régler le problème.
        </p>

        {/* Détails de l'erreur (collapsible, pour debug en prod) */}
        {this.state.error && (
          <details style={{
            marginBottom: 28,
            padding: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(244,238,223,0.10)',
            borderRadius: 12,
            maxWidth: 380,
            width: '100%',
            textAlign: 'left',
          }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--f-mono)',
              color: 'var(--text-faint)',
              letterSpacing: '0.05em',
            }}>
              Détails techniques
            </summary>
            <pre style={{
              marginTop: 10,
              fontSize: 11,
              fontFamily: 'var(--f-mono)',
              color: 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflow: 'auto',
              lineHeight: 1.5,
            }}>
              {this.state.error.message}
              {this.state.errorInfo && '\n' + this.state.errorInfo.slice(0, 500)}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', width: '100%', maxWidth: 280 }}>
          <button
            onClick={this.handleReload}
            style={{
              padding: '14px 22px',
              borderRadius: 999,
              background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
              border: 'none',
              color: '#1A1208',
              fontFamily: 'var(--f-body)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(212,168,67,0.30)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <RefreshCw size={15} strokeWidth={2.2} />
            Recharger l'application
          </button>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid rgba(244,238,223,0.15)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--f-body)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            Essayer de continuer
          </button>
        </div>
      </div>
    );
  }
}
