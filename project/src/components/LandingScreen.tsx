import { Plane } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import Logo from './Logo';

interface Props {
  onStart: () => void;
}

const G = '#C9A961';

export default function LandingScreen({ onStart }: Props) {
  const { t } = useLang();

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 32px', maxWidth:430, margin:'0 auto',
    }}>
      {/* Avion doré + badge YT */}
      <div style={{ position:'relative', marginBottom:32 }}>
        <Plane size={140} color={G} strokeWidth={1} style={{ transform:'rotate(45deg)' }} fill={G} />
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        }}>
          <Logo.Icon size={56} />
        </div>
      </div>

      {/* Logo cursif */}
      <div style={{ marginBottom: 24 }}>
        <Logo.Wordmark size={48} />
      </div>
       

      {/* Slogan */}
      <p style={{ fontFamily:'var(--f-display)', fontSize:22, color:G, textAlign:'center', marginBottom:48 }}>
        Visit with your personality !
      </p>

      {/* Bouton Commencer */}
      <button onClick={onStart} style={{
        padding:'18px 56px', background:G, color:'#0A0A0F',
        border:'none', borderRadius:40,
        fontFamily:'var(--f-display)', fontSize:22, fontWeight:600,
        cursor:'pointer',
      }}>
        {t('landing_cta')}
      </button>
    </div>
  );
}