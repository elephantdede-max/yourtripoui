/**
 * OfflineBanner — D2
 *
 * Bandeau discret en haut de l'écran qui indique l'état de connexion.
 * - "Hors ligne" en rouge quand pas de réseau
 * - "Connexion rétablie" en vert brièvement quand on revient online
 *
 * À placer dans : src/components/OfflineBanner.tsx
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../lib/online-status';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      // On vient juste de retrouver le réseau → afficher "Reconnecté" 3s
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  // Cas 1 : hors ligne → bandeau rouge permanent
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: 0, right: 0,
          zIndex: 99998,
          background: 'rgba(248,113,113,0.96)',
          color: '#fff',
          padding: '6px 14px',
          fontSize: 12,
          fontFamily: 'var(--f-body)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <WifiOff size={13} strokeWidth={2.2} />
        <span>Hors ligne · Voyages sauvegardés disponibles</span>
      </div>
    );
  }

  // Cas 2 : on vient de retrouver le réseau → bandeau vert temporaire
  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: 0, right: 0,
          zIndex: 99998,
          background: 'rgba(74,222,128,0.96)',
          color: '#0a3819',
          padding: '6px 14px',
          fontSize: 12,
          fontFamily: 'var(--f-body)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          animation: 'slideDown 250ms ease',
        }}
      >
        <Wifi size={13} strokeWidth={2.2} />
        <span>Connexion rétablie</span>
        <style>{`
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
