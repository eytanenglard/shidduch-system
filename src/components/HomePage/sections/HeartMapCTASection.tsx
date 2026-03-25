'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Heart, Clock, Sparkles, Gift } from 'lucide-react';

interface Props {
  dict: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    features: {
      free: string;
      time: string;
      noSignup: string;
    };
    cta: string;
    mobileNote: string;
  };
  locale: string;
}

export default function HeartMapCTASection({ dict, locale }: Props) {
  const isRTL = locale === 'he';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const features = [
    { icon: Gift, text: dict.features.free },
    { icon: Clock, text: dict.features.time },
    { icon: Sparkles, text: dict.features.noSignup },
  ];

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/40 to-orange-50/30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-300/30 to-transparent" />

      {/* Decorative orbs */}
      <div className="absolute top-10 start-10 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-10 end-10 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl animate-soft-float" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200/50 rounded-full px-4 py-1.5 mb-6">
            <Heart className="w-4 h-4 text-teal-500 animate-gentle-pulse" />
            <span className="text-sm font-medium text-teal-700">{dict.badge}</span>
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {dict.title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            {dict.subtitle}
          </p>
          <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-lg mx-auto">
            {dict.description}
          </p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8"
          >
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2 shadow-sm"
              >
                <feature.icon className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              href={`/${locale}/heart-map`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:animate-pulse-glow"
            >
              <Heart className="w-5 h-5" />
              {dict.cta}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
