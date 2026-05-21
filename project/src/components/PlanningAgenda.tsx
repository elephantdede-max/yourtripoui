import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, MapPin, Calendar } from 'lucide-react';
import type { MultiDayPlan, DayPlan, PlanStep } from '../types';
import type { LangCode } from '../lib/i18n';

interface Props {
  plan: MultiDayPlan;
  lang: LangCode;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  food:    { bg: '#FDF0E8', border: '#C4622D', text: '#8B3D1A' },
  chill:   { bg: '#E8F0E0', border: '#2D5016', text: '#1A3A0A' },
  culture: { bg: '#E8ECF5', border: '#1A2744', text: '#0E1A2E' },
  view:    { bg: '#F5F0E8', border: '#8B6914', text: '#5A4409' },
  social:  { bg: '#F0E8F5', border: '#6B2D8B', text: '#4A1A6B' },
};

function timeToMinutes(time: string): number {
  const clean = time.replace('h', ':');
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatTimeDisplay(time: string): string {
  return time.replace('h', ':');
}

// ── Colonne d'une journée (style agenda) ──
function DayColumn({ day, isToday }: { day: DayPlan; isToday: boolean }) {
  const HOUR_HEIGHT = 48; // px par heure
  const START_HOUR = 7;   // afficher à partir de 7h
  const END_HOUR = 24;    // jusqu'à minuit
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  const dayDate = day.date ? new Date(day.date + 'T00:00:00') : null;
  const dayName = dayDate
    ? dayDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    : `Jour ${day.dayIndex + 1}`;

  return (
    <div style={{ flex: '0 0 160px', minWidth: '160px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      {/* En-tête de colonne */}
      <div style={{
        padding: '10px 8px', textAlign: 'center',
        borderBottom: '2px solid ' + (isToday ? '#D4A843' : 'rgba(255,255,255,0.07)'),
        background: isToday ? '#E8ECF5' : '#111118',
        position: 'sticky', top: 0, zIndex: 2,
      }}>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 600, color: isToday ? '#D4A843' : 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {dayName}
        </div>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
          {day.title}
        </div>
      </div>

      {/* Grille horaire */}
      <div style={{ position: 'relative', height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
        {/* Lignes d'heures */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${i * HOUR_HEIGHT}px`, left: 0, right: 0,
            borderTop: '1px solid rgba(255,255,255,0.07)', opacity: 0.5,
          }} />
        ))}

        {/* Activités */}
        {day.steps.map(step => {
          const startMin = timeToMinutes(step.time) - START_HOUR * 60;
          const dur = step.dur;
          const top = (startMin / 60) * HOUR_HEIGHT;
          const height = Math.max((dur / 60) * HOUR_HEIGHT, 28);
          const colors = TYPE_COLORS[step.type] || TYPE_COLORS.chill;

          return (
            <div key={step.id} style={{
              position: 'absolute',
              top: `${top}px`,
              left: '4px',
              right: '4px',
              height: `${height}px`,
              background: colors.bg,
              borderLeft: `3px solid ${colors.border}`,
              borderRadius: '4px',
              padding: '4px 6px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 600, color: colors.text, lineHeight: 1.2 }}>
                {step.name}
              </div>
              {height > 36 && (
                <div style={{ fontFamily: 'var(--f-body)', fontSize: '10px', color: colors.border, marginTop: '2px', opacity: 0.8 }}>
                  {formatTimeDisplay(step.time)} · {step.dur}min
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlanningAgenda({ plan, lang, onClose }: Props) {
  const [currentDayIdx, setCurrentDayIdx] = useState(0);
  const [view, setView] = useState<'day' | 'all'>('all');

  const HOUR_HEIGHT = 48;
  const START_HOUR = 7;
  const END_HOUR = 24;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  // Trouver le jour actuel
  const today = new Date().toISOString().split('T')[0];
  const todayIdx = plan.days.findIndex(d => d.date === today);

  const visibleDays = view === 'day' ? [plan.days[currentDayIdx]] : plan.days;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0A0A0F', zIndex: 100,
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--f-body)',
    }}>
      {/* Header agenda */}
      <div style={{
        background: 'linear-gradient(135deg,#1A1205,#D4A843)', color: '#fff',
        padding: '16px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Retour
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 700 }}>
            {plan.city}
          </div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: '13px', opacity: 0.8 }}>
            {plan.days.length} jour{plan.days.length > 1 ? 's' : ''} · {plan.days.reduce((s, d) => s + d.count, 0)} activités
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setView('day')}
            style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: view === 'day' ? 'rgba(255,255,255,0.3)' : 'transparent', color: '#fff' }}
          >
            Jour
          </button>
          <button
            onClick={() => setView('all')}
            style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: view === 'all' ? 'rgba(255,255,255,0.3)' : 'transparent', color: '#fff' }}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Navigation jours (vue jour uniquement) */}
      {view === 'day' && plan.days.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            onClick={() => setCurrentDayIdx(Math.max(0, currentDayIdx - 1))}
            disabled={currentDayIdx === 0}
            style={{ background: 'none', border: 'none', cursor: currentDayIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentDayIdx === 0 ? 0.3 : 1, color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
              {plan.days[currentDayIdx].dayLabel}
            </div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
              {plan.days[currentDayIdx].title}
            </div>
          </div>
          <button
            onClick={() => setCurrentDayIdx(Math.min(plan.days.length - 1, currentDayIdx + 1))}
            disabled={currentDayIdx === plan.days.length - 1}
            style={{ background: 'none', border: 'none', cursor: currentDayIdx === plan.days.length - 1 ? 'not-allowed' : 'pointer', opacity: currentDayIdx === plan.days.length - 1 ? 0.3 : 1, color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Corps de l'agenda */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>

        {/* Colonne des heures */}
        <div style={{ flexShrink: 0, width: '44px', borderRight: '1px solid rgba(255,255,255,0.07)', background: '#111118' }}>
          <div style={{ height: '52px', borderBottom: '2px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#111118', zIndex: 3 }} />
          {hours.map(h => (
            <div key={h} style={{
              height: `${HOUR_HEIGHT}px`, padding: '2px 4px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--f-body)' }}>
                {String(h).padStart(2, '0')}h
              </span>
            </div>
          ))}
        </div>

        {/* Colonnes des jours */}
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto' }}>
          {visibleDays.map((day, i) => (
            <DayColumn
              key={day.dayIndex}
              day={day}
              isToday={day.date === today}
            />
          ))}
        </div>
      </div>

      {/* Mini-légende en bas */}
      <div style={{ flexShrink: 0, padding: '10px 16px', background: '#111118', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.bg, border: `2px solid ${c.border}` }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)', textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
