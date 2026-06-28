export type ExperienceType = 'chill' | 'date' | 'aventure' | 'culturel' | 'gastronomie' | 'nature' | 'amusement';
export type VibeType = 'calme' | 'romantique' | 'festif' | 'solo' | 'amis';
export type BudgetType = 'free' | 'low' | 'mid' | 'high';
export type PlaceType = 'food' | 'chill' | 'culture' | 'view' | 'social' | 'leisure' | 'nature';

export type MobilityType = 'pied' | 'velo' | 'transport' | 'voiture';
export type MealPreference = 'oui' | 'non';
export type PlacePreference = 'nature' | 'urbain' | 'culture' | 'shopping' | 'mix';
export type DiscoveryType = 'connus' | 'caches' | 'mix';
export type FlexibilityType = 'structure' | 'flexible' | 'libre';

export interface PrecisionConfig {
  mobility: MobilityType[];
  meal: MealPreference | null;
  placePref: PlacePreference[];
  discovery: DiscoveryType | null;
  flexibility: FlexibilityType | null;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  desc: string;
  lat: number;
  lng: number;
  budget: BudgetType[];
  tags: string[];
  dur: number;
  ver: boolean;
  score: number;
  vid?: string;
  subType?: 'cafe' | 'restaurant' | 'bar' | 'theater';
  community?: boolean;
  status?: 'pending' | 'verified';
  votes?: number;
  trustScore?: number;
  submittedAt?: string;
  needsReservation?: boolean;
  website_url?: string;
  booking_url?: string;
}

export interface PlanStep extends Place {
  time: string;
  endTime: string;
  km: number;
  tr: { icon: string; txt: string } | null;
  isPremiumPlaceholder?: boolean;
}

export interface DayPlan {
  dayIndex: number;
  dayLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  steps: PlanStep[];
  totalH: number;
  count: number;
}

export interface MultiDayPlan {
  city: string;
  days: DayPlan[];
}

export interface DayConfig {
  types: ExperienceType[];
  vibes: VibeType[];
  budget: BudgetType | null;
  mood: string;
  startTime: string;
  endTime: string;
  precision: PrecisionConfig;
}

export interface TripConfig {
  city: string;
  startDate: string;
  endDate: string;
  days: DayConfig[];
}

export interface UGCEntry {
  id: string;
  name: string;
  desc: string;
  type: PlaceType;
  city: string;
  vid?: string | null;
  status: 'pending' | 'verified';
  score: number;
  ver: boolean;
  community: boolean;
  lat: number;
  lng: number;
  budget: BudgetType[];
  tags: string[];
  dur: number;
  votes: number;
  trustScore: number;
  submittedAt: string;
}

export type ScreenId = 'home' | 'dashboard' | 'landing' | 'dates' | 'day' | 'precision' | 'mood' | 'loading' | 'result' | 'ugc' | 'review' | 'review-confirm';
