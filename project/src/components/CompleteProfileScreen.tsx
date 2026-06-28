import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { createUserProfile } from '../lib/auth';

interface Props { onComplete: () => void; }

const COUNTRIES = ['France','Belgique','Suisse','Canada','Maroc','Algérie','Tunisie',
  "Sénégal","Côte d'Ivoire",'Espagne','Italie','Portugal','Allemagne','Royaume-Uni','États-Unis','Autre'];

export default function CompleteProfileScreen({ onComplete }: Props) {
  const { user } = useAuth();
  const { t } = useLang();
  const [form, setForm] = useState({ displayName:'', birthDate:'', gender:'', country:'', city:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const ok = form.displayName && form.birthDate && form.gender && form.country && form.city;

  const handleSubmit = async () => {
    if (!user || !ok) return;
    const currentUser = user;
    setLoading(true); setError(null);
    try {
      await createUserProfile(currentUser.id, form);
      onComplete();
    } catch (e: any) {
      const { sendAlert } = await import('../lib/alert');
      sendAlert('Échec création profil onboarding', {
        userId: currentUser.id,
        email: currentUser.email,
        error: e?.message || String(e),
      });
      setError(t('auth_err_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'40px 24px', display:'flex', flexDirection:'column', justifyContent:'center' }} className="fade-up">
      <div style={{ textAlign:'center', marginBottom:'36px' }}>
        <div style={{ width:64, height:64, borderRadius:'18px', background:'linear-gradient(135deg,#1A1205,#D4A843)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 20px rgba(212,168,67,0.3)' }}>
          <span style={{ fontFamily:'var(--f-display)', fontSize:'22px', fontWeight:700, color:'#fff' }}>YT</span>
        </div>
        <h2 style={{ fontFamily:'var(--f-display)', fontSize:'24px', fontWeight:700, color:'var(--text)', marginBottom:'6px' }}>{t('complete_title')}</h2>
        <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>{t('complete_subtitle')}</p>
      </div>

      <F label={t('auth_firstname_label')} type="text" val={form.displayName} set={v=>setForm(f=>({...f,displayName:v}))} ph={t('auth_firstname_placeholder')} />
      <F label={t('auth_birthdate_label')} type="date" val={form.birthDate} set={v=>setForm(f=>({...f,birthDate:v}))} ph="" />

      <div style={{ marginBottom:'14px' }}>
        <label style={LS}>{t('auth_gender_label')}</label>
        <div style={{ display:'flex', gap:'8px' }}>
          {[
            [t('auth_gender_male'),'masculin'],
            [t('auth_gender_female'),'féminin'],
            [t('auth_gender_other'),'non précisé'],
          ].map(([label,val]) => (
            <button key={val} onClick={()=>setForm(f=>({...f,gender:val}))} style={{ flex:1, padding:'11px 6px', borderRadius:'8px', cursor:'pointer', border:`1px solid ${form.gender===val?'var(--accent)':'var(--border)'}`, background:form.gender===val?'rgba(196,98,45,0.15)':'var(--bg-input)', color:form.gender===val?'var(--accent)':'var(--text-muted)', fontSize:'12px', fontWeight:500, transition:'all 150ms' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:'14px' }}>
        <label style={LS}>{t('auth_country_label')}</label>
        <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={{ width:'100%', padding:'14px 16px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'14px', color:form.country?'var(--text)':'var(--text-faint)', outline:'none', appearance:'none', fontSize:'15px' }}>
          <option value="">{t('auth_country_placeholder')}</option>
          {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <F label={t('auth_city_label')} type="text" val={form.city} set={v=>setForm(f=>({...f,city:v}))} ph={t('auth_city_placeholder')} />

      {error && <div style={{ background:'rgba(196,98,45,0.12)', border:'1px solid rgba(196,98,45,0.3)', borderRadius:'8px', padding:'12px', fontSize:'13px', color:'var(--accent)', marginBottom:'14px' }}>{error}</div>}

      <button onClick={handleSubmit} disabled={!ok||loading} style={{ width:'100%', padding:'17px', background:!ok?'var(--bg-elevated)':'var(--accent)', color:'#fff', border:'none', borderRadius:'14px', fontWeight:600, fontSize:'16px', cursor:!ok?'not-allowed':'pointer', opacity:!ok?0.5:1, boxShadow:!ok?'none':'0 4px 20px rgba(212,168,67,0.25)', transition:'all 150ms' }}>
        {loading ? t('auth_loading_create') : t('auth_signup_continue_btn')}
      </button>
    </div>
  );
}

function F({ label, type, val, set, ph }: { label:string; type:string; val:string; set:(v:string)=>void; ph:string }) {
  return (
    <div style={{ marginBottom:'14px' }}>
      <label style={LS}>{label}</label>
      <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
        style={{ width:'100%', padding:'14px 16px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'14px', color:'var(--text)', outline:'none', fontSize:'15px' }} />
    </div>
  );
}
const LS: React.CSSProperties = { fontFamily:'var(--f-body)', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--text-faint)', display:'block', marginBottom:'7px' };