import { useState, useEffect } from 'react';
import { Star, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { submitReview, getMyReviewsForTrip } from '../lib/supabase';
import { useLang } from '../lib/lang-context';
import { useNotifs } from '../lib/notif-context';
import { useToast } from '../lib/toast-context';

interface PlaceReview {
  placeId: string;
  placeName: string;
  type: string;
  subType?: string;
  rating: number | null;
  visited: boolean;
  comment?: string;
}

interface Props {
  places: PlaceReview[];
  tripId?: string | null;
  onClose: () => void;
  onSubmit: (reviews: PlaceReview[], comment: string) => void;
}

const EMOJIS: Record<string, string> = {
  // Catégories brutes (au cas où le type vient direct de la base)
  restaurant: '🍴', cafe: '☕', bar: '🍸',
  museum: '🎨', park: '🌿', theater: '🎭',
  monument: '🛕',
  // Types internes (ce qui arrive en réalité dans current.type)
  food: '🍴', culture: '🎨', chill: '🌿',
  social: '🍸', view: '🛕', leisure: '🎉',
  nature: '🌳',
  default: '📍',
};

const G = '#C9A961';
const BG = '#000000';

export default function ReviewScreen({ places, tripId, onClose, onSubmit }: Props) {
    const { toast } = useToast();
const { t } = useLang();
  const { removeNotif } = useNotifs();
  const [reviews, setReviews] = useState<PlaceReview[]>(places);
  const [index, setIndex] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [animating, setAnimating] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Si tripId fourni, pré-remplir avec les notes existantes
  useEffect(() => {
    if (!tripId) return;
    getMyReviewsForTrip(tripId).then(existing => {
      if (existing.length === 0) return;
      const map = new Map(existing.map(r => [r.place_id, r]));
      setReviews(prev => prev.map(p => {
        const r = map.get(p.placeId);
        return r ? { ...p, rating: r.rating, visited: true } : p;
      }));
    });
  }, [tripId]);

  const current = reviews[index];
  const isLast = index === reviews.length - 1;

  const setRating = (rating: number) => {
    setReviews(prev => prev.map((p, i) =>
      i === index ? { ...p, rating, visited: true } : p
    ));
  };

  const skipPlace = () => {
    setReviews(prev => prev.map((p, i) =>
      i === index ? { ...p, visited: false, rating: null } : p
    ));
    goNext();
  };

  const goNext = () => {
    if (isLast) setShowFinal(true);
    else { setIndex(i => i + 1); setHoveredRating(0); }
  };

  const goPrev = () => {
    if (index > 0) { setIndex(i => i - 1); setHoveredRating(0); }
  };

 const handleSubmit = async () => {
  if (submitting) return;
  
  setSubmitting(true);
  try {
    for (const r of reviews) {
      if (r.visited && r.rating !== null) {
        await submitReview(r.placeId, r.rating, tripId, r.comment || null);
      }
    }
    // Virer la notif de la cloche maintenant que les notes sont envoyées
    if (tripId) removeNotif('review-' + tripId);
    // Lancer l'animation puis fermer après 3s
    setAnimating(true);
    setTimeout(() => {
      onSubmit(reviews, comment);
    }, 3000);
  } catch (e) {
    console.error('Erreur envoi reviews:', e);
    toast.error(t('review_send_error'));
    setSubmitting(false);
  }
};

  const visited = reviews.filter(r => r.visited && r.rating !== null).length;

  // ─── ÉCRAN FINAL : commentaire + envoi ───
  if (showFinal) {
    return (
      <>
        {/* ─── Animation cœurs dorés ─── */}
        {animating && (
          <>
            <style>{`
              @keyframes floatUp {
                0%   { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 0; }
                15%  { opacity: 1; transform: translateY(-20vh) rotate(20deg) scale(1); }
                100% { transform: translateY(-110vh) rotate(360deg) scale(1.2); opacity: 0; }
              }
              @keyframes pulseCheck {
                0%   { transform: scale(0); opacity: 0; }
                40%  { transform: scale(1.3); opacity: 1; }
                60%  { transform: scale(0.95); }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              pointerEvents: 'none', overflow: 'hidden',
              background: 'rgba(0,0,0,0.7)',
            }}>
              {Array.from({ length: 14 }).map((_, i) => {
                const left = 5 + Math.random() * 90;
                const delay = Math.random() * 1.5;
                const size = 20 + Math.random() * 36;
                const duration = 2.2 + Math.random() * 1;
                return (
                  <span key={i} style={{
                    position: 'absolute', left: `${left}%`, bottom: '-60px',
                    fontSize: `${size}px`,
                    animation: `floatUp ${duration}s ${delay}s ease-out forwards`,
                    color: G,
                  }}>💛</span>
                );
              })}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'pulseCheck 800ms ease-out forwards',
                background: G, color: BG,
                width: 120, height: 120, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 60px ${G}88`,
                fontSize: 60, fontWeight: 700,
              }}>✓</div>
              <div style={{
                position: 'absolute', top: 'calc(50% + 90px)', left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700,
                color: G, textAlign: 'center', whiteSpace: 'nowrap',
              }}>
                {t('review_thanks')}
              </div>
            </div>
          </>
        )}

        {/* ─── Écran final ─── */}
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: BG, border: `2px solid ${G}`, borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, color: G, margin: 0 }}>
  {t('review_almost_done')}
</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color={G} />
              </button>
            </div>

            <p style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
  <strong style={{ color: G }}>{visited}</strong> {t('review_x_places_rated')}
</p>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('review_journey_placeholder')}
              rows={4}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: '#111', border: `1px solid ${G}55`,
                color: G, fontFamily: 'var(--f-display)', fontSize: 14,
                outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 20,
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || visited === 0}
              style={{
                width: '100%', padding: '16px', borderRadius: 40,
                background: visited > 0 && !submitting ? G : '#333',
                color: visited > 0 && !submitting ? BG : '#666',
                border: 'none', cursor: visited > 0 && !submitting ? 'pointer' : 'default',
                fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {submitting ? t('review_sending') : t('review_send_notes')}
            </button>

            <button
              onClick={() => setShowFinal(false)}
              style={{
                width: '100%', padding: 10, background: 'none',
                border: 'none', color: '#666', cursor: 'pointer',
                fontFamily: 'var(--f-display)', fontSize: 13,
              }}
            >
              {t('review_back_to_places')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── ÉCRAN SWIPE : un lieu à la fois ───
  if (!current) return null;

  // Priorité au subType (cafe/restaurant/bar/theater) pour avoir l'emoji précis,
  // sinon fallback sur le type général (food/culture/chill/...)
  const emoji = (current.subType && EMOJIS[current.subType]) || EMOJIS[current.type] || EMOJIS.default;
  const displayRating = hoveredRating || current.rating || 0;

  return (
    <>
      {/* ─── Animation cœurs dorés ─── */}
      {animating && (
        <>
          <style>{`
            @keyframes floatUp {
              0%   { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 0; }
              15%  { opacity: 1; transform: translateY(-20vh) rotate(20deg) scale(1); }
              100% { transform: translateY(-110vh) rotate(360deg) scale(1.2); opacity: 0; }
            }
            @keyframes pulseCheck {
              0%   { transform: scale(0); opacity: 0; }
              40%  { transform: scale(1.3); opacity: 1; }
              60%  { transform: scale(0.95); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            pointerEvents: 'none', overflow: 'hidden',
            background: 'rgba(0,0,0,0.7)',
          }}>
            {Array.from({ length: 14 }).map((_, i) => {
              const left = 5 + Math.random() * 90;
              const delay = Math.random() * 1.5;
              const size = 20 + Math.random() * 36;
              const duration = 2.2 + Math.random() * 1;
              return (
                <span key={i} style={{
                  position: 'absolute', left: `${left}%`, bottom: '-60px',
                  fontSize: `${size}px`,
                  animation: `floatUp ${duration}s ${delay}s ease-out forwards`,
                  color: G,
                }}>💛</span>
              );
            })}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'pulseCheck 800ms ease-out forwards',
              background: G, color: BG,
              width: 120, height: 120, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 60px ${G}88`,
              fontSize: 60, fontWeight: 700,
            }}>✓</div>
            <div style={{
              position: 'absolute', top: 'calc(50% + 90px)', left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700,
              color: G, textAlign: 'center', whiteSpace: 'nowrap',
            }}>
              {t('review_thanks')}
            </div>
          </div>
        </>
      )}

      {/* ─── Écran swipe ─── */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
        <div style={{ background: BG, border: `2px solid ${G}`, borderRadius: 20, padding: 28, maxWidth: 400, width: '100%' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: '#666' }}>
              {index + 1} / {reviews.length}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color={G} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: '#333', borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ height: '100%', width: `${((index + 1) / reviews.length) * 100}%`, background: G, transition: 'width 300ms' }} />
          </div>

          {/* Card */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700, color: G, marginBottom: 8 }}>
              {current.placeName}
            </h3>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: '#888', textTransform: 'capitalize' }}>
  {current.subType ? t(`subtype_${current.subType}_label`) : t(`type_${current.type}_label`)}
</p>
          </div>

          {/* Étoiles */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Star
                  size={36}
                  color={star <= displayRating ? G : '#444'}
                  fill={star <= displayRating ? G : 'none'}
                />
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontFamily: 'var(--f-display)', fontSize: 12, color: '#666', marginBottom: 28, minHeight: 16 }}>
  {displayRating === 0 ? t('review_touch_stars') :
   displayRating === 1 ? t('review_rating_1') :
   displayRating === 2 ? t('review_rating_2') :
   displayRating === 3 ? t('review_rating_3') :
   displayRating === 4 ? t('review_rating_4') : t('review_rating_5')}
</p>

          {/* Boutons navigation */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              onClick={goPrev}
              disabled={index === 0}
              style={{
                flex: 1, padding: 14, borderRadius: 12,
                background: 'transparent', border: `1px solid ${index === 0 ? '#333' : G}55`,
                color: index === 0 ? '#444' : G,
                cursor: index === 0 ? 'default' : 'pointer',
                fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <ChevronLeft size={16} /> {t('review_prev')}
            </button>

            <button
              onClick={goNext}
              disabled={!current.visited || current.rating === null}
              style={{
                flex: 2, padding: 14, borderRadius: 12,
                background: current.visited && current.rating ? G : '#333',
                color: current.visited && current.rating ? BG : '#666',
                border: 'none',
                cursor: current.visited && current.rating ? 'pointer' : 'default',
                fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {isLast ? t('review_finish') : t('review_next')} <ChevronRight size={16} />
            </button>
          </div>

          {/* Commentaire optionnel par lieu */}
          {current.visited && current.rating !== null && (
            <textarea
              value={current.comment || ''}
              onChange={e => {
                const v = e.target.value;
                setReviews(prev => prev.map((p, i) =>
                  i === index ? { ...p, comment: v } : p
                ));
              }}
              placeholder={t('review_comment_placeholder')}
              rows={2}
              style={{
                width: '100%', padding: 10, borderRadius: 10,
                background: '#111', border: `1px solid ${G}33`,
                color: G, fontFamily: 'var(--f-display)', fontSize: 12,
                outline: 'none', resize: 'none', boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
          )}

          <button
            onClick={skipPlace}
            style={{
              width: '100%', padding: 8, background: 'none',
              border: 'none', color: '#666', cursor: 'pointer',
              fontFamily: 'var(--f-display)', fontSize: 13,
            }}
          >
            {t('review_not_visited')}
          </button>
        </div>
      </div>
    </>
  );
}