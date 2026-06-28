import { useAuth } from '../lib/auth-context';
import { createUserProfile, checkProfileComplete } from '../lib/auth';
import { useLang } from '../lib/lang-context';
import { useState, useEffect } from 'react';

// Helper pour extraire le message d'une erreur typée unknown
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Erreur inconnue';
}

import Logo from './Logo'; 

type Mode = 'choice' | 'login' | 'signup1' | 'verify_otp' | 'signup2' | 'forgot1' | 'forgot2';

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

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBlock:4 }}>
      <div style={{ flex:1, height:1, background:'var(--border)' }} />
      <span style={{ fontSize:12, color:'var(--text-faint)' }}>{label}</span>
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
  const { signIn, signUp, signInWithGoogle, verifyOtp, resendOtp, requestPasswordReset, resetPassword } = useAuth();
  const { t } = useLang();

  const [mode, setMode]     = useState<Mode>('choice');
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [userId, setUid]    = useState<string | null>(null);
  const [form, setForm]     = useState({ displayName:'', birthDate:'', gender:'', country:'', city:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [newPw, setNewPw] = useState('');

  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  const friendly = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials'))     return t('auth_err_invalid_credentials');
    if (m.includes('already registered'))            return t('auth_err_already_registered');
    if (m.includes('password should contain'))       return t('auth_err_weak_password_full');
    if (m.includes('at least') && m.includes('characters')) return t('auth_err_password_too_short');
    if (m.includes('weak password'))                 return t('auth_err_weak_password_short');
    if (m.includes('rate limit'))                    return t('auth_err_rate_limit');
    if (m.includes('user not found'))                return t('auth_err_user_not_found');
    if (m.includes('row-level security'))            return t('auth_err_rls');
    if (m.includes('server error') || m.includes('500')) return t('auth_err_server');
    if (m.includes('invalid email'))                 return t('auth_err_invalid_email');
    // Erreur inconnue : message générique côté user + alerte Discord côté admin
    import('../lib/alert').then(({ sendAlert }) => {
      sendAlert('Erreur auth inconnue', {
        email: email || 'unknown',
        rawError: msg,
      }, 'warning');
    });
    return t('auth_err_generic');
  };

  const handleGoogle = async () => {
    setError(null);
    try { await signInWithGoogle(); }
    catch (e: unknown) { setError(getErrorMessage(e)); }
  };

  const handleLogin = async () => {
    setError(null); setLoading(true);
    try { await signIn(email.trim(), pw); onSuccess(); }
    catch (e: unknown) { setError(friendly(getErrorMessage(e))); }
    finally { setLoading(false); }
  };

  const handleSignup1 = async () => {
    setError(null); setLoading(true);
    try {
      const { user, session } = await signUp(email.trim(), pw);
      console.log('DEBUG signUp result:', { user: !!user, session: !!session });
      if (!user) throw new Error('Erreur création compte');

      // Cas 1: session immédiate (confirm email désactivé) → on saute l'OTP
      if (session) {
        const complete = await checkProfileComplete(user.id);
        if (complete) { onSuccess(); return; }
        setUid(user.id);
        setMode('signup2');
        return;
      }

      // Cas 2: confirm email activé → on passe par l'OTP
      setUid(user.id);
      setOtpTimer(60);
      setMode('verify_otp');
    } catch (e: unknown) { setError(friendly(getErrorMessage(e))); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setError(null); setLoading(true);
    try {
      await verifyOtp(email.trim(), otpCode.trim());
      setMode('signup2');
    } catch (e: unknown) {
      setError(t('auth_err_otp_invalid'));
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      await resendOtp(email.trim());
      setOtpTimer(60);
      setOtpCode('');
    } catch (e: unknown) { setError(friendly(getErrorMessage(e))); }
  };

  const handleForgotRequest = async () => {
    setError(null); setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setOtpTimer(60);
      setOtpCode('');
      setMode('forgot2');
    } catch (e: unknown) { setError(friendly(getErrorMessage(e))); }
    finally { setLoading(false); }
  };

  const handleForgotReset = async () => {
    setError(null); setLoading(true);
    try {
      await resetPassword(email.trim(), otpCode.trim(), newPw);
      setError(null);
      setNewPw('');
      setOtpCode('');
      setMode('login');
    } catch (e: unknown) {
      setError(friendly(getErrorMessage(e)) || t('auth_err_reset_invalid'));
    } finally { setLoading(false); }
  };

  const handleSignup2 = async () => {
    if (!userId) return;
    setError(null); setLoading(true);
    try {
      await createUserProfile(userId, form);
      onSuccess();
    } catch (e: unknown) { setError(friendly(getErrorMessage(e))); }
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo.Icon size={72} />
        </div>
        <div style={{ marginBottom: 6 }}>
          <Logo.Wordmark size={34} />
        </div>
        
      </div>

      {(mode==='signup1'||mode==='signup2') && (
        <div style={{ marginBottom:28 }}>
          <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-faint)' }}>
            {t('auth_step_progress').replace('{n}', mode==='signup1' ? '1' : '2')}
          </span>
          <div style={{ height:2, background:'var(--bg-elevated)', borderRadius:2, marginTop:6 }}>
            <div style={{ height:'100%', width:mode==='signup1'?'50%':'100%', background:G, borderRadius:2, transition:'width 300ms' }} />
          </div>
        </div>
      )}

      {mode === 'choice' ? (
  <p style={{
    fontFamily: 'var(--f-display)',
    fontStyle: 'italic',
    fontSize: 17,
    color: 'var(--text-muted)',
    letterSpacing: '0.3px',
  }}>
    {t('auth_subtitle_choice')}
  </p>
) : (
  <p style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--text-muted)' }}>
    {mode==='verify_otp'  && t('auth_subtitle_verify_otp')}
    {mode==='login'       && t('auth_subtitle_login')}
    {mode==='signup1'     && t('auth_subtitle_signup1')}
    {mode==='signup2'     && t('auth_subtitle_signup2')}
    {mode==='forgot1'     && t('auth_subtitle_forgot1')}
    {mode==='forgot2'     && t('auth_subtitle_forgot2')}
  </p>
)}

{mode==='choice' && (
  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
    <button onClick={handleGoogle} style={{
      width:'100%', padding:16, background:'var(--bg-elevated)',
      border:'1px solid var(--border)', borderRadius:14,
      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      color:'var(--text)', fontSize:15, fontWeight:500, cursor:'pointer',
    }}>
      {GOOGLE_SVG} {t('auth_continue_google')}
    </button>
    <Divider label={t('auth_divider_or')} />
    <PBtn onClick={() => setMode('signup1')}>{t('auth_create_account_btn')}</PBtn>
    <SBtn onClick={() => setMode('login')}>{t('auth_have_account_btn')}</SBtn>
  </div>
)}

      {mode==='login' && (
        <>
          <Field label={t('auth_email_label')} type="email" value={email} onChange={setEmail} ph={t('auth_email_placeholder')} />
          <Field label={t('auth_password_label')} type="password" value={pw} onChange={setPw} ph={t('auth_password_placeholder_login')} />
          {error && <ErrBox msg={error} />}
          <PBtn onClick={handleLogin} disabled={loading||!email||!pw}>
            {loading ? t('auth_loading_login') : t('auth_login_btn')}
          </PBtn>
          <Ghost onClick={() => { setMode('forgot1'); setError(null); }}>{t('auth_forgot_password_link')}</Ghost>
          <Ghost onClick={() => { setMode('signup1'); setError(null); }}>{t('auth_no_account_link')}</Ghost>
          <Ghost onClick={() => setMode('choice')}>{t('auth_back_link')}</Ghost>
        </>
      )}

      {mode==='signup1' && (
        <>
          <Field label={t('auth_email_label')} type="email" value={email} onChange={setEmail} ph={t('auth_email_placeholder')} />
          <Field label={t('auth_password_label')} type="password" value={pw} onChange={setPw} ph={t('auth_password_placeholder_signup')} />
          <div style={{
            fontSize: 11, color: 'var(--text-faint)',
            marginTop: -8, marginBottom: 14, lineHeight: 1.5,
            fontFamily: 'var(--f-body)',
          }}>
            {t('auth_password_rules')}
          </div>
          {error && <ErrBox msg={error} />}
          <PBtn onClick={handleSignup1} disabled={loading||!email||!pw}>
            {loading ? t('auth_loading_signup') : t('auth_signup_continue_btn')}
          </PBtn>
          <Ghost onClick={() => { setMode('login'); setError(null); }}>{t('auth_have_account_btn')}</Ghost>
          <Ghost onClick={() => setMode('choice')}>{t('auth_back_link')}</Ghost>
        </>
      )}

      {mode==='verify_otp' && (
        <>
          <p style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--text-muted)', marginBottom:20, textAlign:'center' }}>
            {t('auth_otp_intro')}<br/>
            <strong style={{ color:'var(--text)' }}>{email}</strong>
          </p>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>{t('auth_otp_code_label')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,8))}
              placeholder="00000000"
              maxLength={8}
              autoFocus
              style={{
                ...inputStyle,
                textAlign:'center',
                fontSize:28,
                letterSpacing:'12px',
                fontWeight:700,
              }}
            />
          </div>

          {error && <ErrBox msg={error} />}

          <PBtn onClick={handleVerifyOtp} disabled={loading || otpCode.length !== 8}>
            {loading ? t('auth_loading_verify') : t('auth_verify_btn')}
          </PBtn>

          <button
            onClick={handleResendOtp}
            disabled={otpTimer > 0}
            style={{
              background:'none', border:'none',
              color: otpTimer > 0 ? 'var(--text-faint)' : G,
              fontSize:13, width:'100%', padding:'8px 0', textAlign:'center',
              display:'block', marginBottom:4,
              cursor: otpTimer > 0 ? 'not-allowed' : 'pointer',
              fontFamily:'var(--f-body)',
              opacity: otpTimer > 0 ? 0.5 : 1,
            }}
          >
            {otpTimer > 0
              ? t('auth_resend_in_seconds').replace('{n}', String(otpTimer))
              : t('auth_resend_btn')}
          </button>
          <Ghost onClick={() => { setMode('signup1'); setError(null); setOtpCode(''); }}>
            {t('auth_change_email_link')}
          </Ghost>
        </>
      )}

      {mode==='forgot1' && (
        <>
          <p style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--text-muted)', marginBottom:20, textAlign:'center' }}>
            {t('auth_forgot1_intro')}
          </p>
          <Field label={t('auth_email_label')} type="email" value={email} onChange={setEmail} ph={t('auth_email_placeholder')} />
          {error && <ErrBox msg={error} />}
          <PBtn onClick={handleForgotRequest} disabled={loading || !email}>
            {loading ? t('auth_loading_send') : t('auth_send_code_btn')}
          </PBtn>
          <Ghost onClick={() => { setMode('login'); setError(null); }}>{t('auth_back_link')}</Ghost>
        </>
      )}

      {mode==='forgot2' && (
        <>
          <p style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--text-muted)', marginBottom:20, textAlign:'center' }}>
            {t('auth_forgot2_intro_1')}<br/>
            <strong style={{ color:'var(--text)' }}>{email}</strong><br/>
            {t('auth_forgot2_intro_2')}
          </p>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>{t('auth_otp_code_label')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,8))}
              placeholder="00000000"
              maxLength={8}
              autoFocus
              style={{
                ...inputStyle,
                textAlign:'center',
                fontSize:28,
                letterSpacing:'12px',
                fontWeight:700,
              }}
            />
          </div>

          <Field label={t('auth_new_password_label')} type="password" value={newPw} onChange={setNewPw} ph={t('auth_password_placeholder_signup')} />
          <div style={{
            fontSize: 11, color: 'var(--text-faint)',
            marginTop: -8, marginBottom: 14, lineHeight: 1.5,
            fontFamily: 'var(--f-body)',
          }}>
            {t('auth_password_rules')}
          </div>

          {error && <ErrBox msg={error} />}

          <PBtn onClick={handleForgotReset} disabled={loading || otpCode.length !== 8 || !newPw}>
            {loading ? t('auth_loading_reset') : t('auth_reset_btn')}
          </PBtn>

          <button
            onClick={handleForgotRequest}
            disabled={otpTimer > 0 || loading}
            style={{
              background:'none', border:'none',
              color: otpTimer > 0 ? 'var(--text-faint)' : G,
              fontSize:13, width:'100%', padding:'8px 0', textAlign:'center',
              display:'block', marginBottom:4,
              cursor: otpTimer > 0 ? 'not-allowed' : 'pointer',
              fontFamily:'var(--f-body)',
              opacity: otpTimer > 0 ? 0.5 : 1,
            }}
          >
            {otpTimer > 0
              ? t('auth_resend_in_seconds').replace('{n}', String(otpTimer))
              : t('auth_resend_btn')}
          </button>

          <Ghost onClick={() => { setMode('login'); setError(null); setOtpCode(''); setNewPw(''); }}>
            {t('auth_cancel_link')}
          </Ghost>
        </>
      )}

      {mode==='signup2' && (
        <>
          <p style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--text-muted)', marginBottom:20, textAlign:'center' }}>
            {t('auth_signup2_intro')}
          </p>
          <Field label={t('auth_firstname_label')} type="text" value={form.displayName}
            onChange={(v) => setForm(f=>({...f,displayName:v}))} ph={t('auth_firstname_placeholder')} />
          <Field label={t('auth_birthdate_label')} type="date" value={form.birthDate}
            onChange={(v) => setForm(f=>({...f,birthDate:v}))} ph="" />
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>{t('auth_gender_label')}</label>
            <div style={{ display:'flex', gap:8 }}>
              {[
                [t('auth_gender_male'),'masculin'],
                [t('auth_gender_female'),'féminin'],
                [t('auth_gender_other'),'non précisé'],
              ].map(([lbl,val]) => (
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
            <label style={labelStyle}>{t('auth_country_label')}</label>
            <select value={form.country}
              onChange={(e) => setForm(f=>({...f,country:e.target.value}))}
              style={{ ...inputStyle, appearance:'none', cursor:'pointer', color: form.country ? 'var(--text)' : 'var(--text-faint)' }}>
              <option value="">{t('auth_country_placeholder')}</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label={t('auth_city_label')} type="text" value={form.city}
            onChange={(v) => setForm(f=>({...f,city:v}))} ph={t('auth_city_placeholder')} />
          {error && <ErrBox msg={error} />}
          <PBtn onClick={handleSignup2} disabled={!step2OK || loading}>
            {loading ? t('auth_loading_create') : t('auth_create_account_final_btn')}
          </PBtn>
        </>
      )}
    </div>
  );
}
