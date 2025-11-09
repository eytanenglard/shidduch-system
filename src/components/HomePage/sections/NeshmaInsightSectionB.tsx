// src/components/HomePage/sections/NeshmaInsightSection.tsx
// גרסה היברידית: משלבת חום אישי עם מבנה ברור ושפה צנועה-אסרטיבית

'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Compass,
  Target,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface NeshmaInsightSectionProps {
  dict: any; // יוגדר בהמשך בקובץ הטיפוסים
  locale: 'he' | 'en';
}

export default function NeshmaInsightSection({
  dict,
  locale,
}: NeshmaInsightSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isHebrew = locale === 'he';
  const direction = isHebrew ? 'rtl' : 'ltr';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const staggerItems = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: isHebrew ? 20 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  // Icons for the benefit cards
  const benefitIcons = [
    { icon: Heart, gradient: 'from-pink-500 to-rose-500' },
    { icon: Compass, gradient: 'from-cyan-500 to-blue-500' },
    { icon: Target, gradient: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-24 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-pink-50/40 relative overflow-hidden"
      dir={direction}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-pink-200/10 rounded-full blur-3xl"></div>
        <div
          className="absolute bottom-40 right-10 w-40 h-40 bg-gradient-to-br from-cyan-200/15 to-purple-200/10 rounded-full blur-3xl"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative">
        {/* Header Badge */}
        <motion.div className="flex justify-center mb-8" variants={fadeInUp}>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-orange-100">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="text-orange-700 font-semibold">{dict.badge}</span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 text-gray-800 leading-tight"
        >
          {dict.title_part1}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500">
            {dict.title_highlight}
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="text-lg md:text-xl text-center text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto"
        >
          {dict.subtitle}
        </motion.p>

        {/* Opening Question Card */}
        <motion.div
          variants={fadeInScale}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-10 border border-orange-200/50 shadow-lg max-w-3xl mx-auto"
        >
          <p className="text-base md:text-lg text-gray-700 leading-relaxed text-center">
            {dict.opening_question}
          </p>
        </motion.div>

        {/* The Journey Section */}
        <motion.div variants={fadeInUp} className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
            {dict.journey.title}
          </h3>

          <motion.div
            variants={staggerItems}
            className="space-y-4 max-w-3xl mx-auto"
          >
            {dict.journey.steps.map((step: string, index: number) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-start gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-5 hover:bg-white/80 hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${benefitIcons[index % 3].gradient} flex items-center justify-center shadow-md`}
                >
                  {React.createElement(benefitIcons[index % 3].icon, {
                    className: 'w-5 h-5 text-white',
                  })}
                </div>
                <p className="text-base md:text-lg text-gray-800 leading-relaxed pt-1.5">
                  {step}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* What You Get - Benefits Grid */}
        <motion.div variants={fadeInUp} className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
            {dict.benefits.title}
          </h3>

          <motion.div
            variants={staggerItems}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {dict.benefits.items.map(
              (
                benefit: { icon: string; title: string; description: string },
                index: number
              ) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${benefitIcons[index % 3].gradient} text-white mb-4 shadow-md`}
                  >
                    {React.createElement(benefitIcons[index % 3].icon, {
                      className: 'w-6 h-6',
                    })}
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              )
            )}
          </motion.div>
        </motion.div>

        {/* Value Proposition Card */}
        <motion.div
          variants={fadeInScale}
          className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl p-6 md:p-10 mb-10 border-2 border-orange-200/60 shadow-xl max-w-3xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-pink-200/20 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-lg md:text-xl text-gray-800 leading-relaxed text-center mb-4">
              {dict.value_proposition}
            </p>
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              <p className="font-semibold text-base">{dict.time_investment}</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={fadeInUp} className="text-center">
          <Link href={`/${locale}/register`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-4 px-10 md:px-14 rounded-full text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>{dict.cta.button}</span>
              <ArrowLeft
                className={`w-5 h-5 group-hover:${isHebrew ? '-translate-x-1' : 'translate-x-1'} transition-transform ${isHebrew ? '' : 'rotate-180'}`}
              />
            </motion.button>
          </Link>

          <motion.p variants={fadeInUp} className="mt-4 text-gray-600 italic">
            {dict.cta.subtitle}
          </motion.p>
        </motion.div>
      </div>
    </motion.section>
  );
}
