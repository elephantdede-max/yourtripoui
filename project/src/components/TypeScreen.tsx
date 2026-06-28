import { ArrowLeft } from 'lucide-react';
import type { ExperienceType, VibeType, BudgetType, DayConfig } from '../types';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';
import Tooltip from './Tooltip';
import { useThemeColors } from '../lib/theme-context';

const G = '#C9A961';
const BG = '#000000';

const EXPERIENCES: { value: ExperienceType; labelKey: string; emoji: string; color: string }[] = [
  { value: 'chill',       labelKey: 'exp_chill',       emoji: '☕', color: '#22D3EE' },
  { value: 'date',        labelKey: 'exp_date',        emoji: '🖤', color: '#EC4899' },
  { value: 'aventure',    labelKey: 'exp_aventure',    emoji: '🗺️', color: '#4ADE80' },
  { value: 'culturel',    labelKey: 'exp_culturel',    emoji: '🧠', color: '#8B5CF6' },
  { value: 'gastronomie', labelKey: 'exp_gastronomie', emoji: '🍴', color: '#F97316' },
  { value: 'nature',      labelKey: 'exp_nature',      emoji: '🌱', color: '#16A34A' },
  { value: 'amusement',   labelKey: 'exp_amusement',   emoji: '🎉', color: '#FBBF24' },
];

const BUDGETS: { value: BudgetType; labelKey: string; emoji: string }[] = [
  { value: 'free', labelKey: 'budget_econome',  emoji: '💚' },
  { value: 'low',  labelKey: 'budget_modere',   emoji: '€'  },
  { value: 'mid',  labelKey: 'budget_flexible', emoji: '💎' },
  { value: 'high', labelKey: 'budget_premium',  emoji: '👑' },
];

const VIBES: { value: VibeType; labelKey: string }[] = [
  { value: 'calme',      labelKey: 'vibe_calme'      },
  { value: 'romantique', labelKey: 'vibe_romantique' },
  { value: 'festif',     labelKey: 'vibe_festif'     },
  { value: 'solo',       labelKey: 'vibe_solo'       },
  { value: 'amis',       labelKey: 'vibe_amis'       },
];

interface Props {
  dayConfig: DayConfig;
  dayIndex: number;
  totalDays: number;
  dayLabel: string;
  lang: LangCode;
  onChange: (config: Partial<DayConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

const toggleType = (arr: ExperienceType[], value: ExperienceType) =>
  arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

const VIBE_EXCLUSIVE: VibeType[] = ['solo', 'amis'];

const toggleVibe = (arr: VibeType[], value: VibeType): VibeType[] => {
  if (arr.includes(value)) return arr.filter(v => v !== value);
  if (VIBE_EXCLUSIVE.includes(value)) {
    return [...arr.filter(v => !VIBE_EXCLUSIVE.includes(v)), value];
  }
  return [...arr, value];
};

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontSize: 15,
  fontWeight: 700,
  color: G,
};

export default function TypeScreen({ dayConfig, dayIndex, totalDays, dayLabel, onChange, onNext, onBack }: Props) {
  const { t, lang } = useLang();
  const canProceed = dayConfig.types.length > 0 && (dayConfig.vibes || []).length > 0 && dayConfig.budget;
  const progressPct = 50;
  const { accent } = useThemeColors();

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--f-logo)', fontSize: 28, color: accent }}>Your Trip</span>
        <div style={{ height: 3, background: '#333', borderRadius: 2, overflow: 'hidden', margin: '10px 0 0' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: G, borderRadius: 2, transition: 'width 400ms' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 32px' }}>

        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <ArrowLeft size={16} color={G} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>{t('back')}</span>
        </button>

        <div style={{ background: G, borderRadius: 24, padding: '8px 20px', marginBottom: 20, display: 'inline-block' }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600, color: BG }}>
            {dayLabel} {t('day')} {dayIndex + 1}/{totalDays}
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
          <span style={{ color: G }}>{t('tell_us')}</span>
          <span style={{ color: '#888' }}>{t('tell_us_2')}</span>
        </h1>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: '#666', marginBottom: 24 }}>
          {t('tell_us_desc')}
        </p>

        {/* Type d'expérience */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={sectionLabel}>{t('experience_type')}</span>
            <Tooltip title={t('tt_experience')} description={t('tt_experience_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {EXPERIENCES.map(exp => {
              const selected = dayConfig.types.includes(exp.value);
              return (
                <button
                  key={exp.value}
                  onClick={() => onChange({ types: toggleType(dayConfig.types, exp.value) })}
                  style={{
                    padding: '20px 12px', borderRadius: 14,
                    border: `2px solid ${G}`,
                    background: selected ? exp.color : BG,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'background 150ms',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{exp.emoji}</span>
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 700, color: selected ? BG : G }}>
                    {t(exp.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={sectionLabel}>{t('budget')}</span>
            <Tooltip title={t('tt_budget')} description={t('tt_budget_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BUDGETS.map(b => {
              const selected = dayConfig.budget === b.value;
              return (
                <button
                  key={b.value}
                  onClick={() => onChange({ budget: b.value })}
                  style={{
                    padding: '18px 12px', borderRadius: 14,
                    border: `2px solid ${G}`,
                    background: selected ? G : BG,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'background 150ms',
                  }}
                >
                  <span style={{ fontSize: 26, color: selected ? BG : G }}>{b.emoji}</span>
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 700, color: selected ? BG : G }}>
                    {t(b.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ambiance */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={sectionLabel}>{t('vibe')}</span>
            <Tooltip title={t('tt_vibe')} description={t('tt_vibe_desc')} lang={lang} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VIBES.map(v => {
              const selected = (dayConfig.vibes || []).includes(v.value);
              return (
                <button
                  key={v.value}
                  onClick={() => onChange({ vibes: toggleVibe(dayConfig.vibes || [], v.value) })}
                  style={{
                    width: '100%', padding: '14px 18px',
                    borderRadius: 12, border: `2px solid ${G}`,
                    background: selected ? G : BG,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600,
                    color: selected ? BG : G,
                    transition: 'background 150ms',
                  }}
                >
                  {t(v.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={onNext} disabled={!canProceed} style={{
          width: '100%', padding: '18px', borderRadius: 40,
          background: canProceed ? G : '#333',
          border: 'none', cursor: canProceed ? 'pointer' : 'default',
          fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700,
          color: canProceed ? BG : '#666',
          transition: 'background 200ms',
        }}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
}