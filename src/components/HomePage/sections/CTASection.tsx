// src/components/HomePage/sections/CTASection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import type { CtaDict } from '@/types/dictionary';
import type { Session } from 'next-auth';

// --- Type Definition for Component Props ---
interface CTAProps {
  dict: CtaDict;
  locale: 'he' | 'en';
  session?: Session | null;
}

const CTASection: React.FC<CTAProps> = ({ dict, locale, session }) => {
  const isLoggedIn = !!session?.user;
  const isCompleted = !!session?.user?.questionnaireCompleted;

  const ctaHref = isCompleted
    ? `/${locale}/profile`
    : isLoggedIn
      ? `/${locale}/questionnaire`
      : '/auth/register';

  const ctaButton = isCompleted
    ? (dict.buttonCompleted || dict.button)
    : isLoggedIn
      ? (dict.buttonLoggedIn || dict.button)
      : dict.button;

  const ctaHighlight = isCompleted
    ? (dict.title_highlightCompleted || dict.title_highlight)
    : isLoggedIn
      ? (dict.title_highlightLoggedIn || dict.title_highlight)
      : dict.title_highlight;

  const ctaSubtitle = isCompleted
    ? (dict.subtitleCompleted || dict.subtitle)
    : isLoggedIn
      ? (dict.subtitleLoggedIn || dict.subtitle)
      : dict.subtitle;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.1,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 px-4 bg-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Updated Background Overlay: Teal -> Orange/Rose mix */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-orange-50/50 opacity-70"></div>

      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          // Updated Border
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-teal-100"
          variants={cardVariants}
        >
          <motion.div
            // Updated Icon Colors
            className="inline-block mb-6 p-3 bg-teal-100 rounded-full text-teal-600"
            variants={iconVariants}
            whileHover={{
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.6 },
            }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4"
            variants={textVariants}
          >
            {dict.title_part1}
            {/* Updated Title Gradient */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-500 to-amber-500">
              {' '}
              {ctaHighlight}
            </span>
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            variants={textVariants}
          >
            {ctaSubtitle}
          </motion.p>

          <motion.div variants={buttonVariants}>
            <Link href={ctaHref}>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  // Updated Button Gradient to Match Hero
                  className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                >
                  <span className="relative z-10 flex items-center">
                    {ctaButton}
                    {locale === 'he' ? (
                      <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    ) : (
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    )}{' '}
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CTASection;
