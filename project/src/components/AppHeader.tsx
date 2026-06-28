/**
 * AppHeader — barre du haut commune
 * Avatar (ProfilePanel) · "Your Trip" + subtitle · Cloche (centre de notifs)
 */

import { useState, useEffect } from 'react';
import { User, Bell, Star, Clock, X } from 'lucide-react';
import { useLang } from '../lib/lang-context';
import { useNotifs } from '../lib/notif-context';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import ProfilePanel from './ProfilePanel';

interface Props {
  subtitle?: string;
}

export default function AppHeader({ subtitle }: Props) {
  const { t } = useLang();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { notifs, bellPulse, showPanel, setShowPanel, removeNotif } = useNotifs();

  // Charger l'avatar de l'user (et rafraîchir au retour du panel après upload)
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user, showProfile]);

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '14px 20px 12px', flexShrink: 0,
      }}>
        {/* Avatar */}
        <button
          onClick={() => setShowProfile(true)}
          aria-label={t('menu_my_profile')}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: avatarUrl
              ? '1px solid rgba(212,168,67,0.35)'
              : '1px solid rgba(244,238,223,0.12)',
            background: avatarUrl
              ? `url(${avatarUrl}) center/cover`
              : 'var(--bg-soft-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {!avatarUrl && <User size={20} color="var(--text-muted)" strokeWidth={1.8} />}
        </button>

        {/* Wordmark + subtitle */}
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <h1 style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
            fontSize: 26, fontWeight: 400, color: 'var(--accent)',
            letterSpacing: '-0.02em', lineHeight: 1, margin: 0,
          }}>
            Your Trip
          </h1>
          {subtitle && (
            <p style={{
              fontFamily: 'var(--f-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: '0.22em',
              textTransform: 'uppercase', margin: '6px 0 0',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Cloche */}
        <button
          onClick={() => setShowPanel(true)}
          className={bellPulse ? 'bell-pulse' : ''}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid rgba(244,238,223,0.12)',
            background: 'var(--bg-soft-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <Bell size={20} color="var(--text-muted)" strokeWidth={1.8} />
          {notifs.length > 0 && (
            <span className="badge-pop" style={{
              position: 'absolute', top: 5, right: 5,
              minWidth: 16, height: 16, borderRadius: 999,
              background: 'var(--accent)', color: '#1A1208',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', fontFamily: 'var(--f-body)',
            }}>
              {notifs.length}
            </span>
          )}
        </button>
      </div>

      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
{showPanel && (
        <div className="slide-up" style={{
          position: 'fixed', inset: 0, maxWidth: 430, margin: '0 auto',
          background: 'var(--bg)', zIndex: 100,
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          fontFamily: 'var(--f-body)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px 14px',
          }}>
            <h1 style={{
              fontSize: 22, fontWeight: 600, color: 'var(--text)',
              margin: 0, letterSpacing: '-0.01em',
            }}>
              {t('notif_panel_title') || 'Notifications'}
            </h1>
            <button onClick={() => setShowPanel(false)} style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '1px solid rgba(244,238,223,0.12)',
              background: 'var(--bg-soft-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={18} color="var(--text-muted)" strokeWidth={1.8} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 28px' }}>
            {notifs.length === 0 ? (
              <p style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic',
                fontSize: 15, color: 'var(--text-muted)',
                textAlign: 'center', padding: '60px 20px',
              }}>
                {t('notif_empty_state') || 'Aucune notification'}
              </p>
            ) : notifs.map(n => (
              <button
                key={n.id}
                onClick={() => { setShowPanel(false); removeNotif(n.id); n.onOpen(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14, marginBottom: 10,
                  background: 'var(--bg-soft)',
                  border: '1px solid rgba(214,188,130,0.18)',
                  borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--f-body)',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'linear-gradient(135deg, #2A2218 0%, #14110A 100%)',
                  border: '1px solid rgba(212,168,67,0.20)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {n.kind === 'review'
                    ? <Star size={18} color="var(--accent)" strokeWidth={1.8} />
                    : <Clock size={18} color="var(--accent)" strokeWidth={1.8} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{n.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
            
    </>
  );
}
