import { useState, useEffect } from 'react';
import { X, Crown, Check, Sparkles, Calendar, Lock, RefreshCw, FileText, History, Ban, Zap } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast-context';

interface Props {
  onClose: () => void;
}

type Plan = 'monthly' | 'yearly';

export default function PremiumScreen({ onClose }: Props) {
    const { toast } = useToast();
const { t } = useLang();
  const [selected, setSelected] = useState<Plan>('yearly');

  const features = [
    { Icon: Calendar,  titleKey: 'premium_feat_quota_title',    descKey: 'premium_feat_quota_desc' },
    { Icon: Lock,      titleKey: 'premium_feat_places_title',   descKey: 'premium_feat_places_desc' },
    { Icon: RefreshCw, titleKey: 'premium_feat_replace_title',  descKey: 'premium_feat_replace_desc' },
    { Icon: History,   titleKey: 'premium_feat_history_title',  descKey: 'premium_feat_history_desc' },
    { Icon: FileText,  titleKey: 'premium_feat_pdf_title',      descKey: 'premium_feat_pdf_desc' },
    { Icon: Ban,       titleKey: 'premium_feat_noads_title',    descKey: 'premium_feat_noads_desc' },
    { Icon: Zap,       titleKey: 'premium_feat_support_title',  descKey: 'premium_feat_support_desc' },
  ];

  const handleSubscribe = () => {
    toast.info(t('premium_unlock_soon'));
  };

  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium === true));
  }, [user]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      zIndex: 9995, overflow: 'auto',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
    }}>
      {/* Header avec X */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '20px 20px 10px',
        background: 'linear-gradient(180deg, var(--bg) 0%, rgba(8,7,10,0.85) 100%)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--stroke-soft)',
          border: '1px solid rgba(244,238,223,0.12)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={18} color="var(--text-muted)" />
        </button>
      </div>

      {/* ── HERO ── */}
      <div style={{ padding: '8px 24px 36px', textAlign: 'center' }}>
        {/* Couronne avec halo doré radial */}
        <div style={{
          position: 'relative',
          width: 100, height: 100,
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Halo */}
          <div style={{
            position: 'absolute', inset: -20,
            background: 'radial-gradient(circle, rgba(212,168,67,0.35) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }} />
          {/* Cercle sombre */}
          <div style={{
            position: 'relative',
            width: 96, height: 96, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 40%, #2A2218 0%, #14110A 100%)',
            border: '1px solid rgba(212,168,67,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <Crown size={42} color="var(--accent)" strokeWidth={1.8} />
          </div>
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--accent)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          {t('premium_screen_eyebrow') || "L'expérience complète"}
        </p>

        {/* Titre serif italique avec gradient or */}
        <h1 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 42,
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          background: 'linear-gradient(180deg, #F4E0A8 0%, #D4A843 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: 18,
        }}>
          Your Trip Premium
        </h1>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: 15,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          maxWidth: 340,
          margin: '0 auto',
        }}>
          {t('premium_screen_subtitle')}
        </p>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: '0 20px 32px' }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'var(--bg-soft)',
            border: '1px solid rgba(214,188,130,0.10)',
            borderRadius: 16, marginBottom: 10,
          }}>
            {/* Container icône carré arrondi */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
              border: '1px solid rgba(212,168,67,0.18)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <f.Icon size={22} color="var(--accent)" strokeWidth={1.8} />
            </div>

            {/* Textes */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--f-body)',
                fontSize: 15, fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.005em',
              }}>
                {t(f.titleKey)}
              </p>
              <p style={{
                fontFamily: 'var(--f-body)',
                fontSize: 13, color: 'var(--text-muted)',
                margin: '3px 0 0',
                lineHeight: 1.4,
              }}>
                {t(f.descKey)}
              </p>
            </div>

            {/* Check doré */}
            <Check size={20} color="var(--accent)" strokeWidth={2.2} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* ── PLAN SELECTOR ── */}
      {!isPremium && (
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 11, fontWeight: 500,
            color: 'var(--accent)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 18,
          }}>
            {t('premium_choose_plan')}
          </p>

          {/* Plan annuel */}
          <PlanCard
            selected={selected === 'yearly'}
            onClick={() => setSelected('yearly')}
            label={t('premium_yearly_label')}
            sublabel={t('premium_yearly_perm')}
            price="39,99 €"
            period={t('premium_year')}
            badge={t('premium_save_33')}
          />

          {/* Plan mensuel */}
          <PlanCard
            selected={selected === 'monthly'}
            onClick={() => setSelected('monthly')}
            label={t('premium_monthly_label')}
            sublabel={t('premium_monthly_perm')}
            price="4,99 €"
            period={t('premium_month')}
          />
        </div>
      )}

      {/* ── CTA ── */}
      <div style={{ padding: '0 20px 40px' }}>
        {isPremium ? (
          <div style={{
            padding: '24px 20px',
            background: 'linear-gradient(135deg, rgba(212,168,67,0.15) 0%, rgba(212,168,67,0.05) 100%)',
            border: '1px solid rgba(212,168,67,0.4)',
            borderRadius: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>✨</div>
            <p style={{
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic', fontSize: 20,
              color: 'var(--accent)',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}>
              {t('premium_already_subscribed')}
            </p>
            <p style={{
              fontFamily: 'var(--f-body)', fontSize: 13,
              color: 'var(--text-muted)',
              margin: 0, lineHeight: 1.5,
            }}>
              {t('premium_already_subscribed_desc')}
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={handleSubscribe}
              style={{
                width: '100%',
                padding: '18px 24px',
                background: 'var(--grad-logo)',
                color: '#1A1208',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'var(--f-body)',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                boxShadow: '0 10px 32px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <Sparkles size={18} strokeWidth={2.2} />
              {t('premium_subscribe_btn')}
            </button>
            <p style={{
              fontFamily: 'var(--f-body)',
              fontSize: 11,
              color: 'var(--text-faint)',
              textAlign: 'center',
              marginTop: 14,
              lineHeight: 1.5,
            }}>
              {t('premium_terms')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PLAN CARD
// ─────────────────────────────────────────────
function PlanCard({
  selected, onClick, label, sublabel, price, period, badge,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
  price: string;
  period: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        padding: '20px 18px',
        marginBottom: 12,
        background: selected ? 'rgba(212,168,67,0.08)' : 'var(--bg-soft)',
        border: `1.5px solid ${selected ? 'rgba(212,168,67,0.55)' : 'rgba(214,188,130,0.10)'}`,
        borderRadius: 18,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--f-body)',
        transition: 'all 200ms ease',
      }}
    >
      {/* Badge -33% en top-right */}
      {badge && (
        <span style={{
          position: 'absolute',
          top: -10, right: 16,
          background: 'var(--grad-logo)',
          color: '#1A1208',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.02em',
          boxShadow: '0 4px 12px rgba(212,168,67,0.30)',
        }}>
          {badge}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Radio */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--accent)' : 'rgba(244,238,223,0.25)'}`,
          background: selected ? 'rgba(212,168,67,0.15)' : 'transparent',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && (
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--accent)',
            }} />
          )}
        </div>

        {/* Label + sublabel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 16, fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            margin: '3px 0 0',
            lineHeight: 1.4,
          }}>
            {sublabel}
          </p>
        </div>

        {/* Prix */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontSize: 22, fontWeight: 400,
            color: 'var(--accent)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {price}
          </p>
          <p style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            margin: '2px 0 0',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            / {period}
          </p>
        </div>
      </div>
    </button>
  );
}
