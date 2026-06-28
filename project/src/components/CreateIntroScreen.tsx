import { ChevronLeft, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import Logo from './Logo';

interface Props {
  onStart: () => void;
  onBack: () => void;
  onResume?: () => void;
}

export default function CreateIntroScreen({ onStart, onBack, onResume }: Props) {
  const { t } = useLang();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: 'var(--f-body)',
      position: 'relative',
    }}>

      {/* Header : Retour / Your Trip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px 0', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text)', fontFamily: 'var(--f-body)',
          fontSize: 17, fontWeight: 500, padding: 0, letterSpacing: '-0.01em',
        }}>
          <ChevronLeft size={20} strokeWidth={1.8} />
          {t('intro_back')}
        </button>
        <span style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--accent)', letterSpacing: '-0.02em',
        }}>
          Your Trip
        </span>
      </div>

      {/* Contenu central */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 120px', textAlign: 'center',
      }}>

        {/* Cercle glow + logo YT */}
        <div style={{
          position: 'relative',
          width: 150, height: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 48,
        }}>
          <div style={{
            position: 'absolute', inset: -10,
            background: 'radial-gradient(circle, rgba(212,168,67,0.30) 0%, transparent 68%)',
            filter: 'blur(6px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(214,188,130,0.35)',
            background: 'radial-gradient(circle at 50% 40%, rgba(42,34,24,0.55) 0%, rgba(8,7,10,0.2) 100%)',
            boxShadow: '0 0 50px rgba(212,168,67,0.20), inset 0 1px 0 rgba(255,255,255,0.06)',
          }} />
          <span style={{
            position: 'relative', zIndex: 1,
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontSize: 56,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            YT
          </span>
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--f-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.22em',
          textTransform: 'uppercase', margin: '0 0 18px',
        }}>
          {t('intro_eyebrow')}
        </p>

        {/* Titre serif italique */}
        <h1 style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic',
          fontSize: 44, fontWeight: 400,
          color: 'var(--text)', lineHeight: 1.05,
          letterSpacing: '-0.025em', margin: '0 0 20px',
        }}>
          {t('intro_title_compose')} <span style={{ color: 'var(--accent)' }}>{t('intro_title_journey')}</span> {t('intro_title_perfect')}
        </h1>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--f-body)', fontSize: 16,
          color: 'var(--text-muted)', lineHeight: 1.55,
          margin: '0 0 32px', maxWidth: 320,
        }}>
          {t('intro_desc_short')}
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <Stat icon={<Clock size={14} color="var(--accent)" strokeWidth={1.8} />} label={t('intro_stat_time')} />
          <Dot />
          <Stat icon={<MapPin size={14} color="var(--accent)" strokeWidth={1.8} />} label={t('intro_stat_cities')} />
          <Dot />
          <Stat icon={<Sparkles size={14} color="var(--accent)" strokeWidth={1.8} />} label={t('intro_stat_custom')} />
        </div>
      </div>

      {/* CTA bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        padding: '16px 24px 24px',
        background: 'linear-gradient(to top, var(--bg) 75%, transparent)',
      }}>
        <button onClick={onStart} style={{
          width: '100%', padding: '18px 24px',
          background: 'var(--grad-logo)', color: '#1A1208',
          border: 'none', borderRadius: 999,
          fontFamily: 'var(--f-body)', fontSize: 17, fontWeight: 700,
          cursor: 'pointer', letterSpacing: '-0.005em',
          boxShadow: '0 10px 32px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {t('intro_start')}
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>

        <button
          onClick={onResume || onBack}
          style={{
            width: '100%', marginTop: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-body)', fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          {t('intro_resume_prefix')}{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('intro_resume_link')}</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      {icon}
      <span style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--text)', letterSpacing: '-0.005em' }}>
        {label}
      </span>
    </span>
  );
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-faint)' }} />;
}