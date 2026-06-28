import { useState, useEffect } from 'react';
import { Share2, Copy, Check, X, Link2, Power } from 'lucide-react';
import { enableSharing, disableSharing } from '../lib/trip-sharing';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast-context';
import { useLang } from '../lib/lang-context';

interface Props {
  tripId: string;
  city: string;
  onClose: () => void;
}

export default function ShareTripModal({ tripId, city, onClose }: Props) {
  const { toast } = useToast();
  const { t } = useLang();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('share_token, is_public')
        .eq('id', tripId)
        .single();

      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        return;
      }

      if (data.is_public && data.share_token) {
        setShareUrl(`${window.location.origin}/trip/${data.share_token}`);
        setIsPublic(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tripId]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const url = await enableSharing(tripId);
      setShareUrl(url);
      setIsPublic(true);
      toast.success(t('share_toast_created'));
    } catch (e) {
      toast.error(t('share_toast_create_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await disableSharing(tripId);
      setShareUrl(null);
      setIsPublic(false);
      toast.info(t('share_toast_disabled'));
    } catch (e) {
      toast.error(t('share_toast_disable_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if ('vibrate' in navigator) navigator.vibrate?.(10);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('share_toast_copy_error'));
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: t('share_native_title').replace('{city}', city),
          text: t('share_native_text').replace('{city}', city),
          url: shareUrl,
        });
      } catch {
        // user a annulé
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid rgba(244,238,223,0.15)',
          borderRadius: 22,
          padding: 28,
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(201,169,97,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Share2 size={17} strokeWidth={2} color="var(--accent, #C9A961)" />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontFamily: 'var(--f-display)', fontStyle: 'italic',
                fontSize: 20, fontWeight: 400,
                color: 'var(--text)',
              }}>
                {t('share_title')}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {city}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('share_close_aria')}
            style={{
              background: 'none', border: 'none', padding: 6, cursor: 'pointer',
              color: 'var(--text-muted)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
            {t('share_loading')}
          </div>
        ) : !isPublic ? (
          <>
            <p style={{
              fontSize: 14, lineHeight: 1.55,
              color: 'var(--text-muted)',
              margin: '0 0 22px',
            }}>
              {t('sshare_desc')}
            </p>

            <button
              type="button"
              onClick={handleEnable}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 999,
                background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
                color: '#1A1208', border: 'none',
                fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 22px rgba(212,168,67,0.30)',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <Link2 size={16} strokeWidth={2.2} />
              {t('share_create_btn')}
            </button>
          </>
        ) : (
          <>
            {/* Lien copiable */}
            <div style={{
              padding: 12,
              background: 'rgba(244,238,223,0.04)',
              border: '1px solid rgba(244,238,223,0.10)',
              borderRadius: 12,
              marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: 12, fontFamily: 'var(--f-mono, monospace)',
                color: 'var(--text)',
              }}>
                {shareUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={t('share_copy_aria')}
                style={{
                  flexShrink: 0,
                  padding: 8, borderRadius: 8,
                  background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(201,169,97,0.12)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transition: 'background 200ms ease',
                }}
              >
                {copied
                  ? <Check size={15} strokeWidth={2.2} color="#4ADE80" />
                  : <Copy size={15} strokeWidth={2} color="var(--accent)" />}
              </button>
            </div>

            {/* Bouton partage natif */}
            <button
              type="button"
              onClick={handleNativeShare}
              style={{
                width: '100%',
                padding: 13,
                borderRadius: 999,
                background: 'var(--grad-logo, linear-gradient(135deg, #D4A843, #C9A961))',
                color: '#1A1208', border: 'none',
                fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 22px rgba(212,168,67,0.30)',
                marginBottom: 10,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <Share2 size={15} strokeWidth={2.2} />
              {t('share_btn')}
            </button>

            {/* Bouton désactiver */}
            <button
              type="button"
              onClick={handleDisable}
              style={{
                width: '100%',
                padding: 11,
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid rgba(244,238,223,0.10)',
                fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <Power size={12} strokeWidth={2} />
              {t('share_disable_btn')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}