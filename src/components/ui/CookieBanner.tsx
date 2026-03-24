// src/components/ui/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './button';
import { Shield, X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CookieBannerDict } from '@/types/dictionary';

interface CookieBannerProps {
  dict: CookieBannerDict;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ dict }) => {
  const [consent, setConsent] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie_consent');
    setConsent(storedConsent);

    if (!storedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsent('true');
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
    window.location.reload();
  };

  const handleDecline = () => {
    setConsent('false');
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (consent === 'true' || consent === 'false') {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-teal-500/10 border border-white/60 p-5 md:p-6 overflow-hidden"
            >
              {/* Decorative orbs */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-teal-200/25 to-emerald-100/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-orange-200/20 to-amber-100/10 rounded-full blur-2xl pointer-events-none" />

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 left-3 p-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors duration-200 group"
                aria-label={dict.aria_close}
              >
                <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
              </button>

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon */}
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                  className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25"
                >
                  <Cookie className="w-5 h-5 text-white" />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-base font-bold text-gray-800 mb-1 flex items-center gap-1.5"
                  >
                    <Shield className="w-4 h-4 text-teal-600" />
                    {dict.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 leading-relaxed text-sm"
                  >
                    {dict.text_part1}
                    <Link
                      href="/legal/privacy-policy"
                      className="text-teal-600 hover:text-teal-700 font-medium mx-1 underline decoration-1 underline-offset-2 transition-colors"
                    >
                      {dict.privacy_policy_link}
                    </Link>
                    {dict.text_part2}
                  </motion.p>
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0"
                >
                  <Button
                    onClick={handleAccept}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] flex-1 sm:flex-none text-sm px-5"
                  >
                    <span className="font-semibold">{dict.accept_button}</span>
                  </Button>

                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="border-2 border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-300 rounded-full transition-all duration-300 flex-1 sm:flex-none text-sm px-5"
                  >
                    <span className="font-medium">{dict.decline_button}</span>
                  </Button>
                </motion.div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-teal-400 to-orange-400 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
