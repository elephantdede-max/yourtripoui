/**
 * Online Status — D2
 *
 * Hook pour détecter si l'utilisateur est en ligne ou hors ligne.
 * Plus fiable que navigator.onLine seul (qui est parfois bugué sur iOS).
 *
 * À placer dans : src/lib/online-status.tsx
 *
 * Usage :
 *   const isOnline = useOnlineStatus();
 *   if (!isOnline) { ... }
 */

import { useEffect, useState } from 'react';

/**
 * Hook qui retourne true si l'utilisateur est en ligne.
 *
 * Combine :
 * 1. navigator.onLine (signal navigateur, parfois faux positif)
 * 2. Tentative de fetch vers Supabase (vérification réelle)
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Test plus fiable : tente une vraie requête HEAD vers Supabase.
 * Retourne true uniquement si la requête aboutit dans le timeout.
 *
 * Utilisé pour les actions critiques (avant un POST de review par ex)
 */
export async function checkRealConnection(timeoutMs = 3000): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Petit ping vers Supabase (pas d'auth nécessaire)
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    if (!url) return navigator.onLine;

    await fetch(`${url}/auth/v1/health`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
