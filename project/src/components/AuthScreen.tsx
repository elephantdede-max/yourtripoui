import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { createUserProfile, checkProfileComplete } from '../lib/auth';
type Mode = 'choice' | 'login' | 'signup1' | 'signup2';
const G = '#D4A843';
const COUNTRIES = [
'France','Belgique','Suisse','Canada','Luxembourg',
'Maroc','Algérie','Tunisie','Sénégal',"Côte d'Ivoire",
'Espagne','Italie','Portugal','Allemagne','Royaume-Uni','États-Unis','Autre'
];
const inputStyle: React.CSSProperties = {
width:'100%', padding:'14px 16px',
background:'var(--bg-input)', border:'1px solid var(--border)',
borderRadius:'14px', color:'var(--text)',
outline:'none', fontSize:16, boxSizing:'border-box',
fontFamily:'var(--f-body)',
};
const labelStyle: React.CSSProperties = {
fontSize:11, fontWeight:600, textTransform:'uppercase',
letterSpacing:'1.5px', color:'var(--text-faint)', display:'block',
marginBottom:7, fontFamily:'var(--f-body)',
};
// ── Composants définis EN DEHORS de AuthScreen (sinon perte de focus) ──
function Field(props: {
label: string; type: string; value: string;
onChange: (v: string) => void; ph: string;
}) {
return (
<div style={{ marginBottom:14 }}>
<label style={labelStyle}>{props.label}</label>
<input
type={props.type}
value={props.value}
onChange={(e) => props.onChange(e.target.value)}
placeholder={props.ph}
autoComplete={props.type === 'password' ? 'current-password' : props.type === 'email' ? 'email' : 'off'}
style={inputStyle}
/>
</div>
);
}
function PBtn(props: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
return (
<button onClick={props.onClick} disabled={props.disabled} style={{
width:'100%', padding:17,
background: props.disabled ? 'var(--bg-elevated)' : G,
color: props.disabled ? 'var(--text-faint)' : '#000',
border:'none', borderRadius:14, fontWeight:700, fontSize:16,
marginBottom:10, cursor: props.disabled ? 'not-allowed' : 'pointer',
fontFamily:'var(--f-body)', transition:'all 150ms',
boxShadow: props.disabled ? 'none' : '0 4px 20px rgba(212,168,67,0.3)',
}}>{props.children}</button>
);
}
function SBtn(props: { children: React.ReactNode; onClick: () => void }) {
return (
<button onClick={props.onClick} style={{
width:'100%', padding:16, background:'transparent',
color:'var(--text-muted)', border:'1px solid var(--border)',
borderRadius:14, fontSize:15, marginBottom:8, cursor:'pointer',
fontFamily:'var(--f-body)',
}}>{props.children}</button>
);
}
function Ghost(props: { children: React.ReactNode; onClick: () => void }) {
return (
<button onClick={props.onClick} style={{
background:'none', border:'none', color:'var(--text-faint)',
fontSize:13, width:'100%', padding:'8px 0', textAlign:'center',
display:'block', marginBottom:4, cursor:'pointer', fontFamily:'var(--f-body)',
}}>{props.children}</button>
);
}
function ErrBox(props: { msg: string }) {
return (
<div style={{
background:'rgba(212,168,67,0.1)', border:'1px solid rgba(212,168,67,0.3)',
borderRadius:8, padding:'12px 14px', fontSize:13, color:G,
marginBottom:14, fontFamily:'var(--f-body)',
}}>{props.msg}</div>
);
}
function Divider() {
return (
<div style={{ display:'flex', alignItems:'center', gap:12, marginBlock:4 }}>
<div style={{ flex:1, height:1, background:'var(--border)' }} />
<span style={{ fontSize:12, color:'var(--text-faint)' }}>ou</span>
<div style={{ flex:1, height:1, background:'var(--border)' }} />
</div>
);
}
const GOOGLE_SVG = (
<svg width="18" height="18" viewBox="0 0 48 48">
<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>
);
interface Props { onSuccess: () => void; }
export default function AuthScreen({ onSuccess }: Props) {
const { signIn, signUp, signInWithGoogle } = useAuth();
const [mode, setMode]     = useState<Mode>('choice');
const [email, setEmail]   = useState('');
const [pw, setPw]         = useState('');
const [userId, setUid]    = useState<string | null>(null);
const [form, setForm]     = useState({ displayName:'', birthDate:'', gender:'', country:'', city:'' });
const [loading, setLoading] = useState(false);
const [error, setError]   = useState<string | null>(null);
const friendly = (msg: string) => {
if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
if (msg.includes('already registered'))         return 'Email déjà utilisé — connecte-toi !';
if (msg.includes('at least'))                   return 'Mot de passe trop court (6 caractères min).';
if (msg.includes('row-level security'))         return 'Erreur de sécurité — réessaie dans un instant.';
if (msg.toLowerCase().includes('email'))        return 'Adresse email invalide.';
return msg;
};
const handleGoogle = async () => {
setError(null);
try { await signInWithGoogle(); }
catch (e: any) { setError(e.message); }
};
const handleLogin = async () => {
setError(null); setLoading(true);
try { await signIn(email.trim(), pw); onSuccess(); }
catch (e: any) { setError(friendly(e.message)); }
finally { setLoading(false); }
};
const handleSignup1 = async () => {
setError(null); setLoading(true);
try {
const { user, session } = await signUp(email.trim(), pw);
if (!user) throw new Error('Erreur création compte');
if (session) {
const complete = await checkProfileComplete(user.id);
if (complete) { onSuccess(); return; }
}
setUid(user.id);
setMode('signup2');
} catch (e: any) { setError(friendly(e.message)); }
finally { setLoading(false); }
};
const handleSignup2 = async () => {
if (!userId) return;
setError(null); setLoading(true);
try {
await createUserProfile(userId, form);
onSuccess();
} catch (e: any) { setError(friendly(e.message)); }
finally { setLoading(false); }
};
const step2OK = form.displayName && form.birthDate && form.gender && form.country && form.city;
return (
<div style={{
minHeight:'100vh', background:'var(--bg)',
display:'flex', flexDirection:'column', justifyContent:'center',
padding:'40px 24px', maxWidth:430, margin:'0 auto',
}}>
{/* Logo */}
<div style={{ textAlign:'center', marginBottom:48 }}>
<div style={{
width:72, height:72, borderRadius:'50%',
background:G, display:'flex', alignItems:'center', justifyContent:'center',
margin:'0 auto 16px', boxShadow:'0 4px 24px rgba(212,168,67,0.3)',
}}>
<span style={{ fontFamily:'var(--f-logo)', fontSize:30, color:'#0A0A0F' }}>YT</span>
</div>
<h1 style={{ fontFamily:'var(--f-logo)', fontSize:34, color:G, marginBottom:6 }}>Your Trip</h1>
<p style={{ fontFamily:'var(--f-body)', fontSize:14, color:'var(--text-muted)' }}>
{mode==='choice'  && 'Visit with your personality !'}
{mode==='login'   && 'Bon retour ✨'}
{mode==='signup1' && 'Créons votre compte'}
{mode==='signup2' && 'Parlez-nous de vous'}
</p>
</div>
  {(mode==='signup1'||mode==='signup2') && (
    <div style={{ marginBottom:28 }}>
      <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-faint)' }}>
        Étape {mode==='signup1'?'1':'2'} sur 2
      </span>
      <div style={{ height:2, background:'var(--bg-elevated)', borderRadius:2, marginTop:6 }}>
        <div style={{ height:'100%', width:mode==='signup1'?'50%':'100%', background:G, borderRadius:2, transition:'width 300ms' }} />
      </div>
    </div>
  )}

  {mode==='choice' && (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <button onClick={handleGoogle} style={{
        width:'100%', padding:16, background:'var(--bg-elevated)',
        border:'1px solid var(--border)', borderRadius:14,
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        color:'var(--text)', fontSize:15, fontWeight:500, cursor:'pointer',
      }}>
        {GOOGLE_SVG} Continuer avec Google
      </button>
      <Divider />
      <PBtn onClick={() => setMode('signup1')}>Créer un compte</PBtn>
      <SBtn onClick={() => setMode('login')}>J'ai déjà un compte</SBtn>
    </div>
  )}

  {mode==='login' && (
    <>
      <Field label="Email" type="email" value={email} onChange={setEmail} ph="ton@email.com" />
      <Field label="Mot de passe" type="password" value={pw} onChange={setPw} ph="••••••••" />
      {error && <ErrBox msg={error} />}
      <PBtn onClick={handleLogin} disabled={loading||!email||!pw}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </PBtn>
      <Ghost onClick={() => { setMode('signup1'); setError(null); }}>Pas de compte ? S'inscrire</Ghost>
      <Ghost onClick={() => setMode('choice')}>← Retour</Ghost>
    </>
  )}

  {mode==='signup1' && (
    <>
      <Field label="Email" type="email" value={email} onChange={setEmail} ph="ton@email.com" />
      <Field label="Mot de passe" type="password" value={pw} onChange={setPw} ph="6 caractères minimum" />
      {error && <ErrBox msg={error} />}
      <PBtn onClick={handleSignup1} disabled={loading||!email||!pw}>
        {loading ? 'Création...' : 'Continuer →'}
      </PBtn>
      <Ghost onClick={() => { setMode('login'); setError(null); }}>J'ai déjà un compte</Ghost>
      <Ghost onClick={() => setMode('choice')}>← Retour</Ghost>
    </>
  )}

  {mode==='signup2' && (
    <>
      <p style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--text-muted)', marginBottom:20, textAlign:'center' }}>
        Ces infos personnalisent vos voyages.
      </p>
      <Field label="Prénom" type="text" value={form.displayName}
        onChange={(v) => setForm(f=>({...f,displayName:v}))} ph="Votre prénom" />
      <Field label="Date de naissance" type="date" value={form.birthDate}
        onChange={(v) => setForm(f=>({...f,birthDate:v}))} ph="" />
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Sexe</label>
        <div style={{ display:'flex', gap:8 }}>
          {[['Homme','masculin'],['Femme','féminin'],['Autre','non précisé']].map(([lbl,val]) => (
            <button key={val} onClick={() => setForm(f=>({...f,gender:val}))} style={{
              flex:1, padding:'11px 6px', borderRadius:8,
              border:`1px solid ${form.gender===val ? G : 'var(--border)'}`,
              background: form.gender===val ? 'rgba(212,168,67,0.15)' : 'var(--bg-input)',
              color: form.gender===val ? G : 'var(--text-muted)',
              fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--f-body)',
            }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Pays d'origine</label>
        <select value={form.country}
          onChange={(e) => setForm(f=>({...f,country:e.target.value}))}
          style={{ ...inputStyle, appearance:'none', cursor:'pointer', color: form.country ? 'var(--text)' : 'var(--text-faint)' }}>
          <option value="">Sélectionnez votre pays</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <Field label="Ville d'origine" type="text" value={form.city}
        onChange={(v) => setForm(f=>({...f,city:v}))} ph="Votre ville" />
      {error && <ErrBox msg={error} />}
      <PBtn onClick={handleSignup2} disabled={!step2OK || loading}>
        {loading ? 'Enregistrement...' : 'Créer mon compte ✨'}
      </PBtn>
    </>
  )}
</div>
);
}