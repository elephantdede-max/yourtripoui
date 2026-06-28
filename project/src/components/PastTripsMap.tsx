import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLang } from '../lib/lang-context';

const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE', pt: 'pt-PT',
};

interface SavedPlan {
  id: string;
  city: string;
  plan_data: any;
  created_at: string;
}

interface Props {
  plans: SavedPlan[];
  onTripClick?: (plan: SavedPlan) => void;
}

// Palette DA — une couleur par voyage (cycle si > 7 voyages)
const TRIP_COLORS = [
  '#D6BC82', // or
  '#C57B5E', // terra
  '#8A9C76', // sage
  '#7B95B0', // slate
  '#9B7D9A', // mauve
  '#E0A865', // amber
  '#6E8A5A', // moss
];

interface TripPoint {
  lat: number;
  lng: number;
  name: string;
  stepIndex: number;
  totalSteps: number;
  tripIndex: number;
  color: string;
  plan: SavedPlan;
  tripTitle: string;
}

function extractPoints(plans: SavedPlan[]): TripPoint[] {
  const all: TripPoint[] = [];
  plans.forEach((plan, tripIndex) => {
    const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    const days = data?.days || [];
    const color = TRIP_COLORS[tripIndex % TRIP_COLORS.length];
    let stepNum = 0;
    let total = 0;
    for (const d of days) total += (d.steps?.length || 0);

    for (const day of days) {
      for (const step of (day.steps || [])) {
        if (!step.lat || !step.lng) continue;
        stepNum++;
        all.push({
          lat: step.lat,
          lng: step.lng,
          name: step.name || '',
          stepIndex: stepNum,
          totalSteps: total,
          tripIndex,
          color,
          plan,
          tripTitle: day.title ? `Une journée ${day.title}` : (data.city || 'Voyage'),
        });
      }
    }
  });
  return all;
}

function makeIcon(color: string, number: number) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 26px; height: 26px; border-radius: 50%;
        background: ${color};
        border: 2px solid #08070A;
        box-shadow: 0 2px 10px ${color}66, 0 0 0 2px ${color}55;
        display: flex; align-items: center; justify-content: center;
        color: #1A1208; font-family: 'JetBrains Mono', monospace;
        font-size: 11px; font-weight: 700;
      ">${number}</div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitBounds({ points }: { points: TripPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export default function PastTripsMap({ plans, onTripClick }: Props) {
  const { t, lang } = useLang();
  const locale = LOCALE_MAP[lang] || 'en-GB';
  const points = useMemo(() => extractPoints(plans), [plans]);

  // ── Visibilité par voyage (toutes cochées par défaut) ──
  const [visible, setVisible] = useState<Set<string>>(() => new Set(plans.map(p => p.id)));

  // Re-sync quand la liste de plans change (suppression, ajout)
  useEffect(() => {
    setVisible(prev => {
      const next = new Set<string>();
      for (const p of plans) {
        // Garder l'état précédent si connu, sinon coché par défaut
        if (prev.has(p.id) || prev.size === 0) next.add(p.id);
        else if (!prev.has(p.id) && plans.length > prev.size) next.add(p.id);
      }
      return next;
    });
  }, [plans]);

  const toggleVisible = (id: string) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = visible.size === plans.length;
  const noneChecked = visible.size === 0;

  const checkAll = () => setVisible(new Set(plans.map(p => p.id)));
  const uncheckAll = () => setVisible(new Set());

  // Filtrer les points selon visibilité
  const visiblePoints = useMemo(
    () => points.filter(p => visible.has(p.plan.id)),
    [points, visible]
  );

  // Grouper par voyage pour les polylines (filtrés par visibilité)
  const polylines = useMemo(() => {
    const byTrip = new Map<number, TripPoint[]>();
    for (const p of visiblePoints) {
      const arr = byTrip.get(p.tripIndex) || [];
      arr.push(p);
      byTrip.set(p.tripIndex, arr);
    }
    return Array.from(byTrip.entries()).map(([, pts]) => pts);
  }, [visiblePoints]);

  if (points.length === 0) {
    return (
      <p style={{
        fontFamily: 'var(--f-display)', fontStyle: 'italic',
        fontSize: 15, color: 'var(--text-muted)',
        textAlign: 'center', padding: '60px 20px',
      }}>
        {t('past_trips_empty_map')}
      </p>
    );
  }

  // Légende : un point par voyage
  const legend = plans.map((plan, i) => {
    const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    const firstDay = data?.days?.[0];
    const date = firstDay?.date ? new Date(firstDay.date + 'T00:00:00') : new Date(plan.created_at);
    return {
      plan,
      color: TRIP_COLORS[i % TRIP_COLORS.length],
      city: data?.city || 'Voyage',
      date: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    };
  });

  return (
    <div style={{ fontFamily: 'var(--f-body)' }}>
      {/* Carte */}
      <div style={{
        height: 360,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(214,188,130,0.18)',
        marginBottom: 16,
      }}>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={12}
          style={{ height: '100%', width: '100%', background: 'var(--bg)' }}
          attributionControl={false}
        >
          <TileLayer url={
  typeof window !== 'undefined' && document.body.classList.contains('theme-premium')
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
} />
          {polylines.map((pts, i) => (
            <Polyline
              key={i}
              positions={pts.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: pts[0].color,
                weight: 2.5,
                opacity: 0.7,
                dashArray: '5, 8',
              }}
            />
          ))}

          {visiblePoints.map((p, i) => (
            <Marker
              key={i}
              position={[p.lat, p.lng]}
              icon={makeIcon(p.color, p.stepIndex)}
              eventHandlers={{
                click: () => onTripClick?.(p.plan),
              }}
            />
          ))}

          <FitBounds points={visiblePoints} />
        </MapContainer>
      </div>

      {/* Légende avec checkboxes pour filtrer la carte */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Header : compteur + bouton Tout/Aucun */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          margin: '0 0 6px',
        }}>
          <p style={{
            fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)',
            letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0,
          }}>
            {visible.size} / {plans.length} {plans.length > 1 ? t('past_trips_visible_count_plural') : t('past_trips_visible_count')}
          </p>
          <button
            onClick={allChecked ? uncheckAll : checkAll}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--accent)', cursor: 'pointer',
              fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 600,
              padding: '4px 8px',
              letterSpacing: '-0.005em',
            }}
          >
            {allChecked ? t('past_trips_hide_all') : t('past_trips_show_all')}
          </button>
        </div>

        {legend.map(({ plan, color, city, date }) => {
          const isVisible = visible.has(plan.id);
          return (
            <div
              key={plan.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.08)',
                borderRadius: 12,
                fontFamily: 'var(--f-body)',
                opacity: isVisible ? 1 : 0.45,
                transition: 'opacity 180ms ease',
              }}
            >
              {/* Checkbox visibilité carte */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleVisible(plan.id); }}
                aria-label={isVisible ? t('past_trips_hide_aria') : t('past_trips_show_aria')}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: isVisible ? color : 'transparent',
                  border: `1.5px solid ${isVisible ? color : 'rgba(244,238,223,0.30)'}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'all 180ms ease',
                  boxShadow: isVisible ? `0 0 10px ${color}55` : 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                {isVisible && <Check size={14} color="#1A1208" strokeWidth={3} />}
              </button>

              {/* Zone cliquable : ouvrir le voyage */}
              <button
                onClick={() => onTripClick?.(plan)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                  background: 'transparent', border: 'none', padding: 0,
                  cursor: 'pointer', textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{
                  flex: 1, fontSize: 14, fontWeight: 600,
                  color: 'var(--text)', letterSpacing: '-0.005em',
                  fontFamily: 'var(--f-body)',
                }}>
                  {city}
                </span>
                <span style={{
                  fontFamily: 'var(--f-mono)', fontSize: 11,
                  color: 'var(--text-muted)', letterSpacing: '0.08em',
                }}>
                  {date}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
