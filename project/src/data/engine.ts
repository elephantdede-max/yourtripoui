/**
 * JORNE — Moteur IA Hybride
 * Architecture : Gemini (principal) → OpenAI (fallback) → Local (secours garanti)
 *
 * SÉCURITÉ : Les clés API passent par Supabase Edge Function uniquement.
 * Elles ne sont JAMAIS dans le code client.
 * Stocke-les dans Supabase → Settings → Edge Functions → Secrets :
 *   GEMINI_API_KEY
 *   OPENAI_API_KEY
 */
 
import { supabase } from "../lib/supabase";
import type { Place, DayConfig, DayPlan, MultiDayPlan, PlanStep, UGCEntry } from '../types';
 
// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
 
export interface TasteProfile {
  liked_categories: Record<string, number>;
  liked_ambiance: Record<string, number>;
  liked_subcategories: Record<string, number>;
}
 
export interface AIContext {
  city: string;
  budget: string;
  mood: string;
  mobility: string;
  start_hour: number;
  end_hour: number;
  trip_type: string[];
  favorite_categories: string[];
  disliked_categories: string[];
  ambiance_preferences: string[];
  available_places: CompactPlace[];
}
 
interface CompactPlace {
  id: string;
  name: string;
  type: string;
  desc: string;
  lat: number;
  lng: number;
  dur: number;
  score: number;
  votes: number;
  budget: string;
  tags: string[];
}
 
interface AIGeneratedStep {
  place_id: string;
  start_time: string;
  duration: number;
  why: string;
}
 
interface AIResponse {
  title: string;
  steps: AIGeneratedStep[];
}
 
// ─────────────────────────────────────────────
// 1. CONSTRUCTION DU CONTEXTE (compact)
// ─────────────────────────────────────────────
 
export function buildAIContext(
  dayConfig: DayConfig,
  candidates: Place[],
  tasteProfile: TasteProfile | null,
): AIContext {
  const budget_labels: Record<string, string> = {
    free: 'gratuit', low: 'économique', mid: 'modéré', high: 'premium',
  };
 
  const liked = tasteProfile?.liked_categories
    ? Object.entries(tasteProfile.liked_categories)
        .filter(([, v]) => v >= 3.5)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([k]) => k)
    : [];
 
  const disliked = tasteProfile?.liked_categories
    ? Object.entries(tasteProfile.liked_categories)
        .filter(([, v]) => v < 2.5)
        .map(([k]) => k)
    : [];
 
  const ambiance = tasteProfile?.liked_ambiance
    ? Object.entries(tasteProfile.liked_ambiance)
        .filter(([, v]) => v >= 3.5)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k)
    : [];
 
  const compact: CompactPlace[] = candidates.slice(0, 15).map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    desc: p.desc.slice(0, 80),
    lat: p.lat,
    lng: p.lng,
    dur: p.dur,
    score: p.score,
    votes: p.votes || 0,
    budget: p.budget[0] || 'low',
    tags: p.tags.slice(0, 3),
  }));
 
  const [sh, sm] = (dayConfig.startTime || '10:00').split(':').map(Number);
  const [eh, em] = (dayConfig.endTime || '22:00').split(':').map(Number);
 
  return {
    city: 'Paris',
    budget: budget_labels[dayConfig.budget || 'low'] || 'modéré',
    mood: dayConfig.mood || (dayConfig.vibes || []).join(', ') || '',
    mobility: dayConfig.precision?.mobility?.[0] || 'transport',
    start_hour: sh + (sm / 60),
    end_hour: eh + (em / 60),
    trip_type: dayConfig.types || [],
    favorite_categories: liked,
    disliked_categories: disliked,
    ambiance_preferences: ambiance,
    available_places: compact,
  };
}
 
// ─────────────────────────────────────────────
// 2. APPEL IA VIA EDGE FUNCTION SUPABASE
// ─────────────────────────────────────────────
 
async function callAIEdgeFunction(
  context: AIContext,
  dayLabel: string,
  provider: 'gemini' | 'openai',
): Promise<AIResponse | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
 
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-day`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ context, dayLabel, provider }),
        signal: AbortSignal.timeout(12000),
      },
    );
 
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.steps?.length) return null;
    return data;
  } catch {
    return null;
  }
}
 
// ─────────────────────────────────────────────
// 3. MOTEUR LOCAL DE SECOURS (100% garanti)
// ─────────────────────────────────────────────
 
function buildLocalDayPlan(
  allPlaces: Place[],
  dayConfig: DayConfig,
  dayIndex: number,
  dayLabel: string,
  date: string,
): DayPlan {
  const TRANSIT = 15;
  const [sh] = (dayConfig.startTime || '10:00').split(':').map(Number);
  const [eh] = (dayConfig.endTime || '22:00').split(':').map(Number);
  const availableMin = (eh - sh) * 60;
 
  const budgetOrder = ['free', 'low', 'mid', 'high'];
  const bIdx = budgetOrder.indexOf(dayConfig.budget || 'low');
  const wantTypes = new Set(dayConfig.types?.map(t => {
    if (t === 'gastronomie') return 'food';
    if (t === 'culturel') return 'culture';
    if (t === 'chill' || t === 'nature') return 'chill';
    return 'social';
  }));
  if (wantTypes.size === 0) wantTypes.add('chill');
 
  const scored = allPlaces.map(p => {
    let sc = (p.score || 3) * 2;
    if (wantTypes.has(p.type)) sc += 4;
    const bi = budgetOrder.indexOf(p.budget[0]);
    sc -= Math.abs(bi - bIdx);
    if (p.votes && p.votes > 10) sc += 1;
    return { ...p, _sc: sc };
  }).sort((a, b) => b._sc - a._sc);
 
  const picked: Place[] = [];
  const typeCnt: Record<string, number> = {};
  let totalDur = 0;
 
  for (const p of scored) {
    if (picked.length >= 5) break;
    if (totalDur + p.dur > availableMin) continue;
    if ((typeCnt[p.type] || 0) >= 2) continue;
    picked.push(p);
    typeCnt[p.type] = (typeCnt[p.type] || 0) + 1;
    totalDur += p.dur + TRANSIT;
  }
 
  if (picked.length < 3) {
    for (const p of scored) {
      if (picked.find(x => x.id === p.id)) continue;
      picked.push(p);
      if (picked.length >= 4) break;
    }
  }
 
  let cur = sh * 60;
  const steps: PlanStep[] = picked.map((p, i) => {
    const h = Math.floor(cur / 60) % 24;
    const m = cur % 60;
    const time = `${String(h).padStart(2,'0')}h${String(m).padStart(2,'0')}`;
    const endMin = cur + p.dur;
    const eh2 = Math.floor(endMin / 60) % 24;
    const em2 = endMin % 60;
    const endTime = `${String(eh2).padStart(2,'0')}h${String(em2).padStart(2,'0')}`;
    cur = endMin + TRANSIT;
    return { ...p, time, endTime, km: 0, tr: i > 0 ? { icon: '🚇', txt: 'Métro · 10 min' } : null };
  });
 
  const titleMap: Record<string, string> = {
    date: 'Une journée pour deux',
    chill: 'Prendre le temps',
    aventure: 'Hors des sentiers battus',
    culturel: "Nourrir l'esprit",
    gastronomie: 'La journée gourmande',
    nature: "L'air pur",
  };
  const title = titleMap[dayConfig.types?.[0] || ''] || 'Ta journée sur mesure';
 
  return {
    dayIndex, dayLabel, date,
    startTime: dayConfig.startTime || '10:00',
    endTime: dayConfig.endTime || '22:00',
    title, steps, totalH: Math.round(totalDur / 60), count: steps.length,
  };
}
 
// ─────────────────────────────────────────────
// 4. CONVERTIR RÉPONSE IA → DayPlan
// ─────────────────────────────────────────────
 
function aiResponseToDayPlan(
  aiResp: AIResponse,
  allPlaces: Place[],
  dayConfig: DayConfig,
  dayIndex: number,
  dayLabel: string,
  date: string,
): DayPlan {
  const placeMap = new Map(allPlaces.map(p => [String(p.id), p]));
  const TRANSIT = 15;
  let cur = 0;
 
  const steps: PlanStep[] = [];
  for (let i = 0; i < aiResp.steps.length; i++) {
    const s = aiResp.steps[i];
    const place = placeMap.get(String(s.place_id));
    if (!place) continue;
 
    const [th, tm] = (s.start_time || '10:00').split(':').map(Number);
    cur = th * 60 + (tm || 0);
 
    const h = Math.floor(cur / 60) % 24;
    const m = cur % 60;
    const time = `${String(h).padStart(2,'0')}h${String(m).padStart(2,'0')}`;
    const dur = s.duration || place.dur;
    const endMin = cur + dur;
    const eh = Math.floor(endMin / 60) % 24;
    const em = endMin % 60;
    const endTime = `${String(eh).padStart(2,'0')}h${String(em).padStart(2,'0')}`;
 
    steps.push({
      ...place,
      dur,
      time,
      endTime,
      km: 0,
      tr: i > 0 ? { icon: '🚇', txt: 'Métro · 10 min' } : null,
      desc: s.why ? `${place.desc} — ${s.why}` : place.desc,
    });
  }
 
  if (steps.length < 2) {
    return buildLocalDayPlan(allPlaces, dayConfig, dayIndex, dayLabel, date);
  }
 
  return {
    dayIndex, dayLabel, date,
    startTime: dayConfig.startTime || '10:00',
    endTime: dayConfig.endTime || '22:00',
    title: aiResp.title || 'Ta journée sur mesure',
    steps, totalH: Math.round(steps.reduce((s, p) => s + p.dur + TRANSIT, 0) / 60),
    count: steps.length,
  };
}
 
// ─────────────────────────────────────────────
// 5. GÉNÉRER UNE JOURNÉE (Gemini → OpenAI → Local)
// ─────────────────────────────────────────────
 
async function generateOneDayWithAI(
  allPlaces: Place[],
  dayConfig: DayConfig,
  dayIndex: number,
  dayLabel: string,
  date: string,
  tasteProfile: TasteProfile | null,
): Promise<DayPlan> {
  const budgetOrder = ['free', 'low', 'mid', 'high'];
  const bIdx = budgetOrder.indexOf(dayConfig.budget || 'low');
 
  const candidates = allPlaces
    .map(p => {
      let sc = (p.score || 3) * 2;
      const bi = budgetOrder.indexOf(p.budget[0]);
      sc -= Math.abs(bi - bIdx) * 0.5;
      if (tasteProfile?.liked_categories) {
        const cat = tasteProfile.liked_categories[p.type];
        if (cat !== undefined) sc += (cat - 3) * 1.5;
      }
      return { ...p, _sc: sc };
    })
    .sort((a: any, b: any) => b._sc - a._sc)
    .slice(0, 20);
 
  const context = buildAIContext(dayConfig, candidates, tasteProfile);
 
  // Tentative 1 : Gemini
  const geminiResp = await callAIEdgeFunction(context, dayLabel, 'gemini');
  if (geminiResp) {
    return aiResponseToDayPlan(geminiResp, allPlaces, dayConfig, dayIndex, dayLabel, date);
  }
 
  // Tentative 2 : OpenAI fallback
  const openaiResp = await callAIEdgeFunction(context, dayLabel, 'openai');
  if (openaiResp) {
    return aiResponseToDayPlan(openaiResp, allPlaces, dayConfig, dayIndex, dayLabel, date);
  }
 
  // Tentative 3 : Moteur local garanti
  return buildLocalDayPlan(allPlaces, dayConfig, dayIndex, dayLabel, date);
}
 
// ─────────────────────────────────────────────
// 6. CHARGER LE PROFIL DE GOÛTS
// ─────────────────────────────────────────────
 
async function loadTasteProfile(userId: string): Promise<TasteProfile | null> {
  try {
    const { data } = await supabase
      .from('user_taste_profile')
      .select('liked_categories, liked_ambiance, liked_subcategories')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}
 
// ─────────────────────────────────────────────
// 7. POINT D'ENTRÉE PRINCIPAL
// ─────────────────────────────────────────────
 
export async function buildMultiDayPlanAI(
  tripConfig: { city: string; startDate: string; endDate: string; days: DayConfig[] },
  ugcData: UGCEntry[],
): Promise<MultiDayPlan> {
  // 1. Charger tous les lieux de la ville (ne plante jamais)
  let rawPlaces: any[] = [];
  try {
    const { data } = await supabase
      .from('places')
      .select('*')
      .eq('city', tripConfig.city);
    rawPlaces = data || [];
  } catch {
    rawPlaces = [];
  }
 
  const cityPlaces: Place[] = rawPlaces.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    type: (() => {
      if (p.type === 'restaurant' || p.type === 'bar' || p.type === 'cafe') return 'food';
      if (p.type === 'museum' || p.type === 'theater') return 'culture';
      if (p.type === 'park') return 'chill';
      return 'chill';
    })() as Place['type'],
    desc: p.description || '',
    lat: p.lat ?? 0,
    lng: p.lng ?? 0,
    budget: (() => {
      if (p.budget === 'économique') return ['free', 'low'];
      if (p.budget === 'modéré') return ['low', 'mid'];
      if (p.budget === 'flexible') return ['mid'];
      if (p.budget === 'premium') return ['high'];
      return ['low'];
    })() as Place['budget'],
    tags: Array.isArray(p.experience_type) ? p.experience_type : [],
    dur: p.duration ?? 60,
    ver: p.discovery_level === 'lieux connus' || p.discovery_level === 'mix des deux',
    score: Number(p.rating_average) || 3.5,
    votes: Number(p.review_count) || 0,
    vid: p.vid || undefined,
    needsReservation: p.reservable ?? false,
  }));
 
  const ugcPlaces: Place[] = ugcData
    .filter(u => u.city === tripConfig.city && u.status === 'verified')
    .map(u => ({ ...u, vid: u.vid || undefined }));
 
  const allPlaces = [...cityPlaces, ...ugcPlaces];
 
  // 2. Charger le profil de goûts (non bloquant)
  let tasteProfile: TasteProfile | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    tasteProfile = user ? await loadTasteProfile(user.id) : null;
  } catch {
    tasteProfile = null;
  }
 
  // 3. Générer chaque journée
  const dayPromises = tripConfig.days.map((dayConfig, i) => {
    const d = new Date(tripConfig.startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return generateOneDayWithAI(allPlaces, dayConfig, i, dayLabel, dateStr, tasteProfile);
  });
 
  const days = await Promise.all(dayPromises);
  return { city: tripConfig.city, days };
}
 
export { buildLocalDayPlan };

export function isValidVideoUrl(url: string): { valid: boolean; platform?: string } {
  if (!url) return { valid: false };
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return { valid: true, platform: 'youtube' };
    if (u.hostname.includes('tiktok.com')) return { valid: true, platform: 'tiktok' };
    if (u.hostname.includes('instagram.com')) return { valid: true, platform: 'instagram' };
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export function getUGCCenter(city: string): { lat: number; lng: number } {
  const defaults: Record<string, { lat: number; lng: number }> = {
    Paris: { lat: 48.8566, lng: 2.3522 },
    London: { lat: 51.5074, lng: -0.1278 },
    Madrid: { lat: 40.4168, lng: -3.7038 },
    Rome: { lat: 41.9028, lng: 12.4964 },
    Barcelona: { lat: 41.3851, lng: 2.1734 },
    Amsterdam: { lat: 52.3676, lng: 4.9041 },
    Berlin: { lat: 52.52, lng: 13.405 },
    Lisbon: { lat: 38.7223, lng: -9.1393 },
    Tokyo: { lat: 35.6762, lng: 139.6503 },
    'New York': { lat: 40.7128, lng: -74.006 },
  };
  return defaults[city] ?? { lat: 48.8566, lng: 2.3522 };
}