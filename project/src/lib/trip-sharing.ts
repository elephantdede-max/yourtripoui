/**
 * Trip sharing — Lot D
 *
 * Active/désactive le partage public d'un voyage et récupère sa version publique.
 * À placer dans : src/lib/trip-sharing.ts
 */

import { supabase } from './supabase';
import type { MultiDayPlan } from '../types';

/**
 * Active le partage d'un voyage et retourne le lien public.
 * Si déjà partagé, retourne le lien existant.
 */
export async function enableSharing(tripId: string): Promise<string> {
  // 1. Vérifier si déjà partagé
  const { data: existing, error: getErr } = await supabase
    .from('trips')
    .select('share_token, is_public')
    .eq('id', tripId)
    .single();

  if (getErr) throw getErr;

  // Si déjà partagé avec token, on retourne juste le lien
  if (existing?.is_public && existing.share_token) {
    return buildShareUrl(existing.share_token);
  }

  // 2. Sinon, générer un token et activer
  // On utilise la fonction SQL generate_share_token()
  const { data, error } = await supabase.rpc('generate_share_token');
  if (error) throw error;

  const token = data as string;

  const { error: updateErr } = await supabase
    .from('trips')
    .update({
      share_token: token,
      is_public: true,
      shared_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  if (updateErr) throw updateErr;

  return buildShareUrl(token);
}

/**
 * Désactive le partage (le lien existant cesse de fonctionner).
 */
export async function disableSharing(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ is_public: false })
    .eq('id', tripId);
  if (error) throw error;
}

/**
 * Récupère un voyage public depuis son token (sans auth).
 * Retourne null si voyage introuvable ou partage désactivé.
 */
export async function getPublicTripByToken(token: string): Promise<{
  trip: { id: string; city: string; title: string; created_at: string };
  plan: MultiDayPlan;
} | null> {
  // 1. Récupérer le trip
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id, city, title, created_at, is_public')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();

  if (tripErr || !trip) return null;

  // 2. Récupérer les jours
  const { data: days, error: daysErr } = await supabase
    .from('day_plans')
    .select('date, day_number, planning, start_hour, end_hour')
    .eq('trip_id', trip.id)
    .order('day_number', { ascending: true });

  if (daysErr || !days) return null;

  // 3. Reconstituer le MultiDayPlan
  const plan: MultiDayPlan = {
    city: trip.city,
    days: days.map((d: any) => d.planning),
  };

  return { trip, plan };
}

/**
 * Construit l'URL publique à partir d'un token.
 * À adapter si tu changes de domaine.
 */
function buildShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourtrip-ten.vercel.app';
  return `${origin}/trip/${token}`;
}

/**
 * Vérifie si l'URL courante est un lien public.
 * Retourne le token si oui, null sinon.
 */
export function getShareTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/trip\/([a-z0-9]{8,32})\/?$/i);
  return match ? match[1] : null;
}