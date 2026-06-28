import { useState } from 'react';
import {
  X, Info,
  Leaf, Compass, Star,
  Heart, Moon, Users,
  Coffee, Map, Wand2, Utensils, Sprout, PartyPopper,
  Building2, Drama, ShoppingBag, Palette, TreePine,
  Footprints, Bike, Train, Car,
  Search, Scale,
  ClipboardList, Target, Bird,
} from 'lucide-react';
import { useLang } from '../lib/lang-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { useToast } from '../lib/toast-context';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  isEditMode?: boolean;
  initialData?: any;
}

interface FormData {
  budget: string;
  vibes: string[];
  experiences: string[];
  placePref: string[];
  mobility: string[];
  discovery: string;
  flexibility: string;
  freeText: string;
}

const BUDGET_OPTIONS = [
  { value: 'low',  labelKey: 'taste_budget_low',  Icon: Leaf },
  { value: 'mid',  labelKey: 'taste_budget_mid',  Icon: Compass },
  { value: 'high', labelKey: 'taste_budget_high', Icon: Star },
];

const VIBE_OPTIONS = [
  { value: 'calme',      labelKey: 'vibe_calme',      Icon: Leaf },
  { value: 'romantique', labelKey: 'vibe_romantique', Icon: Heart },
  { value: 'festif',     labelKey: 'vibe_festif',     Icon: Star },
  { value: 'solo',       labelKey: 'vibe_solo',       Icon: Moon },
  { value: 'amis',       labelKey: 'vibe_amis',       Icon: Users },
];

const EXPERIENCE_OPTIONS = [
  { value: 'chill',       labelKey: 'exp_chill',       Icon: Coffee },
  { value: 'date',        labelKey: 'exp_date',        Icon: Heart },
  { value: 'aventure',    labelKey: 'exp_aventure',    Icon: Map },
  { value: 'culturel',    labelKey: 'exp_culturel',    Icon: Wand2 },
  { value: 'gastronomie', labelKey: 'exp_gastronomie', Icon: Utensils },
  { value: 'nature',      labelKey: 'exp_nature',      Icon: Sprout },
  { value: 'amusement',   labelKey: 'exp_amusement',   Icon: PartyPopper },
];

const PLACE_PREF_OPTIONS = [
  { value: 'nature',   labelKey: 'place_nature',   Icon: TreePine },
  { value: 'urbain',   labelKey: 'place_urbain',   Icon: Building2 },
  { value: 'culture',  labelKey: 'place_culture',  Icon: Drama },
  { value: 'shopping', labelKey: 'place_shopping', Icon: ShoppingBag },
  { value: 'mix',      labelKey: 'place_mix',      Icon: Palette },
];

const MOBILITY_OPTIONS = [
  { value: 'pied',      labelKey: 'mobility_pied',      Icon: Footprints },
  { value: 'velo',      labelKey: 'mobility_velo',      Icon: Bike },
  { value: 'transport', labelKey: 'mobility_transport', Icon: Train },
  { value: 'voiture',   labelKey: 'mobility_voiture',   Icon: Car },
];

const DISCOVERY_OPTIONS = [
  { value: 'connus', labelKey: 'discovery_connus', Icon: Star },
  { value: 'caches', labelKey: 'discovery_caches', Icon: Search },
  { value: 'mix',    labelKey: 'discovery_mix',    Icon: Scale },
];

const FLEXIBILITY_OPTIONS = [
  { value: 'structure', labelKey: 'flex_structure', Icon: ClipboardList },
  { value: 'flexible',  labelKey: 'flex_flexible',  Icon: Target },
  { value: 'libre',     labelKey: 'flex_libre',     Icon: Bird },
];

// ─────────────────────────────────────────────
// TasteCard — bouton uniforme icône + label
// ─────────────────────────────────────────────
function TasteCard({
  selected, onClick, Icon, label,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '18px 8px',
        borderRadius: 16,
        background: selected ? 'rgba(214,188,130,0.06)' : 'var(--bg-soft)',
        border: `1px solid ${selected ? 'rgba(214,188,130,0.55)' : 'var(--stroke-soft)'}`,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        transition: 'all 200ms ease',
        fontFamily: 'var(--f-body)',
        minHeight: 90,
        boxShadow: selected ? '0 0 20px rgba(212,168,67,0.12)' : 'none',
      }}
      onMouseEnter={e => {
        if (selected) return;
        e.currentTarget.style.borderColor = 'rgba(244,238,223,0.20)';
      }}
      onMouseLeave={e => {
        if (selected) return;
        e.currentTarget.style.borderColor = 'var(--stroke-soft)';
      }}
    >
      <Icon
        size={22}
        color={selected ? 'var(--accent)' : 'var(--text-muted)'}
        strokeWidth={1.8}
      />
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: selected ? 'var(--accent)' : 'var(--text)',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {label}
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--f-mono)',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      margin: '0 0 14px',
    }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────
export default function TasteProfileScreen({ onClose, onSaved, isEditMode = false, initialData }: Props) {
    const { toast } = useToast();
const { t } = useLang();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    budget: initialData?.taste_budget || '',
    vibes: initialData?.taste_vibes || [],
    experiences: initialData?.taste_experiences || [],
    placePref: initialData?.taste_place_pref || [],
    mobility: initialData?.taste_mobility || [],
    discovery: initialData?.taste_discovery || '',
    flexibility: initialData?.taste_flexibility || '',
    freeText: initialData?.taste_free_text || '',
  });

  const toggleMulti = (key: keyof FormData, value: string) => {
    setForm(f => {
      const arr = (f[key] as string[]) || [];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const isValid =
    form.budget &&
    form.vibes.length > 0 &&
    form.experiences.length > 0 &&
    form.placePref.length > 0 &&
    form.mobility.length > 0 &&
    form.discovery &&
    form.flexibility;

  const handleSave = async () => {
    if (!user || !isValid) {
      toast.warning(t('taste_required'));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          taste_completed: true,
          taste_budget: form.budget,
          taste_vibes: form.vibes,
          taste_experiences: form.experiences,
          taste_place_pref: form.placePref,
          taste_mobility: form.mobility,
          taste_discovery: form.discovery,
          taste_flexibility: form.flexibility,
          taste_free_text: form.freeText.trim() || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      onSaved();
    } catch (e) {
      console.error('Erreur sauvegarde goûts:', e);
      toast.error(t('taste_save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      zIndex: 9995, // Au-dessus du ProfilePanel (9991)
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '18px 20px 0', flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          margin: 0, paddingTop: 8,
        }}>
          {t('taste_eyebrow') || 'Profil'}
        </p>

        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1px solid rgba(244,238,223,0.12)',
          background: 'var(--bg-soft-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <X size={18} color="var(--text-muted)" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 32px' }}>

        {/* Titre serif italique */}
        <h2 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 42,
          fontWeight: 400,
          color: 'var(--accent)',
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
          margin: '0 0 16px',
        }}>
          {t('taste_title')}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          margin: '0 0 22px',
        }}>
          {t('taste_subtitle')}
        </p>

        {/* Info card "Modifiable à tout moment" */}
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid rgba(214,188,130,0.18)',
          borderRadius: 16,
          padding: '14px 14px',
          marginBottom: 32,
          display: 'flex', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
            border: '1px solid rgba(212,168,67,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Info size={16} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 3px',
              letterSpacing: '-0.005em',
            }}>
              {t('taste_why_title')}
            </p>
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {t('taste_why_desc')}
            </p>
          </div>
        </div>

        {/* ── BUDGET MOYEN ── */}
        <SectionLabel>{t('taste_budget_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
          {BUDGET_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.budget === opt.value}
              onClick={() => setForm(f => ({ ...f, budget: opt.value }))}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── AMBIANCE PRÉFÉRÉE ── */}
        <SectionLabel>{t('taste_vibes_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {VIBE_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.vibes.includes(opt.value)}
              onClick={() => toggleMulti('vibes', opt.value)}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── TYPES D'EXPÉRIENCE ── */}
        <SectionLabel>{t('taste_experiences_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.experiences.includes(opt.value)}
              onClick={() => toggleMulti('experiences', opt.value)}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── LIEUX PRÉFÉRÉS ── */}
        <SectionLabel>{t('taste_place_pref_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {PLACE_PREF_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.placePref.includes(opt.value)}
              onClick={() => toggleMulti('placePref', opt.value)}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── MOBILITÉ ── */}
        <SectionLabel>{t('taste_mobility_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {MOBILITY_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.mobility.includes(opt.value)}
              onClick={() => toggleMulti('mobility', opt.value)}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── DÉCOUVERTE ── */}
        <SectionLabel>{t('taste_discovery_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
          {DISCOVERY_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.discovery === opt.value}
              onClick={() => setForm(f => ({ ...f, discovery: opt.value }))}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── FLEXIBILITÉ ── */}
        <SectionLabel>{t('taste_flexibility_q')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
          {FLEXIBILITY_OPTIONS.map(opt => (
            <TasteCard
              key={opt.value}
              selected={form.flexibility === opt.value}
              onClick={() => setForm(f => ({ ...f, flexibility: opt.value }))}
              Icon={opt.Icon}
              label={t(opt.labelKey)}
            />
          ))}
        </div>

        {/* ── ZONE LIBRE ── */}
        <SectionLabel>{t('taste_free_text_q')}</SectionLabel>
        <textarea
          value={form.freeText}
          onChange={e => setForm(f => ({ ...f, freeText: e.target.value }))}
          placeholder={t('taste_free_text_placeholder')}
          rows={3}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--bg-soft)',
            border: '1px solid rgba(244,238,223,0.10)',
            borderRadius: 14,
            color: 'var(--text)',
            fontFamily: 'var(--f-body)',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            marginBottom: 28,
            boxSizing: 'border-box',
          }}
        />

        {/* ── CTA ── */}
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: (isValid && !saving) ? 'var(--grad-logo)' : 'rgba(244,238,223,0.06)',
            color: (isValid && !saving) ? '#1A1208' : 'var(--text-faint)',
            border: 'none',
            borderRadius: 999,
            fontFamily: 'var(--f-body)',
            fontSize: 17,
            fontWeight: 700,
            cursor: (isValid && !saving) ? 'pointer' : 'not-allowed',
            boxShadow: (isValid && !saving)
              ? '0 10px 32px rgba(212,168,67,0.28), inset 0 1px 0 rgba(255,255,255,0.25)'
              : 'none',
            letterSpacing: '-0.005em',
            transition: 'all 200ms ease',
          }}
        >
          {saving ? t('taste_saving') : t('taste_save')}
        </button>

        {!isEditMode && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 12px',
              marginTop: 10,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--f-body)',
              fontSize: 14,
              color: 'var(--text-faint)',
            }}
          >
            {t('taste_skip')}
          </button>
        )}
      </div>
    </div>
  );
}
