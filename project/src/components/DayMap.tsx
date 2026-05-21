import { useEffect, useRef } from 'react';
import type { PlanStep } from '../types';

interface Props {
  steps: PlanStep[];
  city: string;
}

// Carte OpenStreetMap via Leaflet (CDN — aucune clé API)
// Chargée dynamiquement pour éviter les SSR issues

const DOT_COLORS: Record<string, string> = {
  matin:   '#D4A843',
  aprem:   '#C4622D',
  soir:    '#1A2744',
  default: '#1A2744',
};

function getMoment(time: string): string {
  const clean = time.replace('h', ':');
  const h = parseInt(clean.split(':')[0]);
  if (h < 12) return 'matin';
  if (h < 18) return 'aprem';
  return 'soir';
}

export default function DayMap({ steps, city }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const stepsWithCoords = steps.filter(s => s.lat && s.lng && s.lat !== 0 && s.lng !== 0);

  useEffect(() => {
    if (!mapRef.current || stepsWithCoords.length === 0) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Charger Leaflet dynamiquement depuis CDN
    const linkCSS = document.createElement('link');
    linkCSS.rel = 'stylesheet';
    linkCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkCSS);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // Centre sur le premier lieu
      const center: [number, number] = [stepsWithCoords[0].lat, stepsWithCoords[0].lng];

      const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView(center, 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      // Ligne de l'itinéraire
      const latlngs: [number, number][] = stepsWithCoords.map(s => [s.lat, s.lng]);
      L.polyline(latlngs, {
        color: '#1A2744', weight: 2.5, opacity: 0.6, dashArray: '6 4',
      }).addTo(map);

      // Marqueurs numérotés
      stepsWithCoords.forEach((step, i) => {
        const moment = getMoment(step.time);
        const color = DOT_COLORS[moment] || DOT_COLORS.default;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};border:2.5px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:11px;font-weight:700;font-family:Inter,sans-serif;
          ">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        L.marker([step.lat, step.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Georgia,serif;font-size:13px;font-weight:600">${step.name}</div>
            <div style="font-family:Inter,sans-serif;font-size:11px;color:#78716C;margin-top:2px">${step.time} — ${step.endTime} · ${step.dur}min</div>
          `);
      });

      // Ajuster le zoom pour voir tous les points
      if (stepsWithCoords.length > 1) {
        map.fitBounds(latlngs, { padding: [30, 30] });
      }
    };
    document.head.appendChild(script);

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
        background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '24px', textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>
          Carte indisponible — coordonnées manquantes
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Carte */}
      <div
        ref={mapRef}
        style={{
          height: '220px', width: '100%',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      />
      {/* Légende */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap',
        padding: '8px 12px',
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        borderRadius: '0 0 var(--r-md) var(--r-md)',
      }}>
        {stepsWithCoords.map((step, i) => {
          const color = DOT_COLORS[getMoment(step.time)] || DOT_COLORS.default;
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: color, color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-body)', flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
