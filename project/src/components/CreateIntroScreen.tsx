const G = '#C9A961';
const BG = '#000000';

interface Props {
  onStart: () => void;
  onBack: () => void;
}

export default function CreateIntroScreen({ onStart, onBack }: Props) {
  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
    }}>
      <div style={{ padding: '28px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: G }}>Retour</span>
          </button>
          <span style={{ fontFamily: 'var(--f-logo)', fontSize: 32, color: G }}>Your Trip</span>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 48px',
      }}>
        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: G,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 52,
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            border: `3px solid ${BG}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--f-logo)', fontSize: 34, color: BG, lineHeight: 1 }}>YT</span>
          </div>
        </div>

        {/* Le texte a été corrigé ici pour utiliser le vouvoiement */}
        <h1 style={{
          fontFamily: 'var(--f-display)', fontSize: 34, fontWeight: 700,
          color: G, textAlign: 'center', lineHeight: 1.25, marginBottom: 20,
        }}>
          Créez votre<br />journée parfaite
        </h1>

        <p style={{
          fontFamily: 'var(--f-display)', fontSize: 18,
          color: '#888', textAlign: 'center', lineHeight: 1.5, marginBottom: 56,
          maxWidth: 300,
        }}>
          Découvrez des expériences uniques et personnalisées dans la ville de votre choix
        </p>

        <button onClick={onStart} style={{
          padding: '18px 72px',
          background: G, color: BG,
          border: 'none', borderRadius: 40,
          fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700,
          cursor: 'pointer',
          width: '100%', maxWidth: 320,
        }}>
          Commencer
        </button>
      </div>
    </div>
  );
}