import { useState, useEffect } from 'react';
import { X, Star, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import type { PlanStep } from '../types';
import { supabase } from '../lib/supabase';

interface SimilarPlace {
  id: string | number; name: string; description: string;
  rating_average: number; review_count: number; budget: string;
  discovery_level: string; lat: number; lng: number; type: string;
  dur?: number; _distance?: number | null;
}

interface Props {
  step: PlanStep;
  city: string;
  onSelect: (place: SimilarPlace) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { type: 'restaurant', label: 'Restaurant', emoji: '🍴', dbTypes: ['restaurant'] },
  { type: 'cafe',       label: 'Café',       emoji: '☕', dbTypes: ['cafe'] },
  { type: 'bar',        label: 'Bar',        emoji: '🍸', dbTypes: ['bar'] },
  { type: 'museum',     label: 'Musée',      emoji: '🖼️', dbTypes: ['museum'] },
  { type: 'theater',    label: 'Théâtre',    emoji: '🎭', dbTypes: ['theater'] },
  { type: 'park',       label: 'Parc',       emoji: '🌳', dbTypes: ['park'] },
  { type: 'monument',   label: 'Monument',   emoji: '🏛️', dbTypes: ['monument'] },
];

const BUDGET_LABEL: Record<string, string> = {
  économique: '€', modéré: '€€', flexible: '€€€', premium: '€€€€',
};

// Fix Gemini #3 : table de correspondance budget interne → Supabase
const BUDGET_MAP_REVERSE: Record<string, string> = {
  free: 'économique', low: 'économique', mid: 'modéré', high: 'premium',
};

const G = '#C9A961';

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ReplaceLieuModal({ step, city, onSelect, onClose }: Props) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [places, setPlaces] = useState<SimilarPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCat) return;
    setLoading(true);
    const cat = CATEGORIES.find(c => c.type === selectedCat);
    const dbTypes = cat?.dbTypes || [selectedCat];

    // Fix Gemini #3 : traduire le budget interne vers le format Supabase
    const stepInternalBudget = step.budget?.[0] || 'low';
    const targetBudgetLabel = BUDGET_MAP_REVERSE[stepInternalBudget] || 'modéré';

    supabase
      .from('places')
      .select('id, name, description, rating_average, review_count, budget, discovery_level, lat, lng, type, duration')
      .eq('city', city)  // Fix Gemini #1 : filtre par ville
      .in('type', dbTypes)
      .neq('id', step.id)
      .order('rating_average', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          setPlaces(data
            .map((p: any) => ({
              ...p,
              dur: p.duration || 60,
              _distance: step.lat && step.lng && p.lat && p.lng
                ? distanceKm(step.lat, step.lng, p.lat, p.lng) : null,
            }))
            // Fix Gemini #2 : tri Budget → Note → Distance
            .sort((a: any, b: any) => {
              const bMatch = (x: any) => x.budget === targetBudgetLabel ? 0 : 1;
              const bDiff = bMatch(a) - bMatch(b);
              if (bDiff !== 0) return bDiff;
              const rDiff = (b.rating_average || 0) - (a.rating_average || 0);
              if (Math.abs(rDiff) > 0.2) return rDiff;
              return (a._distance ?? 999) - (b._distance ?? 999);
            })
            .slice(0, 8)
          );
        }
        setLoading(false);
      });
  }, [selectedCat, step, city]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.85)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }}>
      <div style={{
        background: '#0A0A0F', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480, margin: '0 auto',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedCat && (
              <button onClick={() => setSelectedCat(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
              }}>
                <ArrowLeft size={18} color="rgba(255,255,255,0.55)" />
              </button>
            )}
            <div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 700, color: '#FFF' }}>
                {selectedCat ? CATEGORIES.find(c => c.type === selectedCat)?.label : 'Remplacer cette activité'}
              </h3>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {selectedCat ? 'Budget et note similaires · À proximité' : 'Choisissez une catégorie'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="rgba(255,255,255,0.55)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>

          {/* VUE CATÉGORIES */}
          {!selectedCat && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.type} onClick={() => setSelectedCat(cat.type)} style={{
                  width: '100%', textAlign: 'left', padding: '16px 18px',
                  background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 600, color: '#FFF' }}>
                      {cat.label}
                    </span>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </button>
              ))}
            </div>
          )}

          {/* VUE LIEUX */}
          {selectedCat && loading && (
            <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Caveat', cursive", fontSize: 16, color: 'rgba(255,255,255,0.55)' }}>
              Recherche des meilleures alternatives...
            </div>
          )}

          {selectedCat && !loading && places.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--f-body)', fontSize: 14, color: 'rgba(255,255,255,0.28)' }}>
              Aucun lieu disponible dans cette catégorie
            </div>
          )}

          {selectedCat && !loading && places.map(place => (
            <button key={String(place.id)} onClick={() => onSelect(place)} style={{
              width: '100%', textAlign: 'left', marginBottom: 10,
              background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600, color: '#FFF' }}>
                    {place.name}
                  </span>
                  <p style={{
                    fontFamily: 'var(--f-body)', fontSize: 12, color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.4, marginTop: 4,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {place.description}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {place.rating_average > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#FFF' }}>
                      <Star size={10} style={{ color: G, fill: G }} />
                      {Number(place.rating_average).toFixed(1)}
                    </span>
                  )}
                  {place.budget && (
                    <span style={{ fontSize: 11, color: '#C4622D', fontWeight: 500 }}>
                      {BUDGET_LABEL[place.budget] || place.budget}
                    </span>
                  )}
                  {place._distance != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      <MapPin size={9} />
                      {place._distance < 1 ? `${(place._distance * 1000).toFixed(0)}m` : `${place._distance.toFixed(1)}km`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}