import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

interface PlaceReview {
  placeId: string;
  placeName: string;
  type: string;
  rating: number | null;
  visited: boolean;
}

interface Props {
  places: PlaceReview[];
  lang: LangCode;
  onClose: () => void;
  onSubmit: (reviews: PlaceReview[], comment: string) => void;
  isLoading?: boolean;
}

const EMOJIS: { [key: string]: string } = {
  restaurant: '🍽️',
  bar: '🍸',
  museum: '🎨',
  park: '🌿',
  theater: '🎭',
  default: '🛕',
};

export default function ReviewScreen({ places, lang, onClose, onSubmit, isLoading }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PlaceReview[]>(places);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({});

  const handleRatingChange = (placeId: string, rating: number) => {
    setReviews(prev =>
      prev.map(p =>
        p.placeId === placeId
          ? { ...p, rating, visited: true }
          : p
      )
    );
  };

  const handleMarkNotVisited = (placeId: string) => {
    setReviews(prev =>
      prev.map(p =>
        p.placeId === placeId
          ? { ...p, visited: false, rating: null }
          : p
      )
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      // Insert reviews in Supabase
   for (const review of reviews) {
  if (review.visited && review.rating !== null) {
    await supabase.from('reviews').insert({
      place_id: review.placeId,
      user_id: user.id,
      rating: review.rating,
      comment: null,  // commentaire par lieu = null (champ interne, pas affiché)
    });
  }
}
// Le commentaire global n'est pas encore sauvegardé nulle part.
// Pour l'instant, juste le logger ou l'ignorer :
if (comment) console.log('Commentaire global (usage interne):', comment);
      // Clear localStorage
      localStorage.removeItem('pending_review');

      onSubmit(reviews, comment);
    } catch (error) {
      console.error('Error submitting reviews:', error);
    }
  };

  const visitedCount = reviews.filter(r => r.visited).length;
  const hasRatings = reviews.some(r => r.visited && r.rating !== null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col animate-slideup shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-subtle px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">Comment s'est passée ta journée ?</h2>
            <p className="text-xs text-muted mt-1">Note chaque lieu que tu as visité</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Places List */}
        <div className="flex-1 px-5 py-4 space-y-4">
          {reviews.map((place) => {
            const emoji = EMOJIS[place.type] || EMOJIS.default;

            return (
              <div key={place.placeId} className="border border-subtle rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-ink">{place.placeName}</h3>
                    <p className="text-xs text-muted capitalize">{place.type}</p>
                  </div>
                </div>

                {!place.visited ? (
                  <button
                    onClick={() => handleRatingChange(place.placeId, 3)}
                    className="text-xs text-muted hover:text-purple-600 transition-colors"
                  >
                    + Noter ce lieu
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [place.placeId]: star }))}
                          onMouseLeave={() => setHoveredRating(prev => {
                            const copy = { ...prev };
                            delete copy[place.placeId];
                            return copy;
                          })}
                          onClick={() => handleRatingChange(place.placeId, star)}
                          className="transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Star
                            size={28}
                            className={`transition-all ${
                              star <= (hoveredRating[place.placeId] || place.rating || 0)
                                ? 'fill-[#D4A843] text-[#D4A843]'
                                : 'text-subtle'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Mark as not visited */}
                    <button
                      onClick={() => handleMarkNotVisited(place.placeId)}
                      className="text-xs text-muted hover:text-err transition-colors"
                    >
                      Pas visité
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment Field */}
        <div className="px-5 py-4 border-t border-subtle">
          <label className="text-xs font-medium text-muted mb-2 block">
            Un mot sur ta journée ? (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Ce qui était top, ce qui manquait..."
            className="w-full px-3 py-2.5 border border-subtle rounded-lg bg-surface text-ink text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
            rows={3}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-subtle space-y-2 bg-white">
          <button
            onClick={handleSubmit}
            disabled={!hasRatings || isLoading}
            className="w-full py-3 bg-gradient-brand text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-default"
          >
            <Send size={16} />
            {isLoading ? 'Envoi...' : 'Envoyer mes notes'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-muted text-sm font-medium transition-colors hover:text-ink"
          >
            Passer
          </button>
        </div>

        {visitedCount > 0 && (
          <div className="px-5 py-2 bg-purple-50 text-xs text-purple-700 text-center border-t border-purple-100">
            {visitedCount} lieu{visitedCount > 1 ? 'x' : ''} noté{visitedCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
