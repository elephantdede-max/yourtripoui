import { MapPin, Calendar, Clock4 } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';
import { useRef, useState, useEffect, useCallback } from 'react';

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

const G = '#C9A961';
const BG = '#000000';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: BG,
  border: `1.5px solid ${G}`,
  borderRadius: 10,
  color: G,
  fontFamily: '"Inter", system-ui, sans-serif',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box' as const,
};


function DateInputWithPicker({
  value, onChange, min,
}: { value: string; onChange: (v: string) => void; min: string }) {
  const textRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');

  // Sync display quand la valeur ISO change depuis l'extérieur (calendrier)
  useEffect(() => {
    const display = value ? value.split('-').reverse().join('/') : '';
    setText(display);
  }, [value]);

  const handleText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Extraire les chiffres et reformater
    let digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length >= 5) formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
    else if (digits.length >= 3) formatted = `${digits.slice(0,2)}/${digits.slice(2)}`;

    setText(formatted);

    // Propager au parent quand le format est complet DD/MM/YYYY
    const m = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const iso = `${m[3]}-${m[2]}-${m[1]}`;
      onChange(iso);
    }

    // Restaurer la position du curseur
    requestAnimationFrame(() => {
      if (textRef.current) {
        let newPos = cursorPos;
        const oldDigits = raw.replace(/\D/g, '').length;
        if (digits.length >= 3 && oldDigits < 3) newPos += 1;
        if (digits.length >= 5 && oldDigits < 5) newPos += 1;
        newPos = Math.min(newPos, formatted.length);
        textRef.current.setSelectionRange(newPos, newPos);
      }
    });
  }, [onChange]);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {/* Champ texte visible — Saisie Manuelle sans bidi-override */}
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        placeholder="JJ/MM/AAAA"
        value={text}
        onChange={handleText}
        maxLength={10}
        style={{ ...inputStyle, paddingRight: 44 }}
      />

      {/* Conteneur du Calendrier (Combiné visuel + interactif) */}
      <div style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Design Or du bouton (Placé en dessous, insensible aux clics) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: `${G}22`, border: `1px solid ${G}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1, pointerEvents: 'none'
        }}>
          <Calendar size={16} color={G} />
        </div>

        {/* Input Date Natif (Placé au-dessus, invisible mais 100% cliquable) */}
        <input
          type="date"
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            zIndex: 2,
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}

function getDayCount(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return Math.max(diff, 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
}

export default function DateRangeScreen({ city, startDate, endDate, startTime, endTime, lang, onChange, onTimeChange, onNext, onCityModal, onBack }: Props) {
  const dayCount = getDayCount(startDate, endDate);
  const isValid = !!(startDate && endDate && dayCount > 0);
  const progressPct = 15;

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--f-logo)', fontSize: 28, color: G }}>Your Trip</span>
          <button onClick={onCityModal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
            <MapPin size={16} color={G} />
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: G }}>{city}</span>
          </button>
        </div>
        <div style={{ height: 3, background: '#333', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: G, borderRadius: 2, transition: 'width 400ms' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>

        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, paddingTop: 4 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>{t('back', lang)}</span>
        </button>

        <div style={{ display: 'inline-block', background: G, borderRadius: 20, padding: '6px 18px', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600, color: BG }}>{t('step_1', lang)}</span>
        </div>

        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700, color: G, marginBottom: 8, lineHeight: 1.2 }}>
          {t('when', lang)}<br />
          <span style={{ color: G, opacity: 0.75 }}>{t('when_title_2', lang)}</span>
        </h1>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: '#888', marginBottom: 28 }}>
          {t('when_desc', lang)}
        </p>

        <div style={{ border: `2px solid ${G}`, borderRadius: 14, padding: '18px 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color={G} />
            </div>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, color: G }}>{t('travel_period', lang)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: 'var(--f-display)', fontSize: 12, color: G, display: 'block', marginBottom: 6 }}>{t('arrival', lang)}</label>
              <DateInputWithPicker value={startDate} onChange={val => onChange(val, endDate && val > endDate ? val : endDate)} min={new Date().toISOString().split('T')[0]} />
              {startDate && <p style={{ fontSize: 11, color: G, opacity: 0.7, marginTop: 4 }}>{formatDate(startDate)}</p>}
            </div>
            <div>
              <label style={{ fontFamily: 'var(--f-display)', fontSize: 12, color: G, display: 'block', marginBottom: 6 }}>{t('departure', lang)}</label>
              <DateInputWithPicker value={endDate} onChange={val => onChange(startDate, val)} min={startDate || new Date().toISOString().split('T')[0]} />
              {endDate && <p style={{ fontSize: 11, color: G, opacity: 0.7, marginTop: 4 }}>{formatDate(endDate)}</p>}
            </div>
          </div>

          {isValid && (
            <div style={{ background: `${G}18`, border: `1px solid ${G}44`, borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>
                <strong>{dayCount}</strong> {t('day_count', lang)}{dayCount > 1 ? 's' : ''}{t('day_count_desc', lang)}
              </span>
            </div>
          )}
        </div>

        <div style={{ border: `2px solid ${G}`, borderRadius: 14, padding: '18px 16px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock4 size={18} color={G} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, color: G, display: 'block' }}>{t('schedule', lang)}</span>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 11, color: '#888' }}>{t('schedule_desc', lang)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: 'var(--f-display)', fontSize: 12, color: G, display: 'block', marginBottom: 6 }}>{t('start', lang)}</label>
              <input type="time" value={startTime} onChange={e => onTimeChange(e.target.value, endTime)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--f-display)', fontSize: 12, color: G, display: 'block', marginBottom: 6 }}>{t('end', lang)}</label>
              <input type="time" value={endTime} onChange={e => onTimeChange(startTime, e.target.value)} style={inputStyle} />
            </div>
          </div>

          {startTime && endTime && (
            <div style={{ background: `${G}18`, border: `1px solid ${G}44`, borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>
                {t('schedule_fill', lang)} {startTime} — {endTime}
              </span>
            </div>
          )}
        </div>

        <button onClick={onNext} disabled={!isValid} style={{
          width: '100%', padding: '18px', borderRadius: 40,
          background: isValid ? G : '#333',
          border: 'none', cursor: isValid ? 'pointer' : 'default',
          fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700,
          color: isValid ? BG : '#666',
          transition: 'background 200ms',
        }}>
          {t('continue', lang)}
        </button>
      </div>
    </div>
  );
}