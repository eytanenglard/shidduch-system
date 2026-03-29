'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, UserPlus, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMatchEstimate } from './hooks/useMatchEstimate';
import { deriveTagsFromAnswers } from '@/components/soul-fingerprint/types';
import type { SFAnswers } from '@/components/soul-fingerprint/types';
import HeartMapReport from './HeartMapReport';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

interface Props {
  answers: SFAnswers;
  gender: 'MALE' | 'FEMALE';
  locale: string;
  t: (key: string) => string;
  tHm: (key: string) => string;
  translateTag: (tag: string) => string;
  isAuthenticated?: boolean;
}

// Tag category labels and colors for tooltips
const TAG_CATEGORIES = {
  sectorTags: { he: 'זהות ומגזר', en: 'Identity & Sector', color: 'from-teal-50 to-teal-100 border-teal-200 text-teal-700' },
  personalityTags: { he: 'אישיות', en: 'Personality', color: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700' },
  careerTags: { he: 'קריירה', en: 'Career', color: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700' },
  lifestyleTags: { he: 'אורח חיים', en: 'Lifestyle', color: 'from-green-50 to-green-100 border-green-200 text-green-700' },
  familyVisionTags: { he: 'חזון משפחתי', en: 'Family Vision', color: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700' },
  relationshipTags: { he: 'זוגיות', en: 'Relationship', color: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700' },
} as const;

interface TagWithCategory {
  tag: string;
  category: keyof typeof TAG_CATEGORIES;
}

export default function HeartMapResults({ answers, gender, locale, t, tHm, translateTag, isAuthenticated = false }: Props) {
  const isRTL = locale === 'he';
  const { result, isLoading, fetchEstimate } = useMatchEstimate();
  const [showReport, setShowReport] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Fetch estimate on mount
  useEffect(() => {
    fetchEstimate(answers, gender);
  }, [answers, gender, fetchEstimate]);

  const matchCount = result?.estimatedMatches ?? 0;
  const tags = deriveTagsFromAnswers(answers);

  // Build tagged items with category info
  const allTagsWithCategory: TagWithCategory[] = (Object.keys(TAG_CATEGORIES) as (keyof typeof TAG_CATEGORIES)[]).flatMap(
    (category) => (tags[category] || []).map((tag: string) => ({ tag, category }))
  ).slice(0, 12);

  const getTitle = () => {
    if (matchCount >= 10) return tHm('results.title.hasMatches').replace('{count}', String(matchCount));
    if (matchCount >= 3) return tHm('results.title.fewMatches');
    return tHm('results.title.noMatches');
  };

  const getSubtitle = () => {
    if (matchCount >= 10) return tHm('results.subtitle.hasMatches').replace('{count}', String(matchCount));
    if (matchCount >= 3) return tHm('results.subtitle.fewMatches');
    return tHm('results.subtitle.noMatches');
  };

  if (showReport) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setShowReport(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          {isRTL ? 'חזרה לתוצאות' : 'Back to results'}
        </button>
        <HeartMapReport answers={answers} gender={gender} locale={locale} t={t} tHm={tHm} translateTag={translateTag} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <StandardizedLoadingSpinner
        text={tHm('results.loading')}
        subtext={isRTL ? 'אנחנו סורקים את המערכת עבורכם...' : 'Scanning the system for you...'}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Match Count */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400 via-orange-400 to-amber-400 flex items-center justify-center shadow-xl">
          <span
            className="text-4xl font-bold text-white tabular-nums"
            style={{
              // CSS counter animation
              animation: 'countUp 2s ease-out forwards',
            }}
          >
            {matchCount}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {getTitle()}
        </h1>
        <p className="text-base text-gray-600 max-w-lg mx-auto">
          {getSubtitle()}
        </p>
      </motion.div>

      {/* Interactive Tag Cloud */}
      {allTagsWithCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {allTagsWithCategory.map(({ tag, category }, i) => {
              const catInfo = TAG_CATEGORIES[category];
              const isActive = activeTag === tag;
              return (
                <motion.button
                  key={`${tag}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  className={`
                    relative px-3 py-1.5 bg-gradient-to-r ${catInfo.color} border rounded-full text-xs font-medium
                    transition-all duration-200 cursor-pointer
                    ${isActive ? 'ring-2 ring-offset-1 ring-teal-400 scale-105' : 'hover:scale-105'}
                  `}
                >
                  {translateTag(tag)}
                  {/* Tooltip */}
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded z-10"
                    >
                      {isRTL ? catInfo.he : catInfo.en}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="space-y-4"
      >
        {/* Primary CTA — different for authenticated vs guest */}
        {isAuthenticated ? (
          <Link
            href={`/${locale}/questionnaire`}
            className="w-full py-4 rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {locale === 'he' ? 'המשיכו לשאלון המלא' : 'Continue to Full Questionnaire'}
            <ArrowLeft className={`w-4 h-4 ${locale === 'he' ? '' : 'rotate-180'}`} />
          </Link>
        ) : (
          <Link
            href={`/${locale}/auth/register?from=heart-map`}
            className="w-full py-4 rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {tHm('results.registerCta')}
          </Link>
        )}

        {/* Secondary CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowReport(true)}
            className="py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {tHm('results.viewReport')}
          </button>

          <button
            onClick={() => {
              setShowReport(true);
              // Small delay to ensure report is rendered before PDF trigger
              setTimeout(() => {
                const pdfBtn = document.getElementById('heart-map-pdf-download');
                if (pdfBtn) pdfBtn.click();
              }, 500);
            }}
            className="py-3 rounded-xl border border-teal-200 text-teal-700 font-medium text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {tHm('results.downloadReport')}
          </button>
        </div>

        {/* Back to home */}
        <Link
          href={`/${locale}`}
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors pt-4"
        >
          {tHm('results.backToHome')}
        </Link>
      </motion.div>
    </div>
  );
}
