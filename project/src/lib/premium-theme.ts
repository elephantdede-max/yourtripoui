import { useEffect } from 'react';

/**
 * Toggle le thème Premium clair sur <body>.
 * À appeler depuis un composant racine (App.tsx) avec le statut Premium du user.
 */
export function usePremiumTheme(isPremium: boolean) {
  useEffect(() => {
    if (isPremium) {
      document.body.classList.add('theme-premium');
    } else {
      document.body.classList.remove('theme-premium');
    }
    return () => document.body.classList.remove('theme-premium');
  }, [isPremium]);
}