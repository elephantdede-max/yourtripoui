/**
 * Service Worker — Your Trip
 *
 * Combine :
 * - Push notifications (existant)
 * - Workbox : cache offline des assets + API
 * - Stratégie de cache adaptative par type de requête
 *
 * Stratégies :
 * - Assets (JS, CSS, fonts, images) : Cache First (rapide)
 * - API Supabase : Network First (5s timeout puis cache)
 * - Tiles Leaflet : Stale While Revalidate (utilise cache, met à jour en arrière-plan)
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// ─── 1. Précache des assets buildés par Vite ───
// __WB_MANIFEST est remplacé au build par la liste des fichiers
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ─── 2. Cache des polices Google ───
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
      }),
    ],
  }),
);

// ─── 3. Cache des tuiles Leaflet (OSM) ───
registerRoute(
  ({ url }) =>
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('basemaps.cartocdn.com'),
  new StaleWhileRevalidate({
    cacheName: 'map-tiles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
      }),
    ],
  }),
);

// ─── 4. Cache des images uploadées (Supabase Storage) ───
registerRoute(
  ({ url }) =>
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/storage/'),
  new CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
      }),
    ],
  }),
);

// ─── 5. API Supabase REST (places, profiles, etc.) : Network First ───
// Essaie le réseau (5s timeout) puis tombe sur le cache si offline
registerRoute(
  ({ url }) =>
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/rest/v1/'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 semaine
      }),
    ],
  }),
);

// ─── 6. PUSH NOTIFICATIONS (existant) ───
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception d'un push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Your Trip', body: event.data.text() };
  }

  const title = data.title || 'Your Trip';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'default',
    data: data.url ? { url: data.url } : undefined,
    vibrate: [50, 30, 50],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur notif → ouvrir l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, focus dessus
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(url);
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});

// ─── 7. Message du client (pour forcer update) ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});