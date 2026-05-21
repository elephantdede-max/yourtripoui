import { useState } from 'react';
import { X, AlertCircle, Clock3, Users, Home, CreditCard as Edit3, Check } from 'lucide-react';
import type { PlanStep } from '../types';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';

interface Props {
  place: PlanStep;
  date: string;
  lang: LangCode;
  onSubmit: (data: { numPeople: number; allergies: string; indoorPreference: 'indoor' | 'outdoor' | 'no_preference' }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ReservationModal({ place, date, lang, onSubmit, onClose, isLoading }: Props) {
  const [numPeople, setNumPeople] = useState(1);
  const [numAllergicPeople, setNumAllergicPeople] = useState(0);
  const [allergies, setAllergies] = useState('');
  const [indoorPreference, setIndoorPreference] = useState<'indoor' | 'outdoor' | 'no_preference'>('no_preference');
  const [showAllergies, setShowAllergies] = useState(false);
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(false);

  const isFood = place.type === 'food';

  const handleSubmit = () => {
    onSubmit({
      numPeople,
      allergies: numAllergicPeople > 0 ? `${numAllergicPeople} ${t('person', lang)}(s) : ${allergies}` : '',
      indoorPreference,
    });
  };

  const canSubmit = numPeople > 0;

  return (
    <div
      className="fixed inset-0 bg-ink/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-xl sm:rounded-xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto animate-slideup"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{t('reservation', lang)}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 pb-4 border-b border-subtle">
          <p className="text-sm font-semibold text-ink mb-1">{place.name}</p>
          <p className="text-xs text-muted">{place.desc}</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Date & Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-sm">
              <Clock3 size={14} className="text-blue-500" />
              <div>
                <p className="font-medium text-blue-900">{date}</p>
                <p className="text-xs text-blue-700">{place.time} — {place.endTime}</p>
              </div>
            </div>
          </div>

          {/* Number of People */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
              <Users size={16} className="text-purple-500" />
              {t('num_people', lang)}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                className="px-3 py-2 border border-subtle rounded-lg hover:bg-subtle transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={numPeople}
                onChange={e => setNumPeople(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 border border-subtle rounded-lg text-center font-medium focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={() => setNumPeople(Math.min(20, numPeople + 1))}
                className="px-3 py-2 border border-subtle rounded-lg hover:bg-subtle transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Indoor/Outdoor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
              <Home size={16} className="text-orange-500" />
              {t('indoor_pref', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'indoor' as const, labelKey: 'indoor' },
                { value: 'outdoor' as const, labelKey: 'outdoor' },
                { value: 'no_preference' as const, labelKey: 'no_pref' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setIndoorPreference(opt.value)}
                  className={`py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
                    indoorPreference === opt.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-subtle hover:border-purple-200'
                  }`}
                >
                  {t(opt.labelKey, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies Section - only for food places */}
          {isFood && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  {t('allergies', lang)}
                </label>
                {!showAllergies && (
                  <button
                    onClick={() => setShowAllergies(true)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-800 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 size={12} />
                    {t('edit_allergies', lang)}
                  </button>
                )}
              </div>

              {showAllergies ? (
                <>
                  <div className="mb-3">
                    <label className="text-xs font-medium text-orange-700 mb-1.5 block">
                      {t('num_allergic', lang)}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={numAllergicPeople}
                        onChange={e => setNumAllergicPeople(parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-orange-200 rounded-lg bg-surface text-ink text-sm focus:outline-none focus:border-orange-400"
                      >
                        {Array.from({ length: numPeople + 1 }, (_, i) => (
                          <option key={i} value={i}>{i === 0 ? t('none', lang) : `${i} ${t('person', lang)}${i > 1 ? 's' : ''}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {numAllergicPeople > 0 && (
                    <div className="mb-3">
                      <label className="text-xs font-medium text-orange-700 mb-1.5 block">
                        {t('detail_allergies', lang)}
                      </label>
                      <textarea
                        value={allergies}
                        onChange={e => setAllergies(e.target.value)}
                        placeholder={t('detail_allergies_placeholder', lang)}
                        className="w-full px-3 py-2.5 border border-orange-200 rounded-lg bg-surface text-ink text-sm resize-none focus:outline-none focus:border-orange-400 transition-colors"
                        rows={3}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowAllergies(false);
                      setAllergiesConfirmed(true);
                    }}
                    className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    {t('validate_allergies', lang)}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {allergiesConfirmed && numAllergicPeople > 0 ? (
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-ok font-medium mb-1">
                        <Check size={12} />
                        {t('allergies_respected', lang)}
                      </div>
                      <p className="text-xs text-muted">
                        {numAllergicPeople} {t('concerned', lang)} — {allergies || 'Aucun détail'}
                      </p>
                      <button
                        onClick={() => setShowAllergies(true)}
                        className="text-xs text-orange-600 hover:text-orange-800 mt-1 flex items-center gap-1"
                      >
                        <Edit3 size={10} />
                        {t('modify', lang)}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-600">
                      {t('no_allergy', lang)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2.5 text-xs text-yellow-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-yellow-600" />
            <span>
              {t('reservation_info', lang)}
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full py-3.5 bg-gradient-brand text-white font-semibold rounded-full transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-25 disabled:cursor-default"
        >
          {isLoading ? t('loading', lang) : t('request_reservation', lang)}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2.5 mt-2 text-sm text-muted hover:text-ink transition-colors"
        >
          {t('cancel', lang)}
        </button>
      </div>
    </div>
  );
}
