import { useState, useEffect } from 'react';
import {
  X, Crown, User, Map, Heart, Bell, Globe, Shield, HelpCircle,
  LogOut, ChevronRight, ChevronLeft, Star, ToggleLeft, ToggleRight,
  Bug, MessageSquare, BookOpen, Lock, Mail, MapPin
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { supabase } from '../lib/supabase';
import { LANGUAGES, type LangCode } from '../lib/i18n';

interface Props { onClose: () => void; }

type Sub = null | 'premium' | 'profile' | 'trips' | 'tastes'
              | 'notifications' | 'language' | 'privacy' | 'support'
              | 'permissions' | 'account';

const G = '#C9A961';
const GDIM = 'rgba(201,169,97,0.12)';

export default function ProfilePanel({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const [sub, setSub] = useState<Sub>(null);
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [taste, setTaste] = useState<any>(null);
  const [notifs, setNotifs] = useState({ planning:true, review:true, reengagement:true });
  const [perms, setPerms] = useState({ notif:false, gps:false });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('saved_plans').select('*').eq('user_id', user.id).order('created_at',{ascending:false}),
      supabase.from('user_taste_profile').select('*').eq('user_id', user.id).maybeSingle(),
    ]).then(([{data:p},{data:pl},{data:tp}]) => {
      setProfile(p);
      setPlans(pl || []);
      setTaste(tp);
      if (p) setNotifs({
        planning: p.notifs_planning ?? true,
        review: p.notifs_review ?? true,
        reengagement: p.notifs_rengagement ?? true,
      });
    });
  }, [user]);

  const save = async (updates: any) => {
    if (!user) return;
    await supabase.from('user_profiles').update({ ...updates, updated_at:new Date().toISOString() }).eq('id', user.id);
    setProfile((p:any) => ({ ...p, ...updates }));
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Traveler';
  const initiale = displayName[0]?.toUpperCase() || 'Y';

  // ── MENU PRINCIPAL — Premium tout en haut, Notifications séparé ──
  const MENU: { id: Sub; icon: JSX.Element; label: string; gold?: boolean }[] = [
    { id:'premium',       icon:<Crown size={18}/>,      label:t('menu_premium'), gold:true },
    { id:'profile',       icon:<User size={18}/>,        label:t('menu_my_profile') },
    { id:'trips',         icon:<Map size={18}/>,         label:t('menu_my_trips') },
    { id:'tastes',        icon:<Heart size={18}/>,       label:t('menu_my_tastes') },
    { id:'notifications', icon:<Bell size={18}/>,        label:t('menu_notifications') },
    { id:'language',      icon:<Globe size={18}/>,       label:t('menu_language') },
    { id:'privacy',       icon:<Shield size={18}/>,      label:t('menu_privacy') },
    { id:'support',       icon:<HelpCircle size={18}/>,  label:t('menu_support') },
  ];

  // ════ SOUS-ÉCRANS ════
  if (sub) {
    return (
      <SubScreen
        sub={sub} setSub={setSub} onClose={onClose}
        t={t} lang={lang} setLang={setLang}
        profile={profile} plans={plans} taste={taste}
        notifs={notifs} setNotifs={setNotifs}
        perms={perms} setPerms={setPerms}
        save={save} user={user}
      />
    );
  }

  // ════ MENU PRINCIPAL ════
  return (
    <>
      <div onClick={onClose} className="fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:80 }} />
      <div className="slide-up" style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'var(--bg-card)',
        borderRadius:'24px 24px 0 0', zIndex:90, maxHeight:'92vh',
        display:'flex', flexDirection:'column', border:`1px solid var(--border)`, borderBottom:'none',
      }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding:'16px 20px 14px', borderBottom:`1px solid var(--border)` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontFamily:'var(--f-display)', fontSize:18, fontWeight:600, color:'var(--text)' }}>{t('profile_title')}</span>
            <button onClick={onClose} style={{ background:'var(--bg-elevated)', border:`1px solid var(--border)`, borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:54, height:54, borderRadius:'50%', border:`2px solid ${G}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:G, fontFamily:'var(--f-display)', flexShrink:0 }}>
              {initiale}
            </div>
            <div>
              <p style={{ fontFamily:'var(--f-display)', fontSize:17, fontWeight:600, color:'var(--text)' }}>{displayName}</p>
              <p style={{ fontSize:12, color:'var(--text-faint)' }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {MENU.map(item => (
            <button key={item.id} onClick={() => setSub(item.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:14,
              padding:'15px 20px', background:'none', border:'none',
              borderBottom:`1px solid var(--border)`, cursor:'pointer', textAlign:'left',
            }}>
              <div style={{ width:36, height:36, borderRadius:10, background: item.gold ? GDIM : 'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color: item.gold ? G : 'var(--text-muted)' }}>
                {item.icon}
              </div>
              <span style={{ flex:1, fontSize:15, fontWeight: item.gold ? 600 : 400, color: item.gold ? G : 'var(--text)' }}>{item.label}</span>
              {item.gold && <span style={{ fontSize:10, background:G, color:'#0A0A0F', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>PRO</span>}
              <ChevronRight size={15} style={{ color:'var(--text-faint)' }} />
            </button>
          ))}

          {/* Déconnexion */}
          <button onClick={() => { signOut(); onClose(); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'15px 20px', background:'none', border:'none', cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(176,112,61,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <LogOut size={18} style={{ color:'var(--terra)' }} />
            </div>
            <span style={{ fontSize:15, fontWeight:500, color:'var(--terra)' }}>{t('menu_logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════ SOUS-ÉCRANS ═══════════════
function SubScreen({ sub, setSub, onClose, t, lang, setLang, profile, plans, taste, notifs, setNotifs, perms, setPerms, save, user }: any) {
  const [form, setForm] = useState({ ...profile });
  const [langConfirm, setLangConfirm] = useState<LangCode|null>(null);
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const back = () => {
    // account et permissions reviennent vers privacy
    if (sub === 'account' || sub === 'permissions') { setSub('privacy'); return; }
    setSub(null);
  };

  const Header = ({ title }: { title: string }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:`1px solid var(--border)` }}>
      <button onClick={back} style={{ background:'var(--bg-elevated)', border:`1px solid var(--border)`, borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontFamily:'var(--f-display)', fontSize:17, fontWeight:600, color:'var(--text)', flex:1 }}>{title}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-faint)' }}>
        <X size={18} />
      </button>
    </div>
  );

  const handlePwChange = async () => {
    if (newPw.length < 6) { setPwMsg('Min. 6 caractères'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwMsg(error ? error.message : t('password_changed'));
    if (!error) setNewPw('');
  };

  return (
    <>
      <div onClick={onClose} className="fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:80 }} />
      <div className="slide-up" style={{
        position:'fixed', inset:0, maxWidth:430, margin:'0 auto',
        background:'var(--bg-card)', zIndex:90, display:'flex', flexDirection:'column', overflowY:'auto',
      }}>

        {/* ── PREMIUM ── */}
        {sub==='premium' && (<>
          <Header title={t('menu_premium')} />
          <div style={{ padding:20 }}>
            <div style={{ border:`2px solid ${G}`, borderRadius:'var(--r-lg)', padding:24, textAlign:'center' }}>
              <Crown size={42} style={{ color:G, margin:'0 auto 12px' }} />
              <h3 style={{ fontFamily:'var(--f-display)', fontSize:22, fontWeight:700, color:G, marginBottom:6 }}>{t('premium_title')}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>{t('premium_subtitle')}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:22, textAlign:'left' }}>
                {['✨ Journées illimitées','🗺️ Cartes hors-ligne','🤖 IA prioritaire','🚫 Sans publicité','❤️ Favoris illimités'].map(f => (
                  <span key={f} style={{ fontSize:13, color:'var(--text)' }}>{f}</span>
                ))}
              </div>
              <button style={{ width:'100%', padding:16, background:G, color:'#0A0A0F', border:'none', borderRadius:'var(--r-md)', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                {t('premium_cta')}
              </button>
            </div>
          </div>
        </>)}

        {/* ── MON PROFIL ── */}
        {sub==='profile' && (<>
          <Header title={t('menu_my_profile')} />
          <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <FInput label="Prénom" value={form?.display_name||''} onChange={(v:string)=>setForm((f:any)=>({...f,display_name:v}))} />
            <FInput label="Ville" value={form?.city||''} onChange={(v:string)=>setForm((f:any)=>({...f,city:v}))} />
            <FInput label="Pays" value={form?.country||''} onChange={(v:string)=>setForm((f:any)=>({...f,country:v}))} />
            <button onClick={()=>save({ display_name:form?.display_name, city:form?.city, country:form?.country })}
              style={{ width:'100%', padding:16, background:G, color:'#0A0A0F', border:'none', borderRadius:'var(--r-md)', fontWeight:700, fontSize:15, cursor:'pointer', marginTop:8 }}>
              {t('save')}
            </button>
          </div>
        </>)}

        {/* ── MES VOYAGES ── */}
        {sub==='trips' && (<>
          <Header title={t('menu_my_trips')} />
          <div style={{ padding:20 }}>
            {plans.length === 0 ? <Empty text="Aucun voyage" /> : plans.map((p:any) => (
              <div key={p.id} style={{ border:`2px solid ${G}`, borderRadius:'var(--r-md)', padding:16, marginBottom:12 }}>
                <p style={{ fontFamily:'var(--f-display)', fontSize:16, fontWeight:600, color:G }}>{p.city}</p>
                <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>
                  {new Date(p.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
                </p>
              </div>
            ))}
          </div>
        </>)}

        {/* ── MES GOÛTS ── */}
        {sub==='tastes' && (<>
          <Header title={t('menu_my_tastes')} />
          <div style={{ padding:20 }}>
            <SL text="Catégories préférées" />
            {taste?.liked_categories && Object.keys(taste.liked_categories).length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                {Object.entries(taste.liked_categories).slice(0,6).map(([c,s]:any) => (
                  <span key={c} style={{ padding:'6px 12px', borderRadius:20, background:GDIM, color:G, fontSize:12, border:`1px solid ${G}55` }}>{c} · {Number(s).toFixed(1)}★</span>
                ))}
              </div>
            ) : <Empty text="Pas encore de données. Lance des voyages !" />}
            <SL text="Ambiance dominante" />
            {taste?.liked_ambiance && Object.keys(taste.liked_ambiance).length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {Object.entries(taste.liked_ambiance).slice(0,4).map(([a,s]:any) => (
                  <span key={a} style={{ padding:'6px 12px', borderRadius:20, background:'rgba(58,90,40,0.2)', color:'#7DAA5A', fontSize:12 }}>{a} · {Number(s).toFixed(1)}★</span>
                ))}
              </div>
            ) : <Empty text="Pas encore de données." />}
          </div>
        </>)}

        {/* ── NOTIFICATIONS (onglet séparé) ── */}
        {sub==='notifications' && (<>
          <Header title={t('menu_notifications')} />
          <div style={{ padding:20 }}>
            {[
              { key:'planning',     label:t('notif_planning_label'), icon:'📍' },
              { key:'review',       label:t('notif_review_label'),   icon:'⭐' },
              { key:'reengagement', label:t('notif_reeng_label'),    icon:'🔔' },
            ].map(item => (
              <div key={item.key} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 0', borderBottom:`1px solid var(--border)` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{item.icon}</div>
                <span style={{ flex:1, fontSize:14, color:'var(--text)' }}>{item.label}</span>
                <button onClick={() => {
                  const v = !notifs[item.key as keyof typeof notifs];
                  const upd = { ...notifs, [item.key]: v };
                  setNotifs(upd);
                  save({ [`notifs_${item.key === 'reengagement' ? 'rengagement' : item.key}`]: v });
                }}>
                  {notifs[item.key as keyof typeof notifs]
                    ? <ToggleRight size={30} style={{ color:G }} />
                    : <ToggleLeft size={30} style={{ color:'var(--text-faint)' }} />}
                </button>
              </div>
            ))}
          </div>
        </>)}

        {/* ── LANGUE (avec confirmation) ── */}
        {sub==='language' && (<>
          <Header title={t('menu_language')} />
          <div style={{ padding:'8px 0' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => {
                if (l.code === lang) return;
                setLangConfirm(l.code);
              }} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'none', border:'none', borderBottom:`1px solid var(--border)`, cursor:'pointer' }}>
                <span style={{ fontSize:24 }}>{l.flag}</span>
                <span style={{ flex:1, fontSize:15, color:'var(--text)', fontWeight: lang===l.code ? 600 : 400, textAlign:'left' }}>{l.label}</span>
                {lang===l.code && <div style={{ width:8, height:8, borderRadius:'50%', background:G }} />}
              </button>
            ))}
          </div>

          {/* Popup de confirmation */}
          {langConfirm && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div style={{ background:'var(--bg-card)', border:`1px solid var(--border)`, borderRadius:'var(--r-lg)', padding:24, maxWidth:320, width:'100%' }}>
                <h3 style={{ fontFamily:'var(--f-display)', fontSize:19, fontWeight:600, color:'var(--text)', marginBottom:8 }}>{t('lang_confirm_title')}</h3>
                <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{t('lang_confirm_text')}</p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setLangConfirm(null)} style={{ flex:1, padding:13, background:'var(--bg-elevated)', color:'var(--text-muted)', border:`1px solid var(--border)`, borderRadius:'var(--r-sm)', fontSize:14, cursor:'pointer' }}>
                    {t('cancel')}
                  </button>
                  <button onClick={() => { setLang(langConfirm); setLangConfirm(null); }} style={{ flex:1, padding:13, background:G, color:'#0A0A0F', border:'none', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                    {t('confirm')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>)}

        {/* ── CONFIDENTIALITÉ : Permissions + Mon compte ── */}
        {sub==='privacy' && (<>
          <Header title={t('menu_privacy')} />
          <div style={{ padding:'8px 0' }}>
            <button onClick={() => setSub('permissions')} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'none', border:'none', borderBottom:`1px solid var(--border)`, cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}><MapPin size={18}/></div>
              <span style={{ flex:1, fontSize:15, color:'var(--text)', textAlign:'left' }}>{t('privacy_permissions')}</span>
              <ChevronRight size={15} style={{ color:'var(--text-faint)' }} />
            </button>
            <button onClick={() => setSub('account')} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'none', border:'none', borderBottom:`1px solid var(--border)`, cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}><Lock size={18}/></div>
              <span style={{ flex:1, fontSize:15, color:'var(--text)', textAlign:'left' }}>{t('privacy_account')}</span>
              <ChevronRight size={15} style={{ color:'var(--text-faint)' }} />
            </button>
          </div>
        </>)}

        {/* ── PERMISSIONS (notif + GPS) ── */}
        {sub==='permissions' && (<>
          <Header title={t('privacy_permissions')} />
          <div style={{ padding:20 }}>
            {[
              { key:'notif', label:t('perm_notif'), icon:'🔔' },
              { key:'gps',   label:t('perm_gps'),   icon:'📍' },
            ].map(item => (
              <div key={item.key} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 0', borderBottom:`1px solid var(--border)` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{item.icon}</div>
                <span style={{ flex:1, fontSize:14, color:'var(--text)' }}>{item.label}</span>
                <button onClick={async () => {
                  const v = !perms[item.key as keyof typeof perms];
                  if (v && item.key === 'notif' && 'Notification' in window) {
                    await Notification.requestPermission();
                  }
                  if (v && item.key === 'gps' && 'geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(() => {}, () => {});
                  }
                  setPerms({ ...perms, [item.key]: v });
                }}>
                  {perms[item.key as keyof typeof perms]
                    ? <ToggleRight size={30} style={{ color:G }} />
                    : <ToggleLeft size={30} style={{ color:'var(--text-faint)' }} />}
                </button>
              </div>
            ))}
          </div>
        </>)}

        {/* ── MON COMPTE (email + changement mot de passe) ── */}
        {sub==='account' && (<>
          <Header title={t('privacy_account')} />
          <div style={{ padding:20 }}>
            <div style={{ marginBottom:20 }}>
              <label style={LS}>{t('account_email')}</label>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', background:'var(--bg-input)', border:`1px solid var(--border)`, borderRadius:'var(--r-md)' }}>
                <Mail size={16} style={{ color:'var(--text-faint)' }} />
                <span style={{ fontSize:14, color:'var(--text)' }}>{user?.email}</span>
              </div>
            </div>
            <SL text={t('change_password')} />
            <FInput label={t('new_password')} type="password" value={newPw} onChange={setNewPw} />
            {pwMsg && <p style={{ fontSize:12, color:G, marginBottom:12 }}>{pwMsg}</p>}
            <button onClick={handlePwChange} style={{ width:'100%', padding:16, background:G, color:'#0A0A0F', border:'none', borderRadius:'var(--r-md)', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {t('save')}
            </button>
          </div>
        </>)}

        {/* ── SUPPORT ── */}
        {sub==='support' && (<>
          <Header title={t('menu_support')} />
          <div style={{ padding:'8px 0' }}>
            {[
              { icon:<Bug size={18}/>,           label:'Signaler un bug',     action:() => window.open('mailto:support@yourtrip.app?subject=Bug') },
              { icon:<MessageSquare size={18}/>, label:'Contacter le support', action:() => window.open('mailto:support@yourtrip.app') },
              { icon:<BookOpen size={18}/>,      label:'FAQ',                  action:() => {} },
            ].map((item,i) => (
              <button key={i} onClick={item.action} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'none', border:'none', borderBottom:`1px solid var(--border)`, cursor:'pointer' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>{item.icon}</div>
                <span style={{ flex:1, fontSize:15, color:'var(--text)', textAlign:'left' }}>{item.label}</span>
                <ChevronRight size={15} style={{ color:'var(--text-faint)' }} />
              </button>
            ))}
          </div>
        </>)}
      </div>
    </>
  );
}

// ── Mini-composants ──
function FInput({ label, value, onChange, type='text' }: { label:string; value:string; onChange:(v:string)=>void; type?:string }) {
  return (
    <div>
      <label style={LS}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'13px 15px', background:'var(--bg-input)', border:`1px solid var(--border)`, borderRadius:'var(--r-md)', color:'var(--text)', fontSize:15, outline:'none', boxSizing:'border-box' }} />
    </div>
  );
}
function SL({ text }: { text:string }) {
  return <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--text-faint)', marginBottom:12 }}>{text}</p>;
}
function Empty({ text }: { text:string }) {
  return <p style={{ fontSize:14, color:'var(--text-faint)', fontFamily:'var(--f-hand)', marginBottom:16 }}>{text}</p>;
}
const LS: React.CSSProperties = { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--text-faint)', display:'block', marginBottom:7 };
