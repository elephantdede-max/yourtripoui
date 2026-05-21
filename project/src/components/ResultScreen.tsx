import { useState, useCallback } from 'react';
import {
  ArrowLeft, Clock3, CheckCircle, Users, Play,
  ChevronDown, ChevronUp, ExternalLink, Calendar, Minus, Plus, RefreshCw
} from 'lucide-react';
import type { MultiDayPlan, PlanStep, DayPlan, BudgetType } from '../types';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';
import { isValidVideoUrl } from '../lib/ai-engine';
import ReservationModal from './ReservationModal';
import ReplaceLieuModal from './ReplaceLieuModal';
import DayMap from './DayMap';
import PlanningAgenda from './PlanningAgenda';

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; label: string; emoji: string }> = {
  food:    { bg: '#FDF0E8', border: '#C4622D', color: '#8B3D1A', label: 'Gastronomie', emoji: '🍽️' },
  chill:   { bg: '#E8F0E0', border: '#2D5016', color: '#1A3A0A', label: 'Détente',     emoji: '🌿' },
  culture: { bg: '#E8ECF5', border: '#1A2744', color: '#0E1A2E', label: 'Culture',     emoji: '🎨' },
  view:    { bg: '#F5F0E8', border: '#8B6914', color: '#5A4409', label: 'Vue',          emoji: '🛕' },
  social:  { bg: '#F0E8F5', border: '#6B2D8B', color: '#4A1A6B', label: 'Social',      emoji: '🍸' },
};

const PRICE_LABELS: Record<string, string> = { free: 'Gratuit', low: '€', mid: '€€', high: '€€€' };
const RATING_MIN_VOTES = 200;

function getPriceLabel(budget: BudgetType[]): string {
  if (!budget?.length) return '';
  return PRICE_LABELS[budget[budget.length - 1]] || '';
}

function RatingBadge({ score, votes }: { score: number; votes?: number }) {
  if (!votes || votes < RATING_MIN_VOTES) return null;
  const stars = Math.min(5, Math.max(0, Math.round(score)));
  return (
    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)' }}>
      <span style={{ color: '#D4A843' }}>{'★'.repeat(stars)}</span>
      <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - stars)}</span>
      {' '}{score.toFixed(1)}
    </span>
  );
}

function VideoLink({ url, lang }: { url: string; lang: LangCode }) {
  const v = isValidVideoUrl(url);
  if (!v.valid) return null;
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: '#0A0A0F', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
    >
      <Play size={11} /> Voir sur {v.platform} <ExternalLink size={10} />
    </button>
  );
}

// ─────────────────────────────────────────────
// STEP CARD
// ─────────────────────────────────────────────
interface StepCardProps {
  step: PlanStep;
  index: number;
  isLast: boolean;
  onReserve: (p: PlanStep) => void;
  onDurationChange: (id: string, delta: number) => void;
  onReplace: (step: PlanStep) => void;
  lang: LangCode;
}

function StepCard({ step, index, isLast, onReserve, onDurationChange, onReplace, lang }: StepCardProps) {
  const style = TYPE_STYLE[step.type] || TYPE_STYLE.chill;
  const price = getPriceLabel(step.budget);
  const timeH = parseInt((step.time || '12:00').replace('h', ':').split(':')[0]) || 12;
  const dotColor = timeH < 12 ? '#D4A843' : timeH < 18 ? '#C4622D' : '#1A2744';

  return (
    <>
      {step.tr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '18px', paddingBlock: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--f-body)' }}>
          <span>{step.tr.icon}</span>
          <span>{step.tr.txt}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', animation: `fadeUp 200ms ${index * 50}ms both` }}>
        {/* Dot timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18px', flexShrink: 0, paddingTop: '14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, border: '2px solid #0A0A0F', boxShadow: `0 0 0 2px ${dotColor}`, flexShrink: 0 }} />
          {!isLast && <div style={{ width: '1.5px', flex: 1, background: 'rgba(255,255,255,0.07)', marginTop: '4px', minHeight: '40px' }} />}
        </div>

        {/* Card */}
        <div style={{ flex: 1, background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${style.border}`, borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: '4px' }}>

          {/* Heure + tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>
              {(step.time || '').replace('h', ':')} — {(step.endTime || '').replace('h', ':')}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: style.bg, color: style.color, fontFamily: 'var(--f-body)' }}>
              {style.emoji} {style.label}
            </span>
          </div>

          {/* Nom */}
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '17px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', lineHeight: 1.25 }}>
            {step.name}
          </div>

          {/* Description */}
          <div style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: '12px' }}>
            {step.desc}
          </div>

          {/* Contrôle durée */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#0A0A0F', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '10px' }}>
            <Clock3 size={12} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--f-body)', fontSize: '12px', color: 'rgba(255,255,255,0.55)', flex: 1 }}>Durée</span>
            <button
              onClick={() => onDurationChange(step.id, -15)}
              disabled={step.dur <= 15}
              style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: step.dur > 15 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: step.dur <= 15 ? 0.4 : 1, flexShrink: 0 }}
            >
              <Minus size={11} style={{ color: '#FFFFFF' }} />
            </button>
            <span style={{ fontFamily: 'var(--f-body)', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', minWidth: '56px', textAlign: 'center' }}>
              {step.dur} min
            </span>
            <button
              onClick={() => onDurationChange(step.id, 15)}
              style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Plus size={11} style={{ color: '#FFFFFF' }} />
            </button>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {price && <span style={{ fontSize: '12px', color: '#C4622D', fontFamily: 'var(--f-body)', fontWeight: 500 }}>{price}</span>}
              {step.ver && <span style={{ fontSize: '11px', color: '#2D7D46', fontFamily: 'var(--f-body)', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={10} /> Vérifié</span>}
              {step.community && <span style={{ fontSize: '11px', color: '#D4A843', fontFamily: 'var(--f-body)', display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={10} /> Communauté</span>}
            </div>
            <RatingBadge score={step.score || 0} votes={step.votes} />
          </div>

          {step.vid && <VideoLink url={step.vid} lang={lang} />}

          {/* Boutons actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {step.needsReservation && (
              <button
                onClick={() => onReserve(step)}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1.5px solid ${style.border}`, background: style.bg, color: style.color, fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Calendar size={12} /> Réserver
              </button>
            )}
            <button
              onClick={() => onReplace(step)}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} /> Remplacer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DAY SECTION
// ─────────────────────────────────────────────
function DaySection({ day, isOpen, onToggle, onReserve, onDurationChange, onReplace, lang }: {
  day: DayPlan; isOpen: boolean; onToggle: () => void;
  onReserve: (p: PlanStep) => void;
  onDurationChange: (id: string, delta: number) => void;
  onReplace: (step: PlanStep) => void;
  lang: LangCode;
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: isOpen ? '12px 12px 0 0' : '14px', cursor: 'pointer' }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>{day.title}</div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>
            {day.dayLabel} · {(day.startTime || '').replace(':', 'h')} → {(day.endTime || '').replace(':', 'h')} · {day.count} étapes
          </div>
        </div>
        {isOpen
          ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
        }
      </button>

      {isOpen && (
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px 12px 8px', background: '#0A0A0F' }}>
          <DayMap steps={day.steps} city="" />
          {day.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              isLast={i === day.steps.length - 1}
              onReserve={onReserve}
              onDurationChange={onDurationChange}
              onReplace={onReplace}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
interface Props {
  plan: MultiDayPlan;
  feedback: 'like' | 'dislike' | null;
  lang: LangCode;
  onFeedback: (f: 'like' | 'dislike') => void;
  onReset: () => void;
  onShowReview?: () => void;
}

export default function ResultScreen({ plan, feedback, lang, onFeedback, onReset, onShowReview }: Props) {
  const [openDay, setOpenDay] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<PlanStep | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<PlanStep | null>(null);
  const [isReservationLoading, setIsReservationLoading] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [localPlan, setLocalPlan] = useState<MultiDayPlan>(plan);

  // ── Modifier durée + recalcul horaires ──
  const handleDurationChange = useCallback((stepId: string, delta: number) => {
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map(day => {
        const idx = day.steps.findIndex(s => s.id === stepId);
        if (idx === -1) return day;

        const newSteps = [...day.steps];
        newSteps[idx] = { ...newSteps[idx], dur: Math.max(15, newSteps[idx].dur + delta) };

        // Recalculer les horaires en cascade
        const [sh, sm] = (day.startTime || '10:00').split(':').map(Number);
        let cur = sh * 60 + sm;
        const recalc = newSteps.map((s, i) => {
          const h = Math.floor(cur / 60) % 24;
          const m = cur % 60;
          const timeStr = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
          const endMins = cur + s.dur;
          const eh = Math.floor(endMins / 60) % 24;
          const em = endMins % 60;
          const endStr = `${String(eh).padStart(2, '0')}h${String(em).padStart(2, '0')}`;
          const trMin = s.tr ? parseInt(s.tr.txt.match(/\d+/)?.[0] || '0') : 0;
          cur = endMins + (i < newSteps.length - 1 ? trMin : 0);
          return { ...s, time: timeStr, endTime: endStr };
        });

        return { ...day, steps: recalc, endTime: recalc[recalc.length - 1]?.endTime || day.endTime };
      }),
    }));
  }, []);

  // ── Remplacer un lieu ──
  const handleReplaceConfirm = useCallback((newPlace: any) => {
    if (!replaceTarget) return;
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map(day => {
        const idx = day.steps.findIndex(s => s.id === replaceTarget.id);
        if (idx === -1) return day;
        const newSteps = [...day.steps];
        newSteps[idx] = {
          ...newSteps[idx],
          id: String(newPlace.id),
          name: newPlace.name,
          desc: newPlace.description || '',
          type: newPlace.type || newSteps[idx].type,
          lat: newPlace.lat || 0,
          lng: newPlace.lng || 0,
          score: newPlace.rating_average || 3.5,
          votes: newPlace.review_count || 0,
          ver: newPlace.discovery_level === 'lieux connus',
          dur: newPlace.dur || newSteps[idx].dur,
        };
        return { ...day, steps: newSteps };
      }),
    }));
    setReplaceTarget(null);
  }, [replaceTarget]);

  const handleReservationSubmit = async (data: any) => {
    setIsReservationLoading(true);
    try {
      console.log('[Jorne] Réservation:', data);
      setSelectedPlace(null);
    } finally {
      setIsReservationLoading(false);
    }
  };

  if (showAgenda) {
    return <PlanningAgenda plan={localPlan} lang={lang} onClose={() => setShowAgenda(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>

      {/* ── Header sticky ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'linear-gradient(135deg,#1A1205,#D4A843)', color: '#fff', padding: '16px 20px 18px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--f-body)' }}>
              <ArrowLeft size={13} /> Nouveau voyage
            </button>
            <button
              onClick={() => setShowAgenda(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '20px', padding: '5px 12px', color: '#fff', fontSize: '12px', fontFamily: 'var(--f-body)', fontWeight: 500, cursor: 'pointer' }}
            >
              <Calendar size={13} /> Agenda
            </button>
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>
            {localPlan.city}
          </h1>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', opacity: 0.75 }}>
            {localPlan.days.length} jour{localPlan.days.length > 1 ? 's' : ''} · {localPlan.days.reduce((s, d) => s + d.count, 0)} activités
          </p>
        </div>
      </div>

      {/* ── Journées ── */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 140px' }}>
        {localPlan.days.map((day, i) => (
          <DaySection
            key={i}
            day={day}
            isOpen={openDay === i}
            onToggle={() => setOpenDay(openDay === i ? -1 : i)}
            onReserve={setSelectedPlace}
            onDurationChange={handleDurationChange}
            onReplace={step => setReplaceTarget(step)}
            lang={lang}
          />
        ))}
      </div>

      {/* ── Footer J'adore / Regénérer ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '10px 16px 20px', background: 'linear-gradient(to top, #0A0A0F 80%, transparent)', zIndex: 40 }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: '8px' }}>
          Cette journée te convient ?
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { onFeedback('like'); onShowReview?.(); }}
            style={{
              flex: 1, padding: '15px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'var(--f-body)', fontWeight: 600, fontSize: '14px',
              background: feedback === 'like' ? '#D4A843' : '#111118',
              color: feedback === 'like' ? '#fff' : '#FFFFFF',
              border: `1.5px solid ${feedback === 'like' ? '#D4A843' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: feedback === 'like' ? '0 4px 12px rgba(26,39,68,0.25)' : 'none',
              transition: 'all 150ms ease',
            }}
          >
            {feedback === 'like' ? '✅ Sauvegardé !' : '❤️ J\'adore'}
          </button>
          <button
            onClick={() => onFeedback('dislike')}
            style={{ flex: 1, padding: '15px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--f-body)', fontWeight: 500, fontSize: '14px', background: 'transparent', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.07)', transition: 'all 150ms ease' }}
          >
            🔄 Regénérer
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedPlace && (
        <ReservationModal
          place={selectedPlace}
          date={localPlan.days[Math.max(0, openDay)]?.date || new Date().toISOString().split('T')[0]}
          lang={lang}
          onSubmit={handleReservationSubmit}
          onClose={() => setSelectedPlace(null)}
          isLoading={isReservationLoading}
        />
      )}

      {replaceTarget && (
        <<ReplaceLieuModal
          step={replaceTarget}
          city={localPlan.city}
          onSelect={handleReplaceConfirm}
          onClose={() => setReplaceTarget(null)}
        />
      )}
    </div>
  );
}
