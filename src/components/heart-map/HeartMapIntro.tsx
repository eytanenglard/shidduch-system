'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, Sparkles, FileText, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  tHm: (key: string) => string;
  locale: string;
  hasExistingProgress: boolean;
  savedGender: 'MALE' | 'FEMALE' | null;
  onStart: (gender: 'MALE' | 'FEMALE', startFresh: boolean) => void;
}

export default function HeartMapIntro({ tHm, locale, hasExistingProgress, savedGender, onStart }: Props) {
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | null>(savedGender);
  const isRTL = locale === 'he';

  const features = [
    { icon: Sparkles, key: 'discover', color: 'from-teal-400 to-teal-600' },
    { icon: Users, key: 'matches', color: 'from-orange-400 to-orange-600' },
    { icon: FileText, key: 'report', color: 'from-amber-400 to-amber-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Back to home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors mb-8 text-sm"
      >
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {isRTL ? 'חזרה לדף הבית' : 'Back to home'}
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200/50 rounded-full px-4 py-1.5 mb-6">
          <Heart className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-medium text-teal-700">{tHm('intro.badge')}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          {tHm('intro.title')}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-4">
          {tHm('intro.subtitle')}
        </p>
        <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto whitespace-pre-line leading-relaxed">
          {tHm('intro.description')}
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
      >
        {features.map((feature, i) => (
          <div
            key={feature.key}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">
              {tHm(`intro.features.${feature.key}.title`)}
            </h3>
            <p className="text-xs text-gray-500">
              {tHm(`intro.features.${feature.key}.description`)}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Gender Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8 mb-8"
      >
        <h2 className="text-lg font-bold text-gray-800 text-center mb-2">
          {tHm('intro.genderSelect.title')}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {tHm('intro.genderSelect.subtitle')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedGender('MALE')}
            className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 text-center ${
              selectedGender === 'MALE'
                ? 'border-teal-500 bg-teal-50/50 shadow-md'
                : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/30'
            }`}
          >
            <div className="text-4xl mb-3">👨</div>
            <span className="font-semibold text-gray-800">{tHm('intro.genderSelect.male')}</span>
            {selectedGender === 'MALE' && (
              <div className="absolute top-3 end-3 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedGender('FEMALE')}
            className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 text-center ${
              selectedGender === 'FEMALE'
                ? 'border-orange-500 bg-orange-50/50 shadow-md'
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
            }`}
          >
            <div className="text-4xl mb-3">👩</div>
            <span className="font-semibold text-gray-800">{tHm('intro.genderSelect.female')}</span>
            {selectedGender === 'FEMALE' && (
              <div className="absolute top-3 end-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Info badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {tHm('intro.timeEstimate')}
          </span>
          <span>•</span>
          <span>{tHm('intro.privacyNote')}</span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {hasExistingProgress ? (
            <>
              <button
                onClick={() => selectedGender && onStart(selectedGender, false)}
                disabled={!selectedGender}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {tHm('intro.resumeCta')}
              </button>
              <button
                onClick={() => selectedGender && onStart(selectedGender, true)}
                disabled={!selectedGender}
                className="w-full py-3 rounded-full border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tHm('intro.startOver')}
              </button>
            </>
          ) : (
            <button
              onClick={() => selectedGender && onStart(selectedGender, true)}
              disabled={!selectedGender}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {tHm('intro.cta')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
