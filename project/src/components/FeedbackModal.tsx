import { useState } from 'react';
import { X } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

interface Props {
  lang: LangCode;
  onSubmit: (stars: number, comment: string) => void;
  onClose: () => void;
}

export default function FeedbackModal({ onSubmit, onClose }: Props) {
  const { t } = useLang();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onSubmit(stars, comment);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-xl sm:rounded-xl p-5 w-full max-w-sm animate-slideup"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{t('your_opinion')}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-5">
          {t('how_was')}
        </p>

        <div className="flex gap-3 justify-center mb-5">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setStars(v)}
              className={`text-2xl transition-all ${
                v <= stars ? 'opacity-100' : 'opacity-20'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          placeholder={t('feedback_placeholder')}
          className="w-full px-3 py-2.5 border border-subtle rounded-md bg-surface text-ink text-sm leading-relaxed resize-none focus:outline-none focus:border-ink/40 transition-colors placeholder:text-muted/50 mb-4"
        />

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-ink text-white font-medium rounded-lg transition-all hover:bg-ink/90"
        >
          {t('send')}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 mt-2 text-sm text-muted hover:text-ink transition-colors"
        >
          {t('later')}
        </button>
      </div>
    </div>
  );
}