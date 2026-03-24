'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

import heDict from '@/dictionaries/soul-fingerprint/he.json';
import enDict from '@/dictionaries/soul-fingerprint/en.json';

const DISMISS_KEY = 'neshamatech_nudge_banner_dismissed';

interface HeartMapNudgeBannerProps {
  locale: string;
}

export default function HeartMapNudgeBanner({ locale }: HeartMapNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  });

  const isRTL = locale === 'he';
  const dict = locale === 'he' ? heDict : enDict;
  const t = dict.nudgeBanner;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-orange-50 p-4 md:p-5 shadow-sm"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 end-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={t.dismiss}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 md:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm">
            <MapPin className="h-5 w-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-sm md:text-base font-semibold text-gray-800">
              {t.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-500">
              {t.subtitle}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-1">
              <Link href={`/${locale}/soul-fingerprint`}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full px-4 text-xs md:text-sm gap-1.5"
                >
                  {t.cta}
                  {isRTL ? (
                    <ArrowLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t.dismiss}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
