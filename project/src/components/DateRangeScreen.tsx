import { MapPin, Calendar, Clock4, ChevronLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import type { LangCode } from '../lib/i18n';
import { useRef, useState, useEffect } from 'react';
import AppHeader from './AppHeader';

interface Props {
  city: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  lang: LangCode;
  onChange: (startDate: string, endDate: string) => void;
  onTimeChange: (startTime: string, endTime: string) => void;
  onNext: () => void;
  onUGC: () => void;
  onCityModal: () => void;
  onBack: () => void;
}

const MAX_DAYS = 7;

const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE', pt: 'pt-PT',
};

function getDayCount(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return Math.max(diff, 0);
}

function formatDateBig(dateStr: string, locale: string): { day: string; rest: string } {
  if (!dateStr) return { day: '', rest: '' };
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  const weekday = d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '');
  const year = d.getFullYear();
  return { day, rest: `${weekday} · ${year}` };
}

// ─────────────────────────────────────────────
// DATE PICKER stylé
// ─────────────────────────────────────────────
function DatePickerLuxe({
  value, onChange, min, locale, placeholder,
}: { value: string; onChange: (v: string) => void; min: string; locale: string; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { day, rest } = formatDateBig(value, locale);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute', inset: 0, opacity: 0,
          cursor: 'pointer', width: '100%', height: '100%',
          WebkitAppearance: 'none', appearance: 'none',
        }}
      />
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        style={{
          padding: '14px 16px',
          background: 'rgba(244,238,223,0.02)',
          border: '1px solid rgba(214,188,130,0.25)',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: 78,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value ? (
            <>
              <span style={{
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontSize: 22,
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {day}
              </span>
              <span style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 9,
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}>
                {rest}
              </span>
            </>
          ) : (
            <span style={{
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--text-faint)',
            }}>
              {placeholder}
            </span>
          )}
        </div>
        <Calendar
          size={16}
          color="var(--accent)"
          strokeWidth={1.8}
          style={{ flexShrink: 0, opacity: 0.7 }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TIME PICKER stylé
// ─────────────────────────────────────────────
function TimePickerLuxe({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute', inset: 0, opacity: 0,
          cursor: 'pointer', width: '100%', height: '100%',
          WebkitAppearance: 'none', appearance: 'none',
        }}
      />
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        style={{
          padding: '14px 16px',
          background: 'rgba(244,238,223,0.02)',
          border: '1px solid rgba(214,188,130,0.25)',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          minHeight: 56,
        }}
      >
        <span style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 22,
          color: 'var(--accent)',
          letterSpacing: '-0.02em',
        }}>
          {value || '--:--'}
        </span>
        <Clock4 size={16} color="var(--accent)" strokeWidth={1.8} style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN PRINCIPAL
// ─────────────────────────────────────────────
export default function DateRangeScreen({
  city, startDate, endDate, startTime, endTime,
  onChange, onTimeChange, onNext, onCityModal, onBack,
}: Props) {
  const { t, lang } = useLang();
  const locale = LOCALE_MAP[lang] || 'en-GB';

  const dayCount = getDayCount(startDate, endDate);
  const isOverLimit = dayCount > MAX_DAYS;
  const isValid = !!(startDate && endDate && dayCount > 0 && !isOverLimit);

  const hourSpan = (() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  })();

  const [wasClamped, setWasClamped] = useState(false);
  useEffect(() => {
    if (!wasClamped) return;
    const id = setTimeout(() => setWasClamped(false), 5000);
    return () => clearTimeout(id);
  }, [wasClamped]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
    }}>

      <AppHeader subtitle={t('step_1')} />

      {/* ── PROGRESS BAR 4 segments ── */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 20px 18px', flexShrink: 0,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1,
            height: 3,
            background: i === 0 ? 'var(--accent)' : 'rgba(244,238,223,0.10)',
            borderRadius: 999,
            transition: 'background 300ms',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>

        {/* Retour + Destination pill */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24,
        }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
            fontFamily: 'var(--f-body)', fontSize: 15,
            padding: 0,
          }}>
            <ChevronLeft size={18} strokeWidth={1.8} />
            {t('back')}
          </button>

          <button onClick={onCityModal} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 999,
            background: 'rgba(214,188,130,0.06)',
            border: '1px solid rgba(214,188,130,0.45)',
            color: 'var(--accent)',
            fontFamily: 'var(--f-body)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <MapPin size={13} strokeWidth={2} />
            {city}
          </button>
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          margin: '0 0 14px',
        }}>
          {t('step_1')}
        </p>

        {/* Titre */}
        <h2 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 40,
          fontWeight: 400,
          color: 'var(--text)',
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
          margin: '0 0 16px',
        }}>
          {t('when')}{' '}
          <span style={{ color: 'var(--accent)' }}>{t('when_title_2')}</span>
        </h2>

        <p style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          margin: '0 0 28px',
        }}>
          {t('when_desc')}
        </p>

        {/* CARD PÉRIODE */}
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid rgba(214,188,130,0.18)',
          borderRadius: 20,
          padding: 18,
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
              border: '1px solid rgba(212,168,67,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Calendar size={20} color="var(--accent)" strokeWidth={1.8} />
            </div>
            <p style={{
              fontSize: 18, fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {t('travel_period')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <label style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                {t('arrival')}
              </label>
              <DatePickerLuxe
                value={startDate}
                onChange={val => onChange(val, endDate && val > endDate ? val : endDate)}
                min={new Date().toISOString().split('T')[0]}
                locale={locale}
                placeholder={t('date_placeholder')}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                {t('departure')}
              </label>
              <DatePickerLuxe
                value={endDate}
                onChange={val => {
                  if (startDate && val) {
                    const start = new Date(startDate);
                    const end = new Date(val);
                    const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
                    if (diff > MAX_DAYS) {
                      const maxDate = new Date(start);
                      maxDate.setDate(maxDate.getDate() + MAX_DAYS - 1);
                      onChange(startDate, maxDate.toISOString().split('T')[0]);
                      setWasClamped(true);
                      return;
                    }
                  }
                  onChange(startDate, val);
                }}
                min={startDate || new Date().toISOString().split('T')[0]}
                locale={locale}
                placeholder={t('date_placeholder')}
              />
            </div>
          </div>

          {isValid && (
            <div style={{
              background: 'rgba(214,188,130,0.05)',
              border: '1px solid rgba(214,188,130,0.15)',
              borderRadius: 12,
              padding: '12px 14px',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent)' }}>{dayCount}</strong>{' '}
                {dayCount > 1 ? t('days') : t('day_count')}{t('day_count_desc')}
              </span>
            </div>
          )}
          {isOverLimit && (
            <div style={{
              background: 'rgba(197,123,94,0.10)',
              border: '1px solid rgba(197,123,94,0.40)',
              borderRadius: 12,
              padding: '12px 14px',
              marginTop: 8,
            }}>
              <span style={{ fontSize: 13, color: '#E0A37A', lineHeight: 1.5 }}>
                ⚠ {t('max_days_warning')}
              </span>
            </div>
          )}
          {wasClamped && (
            <div style={{
              background: 'rgba(123,149,176,0.10)',
              border: '1px solid rgba(123,149,176,0.40)',
              borderRadius: 12,
              padding: '12px 14px',
              marginTop: 8,
            }}>
              <span style={{ fontSize: 13, color: '#9DB4CC', lineHeight: 1.5 }}>
                ℹ {t('max_days_warning')}
              </span>
            </div>
          )}
        </div>

        {/* CARD HORAIRES */}
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid rgba(214,188,130,0.18)',
          borderRadius: 20,
          padding: 18,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
              border: '1px solid rgba(212,168,67,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Clock4 size={20} color="var(--accent)" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 18, fontWeight: 600,
                color: 'var(--text)',
                margin: 0, letterSpacing: '-0.01em',
              }}>
                {t('schedule')}
              </p>
              <p style={{
                fontSize: 13, color: 'var(--text-muted)',
                margin: '3px 0 0', lineHeight: 1.4,
              }}>
                {t('schedule_desc')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <label style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                {t('start')}
              </label>
              <TimePickerLuxe
                value={startTime}
                onChange={v => onTimeChange(v, endTime)}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                {t('end')}
              </label>
              <TimePickerLuxe
                value={endTime}
                onChange={v => onTimeChange(startTime, v)}
              />
            </div>
          </div>

          {startTime && endTime && (
            <div style={{
              background: 'rgba(214,188,130,0.05)',
              border: '1px solid rgba(214,188,130,0.15)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Sparkles size={14} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent)' }}>{Math.round(hourSpan)}{t('schedule_hours_short')}</strong>{' '}
                {t('schedule_fill')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: isValid ? 'var(--grad-logo)' : 'rgba(244,238,223,0.06)',
            color: isValid ? '#1A1208' : 'var(--text-faint)',
            border: 'none',
            borderRadius: 999,
            fontFamily: 'var(--f-body)',
            fontSize: 17, fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            boxShadow: isValid ? '0 10px 32px rgba(212,168,67,0.28), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            letterSpacing: '-0.005em',
            transition: 'all 200ms ease',
          }}
        >
          {t('continue')}
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}