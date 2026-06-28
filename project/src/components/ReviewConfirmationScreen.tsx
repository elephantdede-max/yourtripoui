import { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

interface PlaceReview {
  placeId: string;
  placeName: string;
  type: string;
  rating: number | null;
  visited: boolean;
}

interface Props {
  reviews: PlaceReview[];
  comment: string;
  lang: LangCode;
  onClose: () => void;
}

export default function ReviewConfirmationScreen({ reviews, comment, onClose }: Props) {
  const { t } = useLang();

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const visitedReviews = reviews.filter(r => r.visited && r.rating !== null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center space-y-6 animate-zoomin">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-green-500 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-ink mb-2">
            {t('review_thanks')} ✨
          </h2>
          <p className="text-sm text-muted">
            {t('review_conf_subtitle')}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t('review_conf_summary_places')}</span>
              <span className="font-semibold text-ink">{visitedReviews.length}</span>
            </div>
            {comment && (
              <div className="pt-2 border-t border-purple-100">
                <p className="text-xs text-muted mb-1">{t('review_conf_your_comment')}</p>
                <p className="text-sm text-ink italic">"{comment}"</p>
              </div>
            )}
          </div>
        </div>

        {visitedReviews.length > 0 && (
          <div className="space-y-1">
            {visitedReviews.map((review) => (
              <div key={review.placeId} className="flex items-center justify-between text-xs">
                <span className="text-muted">{review.placeName}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= (review.rating || 0) ? 'text-[#D4A843]' : 'text-subtle'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-brand text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98]"
        >
          {t('continue')}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}