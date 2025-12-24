// src/components/HomePage/components/FloatingCTAButton.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FloatingCTAButtonProps {
  locale: 'he' | 'en';
  /** גובה הגלילה שממנו הכפתור מופיע (ברירת מחדל: 600px) */
  showAfterScroll?: number;
  /** האם להציג גם בדסקטופ (ברירת מחדל: false - מובייל בלבד) */
  showOnDesktop?: boolean;
}

const FloatingCTAButton: React.FC<FloatingCTAButtonProps> = ({
  locale,
  showAfterScroll = 600,
  showOnDesktop = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // בדיקה ראשונית

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  // טקסטים לפי שפה
  const text = locale === 'he' ? 'להרשמה' : 'Sign Up';
  const ariaLabel = locale === 'he' ? 'להרשמה לאתר' : 'Sign up to the website';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            mass: 0.8,
          }}
          className={`
            fixed bottom-6 right-4 z-50
            ${showOnDesktop ? '' : 'md:hidden'}
          `}
        >
          <Link
            href={`/${locale}/auth/register`}
            aria-label={ariaLabel}
            onClick={() => setHasInteracted(true)}
          >
            {/* כפתור עגול עם אפקט Glassmorphism */}
            <motion.div whileHover={{ scale: 1.05 }} className="relative group">
              {/* Pulse Ring - אנימציית גל מושכת תשומת לב */}
              {!hasInteracted && (
                <>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-orange-400 animate-ping opacity-30" />
                  <span
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-orange-400 opacity-20"
                    style={{
                      animation:
                        'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s',
                    }}
                  />
                </>
              )}

              {/* הכפתור עצמו */}
              <div className="relative flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white font-bold text-sm shadow-xl shadow-teal-500/30 border border-white/20 backdrop-blur-sm transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-teal-500/40">
                {/* אייקון */}
                <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform duration-300" />

                {/* טקסט */}
                <span className="tracking-wide">{text}</span>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 -z-10" />
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTAButton;
