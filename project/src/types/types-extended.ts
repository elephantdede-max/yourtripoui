/**
 * Types étendus — Lot C
 *
 * Types qui manquaient et qui causaient des `: any` dans les composants.
 * À placer dans src/types/extended.ts puis importer où nécessaire.
 */

import type { Place, PlaceType, BudgetType } from './index';

// ─── User Profile (depuis Supabase user_profiles) ───
// Champs réels de la table user_profiles
export interface UserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  city?: string | null;
  country?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
  // Permissions / notifs
  notif_enabled?: boolean;
  // Profil de goûts récap
  taste_completed_at?: string | null;
}

// ─── Trip (depuis Supabase saved_plans) ───
// Format minimaliste utilisé dans HomeScreen/PastTripsMap
export interface SavedPlan {
  id: string;
  city: string;
  plan_data: unknown;  // JSON sérialisé d'un MultiDayPlan
  created_at: string;
}

// Format étendu si la BDD le retourne (toutes les colonnes)
export interface SavedTrip extends SavedPlan {
  user_id?: string;
  start_date?: string;
  end_date?: string;
  updated_at?: string;
  shared?: boolean;
  share_token?: string;
}

// ─── Taste Profile (depuis Supabase taste_profiles) ───
export interface TasteProfile {
  user_id: string;
  liked_categories?: Record<string, number>;   // ex: { restaurant: 4.2, museum: 3.8 }
  liked_ambiance?: Record<string, number>;
  liked_subtypes?: Record<string, number>;
  liked_tags?: Record<string, number>;
  taste_mobility?: string[];
  taste_budget?: BudgetType[];
  taste_company?: string[];
  taste_vibes?: string[];
  total_reviews?: number;
  last_updated?: string;
}

// ─── Form types ───
export interface ProfileFormData {
  full_name: string;
  username: string;
  avatar_url: string;
  phone: string;
  city: string;
  birthdate: string;
  gender: string;
  bio: string;
}

// ─── Auth ───
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SupabaseAuthError {
  message: string;
  status?: number;
  code?: string;
  name?: string;
}

// ─── Place / Step variants pour l'IA ───
export interface PlaceFromAPI {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  lat: number;
  lng: number;
  budget_level?: 'low' | 'medium' | 'high' | 'free';
  duration_min?: number;
  ambiance_tags?: string[] | string;
  experience_tags?: string[] | string;
  tags?: string[] | string;
  rating_average?: number | null;
  review_count?: number;
  verified?: boolean;
  website_url?: string | null;
  opening_hours?: string | null;
  city?: string;
  distance_km?: number | null;
  place_type?: string;
  tier?: 'free' | 'premium';
  discovery_level?: string;
}

// ─── Calendar / Date types ───
export interface CalendarDay {
  date: string;          // YYYY-MM-DD
  label: string;         // "Lundi 5"
  isToday?: boolean;
  isPast?: boolean;
  isFuture?: boolean;
  hasTrip?: boolean;
  trip?: SavedTrip;
}

// ─── Notification ───
export interface NotifItem {
  id: string;
  type: 'review' | 'info' | 'warning' | 'trip-reminder';
  title: string;
  body?: string;
  timestamp: number;
  data?: Record<string, unknown>;
  read?: boolean;
}

// ─── Review / Place Rating ───
export interface PlaceReview {
  placeId: string;
  name: string;
  visited: boolean;
  rating: number | null;
  comment?: string;
}

// ─── Quota (alignée sur lib/quota.ts) ───
// NOTE : si tu importes QuotaInfo, préfère l'import depuis '../lib/quota'
// Ce type est dupliqué ici pour les composants qui ne veulent pas dépendre de lib/quota
export interface QuotaInfo {
  used: number;
  max: number;
  remaining: number;
  isPremium: boolean;
  canCreate?: (nbDays: number) => boolean;
  resetDate?: string;
}

// ─── Helper: type guard pour PlaceFromAPI ───
export function isPlaceFromAPI(obj: unknown): obj is PlaceFromAPI {
  return !!obj && typeof obj === 'object' &&
    'id' in obj && 'name' in obj &&
    'lat' in obj && 'lng' in obj;
}