import { supabase } from './supabase';

export async function checkProfileComplete(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('birth_date, gender, country, city')
    .eq('id', userId)
    .single();
  return !!(data?.birth_date && data?.gender && data?.country && data?.city);
}

export async function getUserProfile(userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function createUserProfile(userId: string, profileData: {
  displayName: string;
  birthDate: string;
  gender: string;
  country: string;
  city: string;
}) {
  const { error } = await supabase.from('user_profiles').insert({
    id:           userId,
    display_name: profileData.displayName,
    birth_date:   profileData.birthDate,
    gender:       profileData.gender,
    country:      profileData.country,
    city:         profileData.city,
  });
  if (error) throw error;
}