/**
 * JORNE — Moteur IA Hybride
 * Architecture : Gemini (principal) → OpenAI (fallback) → Local (secours garanti)
 */
 
import { supabase } from './supabase';
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
  id: string; name: string; type: string; desc: string;
  lat: number; lng: number; dur: number; score: number;
  votes: number; budget: string; tags: string[];
}
 
interface AIGeneratedStep {
  place_id: string; start_time: string; duration: number; why: string;
}
 
interface AIResponse {
  title: string; steps: AIGeneratedStep[];
}
 
// ─────────────────────────────────────────────
// 1. CONSTRUCTION DU CONTEXTE
// ─────────────────────────────────────────────
 
export function buildAIContext(
  dayConfig: DayConfig,
  candidates: Place[],
  tasteProfile: TasteProfile | null,
  city: string,
): AIContext {
  const budget_labels: Record<string, string> = {
    free: 'gratuit', low: 'économique', mid: 'modéré', high: 'premium',
  };
 
  const liked = tasteProfile?.liked_categories
    ? Object.entries(tasteProfile.liked_categories).filter(([, v]) => v >= 3.5).sort(([, a], [, b]) => b - a).slice(0, 5).map(([k]) => k)
    : [];
  const disliked = tasteProfile?.liked_categories
    ? Object.entries(tasteProfile.liked_categories).filter(([, v]) => v < 2.5).map(([k]) => k)
    : [];
  const ambiance = tasteProfile?.liked_ambiance
    ? Object.entries(tasteProfile.liked_ambiance).filter(([, v]) => v >= 3.5).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k]) => k)
    : [];
 
  const compact: CompactPlace[] = candidates.slice(0, 15).map(p => ({
    id: p.id, name: p.name, type: p.type, desc: p.desc.slice(0, 80),
    lat: p.lat, lng: p.lng, dur: p.dur, score: p.score,
    votes: p.votes || 0, budget: p.budget[0] || 'low', tags: p.tags.slice(0, 3),
  }));
 
  const [sh, sm] = (dayConfig.startTime || '10:00').split(':').map(Number);
  const [eh, em] = (dayConfig.endTime || '22:00').split(':').map(Number);
 
  return {
    city,
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
// 2. APPEL IA VIA EDGE FUNCTION
// ─────────────────────────────────────────────
 
async function callAIEdgeFunction(
  context: AIContext, dayLabel: string, provider: 'gemini' | 'openai',
): Promise<AIResponse | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-day`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ context, dayLabel, provider }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.steps?.length ? data : null;
  } catch {
    return null;
  }
}
 
// ─────────────────────────────────────────────
// 3. MOTEUR LOCAL — INTELLIGENT
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

  const budgetOrder = ['free', 'low', 'mid', 'high'];
  const bIdx = budgetOrder.indexOf(dayConfig.budget || 'low');
  const wantTypes = new Set<string>();
  for (const t of (dayConfig.types || [])) {
    if (t === 'gastronomie') wantTypes.add('food');
    else if (t === 'culturel') wantTypes.add('culture');
    else if (t === 'chill' || t === 'nature') wantTypes.add('chill');
    else if (t === 'date') { wantTypes.add('food'); wantTypes.add('chill'); }
    else if (t === 'aventure') { wantTypes.add('chill'); wantTypes.add('culture'); }
    else wantTypes.add('social');
  }
  if (wantTypes.size === 0) wantTypes.add('chill');

  const vibeText = (dayConfig.vibes || []).join(' ').toLowerCase();
  const moodText = (dayConfig.mood || '').toLowerCase();
  const allKeywords = `${vibeText} ${moodText}`;
  const wantTags = new Set<string>();
  if (allKeywords.includes('calme')) wantTags.add('chill');
  if (allKeywords.includes('romantique')) wantTags.add('romantique');
  if (allKeywords.includes('festif')) wantTags.add('festif');
  if (allKeywords.includes('culture')) wantTags.add('culturel');
  if (allKeywords.includes('nature')) wantTags.add('nature');
  if (allKeywords.includes('gastro')) wantTags.add('gastronomie');

  const wantMeal = dayConfig.precision?.meal !== 'non';

  function scorePlace(p: Place): number {
    let sc = 0;
    if (wantTypes.has(p.type)) sc += 8;
    for (const tag of p.tags) { if (wantTags.has(tag)) sc += 3; }
    const bi = budgetOrder.indexOf(p.budget[0]);
    const diff = Math.abs(bi - bIdx);
    if (diff === 0) sc += 4; else if (diff === 1) sc += 2; else sc -= 2;
    sc += Math.min((p.score || 3) * 0.6, 3);
    if (p.votes && p.votes > 50) sc += 1.5;
    else if (p.votes && p.votes > 10) sc += 0.5;
    return sc;
  }

  function getSlotTypes(hour: number): string[] {
    if (hour < 12)               return ['culture', 'chill'];
    if (hour >= 12 && hour < 14) return wantMeal ? ['food'] : ['culture', 'chill'];
    if (hour >= 14 && hour < 18) return ['chill', 'culture'];
    if (hour >= 18 && hour < 20) return wantMeal ? ['food'] : ['social', 'chill'];
    return ['social'];
  }

  function pick3367(pool: Place[]): Place | null {
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    const sorted = [...pool].sort((a, b) => scorePlace(b) - scorePlace(a));
    if (Math.random() < 0.33) return sorted[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const usedIds = new Set<string>();
  const steps: PlanStep[] = [];
  let cur = sh * 60;
  let mealAtMidi = false;
  let mealAtSoir = false;

  while (cur + 30 <= eh * 60 && steps.length < 12) {
    const hour = Math.floor(cur / 60);
    const slotTypes = getSlotTypes(hour);

    let eligible = allPlaces.filter(p => {
      if (usedIds.has(p.id)) return false;
      if (!slotTypes.includes(p.type)) return false;
      if (cur + p.dur > eh * 60) return false;
      return true;
    });

    if (eligible.length === 0) {
      eligible = allPlaces.filter(p => {
        if (usedIds.has(p.id)) return false;
        if (cur + p.dur > eh * 60) return false;
        if (p.type === 'chill' && hour >= 22) return false;
        return true;
      });
    }

    if (eligible.length === 0) break;

    const matching = eligible.filter(p => wantTypes.has(p.type));
    const pool = matching.length > 0 ? matching : eligible;
    const chosen = pick3367(pool);
    if (!chosen) break;

    if (chosen.type === 'food') {
      if (hour >= 12 && hour < 14) {
        if (mealAtMidi) { cur += 30; continue; }
        mealAtMidi = true;
      }
      if (hour >= 18 && hour < 20) {
        if (mealAtSoir) { cur += 30; continue; }
        mealAtSoir = true;
      }
    }

    usedIds.add(chosen.id);
    const h = Math.floor(cur / 60) % 24;
    const m = cur % 60;
    const time = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
    const endMin = cur + chosen.dur;
    const eh2 = Math.floor(endMin / 60) % 24;
    const em2 = endMin % 60;
    const endTime = `${String(eh2).padStart(2, '0')}h${String(em2).padStart(2, '0')}`;

    steps.push({
      ...chosen, time, endTime, km: 0,
      tr: steps.length > 0 ? { icon: '🚇', txt: 'Métro · 10 min' } : null,
    });
    cur = endMin + TRANSIT;
  }

  const titleMap: Record<string, string> = {
    date: 'Une journée pour deux',
    chill: 'Prendre le temps',
    aventure: 'Hors des sentiers battus',
    culturel: "Nourrir l'esprit",
    gastronomie: 'La journée gourmande',
    nature: "L'air pur",
  };
  const title = titleMap[dayConfig.types?.[0] || ''] || 'Votre journée sur mesure';
  const totalDur = steps.reduce((s, p) => s + p.dur + TRANSIT, 0);

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
  aiResp: AIResponse, allPlaces: Place[], dayConfig: DayConfig,
  dayIndex: number, dayLabel: string, date: string,
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
    const time = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
    const dur = s.duration || place.dur;
    const endMin = cur + dur;
    const eh2 = Math.floor(endMin / 60) % 24;
    const em2 = endMin % 60;
    const endTime = `${String(eh2).padStart(2, '0')}h${String(em2).padStart(2, '0')}`;
    steps.push({
      ...place, dur, time, endTime, km: 0,
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
    title: aiResp.title || 'Votre journée sur mesure',
    steps, totalH: Math.round(steps.reduce((s, p) => s + p.dur + TRANSIT, 0) / 60),
    count: steps.length,
  };
}
 
// ─────────────────────────────────────────────
// 5. GÉNÉRER UNE JOURNÉE (Gemini → OpenAI → Local)
// ─────────────────────────────────────────────
 
async function generateOneDayWithAI(
  allPlaces: Place[], dayConfig: DayConfig,
  dayIndex: number, dayLabel: string, date: string,
  tasteProfile: TasteProfile | null,
  city: string,
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
 
  const context = buildAIContext(dayConfig, candidates, tasteProfile, city);
 
  const geminiResp = await callAIEdgeFunction(context, dayLabel, 'gemini');
  if (geminiResp) return aiResponseToDayPlan(geminiResp, allPlaces, dayConfig, dayIndex, dayLabel, date);
 
  const openaiResp = await callAIEdgeFunction(context, dayLabel, 'openai');
  if (openaiResp) return aiResponseToDayPlan(openaiResp, allPlaces, dayConfig, dayIndex, dayLabel, date);
 
  return buildLocalDayPlan(allPlaces, dayConfig, dayIndex, dayLabel, date);
}
 
// ─────────────────────────────────────────────
// 6. PROFIL DE GOÛTS
// ─────────────────────────────────────────────
 
async function loadTasteProfile(userId: string): Promise<TasteProfile | null> {
  try {
    const { data } = await supabase
      .from('user_taste_profile')
      .select('liked_categories, liked_ambiance, liked_subcategories')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  } catch { return null; }
}
 
// ─────────────────────────────────────────────
// 7. POINT D'ENTRÉE
// ─────────────────────────────────────────────
 
export async function buildMultiDayPlanAI(
  tripConfig: { city: string; startDate: string; endDate: string; days: DayConfig[] },
  ugcData: UGCEntry[],
): Promise<MultiDayPlan> {
  let rawPlaces: any[] = [];
  try {
    const { data } = await supabase.from('places').select('*').eq('city', tripConfig.city);
    rawPlaces = data || [];
  } catch { rawPlaces = []; }
 
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
    lat: p.lat ?? 0, lng: p.lng ?? 0,
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
 
  let tasteProfile: TasteProfile | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    tasteProfile = user ? await loadTasteProfile(user.id) : null;
  } catch { tasteProfile = null; }
 
  const dayPromises = tripConfig.days.map((dayConfig, i) => {
    const d = new Date(tripConfig.startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return generateOneDayWithAI(allPlaces, dayConfig, i, dayLabel, dateStr, tasteProfile, tripConfig.city);
  });
 
  const days = await Promise.all(dayPromises);
  return { city: tripConfig.city, days };
}
 
export { buildLocalDayPlan };
export function isValidVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /^https?:\/\/.+\.(mp4|webm|ogg)/i.test(url) ||
    /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

export function getUGCCenter(ugcData: UGCEntry[]): [number, number] | null {
  const withCoords = ugcData.filter(u => u.lat && u.lng);
  if (withCoords.length === 0) return null;
  const lat = withCoords.reduce((s, u) => s + u.lat, 0) / withCoords.length;
  const lng = withCoords.reduce((s, u) => s + u.lng, 0) / withCoords.length;
  return [lat, lng];
}