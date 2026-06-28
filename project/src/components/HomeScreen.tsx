import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { useNotifs } from '../lib/notif-context';
import PlanningCalendar from './PlanningCalendar';
import { MapPin, CheckCircle2, Plus, Trash2, Star, Clock, Compass, Plane, ArrowRight } from 'lucide-react';
import { getPendingPlan, clearPendingPlan } from '../lib/pending-plan';
import { getSavedPlans, hasReviewedTrip, deleteTrip, getTripAverageRating } from '../lib/supabase';
import AppHeader from './AppHeader';
import PastTripsMap from './PastTripsMap';
import { useToast } from '../lib/toast-context';
import type { MultiDayPlan } from '../types';
import { getCoverPhoto, type TripPhoto } from '../lib/trip-photos';

interface Props {
  onNewTrip: () => void;
  onOpenTrip: (plan: MultiDayPlan, meta: SavedPlan) => void;
  onReviewTrip: (planData: SavedPlan) => void;
  onRecoverPending: (plan: MultiDayPlan) => void;
}

interface SavedPlan {
  id: string;
  city: string;
  plan_data: unknown;
  created_at: string;
}

type Tab = 'create' | 'planning' | 'past';

const G = '#C9A961';
const BG = '#000000';
const HISTORY_LIMIT_FREE = 15;

export default function HomeScreen({ onNewTrip, onOpenTrip, onReviewTrip, onRecoverPending }: Props) {
    const { toast } = useToast();
const { user } = useAuth();
  const { t } = useLang();
  const { flyingId, sendToBell } = useNotifs();

  const [tab, setTab] = useState<Tab>('create');
  const [confirmDelete, setConfirmDelete] = useState<SavedPlan | null>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingReview, setPendingReview] = useState<SavedPlan | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [pending, setPending] = useState<{ plan: MultiDayPlan; minutesAgo: number } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [pastView, setPastView] = useState<'list' | 'map'>('list');
  const [displayName, setDisplayName] = useState<string>('');
  // ── Map { tripId: signed_url } pour afficher les covers sur les TripCards ──
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

  useEffect(() => { setPending(getPendingPlan()); }, []);

  // ── Chargement hybride : cache offline d'abord, puis réseau ──
  // 1. Affiche immédiatement les voyages du cache IndexedDB (perçu plus rapide)
  // 2. Tente de charger depuis Supabase en parallèle
  // 3. Si réseau OK → remplace cache + UI par la version fraîche
  // 4. Si réseau KO → garde le cache (mode offline)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      // 1. Lire le cache IndexedDB en premier (instant)
      try {
        const { getCachedTrips } = await import('../lib/offline-storage');
        const cached = await getCachedTrips();
        if (!cancelled && cached.length > 0) {
          setPlans(cached as SavedPlan[]);
          setLoading(false);
        }
      } catch (e) {
        console.warn('[home] cache read failed', e);
      }

      // 2. Tenter le réseau
      try {
        const fresh = await getSavedPlans();
        if (cancelled) return;
        setPlans(fresh || []);
        setLoading(false);
        // 3. Synchroniser le cache avec la version fraîche
        const { syncTripsToCache } = await import('../lib/offline-storage');
        await syncTripsToCache(fresh || []);
      } catch (e: unknown) {
        // Le réseau a échoué — on garde le cache déjà affiché
        console.warn('[home] network failed, using cache', e);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Reload sur changement d'onglet (sans afficher loading si cache présent)
  useEffect(() => {
    if (!user) return;
    if (tab === 'planning' || tab === 'past') {
      getSavedPlans()
        .then(async (data) => {
          setPlans(data || []);
          // Sync cache
          const { syncTripsToCache } = await import('../lib/offline-storage');
          await syncTripsToCache(data || []);
        })
        .catch(() => {
          // Réseau KO → garder le cache actuel, pas de toast
        });
    }
  }, [tab, user]);

  useEffect(() => {
    if (!user || plans.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('review_banner_dismissed');
    if (dismissedDate === today) { setBannerDismissed(true); return; }

    (async () => {
      const now = Date.now();
      for (const plan of plans) {
        const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
        const lastDay = data?.days?.[data.days.length - 1];
        if (!lastDay?.date) continue;
        const endTime = (lastDay.endTime || '23:59').replace('h', ':');
        const [h, m] = endTime.split(':').map(Number);
        const endDateTime = new Date(lastDay.date + 'T00:00:00');
        endDateTime.setHours(h || 23, m || 59, 0, 0);
        const elapsedMin = (now - endDateTime.getTime()) / 60000;
        if (elapsedMin < 15) continue;
        const reviewed = await hasReviewedTrip(plan.id);
        if (!reviewed) { setPendingReview(plan); return; }
      }
    })();
  }, [user, plans]);

  useEffect(() => {
    if (!user) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('user_profiles').select('is_premium, display_name').eq('id', user.id).single()
        .then(({ data }) => {
          setIsPremium(data?.is_premium === true);
          setDisplayName(data?.display_name || '');
        });
    });
  }, [user]);

  useEffect(() => {
    if (!user || plans.length === 0) return;
    (async () => {
      const reviewed = new Set<string>();
      for (const plan of plans) {
        const ok = await hasReviewedTrip(plan.id);
        if (ok) reviewed.add(plan.id);
      }
      setReviewedIds(reviewed);
    })();
  }, [user, plans]);

  useEffect(() => {
    if (reviewedIds.size === 0) return;
    (async () => {
      const map: Record<string, number> = {};
      for (const id of reviewedIds) {
        const avg = await getTripAverageRating(id);
        if (avg != null) map[id] = avg;
      }
      setRatings(map);
    })();
  }, [reviewedIds]);

  // ── Charger les covers de tous les voyages ──
  // Parallèle, non bloquant (l'UI s'affiche sans, puis les images apparaissent)
  useEffect(() => {
    if (plans.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        plans.map(async (p): Promise<[string, string] | null> => {
          try {
            const cover = await getCoverPhoto(p.id);
            if (cover?.signed_url) return [p.id, cover.signed_url];
          } catch (e) {
            // pas grave, on garde le placeholder
          }
          return null;
        }),
      );
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const e of entries) if (e) map[e[0]] = e[1];
      setCoverUrls(map);
    })();
    return () => { cancelled = true; };
  }, [plans]);

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

  const allPastTrips = plans.filter(isPast);
  const allActivePlans = plans.filter(p => !isPast(p));
  const pastTrips = isPremium ? allPastTrips : allPastTrips.slice(0, HISTORY_LIMIT_FREE);
  const activePlans = allActivePlans;

  const open = (plan: SavedPlan) => {
    const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    onOpenTrip(data, plan);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    // Garder une copie locale avant le reset, pour éviter une race avec le re-render
    const tripToDelete = confirmDelete;
    setConfirmDelete(null); // Fermer le modal IMMÉDIATEMENT (feedback instantané iOS)
    try {
      await deleteTrip(tripToDelete.id);
      // Virer les notifs planifiées
      const { unscheduleNotificationsForTrip } = await import('../lib/schedule-trip-notifications');
      await unscheduleNotificationsForTrip(tripToDelete.id);
      setPlans(prev => prev.filter(p => p.id !== tripToDelete.id));
    } catch (e) {
      console.error('Erreur suppression:', e);
      toast.error(t('trip_delete_error'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', position: 'relative' }}>

      <AppHeader subtitle={t('home_subtitle_header')} />

      {/* ── BANNIÈRE REVIEW (note) ── */}
      {pendingReview && !bannerDismissed && (
        <div
          className={flyingId === 'review-' + pendingReview.id ? 'fly-to-bell' : ''}
          style={{
            margin: '0 20px 16px', padding: '14px 16px',
            background: 'rgba(214,188,130,0.06)',
            border: '1px solid rgba(214,188,130,0.45)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
            border: '1px solid rgba(212,168,67,0.20)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={20} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.005em' }}>
              {t('home_review_banner_title')} {pendingReview.city}
            </p>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {t('home_review_banner_desc')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => {
                const data = typeof pendingReview.plan_data === 'string' ? JSON.parse(pendingReview.plan_data) : pendingReview.plan_data;
                onReviewTrip({ ...data, id: pendingReview.id });
              }}
              style={{
                padding: '7px 14px', borderRadius: 999,
                background: 'var(--grad-logo)', color: '#1A1208', border: 'none',
                fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {t('home_review_now')}
            </button>
            <button
              onClick={() => {
                sendToBell({
                  id: 'review-' + pendingReview.id,
                  kind: 'review',
                  title: t('home_review_banner_title') + ' ' + pendingReview.city,
                  desc: t('home_review_banner_desc'),
                  onOpen: () => {
                    const data = typeof pendingReview.plan_data === 'string' ? JSON.parse(pendingReview.plan_data) : pendingReview.plan_data;
                    onReviewTrip({ ...data, id: pendingReview.id });
                  },
                }, () => {
                  const today = new Date().toISOString().split('T')[0];
                  localStorage.setItem('review_banner_dismissed', today);
                  setBannerDismissed(true);
                });
              }}
              style={{
                padding: '4px 8px', background: 'none', border: 'none',
                color: 'var(--text-muted)', fontFamily: 'var(--f-body)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {t('later')}
            </button>
          </div>
        </div>
      )}

      {/* ── BANNIÈRE PENDING (reprendre voyage) ── */}
      {pending && (
        <div
          className={flyingId === 'pending' ? 'fly-to-bell' : ''}
          style={{
            margin: '0 20px 16px', padding: '14px 16px',
            background: 'rgba(214,188,130,0.06)',
            border: '1px solid rgba(214,188,130,0.45)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
            border: '1px solid rgba(212,168,67,0.20)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={20} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.005em' }}>
              {t('pending_title')}
            </p>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {t('pending_desc')} <strong style={{ color: 'var(--accent)' }}>{pending.plan.city}</strong> {t('pending_desc_2').replace('{n}', String(pending.minutesAgo))}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => { onRecoverPending(pending.plan); setPending(null); }}
              style={{
                padding: '7px 14px', borderRadius: 999,
                background: 'var(--grad-logo)', color: '#1A1208', border: 'none',
                fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {t('pending_recover')}
            </button>
            <button
              onClick={() => {
                sendToBell({
                  id: 'pending',
                  kind: 'pending',
                  title: t('pending_title'),
                  desc: t('pending_desc') + ' ' + pending.plan.city,
                  onOpen: () => onRecoverPending(pending.plan),
                }, () => { clearPendingPlan(); setPending(null); });
              }}
              style={{
                padding: '4px 8px', background: 'none', border: 'none',
                color: 'var(--text-muted)', fontFamily: 'var(--f-body)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {t('later')}
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENU ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 110px' }}>

        {/* ONGLET CREATE */}
        {tab === 'create' && (
          <div style={{ paddingTop: 8 }}>
            <p style={{
              fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)',
              letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 14px',
            }}>
              {t('home_hello')}, {(displayName || user?.email?.split('@')[0] || 'voyageur').toUpperCase()}
            </p>

            <h2 style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 40, fontWeight: 400,
              color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 18px',
            }}>
            {t('home_where_1')} <br />
              <span style={{ color: 'var(--accent)' }}>{t('home_where_2')}</span> {t('home_where_3')}</h2>

            <p style={{
              fontFamily: 'var(--f-body)', fontSize: 15, color: 'var(--text-muted)',
              lineHeight: 1.55, margin: '0 0 32px',
            }}>
             {t('home_compose_1')}<br />
              {t('home_compose_2')}
            </p>

            {/* CTA Nouveau voyage */}
            <button
              onClick={onNewTrip}
              style={{
                width: '100%', background: 'rgba(214,188,130,0.04)',
                border: '1px solid rgba(214,188,130,0.30)', borderRadius: 18,
                padding: '16px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40,
                transition: 'all 200ms ease', fontFamily: 'var(--f-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(214,188,130,0.55)'; e.currentTarget.style.background = 'rgba(214,188,130,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(214,188,130,0.30)'; e.currentTarget.style.background = 'rgba(214,188,130,0.04)'; }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: '50%', background: 'var(--grad-logo)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(212,168,67,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}>
                <Plus size={26} color="#1A1208" strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                  {t('home_new_trip_title')}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  {t('home_new_trip_desc')}
                </p>
              </div>
              <ArrowRight size={20} color="var(--accent)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
            </button>

            {/* Section EN COURS */}
            {!loading && activePlans.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <p style={{
                    fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)',
                    letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0,
                  }}>
                    {t('home_in_progress')}
                  </p>
                  <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--text-faint)', margin: 0 }}>
                    {activePlans.length} {activePlans.length > 1 ? t('result_day_plural') : t('result_day_singular')}
                  </p>
                </div>
                {activePlans.map(p => (
                  <TripCard
                    key={p.id}
                    plan={p}
                    coverUrl={coverUrls[p.id]}
                    onOpen={() => open(p)}
                    onDelete={() => setConfirmDelete(p)}
                    t={t}
                  />
                ))}
              </>
            )}

            {/* État vide */}
            {!loading && activePlans.length === 0 && (
              <div style={{
                marginTop: 8, padding: '40px 24px',
                background: `
                  linear-gradient(135deg, rgba(155,125,154,0.06) 0%, rgba(214,188,130,0.04) 100%),
                  repeating-linear-gradient(45deg, transparent 0 14px, rgba(214,188,130,0.03) 14px 28px)
                `,
                border: '1px solid rgba(214,188,130,0.12)', borderRadius: 20, textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22,
                  color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.015em', lineHeight: 1.3,
                }}>
                  {t('home_empty_1')} <span style={{ color: 'var(--accent)' }}>{t('home_empty_2')}</span>
                </p>
                <p style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                  {t('home_empty_desc')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ONGLET PLANNING */}
        {tab === 'planning' && (
          <div>
            {loading ? <Loader /> : activePlans.length === 0 ? (
              <CenterText text={t('no_planning')} />
            ) : (
              <PlanningCalendar
                plans={activePlans}
                onDayClick={(planData) => {
                  const sp = activePlans.find(p => {
                    const data = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data;
                    return data === planData || data.city === planData.city;
                  });
                  if (sp) open(sp);
                }}
              />
            )}
          </div>
        )}

        {/* ONGLET PAST */}
        {tab === 'past' && (
          <div>
            {loading ? <Loader /> : pastTrips.length === 0 ? (
              <CenterText text={t('no_past_trip')} />
            ) : (
              <div style={{ paddingTop: 16 }}>
                {/* Toggle Liste / Carte */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-soft-strong)',
                    border: '1px solid rgba(244,238,223,0.08)',
                    borderRadius: 999,
                    padding: 4, gap: 4,
                  }}>
                    {([['list', 'Liste'], ['map', 'Carte']] as const).map(([v, label]) => {
                      const active = pastView === v;
                      return (
                        <button key={v} onClick={() => setPastView(v)} style={{
                          padding: '7px 16px', borderRadius: 999,
                          background: active ? 'rgba(214,188,130,0.08)' : 'transparent',
                          border: active ? '1px solid rgba(214,188,130,0.45)' : '1px solid transparent',
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                          fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 600,
                          letterSpacing: '0.06em', cursor: 'pointer',
                          transition: 'all 200ms ease', whiteSpace: 'nowrap',
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Vue Carte */}
                {pastView === 'map' && (
                  <PastTripsMap
                    plans={pastTrips}
                    onTripClick={(plan) => open(plan)}
                  />
                )}

                {/* Vue Liste */}
                {pastView === 'list' && (
                  <>
                {!isPremium && allPastTrips.length > HISTORY_LIMIT_FREE && (
                  <div style={{
                    margin: '0 0 20px', padding: '14px 16px',
                    background: `${G}18`, border: `1.5px solid ${G}55`, borderRadius: 12, textAlign: 'center',
                  }}>
                    <p style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: G, margin: 0, marginBottom: 4 }}>
                      {t('history_limit_title')}
                    </p>
                    <p style={{ fontFamily: 'var(--f-display)', fontSize: 11, color: '#888', margin: 0 }}>
                      {t('history_limit_desc').replace('{n}', String(allPastTrips.length - HISTORY_LIMIT_FREE))}
                    </p>
                  </div>
                )}
                {pastTrips.map(p => (
                  <TripCard
                    key={p.id}
                    plan={p}
                    coverUrl={coverUrls[p.id]}
                    onOpen={() => open(p)}
                    onReview={() => {
                      const data = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data;
                      onReviewTrip({ ...data, id: p.id });
                    }}
                    onDelete={() => setConfirmDelete(p)}
                    t={t}
                    showNote
                    showReviewBtn={!reviewedIds.has(p.id)}
                    rating={ratings[p.id]}
                  />
                ))}
                 </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 28px)', maxWidth: 402,
        background: 'var(--bg-nav, rgba(16,15,19,0.85))',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(214,188,130,0.20)', borderRadius: 999,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 6, zIndex: 30, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      }}>
        {([
          ['create', t('nav_create'), Plane],
          ['planning', t('nav_planning'), Compass],
          ['past', t('nav_past'), CheckCircle2],
        ] as [Tab, string, typeof Plane][]).map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1,
              background: active ? 'rgba(214,188,130,0.10)' : 'transparent',
              border: active ? '1px solid rgba(214,188,130,0.45)' : '1px solid transparent',
              borderRadius: 999, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 8px', transition: 'all 200ms ease',
            }}>
              <Icon size={18} color={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth={1.8} />
              <span style={{
                fontFamily: 'var(--f-body)', fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                letterSpacing: '-0.005em',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── MODAL SUPPRESSION ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20,
        }}>
          <div style={{ background: 'var(--bg-card, #000000)', border: `1.5px solid ${G}55`, borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 700, color: G, marginBottom: 12 }}>
              {t('trip_delete_title')}
            </h3>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: '#aaa', marginBottom: 20, lineHeight: 1.4 }}>
              {t('trip_delete_desc')} <strong style={{ color: G }}>{confirmDelete.city}</strong> {t('trip_delete_desc_2')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, background: 'transparent',
                  border: `1px solid ${G}55`, color: G, cursor: 'pointer',
                  fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600,
                  WebkitTapHighlightColor: 'rgba(214,168,67,0.3)',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, background: '#a82c2c', color: '#fff',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 700,
                  WebkitTapHighlightColor: 'rgba(255,255,255,0.3)',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                }}
              >
                {t('trip_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({ plan, coverUrl, onOpen, onReview, onDelete, t, showNote, showReviewBtn, rating }: {
  plan: SavedPlan;
  coverUrl?: string;
  onOpen: () => void;
  onReview?: () => void;
  onDelete: () => void;
  t: (k: string) => string;
  showNote?: boolean;
  showReviewBtn?: boolean;
  rating?: number;
}) {
  const { lang } = useLang();
  const data = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
  const days = data.days || [];
  const firstDay = days[0];
  const totalSteps = days.reduce((s: number, d: { steps?: unknown[] }) => s + (d.steps?.length || 0), 0);
  const startTime = firstDay?.startTime || '';
  const endTime = days[days.length - 1]?.endTime || '';
  const rawTitle = firstDay?.title;
  let title = data.title || data.city;
  if (rawTitle) {
    const tr = t(`day_title_${rawTitle}`);
    title = (tr && tr !== `day_title_${rawTitle}`) ? tr : `Une journée ${rawTitle}`;
  }

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE', pt: 'pt-PT' };
    return new Date(y, m - 1, day).toLocaleDateString(localeMap[lang] || 'en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  };

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'relative', background: 'var(--bg-soft)',
        border: '1px solid rgba(214,188,130,0.10)', borderRadius: 18,
        marginBottom: 14, cursor: 'pointer', overflow: 'hidden',
        transition: 'all 200ms ease', fontFamily: 'var(--f-body)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(214,188,130,0.30)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(214,188,130,0.10)'; }}
    >
      <div style={{
        height: 140,
        background: coverUrl
          ? '#0A0908'
          : `
              linear-gradient(135deg, rgba(214,188,130,0.05) 0%, rgba(155,125,154,0.04) 100%),
              repeating-linear-gradient(45deg, transparent 0 12px, rgba(214,188,130,0.04) 12px 24px)
            `,
        borderBottom: '1px solid rgba(214,188,130,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt={data.city}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
            />
            {/* Overlay sombre en bas pour la lisibilité du nom de la ville */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(8,7,10,0.85) 0%, rgba(8,7,10,0.3) 60%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <p style={{
              position: 'absolute', bottom: 12, left: 16,
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic',
              fontSize: 32,
              color: '#fff',
              letterSpacing: '-0.025em',
              margin: 0,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              fontWeight: 400,
            }}>
              {data.city}
            </p>
          </>
        ) : (
          <p style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontSize: 38,
            color: 'var(--accent)',
            letterSpacing: '-0.025em',
            margin: 0,
            textAlign: 'center',
            textShadow: '0 2px 24px rgba(212,168,67,0.35)',
          }}>
            {data.city}
          </p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-soft-strong)', backdropFilter: 'blur(8px)',
            border: '1px solid var(--stroke-soft, rgba(244,238,223,0.10))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <Trash2 size={13} color="var(--text-muted)" strokeWidth={1.8} />
        </button>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 999,
            background: 'rgba(214,188,130,0.06)', border: '1px solid rgba(214,188,130,0.30)',
            fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.005em',
          }}>
            <MapPin size={11} strokeWidth={2} />
            {data.city}
          </span>
          <span style={{
            padding: '4px 11px', borderRadius: 999, background: 'var(--bg-soft-strong)',
            border: '1px solid rgba(244,238,223,0.10)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
          }}>
            {totalSteps} {totalSteps > 1 ? t('step_plural') : t('step_singular')}
          </span>
          {showNote && rating && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999,
              background: 'rgba(214,188,130,0.10)', border: '1px solid rgba(214,188,130,0.30)',
              fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            }}>
              <Star size={11} strokeWidth={2} fill="currentColor" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 400,
          color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 10px',
        }}>
          {title}
        </h3>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid rgba(244,238,223,0.06)',
        }}>
          <p style={{
            fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)',
            letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
          }}>
            {firstDay?.date && formatDate(firstDay.date)}
            {startTime && ` · ${startTime.replace(':', 'H')}`}
            {endTime && ` — ${endTime.replace(':', 'H')}`}
          </p>

          {showReviewBtn ? (
            <button
              onClick={(e) => { e.stopPropagation(); onReview?.(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                color: 'var(--accent)', fontFamily: 'var(--f-body)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', padding: 0, letterSpacing: '-0.005em',
              }}
            >
              <Star size={13} strokeWidth={2} />
              {t('home_review_now')}
            </button>
          ) : showNote ? null : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent)',
            fontFamily: 'var(--f-body)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em',
          }}>
            {t('home_resume') || 'Reprendre'}
            <ArrowRight size={14} strokeWidth={2} />
          </span>
        )}
        </div>
      </div>
    </div>
  );
}

function CenterText({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '0 20px' }}>
      <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
        {text}
      </p>
    </div>
  );
}

function Loader() {
  // Skeleton de 3 trip cards (animation shimmer)
  // Plus rassurant qu'un spinner : on "voit" déjà la structure
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(244,238,223,0.06)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            opacity: 1 - i * 0.15, // 1er bien visible, 3e très subtle
          }}>
            <div style={{
              width: '60%', height: 18, borderRadius: 6,
              background: 'linear-gradient(90deg, rgba(244,238,223,0.04) 0%, rgba(244,238,223,0.10) 50%, rgba(244,238,223,0.04) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s ease-in-out infinite',
            }} />
            <div style={{
              width: '40%', height: 12, borderRadius: 6,
              background: 'linear-gradient(90deg, rgba(244,238,223,0.04) 0%, rgba(244,238,223,0.10) 50%, rgba(244,238,223,0.04) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s ease-in-out infinite',
              animationDelay: '150ms',
            }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {[60, 80].map((w, k) => (
                <div key={k} style={{
                  width: w, height: 22, borderRadius: 11,
                  background: 'linear-gradient(90deg, rgba(244,238,223,0.04) 0%, rgba(244,238,223,0.10) 50%, rgba(244,238,223,0.04) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s ease-in-out infinite',
                  animationDelay: `${300 + k * 100}ms`,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
