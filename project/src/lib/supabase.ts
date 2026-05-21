import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://cbvjhenkmwgfvmwzowli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidmpoZW5rbXdnZnZtd3pvd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTc4ODEsImV4cCI6MjA5Mzk5Mzg4MX0.g1uj11KeLP1zeipSmT4Nz1sbU43W0GMsrML0AztI7f4'
);

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

export async function savePlan(city: string, planData: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Écriture dans saved_plans — table existante dans Supabase
  const { error } = await supabase
    .from('saved_plans')
    .insert([{
      user_id: user.id,
      city,
      plan_data: planData,
    }]);
  if (error) throw error;
}

export async function getSavedPlans(city?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('saved_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (city) {
    query = query.eq('city', city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

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

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw error;
}
