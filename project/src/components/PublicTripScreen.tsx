import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Sparkles } from 'lucide-react';
import { getPublicTripByToken } from '../lib/trip-sharing';
import { useLang } from '../lib/lang-context';
import type { MultiDayPlan } from '../types';

interface Props {
  token: string;
  onBackToApp: () => void;
}

export default function PublicTripScreen({ token, onBackToApp }: Props) {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<{ city: string; title: string; created_at: string } | null>(null);
  const [plan, setPlan] = useState<MultiDayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getPublicTripByToken(token);
        if (cancelled) return;
        if (!result) {
          setError(t('public_not_found_default'));
          return;
        }
        setTrip(result.trip);
        setPlan(result.plan);
      } catch {
        if (!cancelled) setError(t('public_error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('public_loading')}</div>
      </div>
    );
  }

  if (error || !trip || !plan) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--text)', margin: '0 0 8px',
        }}>
          {t('public_not_found_title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 320 }}>
          {error || t('public_not_found_desc')}
        </p>
        <button
          type="button"
          onClick={onBackToApp}
          style={{
            padding: '12px 24px',
            borderRadius: 999,
            background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
            color: '#1A1208', border: 'none',
            fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('public_discover_app')}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      paddingBottom: 80,
    }}>
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(244,238,223,0.06)',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,15,0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <button
          type="button"
          onClick={onBackToApp}
          style={{
            background: 'none', border: 'none', padding: 8, cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, marginBottom: 10,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ArrowLeft size={14} />
          {t('public_back_to_app')}
        </button>

        <h1 style={{
          margin: 0,
          fontFamily: 'var(--f-display)', fontStyle: 'italic',
          fontSize: 26, fontWeight: 400,
          letterSpacing: '-0.01em',
        }}>
          {trip.title}
        </h1>
        <div style={{
          display: 'flex', gap: 16, marginTop: 10,
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} />{trip.city}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} />
            {plan.days.length} {plan.days.length > 1 ? t('public_day_count_plural') : t('public_day_count')}
          </span>
        </div>
      </div>

      <div style={{
        margin: '16px 16px 24px',
        padding: 16,
        background: 'rgba(201,169,97,0.06)',
        border: '1px solid rgba(201,169,97,0.20)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Sparkles size={20} color="var(--accent, #C9A961)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {t('public_banner_title')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {t('public_banner_desc')}
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToApp}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: 'var(--accent, #C9A961)',
            color: '#1A1208', border: 'none',
            fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('public_banner_btn')}
        </button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {plan.days.map((day, dayIdx) => (
          <div key={dayIdx}>
            <h2 style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic',
              fontSize: 20, fontWeight: 400,
              margin: '0 0 14px',
              color: 'var(--text)',
            }}>
              {t('public_day_label')} {dayIdx + 1} · {day.title || ''}
            </h2>
            <div style={{
              fontSize: 11, color: 'var(--text-faint, rgba(244,238,223,0.5))',
              marginBottom: 14, letterSpacing: '0.05em',
            }}>
              {day.startTime} — {day.endTime}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(day.steps || []).map((step: any, stepIdx: number) => (
                <div key={stepIdx} style={{
                  display: 'flex', gap: 12,
                  padding: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(244,238,223,0.06)',
                  borderRadius: 14,
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 50, textAlign: 'center',
                    fontFamily: 'var(--f-mono, monospace)',
                    fontSize: 13, fontWeight: 600,
                    color: 'var(--accent)',
                  }}>
                    {step.time || ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--f-display)',
                      fontSize: 16, fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: 4,
                    }}>
                      {step.name}
                    </div>
                    {step.desc && (
                      <div style={{
                        fontSize: 12, color: 'var(--text-muted)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {step.desc}
                      </div>
                    )}
                    {step.dur && (
                      <div style={{
                        fontSize: 10, color: 'var(--text-faint, rgba(244,238,223,0.4))',
                        marginTop: 6, letterSpacing: '0.05em',
                      }}>
                        ~{step.dur} min
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '32px 16px 16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onBackToApp}
          style={{
            padding: '14px 28px',
            borderRadius: 999,
            background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
            color: '#1A1208', border: 'none',
            fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(212,168,67,0.30)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('public_create_my_trip')}
        </button>
      </div>
    </div>
  );
}