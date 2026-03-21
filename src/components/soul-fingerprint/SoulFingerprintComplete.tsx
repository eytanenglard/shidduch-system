'use client';

import type { SFTagResult } from './types';

interface Props {
  tags: SFTagResult;
  onEdit: () => void;
  onContinue: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const TAG_CATEGORIES: { key: keyof SFTagResult; colorClass: string }[] = [
  { key: 'sectorTags', colorClass: 'bg-blue-100 text-blue-700' },
  { key: 'backgroundTags', colorClass: 'bg-green-100 text-green-700' },
  { key: 'personalityTags', colorClass: 'bg-purple-100 text-purple-700' },
  { key: 'careerTags', colorClass: 'bg-orange-100 text-orange-700' },
  { key: 'lifestyleTags', colorClass: 'bg-pink-100 text-pink-700' },
  { key: 'familyVisionTags', colorClass: 'bg-amber-100 text-amber-700' },
  { key: 'relationshipTags', colorClass: 'bg-rose-100 text-rose-700' },
  { key: 'diasporaTags', colorClass: 'bg-teal-100 text-teal-700' },
];

const CATEGORY_I18N: Record<string, string> = {
  sectorTags: 'sector',
  backgroundTags: 'background',
  personalityTags: 'personality',
  careerTags: 'career',
  lifestyleTags: 'lifestyle',
  familyVisionTags: 'family',
  relationshipTags: 'relationship',
  diasporaTags: 'diaspora',
};

export default function SoulFingerprintComplete({ tags, onEdit, onContinue, t, isRTL }: Props) {
  const totalTags = Object.values(tags).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-lg mx-auto text-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Success animation */}
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('completion.title')}</h1>
      <p className="text-sm text-gray-500 mb-2">{t('completion.subtitle')}</p>
      <p className="text-sm text-gray-600 whitespace-pre-line mb-8">{t('completion.description')}</p>

      {/* Stats summary */}
      <div className="flex justify-center gap-4 mb-6">
        {TAG_CATEGORIES.filter(({ key }) => (tags[key]?.length || 0) > 0).slice(0, 4).map(({ key, colorClass }) => (
          <div key={key} className="text-center">
            <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-sm font-bold mx-auto mb-1`}>
              {tags[key].length}
            </div>
            <p className="text-xs text-gray-500">{t(`completion.categories.${CATEGORY_I18N[key]}`)}</p>
          </div>
        ))}
      </div>

      {/* Tag cloud */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-start">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t('completion.tagsTitle')} ({totalTags})
        </h3>
        <div className="space-y-3">
          {TAG_CATEGORIES.map(({ key, colorClass }) => {
            const categoryTags = tags[key];
            if (!categoryTags || categoryTags.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-xs text-gray-500 mb-1">
                  {t(`completion.categories.${CATEGORY_I18N[key]}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categoryTags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-base font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md mb-3"
      >
        {t('completion.cta')}
      </button>
      <button
        onClick={onEdit}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        {t('completion.edit')}
      </button>
    </div>
  );
}
