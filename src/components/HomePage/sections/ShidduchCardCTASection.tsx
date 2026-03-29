// src/components/HomePage/sections/ShidduchCardCTASection.tsx

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  IdCard,
  Copy,
  Share2,
  Sparkles,
  ArrowLeft,
  Users,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface ShidduchCardCTADict {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  features: {
    organized: string;
    shareable: string;
    aiPowered: string;
  };
  cardPreview: {
    headline: string;
    aboutMe: string;
    lookingFor: string;
    tags: string[];
  };
}

interface Props {
  dict: ShidduchCardCTADict;
  locale: string;
}

export default function ShidduchCardCTASection({ dict, locale }: Props) {
  const isRTL = locale === 'he';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const features = [
    { icon: CheckCircle2, text: dict.features.organized },
    { icon: Share2, text: dict.features.shareable },
    { icon: Sparkles, text: dict.features.aiPowered },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-300/30 to-transparent" />

      {/* Decorative blurred orbs */}
      <div
        className="absolute top-20 end-0 w-80 h-80 bg-amber-200/15 rounded-full blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 start-0 w-96 h-96 bg-rose-200/10 rounded-full blur-3xl animate-soft-float"
        aria-hidden="true"
      />

      <div
        className="relative max-w-6xl mx-auto px-4 sm:px-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-6 py-2.5 shadow-lg border border-amber-100">
            <IdCard className="w-4 h-4 text-amber-600 animate-gentle-pulse" />
            <span className="text-sm font-bold text-amber-700">
              {dict.badge}
            </span>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* === Content side === */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center lg:text-start order-2 lg:order-1"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight leading-tight">
              {dict.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-4 leading-relaxed">
              {dict.subtitle}
            </p>
            <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              {dict.description}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <feature.icon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex justify-center lg:justify-start"
            >
              <Link
                href={`/${locale}/heart-map`}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-amber-300/30 transition-all duration-300 hover:scale-[1.03] overflow-hidden"
              >
                <IdCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{dict.cta}</span>
                <ArrowLeft
                  className={`w-5 h-5 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </motion.div>
          </motion.div>

          {/* === Visual side — Mock card preview === */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative order-1 lg:order-2 mx-auto w-full max-w-[380px]"
          >
            {/* Card shadow/glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-amber-300/15 to-orange-300/20 rounded-3xl blur-xl" />

            {/* The mock card */}
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden">
              {/* Card header gradient */}
              <div className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500" />

              <div className="p-6 space-y-4">
                {/* Mock headline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <p className="text-base font-bold text-gray-800">
                    {dict.cardPreview.headline}
                  </p>
                </motion.div>

                {/* Mock about section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 }}
                  className="bg-rose-50/60 rounded-xl p-3.5 border border-rose-100/60"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-semibold text-rose-700">
                      {isRTL ? 'מי אני' : 'About Me'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {dict.cardPreview.aboutMe}
                  </p>
                </motion.div>

                {/* Mock looking for section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                  className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100/60"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">
                      {isRTL ? 'מה אני מחפש/ת' : 'Looking For'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {dict.cardPreview.lookingFor}
                  </p>
                </motion.div>

                {/* Mock tags */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.9 }}
                  className="flex flex-wrap gap-1.5 justify-center"
                >
                  {dict.cardPreview.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-600 border border-violet-200/60"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>

                {/* Copy button mock */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 1 }}
                  className="flex justify-center pt-2"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-semibold shadow-md">
                    <Copy className="w-3.5 h-3.5" />
                    {isRTL ? 'העתק כרטיס' : 'Copy Card'}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
