import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://cbvjhenkmwgfvmwzowli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidmpoZW5rbXdnZnZtd3pvd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTc4ODEsImV4cCI6MjA5Mzk5Mzg4MX0.g1uj11KeLP1zeipSmT4Nz1sbU43W0GMsrML0AztI7f4'
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ─────────────────────────────────────────────
// TRIPS — Sauvegarde d'un voyage (décomposé)
// ─────────────────────────────────────────────

/**
 * Sauvegarde un voyage complet :
 *  - 1 ligne dans `trips`
 *  - N lignes dans `day_plans` (1 par jour)
 *
 * Retourne le trip_id pour utilisation ultérieure (J'adore, notes...)
 */
export async function savePlan(city: string, planData: any): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Insérer le voyage parent
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .insert([{
      user_id: user.id,
      city,
      title: `${city} — ${planData?.days?.length || 1} jour(s)`,
    }])
    .select()
    .single();

  if (tripErr) throw tripErr;
  if (!trip) throw new Error('Échec création trip');

  // 2. Insérer chaque jour
  const days = planData?.days || [];
  if (days.length > 0) {
    const dayRows = days.map((d: any, i: number) => {
      const [sh] = (d.startTime || '10:00').split(':').map(Number);
      const [eh] = (d.endTime || '22:00').split(':').map(Number);
      return {
        trip_id: trip.id,
        user_id: user.id,
        date: d.date,
        day_number: i + 1,
        start_hour: sh,
        end_hour: eh,
        planning: d, // tout le contenu du jour (steps, title, etc.) en JSON
        loved: false,
        review_triggered: false,
      };
    });

    const { error: daysErr } = await supabase.from('day_plans').insert(dayRows);
    if (daysErr) throw daysErr;
  }

  return trip.id;
}

/**
 * Récupère tous les voyages du user, reconstitués au format MultiDayPlan.
 * Retourne un array d'objets : { id, city, plan_data, created_at }
 * (compatible avec ton HomeScreen actuel)
 */
export async function getSavedPlans(): Promise<any[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Récupérer tous les voyages du user
 const { data: trips, error: tripsErr } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', user.id)
  .is('deleted_at', null)
  .order('created_at', { ascending: false });
  if (tripsErr) throw tripsErr;
  if (!trips || trips.length === 0) return [];

  // 2. Récupérer tous les day_plans associés
  const tripIds = trips.map(t => t.id);
  const { data: allDays, error: daysErr } = await supabase
    .from('day_plans')
    .select('*')
    .in('trip_id', tripIds)
    .order('day_number', { ascending: true });

  if (daysErr) throw daysErr;

  // 3. Reconstruire le format MultiDayPlan attendu par l'UI
  return trips.map(trip => {
    const tripDays = (allDays || []).filter(d => d.trip_id === trip.id);
    const reconstructedPlan = {
      city: trip.city,
      days: tripDays.map(d => d.planning || {}),
    };
    return {
      id: trip.id,
      city: trip.city,
      plan_data: reconstructedPlan,
      created_at: trip.created_at,
    };
  });
}

/**
 * Met à jour un voyage existant (modifications de durée, ordre, remplacement de lieu).
 * On supprime tous les day_plans existants et on les re-insère.
 */
export async function updatePlan(tripId: string, planData: any): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Supprimer les day_plans existants de ce trip
  const { error: delErr } = await supabase
    .from('day_plans')
    .delete()
    .eq('trip_id', tripId);
  if (delErr) throw delErr;

  // 2. Re-insérer chaque jour avec les nouvelles données
  const days = planData?.days || [];
  if (days.length > 0) {
    const dayRows = days.map((d: any, i: number) => {
      const [sh] = (d.startTime || '10:00').split(':').map(Number);
      const [eh] = (d.endTime || '22:00').split(':').map(Number);
      return {
        trip_id: tripId,
        user_id: user.id,
        date: d.date,
        day_number: i + 1,
        start_hour: sh,
        end_hour: eh,
        planning: d,
      };
    });

    const { error: dayErr } = await supabase
      .from('day_plans')
      .insert(dayRows);
    if (dayErr) throw dayErr;
  }

  // 3. Mettre à jour la date de modif du trip
  await supabase
    .from('trips')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', tripId);
}

/**
 * Marquer un voyage comme aimé (clic J'adore)
 */
export async function markTripAsLoved(tripId: string) {
  const { error } = await supabase
    .from('day_plans')
    .update({ loved: true })
    .eq('trip_id', tripId);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// RESERVATIONS (inchangé)
// ─────────────────────────────────────────────

export async function createReservation(
  placeId: string, placeName: string, city: string,
  date: string, startTime: string, endTime: string,
  numPeople: number, allergies: string, indoorPreference: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      user_id: user.id,
      place_id: placeId,
      place_name: placeName,
      city,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      num_people: numPeople,
      allergies: allergies || null,
      indoor_preference: indoorPreference,
      status: 'pending',
    }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getReservations() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateReservation(reservationId: string, updates: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// REVIEWS — Notes utilisateurs
// ─────────────────────────────────────────────

export async function submitReview(
  placeId: number | string,
  rating: number,
  tripId?: string | null,
  comment?: string | null,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

   

  const { error } = await supabase
    .from('reviews')
    .upsert(
      {
        user_id: user.id,
        place_id: typeof placeId === 'string' ? parseInt(placeId, 10) : placeId,
        rating,
        trip_id: tripId || null,
        comment: comment || null,
      },
      { onConflict: 'user_id,place_id' }
    );

  if (error) throw error;
}

export async function getMyReviewsForTrip(tripId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .select('place_id, rating, comment')
    .eq('user_id', user.id)
    .eq('trip_id', tripId);

  if (error) throw error;
  return data || [];
}

export async function hasReviewedTrip(tripId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('trip_id', tripId);

  if (error) return false;
  return (count || 0) > 0;
}

/**
 * Soft-delete d'un voyage : invisible côté user, conservé en base
 */
export async function deleteTrip(tripId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('trips')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tripId)
    .eq('user_id', user.id);

  if (error) throw error;


}
/**
 * Calcule la note moyenne d'un voyage à partir des reviews de l'user
 */
export async function getTripAverageRating(tripId: string): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', user.id)
    .eq('trip_id', tripId);
  if (!data || data.length === 0) return null;
  const ratings = data.filter(r => r.rating != null).map(r => Number(r.rating));
  if (ratings.length === 0) return null;
  const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
}