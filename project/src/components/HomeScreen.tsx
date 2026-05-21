import { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { supabase } from '../lib/supabase';
import ProfilePanel from './ProfilePanel';

interface Props {
  onNewTrip: () => void;
  onOpenTrip: (plan: any, meta: any) => void;
}

interface SavedPlan {
  id: string;
  city: string;
  plan_data: any;
  created_at: string;
}

type Tab = 'create' | 'planning' | 'past';

const G = '#C9A961';

export default function HomeScreen({ onNewTrip, onOpenTrip }: Props) {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('create');
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
      });
  }, [user]);

  const now = new Date();
  const isPast = (plan: SavedPlan): boolean => {
    const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    const lastDay = data?.days?.[data.days.length - 1];
    if (!lastDay?.date) return false;
    const endTime = (lastDay.endTime || '23:59').replace('h', ':');
    const [h, m] = endTime.split(':').map(Number);
    const endDateTime = new Date(lastDay.date + 'T00:00:00');
    endDateTime.setHours(h || 23, m || 59, 0, 0);
    return endDateTime < now;
  };

  const pastTrips = plans.filter(isPast);
  const activePlans = plans.filter(p => !isPast(p));

  const open = (plan: SavedPlan) => {
    const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    onOpenTrip(data, plan);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', maxWidth:430, margin:'0 auto', position:'relative' }}>

      {/* ── HEADER : avatar / logo YT / cloche ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', flexShrink:0 }}>
        {/* Avatar profil */}
        <button onClick={() => setShowProfile(true)} style={{
          width:48, height:48, borderRadius:'50%',
          border:`2px solid ${G}`, background:'transparent',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <User size={24} color={G} />
        </button>

        {/* Logo YT cursif */}
        <span style={{ fontFamily:'var(--f-logo)', fontSize:32, color:G }}>YT</span>

        {/* Cloche notifications */}
        <button onClick={() => alert('Pas de nouvelles notifications')} style={{
          width:48, height:48, borderRadius:'50%',
          border:`2px solid ${G}`, background:'transparent',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <Bell size={24} color={G} />
        </button>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 24px 110px' }}>

        {/* ONGLET CREATE */}
        {tab==='create' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh' }}>
            <button onClick={onNewTrip} style={{
              width:160, height:160, borderRadius:'50%',
              border:`3px solid ${G}`, background:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', marginBottom:24,
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <line x1="40" y1="12" x2="40" y2="68" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="12" y1="40" x2="68" y2="40" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <p style={{ fontFamily:'var(--f-display)', fontSize:24, fontWeight:600, color:G }}>
              {t('create_your_trip')}
            </p>
          </div>
        )}

        {/* ONGLET PLANNING */}
        {tab==='planning' && (
          <div>
            {loading ? <Loader /> : activePlans.length === 0 ? (
              <CenterText text={t('no_planning')} />
            ) : (
              <div style={{ paddingTop:24 }}>
                {activePlans.map(p => <TripCard key={p.id} plan={p} onOpen={() => open(p)} t={t} />)}
              </div>
            )}
          </div>
        )}

        {/* ONGLET PAST TRIP */}
        {tab==='past' && (
          <div>
            {loading ? <Loader /> : pastTrips.length === 0 ? (
              <CenterText text={t('no_past_trip')} />
            ) : (
              <div style={{ paddingTop:24 }}>
                {pastTrips.map(p => <TripCard key={p.id} plan={p} onOpen={() => open(p)} t={t} showNote />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BARRE DE NAVIGATION DORÉE EN BAS ── */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:G,
        display:'flex', justifyContent:'space-around', alignItems:'center',
        padding:'10px 0 14px', zIndex:30,
      }}>
        {([
          ['create',   t('nav_create'),   '✈️'],
          ['planning', t('nav_planning'), '🗓️'],
          ['past',     t('nav_past'),     '✅'],
        ] as [Tab,string,string][]).map(([id,label,icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            opacity: tab===id ? 1 : 0.45, transition:'opacity 150ms',
          }}>
            <span style={{ fontSize:26, lineHeight:1, color:'#0A0A0F' }}>{icon}</span>
            <span style={{ fontFamily:'var(--f-display)', fontSize:15, fontWeight:600, color:'#0A0A0F' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── PANEL PROFIL ── */}
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
}

function TripCard({ plan, onOpen, t, showNote }: { plan: SavedPlan; onOpen: () => void; t: (k:string)=>string; showNote?: boolean }) {
  const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
  const sd = data?.days?.[0]?.date;
  const ed = data?.days?.[data.days.length - 1]?.date;
  const note = data?.average_note;
  const fmt = (d?: string) => d ? new Date(d+'T00:00:00').toLocaleDateString('fr-FR') : '';

  return (
    <button onClick={onOpen} style={{
      width:'100%', background:'var(--bg)',
      border:`3px solid ${G}`, borderRadius:'var(--r-lg)',
      padding:'20px 22px', marginBottom:20, cursor:'pointer',
      textAlign:'left', display:'block',
    }}>
      <h3 style={{ fontFamily:'var(--f-display)', fontSize:20, fontWeight:600, color:G, marginBottom:10 }}>
        {plan.city}
      </h3>
      <p style={{ fontFamily:'var(--f-display)', fontSize:17, color:G, textAlign:'center', marginBottom:8 }}>
        {t('from_date')} {fmt(sd)}  {t('to_date')} {fmt(ed)}
      </p>
      <p style={{ fontFamily:'var(--f-display)', fontSize:17, color:G, textAlign:'center' }}>
        {t('average_note')}: {showNote && note ? note : '...'}
      </p>
    </button>
  );
}

function CenterText({ text }: { text: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh', padding:'0 20px' }}>
      <p style={{ fontFamily:'var(--f-display)', fontSize:22, fontWeight:600, color:'#C9A961', textAlign:'center', lineHeight:1.4 }}>
        {text}
      </p>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:48, gap:6 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#C9A961', animation:`bounce 1.2s ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}
