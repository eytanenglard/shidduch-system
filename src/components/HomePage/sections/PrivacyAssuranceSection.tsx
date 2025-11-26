// src/components/HomePage/sections/PrivacyAssuranceSection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock } from 'lucide-react';
import type { PrivacyAssuranceDict } from '@/types/dictionary';

// --- Type Definition for Component Props ---
interface PrivacyAssuranceProps {
  dict: PrivacyAssuranceDict;
  locale: 'he' | 'en';
}

const PrivacyAssuranceSection: React.FC<PrivacyAssuranceProps> = ({
  dict,
  locale,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const staggeredListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    },
  };

  return (
    <motion.section
      ref={ref}
      // Updated Background: Light theme with Teal/Orange tint
      className="py-16 md:py-20 px-4 bg-gradient-to-b from-slate-50 via-orange-50/20 to-white text-gray-800 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Updated Grid Pattern: Darker dots on light bg */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Updated Orbs: Teal and Orange */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl animate-float-slow"></div>
      <div
        className="absolute bottom-0 right-0 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div variants={fadeInLeft}>
            <div className="mb-8 text-center md:text-right rtl:md:text-right ltr:md:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-800">
                {dict.title}
              </h2>
              {/* Divider: Gradient Teal to Orange */}
              <div className="w-24 h-1.5 bg-gradient-to-r from-teal-400 to-orange-400 rounded-full mb-6 mx-auto md:mx-0"></div>
              <p className="text-lg md:text-xl text-gray-600 mb-6 mx-auto md:mx-0 max-w-md leading-relaxed">
                {dict.subtitle}
              </p>
            </div>

            <motion.div className="space-y-4" variants={staggeredListVariants}>
              {dict.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start"
                  variants={listItemVariants}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Icon Container: Soft Teal */}
                  <div className="bg-teal-50 rounded-full p-2 mr-3 rtl:ml-3 rtl:mr-0 mt-1 flex-shrink-0 border border-teal-100 shadow-sm">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-gray-700 font-medium pt-1">{feature}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Card */}
          <motion.div className="flex justify-center" variants={fadeInRight}>
            <div className="relative max-w-sm w-full">
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-orange-400/20 rounded-[2rem] blur-xl transform rotate-6"></div>

              <motion.div
                // Card Body: Glassmorphism Light
                className="relative bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-2xl"
                variants={cardVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                <motion.div
                  // Icon Container: Gradient Orange (Privacy/Security focus)
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 text-white transform -rotate-3"
                  whileHover={{
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.6 },
                  }}
                >
                  <Lock className="w-10 h-10 text-white drop-shadow-md" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
                  {dict.card_title}
                </h3>

                <p className="text-gray-600 text-center mb-8 leading-relaxed">
                  {dict.card_text}
                </p>

                <div className="text-center">
                  <Link href={`/${locale}/legal/privacy-policy`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Button: Outline Style (Teal) to match secondary buttons */}
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full border-2 border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-300 transition-all duration-300 font-semibold px-8"
                      >
                        {dict.card_button}
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default PrivacyAssuranceSection;
