import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Sparkles, Dices, Hand } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import AppHeader from './AppHeader';

export type CreationMode = 'tastes' | 'surprise' | 'custom';

interface Props {
  nbDays: number;
  hasTasteProfile: boolean;
  onSelect: (mode: CreationMode) => void;
  onBack: () => void;
}

interface ModeConfig {
  id: CreationMode;
  titleKey: string;
  descKey: string;
  Icon: any;
  color: string;
  bgGradient: string;
  recommended?: boolean;
  needsTaste?: boolean;
}

export default function CreationModeScreen({ nbDays, hasTasteProfile, onSelect, onBack }: Props) {
  const { t } = useLang();
  const [showWarning, setShowWarning] = useState<CreationMode | null>(null);

  const MODES: ModeConfig[] = [
    {
      id: 'tastes',
      titleKey: 'mode_tastes_title',
      descKey: 'mode_tastes_desc',
      Icon: Sparkles,
      color: 'var(--accent)',
      bgGradient: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
      recommended: true,
      needsTaste: true,
    },
    {
      id: 'surprise',
      titleKey: 'mode_surprise_title',
      descKey: 'mode_surprise_desc',
      Icon: Dices,
      color: '#C57B5E',
      bgGradient: 'linear-gradient(135deg, #2A1812 0%, #14080A 100%)',
    },
    {
      id: 'custom',
      titleKey: 'mode_custom_title',
      descKey: 'mode_custom_desc',
      Icon: Hand,
      color: '#8A9C76',
      bgGradient: 'linear-gradient(135deg, #1A2018 0%, #0A140A 100%)',
    },
  ];

  const handleClick = (mode: CreationMode) => {
    if (mode === 'custom' && nbDays >= 1) {
      setShowWarning(mode);
      return;
    }
    onSelect(mode);
  };

  const confirmCustom = () => {
    setShowWarning(null);
    onSelect('custom');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
    }}>

      <AppHeader />

      {/* ── PROGRESS BAR 4 segments (2 actifs) ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px 18px', flexShrink: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3,
            background: i <= 1 ? 'var(--accent)' : 'rgba(244,238,223,0.10)',
            borderRadius: 999,
            transition: 'background 300ms',
          }} />
        ))}
      </div>

      {/* ── CORPS ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>

        {/* Retour + numéro étape */}
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

          <span style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '0.18em',
          }}>
            02 / 04
          </span>
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
          {t('mode_eyebrow') || 'Création'}
        </p>

        {/* Titre */}
        <h2 style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontSize: 38,
          fontWeight: 400,
          color: 'var(--text)',
          letterSpacing: '-0.025em',
          lineHeight: 1.08,
          margin: '0 0 18px',
        }}>
          {t('mode_title')}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          margin: '0 0 32px',
        }}>
          {t('mode_subtitle')}
        </p>

        {/* 3 cartes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MODES.map(mode => {
            const disabled = mode.needsTaste && !hasTasteProfile;
            const isRec = mode.recommended;

            return (
              <button
                key={mode.id}
                onClick={() => !disabled && handleClick(mode.id)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '18px 16px',
                  background: isRec ? 'rgba(214,188,130,0.06)' : 'var(--bg-soft)',
                  border: `1px solid ${
                    disabled ? 'rgba(244,238,223,0.06)'
                      : isRec ? 'var(--stroke-gold)'
                      : 'rgba(244,238,223,0.10)'
                  }`,
                  borderRadius: 18,
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: disabled ? 0.4 : 1,
                  transition: 'all 200ms ease',
                  fontFamily: 'var(--f-body)',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (disabled || isRec) return;
                  e.currentTarget.style.borderColor = 'rgba(244,238,223,0.20)';
                }}
                onMouseLeave={e => {
                  if (disabled || isRec) return;
                  e.currentTarget.style.borderColor = 'rgba(244,238,223,0.10)';
                }}
              >
                {/* Icône carré arrondi */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: mode.bgGradient,
                  border: `1px solid ${mode.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <mode.Icon size={22} color={mode.color} strokeWidth={1.8} />
                </div>

                {/* Textes */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 4, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: 17, fontWeight: 600,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}>
                      {t(mode.titleKey)}
                    </span>
                    {isRec && (
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(214,188,130,0.10)',
                        border: '1px solid rgba(214,188,130,0.40)',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        letterSpacing: '0.01em',
                      }}>
                        {t('mode_recommended') || 'Recommandé'}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}>
                    {t(mode.descKey)}
                  </p>
                  {disabled && (
                    <p style={{
                      fontFamily: 'var(--f-display)',
                      fontStyle: 'italic',
                      fontSize: 12,
                      color: 'var(--text-faint)',
                      margin: '6px 0 0',
                    }}>
                      {t('mode_taste_missing')}
                    </p>
                  )}
                </div>

                {/* Chevron */}
                {!disabled && (
                  <ChevronRight
                    size={18}
                    color={isRec ? 'var(--accent)' : 'var(--text-faint)'}
                    strokeWidth={1.8}
                    style={{ flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Modal warning custom ── */}
      {showWarning === 'custom' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: 20,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(214,188,130,0.25)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 380, width: '100%',
            fontFamily: 'var(--f-body)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
                border: '1px solid rgba(212,168,67,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AlertCircle size={20} color="var(--accent)" strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
              }}>
                {nbDays > 1
                  ? t('mode_custom_warning').replace('{n}', String(nbDays))
                  : t('mode_custom_warning_1day')}
              </h3>
            </div>
            <p style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '0 0 22px',
            }}>
              {t('mode_custom_desc')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowWarning(null)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid rgba(244,238,223,0.15)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← {t('back')}
              </button>
              <button
                onClick={confirmCustom}
                style={{
                  flex: 1, padding: '14px', borderRadius: 999,
                  background: 'var(--grad-logo)',
                  border: 'none',
                  color: '#1A1208',
                  fontFamily: 'var(--f-body)',
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                {t('continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
