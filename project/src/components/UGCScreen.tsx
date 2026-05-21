import { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock3, Camera, X, Plus } from 'lucide-react';
import type { UGCEntry, PlaceType } from '../types';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';
import { getUGCCenter, isValidVideoUrl } from '../lib/ai-engine';
import Tooltip from './Tooltip';

const TYPE_OPTIONS: { value: PlaceType; labelKey: string; icon: string; color: string }[] = [
  { value: 'chill', labelKey: 'type_chill', icon: '☕', color: 'bg-blue-400' },
  { value: 'food', labelKey: 'type_food', icon: '🍽️', color: 'bg-orange-400' },
  { value: 'culture', labelKey: 'type_culture', icon: '🎨', color: 'bg-purple-400' },
  { value: 'view', labelKey: 'type_view', icon: '📸', color: 'bg-pink-400' },
  { value: 'social', labelKey: 'type_social', icon: '👥', color: 'bg-green-400' },
];

interface Props {
  ugcData: UGCEntry[];
  city: string;
  lang: LangCode;
  onBack: () => void;
  onSubmit: (entry: UGCEntry) => void;
  onVote: (id: string) => void;
}

export default function UGCScreen({ ugcData, city, lang, onBack, onSubmit, onVote }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [vid, setVid] = useState('');
  const [selectedType, setSelectedType] = useState<PlaceType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const cityPlaces = ugcData.filter(p => p.city === city);

  const handleSubmit = () => {
    if (!name.trim() || !desc.trim() || !selectedType) return;
    const ctr = getUGCCenter(city);
    const entry: UGCEntry = {
      id: `ugc_${Date.now()}`,
      name: name.trim(),
      desc: desc.trim(),
      type: selectedType,
      city,
      vid: vid.trim() || null,
      status: 'pending',
      score: 3.0,
      ver: false,
      community: true,
      lat: ctr.lat + (Math.random() - 0.5) * 0.018,
      lng: ctr.lng + (Math.random() - 0.5) * 0.018,
      budget: ['free', 'low', 'mid', 'high'],
      tags: [selectedType, 'chill', 'amis'],
      dur: 60,
      votes: 0,
      trustScore: 0,
      submittedAt: new Date().toISOString(),
    };
    onSubmit(entry);
    setName('');
    setDesc('');
    setVid('');
    setSelectedType(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setTimeout(() => setShowForm(false), 500);
  };

  const canSubmit = name.trim() && desc.trim() && selectedType;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-bg">
      <header className="px-5 py-3.5">
        <div className="text-lg font-semibold tracking-tight">Jorne</div>
      </header>

      <div className="px-5">
        <div className="h-[2px] bg-subtle rounded-full overflow-hidden">
          <div className="h-full bg-gradient-brand rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      <main className="flex-1 px-5 pt-6 pb-6 max-w-lg mx-auto w-full overflow-y-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted text-sm mb-4 hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          {t('back', lang)}
        </button>

        <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-md px-4 py-2.5 mb-6">
          <span className="text-sm font-medium text-orange-700">
            {t('add_activity_to', lang)} {city}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-1">
          <span className="text-orange-500">{t('share_tips', lang)}</span>
          <span className="text-purple-600">{t('share_tips_2', lang)}</span>
        </h1>
        <p className="text-sm text-muted mb-6">
          {t('share_desc', lang)} {city}.
        </p>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98] mb-6"
          >
            <Plus size={18} />
            {t('propose_place', lang)}
          </button>
        )}

        {showForm && (
          <div className="bg-surface border-2 border-purple-200 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">{t('new_place', lang)}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-3.5">
              <label className="text-xs font-medium text-muted mb-1 block">{t('place_name', lang)}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('place_name_placeholder', lang)}
                className="w-full px-3 py-2.5 border border-subtle rounded-lg bg-surface text-ink text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="mb-3.5">
              <label className="text-xs font-medium text-muted mb-2 block">{t('experience_type', lang)}</label>
              <div className="grid grid-cols-5 gap-2">
                {TYPE_OPTIONS.map(tp => (
                  <button
                    key={tp.value}
                    onClick={() => setSelectedType(tp.value)}
                    className={`py-2 rounded-lg font-semibold text-white text-sm transition-all ${
                      selectedType === tp.value
                        ? `${tp.color} scale-105`
                        : `${tp.color} opacity-60 hover:opacity-100`
                    }`}
                  >
                    <div className="text-base mb-0.5">{tp.icon}</div>
                    <div className="text-[0.65rem]">{t(tp.labelKey, lang)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3.5">
              <label className="text-xs font-medium text-muted mb-1 block">{t('description', lang)}</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder={t('description_placeholder', lang)}
                className="w-full px-3 py-2.5 border border-subtle rounded-lg bg-surface text-ink text-sm resize-none focus:outline-none focus:border-purple-400 transition-colors"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-medium text-muted">
                  <Camera size={12} className="inline mr-1" />
                  {t('video_link', lang)}
                </label>
                <Tooltip
                  title={t('tt_video', lang)}
                  description={t('tt_video_desc', lang)}
                  lang={lang}
                />
              </div>
              <input
                type="text"
                value={vid}
                onChange={e => setVid(e.target.value)}
                placeholder={t('video_placeholder', lang)}
                className="w-full px-3 py-2.5 border border-subtle rounded-lg bg-surface text-ink text-sm text-xs focus:outline-none focus:border-purple-400 transition-colors"
              />
              {vid && !isValidVideoUrl(vid).valid && (
                <p className="text-[0.7rem] text-err mt-1">{t('video_invalid', lang)}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3 bg-gradient-brand text-white font-semibold rounded-full transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-25 disabled:cursor-default"
            >
              {t('submit_place', lang)}
            </button>
          </div>
        )}

        {showSuccess && (
          <div className="mb-6 py-3 px-4 bg-ok-soft rounded-lg flex items-center gap-2.5">
            <CheckCircle size={16} className="text-ok flex-shrink-0" />
            <span className="text-sm font-medium text-ok">{t('place_submitted', lang)}</span>
          </div>
        )}

        {cityPlaces.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">
              {t('proposed_places', lang)} ({cityPlaces.length})
            </p>
            <div className="space-y-2.5">
              {cityPlaces.map(place => (
                <div key={place.id} className="bg-surface border border-subtle rounded-lg p-3.5 hover:border-purple-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_OPTIONS.find(tp => tp.value === place.type)?.icon || '📍'}</span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{place.name}</p>
                        <p className="text-[0.75rem] text-muted">
                          {place.status === 'pending' ? `⏳ ${t('pending', lang)}` : `✓ ${t('verified', lang)}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted">
                      <Clock3 size={12} className="inline mr-1" />
                      {place.dur}m
                    </span>
                  </div>
                  <p className="text-[0.8rem] text-muted mb-3 leading-relaxed">{place.desc}</p>
                  <button
                    onClick={() => onVote(place.id)}
                    className="text-[0.75rem] font-medium px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                  >
                    👍 {t('useful', lang)} ({place.votes})
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {cityPlaces.length === 0 && !showForm && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-700">
              {t('no_places', lang)} {city} {t('no_places_2', lang)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
