'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, UserPlus, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
  isAuthenticated?: boolean;
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(undefined);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function HeartMapResults({ answers, gender, locale, t, tHm, isAuthenticated = false }: Props) {
  const isRTL = locale === 'he';
  const { result, isLoading, fetchEstimate } = useMatchEstimate();
  const [showReport, setShowReport] = useState(false);

  // Fetch estimate on mount
  useEffect(() => {
    fetchEstimate(answers, gender);
  }, [answers, gender, fetchEstimate]);

  const matchCount = result?.estimatedMatches ?? 0;
  const tags = deriveTagsFromAnswers(answers);
  const allTags = [
    ...tags.sectorTags,
    ...tags.personalityTags,
    ...tags.careerTags,
    ...tags.lifestyleTags,
    ...tags.familyVisionTags,
    ...tags.relationshipTags,
  ].slice(0, 12);

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
        <HeartMapReport answers={answers} gender={gender} locale={locale} t={t} tHm={tHm} />
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
          <span className="text-4xl font-bold text-white">
            <AnimatedCounter target={matchCount} />
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {getTitle()}
        </h1>
        <p className="text-base text-gray-600 max-w-lg mx-auto">
          {getSubtitle()}
        </p>
      </motion.div>

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {allTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200/50 rounded-full text-xs font-medium text-teal-700"
            >
              {tag}
            </span>
          ))}
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
