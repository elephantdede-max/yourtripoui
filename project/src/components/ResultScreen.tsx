import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft, Clock3, CheckCircle, Users, Map, Upload, ChevronLeft, MapPin, Share2, Lock, Play,
  ChevronDown, ChevronUp, ExternalLink, Calendar, Minus, Plus, RefreshCw,
  Utensils, Leaf, Palette, Check, Mountain, GlassWater, PartyPopper, Heart, TreePine, Camera,
} from 'lucide-react';
import type { MultiDayPlan, PlanStep, DayPlan, BudgetType } from '../types';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';
import ReplaceLieuModal from './ReplaceLieuModal';
import DayMap from './DayMap';
import { translateTransportText } from '../lib/translate-transport';

import TripPhotoGallery from './TripPhotoGallery';
import StepPhotoModal from './StepPhotoModal';
import { getStepPhotoCounts } from '../lib/trip-photos';
import PlanningCalendar from './PlanningCalendar';
import { isValidVideoUrl, buildGoogleMapsUrl } from '../lib/ai-engine';
import { canReplace, incrementReplacementCount, getRemainingReplacements } from '../lib/replacement-quota';
import { useAuth } from '../lib/auth-context';
import { supabase, getSavedPlans } from '../lib/supabase';
import { exportTripToPDF } from '../lib/pdf-export';
import AppHeader from './AppHeader';
import { useToast } from '../lib/toast-context';
import EngineBadge from './EngineBadge';
import ShareTripModal from './ShareTripModal';


const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; labelKey: string; Icon: any; circleBg: string }> = {
  food:    { bg: 'rgba(197,123,94,0.12)',  border: 'rgba(197,123,94,0.40)', color: '#C57B5E', labelKey: 'type_food_label',    Icon: Utensils,    circleBg: 'rgba(197,123,94,0.22)' },
  chill:   { bg: 'rgba(138,156,118,0.12)', border: 'rgba(138,156,118,0.40)', color: '#8A9C76', labelKey: 'type_chill_label',   Icon: Leaf,        circleBg: 'rgba(138,156,118,0.22)' },
  culture: { bg: 'rgba(123,149,176,0.12)', border: 'rgba(123,149,176,0.40)', color: '#7B95B0', labelKey: 'type_culture_label', Icon: Palette,     circleBg: 'rgba(123,149,176,0.22)' },
  view:    { bg: 'rgba(214,188,130,0.12)', border: 'rgba(214,188,130,0.40)', color: '#D6BC82', labelKey: 'type_view_label',    Icon: Mountain,    circleBg: 'rgba(214,188,130,0.22)' },
  social:  { bg: 'rgba(155,125,154,0.12)', border: 'rgba(155,125,154,0.40)', color: '#9B7D9A', labelKey: 'type_social_label',  Icon: GlassWater,  circleBg: 'rgba(155,125,154,0.22)' },
  leisure: { bg: 'rgba(224,168,101,0.12)', border: 'rgba(224,168,101,0.40)', color: '#E0A865', labelKey: 'type_leisure_label', Icon: PartyPopper, circleBg: 'rgba(224,168,101,0.22)' },
  nature:  { bg: 'rgba(110,138,90,0.12)',  border: 'rgba(110,138,90,0.40)', color: '#6E8A5A', labelKey: 'type_nature_label',  Icon: TreePine,    circleBg: 'rgba(110,138,90,0.22)' },
};

const PRICE_LABELS: Record<string, string> = { free: 'Gratuit', low: '€', mid: '€€', high: '€€€' };
const RATING_MIN_VOTES = 200;

function formatDayLabel(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(lang, {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function getPriceLabel(budget: BudgetType[]): string {
  if (!budget?.length) return '';
  return PRICE_LABELS[budget[budget.length - 1]] || '';
}

function RatingBadge({ score, votes }: { score: number; votes?: number }) {
  if (!votes || votes < RATING_MIN_VOTES) return null;
  const stars = Math.min(5, Math.max(0, Math.round(score)));
  return (
    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span>
        <span style={{ color: '#D4A843' }}>{'★'.repeat(stars)}</span>
        <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - stars)}</span>
      </span>
      <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{score.toFixed(1)}</span>
      <span>({votes})</span>
    </span>
  );
}

function VideoLink({ url, t }: { url: string; t: (k: string) => string }) {
  const v = isValidVideoUrl(url);
  if (!v.valid) return null;
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: '#0A0A0F', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-body)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
    >
      <Play size={11} /> {t('result_see_on')} {v.platform} <ExternalLink size={10} />
    </button>
  );
}

// ─────────────────────────────────────────────
// STEP CARD
// ─────────────────────────────────────────────
interface StepCardProps {
  step: PlanStep;
  index: number;
  isFirst?: boolean;
  isLast: boolean;
  onDurationChange: (id: string, delta: number) => void;
  onReplace: (step: PlanStep) => void;
  photoCount: number;
  onOpenPhotos: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  onDrop?: (index: number) => void;
}

function PremiumPlaceholderCard({ step, t, onReplace, style }: { step: PlanStep; t: (k: string) => string; onReplace: (s: PlanStep) => void; style: any }) {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      <div style={{
        width: 22, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 8,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg)',
          border: `1.5px solid ${style.color}`,
          boxShadow: `0 0 14px ${style.color}55`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }} />
      </div>

      <div style={{
        flex: 1, minWidth: 0,
        background: 'var(--bg-soft)',
        border: '1px solid rgba(244,238,223,0.08)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 4,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10, gap: 12,
        }}>
          <span style={{
            fontFamily: 'var(--f-mono)', fontSize: 13,
            color: 'var(--text)', letterSpacing: '0.04em',
          }}>
            {(() => {
              const clean = (step.time || '').replace('h', ':');
              const [h, m] = clean.split(':').map(Number);
              const startMin = (h || 0) * 60 + (m || 0);
              const endMin = startMin + (step.dur || 60);
              const eh = Math.floor(endMin / 60) % 24;
              const em = endMin % 60;
              const endStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
              return `${clean} — ${endStr}`;
            })()}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 11px', borderRadius: 999,
            background: style.bg,
            border: `1px solid ${style.border}`,
            fontFamily: 'var(--f-body)',
            fontSize: 11, fontWeight: 600,
            color: style.color,
            flexShrink: 0,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: style.color,
            }} />
            {t(style.labelKey)}
          </span>
        </div>

        <p style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--accent)',
          margin: '0 0 6px',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Lock size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
          {t('premium_placeholder_desc')}
        </p>

        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: '0 0 14px',
        }}>
          {step.dur} {t('result_min_short')}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); toast.info(t('premium_unlock_soon')); }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 999,
              background: 'var(--grad-logo)',
              color: '#1A1208',
              border: 'none',
              fontFamily: 'var(--f-body)',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            {t('premium_unlock_btn')}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReplace(step); }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 999,
              background: 'transparent',
              border: '1px solid rgba(244,238,223,0.20)',
              color: 'var(--text)',
              fontFamily: 'var(--f-body)',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('premium_replace_free_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransportRow({ tr, t }: { tr: { icon: string; txt: string }; t: (k: string) => string }) {
  const lower = tr.icon || '';
  const TrIcon =
    lower.includes('🚶') || lower.includes('walk') ? '🚶' :
    lower.includes('🚇') || lower.includes('🚊') || lower.includes('train') ? '🚇' :
    lower.includes('🚌') ? '🚌' :
    lower.includes('🚗') ? '🚗' : '🚶';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      paddingLeft: 36, paddingTop: 12, paddingBottom: 12,
    }}>
      <span style={{ fontSize: 14, opacity: 0.7 }}>{TrIcon}</span>
      <span style={{
        fontFamily: 'var(--f-body)',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        {translateTransportText(tr.txt, t)}
      </span>
    </div>
  );
}

function StepCard({
  step, index, isFirst, isLast, onDurationChange, onReplace, photoCount, onOpenPhotos, t,
  draggable = false, isDragging = false, isDragOver = false,
  onDragStart, onDragOver, onDragEnd, onDrop,
}: StepCardProps & { t: (k: string) => string }) {
  const style = TYPE_STYLE[step.type] || TYPE_STYLE.chill;
  const [expanded, setExpanded] = useState(false);

  const longPressTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef(0);
  const [longPressed, setLongPressed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!draggable) return;
    touchStartYRef.current = e.touches[0].clientY;
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressed(true);
      onDragStart?.(index);
      if ('vibrate' in navigator) navigator.vibrate?.(20);
    }, 350);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggable) return;
    if (!longPressed && Math.abs(e.touches[0].clientY - touchStartYRef.current) > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }
    if (longPressed) {
      e.preventDefault();
      const t = e.touches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
      const card = el?.closest('[data-step-index]') as HTMLElement | null;
      if (card) {
        const idx = parseInt(card.dataset.stepIndex || '-1', 10);
        if (idx >= 0 && idx !== index) onDragOver?.(idx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressed) {
      onDrop?.(index);
      setLongPressed(false);
      onDragEnd?.();
    }
  };

  if (step.isPremiumPlaceholder) {
    return <PremiumPlaceholderCard step={step} t={t} onReplace={onReplace} style={style} />;
  }

  return (
    <>
      {step.tr && <TransportRow tr={step.tr} t={t} />}

      <div
        data-step-index={index}
        draggable={draggable}
        onDragStart={(e) => {
          if (!draggable) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(index));
          onDragStart?.(index);
        }}
        onDragOver={(e) => {
          if (!draggable) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOver?.(index);
        }}
        onDragEnd={() => onDragEnd?.()}
        onDrop={(e) => {
          if (!draggable) return;
          e.preventDefault();
          onDrop?.(index);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          display: 'flex', gap: 14, position: 'relative',
          opacity: isDragging ? 0.4 : 1,
          transform: isDragging ? 'scale(0.98)' : (longPressed ? 'scale(1.02)' : 'scale(1)'),
          transition: 'transform 180ms ease, opacity 180ms ease',
          touchAction: longPressed ? 'none' : 'pan-y',
          ...(isDragOver ? {
            borderTop: '2px solid var(--accent)',
            paddingTop: 8,
            marginTop: -10,
          } : {}),
        }}
      >
        <div style={{
          width: 22, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 8,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--bg)',
            border: `1.5px solid ${style.color}`,
            boxShadow: `0 0 14px ${style.color}55`,
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }} />
        </div>

        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: 1, minWidth: 0,
            background: 'var(--bg-soft)',
            border: `1px solid ${expanded ? 'var(--stroke-gold)' : 'var(--stroke-soft)'}`,
            borderRadius: 16,
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: expanded ? '0 0 30px rgba(212,168,67,0.10)' : 'none',
            marginBottom: 4,
            transition: 'all 200ms ease',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8, gap: 10,
          }}>
            <span style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 13,
              color: 'var(--text)',
              letterSpacing: '0.04em',
              fontWeight: 400,
            }}>
              {(step.time || '').replace('h', ':')} — {(step.endTime || '').replace('h', ':')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Badge appareil photo (visible même non-expanded) */}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPhotos(); }}
                aria-label={photoCount > 0 ? t('result_photo_count_aria').replace('{n}', String(photoCount)) : t('result_photo_add_aria')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: photoCount > 0 ? '4px 9px 4px 7px' : '4px',
                  height: 24,
                  borderRadius: 999,
                  background: photoCount > 0 ? 'rgba(214,188,130,0.10)' : 'transparent',
                  border: photoCount > 0
                    ? '1px solid rgba(214,188,130,0.40)'
                    : '1px solid rgba(244,238,223,0.15)',
                  color: photoCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--f-mono)',
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.02em',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transition: 'all 180ms ease',
                }}
              >
                <Camera size={12} strokeWidth={2} />
                {photoCount > 0 && photoCount}
              </button>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 11px', borderRadius: 999,
                background: style.bg,
                border: `1px solid ${style.border}`,
                fontFamily: 'var(--f-body)',
                fontSize: 11, fontWeight: 600,
                color: style.color,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: style.color,
                }} />
                {t(style.labelKey)}
              </span>
            </div>
          </div>

          <h3 style={{
            fontFamily: 'var(--f-body)',
            fontSize: 22, fontWeight: 600,
            color: 'var(--text)',
            margin: '0 0 6px',
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
          }}>
            {step.name}
          </h3>

          <p style={{
            fontFamily: 'var(--f-body)',
            fontSize: 14,
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            {step.dur} {t('result_min_short')}
          </p>

          {expanded && (
            <div style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(244,238,223,0.08)',
            }}>
              {step.desc && (
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  margin: '0 0 14px',
                }}>
                  {step.desc}
                </p>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.08)',
                borderRadius: 12,
                marginBottom: 10,
              }}>
                <Clock3 size={13} color="var(--text-muted)" strokeWidth={1.8} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                  {t('result_duration')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDurationChange(step.id, -15); }}
                  disabled={step.dur <= 15}
                  style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'rgba(244,238,223,0.06)',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: step.dur > 15 ? 'pointer' : 'not-allowed',
                    opacity: step.dur <= 15 ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Minus size={12} />
                </button>
                <span style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 13,
                  color: 'var(--text)',
                  minWidth: 52, textAlign: 'center',
                }}>
                  {step.dur} {t('result_min_short')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDurationChange(step.id, 15); }}
                  style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'rgba(244,238,223,0.06)',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {step.booking_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(step.booking_url, '_blank'); }}
                    style={{
                      flex: 1, minWidth: 110,
                      padding: '10px 12px', borderRadius: 999,
                      background: `${style.bg}`,
                      border: `1px solid ${style.border}`,
                      color: style.color,
                      fontFamily: 'var(--f-body)',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                  >
                    <Calendar size={12} strokeWidth={2} />
                    {t('result_reserve')}
                  </button>
                )}
                {step.website_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(step.website_url, '_blank'); }}
                    style={{
                      flex: 1, minWidth: 110,
                      padding: '10px 12px', borderRadius: 999,
                      background: 'var(--bg-soft-strong)',
                      border: '1px solid rgba(244,238,223,0.12)',
                      color: 'var(--text)',
                      fontFamily: 'var(--f-body)',
                      fontSize: 12, fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                  >
                    <ExternalLink size={11} strokeWidth={2} />
                    {t('result_see_site')}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onReplace(step); }}
                  style={{
                    flex: 1, minWidth: 110,
                    padding: '10px 12px', borderRadius: 999,
                    background: 'transparent',
                    border: '1px solid rgba(244,238,223,0.12)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--f-body)',
                    fontSize: 12, fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <RefreshCw size={11} strokeWidth={2} />
                  {t('result_replace')}
                </button>
              </div>

              {step.vid && <VideoLink url={step.vid} t={t} />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DAY SECTION
// ─────────────────────────────────────────────
function DaySection({ day, dayIndex, isPremium, onDurationChange, onReplace, onReorder, onAddStep, onTitleChange, stepPhotoCounts, onOpenStepPhotos, t, lang }: {
  day: DayPlan;
  dayIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  isPremium: boolean;
  onDurationChange: (id: string, delta: number) => void;
  onReplace: (step: PlanStep) => void;
  onReorder: (dayIndex: number, fromIdx: number, toIdx: number) => void;
  onAddStep: (dayIndex: number) => void;
  onTitleChange: (dayIndex: number, newTitle: string) => void;
  stepPhotoCounts: Record<string, number>;
  onOpenStepPhotos: (stepId: string, stepName: string, dayIndex: number) => void;
  t: (k: string) => string;
  lang: string;
}) {
  // ── Édition du titre ──
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Calcule le titre affiché (même logique que TripCard de HomeScreen)
  const displayedTitle = (() => {
    const rawTitle = day.title || '';
    if (!rawTitle) return '';

    // Cas 1 : préfixe explicite "day_title_XXX" → on traduit
    if (rawTitle.startsWith('day_title_')) {
      const tr = t(rawTitle);
      return tr && tr !== rawTitle ? tr : rawTitle.replace(/^day_title_/, '');
    }

    // Cas 2 : mood tag mono-mot (ex: "romantique") → on tente la clé i18n
    const key = `day_title_${rawTitle}`;
    const tr = t(key);
    if (tr && tr !== key) return tr;

    // Cas 3 : titre custom édité par l'user (phrase ou >12 caractères) → tel quel
    if (rawTitle.includes(' ') || rawTitle.length > 12) return rawTitle;

    // Cas 4 : mono-mot inconnu → fallback
    return `${t('result_a_day')} ${rawTitle}`;
  })();

  const startEdit = () => {
    setTitleDraft(displayedTitle);
    setEditingTitle(true);
  };

  const commitEdit = () => {
    const cleaned = titleDraft.trim();
    if (cleaned && cleaned !== displayedTitle) {
      onTitleChange(dayIndex, cleaned);
    }
    setEditingTitle(false);
  };

  const cancelEdit = () => {
    setEditingTitle(false);
    setTitleDraft('');
  };
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const totalKm = day.steps.reduce((s, step) => {
    if (!step.tr) return s;
    const km = parseFloat(step.tr.txt.match(/(\d+(?:\.\d+)?)\s*km/i)?.[1] || '0');
    return s + km;
  }, 0);

  const gmapsUrl = buildGoogleMapsUrl(day.steps);

  return (
    <div style={{ paddingTop: 4 }}>
      {editingTitle ? (
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <input
            autoFocus
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            }}
            maxLength={60}
            style={{
              width: '100%',
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic',
              fontSize: 42,
              fontWeight: 400,
              color: 'var(--text)',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--accent)',
              outline: 'none',
              padding: '2px 0 6px',
              caretColor: 'var(--accent)',
            }}
          />
          <p style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            margin: '4px 0 0',
            textTransform: 'uppercase',
          }}>
            {t('result_title_edit_hint')}
          </p>
        </div>
      ) : (
        <h1
          onClick={startEdit}
          style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontSize: 42,
            fontWeight: 400,
            color: 'var(--text)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            margin: '0 0 16px',
            cursor: 'text',
            position: 'relative',
            transition: 'opacity 180ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          title={t('result_title_edit_help')}
        >
          {(() => {
            const words = displayedTitle.split(' ');
            if (words.length >= 2) {
              return (
                <>
                  {words[0]}{' '}
                  <span style={{ color: 'var(--accent)' }}>{words.slice(1).join(' ')}</span>
                </>
              );
            }
            return displayedTitle;
          })()}
        </h1>
      )}

      {day.date && (
  <p style={{
    fontFamily: 'var(--f-mono)',
    fontSize: 12,
    color: 'var(--accent)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    margin: '0 0 6px',
  }}>
    {formatDayLabel(day.date, lang)}
  </p>
)}

<p style={{
  fontFamily: 'var(--f-mono)',
  fontSize: 13,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  margin: '0 0 24px',
}}>
  {(day.startTime || '').replace(':', ':')} → {(day.endTime || '').replace(':', ':')}
  {' · '}
  {day.count} {t('result_steps')}
  {totalKm > 0 && <> {' · '} ~{totalKm.toFixed(0)} km</>}
</p>

      <div style={{ marginBottom: 14 }}>
        <DayMap steps={day.steps} city="" />
      </div>

      {gmapsUrl && (
        <button
          onClick={() => window.open(gmapsUrl, '_blank')}
          style={{
            width: '100%',
            padding: '14px 18px',
            marginBottom: 28,
            background: 'var(--grad-logo)',
            color: '#1A1208',
            border: 'none',
            borderRadius: 999,
            fontFamily: 'var(--f-body)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 24px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
            letterSpacing: '-0.005em',
          }}
        >
          <ExternalLink size={15} strokeWidth={2.2} />
          {t('result_open_gmaps')}
        </button>
      )}

      <div style={{ position: 'relative' }}>
        {day.steps.length > 1 && (
          <div style={{
            position: 'absolute',
            left: 11, top: 18, bottom: 18,
            width: 1,
            borderLeft: '1px dashed rgba(214,188,130,0.30)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        {day.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            isFirst={i === 0}
            isLast={i === day.steps.length - 1}
            onDurationChange={onDurationChange}
            onReplace={onReplace}
            photoCount={stepPhotoCounts[step.id] || 0}
            onOpenPhotos={() => onOpenStepPhotos(step.id, step.name, dayIndex)}
            t={t}
            draggable={isPremium && !step.isPremiumPlaceholder}
            isDragging={draggingIdx === i}
            isDragOver={dragOverIdx === i && draggingIdx !== null && draggingIdx !== i}
            onDragStart={(idx) => setDraggingIdx(idx)}
            onDragOver={(idx) => setDragOverIdx(idx)}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
            onDrop={(targetIdx) => {
              if (draggingIdx !== null && draggingIdx !== targetIdx) {
                onReorder(dayIndex, draggingIdx, targetIdx);
              }
              setDraggingIdx(null);
              setDragOverIdx(null);
            }}
          />
        ))}
      </div>

      {isPremium && (
        <button
          onClick={() => onAddStep(dayIndex)}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '14px 18px',
            background: 'rgba(214,188,130,0.06)',
            border: '1.5px dashed rgba(214,188,130,0.35)',
            borderRadius: 14,
            color: 'var(--accent)',
            fontFamily: 'var(--f-body)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(214,188,130,0.12)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(214,188,130,0.06)';
            e.currentTarget.style.borderColor = 'rgba(214,188,130,0.35)';
          }}
        >
          <Plus size={16} strokeWidth={2.2} />
          {t('result_add_activity')}
        </button>
      )}

      {(day as any)._engineSource && typeof window !== 'undefined' && window.location.search.includes('debug=1') && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', opacity: 0.7 }}>
          <EngineBadge
            source={(day as any)._engineSource}
            provider={(day as any)._provider}
            cached={(day as any)._cached}
            autoFixed={(day as any)._autoFixed}
            retried={(day as any)._retried}
          />
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
  onFeedback: (f: 'like' | 'dislike') => void;
  onReset: () => void;
  onShowReview?: () => void;
  mode?: 'generated' | 'view';
  tripId?: string;
  onUpdate?: (updatedPlan: MultiDayPlan) => Promise<void>;
}

export default function ResultScreen({ plan, feedback, onFeedback, onReset, mode = 'generated', tripId, onUpdate }: Props) {
  const { toast } = useToast();
  const { t, lang } = useLang();
  const [openDay, setOpenDay] = useState(0);
  const [replaceTarget, setReplaceTarget] = useState<PlanStep | null>(null);
  const [showAgenda, setShowAgenda] = useState(false);
  const [localPlan, setLocalPlan] = useState<MultiDayPlan>(plan);

  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [showQuotaReached, setShowQuotaReached] = useState(false);
  const tripKey = localPlan.city + (localPlan.days?.[0]?.date || '');
  const [showPdfLocked, setShowPdfLocked] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [addTargetDay, setAddTargetDay] = useState<number | null>(null);
  // ── Tous les voyages de l'user (chargés à l'ouverture de l'agenda) ──
  const [allPlans, setAllPlans] = useState<any[]>([]);
  // ── Map { stepId: nbPhotos } pour afficher le badge sur chaque step ──
  const [stepPhotoCounts, setStepPhotoCounts] = useState<Record<string, number>>({});
  // ── Step actuellement ouvert dans le modal photos ──
  const [photoStep, setPhotoStep] = useState<{ stepId: string; stepName: string; dayIndex: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium === true));
  }, [user]);

  // ── Charger tous les voyages quand on ouvre l'agenda ──
  // Sinon les vues semaine/mois n'afficheraient que le voyage courant
  useEffect(() => {
    if (!showAgenda || !user) return;
    getSavedPlans()
      .then((data) => setAllPlans(data || []))
      .catch(() => setAllPlans([]));
  }, [showAgenda, user]);

  // ── Helper pur : recalcule les horaires en cascade pour une liste de steps ──
  const recalcDaySteps = useCallback((steps: PlanStep[], dayStartTime: string): PlanStep[] => {
    const [sh, sm] = (dayStartTime || '10:00').split(':').map(Number);
    let cur = sh * 60 + sm;
    return steps.map((s, i) => {
      const h = Math.floor(cur / 60) % 24;
      const m = cur % 60;
      const timeStr = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
      const endMins = cur + s.dur;
      const eh = Math.floor(endMins / 60) % 24;
      const em = endMins % 60;
      const endStr = `${String(eh).padStart(2, '0')}h${String(em).padStart(2, '0')}`;
      const trMin = s.tr ? parseInt(s.tr.txt.match(/\d+/)?.[0] || '0') : 0;
      cur = endMins + (i < steps.length - 1 ? trMin : 0);
      return { ...s, time: timeStr, endTime: endStr };
    });
  }, []);

  // ── Modifier durée + recalcul horaires ──
  const handleDurationChange = useCallback((stepId: string, delta: number) => {
    setIsDirty(true);
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map(day => {
        const idx = day.steps.findIndex(s => s.id === stepId);
        if (idx === -1) return day;
        const newSteps = [...day.steps];
        newSteps[idx] = { ...newSteps[idx], dur: Math.max(15, newSteps[idx].dur + delta) };
        const recalc = recalcDaySteps(newSteps, day.startTime || '10:00');
        return { ...day, steps: recalc, endTime: recalc[recalc.length - 1]?.endTime || day.endTime };
      }),
    }));
  }, [recalcDaySteps]);

  // ── Remplacer un lieu (gère aussi le placeholder Premium → lieu gratuit) ──
  const handleReplaceConfirm = useCallback((newPlace: any) => {
    setIsDirty(true);
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
          // 🔑 CRITIQUE : retirer le flag placeholder pour basculer en card normale
          isPremiumPlaceholder: false,
          // Nettoyer les champs hérités du placeholder
          booking_url: newPlace.booking_url || undefined,
          website_url: newPlace.website_url || undefined,
          vid: newPlace.video_url || undefined,
        };
        const recalc = recalcDaySteps(newSteps, day.startTime || '10:00');
        return {
          ...day,
          steps: recalc,
          endTime: recalc[recalc.length - 1]?.endTime || day.endTime,
        };
      }),
    }));
    incrementReplacementCount(tripKey);
    setReplaceTarget(null);
  }, [replaceTarget, recalcDaySteps, tripKey]);

  // ── Réordonner les steps d'un jour (drag and drop) ──
  const handleReorder = useCallback((dayIndex: number, fromIdx: number, toIdx: number) => {
    setIsDirty(true);
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map((day, di) => {
        if (di !== dayIndex) return day;
        const newSteps = [...day.steps];
        if (fromIdx < 0 || fromIdx >= newSteps.length || toIdx < 0 || toIdx >= newSteps.length) return day;
        if (newSteps[fromIdx].isPremiumPlaceholder) return day;
        const [moved] = newSteps.splice(fromIdx, 1);
        newSteps.splice(toIdx, 0, moved);
        const cleaned = newSteps.map((s, i) => ({ ...s, tr: i === 0 ? null : s.tr }));
        const recalc = recalcDaySteps(cleaned, day.startTime || '10:00');
        return { ...day, steps: recalc, endTime: recalc[recalc.length - 1]?.endTime || day.endTime };
      }),
    }));
  }, [recalcDaySteps]);

  // ── Ajouter un step à la fin d'un jour ──
  const handleAddStep = useCallback((dayIndex: number) => {
    setAddTargetDay(dayIndex);
  }, []);

  const handleAddConfirm = useCallback((newPlace: any) => {
    setIsDirty(true);
    if (addTargetDay === null) return;
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map((day, di) => {
        if (di !== addTargetDay) return day;
        const lastStep = day.steps[day.steps.length - 1];
        const newStep: PlanStep = {
          id: String(newPlace.id),
          name: newPlace.name,
          desc: newPlace.description || '',
          type: newPlace.type || 'chill',
          subType: newPlace.subType,
          lat: newPlace.lat || 0,
          lng: newPlace.lng || 0,
          budget: ['low'],
          tags: [],
          dur: newPlace.dur || 60,
          ver: newPlace.discovery_level === 'lieux connus',
          score: newPlace.rating_average || 3.5,
          votes: newPlace.review_count || 0,
          time: '',
          endTime: '',
          km: 0,
          tr: lastStep ? { icon: '🚇', txt: 'Métro · 10 min' } : null,
        } as PlanStep;
        const newSteps = [...day.steps, newStep];
        const recalc = recalcDaySteps(newSteps, day.startTime || '10:00');
        return {
          ...day,
          steps: recalc,
          count: recalc.length,
          endTime: recalc[recalc.length - 1]?.endTime || day.endTime,
        };
      }),
    }));
    setAddTargetDay(null);
  }, [addTargetDay, recalcDaySteps]);

  // ── Éditer le titre d'une journée ──
  const handleTitleChange = useCallback((dayIndex: number, newTitle: string) => {
    setIsDirty(true);
    setLocalPlan(prev => ({
      ...prev,
      days: prev.days.map((day, di) => {
        if (di !== dayIndex) return day;
        return { ...day, title: newTitle };
      }),
    }));
  }, []);

  // ── Charger les counts photos par step ──
  useEffect(() => {
    if (!tripId) return;
    getStepPhotoCounts(tripId).then(setStepPhotoCounts).catch(() => {});
  }, [tripId]);

  // Helper exposé aux StepCard pour rafraîchir le count après upload/delete
  const refreshStepPhotoCount = useCallback((stepId: string, newCount: number) => {
    setStepPhotoCounts(prev => ({ ...prev, [stepId]: newCount }));
  }, []);

  // ── Vue Agenda : affiche le voyage courant + tous les autres voyages actifs ──
  if (showAgenda) {
    const nowDate = new Date();
    const isPlanPast = (p: any): boolean => {
      const data = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data;
      const lastDay = data?.days?.[data.days.length - 1];
      if (!lastDay?.date) return false;
      const endTime = (lastDay.endTime || '23:59').replace('h', ':');
      const [h, m] = endTime.split(':').map(Number);
      const endDateTime = new Date(lastDay.date + 'T00:00:00');
      endDateTime.setHours(h || 23, m || 59, 0, 0);
      return endDateTime < nowDate;
    };

    // Voyage courant en priorité (avec les modifs locales non sauvegardées)
    const currentKey = tripId || tripKey;
    const currentPlanEntry = {
      id: currentKey,
      city: localPlan.city,
      plan_data: localPlan,
    };
    // Autres voyages : exclure le doublon courant + exclure les passés
    const otherPlans = allPlans
      .filter(p => p.id !== currentKey)
      .filter(p => !isPlanPast(p));

    return (
      <PlanningCalendar
        plans={[currentPlanEntry, ...otherPlans]}
        onDayClick={() => {}}
        initialView="day"
        initialDate={localPlan.days[0]?.date}
        onClose={() => setShowAgenda(false)}
        title={localPlan.city}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader />

      {/* ── BARRE D'ACTIONS ── */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 30,
        }}>
          <button onClick={onReset} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text)',
            fontFamily: 'var(--f-body)',
            fontSize: 17, fontWeight: 500,
            padding: 0,
            letterSpacing: '-0.01em',
          }}>
            <ChevronLeft size={20} strokeWidth={1.8} />
            {t('back')}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowAgenda(true)}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--bg-soft-strong)',
                border: '1px solid rgba(244,238,223,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Map size={18} color="var(--text-muted)" strokeWidth={1.8} />
            </button>

            {tripId && (
              <button
                onClick={() => setShowShare(true)}
                aria-label={t('result_share_aria')}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--bg-soft-strong)',
                  border: '1px solid rgba(244,238,223,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <Share2 size={18} color="var(--text-muted)" strokeWidth={1.8} />
              </button>
            )}

            <button
              onClick={() => {
                if (isPremium) exportTripToPDF(localPlan, lang);
                else setShowPdfLocked(true);
              }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--bg-soft-strong)',
                border: '1px solid rgba(244,238,223,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Upload size={18} color="var(--text-muted)" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          marginBottom: 14,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 999,
            background: 'rgba(214,188,130,0.06)',
            border: '1px solid rgba(214,188,130,0.45)',
            color: 'var(--accent)',
            fontFamily: 'var(--f-body)',
            fontSize: 14, fontWeight: 600,
            flexShrink: 0,
          }}>
            <MapPin size={13} strokeWidth={2} />
            {localPlan.city}
          </span>

          {localPlan.days[0]?.date && localPlan.days.length === 1 && (
            <p style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.4,
            }}>
              {formatDayLabel(localPlan.days[0].date, lang)}
            </p>
          )}
        </div>
      </div>

      {/* ── Journées ── */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '8px 20px 130px' }}>
        {localPlan.days.map((day, i) => (
          <DaySection
            key={i}
            day={day}
            dayIndex={i}
            isPremium={isPremium}
            isOpen={true}
            onToggle={() => {}}
            onDurationChange={handleDurationChange}
            onReorder={handleReorder}
            onAddStep={handleAddStep}
            onTitleChange={handleTitleChange}
            onReplace={step => {
              if (!canReplace(tripKey, isPremium)) {
                setShowQuotaReached(true);
                return;
              }
              setReplaceTarget(step);
            }}
            stepPhotoCounts={stepPhotoCounts}
            onOpenStepPhotos={(stepId, stepName, dayIdx) => {
              if (!tripId) return;
              setPhotoStep({ stepId, stepName, dayIndex: dayIdx });
            }}
            t={t}
            lang={lang}
          />
        ))}

        {/* ── Galerie photos (uniquement pour voyages sauvegardés) ── */}
        {tripId && <TripPhotoGallery tripId={tripId} />}
      </div>
      {/* ── Footer "Mettre à jour" (mode view + modifs non sauvegardées) ── */}
      {mode === 'view' && isDirty && onUpdate && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          padding: '16px 20px 22px',
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
          zIndex: 40,
        }}>
          <button
            onClick={async () => {
              if (isSaving || justUpdated) return;
              setIsSaving(true);
              try {
                await onUpdate(localPlan);
                if ('vibrate' in navigator) navigator.vibrate?.([10, 30, 10]);
                setJustUpdated(true);
                setIsDirty(false);
                setTimeout(() => setJustUpdated(false), 2000);
              } catch (e) {
                toast.error(t('result_save_error'));
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || justUpdated}
            style={{
              width: '100%',
              padding: '16px 18px',
              borderRadius: 999,
              background: 'var(--grad-logo)',
              color: '#1A1208',
              border: 'none',
              fontFamily: 'var(--f-body)',
              fontSize: 15,
              fontWeight: 700,
              cursor: (isSaving || justUpdated) ? 'default' : 'pointer',
              letterSpacing: '-0.005em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 10px 28px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
              transition: 'all 200ms ease',
              transform: justUpdated ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            {isSaving ? (
              t('result_saving')
            ) : justUpdated ? (
              <>
                <Check size={16} color="#1A1208" strokeWidth={2.6} />
                {t('result_updated')}
              </>
            ) : (
              <>
                <Check size={16} color="#1A1208" strokeWidth={2.4} />
                {t('result_update')}
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Footer J'adore / Régénérer ── */}
      {mode === 'generated' && (() => {
        const lastDate = localPlan.days[localPlan.days.length - 1]?.date;
        const isPast = lastDate && new Date(lastDate + 'T23:59:59') < new Date();
        return !isPast;
      })() && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          padding: '16px 20px 22px',
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
          zIndex: 40,
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={() => setConfirmRegen(true)}
            style={{
              flex: 1,
              padding: '16px 18px',
              borderRadius: 999,
              background: 'var(--bg-soft-strong)',
              border: '1px solid rgba(244,238,223,0.12)',
              color: 'var(--text)',
              fontFamily: 'var(--f-body)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.005em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 200ms ease',
            }}
          >
            {t('result_regenerate')}
          </button>

          <button
            onClick={() => {
              if (justSaved) return;
              setJustSaved(true);
              if ('vibrate' in navigator) navigator.vibrate?.([10, 30, 10]);
              onFeedback('like');
              setTimeout(() => onReset(), 1200);
            }}
            disabled={justSaved}
            style={{
              flex: 1,
              padding: '16px 18px',
              borderRadius: 999,
              background: 'var(--grad-logo)',
              color: '#1A1208',
              border: 'none',
              fontFamily: 'var(--f-body)',
              fontSize: 15,
              fontWeight: 700,
              cursor: justSaved ? 'default' : 'pointer',
              letterSpacing: '-0.005em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 10px 28px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
              transition: 'all 200ms ease',
              transform: justSaved ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            {justSaved ? (
              <span
                key="saved"
                className="saved-pop"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={16} color="#1A1208" strokeWidth={2.6} />
                {t('result_saved')}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Heart size={16} color="#1A1208" strokeWidth={2.4} fill="#1A1208" />
                {t('result_love')}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {replaceTarget && (
        <ReplaceLieuModal
          step={replaceTarget}
          city={localPlan.city}
          onSelect={handleReplaceConfirm}
          onClose={() => setReplaceTarget(null)}
        />
      )}

      {addTargetDay !== null && (
        <ReplaceLieuModal
          step={{
            id: '__add_new__',
            name: '',
            type: 'chill',
            desc: '',
            lat: localPlan.days[addTargetDay]?.steps[0]?.lat || 0,
            lng: localPlan.days[addTargetDay]?.steps[0]?.lng || 0,
            budget: ['low'],
            tags: [],
            dur: 60,
            ver: false,
            score: 0,
            time: '', endTime: '', km: 0, tr: null,
          } as PlanStep}
          city={localPlan.city}
          onSelect={handleAddConfirm}
          onClose={() => setAddTargetDay(null)}
        />
      )}

      {confirmRegen && (
        <div
          onClick={() => setConfirmRegen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              border: '1px solid rgba(244,238,223,0.15)',
              borderRadius: 22, padding: 28, maxWidth: 360, width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔄</div>
            <h3 style={{
              color: 'var(--text)',
              fontFamily: 'var(--f-display)', fontStyle: 'italic',
              fontSize: 22, fontWeight: 400,
              margin: '0 0 10px',
              letterSpacing: '-0.01em',
            }}>
              {t('result_regen_confirm_title')}
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 14, lineHeight: 1.5,
              margin: '0 0 24px',
            }}>
              {t('result_regen_confirm_desc')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmRegen(false)}
                style={{
                  flex: 1, padding: 13, borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid rgba(244,238,223,0.15)',
                  color: 'var(--text)',
                  fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'rgba(244,238,223,0.10)',
                  touchAction: 'manipulation',
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmRegen(false);
                  if ('vibrate' in navigator) navigator.vibrate?.(15);
                  onFeedback('dislike');
                }}
                style={{
                  flex: 1, padding: 13, borderRadius: 999,
                  background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
                  border: 'none',
                  color: '#1A1208',
                  fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(212,168,67,0.30)',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                {t('result_regen_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuotaReached && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20,
        }}>
          <div style={{
            background: '#111', border: '1.5px solid #C9A961',
            borderRadius: 20, padding: 28, maxWidth: 360, width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
            <h3 style={{ color: '#C9A961', fontSize: 20, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--f-display)' }}>
              {t('replace_quota_title')}
            </h3>
            <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.5, marginBottom: 22 }}>
              {t('replace_quota_desc')}
            </p>
            <button
              onClick={() => { setShowQuotaReached(false); toast.info(t('premium_unlock_soon')); }}
              style={{
                width: '100%', padding: '14px', borderRadius: 30,
                background: '#C9A961', color: '#000', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
                fontFamily: 'var(--f-display)',
              }}
            >
              ⭐ {t('premium_upgrade')}
            </button>
            <button
              onClick={() => setShowQuotaReached(false)}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                color: '#888', border: 'none', fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--f-display)',
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showPdfLocked && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20,
        }}>
          <div style={{
            background: '#111', border: '1.5px solid #A855F7',
            borderRadius: 20, padding: 28, maxWidth: 360, width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #A855F7, #C9A961)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
            }}>
              🔒
            </div>
            <h3 style={{
              color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 10,
              fontFamily: 'var(--f-display)',
            }}>
              {t('pdf_premium_title')}
            </h3>
            <p style={{
              color: '#aaa', fontSize: 14, lineHeight: 1.5, marginBottom: 22,
              fontFamily: 'var(--f-display)',
            }}>
              {t('pdf_premium_desc')}
            </p>
            <button
              onClick={() => {
                setShowPdfLocked(false);
                toast.info(t('premium_unlock_soon'));
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: 30,
                background: 'linear-gradient(135deg, #A855F7, #C9A961)',
                color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
                fontFamily: 'var(--f-display)',
              }}
            >
              ⭐ {t('premium_upgrade')}
            </button>
            <button
              onClick={() => setShowPdfLocked(false)}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                color: '#888', border: 'none', fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--f-display)',
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showShare && tripId && (
        <ShareTripModal
          tripId={tripId}
          city={localPlan.city}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* ── Modal photos d'un step ── */}
      {photoStep && tripId && (
        <StepPhotoModal
          tripId={tripId}
          stepId={photoStep.stepId}
          stepName={photoStep.stepName}
          dayIndex={photoStep.dayIndex}
          onClose={() => setPhotoStep(null)}
          onCountChange={(n) => refreshStepPhotoCount(photoStep.stepId, n)}
        />
      )}
    </div>
  );
}