import { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import type { DayPlan } from '../types';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';

interface Props {
  day: DayPlan;
  dayLabel: string;
  isLastDay: boolean;
  lang: LangCode;
  onNext: () => void;
  onBack: () => void;
}

export default function DailyFeedbackScreen({ day, dayLabel, isLastDay, lang, onNext, onBack }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const next = new Set(selectedSteps);
    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
    }
    setSelectedSteps(next);
  };

  const getStarColor = (rating: number) => {
    if (rating <= 2) return 'text-err';
    if (rating <= 3) return 'text-warn';
    return 'text-ok';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-bg">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-subtle">
        <div className="px-5 py-4 max-w-lg mx-auto w-full">
          <div className="text-sm font-medium text-muted mb-1">{dayLabel}</div>
          <h1 className="text-xl font-bold">
            <span className="text-orange-500">{t('feedback_day_1', lang)}</span>
            <span className="text-purple-600"> {t('feedback_day_2', lang)}</span>
          </h1>
        </div>
      </div>

      <main className="flex-1 px-5 pt-6 pb-6 max-w-lg mx-auto w-full overflow-y-auto">
        <p className="text-sm text-muted mb-6">
          {t('feedback_day_desc', lang)}
        </p>

        {/* Activities List */}
        <div className="space-y-3 mb-8">
          {day.steps.map(step => (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                selectedSteps.has(step.id)
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-surface border-subtle hover:border-purple-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{step.name}</p>
                  <p className="text-xs text-muted mt-0.5">{step.time} — {step.endTime}</p>
                </div>
                {ratings[step.id] && (
                  <div className="flex-shrink-0">
                    <div className={`text-lg font-bold ${getStarColor(ratings[step.id])}`}>
                      {ratings[step.id]}
                    </div>
                  </div>
                )}
              </div>

              {selectedSteps.has(step.id) && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs font-medium text-muted mb-3">
                    {t('feedback_how_was', lang)}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(starNum => (
                      <button
                        key={starNum}
                        onClick={e => {
                          e.stopPropagation();
                          setRatings(prev => ({ ...prev, [step.id]: starNum }));
                        }}
                        className={`px-3 py-2 rounded-lg border transition-all ${
                          ratings[step.id] === starNum
                            ? `bg-gradient-brand text-white border-transparent`
                            : 'border-subtle hover:border-purple-200'
                        }`}
                      >
                        <Star
                          size={14}
                          className={ratings[step.id] === starNum ? 'fill-white' : 'text-yellow-500'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onNext}
            className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            {isLastDay ? t('end_trip', lang) : t('next_day', lang)}
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onBack}
            className="w-full py-2.5 text-sm text-muted hover:text-ink transition-colors"
          >
            {t('back', lang)}
          </button>
        </div>
      </main>
    </div>
  );
}
