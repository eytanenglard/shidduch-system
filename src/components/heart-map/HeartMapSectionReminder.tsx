'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  currentSection: number;
  totalSections: number;
  locale: string;
  tHm: (key: string) => string;
  onContinue: () => void;
}

export default function HeartMapSectionReminder({
  isOpen,
  currentSection,
  totalSections,
  locale,
  tHm,
  onContinue,
}: Props) {
  const isRTL = locale === 'he';
  const progressPercent = Math.round((currentSection / totalSections) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Progress */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 mb-4">
                <span className="text-lg">🎉</span>
                <span className="text-sm font-semibold text-teal-700">
                  {tHm('sectionReminder.title')}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {tHm('sectionReminder.progressText')
                  .replace('{current}', String(currentSection))
                  .replace('{total}', String(totalSections))}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-teal-500 to-orange-500 h-2.5 rounded-full"
                />
              </div>
            </div>

            {/* Save notice */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    {tHm('sectionReminder.localSaveNotice')}
                  </p>
                  <p className="text-xs text-amber-600">
                    {tHm('sectionReminder.registerBenefit')}
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={onContinue}
                className="w-full py-3 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                {tHm('sectionReminder.continueCta')}
              </button>

              <Link
                href={`/${locale}/auth/register?from=heart-map`}
                className="w-full py-3 rounded-full border-2 border-orange-300 text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {tHm('sectionReminder.registerCta')}
              </Link>

              <p className="text-center text-xs text-gray-400">
                {tHm('sectionReminder.laterNote')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
