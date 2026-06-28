import { useState, useEffect, useRef } from 'react';
import { Plus, X, Star, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import {
  getGlobalTripPhotos,
  uploadTripPhoto,
  setCoverPhoto,
  unsetCoverPhoto,
  updatePhotoCaption,
  deleteTripPhoto,
  type TripPhoto,
} from '../lib/trip-photos';
import { useToast } from '../lib/toast-context';
import { useLang } from '../lib/lang-context';

interface Props {
  tripId: string;
}

export default function TripPhotoGallery({ tripId }: Props) {
  const { toast } = useToast();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string>('');
  const [pendingCaption, setPendingCaption] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<TripPhoto | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getGlobalTripPhotos(tripId);
        if (!cancelled) setPhotos(data);
      } catch (e) {
        console.warn('[gallery] fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('gallery_format_error'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t('gallery_too_big'));
      return;
    }
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setPendingCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const photo = await uploadTripPhoto(tripId, pendingFile, {
        caption: pendingCaption,
      });
      setPhotos(prev => [photo, ...prev]);
      cancelUpload();
      if ('vibrate' in navigator) navigator.vibrate?.(10);
    } catch (e: any) {
      console.error('[gallery] upload failed', e);
      toast.error(e?.message || t('gallery_upload_error'));
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview('');
    setPendingCaption('');
  };

  const handleToggleCover = async (photo: TripPhoto) => {
    try {
      if (photo.is_cover) {
        await unsetCoverPhoto(photo.id);
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_cover: false } : p));
      } else {
        await setCoverPhoto(photo.id, tripId);
        setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photo.id })));
        toast.info(t('gallery_cover_set'));
      }
    } catch (e: any) {
      toast.error(t('gallery_cover_error'));
    }
  };

  const handleCaptionEdit = async (photo: TripPhoto, newCaption: string) => {
    try {
      await updatePhotoCaption(photo.id, newCaption);
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: newCaption.trim() || null } : p));
    } catch (e) {
      toast.error(t('gallery_caption_error'));
    }
  };

  const handleDelete = async (photo: TripPhoto) => {
    if (!confirm(t('gallery_delete_confirm'))) return;
    try {
      await deleteTripPhoto(photo);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      if (lightboxPhoto?.id === photo.id) setLightboxPhoto(null);
    } catch (e) {
      toast.error(t('gallery_delete_error'));
    }
  };

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 14,
      }}>
        <p style={{
          fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0,
        }}>
          {t('gallery_title')}
        </p>
        {photos.length > 0 && (
          <p style={{
            fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--text-faint)', margin: 0,
          }}>
            {photos.length} {photos.length > 1 ? t('gallery_photo_plural') : t('gallery_photo_singular')}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {loading ? (
        <div style={{
          height: 120, borderRadius: 14,
          background: 'rgba(244,238,223,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={20} color="var(--text-muted)" className="spin" />
        </div>
      ) : photos.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', padding: '32px 20px',
            background: 'rgba(214,188,130,0.04)',
            border: '1.5px dashed rgba(214,188,130,0.30)',
            borderRadius: 16,
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            fontFamily: 'var(--f-body)',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(214,188,130,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(214,188,130,0.04)'; }}
        >
          <ImageIcon size={28} color="var(--accent)" strokeWidth={1.6} />
          <p style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
          }}>
            {t('gallery_empty_1')} <span style={{ color: 'var(--accent)' }}>{t('gallery_empty_2')}</span>
          </p>
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center',
          }}>
            {t('gallery_empty_desc')}
          </p>
        </button>
      ) : (
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          paddingBottom: 8,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flexShrink: 0,
              width: 120, height: 120,
              borderRadius: 14,
              background: 'rgba(214,188,130,0.04)',
              border: '1.5px dashed rgba(214,188,130,0.30)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--accent)',
              scrollSnapAlign: 'start',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(214,188,130,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(214,188,130,0.04)'; }}
          >
            <Plus size={22} strokeWidth={2} />
            <span style={{
              fontFamily: 'var(--f-body)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.03em',
            }}>
              {t('gallery_add')}
            </span>
          </button>

          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              style={{
                flexShrink: 0,
                width: 120, height: 120,
                borderRadius: 14, overflow: 'hidden',
                border: photo.is_cover
                  ? '2px solid var(--accent)'
                  : '1px solid rgba(244,238,223,0.10)',
                background: '#0A0908',
                position: 'relative',
                cursor: 'pointer',
                padding: 0,
                scrollSnapAlign: 'start',
                boxShadow: photo.is_cover ? '0 0 18px rgba(212,168,67,0.30)' : 'none',
              }}
            >
              {photo.signed_url && (
                <img
                  src={photo.signed_url}
                  alt={photo.caption || t('gallery_photo_alt')}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              {photo.is_cover && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--grad-logo)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(212,168,67,0.45)',
                }}>
                  <Star size={11} color="#1A1208" strokeWidth={2.5} fill="#1A1208" />
                </div>
              )}
              {photo.caption && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  padding: '20px 8px 6px',
                  fontFamily: 'var(--f-body)', fontSize: 11, color: '#fff',
                  fontWeight: 500,
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                  {photo.caption}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {pendingFile && (
        <div
          onClick={uploading ? undefined : cancelUpload}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 250, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              border: '1px solid rgba(244,238,223,0.15)',
              borderRadius: 20, padding: 18, maxWidth: 380, width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <p style={{
              fontFamily: 'var(--f-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: '0.22em',
              textTransform: 'uppercase', margin: '0 0 12px',
            }}>
              {t('gallery_new_photo')}
            </p>

            {pendingPreview && (
              <img
                src={pendingPreview}
                alt={t('gallery_preview_alt')}
                style={{
                  width: '100%', maxHeight: 320, objectFit: 'cover',
                  borderRadius: 12, marginBottom: 14,
                  border: '1px solid rgba(244,238,223,0.08)',
                }}
              />
            )}

            <input
              type="text"
              value={pendingCaption}
              onChange={(e) => setPendingCaption(e.target.value)}
              placeholder={t('gallery_caption_placeholder')}
              maxLength={120}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.10)',
                borderRadius: 12,
                color: 'var(--text)',
                fontFamily: 'var(--f-body)', fontSize: 14,
                outline: 'none',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                style={{
                  flex: 1, padding: 13, borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid rgba(244,238,223,0.15)',
                  color: 'var(--text)',
                  fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1,
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={uploading}
                style={{
                  flex: 1, padding: 13, borderRadius: 999,
                  background: 'var(--grad-logo)',
                  border: 'none', color: '#1A1208',
                  fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 700,
                  cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 8px 20px rgba(212,168,67,0.30)',
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    {t('gallery_uploading')}
                  </>
                ) : (
                  t('gallery_add')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onCaptionChange={(c) => handleCaptionEdit(lightboxPhoto, c)}
          onToggleCover={() => handleToggleCover(lightboxPhoto)}
          onDelete={() => handleDelete(lightboxPhoto)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function PhotoLightbox({
  photo, onClose, onCaptionChange, onToggleCover, onDelete,
}: {
  photo: TripPhoto;
  onClose: () => void;
  onCaptionChange: (c: string) => void;
  onToggleCover: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const [caption, setCaption] = useState(photo.caption || '');
  const [editing, setEditing] = useState(false);

  const commitCaption = () => {
    if (caption !== (photo.caption || '')) onCaptionChange(caption);
    setEditing(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 300,
        maxWidth: 430, margin: '0 auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'rgba(244,238,223,0.10)', border: 'none',
            width: 38, height: 38, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)',
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onToggleCover}
            aria-label={photo.is_cover ? t('gallery_remove_cover_aria') : t('gallery_set_cover_aria')}
            style={{
              background: photo.is_cover ? 'var(--grad-logo)' : 'rgba(244,238,223,0.10)',
              border: 'none',
              width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: photo.is_cover ? '#1A1208' : 'var(--accent)',
            }}
          >
            <Star size={16} strokeWidth={2} fill={photo.is_cover ? '#1A1208' : 'none'} />
          </button>
          <button
            onClick={onDelete}
            aria-label={t('gallery_delete_aria')}
            style={{
              background: 'rgba(168,44,44,0.15)', border: 'none',
              width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#E07060',
            }}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px', minHeight: 0,
        }}
      >
        {photo.signed_url && (
          <img
            src={photo.signed_url}
            alt={photo.caption || t('gallery_photo_alt')}
            style={{
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
              borderRadius: 12,
            }}
          />
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '18px 20px 24px' }}
      >
        {editing ? (
          <input
            autoFocus
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={commitCaption}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitCaption(); }
              if (e.key === 'Escape') { setCaption(photo.caption || ''); setEditing(false); }
            }}
            maxLength={120}
            placeholder={t('gallery_add_caption')}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(244,238,223,0.08)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              color: 'var(--text)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(244,238,223,0.04)',
              border: '1px solid rgba(244,238,223,0.10)',
              borderRadius: 12,
              color: photo.caption ? 'var(--text)' : 'var(--text-muted)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              textAlign: 'left',
              cursor: 'pointer',
              fontStyle: photo.caption ? 'normal' : 'italic',
            }}
          >
            {photo.caption || t('gallery_add_caption_placeholder')}
          </button>
        )}
      </div>
    </div>
  );
}