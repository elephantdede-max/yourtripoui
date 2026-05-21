import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './lib/auth-context';
import { useLang } from './lib/lang-context';
import { checkProfileComplete } from './lib/auth';
import { supabase, savePlan } from './lib/supabase';
import { buildMultiDayPlanAI } from './lib/ai-engine';
import type { DayConfig, MultiDayPlan, UGCEntry, PrecisionConfig } from './types';

import AuthScreen from './components/AuthScreen';
import CompleteProfileScreen from './components/CompleteProfileScreen';
import HomeScreen from './components/HomeScreen';
import DateRangeScreen from './components/DateRangeScreen';
import TypeScreen from './components/TypeScreen';
import PrecisionScreen from './components/PrecisionScreen';
import MoodScreen from './components/MoodScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import UGCScreen from './components/UGCScreen';
import CityModal from './components/CityModal';
import FeedbackModal from './components/FeedbackModal';
import ReviewScreen from './components/ReviewScreen';
import ReviewConfirmationScreen from './components/ReviewConfirmationScreen';
import MaintenanceScreen from './components/MaintenanceScreen';
import CreateIntroScreen from './components/CreateIntroScreen';

type Screen = 'auth'|'complete-profile'|'home'|'create-intro'|'dates'|'day'|'precision'|'mood'|'loading'|'result'|'ugc'|'maintenance';

const DEF_PREC = (): PrecisionConfig => ({ mobility:[],meal:null,diet:[],placePref:[],discovery:null,flexibility:null });
const DEF_DAY  = (): DayConfig => ({ types:[],vibes:[],budget:null,mood:'',startTime:'10:00',endTime:'22:00',precision:DEF_PREC() });

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setScreen('auth'); return; }
    checkProfileComplete(user.id).then(ok => setScreen(ok?'home':'complete-profile'));
  }, [user, authLoading]);

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
    setDays(Array.from({length:n},(_,i)=>i<days.length?{...days[i],startTime,endTime}:{...DEF_DAY(),startTime,endTime}));
    setDayIdx(0); setScreen('day');
  }, [startDate,endDate,days,startTime,endTime]);

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
    } catch (e) {
      console.error('Erreur génération plan:', e);
      setScreen('maintenance');
    }
  }, [city,startDate,endDate,days,ugc]);

  const handleSave = useCallback(async () => {
    if (!user||!plan) return;
    try { await savePlan(plan.city, plan); } catch(e){ console.error(e); }
  }, [user,plan]);

  const goHome = () => {
    setSD(''); setED(''); setDays([DEF_DAY()]); setDayIdx(0);
    setPlan(null); setVP(null); setFB(null); setScreen('home');
  };

  const active = viewPlan||plan;
  const allSteps = () => active?.days?.flatMap((d:any)=>
    d.steps.map((s:any)=>({placeId:s.id,placeName:s.name,type:s.type,rating:null,visited:false}))
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
    <div style={{minHeight:'100vh'}}>
      {screen==='auth' && <AuthScreen onSuccess={async () => {
  const { data: { user: u } } = await supabase.auth.getUser();
  if (!u) return;
  const ok = await checkProfileComplete(u.id);
  setScreen(ok ? 'home' : 'complete-profile');
}} />}
      {screen==='complete-profile' && <CompleteProfileScreen onComplete={()=>setScreen('home')} />}
      {screen==='maintenance'      && <MaintenanceScreen />}
      {screen==='home' && <HomeScreen onNewTrip={()=>setScreen('create-intro')} onOpenTrip={(p,_)=>{setVP(p);setScreen('result');}} />}
      {screen==='create-intro' && <CreateIntroScreen onStart={()=>setScreen('dates')} onBack={()=>setScreen('home')} lang={lang} />}

      {screen==='dates'    && <DateRangeScreen city={city} startDate={startDate} endDate={endDate} startTime={startTime} endTime={endTime} lang={lang} onChange={(s,e)=>{setSD(s);setED(e);}} onTimeChange={(s,e)=>{setST(s);setET(e);}} onNext={handleDatesNext} onUGC={()=>setScreen('ugc')} onCityModal={()=>setSC(true)} onBack={()=>setScreen('create-intro')} />}
      {screen==='day'      && curDay && <TypeScreen dayConfig={curDay} dayIndex={dayIdx} totalDays={totDays} dayLabel={dayLabel(dayIdx)} lang={lang} onChange={updDay} onNext={()=>setScreen('precision')} onBack={()=>{if(dayIdx>0){setDayIdx(i=>i-1);setScreen('mood');}else setScreen('dates');}} />}
      {screen==='precision'&& curDay && <PrecisionScreen precision={curDay.precision} lang={lang} onChange={updPrec} onNext={()=>setScreen('mood')} onBack={()=>setScreen('day')} onSkip={()=>{updPrec({mobility:['transport'],meal:'oui',diet:['aucune'],placePref:['mix'],discovery:'mix',flexibility:'flexible'});setScreen('mood');}} />}
      {screen==='mood'     && curDay && <MoodScreen dayConfig={curDay} dayLabel={dayLabel(dayIdx)} isLastDay={dayIdx===totDays-1} lang={lang} onChange={m=>updDay({mood:m})} onNext={goNext} onSkip={goNext} onBack={()=>setScreen('precision')} />}
      {screen==='loading'  && <LoadingScreen lang={lang} onReady={handleLoaded} />}
      {screen==='result'   && active && <ResultScreen plan={active} feedback={feedback} lang={lang} onFeedback={f=>{setFB(f);if(f==='like')handleSave();else setScreen('loading');}} onReset={goHome} onShowReview={()=>setSR(true)} />}
      {screen==='ugc'      && <UGCScreen ugcData={ugc} city={city} lang={lang} onBack={()=>setScreen('dates')} onSubmit={async e=>{await supabase.from('ugc_places').insert([{name:e.name,description:e.desc,type:e.type,city:e.city,vid:e.vid||null,status:'pending',lat:e.lat,lng:e.lng,tags:e.tags}]);setUgc(p=>[...p,e]);}} onVote={async id=>{const ex=ugc.find(u=>u.id===id);if(!ex)return;const v=(ex.votes||0)+1;await supabase.from('ugc_places').update({votes:v,status:v>=3?'verified':ex.status}).eq('id',id);setUgc(p=>p.map(u=>u.id!==id?u:{...u,votes:v,ver:v>=3,status:v>=3?'verified':u.status}));}} />}

      {showCity && <CityModal city={city} lang={lang} onSelect={setCity} onClose={()=>setSC(false)} />}
      {showFB   && <FeedbackModal lang={lang} onSubmit={async(s,c)=>{await supabase.from('feedback').insert([{city,stars:s,comment:c}]);}} onClose={()=>setSFB(false)} />}
      {showRev  && active && <ReviewScreen places={allSteps()} lang={lang} onClose={()=>setSR(false)} onSubmit={(r,c)=>{setRD({reviews:r,comment:c});setSR(false);setSRC(true);}} />}
      {showRC   && <ReviewConfirmationScreen reviews={revData.reviews} comment={revData.comment} lang={lang} onClose={()=>{setSRC(false);goHome();}} />}
    </div>
  );
}
