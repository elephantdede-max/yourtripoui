import { ChevronLeft, Sparkles, Plus } from 'lucide-react';
import type { DayConfig } from '../types';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

const SUGGESTION_KEYS = [
  'mood_hidden',
  'mood_panoramic',
  'mood_quiet',
  'mood_sunset',
  'mood_photos',
  'mood_surprise',
];

interface Props {
  dayConfig: DayConfig;
  dayLabel: string;
  isLastDay: boolean;
  lang: LangCode;
  onChange: (mood: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  mode?: 'tastes' | 'surprise' | 'custom';
  nbDays?: number;
}

export default function MoodScreen({
  dayConfig, dayLabel, isLastDay,
  onChange, onNext, onSkip, onBack,
  mode = 'custom', nbDays = 1,
}: Props) {
  const { t } = useLang();
  const isGlobal = mode !== 'custom';
  const canGenerate = dayConfig.mood.trim().length === 0 || dayConfig.mood.trim().length >= 3;
  const charCount = dayConfig.mood.length;

  const addSuggestion = (text: string) => {
    const current = dayConfig.mood.trim();
    const lower = text.toLowerCase();
    if (current.toLowerCase().includes(lower)) return;
    onChange(current ? `${current}, ${lower}` : lower);
  };

  let contextLabel = dayLabel;
  if (isGlobal) {
    contextLabel = nbDays > 1
      ? t('mood_your_trip_days').replace('{n}', String(nbDays))
      : t('mood_your_trip');
  }

  const progressActiveIdx = 2;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
      paddingBottom: 130,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 12px',
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text)',
          fontFamily: 'var(--f-body)',
          fontSize: 15, fontWeight: 500,
          padding: 0,
        }}>
          <ChevronLeft size={18} strokeWidth={1.8} />
          {t('back')}
        </button>
        <span style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: '0.30em', textTransform: 'uppercase',
        }}>
          {t('mood_eyebrow')}
        </span>
      </div>

      {/* ── Barre progression ── */}
      <div style={{ padding: '0 20px 4px', display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= progressActiveIdx ? 'var(--accent)' : 'var(--stroke-soft)',
            opacity: i < progressActiveIdx ? 0.6 : 1,
          }} />
        ))}
      </div>

      {/* ── Pill contexte ── */}
      <div style={{ padding: '22px 20px 0' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '8px 16px', borderRadius: 999,
          background: 'rgba(214,188,130,0.10)',
          border: '1px solid var(--stroke-gold)',
          color: 'var(--accent)',
          fontFamily: 'var(--f-body)',
          fontSize: 14, fontWeight: 600,
        }}>
          <Sparkles size={13} strokeWidth={2} />
          {contextLabel}
        </span>
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, padding: '24px 20px 0' }}>

        {/* Titre */}
        <h1 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 48, fontWeight: 400,
          color: 'var(--text)',
          letterSpacing: '-0.025em',
          lineHeight: 1.02,
          margin: '0 0 12px',
        }}>
          {t('mood_title_1')}{' '}
          <span style={{ color: 'var(--accent)' }}>{t('mood_title_2')}</span>
        </h1>

        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: 15, color: 'var(--text-muted)',
          lineHeight: 1.5,
          margin: '0 0 28px',
          maxWidth: 340,
        }}>
          {t('mood_desc')}
        </p>

        {/* ── BLOC 1 : TON MOOD ── */}
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: 20,
          padding: '20px 20px 16px',
          marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14,
          }}>
            <span style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10, color: 'var(--text-muted)',
              letterSpacing: '0.30em', textTransform: 'uppercase',
            }}>
              {t('mood_your_label')}
            </span>
            <div style={{
              flex: 1, height: 1,
              background: 'var(--stroke-soft)',
            }} />
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={dayConfig.mood}
              onChange={e => onChange(e.target.value)}
              rows={5}
              placeholder={t('mood_placeholder')}
              maxLength={500}
              style={{
                width: '100%',
                padding: '14px 16px 38px',
                background: 'var(--bg)',
                border: `1px solid ${charCount > 0 ? 'var(--stroke-gold)' : 'var(--stroke-soft)'}`,
                borderRadius: 14,
                color: 'var(--text)',
                fontFamily: 'var(--f-body)',
                fontSize: 16,
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 200ms ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--stroke-gold)'; }}
              onBlur={e => {
                e.currentTarget.style.borderColor = charCount > 0
                  ? 'var(--stroke-gold)'
                  : 'var(--stroke-soft)';
              }}
            />
            <div style={{
              position: 'absolute', bottom: 12, right: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 36, height: 3, borderRadius: 2,
                background: 'var(--stroke-soft)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(charCount / 500) * 100}%`,
                  height: '100%',
                  background: charCount > 400 ? '#E07070' : 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 150ms ease',
                }} />
              </div>
              <span style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10, color: 'var(--text-faint)',
                letterSpacing: '0.08em',
              }}>
                {charCount} / 500
              </span>
            </div>
          </div>
        </div>

        {/* ── SÉPARATEUR ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 0 14px',
          padding: '0 2px',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--stroke-soft)' }} />
          <span style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 10, color: 'var(--text-faint)',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {t('mood_or_inspiration')}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--stroke-soft)' }} />
        </div>

        {/* ── BLOC 2 : INSPIRATIONS ── */}
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: 20,
          padding: '20px 20px 18px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10, color: 'var(--text-muted)',
              letterSpacing: '0.30em', textTransform: 'uppercase',
            }}>
              {t('mood_inspirations')}
            </span>
            <div style={{
              flex: 1, height: 1,
              background: 'var(--stroke-soft)',
            }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {SUGGESTION_KEYS.map(key => {
              const label = t(key);
              const isActive = dayConfig.mood.toLowerCase().includes(label.toLowerCase());
              return (
                <button
                  key={key}
                  onClick={() => addSuggestion(label)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '10px 16px', borderRadius: 999,
                    background: isActive
                      ? 'rgba(214,188,130,0.15)'
                      : 'var(--bg)',
                    border: isActive
                      ? '1px solid var(--stroke-gold)'
                      : '1px solid var(--stroke-soft)',
                    color: isActive ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'var(--f-body)',
                    fontSize: 14, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--stroke-gold)';
                      e.currentTarget.style.background = 'rgba(214,188,130,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--stroke-soft)';
                      e.currentTarget.style.background = 'var(--bg)';
                    }
                  }}
                >
                  <Plus
                    size={13}
                    strokeWidth={2}
                    color={isActive ? 'var(--accent)' : 'var(--accent)'}
                    style={{
                      transform: isActive ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 180ms ease',
                    }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Footer fixe ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        padding: '18px 20px 26px',
        background: 'linear-gradient(to top, var(--bg) 75%, transparent)',
        display: 'flex', alignItems: 'center', gap: 14,
        zIndex: 40,
      }}>
        <button
          onClick={onSkip}
          style={{
            flex: '0 0 auto',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
            fontFamily: 'var(--f-body)',
            fontSize: 14, fontWeight: 500,
            padding: '14px 6px',
            lineHeight: 1.2,
            textAlign: 'left',
          }}
        >
          {t('mood_skip_step_1')}<br />{t('mood_skip_step_2')}
        </button>

        <button
          onClick={onNext}
          disabled={!canGenerate}
          style={{
            flex: 1,
            padding: '18px 22px',
            borderRadius: 999,
            background: canGenerate ? 'var(--grad-logo)' : 'var(--bg-soft-strong)',
            border: canGenerate ? 'none' : '1px solid var(--stroke-soft)',
            color: canGenerate ? '#1A1208' : 'var(--text-faint)',
            fontFamily: 'var(--f-body)',
            fontSize: 16, fontWeight: 700,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.005em',
            boxShadow: canGenerate
              ? '0 12px 32px rgba(212,168,67,0.35), inset 0 1px 0 rgba(255,255,255,0.30)'
              : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 200ms ease',
          }}
        >
          <Sparkles size={16} strokeWidth={2.4} fill={canGenerate ? '#1A1208' : 'none'} />
          {isGlobal ? t('generate_trip') : (isLastDay ? t('generate_trip') : t('next_day'))}
        </button>
      </div>
    </div>
  );
}