import type { MultiDayPlan } from '../types';

const STORAGE_KEY = 'jorne_pending_plan';
const EXPIRATION_MS = 60 * 60 * 1000; // 1 heure

interface PendingPlan {
  plan: MultiDayPlan;
  createdAt: number;
}

/**
 * Sauvegarde une génération non validée dans localStorage
 */
export function savePendingPlan(plan: MultiDayPlan): void {
  try {
    const data: PendingPlan = { plan, createdAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('savePendingPlan failed:', e);
  }
}

/**
 * Récupère la dernière génération non validée si elle existe et n'a pas expiré.
 * Retourne null sinon (et nettoie localStorage si expiré).
 */
export function getPendingPlan(): { plan: MultiDayPlan; minutesAgo: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: PendingPlan = JSON.parse(raw);
    const age = Date.now() - data.createdAt;
    if (age > EXPIRATION_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { plan: data.plan, minutesAgo: Math.floor(age / 60000) };
  } catch {
    return null;
  }
}

/**
 * Supprime la sauvegarde temporaire (à appeler si l'user sauvegarde "J'adore"
 * OU s'il ignore la proposition de récupération)
 */
export function clearPendingPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}