import { ArrowLeft } from 'lucide-react';
import type { PrecisionConfig, MobilityType, MealPreference, PlacePreference, DiscoveryType, FlexibilityType } from '../types';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';
import Tooltip from './Tooltip';
import { useThemeColors } from '../lib/theme-context';

const G = '#C9A961';
const BG = '#000000';


const MOBILITY_OPTIONS: { value: MobilityType; labelKey: string; emoji: string }[] = [
  { value: 'pied',      labelKey: 'mobility_pied',      emoji: '🚶' },
  { value: 'velo',      labelKey: 'mobility_velo',      emoji: '🚴' },
  { value: 'transport', labelKey: 'mobility_transport',  emoji: '🚇' },
  { value: 'voiture',   labelKey: 'mobility_voiture',    emoji: '🚗' },
];

const MEAL_OPTIONS: { value: MealPreference; labelKey: string; emoji: string }[] = [
  { value: 'oui', labelKey: 'meal_oui', emoji: '🍽️' },
  { value: 'non', labelKey: 'meal_non', emoji: '✖️' },
];


const PLACE_PREF_OPTIONS: { value: PlacePreference; labelKey: string; emoji: string }[] = [
  { value: 'nature',   labelKey: 'place_nature',   emoji: '🌲' },
  { value: 'urbain',   labelKey: 'place_urbain',   emoji: '🏙️' },
  { value: 'culture',  labelKey: 'place_culture',  emoji: '🎭' },
  { value: 'shopping', labelKey: 'place_shopping', emoji: '🛍️' },
  { value: 'mix',      labelKey: 'place_mix',      emoji: '🎨' },
];

const DISCOVERY_OPTIONS: { value: DiscoveryType; labelKey: string; emoji: string }[] = [
  { value: 'connus', labelKey: 'discovery_connus', emoji: '⭐' },
  { value: 'caches', labelKey: 'discovery_caches', emoji: '🔍' },
  { value: 'mix',    labelKey: 'discovery_mix',    emoji: '⚖️' },
];

const FLEXIBILITY_OPTIONS: { value: FlexibilityType; labelKey: string; emoji: string }[] = [
  { value: 'structure', labelKey: 'flex_structure', emoji: '📋' },
  { value: 'flexible',  labelKey: 'flex_flexible',  emoji: '🎯' },
  { value: 'libre',     labelKey: 'flex_libre',     emoji: '🦋' },
];

interface Props {
  precision: PrecisionConfig;
  lang: LangCode;
  onChange: (config: Partial<PrecisionConfig>) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const toggleValue = <T extends string>(arr: T[], value: T) =>
  arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontSize: 15,
  fontWeight: 700,
  color: G,
};

function OptionBtn({ selected, onClick, emoji, label, fullWidth }: { selected: boolean; onClick: () => void; emoji: string; label: string; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 10px',
        borderRadius: 12, border: `2px solid ${G}`,
        background: selected ? G : BG,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'background 150ms',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontFamily: 'var(--f-display)', fontSize: 12, fontWeight: 600, color: selected ? BG : G, textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}

export default function PrecisionScreen({ precision, onChange, onNext, onSkip, onBack }: Props) {
  const { t, lang } = useLang();

  const handlePlacePrefToggle = (value: PlacePreference) => {
    let next: PlacePreference[];
    if (value === 'mix') {
      next = precision.placePref.includes('mix') ? [] : ['mix'];
    } else {
      const withoutMix = precision.placePref.filter(p => p !== 'mix');
      next = toggleValue(withoutMix, value);
    }
    onChange({ placePref: next });
  };
  const { accent } = useThemeColors();
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--f-logo)', fontSize: 28, color: accent }}>Your Trip</span>
        <div style={{ height: 3, background: '#333', borderRadius: 2, overflow: 'hidden', margin: '10px 0 0' }}>
          <div style={{ height: '100%', width: '75%', background: G, borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 32px' }}>

        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <ArrowLeft size={16} color={G} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>{t('back')}</span>
        </button>

        <div style={{ background: G, borderRadius: 24, padding: '8px 20px', marginBottom: 20, display: 'inline-block' }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600, color: BG }}>{t('refine')}</span>
        </div>

        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
          <span style={{ color: G }}>{t('tell_more')}</span>
          <span style={{ color: '#888' }}>{t('tell_more_2')}</span>
        </h1>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: '#666', marginBottom: 24 }}>
          {t('tell_more_desc')}
        </p>

        {/* Mobilité */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={sectionLabel}>{t('mobility')}</span>
            <Tooltip title={t('tt_mobility')} description={t('tt_mobility_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {MOBILITY_OPTIONS.map(opt => (
              <OptionBtn
                key={opt.value}
                selected={precision.mobility.includes(opt.value)}
                onClick={() => onChange({ mobility: toggleValue(precision.mobility, opt.value) })}
                emoji={opt.emoji}
                label={t(opt.labelKey)}
              />
            ))}
          </div>
        </div>

        {/* Repas */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={sectionLabel}>{t('meal')}</span>
            <Tooltip title={t('tt_meal')} description={t('tt_meal_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MEAL_OPTIONS.map(opt => (
              <OptionBtn
                key={opt.value}
                selected={precision.meal === opt.value}
                onClick={() => onChange({ meal: opt.value })}
                emoji={opt.emoji}
                label={t(opt.labelKey)}
              />
            ))}
          </div>
        </div>

        {/* Préférence lieux */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={sectionLabel}>{t('place_type')}</span>
            <Tooltip title={t('tt_place')} description={t('tt_place_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {PLACE_PREF_OPTIONS.map(opt => (
              <OptionBtn
                key={opt.value}
                selected={precision.placePref.includes(opt.value)}
                onClick={() => handlePlacePrefToggle(opt.value)}
                emoji={opt.emoji}
                label={t(opt.labelKey)}
              />
            ))}
          </div>
        </div>

        {/* Découverte */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={sectionLabel}>{t('discovery')}</span>
            <Tooltip title={t('tt_discovery')} description={t('tt_discovery_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {DISCOVERY_OPTIONS.map(opt => (
              <OptionBtn
                key={opt.value}
                selected={precision.discovery === opt.value}
                onClick={() => onChange({ discovery: opt.value })}
                emoji={opt.emoji}
                label={t(opt.labelKey)}
              />
            ))}
          </div>
        </div>

        {/* Flexibilité */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={sectionLabel}>{t('flexibility')}</span>
            <Tooltip title={t('tt_flexibility')} description={t('tt_flexibility_desc')} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {FLEXIBILITY_OPTIONS.map(opt => (
              <OptionBtn
                key={opt.value}
                selected={precision.flexibility === opt.value}
                onClick={() => onChange({ flexibility: opt.value })}
                emoji={opt.emoji}
                label={t(opt.labelKey)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          style={{
            width: '100%', padding: '18px', borderRadius: 40,
            background: G, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, color: BG,
          }}
        >
          {t('continue')}
        </button>
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '14px', marginTop: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-display)', fontSize: 15, color: '#666',
          }}
        >
          {t('skip')}
        </button>
      </div>
    </div>
  );
}