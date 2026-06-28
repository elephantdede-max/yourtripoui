import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './lib/auth-context';
import { useLang } from './lib/lang-context';
import { checkProfileComplete } from './lib/auth';
import { supabase, savePlan, updatePlan } from './lib/supabase';
import type { DayConfig, MultiDayPlan, UGCEntry, PrecisionConfig } from './types';
import UpdatePrompt from './components/UpdatePrompt';
import PublicTripScreen from './components/PublicTripScreen';
import { getShareTokenFromUrl } from './lib/trip-sharing';
import OfflineBanner from './components/OfflineBanner';

// ── Imports critiques (chargés immédiatement) ──
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import LoadingScreen from './components/LoadingScreen';
import CityModal from './components/CityModal';
import MaintenanceScreen from './components/MaintenanceScreen';

// ── Imports lazy (chargés à la demande) ──
// ResultScreen est lourd (drag&drop, modals, PDF export) → lazy
const ResultScreen = lazy(() => import('./components/ResultScreen'));
// TasteProfileScreen / ReviewScreen / PremiumScreen → seulement quand ouvert
const TasteProfileScreen = lazy(() => import('./components/TasteProfileScreen'));
const CompleteProfileScreen = lazy(() => import('./components/CompleteProfileScreen'));
const ReviewScreen = lazy(() => import('./components/ReviewScreen'));
const ReviewConfirmationScreen = lazy(() => import('./components/ReviewConfirmationScreen'));
const PremiumScreen = lazy(() => import('./components/PremiumScreen'));
const UGCScreen = lazy(() => import('./components/UGCScreen'));
// Écrans de création (seuls pendant le flow create)
const DateRangeScreen = lazy(() => import('./components/DateRangeScreen'));
const TypeScreen = lazy(() => import('./components/TypeScreen'));
const PrecisionScreen = lazy(() => import('./components/PrecisionScreen'));
const MoodScreen = lazy(() => import('./components/MoodScreen'));
const CreationModeScreen = lazy(() => import('./components/CreationModeScreen'));
const CreateIntroScreen = lazy(() => import('./components/CreateIntroScreen'));
// Modals
const QuotaExceededModal = lazy(() => import('./components/QuotaExceededModal'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));

import { savePendingPlan, clearPendingPlan, getPendingPlan } from './lib/pending-plan';
import type { CreationMode } from './components/CreationModeScreen';
import { buildMultiDayPlanAI, buildDayConfigsFromMode } from './lib/ai-engine';
import { getQuotaInfo, incrementQuota, type QuotaInfo } from './lib/quota';
import { ThemeProvider } from './lib/theme-context';
import { usePremiumTheme } from './lib/premium-theme';
import { enablePushNotifications, isPushSupported } from './lib/push-notifications';


type Screen = 'auth'|'complete-profile'|'home'|'create-intro'|'dates'|'mode'|'day'|'precision'|'mood'|'loading'|'result'|'ugc'|'maintenance';

const DEF_PREC = (): PrecisionConfig => ({ mobility:[],meal:null,placePref:[],discovery:null,flexibility:null });
const DEF_DAY  = (): DayConfig => ({ types:[],vibes:[],budget:null,mood:'',startTime:'10:00',endTime:'22:00',precision:DEF_PREC() });

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const [pendingReviewTrip, setPendingReviewTrip] = useState<any>(null);
  const [screen, setScreen] = useState<Screen>('auth');
  const [city, setCity]     = useState('Paris');
  const [startDate, setSD]  = useState('');
  const [endDate,   setED]  = useState('');
  const [startTime, setST]  = useState('10:00');
  const [endTime,   setET]  = useState('22:00');
  const [days, setDays]     = useState<DayConfig[]>([DEF_DAY()]);
  const [dayIdx, setDayIdx] = useState(0);
  const [plan, setPlan]     = useState<MultiDayPlan|null>(null);
  const [viewPlan, setVP]   = useState<any>(null);
  const [feedback, setFB]   = useState<'like'|'dislike'|null>(null);
  const [ugc, setUgc]       = useState<UGCEntry[]>([]);
  const [showCity, setSC]   = useState(false);
  const [showFB,   setSFB]  = useState(false);
  const [showRev,  setSR]   = useState(false);
  const [showRC,   setSRC]  = useState(false);
  const [revData,  setRD]   = useState<{reviews:any[];comment:string}>({reviews:[],comment:''});
  const [showTaste, setShowTaste] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>('custom');
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // ── Partage public : détecter /trip/:token dans l'URL ──
  const [publicToken, setPublicToken] = useState<string | null>(null);
  useEffect(() => {
    const token = getShareTokenFromUrl();
    if (token) setPublicToken(token);
  }, []);
// ── Maintenance globale ──
  useEffect(() => {
    supabase.from('app_config')
      .select('maintenance_mode')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.maintenance_mode === true) setScreen('maintenance');
      });
  }, []);
  // Demande de permission push au premier login
  useEffect(() => {
    if (!user) return;
    if (!isPushSupported()) return;
    const flagKey = `push_asked_${user.id}`;
    if (localStorage.getItem(flagKey)) return;
    // Petit délai pour ne pas surprendre l'user au moment du load
    const timer = setTimeout(async () => {
      const result = await enablePushNotifications();
      console.log('[push] enable:', result);
      localStorage.setItem(flagKey, '1');
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user) { setIsPremium(false); return; }
    supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium === true));
  }, [user]);

  usePremiumTheme(isPremium);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setScreen('auth'); return; }
    checkProfileComplete(user.id).then(ok => setScreen(ok?'home':'complete-profile'));
  }, [user, authLoading]);
  useEffect(() => {
  if (!user) return;
  supabase
    .from('user_profiles')
    .select('taste_completed, taste_budget, taste_vibes, taste_experiences, taste_place_pref, taste_mobility, taste_discovery, taste_flexibility, taste_free_text')
    .eq('id', user.id)
    .single()
    .then(({ data }) => setTasteProfile(data || null));
}, [user]);

  useEffect(() => {
  if (!user) return;
  getQuotaInfo(user.id).then(setQuotaInfo);
}, [user]);

  useEffect(() => {
    supabase.from('ugc_places').select('*').then(({ data }) => {
      if (!data) return;
      setUgc(data.map((r:any): UGCEntry => ({
        id:r.id, name:r.name, desc:r.description||'', type:r.type, city:r.city,
        vid:r.vid||null, status:r.status||'pending', score:3.0,
        ver:r.status==='verified', community:true,
        lat:r.lat||0, lng:r.lng||0,
        budget:['free','low','mid','high'],
        tags:Array.isArray(r.tags)?r.tags:[],
        dur:r.duration||60, votes:r.votes||0,
        trustScore:r.trust_score||0, submittedAt:r.created_at,
      })));
    });
  }, []);

  const curDay  = days[dayIdx];
  const totDays = days.length;

  const dayLabel = (i: number) => {
    if (!startDate) return `Jour ${i+1}`;
    const d = new Date(startDate+'T00:00:00');
    d.setDate(d.getDate()+i);
    return d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  };

  const handleDatesNext = useCallback(() => {
  if (!startDate||!endDate) return;
  const n = Math.max(1, Math.floor((new Date(endDate).getTime()-new Date(startDate).getTime())/86400000)+1);
  // Vérifier quota
  if (quotaInfo && !quotaInfo.canCreate(n)) {
    setShowQuotaModal(true);
    return;
  }
  setDays(Array.from({length:n},(_,i)=>i<days.length?{...days[i],startTime,endTime}:{...DEF_DAY(),startTime,endTime}));
  setDayIdx(0); setScreen('mode');
}, [startDate,endDate,days,startTime,endTime,quotaInfo]);

  const updDay  = useCallback((p: Partial<DayConfig>) =>
    setDays(prev=>{ const n=[...prev]; n[dayIdx]={...n[dayIdx],...p}; return n; }), [dayIdx]);

  const updPrec = useCallback((p: Partial<PrecisionConfig>) =>
    setDays(prev=>{ const n=[...prev]; n[dayIdx]={...n[dayIdx],precision:{...n[dayIdx].precision,...p}}; return n; }), [dayIdx]);

  const goNext = useCallback(() => {
    if (dayIdx<totDays-1){setDayIdx(i=>i+1);setScreen('day');}
    else setScreen('loading');
  }, [dayIdx,totDays]);

  const handleLoaded = useCallback(async () => {
  try {
    const p = await buildMultiDayPlanAI({city,startDate,endDate,days},ugc);
    setVP(null); setPlan(p); setFB(null); setScreen('result');
    // Sauvegarde temporaire en localStorage (recovery 1h)
    savePendingPlan(p);
    // Incrémenter le quota
    if (user) {
      await incrementQuota(user.id, days.length);
      const q = await getQuotaInfo(user.id);
      setQuotaInfo(q);
    }
  } catch (e) {
    console.error('Erreur génération plan:', e);
    const { sendAlert } = await import('./lib/alert');
    sendAlert('Échec génération plan', {
      userId: user?.id,
      email: user?.email,
      city,
      startDate,
      endDate,
      nbDays: days.length,
      error: (e as any)?.message || String(e),
    });
    setScreen('maintenance');
  }
}, [city,startDate,endDate,days,ugc,user]);

 const handleSave = useCallback(async () => {
  const toSave = viewPlan || plan;
  if (!user || !toSave) {
    console.error('[handleSave] Annulé:', { hasUser: !!user, hasPlan: !!toSave });
    return;
  }
  // Clear le pending IMMÉDIATEMENT (synchrone) pour éviter la race condition
  // avec le re-mount de HomeScreen via setTimeout dans ResultScreen
  clearPendingPlan();
  try {
    const tripId = await savePlan(toSave.city, toSave);
    console.log('Plan sauvegardé, tripId:', tripId);
    setVP({ ...toSave, id: tripId });
    // Planifier les notifs push
    try {
      const { scheduleNotificationsForTrip } = await import('./lib/schedule-trip-notifications');
      await scheduleNotificationsForTrip(tripId, toSave);
    } catch (e) {
      console.warn('[handleSave] schedule notifs failed (non-bloquant):', e);
    }
  } catch (e) {
    console.error('Erreur savePlan:', e);
    const { sendAlert } = await import('./lib/alert');
    sendAlert('Échec sauvegarde voyage', {
      userId: user?.id,
      email: user?.email,
      city: toSave?.city,
      error: (e as any)?.message || String(e),
    });
  }
}, [user, plan, viewPlan]);

  const goHome = () => {
    setSD(''); setED(''); setDays([DEF_DAY()]); setDayIdx(0);
    setPlan(null); setVP(null); setFB(null); setScreen('home');
  };
  const handleOpenReviewFromTrip = useCallback((tripPlan: any) => {
  setVP(tripPlan);
  setPendingReviewTrip(tripPlan);
  setSR(true);
}, []);

  const active = viewPlan||plan;
  const allSteps = () => active?.days?.flatMap((d:any)=>
  d.steps.map((s:any)=>({placeId:s.id,placeName:s.name,type:s.type,subType:s.subType,rating:null,visited:false}))
)||[];

  if (authLoading) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#1A1205,#D4A843)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 4px 20px rgba(212,168,67,0.25)'}}>
          <span style={{fontFamily:'var(--f-display)',fontSize:20,fontWeight:700,color:'#fff'}}>YT</span>
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#D4A843',animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
        </div>
      </div>
    </div>
  );

 

  return (
    <div key={lang} style={{minHeight:'100vh'}}>
      <Suspense fallback={
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex', gap: 8,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent, #C9A961)',
                animation: `bounce 1.2s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      }>
      {publicToken ? (
        <PublicTripScreen
          token={publicToken}
          onBackToApp={() => {
            setPublicToken(null);
            window.history.replaceState({}, '', '/');
          }}
        />
      ) : (
        <>
      {screen==='auth' && <AuthScreen onSuccess={async () => {
  const { data: { user: u } } = await supabase.auth.getUser();
  if (!u) return;
  const ok = await checkProfileComplete(u.id);
  setScreen(ok ? 'home' : 'complete-profile');
}} />}
      {screen==='complete-profile' && <CompleteProfileScreen onComplete={()=>setScreen('home')} />}
      {screen==='maintenance'      && <MaintenanceScreen />}
      {screen==='home' && <HomeScreen
  onNewTrip={async ()=>{
    if (!user) return;
    // 1. Refresh quota
    const q = await getQuotaInfo(user.id);
    setQuotaInfo(q);
    // 2. Si quota épuisé → modal
    if (q && q.remaining === 0) {
      setShowQuotaModal(true);
      return;
    }
    // 3. Vérifier taste profile
    const { data } = await supabase
      .from('user_profiles')
      .select('taste_completed')
      .eq('id', user.id)
      .single();
    if (!data?.taste_completed) {
      setShowTaste(true);
    } else {
      setScreen('create-intro');
    }
  }}
  onOpenTrip={(p, meta) => { setVP({ ...p, id: meta?.id }); setScreen('result'); }}
  onReviewTrip={handleOpenReviewFromTrip}
  onRecoverPending={(p)=>{ setPlan(p); setVP(null); setFB(null); setScreen('result'); }}
/>}
      {screen==='create-intro' && <CreateIntroScreen onStart={()=>setScreen('dates')} onBack={()=>setScreen('home')} />}

      {screen==='dates'    && <DateRangeScreen city={city} startDate={startDate} endDate={endDate} startTime={startTime} endTime={endTime} lang={lang} onChange={(s,e)=>{setSD(s);setED(e);}} onTimeChange={(s,e)=>{setST(s);setET(e);}} onNext={handleDatesNext} onUGC={()=>setScreen('ugc')} onCityModal={()=>setSC(true)} onBack={()=>setScreen('create-intro')} />}
        {screen==='mode' && <CreationModeScreen
  nbDays={days.length}
  hasTasteProfile={!!tasteProfile?.taste_completed}
  onSelect={(mode) => {
    setCreationMode(mode);
    if (mode === 'custom') {
      setScreen('day');
    } else {
      // mode 'tastes' ou 'surprise' → remplir auto puis passer par le mood global
      const filledDays = buildDayConfigsFromMode(mode, tasteProfile, days.length, startTime, endTime);
      setDays(filledDays);
      setDayIdx(0);
      setScreen('mood');
    }
  }}
  onBack={() => setScreen('dates')}
/>}
      {screen==='day'      && curDay && <TypeScreen dayConfig={curDay} dayIndex={dayIdx} totalDays={totDays} dayLabel={dayLabel(dayIdx)} lang={lang} onChange={updDay} onNext={()=>setScreen('precision')} onBack={()=>{if(dayIdx>0){setDayIdx(i=>i-1);setScreen('mood');}else setScreen('mode');}} />}
      {screen==='precision'&& curDay && <PrecisionScreen precision={curDay.precision} lang={lang} onChange={updPrec} onNext={()=>setScreen('mood')} onBack={()=>setScreen('day')} onSkip={()=>{updPrec({mobility:['transport'],meal:'oui',placePref:['mix'],discovery:'mix',flexibility:'flexible'});setScreen('mood');}} />}
      {screen==='mood'     && curDay && <MoodScreen
        dayConfig={curDay}
        dayLabel={dayLabel(dayIdx)}
        isLastDay={dayIdx===totDays-1}
        lang={lang}
        mode={creationMode}
        nbDays={days.length}
        onChange={m => {
          if (creationMode === 'custom') {
            updDay({ mood: m });
          } else {
            // Mode tastes/surprise → mood global appliqué à tous les jours
            setDays(prev => prev.map(d => ({ ...d, mood: m })));
          }
        }}
        onNext={() => {
          if (creationMode === 'custom') goNext();
          else setScreen('loading');
        }}
        onSkip={() => {
          if (creationMode === 'custom') goNext();
          else setScreen('loading');
        }}
        onBack={() => {
          if (creationMode === 'custom') setScreen('precision');
          else setScreen('mode');
        }}
      />}
      {screen==='loading'  && <LoadingScreen lang={lang} onReady={handleLoaded} />}
      {screen==='result'   && active && <ResultScreen
  plan={active}
  feedback={feedback}
  onFeedback={f=>{setFB(f);if(f==='like')handleSave();else setScreen('loading');}}
  onReset={goHome}
  onShowReview={()=>setSR(true)}
  mode={viewPlan ? 'view' : 'generated'}
  tripId={viewPlan?.id}
  onUpdate={async (updatedPlan) => {
    if (!viewPlan?.id) return;
    await updatePlan(viewPlan.id, updatedPlan);
    setVP({ ...updatedPlan, id: viewPlan.id });
  }}
/>}
      {screen==='ugc'      && <UGCScreen ugcData={ugc} city={city} lang={lang} onBack={()=>setScreen('dates')} onSubmit={async e=>{await supabase.from('ugc_places').insert([{name:e.name,description:e.desc,type:e.type,city:e.city,vid:e.vid||null,status:'pending',lat:e.lat,lng:e.lng,tags:e.tags}]);setUgc(p=>[...p,e]);}} onVote={async id=>{const ex=ugc.find(u=>u.id===id);if(!ex)return;const v=(ex.votes||0)+1;await supabase.from('ugc_places').update({votes:v,status:v>=3?'verified':ex.status}).eq('id',id);setUgc(p=>p.map(u=>u.id!==id?u:{...u,votes:v,ver:v>=3,status:v>=3?'verified':u.status}));}} />}

      {showCity && <CityModal city={city} lang={lang} onSelect={setCity} onClose={()=>setSC(false)} />}
      {showFB   && <FeedbackModal lang={lang} onSubmit={async(s,c)=>{await supabase.from('feedback').insert([{city,stars:s,comment:c}]);}} onClose={()=>setSFB(false)} />}
      {showRev && active && <ReviewScreen
  places={allSteps()}
  tripId={pendingReviewTrip?.id || null}
  onClose={()=>{setSR(false); setPendingReviewTrip(null);}}
  onSubmit={(r,c)=>{setRD({reviews:r,comment:c});setSR(false);setSRC(true);setPendingReviewTrip(null);}}
/>}
{showPremium && <PremiumScreen onClose={() => setShowPremium(false)} />}
      {showRC   && <ReviewConfirmationScreen reviews={revData.reviews} comment={revData.comment} lang={lang} onClose={()=>{setSRC(false);goHome();}} />}
    {showTaste && <TasteProfileScreen
  onClose={() => setShowTaste(false)}
  onSaved={async () => {
    setShowTaste(false);
    // Recharger le taste profile depuis Supabase avant d'afficher le mode
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('taste_completed, taste_budget, taste_vibes, taste_experiences, taste_place_pref, taste_mobility, taste_discovery, taste_flexibility, taste_free_text')
        .eq('id', user.id)
        .single();
      setTasteProfile(data || null);
    }
    setScreen('create-intro');
  }}
/>}
{showQuotaModal && <QuotaExceededModal
  quotaInfo={quotaInfo}
  onClose={() => setShowQuotaModal(false)}
  onUpgrade={() => {
    setShowQuotaModal(false);
    setShowPremium(true);
  }}
/>}
        </>
      )}
      </Suspense>
      <UpdatePrompt />
      <OfflineBanner />
    </div>
  );

  
}
