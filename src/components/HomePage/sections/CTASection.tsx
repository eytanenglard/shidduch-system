// src/components/HomePage/sections/CTASection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { CtaDict } from '@/types/dictionary';

// --- Type Definition for Component Props ---
interface CTAProps {
  dict: CtaDict;
}

const CTASection: React.FC<CTAProps> = ({ dict }) => {
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
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        type: 'spring',
        stiffness: 260,
        damping: 15,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
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
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-pink-50/50 opacity-70"></div>

      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-cyan-100"
          variants={cardVariants}
        >
          <motion.div
            className="inline-block mb-6 p-3 bg-cyan-100 rounded-full text-cyan-600"
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              {' '}
              {dict.title_highlight}
            </span>
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            variants={textVariants}
          >
            {dict.subtitle}
          </motion.p>

          <motion.div variants={buttonVariants}>
            <Link href="/auth/register">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                >
                  <span className="relative z-10 flex items-center">
                    {dict.button}
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
