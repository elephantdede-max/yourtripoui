/**
 * Offline Storage — D2
 *
 * Stocke les voyages sauvegardés dans IndexedDB pour qu'ils restent
 * accessibles sans réseau.
 *
 * Pourquoi IndexedDB et pas localStorage ?
 * - localStorage est limité à ~5 Mo et bloque le thread principal
 * - IndexedDB peut stocker plusieurs Go et est asynchrone
 * - Persistence garantie (pas vidée par iOS Safari à la légère)
 *
 * À placer dans : src/lib/offline-storage.ts
 */

const DB_NAME = 'yourtrip-offline';
const DB_VERSION = 1;
const STORE_TRIPS = 'trips';

interface OfflineTrip {
  id: string;
  city: string;
  plan_data: unknown;
  created_at: string;
  cached_at: number; // timestamp pour expiration éventuelle
}

// ─── Ouverture de la BDD ───
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(new Error('IndexedDB indisponible'));
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Créer le store si pas existant
      if (!db.objectStoreNames.contains(STORE_TRIPS)) {
        const store = db.createObjectStore(STORE_TRIPS, { keyPath: 'id' });
        store.createIndex('cached_at', 'cached_at', { unique: false });
      }
    };
  });
}

// ─── API : sauvegarder un voyage ───
export async function cacheTrip(trip: {
  id: string;
  city: string;
  plan_data: unknown;
  created_at: string;
}): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readwrite');
    const store = tx.objectStore(STORE_TRIPS);

    const offlineTrip: OfflineTrip = {
      ...trip,
      cached_at: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const req = store.put(offlineTrip);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    db.close();
  } catch (e) {
    console.warn('[offline] cacheTrip failed', e);
  }
}

// ─── API : récupérer tous les voyages en cache ───
export async function getCachedTrips(): Promise<OfflineTrip[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readonly');
    const store = tx.objectStore(STORE_TRIPS);

    const trips = await new Promise<OfflineTrip[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    db.close();
    // Trier par created_at (plus récent en premier)
    return trips.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (e) {
    console.warn('[offline] getCachedTrips failed', e);
    return [];
  }
}

// ─── API : récupérer un voyage spécifique ───
export async function getCachedTrip(id: string): Promise<OfflineTrip | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readonly');
    const store = tx.objectStore(STORE_TRIPS);

    const trip = await new Promise<OfflineTrip | null>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    db.close();
    return trip;
  } catch (e) {
    console.warn('[offline] getCachedTrip failed', e);
    return null;
  }
}

// ─── API : supprimer un voyage du cache ───
export async function removeCachedTrip(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readwrite');
    const store = tx.objectStore(STORE_TRIPS);

    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    db.close();
  } catch (e) {
    console.warn('[offline] removeCachedTrip failed', e);
  }
}

// ─── API : vider tout le cache (utile à la déconnexion) ───
export async function clearAllCachedTrips(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readwrite');
    const store = tx.objectStore(STORE_TRIPS);

    await new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    db.close();
  } catch (e) {
    console.warn('[offline] clearAllCachedTrips failed', e);
  }
}

// ─── API : synchroniser le cache avec une liste fraîche ───
// Appelée quand on a une réponse réseau réussie : on remplace tout
export async function syncTripsToCache(trips: Array<{
  id: string;
  city: string;
  plan_data: unknown;
  created_at: string;
}>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_TRIPS, 'readwrite');
    const store = tx.objectStore(STORE_TRIPS);

    // 1. Vider le cache existant
    await new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 2. Insérer les nouveaux
    const now = Date.now();
    for (const t of trips) {
      store.put({ ...t, cached_at: now });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (e) {
    console.warn('[offline] syncTripsToCache failed', e);
  }
}

// ─── API : stats du cache ───
export async function getCacheStats(): Promise<{
  count: number;
  totalSize: number;
  oldest: number | null;
}> {
  try {
    const trips = await getCachedTrips();
    const totalSize = new Blob([JSON.stringify(trips)]).size;
    const oldest = trips.length > 0
      ? Math.min(...trips.map(t => t.cached_at))
      : null;
    return { count: trips.length, totalSize, oldest };
  } catch {
    return { count: 0, totalSize: 0, oldest: null };
  }
}