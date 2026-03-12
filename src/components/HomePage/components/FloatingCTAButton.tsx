// src/components/HomePage/components/FloatingCTAButton.tsx
// Improvements: #19 limited ping (3 iterations), #20 simplified hover, #21 repositioned above ChatWidget

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FloatingCTAButtonProps {
  locale: 'he' | 'en';
  showAfterScroll?: number;
  showOnDesktop?: boolean;
}

const FloatingCTAButton: React.FC<FloatingCTAButtonProps> = ({
  locale,
  showAfterScroll = 600,
  showOnDesktop = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

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
          // #21: Positioned above ChatWidget (bottom-20 instead of bottom-6)
          className={`
            fixed bottom-20 right-4 z-50
            ${showOnDesktop ? '' : 'md:hidden'}
          `}
        >
          <Link href={`/${locale}/auth/register`} aria-label={ariaLabel}>
            {/* #20: Simple hover scale, no shimmer */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              {/* #19: Pulse ring runs 3 times only */}
              <span
                className="absolute inset-0 rounded-full bg-teal-400/30"
                style={{
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) 3',
                }}
              />

              {/* Solid button — no gradient shimmer */}
              <div className="relative flex items-center gap-2 px-5 py-3.5 rounded-full bg-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 border border-teal-500/20 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-teal-500/30">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="tracking-wide">{text}</span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTAButton;
