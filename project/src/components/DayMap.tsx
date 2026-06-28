import { useEffect, useRef } from 'react';
import type { PlanStep } from '../types';
import { useLang } from '../lib/lang-context';

interface Props {
  steps: PlanStep[];
  city: string;
}

// Couleurs par catégorie — palette DA Luxe (matchent TYPE_STYLE de ResultScreen)
const TYPE_COLORS: Record<string, string> = {
  food:    '#C57B5E', // terracotta
  chill:   '#8A9C76', // sage
  culture: '#7B95B0', // slate
  view:    '#D6BC82', // or doux
  social:  '#9B7D9A', // mauve
  leisure: '#E0A865', // ambre
  nature:  '#6E8A5A', // moss
};

function colorForType(type: string): string {
  return TYPE_COLORS[type] || '#7B95B0';
}

export default function DayMap({ steps }: Props) {
  const { t } = useLang();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const stepsWithCoords = steps.filter(s => s.lat && s.lng && s.lat !== 0 && s.lng !== 0);

  useEffect(() => {
    if (!mapRef.current || stepsWithCoords.length === 0) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Charger Leaflet dynamiquement
    const ensureLeafletCSS = () => {
      if (document.querySelector('link[href*="leaflet@1.9.4"]')) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    };

    ensureLeafletCSS();

    const ensureLeafletJS = (cb: () => void) => {
      if ((window as any).L) { cb(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = cb;
      document.head.appendChild(script);
    };

    ensureLeafletJS(() => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const center: [number, number] = [stepsWithCoords[0].lat, stepsWithCoords[0].lng];

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView(center, 14);
      mapInstanceRef.current = map;

      // Tiles : light si thème premium, dark sinon
      const isLight = document.body.classList.contains('theme-premium');
      const tileUrl = isLight
        ? 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      // Ligne d'itinéraire en pointillé doré subtil
      const latlngs: [number, number][] = stepsWithCoords.map(s => [s.lat, s.lng]);
      L.polyline(latlngs, {
        color: '#D6BC82',
        weight: 1.8,
        opacity: 0.55,
        dashArray: '4 6',
      }).addTo(map);

      // Marqueurs numérotés
      stepsWithCoords.forEach((step, i) => {
        const color = colorForType(step.type);

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:30px;height:30px;border-radius:50%;
            background:${color};
            border:2px solid ${isLight ? '#FBF6E8' : '#0A0A0F'};
            box-shadow:0 2px 8px ${isLight ? 'rgba(26,18,8,0.25)' : 'rgba(0,0,0,0.5)'};
            display:flex;align-items:center;justify-content:center;
            color:#0A0A0F;font-size:12px;font-weight:700;
            font-family:'Geist',system-ui,sans-serif;
          ">${i + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16],
        });

        L.marker([step.lat, step.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:15px;color:#1A1208">${step.name}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#78716C;margin-top:3px;letter-spacing:0.05em">${step.time} — ${step.endTime}</div>
          `);
      });

      // Ajuster le zoom pour voir tous les points
      if (stepsWithCoords.length > 1) {
        map.fitBounds(latlngs, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [steps]);

  if (stepsWithCoords.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-soft)',
        border: '1px solid rgba(244,238,223,0.08)',
        borderRadius: 18, padding: 28, textAlign: 'center',
        marginBottom: 16,
      }}>
        <p style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--text-muted)',
          margin: 0,
        }}>
          {t('day_map_unavailable')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        height: 300,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(244,238,223,0.10)',
        position: 'relative',
        zIndex: 0,
        isolation: 'isolate',
        background: 'var(--bg)',
      }}
    />
  );
}
