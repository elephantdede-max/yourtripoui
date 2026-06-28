const STORAGE_KEY_PREFIX = 'yt_replacements_';
const MAX_FREE_REPLACEMENTS = 5;

/**
 * Renvoie le nombre de remplacements déjà utilisés pour ce voyage
 */
export function getReplacementCount(tripKey: string): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY_PREFIX + tripKey);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Incrémente le compteur pour ce voyage
 */
export function incrementReplacementCount(tripKey: string): number {
  const current = getReplacementCount(tripKey);
  const next = current + 1;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + tripKey, String(next));
  } catch {}
  return next;
}

/**
 * Vérifie si l'user peut encore remplacer (selon isPremium)
 */
export function canReplace(tripKey: string, isPremium: boolean): boolean {
  if (isPremium) return true;
  return getReplacementCount(tripKey) < MAX_FREE_REPLACEMENTS;
}

/**
 * Nombre de remplacements restants (null si premium = illimité)
 */
export function getRemainingReplacements(tripKey: string, isPremium: boolean): number | null {
  if (isPremium) return null;
  return Math.max(0, MAX_FREE_REPLACEMENTS - getReplacementCount(tripKey));
}

export { MAX_FREE_REPLACEMENTS };