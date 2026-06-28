import { supabase } from './supabase';
import type { Place, DayConfig, DayPlan, MultiDayPlan, PlanStep, UGCEntry } from '../types';
import { findNearestStation, commonLines } from './metro-stations';
// ─────────────────────────────────────────────
// HELPER : Générer les DayConfig selon le mode
// ─────────────────────────────────────────────

import type { ExperienceType, VibeType, BudgetType, MobilityType, MealPreference, PlacePreference, DiscoveryType, FlexibilityType } from '../types';

type CreationMode = 'tastes' | 'surprise' | 'custom';

interface TasteProfileData {
  taste_budget?: string;
  taste_vibes?: string[];
  taste_experiences?: string[];
  taste_place_pref?: string[];
  taste_mobility?: string[];
  taste_discovery?: string;
  taste_flexibility?: string;
  taste_free_text?: string;
}

const ALL_EXPERIENCES: ExperienceType[] = ['chill', 'date', 'aventure', 'culturel', 'gastronomie', 'nature', 'amusement'];

/**
 * Remplit les DayConfig automatiquement selon le mode choisi.
 * - 'tastes'   : utilise le profil de goûts, varie dans les types préférés
 * - 'surprise' : varie dans TOUS les types d'expérience
 * - 'custom'   : ne touche rien (l'user a déjà rempli manuellement)
 */
export function buildDayConfigsFromMode(
  mode: CreationMode,
  taste: TasteProfileData | null,
  nbDays: number,
  startTime: string,
  endTime: string,
): DayConfig[] {
  if (mode === 'custom') {
    return Array.from({ length: nbDays }, () => ({
      types: [],
      vibes: [],
      budget: null,
      mood: '',
      startTime, endTime,
      precision: { mobility: [], meal: null, placePref: [], discovery: null, flexibility: null },
    }));
  }

  // Pool de types selon le mode
  let typePool: ExperienceType[];
  if (mode === 'tastes' && taste?.taste_experiences && taste.taste_experiences.length > 0) {
    typePool = taste.taste_experiences as ExperienceType[];
  } else {
    typePool = ALL_EXPERIENCES;
  }

  // Helper pour piocher N types variés depuis un pool
  const pickN = (pool: ExperienceType[], n: number): ExperienceType[] => {
    if (pool.length <= n) return [...pool];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };

  return Array.from({ length: nbDays }, () => {
    // 4 types variés par jour (ou tous les types du pool si moins de 4)
    const dayTypes = pickN(typePool, Math.min(4, typePool.length));

    return {
      types: dayTypes,
      vibes: (taste?.taste_vibes && taste.taste_vibes.length > 0
        ? taste.taste_vibes
        : ['calme']) as VibeType[],
      budget: (taste?.taste_budget || 'mid') as BudgetType,
      mood: taste?.taste_free_text || '',
      startTime, endTime,
      precision: {
        mobility: (taste?.taste_mobility && taste.taste_mobility.length > 0
          ? taste.taste_mobility
          : ['transport']) as MobilityType[],
        meal: 'oui' as MealPreference,
        placePref: (taste?.taste_place_pref && taste.taste_place_pref.length > 0
          ? taste.taste_place_pref
          : ['mix']) as PlacePreference[],
        discovery: (taste?.taste_discovery || 'mix') as DiscoveryType,
        flexibility: (taste?.taste_flexibility || 'flexible') as FlexibilityType,
      },
    };
  });
}
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
  want_meal: boolean;
  available_places: CompactPlace[];
}
 
interface CompactPlace {
  id: string; name: string; type: string; subType?: string; desc: string;
  lat: number; lng: number; dur: number; score: number;
  votes: number; budget: string; tags: string[];
}
interface AIGeneratedStep {
  place_id: string; start_time: string; duration: number; why: string;
}
 
interface AIResponse {
  title: string;
  steps: AIGeneratedStep[];
  // ── Métadonnées injectées par l'Edge Function ──
  _provider?: string;        // ex: "gemini-2.5-flash" ou "groq-llama-3.3"
  _cached?: boolean;          // true si vient du cache 7j
  _auto_fixed?: boolean;      // true si autoFix a corrigé une violation
  _retried?: boolean;         // true si retry après échec validation
  _premium?: boolean;         // true si user premium
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
 
  const compact: CompactPlace[] = candidates.slice(0, 40).map(p => ({
    id: p.id, name: p.name, type: p.type, subType: p.subType, desc: p.desc.slice(0, 120),
    lat: p.lat, lng: p.lng, dur: p.dur, score: p.score,
    votes: p.votes || 0, budget: p.budget[0] || 'low', tags: p.tags.slice(0, 5),
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
    want_meal: dayConfig.precision?.meal !== 'non',
    available_places: compact,
  };
}
 
// ─────────────────────────────────────────────
// 2. APPEL IA VIA EDGE FUNCTION
// ─────────────────────────────────────────────
 
async function callAIEdgeFunction(
  context: AIContext, dayLabel: string, avoidIds: string[] = [],
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
        body: JSON.stringify({ context, dayLabel, avoidIds }),
        signal: AbortSignal.timeout(30000),
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
  // ── Calcul approximatif de trajet ──
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function computeTransit(from: Place, to: Place, mode: string): { icon: string; txt: string; minutes: number } {
  const km = distanceKm(from.lat, from.lng, to.lat, to.lng);
  if (km === 0) return { icon: '🚶', txt: '≈ Trajet court', minutes: 5 };

  let minutes: number;
  let icon: string;
  let label: string;

  if (mode === 'voiture') {
    minutes = Math.round(km * 3 + 5);     // 3 min/km + 5 min stationnement
    icon = '🚗';
    label = 'Voiture';
  } else if (mode === 'pied') {
    minutes = Math.round(km * 12);         // 12 min/km à pied
    icon = '🚶';
    label = 'À pied';
  } else if (mode === 'velo') {
    minutes = Math.round(km * 4);          // 4 min/km à vélo
    icon = '🚴';
    label = 'Vélo';
  } else {
    // métro/transport par défaut
    icon = '🚇';
    label = 'Métro';

    const fromS = findNearestStation(from.lat, from.lng);
    const toS = findNearestStation(to.lat, to.lng);

    if (fromS && toS) {
      // Si les 2 lieux sont sur la même station → à pied direct
      if (fromS.station.name === toS.station.name) {
        const walkMin = Math.max(2, Math.round(km * 12));
        return { icon: '🚶', txt: `À pied · ${walkMin} min`, minutes: walkMin };
      }

      // Temps de marche lieu ↔ station (80 m/min ≈ 5 km/h)
      const walkBefore = Math.max(1, Math.round(fromS.distanceM / 80));
      const walkAfter = Math.max(1, Math.round(toS.distanceM / 80));

      // Distance entre stations en métro
      const dxLat = (toS.station.lat - fromS.station.lat) * Math.PI / 180;
      const dxLng = (toS.station.lng - fromS.station.lng) * Math.PI / 180;
      const a = Math.sin(dxLat/2)**2 + Math.cos(fromS.station.lat*Math.PI/180) * Math.cos(toS.station.lat*Math.PI/180) * Math.sin(dxLng/2)**2;
      const metroKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const metroMin = Math.max(3, Math.round(metroKm * 3 + 3)); // 3 min/km + 3 min d'attente

      const shared = commonLines(fromS.station, toS.station);
      const totalMin = walkBefore + metroMin + walkAfter;
      const walkTotal = walkBefore + walkAfter;

      if (shared.length > 0) {
        // Ligne directe
        const line = shared[0];
        return {
          icon: '🚇',
          txt: `M${line} · ${fromS.station.name} → ${toS.station.name} · ${totalMin} min (+${walkTotal} min à pied)`,
          minutes: totalMin,
        };
      } else {
        // Correspondance nécessaire
        return {
          icon: '🚇',
          txt: `${fromS.station.name} → ${toS.station.name} (corresp.) · ${totalMin + 5} min (+${walkTotal} min à pied)`,
          minutes: totalMin + 5,
        };
      }
    }

    // Fallback : pas de station trouvée
    minutes = Math.round(km * 5 + 5);
  }

  return { icon, txt: `${label} · ≈ ${minutes} min`, minutes };
}
  const [sh] = (dayConfig.startTime || '10:00').split(':').map(Number);
  const [eh] = (dayConfig.endTime || '22:00').split(':').map(Number);

  const budgetOrder = ['free', 'low', 'mid', 'high'];
  const bIdx = budgetOrder.indexOf(dayConfig.budget || 'low');
  const wantTypes = new Set<string>();
for (const t of (dayConfig.types || [])) {
  if (t === 'gastronomie') { wantTypes.add('food'); wantTypes.add('social'); } // gastro inclut bars à vin
  else if (t === 'culturel') wantTypes.add('culture');
  else if (t === 'chill') { wantTypes.add('chill'); wantTypes.add('social'); } // chill soir = bar cosy
  else if (t === 'nature') wantTypes.add('nature');
  else if (t === 'amusement') { wantTypes.add('leisure'); wantTypes.add('social'); } // amusement = bar festif aussi
  else if (t === 'date') { wantTypes.add('food'); wantTypes.add('chill'); wantTypes.add('social'); } // date = bar romantique
  else if (t === 'aventure') { wantTypes.add('leisure'); wantTypes.add('nature'); wantTypes.add('social'); }
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
  const mobility = dayConfig.precision?.mobility?.[0] || 'transport';
  

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
  // Mode nature : journée complète
  if (wantTypes.has('nature') && hour >= 10 && hour < 18) return ['nature'];

  // Matin (8h - 12h) : café petit-déj + culture/loisirs
  // food=café uniquement, le filtre subType bloque les restaurants le matin
  if (hour >= 8 && hour < 12) return ['culture', 'chill', 'leisure', 'food'];

  // Midi (12h - 14h) : repas midi strictement
  if (hour >= 12 && hour < 14) return wantMeal ? ['food'] : ['culture', 'chill', 'leisure'];

  // Après-midi (14h - 18h) : activités culturelles/loisirs/détente, pas de repas, pas de bar
  if (hour >= 14 && hour < 18) return ['chill', 'culture', 'leisure', 'nature'];

  // Apéritif (18h - 19h) : bar OU activité, pas de resto ni théâtre
  if (hour >= 18 && hour < 19) return ['social', 'chill', 'culture', 'leisure'];

  // Soirée (19h - 22h) : dîner + bar/social + théâtre
  // food=restaurant autorisé (mealAtSoir le limite à 1 seul)
  if (hour >= 19 && hour < 22) return wantMeal ? ['food', 'social', 'leisure', 'culture'] : ['social', 'leisure', 'culture'];

  // Nuit (22h+) : bar/social uniquement
  return ['social', 'leisure'];
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
  // Compteur de slots consécutifs sautés sans placer de lieu — anti-trou
  let consecutiveSkips = 0;

  while (cur + 30 <= eh * 60 && steps.length < 12) {
    const hour = Math.floor(cur / 60);
    const slotTypes = getSlotTypes(hour);

    // ── INJECTION FORCÉE DES REPAS ──
    // Si on arrive à 12h00 sans avoir mangé et la journée couvre midi → forcer un resto midi
    const dayCoversLunch = sh <= 12 && eh >= 14;
    const isLunchTime = hour >= 12 && hour < 14;
    const mustForceLunch = wantMeal && dayCoversLunch && isLunchTime && !mealAtMidi;

    // Si on arrive à 19h sans avoir dîné et la journée couvre le soir → forcer un resto soir
    const dayCoversDinner = sh <= 19 && eh >= 21;
    const isDinnerTime = hour >= 19 && hour < 21;
    const mustForceDinner = wantMeal && dayCoversDinner && isDinnerTime && !mealAtSoir;

    const lastStep = steps[steps.length - 1];
let eligible = allPlaces.filter(p => {
  if (usedIds.has(p.id)) return false;

  // ── PRIORITÉ ABSOLUE : si on force un repas, ne garder que les restaurants ──
  if (mustForceLunch || mustForceDinner) {
    if (p.type !== 'food' || p.subType !== 'restaurant') return false;
    if (cur + p.dur > eh * 60) return false;
    return true;
  }

  if (!slotTypes.includes(p.type)) return false;
  if (cur + p.dur > eh * 60) return false;

  // Empêche 2 lieux du même type à la suite
  // Exception food : autorise cafe→restaurant mais bloque même subType (2 restos / 2 cafés)
  if (lastStep && p.type === lastStep.type) {
    if (p.type === 'food') {
      if (p.subType === lastStep.subType) return false;
    } else {
      return false;
    }
  }

  // RÈGLES HORAIRES STRICTES sur les food/social
  if (p.type === 'food') {
    if (p.subType === 'cafe' && (hour < 8 || hour >= 12)) return false;
    // Restaurant : autorisé midi (11h-15h) ou soir (19h-22h)
    if (p.subType === 'restaurant' && !((hour >= 12 && hour < 14) || (hour >= 19 && hour < 22))) return false;
    // Si on a déjà mangé midi → bloquer tous les restos sur la plage midi
    if (p.subType === 'restaurant' && mealAtMidi && hour >= 12 && hour < 14) return false;
    // Si on a déjà mangé soir → bloquer tous les restos sur la plage soir
    if (p.subType === 'restaurant' && mealAtSoir && hour >= 19 && hour < 22) return false;
  }
  if (p.type === 'social') {
  if (p.subType === 'bar' && hour < 18) return false;
}
if (p.type === 'culture') {
  // Théâtre : uniquement en soirée (19h - 23h)
  if (p.subType === 'theater' && (hour < 19 || hour >= 23)) return false;
}

  return true;
});

    if (eligible.length === 0) {
      // Fallback assoupli : tous types sauf contraintes dures
      eligible = allPlaces.filter(p => {
        if (usedIds.has(p.id)) return false;
        if (cur + p.dur > eh * 60) return false;
        if (p.type === 'chill' && hour >= 22) return false;
        // Garder les règles food/social/theater même en fallback
        if (p.type === 'food') {
          if (p.subType === 'cafe' && (hour < 8 || hour >= 12)) return false;
          if (p.subType === 'restaurant' && !((hour >= 12 && hour < 14) || (hour >= 19 && hour < 22))) return false;
        }
        if (p.type === 'social' && p.subType === 'bar' && hour < 18) return false;
        if (p.type === 'culture' && p.subType === 'theater' && (hour < 19 || hour >= 23)) return false;
        return true;
      });
    }

    // ── FALLBACK ULTIME : après 2 slots sautés (= 1h de trou),
    // on autorise même les lieux déjà utilisés ailleurs dans la journée ──
    if (eligible.length === 0 && consecutiveSkips >= 2) {
      eligible = allPlaces.filter(p => {
        if (cur + p.dur > eh * 60) return false;
        // Toujours respecter les règles horaires absolues
        if (p.type === 'food' && p.subType === 'cafe' && hour >= 12) return false;
        if (p.type === 'food' && p.subType === 'restaurant') {
          if (!((hour >= 12 && hour < 14) || (hour >= 19 && hour < 22))) return false;
          if (mealAtMidi && hour >= 12 && hour < 14) return false;
          if (mealAtSoir && hour >= 19 && hour < 22) return false;
        }
        if (p.type === 'social' && p.subType === 'bar' && hour < 18) return false;
        if (p.type === 'culture' && p.subType === 'theater' && (hour < 19 || hour >= 23)) return false;
        // Mais on tolère qu'on ait déjà visité ce lieu ailleurs aujourd'hui
        // (rare cas extrême où le pool est très petit)
        return true;
      });
      // En cas de réutilisation, dédoublonner contre le dernier step pour éviter la répétition immédiate
      const lastId = steps[steps.length - 1]?.id;
      eligible = eligible.filter(p => p.id !== lastId);
    }

    // Si toujours vide → avancer de 30min, mais limiter les sauts à 4 max (2h)
    // pour éviter de finir la journée prématurément
    if (eligible.length === 0) {
      consecutiveSkips++;
      if (consecutiveSkips >= 4) {
        // Vraiment plus rien à placer, on stoppe la journée ici
        break;
      }
      cur += 30;
      continue;
    }

    // Reset le compteur dès qu'on trouve un lieu
    consecutiveSkips = 0;

    const matching = eligible.filter(p => wantTypes.has(p.type));

// Équilibrage : favoriser les types qui ont été le MOINS utilisés dans la journée
const typeCounts: Record<string, number> = {};
for (const s of steps) {
  typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
}

let pool = matching.length > 0 ? matching : eligible;

// Trier le pool en favorisant les types moins utilisés
if (pool.length > 1) {
  pool = [...pool].sort((a, b) => {
    const ca = typeCounts[a.type] || 0;
    const cb = typeCounts[b.type] || 0;
    return ca - cb; // type le moins utilisé en premier
  });
  // Garder seulement les lieux du type le moins utilisé (variété maximale)
  const minCount = typeCounts[pool[0].type] || 0;
  pool = pool.filter(p => (typeCounts[p.type] || 0) === minCount);
}

const chosen = pick3367(pool);
if (!chosen) break;

    if (chosen.type === 'food') {
      // Midi : si déjà un resto midi → marquer comme utilisé pour ne plus repiocher, et chercher un autre lieu
      if (chosen.subType === 'restaurant' && hour >= 12 && hour < 14) {
        if (mealAtMidi) {
          usedIds.add(chosen.id); // évite de re-piocher ce lieu au tour suivant
          continue; // on retente le même slot sans avancer l'heure
        }
        mealAtMidi = true;
      }
      // Soir : idem
      if (chosen.subType === 'restaurant' && hour >= 19 && hour < 22) {
        if (mealAtSoir) {
          usedIds.add(chosen.id);
          continue;
        }
        mealAtSoir = true;
      }
    }

    usedIds.add(chosen.id);
const h = Math.floor(cur / 60) % 24;
const m = cur % 60;
const time = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;

// Durée HYBRIDE : on respecte duration_min de la BDD si disponible,
// sinon on applique un défaut intelligent selon le contexte (midi/soir, etc.)
// chosen.dur vaut Number(p.duration_min) || 60 — donc si =60 c'est peut-être un fallback
// On considère qu'une durée BDD est "réelle" si elle diffère du fallback 60 par défaut.
let actualDur: number;
const hasDurFromDB = chosen.dur && chosen.dur !== 60;
if (hasDurFromDB) {
  // Durée réelle BDD (cas typique : parc=90, monument=60, leisure=90-150)
  actualDur = chosen.dur;
} else {
  // Défaut intelligent par sous-type
  if (chosen.type === 'food' && chosen.subType === 'cafe') {
    actualDur = 45;
  } else if (chosen.type === 'food' && chosen.subType === 'restaurant') {
    actualDur = (hour >= 12 && hour < 14) ? 75 : 90; // midi 1h15, soir 1h30
  } else if (chosen.type === 'social' && chosen.subType === 'bar') {
    actualDur = hour >= 22 ? 120 : 90; // bar fin de soirée 2h, sinon 1h30
  } else if (chosen.type === 'culture' && chosen.subType === 'theater') {
    actualDur = 120; // théâtre 2h (pièce + entracte)
  } else if (chosen.type === 'culture') {
    actualDur = 90; // musée 1h30
  } else {
    actualDur = chosen.dur || 60; // fallback ultime
  }
}

const endMin = cur + actualDur;
const eh2 = Math.floor(endMin / 60) % 24;
const em2 = endMin % 60;
const endTime = `${String(eh2).padStart(2, '0')}h${String(em2).padStart(2, '0')}`;

// Calculer trajet avant push pour réutiliser
const transit = steps.length > 0
  ? computeTransit(steps[steps.length - 1], chosen, mobility)
  : null;

steps.push({
  ...chosen, dur: actualDur, time, endTime, km: 0,
  tr: transit ? { icon: transit.icon, txt: transit.txt } : null,
});
    cur = endMin + (transit?.minutes ?? 0);
  }
 // On stocke juste la clé, traduction côté UI
  const dayTitleKey = dayConfig.types[0] || 'mix';
  const totalDur = steps.reduce((s, p) => s + p.dur + TRANSIT, 0);

  return {
    dayIndex, dayLabel, date,
    startTime: dayConfig.startTime || '10:00',
    endTime: dayConfig.endTime || '22:00',
    title: dayTitleKey, steps, totalH: Math.round(totalDur / 60), count: steps.length,
    // Marquer la journée comme générée localement
    _engineSource: 'local',
  } as any;
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
  const mobility = dayConfig.precision?.mobility?.[0] || 'transport';

  // ── Transit réel basé sur GPS (même logique que le moteur local) ──
  const distKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const transitFor = (from: Place, to: Place): { icon: string; txt: string } => {
    const km = distKm(from.lat, from.lng, to.lat, to.lng);
    if (km === 0) return { icon: '🚶', txt: 'À pied · ≈ 5 min' };
    if (mobility === 'pied') {
      return { icon: '🚶', txt: `À pied · ≈ ${Math.round(km * 12)} min` };
    }
    if (mobility === 'velo') {
      return { icon: '🚴', txt: `Vélo · ≈ ${Math.round(km * 4)} min` };
    }
    if (mobility === 'voiture') {
      return { icon: '🚗', txt: `Voiture · ≈ ${Math.round(km * 3 + 5)} min` };
    }
    // Métro/transport par défaut
    const fromS = findNearestStation(from.lat, from.lng);
    const toS = findNearestStation(to.lat, to.lng);
    if (fromS && toS && fromS.station.name !== toS.station.name) {
      const walkBefore = Math.max(1, Math.round(fromS.distanceM / 80));
      const walkAfter  = Math.max(1, Math.round(toS.distanceM / 80));
      const dxLat = (toS.station.lat - fromS.station.lat) * Math.PI / 180;
      const dxLng = (toS.station.lng - fromS.station.lng) * Math.PI / 180;
      const ax = Math.sin(dxLat/2)**2 + Math.cos(fromS.station.lat*Math.PI/180) * Math.cos(toS.station.lat*Math.PI/180) * Math.sin(dxLng/2)**2;
      const metroKm = 6371 * 2 * Math.atan2(Math.sqrt(ax), Math.sqrt(1-ax));
      const metroMin = Math.max(3, Math.round(metroKm * 3 + 3));
      const totalMin = walkBefore + metroMin + walkAfter;
      const sharedLines = (fromS.station.lines || []).filter((l: string) => (toS.station.lines || []).includes(l));
      const suffix = `· ${totalMin} min (+${walkBefore + walkAfter} min à pied)`;
      if (sharedLines.length > 0) {
        return { icon: '🚇', txt: `M${sharedLines[0]} · ${fromS.station.name} → ${toS.station.name} ${suffix}` };
      }
      return { icon: '🚇', txt: `${fromS.station.name} → ${toS.station.name} (corresp.) ${suffix}` };
    }
    return { icon: '🚇', txt: `Métro · ≈ ${Math.round(km * 5 + 5)} min` };
  };

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
    const prevPlace = steps.length > 0 ? steps[steps.length - 1] as unknown as Place : null;
    steps.push({
      ...place, dur, time, endTime, km: 0,
      tr: prevPlace ? transitFor(prevPlace, place) : null,
      desc: s.why ? `${place.desc} — ${s.why}` : place.desc,
    });
  }

  // Seuil relevé à 4 : en dessous, l'IA a produit trop peu de lieux valides
  if (steps.length < 4) {
    return buildLocalDayPlan(allPlaces, dayConfig, dayIndex, dayLabel, date);
  }

  return {
    dayIndex, dayLabel, date,
    startTime: dayConfig.startTime || '10:00',
    endTime: dayConfig.endTime || '22:00',
    title: aiResp.title || 'Votre journée sur mesure',
    steps, totalH: Math.round(steps.reduce((s, p) => s + p.dur + TRANSIT, 0) / 60),
    count: steps.length,
    // ── Métadonnées de génération (pour EngineBadge dans ResultScreen) ──
    _engineSource: 'ai',
    _provider: aiResp._provider,
    _cached: aiResp._cached,
    _autoFixed: aiResp._auto_fixed,
    _retried: aiResp._retried,
  } as any;
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
 
  const moodText = (dayConfig.mood || '').toLowerCase();
  const moodWords = moodText.split(/[\s,.;!?]+/).filter(w => w.length >= 4);

  

  // 1. Scorer tous les lieux (score global + boost mood)
  const scored = allPlaces.map(p => {
    let sc = (p.score || 3) * 2;
    const bi = budgetOrder.indexOf(p.budget[0]);
    sc -= Math.abs(bi - bIdx) * 0.5;
    if (tasteProfile?.liked_categories) {
      const cat = tasteProfile.liked_categories[p.type];
      if (cat !== undefined) sc += (cat - 3) * 1.5;
    }
    if (moodText) {
      const lowerName = p.name.toLowerCase();
      const lowerDesc = (p.desc || '').toLowerCase();
      const lowerTags = p.tags.map(t => t.toLowerCase());
      for (const word of moodWords) {
        if (lowerTags.some(t => t.includes(word))) sc += 5;
        if (lowerName.includes(word)) sc += 4;
        if (lowerDesc.includes(word)) sc += 3;
      }
    }
    return { ...p, _sc: sc };
  });

  // 2. Choisir un lieu pivot (le mieux scoré avec GPS valides)
  const pivot = scored
    .filter((p: any) => p.lat && p.lng)
    .sort((a: any, b: any) => b._sc - a._sc)[0];

  // 3. Garder les 30 lieux les plus PROCHES du pivot (cohérence géo)
  let candidates: Place[];
  if (pivot) {
    const distFromPivot = (p: any) => {
      if (!p.lat || !p.lng) return 999;
      const R = 6371;
      const dLat = (p.lat - pivot.lat) * Math.PI / 180;
      const dLng = (p.lng - pivot.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(pivot.lat*Math.PI/180) * Math.cos(p.lat*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
    candidates = scored
      .map((p: any) => ({ ...p, _dist: distFromPivot(p) }))
      .sort((a: any, b: any) => {
        // Combine proximité (30%) et score (70%) — score/mood prime sur la géo
        const fa = (a._dist * 0.5) - a._sc;
        const fb = (b._dist * 0.5) - b._sc;
        return fa - fb;
      })
      .slice(0, 50);
  } else {
    candidates = scored.sort((a: any, b: any) => b._sc - a._sc).slice(0, 50);
  }
 
  const context = buildAIContext(dayConfig, candidates, tasteProfile, city);
 
 const resp = await callAIEdgeFunction(context, dayLabel);
  if (resp) return aiResponseToDayPlan(resp, allPlaces, dayConfig, dayIndex, dayLabel, date);
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
  let isPremium = false;
  try {
    const { data } = await supabase.from('places').select('*').eq('city', tripConfig.city);
    rawPlaces = data || [];
    // Charger le statut premium du user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      isPremium = profile?.is_premium === true;
    }
  } catch { rawPlaces = []; }
 // Si user Free, on retire les lieux premium du pool
const filteredPlaces = isPremium 
  ? rawPlaces 
  : rawPlaces.filter((p: any) => p.tier !== 'premium');

 const cityPlaces: Place[] = filteredPlaces.map((p: any) => ({
  id: String(p.id),
  name: p.name,
  type: (() => {
    const cat = (p.category || '').toLowerCase();
    if (cat === 'restaurant') return 'food';
    if (cat === 'cafe') return 'food';
    if (cat === 'bar') return 'social';
    if (cat === 'theater') return 'culture';
    if (cat === 'museum') return 'culture';
    if (cat === 'monument') return 'culture';
    if (cat === 'park') return 'chill';
    if (cat === 'leisure') return 'leisure';
    if (cat === 'nature') return 'nature';
    return 'chill';
  })() as Place['type'],
  subType: (() => {
  const cat = (p.category || '').toLowerCase();
  if (cat === 'cafe') return 'cafe';
  if (cat === 'restaurant') return 'restaurant';
  if (cat === 'bar') return 'bar';
  if (cat === 'theater') return 'theater';
  return undefined;
})() as Place['subType'],
    desc: p.description || '',
    lat: Number(p.lat) || 0, lng: Number(p.lng) || 0,
    budget: (() => {
      const bl = (p.budget_level || '').toLowerCase();
      if (bl === 'low') return ['free', 'low'];
      if (bl === 'medium') return ['low', 'mid'];
      if (bl === 'high') return ['high'];
      return ['low'];
    })() as Place['budget'],
    tags: [
      ...(Array.isArray(p.experience_tags) ? p.experience_tags : []),
      ...(Array.isArray(p.ambiance_tags) ? p.ambiance_tags : []),
      ...(Array.isArray(p.tags) ? p.tags : []),
    ],
    dur: Number(p.duration_min) || 60,
    ver: p.verified === true,
    score: Number(p.rating_average) || 3.5,
    votes: Number(p.review_count) || 0,
    vid: undefined,
    needsReservation: p.reservable ?? false,
    website_url: p.website_url || undefined,
    booking_url: p.booking_url || undefined,
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
 
  // ── GÉNÉRATION SÉQUENTIELLE pour éviter les doublons entre jours ──
  // Chaque jour passe à l'IA les IDs déjà utilisés les jours précédents.
  let days: DayPlan[] = [];
  const usedIdsAcrossDays = new Set<string>();

  for (let i = 0; i < tripConfig.days.length; i++) {
    const dayConfig = tripConfig.days[i];
    const [y, m, d0] = tripConfig.startDate.split('-').map(Number);
    const d = new Date(y, m - 1, d0 + i);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yy}-${mm}-${dd}`;
    const dayLabel = d.toISOString().split('T')[0];

    // Filtrer les lieux pour exclure ceux déjà utilisés
    const remainingPlaces = allPlaces.filter(p => !usedIdsAcrossDays.has(String(p.id)));

    const generated = await generateOneDayWithAI(
      remainingPlaces, dayConfig, i, dayLabel, dateStr, tasteProfile, tripConfig.city
    );
    days.push(generated);

    // Ajouter les IDs des steps de cette journée au pool global
    for (const step of (generated.steps || [])) {
      if (step.id) usedIdsAcrossDays.add(String(step.id));
    }
  }

// Si Free : insérer 1 placeholder Premium dans chaque jour
if (!isPremium) {
  days = days.map(day => insertPremiumPlaceholder(day, rawPlaces));
}

return { city: tripConfig.city, days };
}
 
export { buildLocalDayPlan };
export function isValidVideoUrl(url?: string | null): { valid: boolean; platform: string } {
  if (!url) return { valid: false, platform: '' };
  if (/youtube\.com|youtu\.be/i.test(url)) return { valid: true, platform: 'YouTube' };
  if (/vimeo\.com/i.test(url)) return { valid: true, platform: 'Vimeo' };
  if (/tiktok\.com/i.test(url)) return { valid: true, platform: 'TikTok' };
  if (/instagram\.com/i.test(url)) return { valid: true, platform: 'Instagram' };
  if (/\.(mp4|webm|ogg)/i.test(url)) return { valid: true, platform: 'Vidéo' };
  return { valid: false, platform: '' };
}


export function getUGCCenter(ugcData: UGCEntry[]): [number, number] | null {
  const withCoords = ugcData.filter(u => u.lat && u.lng);
  if (withCoords.length === 0) return null;
  const lat = withCoords.reduce((s, u) => s + u.lat, 0) / withCoords.length;
  const lng = withCoords.reduce((s, u) => s + u.lng, 0) / withCoords.length;
  return [lat, lng];
}

/**
 * Construit une URL Google Maps avec itinéraire pré-rempli
 * Max 11 lieux (origin + 9 waypoints + destination)
 */
export function buildGoogleMapsUrl(steps: { lat: number; lng: number; name: string }[], mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'transit'): string | null {
  if (!steps || steps.length < 2) return null;

  // Filtrer ceux qui ont des coordonnées
  const valid = steps.filter(s => s.lat && s.lng);
  if (valid.length < 2) return null;

  // Si plus de 11, on garde les 11 premiers
  const trimmed = valid.slice(0, 11);

  const origin = `${trimmed[0].lat},${trimmed[0].lng}`;
  const destination = `${trimmed[trimmed.length - 1].lat},${trimmed[trimmed.length - 1].lng}`;
  const waypoints = trimmed
    .slice(1, -1)
    .map(s => `${s.lat},${s.lng}`)
    .join('|');

  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  if (waypoints) url.searchParams.set('waypoints', waypoints);
  url.searchParams.set('travelmode', mode);

  return url.toString();

}

 /**
 * Insère 1 placeholder "Lieu Premium flouté" au milieu de la journée.
 * Tire un vrai subType au hasard parmi les lieux premium du pool.
 */
function insertPremiumPlaceholder(day: DayPlan, allRawPlaces: any[]): DayPlan {
  if (!day.steps || day.steps.length === 0) return day;

  const premiumPool = allRawPlaces.filter((p: any) => p.tier === 'premium');
  if (premiumPool.length === 0) return day;

  // Helper : convertir une catégorie BDD en type/subType app
  const catToTypes = (cat: string): { type: Place['type']; subType?: Place['subType'] } => {
    const c = (cat || '').toLowerCase();
    if (c === 'restaurant') return { type: 'food', subType: 'restaurant' };
    if (c === 'cafe') return { type: 'food', subType: 'cafe' };
    if (c === 'bar') return { type: 'social', subType: 'bar' };
    if (c === 'theater') return { type: 'culture', subType: 'theater' };
    if (c === 'museum' || c === 'monument') return { type: 'culture' };
    if (c === 'park') return { type: 'chill' };
    if (c === 'leisure') return { type: 'leisure' };
    if (c === 'nature') return { type: 'nature' };
    return { type: 'culture' };
  };

  const insertAt = Math.floor(day.steps.length / 2);
  const previousStep = day.steps[insertAt - 1];
  const nextStep = day.steps[insertAt];

  // Inventaire des food déjà dans la journée
  const existingFoodSubTypes = day.steps
    .filter(s => s.type === 'food')
    .map(s => s.subType);
  const hasCafe = existingFoodSubTypes.includes('cafe');
  const restaurantCount = existingFoodSubTypes.filter(st => st === 'restaurant').length;

  // Filtrer le pool premium pour éviter les doublons type/subType
  const isCompatible = (premium: any): boolean => {
    const { type, subType } = catToTypes(premium.category);

    // Règles food globales : ne pas dépasser 1 café + 2 restaurants max sur la journée
    if (type === 'food') {
      if (subType === 'cafe' && hasCafe) return false;
      if (subType === 'restaurant' && restaurantCount >= 2) return false;
      // Pas de food si la journée en a déjà 2
      if (existingFoodSubTypes.length >= 2) return false;
    }

    // Pas même type que voisin (sauf food avec subType différent)
    if (previousStep) {
      if (previousStep.type === type) {
        if (type === 'food') {
          if (previousStep.subType === subType) return false;
        } else return false;
      }
    }
    if (nextStep) {
      if (nextStep.type === type) {
        if (type === 'food') {
          if (nextStep.subType === subType) return false;
        } else return false;
      }
    }

    // Pas de food inséré avant 12h ou après 22h
    if (type === 'food') {
      const [h] = (previousStep?.endTime || '15h00').replace('h', ':').split(':').map(Number);
      if (h < 12) return false;
      if (h >= 22) return false;
    }

    return true;
  };

  const compatiblePool = premiumPool.filter(isCompatible);
  if (compatiblePool.length === 0) {
    // Aucun premium compatible avec ce voisinage → on skip
    return day;
  }

  const randomPremium = compatiblePool[Math.floor(Math.random() * compatiblePool.length)];
  const { type: placeholderType, subType: placeholderSubType } = catToTypes(randomPremium.category);

  // Helpers temps (format "HHhMM")
  const parseMin = (s: string) => {
    const clean = (s || '').replace('h', ':');
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const toTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
  };

  const premiumDur = Number(randomPremium.duration_min) || 90;
  const startMin = previousStep ? parseMin(previousStep.endTime) : parseMin('15h00');
  const endMin = startMin + premiumDur;

  const placeholderStep: PlanStep = {
    id: `premium_placeholder_${Math.random().toString(36).slice(2, 9)}`,
    name: '████████████████',
    type: placeholderType,
    subType: placeholderSubType,
    desc: 'Lieu Premium — passe Premium pour le découvrir',
    lat: 0, lng: 0,
    budget: ['mid'],
    tags: [],
    dur: premiumDur,
    ver: false,
    score: 0,
    time: toTimeStr(startMin),
    endTime: toTimeStr(endMin),
    km: 0,
    tr: null,
    isPremiumPlaceholder: true,
  } as any;

  const shiftedTail = day.steps.slice(insertAt).map(s => {
    const sStart = parseMin(s.time) + premiumDur;
    const sEnd = parseMin(s.endTime) + premiumDur;
    return { ...s, time: toTimeStr(sStart), endTime: toTimeStr(sEnd) };
  });

  const newSteps = [
    ...day.steps.slice(0, insertAt),
    placeholderStep,
    ...shiftedTail,
  ];

  return {
    ...day,
    steps: newSteps,
    count: newSteps.length,
    endTime: newSteps[newSteps.length - 1]?.endTime || day.endTime,
  };
}