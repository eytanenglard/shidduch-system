'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  Heart,
  Clock,
  Sparkles,
  Gift,
  MessageCircle,
  Gem,
  Handshake,
  Brain,
  ArrowLeft,
} from 'lucide-react';
import type { HeartMapCTADict } from '@/types/dictionary';

interface Props {
  dict: HeartMapCTADict;
  locale: string;
}

const DISCOVERY_ICONS = [MessageCircle, Gem, Handshake, Brain];

// Positions for the 4 floating cards around the heart (responsive)
const CARD_POSITIONS = [
  'top-[6%] start-[2%] sm:start-[4%]',
  'top-[6%] end-[2%] sm:end-[4%]',
  'bottom-[6%] start-[2%] sm:start-[4%]',
  'bottom-[6%] end-[2%] sm:end-[4%]',
];

const CARD_ICON_GRADIENTS = [
  'from-teal-500 to-emerald-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-500',
];

export default function HeartMapCTASection({ dict, locale }: Props) {
  const isRTL = locale === 'he';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const features = [
    { icon: Gift, text: dict.features.free },
    { icon: Clock, text: dict.features.time },
    { icon: Sparkles, text: dict.features.noSignup },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Rich layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-rose-50/40 to-teal-50/30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300/30 to-transparent" />

      {/* Decorative blurred orbs */}
      <div
        className="absolute top-20 start-0 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 end-0 w-96 h-96 bg-teal-200/15 rounded-full blur-3xl animate-soft-float"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 start-1/3 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '3s' }}
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
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-6 py-2.5 shadow-lg border border-rose-100">
            <Heart className="w-4 h-4 text-rose-500 animate-gentle-pulse" />
            <span className="text-sm font-bold text-rose-600">
              {dict.badge}
            </span>
          </div>
        </motion.div>

        {/* Two-column layout: content + visual */}
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
                  <feature.icon className="w-4 h-4 text-teal-500" />
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
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-teal-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-rose-300/30 transition-all duration-300 hover:scale-[1.03] overflow-hidden"
              >
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{dict.cta}</span>
                <ArrowLeft
                  className={`w-5 h-5 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'}`}
                />
                {/* Shimmer sweep on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </motion.div>
          </motion.div>

          {/* === Visual side — Heart with floating discovery cards === */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative order-1 lg:order-2 mx-auto w-full max-w-[320px] sm:max-w-[400px] aspect-square"
          >
            {/* Sonar-like pulse rings */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border border-rose-300/25"
                style={{
                  inset: `${15 - i * 5}%`,
                  animation: `heartmap-pulse 3.5s ease-out ${i * 0.9}s infinite`,
                }}
                aria-hidden="true"
              />
            ))}

            {/* Soft glow behind the heart */}
            <div
              className="absolute inset-0 m-auto w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-rose-300/40 to-pink-300/30 rounded-full blur-2xl"
              aria-hidden="true"
            />

            {/* Central heart orb */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-rose-400 via-pink-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-rose-300/40"
              >
                <Heart className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Floating discovery cards */}
            {dict.discoveries?.map((text, i) => {
              const Icon = DISCOVERY_ICONS[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={
                    isInView
                      ? {
                          opacity: 1,
                          scale: 1,
                          y: [0, -7, 0],
                        }
                      : {}
                  }
                  transition={{
                    opacity: { duration: 0.5, delay: 0.7 + i * 0.15 },
                    scale: { duration: 0.5, delay: 0.7 + i * 0.15 },
                    y: {
                      duration: 3.2 + i * 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.4,
                    },
                  }}
                  className={`absolute ${CARD_POSITIONS[i]} bg-white/85 backdrop-blur-md rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg border border-white/60 hover:shadow-xl transition-shadow cursor-default max-w-[130px] sm:max-w-[155px]`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${CARD_ICON_GRADIENTS[i]} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-gray-700 leading-tight">
                      {text}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Section-specific keyframes */}
      <style>{`
        @keyframes heartmap-pulse {
          0%   { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
