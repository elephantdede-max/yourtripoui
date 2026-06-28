/**
 * Sentry monitoring — Lot C
 *
 * Setup minimaliste de Sentry pour capturer les erreurs en prod.
 * Gratuit jusqu'à 5K events/mois.
 *
 * Setup :
 * 1. Créer un compte sur https://sentry.io (gratuit)
 * 2. Créer un projet "React" → récupérer le DSN
 * 3. Ajouter dans .env : VITE_SENTRY_DSN=https://xxx@sentry.io/yyy
 * 4. Sur Vercel : ajouter VITE_SENTRY_DSN dans les env vars
 * 5. Installer : npm install @sentry/react
 * 6. Importer initSentry() au top de main.tsx (avant createRoot)
 */

const DSN = import.meta.env.VITE_SENTRY_DSN;

let sentry: any = null;

/**
 * Initialise Sentry (à appeler une seule fois au démarrage de l'app).
 * Ne fait rien si VITE_SENTRY_DSN n'est pas défini (= en dev local).
 */
export async function initSentry(): Promise<void> {
  if (!DSN || import.meta.env.DEV) {
    console.log('[Sentry] disabled (no DSN or dev mode)');
    return;
  }

  try {
    // Import dynamique pour ne pas charger Sentry en dev
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      // Échantillonnage : on n'envoie pas TOUS les events (économise quota)
      tracesSampleRate: 0.1,        // 10% des transactions de perf
      replaysSessionSampleRate: 0,  // 0% des replays user (payant)
      replaysOnErrorSampleRate: 0.1, // 10% si erreur
      // Filtrer les bruits
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed',
        'Non-Error promise rejection captured',
        'Network request failed', // courant sur mobile avec connexion instable
        'Failed to fetch',
        // Erreurs de cancellation user (pas des vrais bugs)
        'AbortError',
        'cancelled',
      ],
      beforeSend(event) {
        // Vire les events si pas connecté à internet
        if (!navigator.onLine) return null;
        return event;
      },
    });
    sentry = Sentry;
    console.log('[Sentry] initialized');
  } catch (e) {
    console.error('[Sentry] init failed:', e);
  }
}

/**
 * Logue une erreur dans Sentry + console.
 * Utiliser dans les catch des async functions.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[error]', error, context);
  if (!sentry) return;
  try {
    sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  } catch {}
}

/**
 * Logue un événement informatif (pas une erreur).
 */
export function captureMessage(message: string, level: 'info' | 'warning' = 'info'): void {
  if (!sentry) return;
  try {
    sentry.captureMessage(message, level);
  } catch {}
}

/**
 * Attache l'utilisateur courant à tous les futurs events.
 */
export function setSentryUser(userId: string | null, email?: string): void {
  if (!sentry) return;
  try {
    if (userId) sentry.setUser({ id: userId, email });
    else sentry.setUser(null);
  } catch {}
}