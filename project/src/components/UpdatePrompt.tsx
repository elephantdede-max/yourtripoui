/**
 * UpdatePrompt — Bandeau "Nouvelle version disponible"
 *
 * S'affiche en bas d'écran quand le Service Worker a téléchargé une nouvelle
 * version de l'app. L'utilisateur clique pour recharger et avoir la dernière version.
 *
 * Important pour les PWA installées sur iPhone : sans ça, l'utilisateur peut rester
 * sur une version cachée pendant des jours.
 */

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const checkForUpdate = (reg: ServiceWorkerRegistration) => {
      registration = reg;
      // Vérification toutes les heures
      const interval = setInterval(() => reg.update(), 60 * 60 * 1000);

      // Si un nouveau SW est en attente d'activation
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateReady(true);
      }

      // Quand un nouveau SW est trouvé
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Un nouveau SW est prêt mais un ancien est encore actif
            setWaitingWorker(newWorker);
            setUpdateReady(true);
          }
        });
      });

      return () => clearInterval(interval);
    };

    navigator.serviceWorker.ready.then(checkForUpdate);

    // Quand le SW prend le contrôle, on recharge automatiquement
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!updateReady || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: 'rgba(15,12,8,0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--accent, #C9A961)',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 24px rgba(201,169,97,0.20)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--f-body)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div style={{
        flexShrink: 0,
        width: 32, height: 32,
        borderRadius: '50%',
        background: 'rgba(201,169,97,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <RefreshCw size={16} strokeWidth={2.2} color="var(--accent, #C9A961)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 2,
        }}>
          Nouvelle version disponible
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          Recharger pour mettre à jour
        </div>
      </div>

      <button
        type="button"
        onClick={handleUpdate}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'var(--accent, #C9A961)',
          color: '#1A1208',
          border: 'none',
          fontFamily: 'var(--f-body)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        Recharger
      </button>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Ignorer"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
