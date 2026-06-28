/**
 * Traduit un texte de transport généré en FR par ai-engine.ts vers la langue active.
 * Marche rétroactivement sur tous les voyages existants en parsant le format français.
 *
 * Formats reconnus :
 * - "À pied · ≈ 12 min"
 * - "Vélo · ≈ 4 min"
 * - "Voiture · ≈ 15 min"
 * - "Métro · ≈ 20 min"
 * - "M1 · Châtelet → Bastille · 8 min (+5 min à pied)"
 * - "Châtelet → Bastille (corresp.) · 12 min (+5 min à pied)"
 * - "À pied · 5 min"
 * - "≈ Trajet court"
 */
export function translateTransportText(raw: string, t: (k: string) => string): string {
  if (!raw) return '';
  let s = raw;

  // Cas spéciaux entiers
  if (/^≈\s*Trajet court$/i.test(s)) return t('transport_short_trip');

  // Remplacements ciblés (préfixes de mode)
  s = s.replace(/^À pied\b/i, t('transport_walk'));
  s = s.replace(/^Vélo\b/i, t('transport_bike'));
  s = s.replace(/^Voiture\b/i, t('transport_car'));
  s = s.replace(/^Métro\b/i, t('transport_metro'));

  // "(corresp.)" → traduction
  s = s.replace(/\(corresp\.\)/g, t('transport_changeover'));

  // "X min à pied" → suffixe traduit
  s = s.replace(/(\d+)\s*min à pied/g, `$1 ${t('transport_min_walk')}`);

  return s;
}