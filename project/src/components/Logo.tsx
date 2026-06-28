/**
 * Logo Your Trip — système unifié
 *
 * 2 variantes :
 *  - <Logo.Icon size={72} />        → Carré arrondi doré avec "YT" italique noir (l'icône d'app)
 *  - <Logo.Wordmark size={28} />    → "Your Trip" en Instrument Serif italique or
 */

interface IconProps {
  size?: number;
  light?: boolean;
}

function Icon({ size = 72, light = false }: IconProps) {
  // Texte volontairement petit (~36% du carré) pour laisser de la marge à la swash italique du T
  const fontSize = Math.round(size * 0.38);

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.22),
      background: 'var(--grad-logo)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: light
        ? '0 4px 14px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.30)'
        : '0 6px 24px rgba(212,168,67,0.28), inset 0 1px 0 rgba(255,255,255,0.25)',
      flexShrink: 0,
      position: 'relative',
    }}>
      <span style={{
        fontFamily: 'var(--f-logo)',
        fontSize,
        fontStyle: 'italic',
        color: '#1A1208',
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: '0.02em',
        userSelect: 'none',
        display: 'inline-block',
        // Le carré est assez grand par rapport au texte pour que le centrage flex suffise
      }}>
        YT
      </span>
    </div>
  );
}

interface WordmarkProps {
  size?: number;
  color?: string;
}

function Wordmark({ size = 28, color = 'var(--accent)' }: WordmarkProps) {
  return (
    <span style={{
      fontFamily: 'var(--f-logo)',
      fontStyle: 'italic',
      fontSize: size,
      color,
      fontWeight: 400,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      userSelect: 'none',
      paddingRight: Math.round(size * 0.1),
      display: 'inline-block',
    }}>
      Your Trip
    </span>
  );
}

const Logo = { Icon, Wordmark };
export default Logo;
