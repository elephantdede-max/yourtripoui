import { ArrowLeft } from 'lucide-react';
import type { DayConfig } from '../types';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';
import Tooltip from './Tooltip';

const G = '#C9A961';
const BG = '#000000';

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
}

export default function MoodScreen({ dayConfig, dayLabel, isLastDay, lang, onChange, onNext, onSkip, onBack }: Props) {
  const canGenerate = dayConfig.mood.trim().length >= 3 || dayConfig.mood.trim().length === 0;

  const addSuggestion = (text: string) => {
    const current = dayConfig.mood.trim();
    onChange(current ? `${current}, ${text.toLowerCase()}` : text.toLowerCase());
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--f-logo)', fontSize: 28, color: G }}>Your Trip</span>
        <div style={{ height: 3, background: '#333', borderRadius: 2, overflow: 'hidden', margin: '10px 0 0' }}>
          <div style={{ height: '100%', width: '75%', background: G, borderRadius: 2 }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 32px' }}>

        {/* Back */}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <ArrowLeft size={16} color={G} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>{t('back', lang)}</span>
        </button>

        {/* Day badge */}
        <div style={{ background: G, borderRadius: 24, padding: '8px 20px', marginBottom: 20, display: 'inline-block' }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600, color: BG }}>{dayLabel}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
          <span style={{ color: '#888' }}>{t('mood_title_1', lang)}</span>
          <span style={{ color: G }}>{t('mood_title_2', lang)}</span>
        </h1>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: '#666', marginBottom: 24 }}>
          {t('mood_desc', lang)}
        </p>

        {/* Textarea */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 700, color: G }}>{t('mood', lang)}</span>
            <Tooltip title={t('tt_mood', lang)} description={t('tt_mood_desc', lang)} lang={lang} />
          </div>
          <textarea
            value={dayConfig.mood}
            onChange={e => onChange(e.target.value)}
            rows={4}
            placeholder={t('mood_placeholder', lang)}
            style={{
              width: '100%', padding: '14px 16px',
              border: `2px solid ${G}`, borderRadius: 12,
              background: BG, color: G,
              fontFamily: 'var(--f-display)', fontSize: 15,
              lineHeight: 1.6, resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
          {SUGGESTION_KEYS.map(key => (
            <button
              key={key}
              onClick={() => addSuggestion(t(key, lang))}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1.5px solid ${G}`, background: 'transparent',
                fontFamily: 'var(--f-display)', fontSize: 13, color: G, cursor: 'pointer',
              }}
            >
              {t(key, lang)}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          disabled={!canGenerate}
          style={{
            width: '100%', padding: '18px', borderRadius: 40,
            background: canGenerate ? G : '#333',
            border: 'none', cursor: canGenerate ? 'pointer' : 'default',
            fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700,
            color: canGenerate ? BG : '#666',
          }}
        >
          {isLastDay ? t('generate_trip', lang) : t('next_day', lang)}
        </button>
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '14px', marginTop: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-display)', fontSize: 15, color: '#666',
          }}
        >
          {t('skip', lang)}
        </button>
      </div>
    </div>
  );
}
