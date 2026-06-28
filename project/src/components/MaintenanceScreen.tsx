import Logo from './Logo';
import { useLang } from '../lib/lang-context';

export default function MaintenanceScreen() {
  const { t } = useLang();

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
        <Logo.Icon size={80} />
      </div>
      <h2 style={{ fontFamily:'var(--f-display)', fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:12, lineHeight:1.3 }}>
        {t('maintenance_title')}
      </h2>
      <p style={{ fontFamily:"'Caveat', cursive", fontSize:18, color:'var(--text-muted)', maxWidth:280, lineHeight:1.6 }}>
        {t('maintenance_desc')}
      </p>
      <p style={{ fontSize:13, color:'var(--text-faint)', marginTop:24 }}>
        {t('maintenance_back_soon')}
      </p>
    </div>
  );
}