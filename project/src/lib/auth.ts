import { supabase } from './supabase';
export async function checkProfileComplete(userId: string): Promise<boolean> {
try {
const { data } = await supabase
.from('user_profiles')
.select('birth_date, gender, country, city')
.eq('id', userId)
.maybeSingle();
return !!(data?.birth_date && data?.gender && data?.country && data?.city);
} catch {
return false;
}
}
export async function getUserProfile(userId: string) {
try {
const { data } = await supabase
.from('user_profiles')
.select('*')
.eq('id', userId)
.maybeSingle();
return data;
} catch {
return null;
}
}
export async function createUserProfile(
userId: string,
profileData: {
displayName: string;
birthDate: string;
gender: string;
country: string;
city: string;
}
) {
// 1. S'assurer qu'une session active existe (sinon RLS bloque)
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
throw new Error(
"Session absente. Désactive 'Confirm email' dans Supabase " +
"(Authentication > Email), puis reconnecte-toi."
);
}
const payload = {
id:           userId,
display_name: profileData.displayName,
birth_date:   profileData.birthDate,
gender:       profileData.gender,
country:      profileData.country,
city:         profileData.city,
updated_at:   new Date().toISOString(),
};
// 2. UPSERT — insère ou met à jour
const { error: upErr } = await supabase
.from('user_profiles')
.upsert(payload, { onConflict: 'id' });
if (!upErr) return;
// 3. Fallback UPDATE (si la ligne existe déjà via le trigger)
const { id, ...updateFields } = payload;
const { error: updErr } = await supabase
.from('user_profiles')
.update(updateFields)
.eq('id', userId);
if (updErr) {
// On remonte la VRAIE erreur pour la voir à l'écran
throw new Error('Sauvegarde profil échouée : ' + updErr.message);
}
}