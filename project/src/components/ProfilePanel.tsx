import { useState, useEffect } from 'react';
import type { UserProfile, TasteProfile, QuotaInfo, SavedTrip } from '../types/types-extended';
import {
  X, Crown, User, Map, Heart, Bell, Compass, Shield, HelpCircle,
  LogOut, ChevronRight, ChevronLeft, ToggleLeft, ToggleRight,
  Lock, Mail, MapPin, Sparkles, Camera,
  Calendar, ClipboardList, Phone
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { supabase } from '../lib/supabase';
import { LANGUAGES, type LangCode } from '../lib/i18n';
import SupportScreen from './SupportScreen';
import TasteProfileScreen from './TasteProfileScreen';
import PremiumScreen from './PremiumScreen';
import Cropper from 'react-easy-crop';
import SaveButton from './SaveButton';
import { useToast } from '../lib/toast-context';

interface Props { onClose: () => void; }

type Sub = null | 'premium' | 'profile' | 'trips' | 'tastes'
              | 'notifications' | 'language' | 'privacy'
              | 'permissions' | 'account' | 'phone';

export default function ProfilePanel({ onClose }: Props) {
    const { toast } = useToast();
const { user, signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const [sub, setSub] = useState<Sub>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showTasteEditor, setShowTasteEditor] = useState(false);
  const [tasteData, setTasteData] = useState<TasteProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [notifs, setNotifs] = useState({
    planning: true,      // notifs_planning
    review: true,        // notifs_review
    reengagement: true,  // notifs_rengagement (Inspirations hebdo)
    appReminder: true,   // notifs_app_reminder (Rappel d'app)
    promos: true,        // notifs_promos
  });
  const [perms, setPerms] = useState({ notif: false, gps: false });
  const [showPremiumScreen, setShowPremiumScreen] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('saved_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([{ data: p }, { data: pl }]) => {
      setProfile(p);
      setPlans(pl || []);
      // Les goûts sont stockés directement dans user_profiles (taste_*)
      setTaste(p);
      setTasteData(p);
      if (p) setNotifs(n => ({
        ...n,
        planning: p.notifs_planning ?? true,
        review: p.notifs_review ?? true,
        reengagement: p.notifs_rengagement ?? true,
        appReminder: p.notifs_app_reminder ?? true,
        promos: p.notifs_promos ?? true,
      }));
    });
    import('../lib/quota').then(({ getQuotaInfo }) => {
      getQuotaInfo(user.id).then(setQuota);
    });
  }, [user]);

  const save = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await supabase.from('user_profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile((p) => p ? ({ ...p, ...updates }) : null);
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Traveler';
  const initiale = displayName[0]?.toUpperCase() || 'A';
  const isPremium = profile?.is_premium === true;
  
const activeNotifs = [
  notifs.planning,
  notifs.review,
  notifs.reengagement,
  notifs.appReminder,
  notifs.promos,
].filter(Boolean).length;
  const currentLangLabel = LANGUAGES.find(l => l.code === lang)?.label || 'Français';

  // ─── SOUS-ÉCRANS ───
  if (sub) {
    return (
      <>
        <SubScreen
          sub={sub} setSub={setSub} onClose={onClose}
          t={t} lang={lang} setLang={setLang}
          profile={profile} plans={plans} taste={taste}
          notifs={notifs} setNotifs={setNotifs}
          perms={perms} setPerms={setPerms}
          save={save} user={user}
          quota={quota}
          onEditTastes={() => setShowTasteEditor(true)}
          onPremium={() => setShowPremiumScreen(true)}
        />
        {showTasteEditor && (
          <TasteProfileScreen
            isEditMode
            initialData={tasteData}
            onClose={() => setShowTasteEditor(false)}
            onSaved={async () => {
              setShowTasteEditor(false);
              if (user) {
          const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
          setTasteData(p);
          setTaste(p);
          setProfile(p);
        }
            }}
          />
        )}
        {showPremiumScreen && <PremiumScreen onClose={() => setShowPremiumScreen(false)} />}
      </>
    );
  }

  // ─── MENU PRINCIPAL ───
  return (
    <>
      <div onClick={onClose} className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9990,
      }} />
      <div className="slide-up" style={{
        position: 'fixed', inset: 0,
        maxWidth: 430, margin: '0 auto',
        background: 'var(--bg)', zIndex: 9991,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: 'var(--f-body)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0',
        }}>
          <h1 style={{
            fontFamily: 'var(--f-body)',
            fontSize: 22, fontWeight: 600,
            color: 'var(--text)',
            margin: 0, letterSpacing: '-0.01em',
          }}>
            {t('profile_title') || 'Mon compte'}
          </h1>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid rgba(244,238,223,0.12)',
            background: 'var(--bg-soft-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={18} color="var(--text-muted)" strokeWidth={1.8} />
          </button>
          
        </div>

        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '24px 20px 18px',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: profile?.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
            border: '1px solid rgba(212,168,67,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {!profile?.avatar_url && (
              <span style={{
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontSize: 26,
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
              }}>
                {initiale}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 19, fontWeight: 600,
              color: 'var(--text)',
              margin: 0, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {displayName}
            </p>
            <p style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              margin: '3px 0 0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </p>
          </div>
          
        </div>

        {/* Premium banner */}
        <button
          onClick={() => setShowPremiumScreen(true)}
          style={{
            margin: '0 20px 20px',
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(212,168,67,0.16) 0%, rgba(212,168,67,0.05) 100%)',
            border: '1px solid rgba(214,188,130,0.45)',
            borderRadius: 18,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            fontFamily: 'var(--f-body)',
          }}
        >
          <Crown size={26} color="var(--accent)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{
              fontFamily: 'var(--f-body)',
              fontSize: 16, fontWeight: 600,
              color: 'var(--accent)',
              margin: 0, letterSpacing: '-0.01em',
            }}>
              Your Trip Premium
            </p>
            <p style={{
              fontSize: 12, color: 'var(--text-muted)',
              margin: '3px 0 0',
            }}>
              Voyages illimités · lieux exclusifs
            </p>
          </div>
          <span style={{
            padding: '4px 11px', borderRadius: 999,
            background: isPremium ? 'var(--grad-logo)' : 'transparent',
            border: isPremium ? 'none' : '1px solid rgba(214,188,130,0.55)',
            color: isPremium ? '#1A1208' : 'var(--accent)',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            PRO
          </span>
        </button>

        {/* Menu items */}
        <div style={{ padding: '0 20px' }}>
          <MenuRow
            icon={<User size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Mon profil"
            onClick={() => setSub('profile')}
          />
          <MenuRow
            icon={<Map size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Mes voyages"
            meta={quota ? `${(quota.max - quota.remaining)} / ${quota.max}` : null}
            onClick={() => setSub('trips')}
          />
          <MenuRow
            icon={<Heart size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Mes goûts"
            onClick={() => setSub('tastes')}
          />
          <MenuRow
            icon={<Bell size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Notifications"
            meta={`${activeNotifs} active${activeNotifs > 1 ? 's' : ''}`}
            metaGold
            onClick={() => setSub('notifications')}
          />
          <MenuRow
            icon={<Compass size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Langue"
            meta={currentLangLabel}
            onClick={() => setSub('language')}
          />
          <MenuRow
            icon={<Shield size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Confidentialité"
            onClick={() => setSub('privacy')}
          />
          <MenuRow
            icon={<HelpCircle size={18} color="var(--text-muted)" strokeWidth={1.8} />}
            label="Support"
            onClick={() => setShowSupport(true)}
            isLast
          />
        </div>

        {/* Logout */}
        <div style={{ padding: '24px 20px 32px', marginTop: 'auto' }}>
          <button
            onClick={() => { signOut(); onClose(); }}
            style={{
              width: '100%',
              padding: '16px 18px',
              borderRadius: 999,
              background: 'var(--bg-soft-strong)',
              border: '1px solid rgba(244,238,223,0.12)',
              color: 'var(--text)',
              fontFamily: 'var(--f-body)',
              fontSize: 15, fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '-0.005em',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {showSupport && <SupportScreen onClose={() => setShowSupport(false)} />}
      {showPremiumScreen && <PremiumScreen onClose={() => setShowPremiumScreen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────
// MENU ROW
// ─────────────────────────────────────────────
function MenuRow({ icon, label, meta, metaGold, onClick, isLast }: {
  icon: React.ReactNode;
  label: string;
  meta?: string | null;
  metaGold?: boolean;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0',
        background: 'none', border: 'none',
        borderBottom: isLast ? 'none' : '1px solid rgba(244,238,223,0.08)',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'var(--f-body)',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'var(--bg-soft-strong)',
        border: '1px solid rgba(244,238,223,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        flex: 1,
        fontSize: 16, fontWeight: 500,
        color: 'var(--text)',
        letterSpacing: '-0.005em',
      }}>
        {label}
      </span>
      {meta && (
        <span style={{
          fontFamily: metaGold ? 'var(--f-mono)' : 'var(--f-body)',
          fontSize: metaGold ? 12 : 14,
          color: metaGold ? 'var(--accent)' : 'var(--text-muted)',
          letterSpacing: metaGold ? '0.05em' : '0',
        }}>
          {meta}
        </span>
      )}
      <ChevronRight size={16} color="var(--text-faint)" strokeWidth={1.8} />
    </button>
  );
}

// ═══════════════ SOUS-ÉCRANS ═══════════════
function SubScreen({ sub, setSub, onClose, t, lang, setLang, profile, plans, taste, notifs, setNotifs, perms, setPerms, save, user, quota, onEditTastes, onPremium }: any) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...profile });
  const [notifPermAlert, setNotifPermAlert] = useState(false);
  const [langConfirm, setLangConfirm] = useState<LangCode | null>(null);
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [phoneMsg, setPhoneMsg] = useState('');

 const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Image trop lourde (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input pour pouvoir re-choisir la même image
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !user) return;
    setUploading(true);
    try {
      const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from('picture')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('picture').getPublicUrl(path);
      const busted = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('user_profiles').update({ avatar_url: busted, updated_at: new Date().toISOString() }).eq('id', user.id);
      setForm((f: any) => ({ ...f, avatar_url: busted }));
      setCropImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err: any) {
      toast.error(`Échec de l'upload : ${err?.message || 'erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  };

 const back = () => {
    if (sub === 'account' || sub === 'permissions' || sub === 'phone') { setSub('privacy'); return; }
    setSub(null);
  };
  const Header = ({ title }: { title: string }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '18px 20px 14px',
    }}>
      <button onClick={back} style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '1px solid rgba(244,238,223,0.12)',
        background: 'var(--bg-soft-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
        <ChevronLeft size={18} color="var(--text-muted)" strokeWidth={1.8} />
      </button>
      <h1 style={{
        flex: 1,
        fontSize: 22, fontWeight: 600,
        color: 'var(--text)',
        margin: 0, letterSpacing: '-0.01em',
      }}>{title}</h1>
      <button onClick={onClose} style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '1px solid rgba(244,238,223,0.12)',
        background: 'var(--bg-soft-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
        <X size={18} color="var(--text-muted)" strokeWidth={1.8} />
      </button>
    </div>
  );

 const validatePolicy = (pw: string): string | null => {
    if (pw.length < 8) return 'Minimum 8 caractères';
    if (!/[A-Z]/.test(pw)) return 'Il faut une majuscule';
    if (!/[a-z]/.test(pw)) return 'Il faut une minuscule';
    if (!/[0-9]/.test(pw)) return 'Il faut un chiffre';
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/;~`]/.test(pw)) return 'Il faut un symbole (!@#$...)';
    return null;
  };

  const handlePwChange = async () => {
    setPwMsg('');
    if (!currentPw) { setPwMsg('Mot de passe actuel requis'); return; }
    if (newPw !== confirmPw) { setPwMsg('Les nouveaux mots de passe ne correspondent pas'); return; }
    const policyErr = validatePolicy(newPw);
    if (policyErr) { setPwMsg(policyErr); return; }
    if (!user?.email) return;

    // 1. Vérifier le mdp actuel via re-sign-in
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    });
    if (signErr) { setPwMsg('Mot de passe actuel incorrect'); return; }

    // 2. Mettre à jour
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwMsg(error.message); return; }

    setPwMsg(t('password_changed') || 'Mot de passe modifié ✓');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };
  return (
    <>
      <div onClick={onClose} className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9990,
      }} />
      <div className="slide-up" style={{
        position: 'fixed', inset: 0, maxWidth: 430, margin: '0 auto',
        background: 'var(--bg)', zIndex: 9991,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        fontFamily: 'var(--f-body)',
      }}>

        {/* ── MON PROFIL ── */}
        {sub === 'profile' && (
          <>
            <Header title="Mon profil" />
            <div style={{ padding: '8px 20px 32px' }}>

              {/* Avatar + Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: form?.avatar_url
                    ? `url(${form.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
                  border: '1px solid rgba(212,168,67,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {!form?.avatar_url && (
                    <span style={{
                      fontFamily: 'var(--f-display)',
                      fontStyle: 'italic',
                      fontSize: 32,
                      color: 'var(--accent)',
                    }}>
                      {(form?.display_name?.[0] || 'A').toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 13, color: 'var(--text-muted)',
                    margin: '0 0 8px',
                  }}>
                    Photo de profil
                  </p>
                  {/*
                    Sur iOS Safari, document.getElementById().click() ne déclenche pas
                    le sélecteur de fichiers de manière fiable (protection sécurité).
                    Solution : wrapper l'input dans un <label> — c'est le comportement
                    natif HTML, supporté partout sans bidouille JS.
                  */}
                  <label
                    htmlFor="avatar-upload-input"
                    style={{
                      padding: '10px 16px', borderRadius: 999,
                      background: 'var(--bg-soft-strong)',
                      border: '1px solid rgba(244,238,223,0.15)',
                      color: 'var(--text)',
                      fontFamily: 'var(--f-body)',
                      fontSize: 13, fontWeight: 500,
                      cursor: uploading ? 'wait' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      opacity: uploading ? 0.6 : 1,
                      pointerEvents: uploading ? 'none' : 'auto',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Camera size={13} strokeWidth={1.8} />
                    {uploading ? 'Envoi…' : 'Choisir une image'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    id="avatar-upload-input"
                    onChange={handlePhotoSelect}
                    disabled={uploading}
                    style={{
                      position: 'absolute',
                      width: 1, height: 1,
                      padding: 0, margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0,0,0,0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  />
                </div>
              </div>

              <FInput label="PRÉNOM" value={form?.display_name || ''} onChange={(v: string) => setForm((f: any) => ({ ...f, display_name: v }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <FInput label="VILLE" value={form?.city || ''} onChange={(v: string) => setForm((f: any) => ({ ...f, city: v }))} />
                <FInput label="PAYS" value={form?.country || ''} onChange={(v: string) => setForm((f: any) => ({ ...f, country: v }))} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Label>E-MAIL</Label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 16px',
                  background: 'var(--bg-soft)',
                  border: '1px solid rgba(244,238,223,0.08)',
                  borderRadius: 14,
                }}>
                  <span style={{ flex: 1, fontSize: 15, color: 'var(--text)' }}>{user?.email}</span>
                  <span style={{ color: 'var(--moss, #6E8A5A)' }}>✓</span>
                </div>
              </div>
              <FInput label="DATE DE NAISSANCE" type="date" value={form?.birth_date || ''} onChange={(v: string) => setForm((f: any) => ({ ...f, birth_date: v }))} />

              <div style={{
                position: 'fixed', bottom: 24, left: 20, right: 20,
                maxWidth: 390, margin: '0 auto',
              }}>
                <SaveButton
                  onSave={async () => {
                    await save({
                      display_name: form?.display_name,
                      city: form?.city,
                      country: form?.country,
                      birth_date: form?.birth_date,
                    });
                  }}
                >
                  Enregistrer
                </SaveButton>
              </div>
            </div>
          </>
        )}

        {/* ── MES VOYAGES ── */}
        {sub === 'trips' && (
          <>
            <Header title="Mes voyages" />
            <div style={{ padding: '8px 20px 32px' }}>

              {/* Quota card */}
              <div style={{
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.08)',
                borderRadius: 20,
                padding: '20px',
                marginBottom: 28,
              }}>
                {/* Header quota */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 14,
                }}>
                  <p style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 11, color: 'var(--text-muted)',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    Quota du mois
                  </p>
                  <span style={{
                    padding: '5px 14px', borderRadius: 999,
                    background: quota?.isPremium ? 'var(--grad-logo)' : 'var(--bg-soft-strong)',
                    border: quota?.isPremium ? 'none' : '1px solid rgba(244,238,223,0.15)',
                    color: quota?.isPremium ? '#1A1208' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {quota?.isPremium ? 'Premium' : 'Gratuit'}
                  </span>
                </div>

                {/* Chiffre quota */}
                <div style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                  marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{
                      fontFamily: 'var(--f-display)',
                      fontStyle: 'italic',
                      fontSize: 56,
                      color: 'var(--accent)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}>
                      {quota ? (quota.max - quota.remaining) : 0}
                    </span>
                    <span style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 22,
                      color: 'var(--text-muted)',
                      marginLeft: 4,
                    }}>
                      /{quota?.max || 7}
                    </span>
                  </div>
                  {quota?.resetDate && (
                    <p style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      margin: 0, textAlign: 'right',
                      lineHeight: 1.4,
                    }}>
                      Reset · {new Date(quota.resetDate).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{
                  height: 4,
                  background: 'var(--stroke-soft)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: quota?.isPremium ? 0 : 16,
                }}>
                  <div style={{
                    height: '100%',
                    width: quota ? `${((quota.max - quota.remaining) / quota.max) * 100}%` : '0%',
                    background: 'var(--grad-logo)',
                    borderRadius: 999,
                    transition: 'width 400ms',
                  }} />
                </div>

                {/* CTA Premium */}
                {!quota?.isPremium && (
                  <button
                    onClick={onPremium}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(214,188,130,0.06)',
                      border: '1px solid rgba(214,188,130,0.30)',
                      borderRadius: 14,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontFamily: 'var(--f-body)',
                    }}
                  >
                    <Sparkles size={14} color="var(--accent)" strokeWidth={2} />
                    <span style={{
                      flex: 1, textAlign: 'left',
                      fontSize: 13, color: 'var(--text)',
                      letterSpacing: '-0.005em',
                    }}>
                      Passe en Premium pour 40 voyages / mois
                    </span>
                    <ChevronRight size={14} color="var(--accent)" strokeWidth={1.8} />
                  </button>
                )}
              </div>

              {/* RÉCENTS */}
              {plans.length > 0 && (
                <>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 14,
                  }}>
                    <p style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 11, color: 'var(--text-muted)',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}>
                      Récents
                    </p>
                    <span style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 12, color: 'var(--text-faint)',
                    }}>
                      {plans.length}
                    </span>
                  </div>

                  {plans.slice(0, 10).map((p: any) => {
                    const data = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data;
                    const date = new Date(p.created_at);
                    const today = new Date();
                    const isToday = date.toDateString() === today.toDateString();
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: 14,
                        background: 'var(--bg-soft)',
                        border: '1px solid rgba(244,238,223,0.08)',
                        borderRadius: 16,
                        marginBottom: 10,
                        cursor: 'pointer',
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 12,
                          background: `
                            linear-gradient(135deg, rgba(155,125,154,0.10) 0%, rgba(214,188,130,0.05) 100%),
                            repeating-linear-gradient(45deg, transparent 0 6px, rgba(214,188,130,0.04) 6px 12px)
                          `,
                          border: '1px solid rgba(244,238,223,0.08)',
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 18, opacity: 0.4 }}>↳</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{
                              fontSize: 17, fontWeight: 600,
                              color: 'var(--text)',
                              margin: 0, letterSpacing: '-0.01em',
                            }}>
                              {data?.city || 'Voyage'}
                            </p>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '3px 9px', borderRadius: 999,
                              background: isToday ? 'rgba(214,188,130,0.06)' : 'rgba(197,123,94,0.10)',
                              border: `1px solid ${isToday ? 'rgba(214,188,130,0.30)' : 'rgba(197,123,94,0.30)'}`,
                              color: isToday ? 'var(--accent)' : '#C57B5E',
                              fontSize: 10, fontWeight: 600,
                            }}>
                              <span style={{
                                width: 5, height: 5, borderRadius: '50%',
                                background: isToday ? 'var(--accent)' : '#C57B5E',
                              }} />
                              {isToday ? "Aujourd'hui" : 'Brouillon'}
                            </span>
                          </div>
                          <p style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.08em',
                            margin: 0,
                          }}>
                            {date.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <ChevronRight size={16} color="var(--text-faint)" strokeWidth={1.8} />
                      </div>
                    );
                  })}

                  <p style={{
                    fontFamily: 'var(--f-display)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--text-faint)',
                    textAlign: 'center',
                    margin: '24px 0 0',
                    letterSpacing: '-0.01em',
                  }}>
                    Et tant d'autres horizons à imaginer…
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {/* ── MES GOÛTS ── */}
        {sub === 'tastes' && (
          <>
            <Header title="Mes goûts" />
            <div style={{ padding: '8px 20px 32px' }}>
              <button
                onClick={onEditTastes}
                style={{
                  width: '100%', padding: '14px 18px', marginBottom: 28,
                  background: 'var(--grad-logo)',
                  color: '#1A1208',
                  border: 'none', borderRadius: 999,
                  fontFamily: 'var(--f-body)',
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                  letterSpacing: '-0.005em',
                }}
              >
                Modifier mes goûts
              </button>

              {!taste?.taste_completed ? (
                <Empty text="Tu n'as pas encore défini tes goûts. Clique sur Modifier pour commencer." />
              ) : (
                <>
                  <TasteSection label="Ambiances" items={taste?.taste_vibes} />
                  <TasteSection label="Expériences" items={taste?.taste_experiences} />
                  <TasteSection label="Type de lieux" items={taste?.taste_place_pref} />
                  <TasteSection label="Mobilité" items={taste?.taste_mobility} />
                  {taste?.taste_budget && (
                    <TasteSection label="Budget" items={[taste.taste_budget]} />
                  )}
                  {taste?.taste_discovery && (
                    <TasteSection label="Découverte" items={[taste.taste_discovery]} />
                  )}
                  {taste?.taste_flexibility && (
                    <TasteSection label="Flexibilité" items={[taste.taste_flexibility]} />
                  )}
                  {taste?.taste_free_text && (
                    <>
                      <Label>Tes mots</Label>
                      <p style={{
                        fontFamily: 'var(--f-display)',
                        fontStyle: 'italic',
                        fontSize: 16,
                        color: 'var(--text)',
                        lineHeight: 1.5,
                        margin: '0 0 20px',
                        padding: '14px 16px',
                        background: 'var(--bg-soft)',
                        border: '1px solid rgba(244,238,223,0.08)',
                        borderRadius: 14,
                        letterSpacing: '-0.005em',
                      }}>
                        « {taste.taste_free_text} »
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── NOTIFICATIONS ── */}
        {sub === 'notifications' && (
          <>
            <Header title="Notifications" />
            <div style={{ padding: '8px 20px 32px' }}>

              {/* Bandeau si permission OFF */}
              {!perms.notif && (
                <button
                  onClick={() => setSub('permissions')}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: 'rgba(197,123,94,0.10)',
                    border: '1px solid rgba(197,123,94,0.40)',
                    borderRadius: 14,
                    marginBottom: 18,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--f-body)',
                  }}
                >
                  <Bell size={18} color="#E0A37A" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600,
                      color: '#E0A37A',
                      margin: 0, letterSpacing: '-0.005em',
                    }}>
                      {t('notifs_perm_disabled_title')}
                    </p>
                    <p style={{
                      fontSize: 12, color: 'var(--text-muted)',
                      margin: '2px 0 0', lineHeight: 1.4,
                    }}>
                      {t('notifs_perm_disabled_banner')}
                    </p>
                  </div>
                  <ChevronRight size={16} color="#E0A37A" strokeWidth={1.8} />
                </button>
              )}

              <NotifSection label="Pendant le voyage" />
              <NotifRow
                icon={<MapPin size={18} color="var(--accent)" strokeWidth={1.8} />}
                label="Rappels d'activités"
                desc="15 min avant chaque étape"
                value={notifs.planning}
                disabled={!perms.notif}
                onToggle={() => {
                  if (!perms.notif) { setNotifPermAlert(true); return; }
                  const v = !notifs.planning; setNotifs({ ...notifs, planning: v }); save({ notifs_planning: v });
                }}
              />
              <NotifRow
                icon={<Heart size={18} color="var(--accent)" strokeWidth={1.8} />}
                label="Fin de journée"
                desc="Un récap doux le soir"
                value={notifs.review}
                disabled={!perms.notif}
                onToggle={() => {
                  if (!perms.notif) { setNotifPermAlert(true); return; }
                  const v = !notifs.review; setNotifs({ ...notifs, review: v }); save({ notifs_review: v });
                }}
                isLast
              />

              <NotifSection label="Engagement" />
              <NotifRow
                icon={<Sparkles size={18} color="var(--accent)" strokeWidth={1.8} />}
                label="Inspirations hebdo"
                desc="Une destination le dimanche"
                value={notifs.reengagement}
                disabled={!perms.notif}
                onToggle={() => {
                  if (!perms.notif) { setNotifPermAlert(true); return; }
                  const v = !notifs.reengagement; setNotifs({ ...notifs, reengagement: v }); save({ notifs_rengagement: v });
                }}
              />
              <NotifRow
                icon={<Bell size={18} color="var(--accent)" strokeWidth={1.8} />}
                label="Rappel d'app"
                desc="Tous les 7 jours sans usage"
                value={notifs.appReminder}
                disabled={!perms.notif}
                onToggle={() => {
                  if (!perms.notif) { setNotifPermAlert(true); return; }
                  const v = !notifs.appReminder; setNotifs({ ...notifs, appReminder: v }); save({ notifs_app_reminder: v });
                }}
              />
              <NotifRow
                icon={<ClipboardList size={18} color="var(--accent)" strokeWidth={1.8} />}
                label="Promotions"
                desc="Offres et nouveautés"
                value={notifs.promos}
                disabled={!perms.notif}
                onToggle={() => {
                  if (!perms.notif) { setNotifPermAlert(true); return; }
                  const v = !notifs.promos; setNotifs({ ...notifs, promos: v }); save({ notifs_promos: v });
                }}
                isLast
              />

              {/* Modal d'alerte au clic sur un toggle désactivé */}
              {notifPermAlert && (
                <div style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 20,
                }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(214,188,130,0.25)',
                    borderRadius: 20, padding: 24, maxWidth: 340, width: '100%',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
                      border: '1px solid rgba(212,168,67,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14,
                    }}>
                      <Bell size={22} color="var(--accent)" strokeWidth={1.8} />
                    </div>
                    <h3 style={{
                      fontFamily: 'var(--f-display)',
                      fontStyle: 'italic',
                      fontSize: 22, fontWeight: 400,
                      color: 'var(--text)',
                      margin: '0 0 8px', letterSpacing: '-0.015em',
                    }}>
                      {t('notifs_perm_disabled_title')}
                    </h3>
                    <p style={{
                      fontSize: 14, color: 'var(--text-muted)',
                      lineHeight: 1.55, margin: '0 0 20px',
                    }}>
                      {t('notifs_perm_disabled_modal_desc')}
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setNotifPermAlert(false)} style={{
                        flex: 1, padding: 13, borderRadius: 999,
                        background: 'transparent',
                        border: '1px solid rgba(244,238,223,0.15)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        {t('cancel')}
                      </button>
                      <button onClick={() => { setNotifPermAlert(false); setSub('permissions'); }} style={{
                        flex: 1, padding: 13, borderRadius: 999,
                        background: 'var(--grad-logo)',
                        color: '#1A1208', border: 'none',
                        fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(212,168,67,0.25)',
                      }}>
                        {t('notifs_perm_go_to')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── LANGUE ── */}
        {sub === 'language' && (
          <>
            <Header title="Langue" />
            <div style={{ padding: '0 20px 32px' }}>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)',
                lineHeight: 1.55, marginBottom: 22,
              }}>
                Choisis la langue de l'application. La langue des contenus de voyage suivra automatiquement.
              </p>

              {LANGUAGES.map(l => {
                const active = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => { if (l.code !== lang) setLangConfirm(l.code); }}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 0',
                      background: 'none', border: 'none',
                      borderBottom: '1px solid rgba(244,238,223,0.08)',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--f-body)',
                    }}
                  >
                    {/* Code badge */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: active ? 'rgba(214,188,130,0.06)' : 'var(--bg-soft-strong)',
                      border: `1px solid ${active ? 'rgba(214,188,130,0.55)' : 'var(--stroke-soft)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: active ? '0 0 20px rgba(212,168,67,0.12)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        letterSpacing: '0.05em',
                      }}>
                        {l.code.toUpperCase()}
                      </span>
                    </div>

                    {/* Label + sub */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 17, fontWeight: 600,
                        color: active ? 'var(--accent)' : 'var(--text)',
                        margin: 0, letterSpacing: '-0.005em',
                      }}>
                        {l.label}
                      </p>
                      <p style={{
                        fontSize: 12, color: 'var(--text-muted)',
                        margin: '2px 0 0',
                      }}>
                        {active ? 'Langue actuelle' : (l.code === 'en' ? 'United Kingdom · USA' : l.code === 'es' ? 'España · Latinoamérica' : l.code === 'de' ? 'Deutschland · Österreich' : l.code === 'pt' ? 'Portugal · Brasil' : '')}
                      </p>
                    </div>

                    {/* Check or ghost */}
                    {active && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--grad-logo)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: '#1A1208', fontWeight: 700, fontSize: 14 }}>✓</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {langConfirm && (
                <div style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 20,
                }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(214,188,130,0.25)',
                    borderRadius: 20, padding: 24, maxWidth: 340, width: '100%',
                  }}>
                    <h3 style={{
                      fontFamily: 'var(--f-display)',
                      fontStyle: 'italic',
                      fontSize: 22, fontWeight: 400,
                      color: 'var(--text)',
                      margin: '0 0 8px', letterSpacing: '-0.015em',
                    }}>
                      {t('lang_confirm_title')}
                    </h3>
                    <p style={{
                      fontSize: 14, color: 'var(--text-muted)',
                      lineHeight: 1.55, margin: '0 0 20px',
                    }}>
                      {t('lang_confirm_text')}
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setLangConfirm(null)} style={{
                        flex: 1, padding: 13, borderRadius: 999,
                        background: 'transparent',
                        border: '1px solid rgba(244,238,223,0.15)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        {t('cancel')}
                      </button>
                      <button onClick={() => { setLang(langConfirm); setLangConfirm(null); }} style={{
                        flex: 1, padding: 13, borderRadius: 999,
                        background: 'var(--grad-logo)',
                        color: '#1A1208', border: 'none',
                        fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(212,168,67,0.25)',
                      }}>
                        {t('confirm')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

       {/* ── CONFIDENTIALITÉ ── */}
        {sub === 'privacy' && (
          <>
            <Header title="Confidentialité" />
            <div style={{ padding: '0 20px' }}>
              <MenuRow
                icon={<MapPin size={18} color="var(--text-muted)" strokeWidth={1.8} />}
                label={t('privacy_permissions')}
                onClick={() => setSub('permissions')}
              />
              <MenuRow
                icon={<Phone size={18} color="var(--text-muted)" strokeWidth={1.8} />}
                label="Numéro de téléphone"
                onClick={() => setSub('phone')}
              />
              <MenuRow
                icon={<Lock size={18} color="var(--text-muted)" strokeWidth={1.8} />}
                label={t('privacy_account')}
                onClick={() => setSub('account')}
                isLast
              />
            </div>
          </>
        )}

        {/* ── PERMISSIONS ── */}
        {sub === 'permissions' && (
          <>
            <Header title={t('privacy_permissions')} />
            <div style={{ padding: '8px 20px 32px' }}>
              <NotifRow
                icon={<Bell size={18} color="var(--accent)" strokeWidth={1.8} />}
                label={t('perm_notif')}
                value={perms.notif}
                onToggle={async () => {
                  const v = !perms.notif;
                  if (v && 'Notification' in window) await Notification.requestPermission();
                  setPerms({ ...perms, notif: v });
                }}
              />
              <NotifRow
                icon={<MapPin size={18} color="var(--accent)" strokeWidth={1.8} />}
                label={t('perm_gps')}
                value={perms.gps}
                onToggle={() => {
                  const v = !perms.gps;
                  if (v && 'geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(() => {}, () => {});
                  }
                  setPerms({ ...perms, gps: v });
                }}
                isLast
              />
            </div>
          </>
        )}

       {/* ── MON COMPTE ── */}
        {sub === 'account' && (
          <>
            <Header title={t('privacy_account')} />
            <div style={{ padding: '8px 20px 32px' }}>
              <div style={{ marginBottom: 24 }}>
                <Label>{t('account_email')}</Label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px',
                  background: 'var(--bg-soft)',
                  border: '1px solid rgba(244,238,223,0.08)',
                  borderRadius: 14,
                }}>
                  <Mail size={16} color="var(--text-faint)" strokeWidth={1.8} />
                  <span style={{ fontSize: 14, color: 'var(--text)' }}>{user?.email}</span>
                </div>
              </div>

              <Label>{t('change_password')}</Label>
              <FInput label="Mot de passe actuel" type="password" value={currentPw} onChange={setCurrentPw} />
              <FInput label="Nouveau mot de passe" type="password" value={newPw} onChange={setNewPw} />
              <FInput label="Confirmer le nouveau mot de passe" type="password" value={confirmPw} onChange={setConfirmPw} />

              <p style={{
                fontFamily: 'var(--f-body)', fontSize: 11,
                color: 'var(--text-muted)', margin: '-4px 0 18px', lineHeight: 1.5,
                padding: '8px 12px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.06)',
                borderRadius: 10,
              }}>
                Au moins 8 caractères, avec majuscule, minuscule, chiffre et symbole (!@#$...).
              </p>

              {pwMsg && (
                <p style={{
                  fontSize: 13, marginBottom: 16,
                  color: pwMsg.includes('✓') ? '#6E8A5A' : '#C57B5E',
                  fontWeight: 600,
                }}>
                  {pwMsg}
                </p>
              )}

              <SaveButton
                onSave={async () => { await handlePwChange(); }}
              >
                {t('save')}
              </SaveButton>
            </div>
          </>
        )}

        {/* ── NUMÉRO DE TÉLÉPHONE ── */}
        {sub === 'phone' && (
          <>
            <Header title="Numéro de téléphone" />
            <div style={{ padding: '8px 20px 32px' }}>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)',
                lineHeight: 1.55, marginBottom: 22,
              }}>
                Ton numéro reste privé. Il pourra servir aux confirmations de réservation et alertes critiques.
              </p>

              <FInput
                label="Numéro de téléphone"
                type="tel"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />

              <p style={{
                fontSize: 11, color: 'var(--text-muted)',
                margin: '-4px 0 18px', lineHeight: 1.5,
                padding: '8px 12px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.06)',
                borderRadius: 10,
              }}>
                Format international recommandé : +33 6 12 34 56 78
              </p>

              {phoneMsg && (
                <p style={{
                  fontSize: 13, marginBottom: 16,
                  color: phoneMsg.includes('✓') ? '#6E8A5A' : '#C57B5E',
                  fontWeight: 600,
                }}>
                  {phoneMsg}
                </p>
              )}

              <SaveButton
                onSave={async () => {
                  setPhoneMsg('');
                  const cleaned = (phoneNumber || '').replace(/[\s\-().]/g, '');
                  if (cleaned && !/^\+?[0-9]{8,15}$/.test(cleaned)) {
                    setPhoneMsg('Numéro invalide');
                    throw new Error('invalid_phone');
                  }
                  await save({ phone_number: phoneNumber || null });
                }}
              >
                Enregistrer
              </SaveButton>
            </div>
          </>
        )}
      </div>
      {cropImageSrc && (
          <div className="fade-in" style={{
            position: 'fixed', inset: 0,
            background: 'var(--bg)',
            zIndex: 9996,
            maxWidth: 430, margin: '0 auto',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'var(--f-body)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px',
              borderBottom: '1px solid rgba(244,238,223,0.08)',
            }}>
              <button
                onClick={() => { setCropImageSrc(null); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                disabled={uploading}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 15,
                  fontFamily: 'var(--f-body)', padding: 0,
                }}
              >
                Annuler
              </button>
              <h2 style={{
                fontSize: 16, fontWeight: 600, color: 'var(--text)',
                margin: 0, letterSpacing: '-0.005em',
              }}>
                Ajuster la photo
              </h2>
              <button
                onClick={handleCropSave}
                disabled={uploading}
                style={{
                  background: 'none', border: 'none',
                  cursor: uploading ? 'wait' : 'pointer',
                  color: 'var(--accent)', fontSize: 15, fontWeight: 700,
                  fontFamily: 'var(--f-body)', padding: 0,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'Envoi…' : 'Enregistrer'}
              </button>
            </div>

            {/* Cropper */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: any, areaPixels: any) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            {/* Zoom slider */}
            <div style={{ padding: '20px 24px 28px' }}>
              <p style={{
                fontFamily: 'var(--f-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: '0.22em',
                textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center',
              }}>
                Zoom
              </p>
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                }}
              />
              <p style={{
                fontSize: 12, color: 'var(--text-muted)',
                textAlign: 'center', margin: '14px 0 0',
              }}>
                Pince pour zoomer · glisse pour cadrer
              </p>
            </div>
          </div>
        )}
    </>
  );
}

// ─── Mini-composants ───
function FInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '14px 16px',
          background: 'var(--bg-soft)',
          border: '1px solid rgba(244,238,223,0.08)',
          borderRadius: 14,
          color: 'var(--text)',
          fontFamily: 'var(--f-body)',
          fontSize: 15,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--f-mono)',
      fontSize: 11, color: 'var(--text-muted)',
      letterSpacing: '0.22em', textTransform: 'uppercase',
      margin: '0 0 8px',
    }}>{children}</p>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: 'var(--f-display)', fontStyle: 'italic',
      fontSize: 14, color: 'var(--text-faint)',
      margin: '0 0 16px',
    }}>{text}</p>
  );
}
function TasteSection({ label, items }: { label: string; items?: string[] | null }) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, i) => (
          <span key={i} style={{
            padding: '7px 14px', borderRadius: 999,
            background: 'rgba(214,188,130,0.06)',
            border: '1px solid rgba(214,188,130,0.30)',
            color: 'var(--accent)',
            fontFamily: 'var(--f-body)',
            fontSize: 12, fontWeight: 600,
            letterSpacing: '-0.005em',
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
function NotifSection({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: 'var(--f-mono)',
      fontSize: 11, color: 'var(--text-muted)',
      letterSpacing: '0.22em', textTransform: 'uppercase',
      margin: '20px 0 12px',
    }}>{label}</p>
  );
}

function NotifRow({ icon, label, desc, value, onToggle, isLast, disabled }: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0',
      borderBottom: isLast ? 'none' : '1px solid rgba(244,238,223,0.08)',
      fontFamily: 'var(--f-body)',
      opacity: disabled ? 0.45 : 1,
      transition: 'opacity 200ms ease',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
        border: '1px solid rgba(212,168,67,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 15, fontWeight: 600,
          color: 'var(--text)',
          margin: 0, letterSpacing: '-0.005em',
        }}>{label}</p>
        {desc && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)',
            margin: '2px 0 0',
          }}>{desc}</p>
        )}
      </div>
      <button onClick={onToggle} style={{
        background: 'none', border: 'none',
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center',
      }}>
        {value && !disabled
          ? <ToggleRight size={36} style={{ color: 'var(--accent)' }} strokeWidth={1.2} />
          : <ToggleLeft size={36} style={{ color: 'var(--text-faint)' }} strokeWidth={1.2} />}
      </button>
    </div>
  );
}

async function getCroppedImageBlob(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image load failed'));
  });

  // Limiter la taille finale à 400×400 pour un avatar (compression côté client)
  // Avant : un crop sur photo 4000×4000 produisait un blob de plusieurs Mo
  const MAX_SIZE = 400;
  const scale = Math.min(1, MAX_SIZE / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  // Lissage haute qualité pour le downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outW, outH,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas blob failed')), 'image/jpeg', 0.85);
  });
}

