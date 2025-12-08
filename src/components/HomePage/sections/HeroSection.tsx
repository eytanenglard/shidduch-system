// src/components/HomePage/sections/HeroSection.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  BookOpen,
  Brain,
  Handshake,
} from 'lucide-react';
import { Session } from 'next-auth';
import { motion, AnimatePresence } from 'framer-motion';
import type { HeroSectionDict, PrincipleDict } from '@/types/dictionary';

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
  dict: HeroSectionDict;
  locale: 'he' | 'en';
}

// --- קומפוננטת מכונת הכתיבה (מעודכנת לצבעים החדשים) ---
const TypewriterText: React.FC<{
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  locale: 'he' | 'en';
}> = ({ text, delay = 0, speed = 30, className = '', locale }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setIsStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted || displayedText.length >= text.length) return;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, speed);
    return () => clearInterval(interval);
  }, [displayedText, text, speed, isStarted]);

  useEffect(() => {
    if (!isStarted || isFinished) return;
    if (displayedText.length >= text.length) {
      setIsFinished(true);
      return;
    }
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, speed);
    return () => clearInterval(interval);
  }, [displayedText, text, speed, isStarted, isFinished]);

  const dynamicStyle: React.CSSProperties = {
    direction: locale === 'he' ? 'rtl' : 'ltr',
    textAlign: isFinished ? 'center' : locale === 'he' ? 'right' : 'left',
    width: '100%',
  };

  return (
    <div
      className={className}
      aria-label={text}
      aria-live="polite"
      style={dynamicStyle}
    >
      {displayedText}
      {!isFinished && (
        // צבע הסמן עודכן ל-Teal/Orange
        <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-teal-500 via-orange-400 to-teal-500 animate-pulse ml-1 align-text-top shadow-sm shadow-teal-400/40 rounded-full"></span>
      )}
    </div>
  );
};

// --- קומפוננטות העקרונות ---
const principleIcons = [
  <BookOpen
    key="principle-icon-1"
    className="w-9 h-9"
    strokeWidth={2.8}
    fill="none"
    stroke="currentColor"
  />,
  <Shield
    key="principle-icon-2"
    className="w-9 h-9"
    strokeWidth={2.8}
    fill="none"
    stroke="currentColor"
  />,
  <User
    key="principle-icon-3"
    className="w-9 h-9"
    strokeWidth={2.8}
    fill="none"
    stroke="currentColor"
  />,
];

// --- קומפוננטת כרטיסיית העקרונות (מעודכנת לפלטה החדשה) ---
interface DesktopPrincipleCardProps {
  principle: PrincipleDict;
  index: number;
}
const DesktopPrincipleCard: React.FC<DesktopPrincipleCardProps> = ({
  principle,
  index,
}) => {
  const getColors = (idx: number) => {
    const colors = [
      {
        // Teal / Knowledge
        gradient: 'from-teal-400 via-teal-500 to-emerald-500',
        shadowColor: 'shadow-teal-500/25',
        glowColor: 'shadow-teal-400/30',
        bgGradient: 'from-teal-50 via-white to-emerald-50',
      },
      {
        // Orange / Privacy (Shifted from Purple to Orange/Amber to match Landing)
        gradient: 'from-orange-400 via-amber-500 to-yellow-500',
        shadowColor: 'shadow-orange-500/25',
        glowColor: 'shadow-orange-400/30',
        bgGradient: 'from-orange-50 via-white to-amber-50',
      },
      {
        // Rose / Personal (Shifted from Pink to Rose)
        gradient: 'from-rose-400 via-pink-500 to-red-500',
        shadowColor: 'shadow-rose-500/25',
        glowColor: 'shadow-rose-400/30',
        bgGradient: 'from-rose-50 via-white to-red-50',
      },
    ];
    return colors[idx % colors.length];
  };

  const colors = getColors(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors.bgGradient} p-8 ${colors.shadowColor} shadow-2xl border border-white/60 h-full transition-all duration-500`}
    >
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-xl" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-lg" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-center mb-6">
          <div
            className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white ${colors.glowColor} shadow-xl transform group-hover:rotate-12 transition-transform duration-500`}
          >
            {principleIcons[index]}
            <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-sm" />
          </div>
        </div>
        <h4 className="font-bold text-gray-800 text-lg mb-4 text-center leading-tight">
          {principle.title}
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed text-center flex-1">
          {principle.description}
        </p>
        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mx-auto" />
      </div>
    </motion.div>
  );
};

// --- קומפוננטת הטאבים למובייל (מעודכנת) ---
interface MobilePrinciplesTabsProps {
  isVisible: boolean;
  dict: {
    principlesHeader: { title: string; subtitle: string };
    principles: PrincipleDict[];
  };
}
const MobilePrinciplesTabs: React.FC<MobilePrinciplesTabsProps> = ({
  dict,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const principlesData = useMemo(
    () =>
      dict.principles.map((p, index) => {
        const colors = [
          {
            // Teal
            gradient: 'from-teal-400 via-teal-500 to-emerald-500',
            shadowColor: 'shadow-teal-500/25',
            glowColor: 'shadow-teal-400/30',
            bgGradient: 'from-teal-50 via-white to-emerald-50',
            accentColor: 'bg-teal-500',
          },
          {
            // Orange/Amber
            gradient: 'from-orange-400 via-amber-500 to-yellow-500',
            shadowColor: 'shadow-orange-500/25',
            glowColor: 'shadow-orange-400/30',
            bgGradient: 'from-orange-50 via-white to-amber-50',
            accentColor: 'bg-orange-500',
          },
          {
            // Rose
            gradient: 'from-rose-400 via-pink-500 to-red-500',
            shadowColor: 'shadow-rose-500/25',
            glowColor: 'shadow-rose-400/30',
            bgGradient: 'from-rose-50 via-white to-red-50',
            accentColor: 'bg-rose-500',
          },
        ];
        return {
          ...p,
          icon: principleIcons[index],
          ...colors[index % colors.length],
        };
      }),
    [dict.principles]
  );

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="text-center mb-8"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          {dict.principlesHeader.title}
        </h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto leading-relaxed">
          {dict.principlesHeader.subtitle}
        </p>
        <div className="relative mt-4">
          <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 via-orange-400 to-rose-400 rounded-full mx-auto" />
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-orange-400" />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="relative mb-6"
      >
        <div className="relative bg-white/90 rounded-2xl p-2 shadow-xl border border-white/30">
          <div className="relative flex">
            {principlesData.map((principle, index) => (
              <button
                key={index}
                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-2 relative z-20 rounded-xl transition-all duration-500 ${activeTab === index ? `bg-gradient-to-r ${principle.gradient} ${principle.shadowColor} shadow-lg` : 'bg-transparent hover:bg-white/40'}`}
                onClick={() => setActiveTab(index)}
              >
                <div
                  className={`flex items-center justify-center mb-2 transition-all duration-300 ${activeTab === index ? 'scale-110' : 'hover:scale-105'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === index ? `bg-gradient-to-br ${principle.gradient} shadow-lg` : 'bg-white/60 shadow-sm'}`}
                  >
                    {React.cloneElement(
                      principle.icon as React.ReactElement<{
                        className?: string;
                        strokeWidth?: number;
                      }>,
                      {
                        className: `w-5 h-5 ${activeTab === index ? 'text-white' : 'text-gray-700'}`,
                        strokeWidth: 2.5,
                      }
                    )}
                  </div>
                </div>
                <div
                  className={`text-xs font-bold text-center leading-tight flex items-center justify-center px-1 transition-all duration-300 ${activeTab === index ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transform scale-105' : 'text-gray-900 hover:text-black'}`}
                >
                  <span className="relative">
                    {principle.shortTitle}
                    {activeTab === index && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white/60 rounded-full" />
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative"
      >
        <AnimatePresence mode="wait">
          {principlesData.map(
            (principle, index) =>
              activeTab === index && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <div
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${principle.bgGradient} p-8 ${principle.shadowColor} shadow-2xl border border-white/50`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.gradient} flex items-center justify-center text-white ${principle.glowColor} shadow-xl`}
                        >
                          {principle.icon}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800 text-xl mb-4 text-center leading-tight tracking-wide">
                        {principle.title}
                      </h4>
                      <p className="text-gray-700 text-base leading-relaxed text-center px-2 max-w-md mx-auto">
                        {principle.description}
                      </p>
                      <div className="mt-6 w-12 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mx-auto" />
                    </div>
                  </div>
                </motion.div>
              )
          )}
        </AnimatePresence>
        <div className="h-80" />
      </motion.div>
    </div>
  );
};

// --- הרכיב הראשי - HeroSection ---
const HeroSection: React.FC<HeroSectionProps> = ({
  isVisible,
  dict,
  locale,
}) => {
  return (
    <motion.section
      className="relative min-h-screen pt-12 pb-16 md:pt-16 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      transition={{ staggerChildren: 0.2 }}
    >
      {/* רקע מעודכן - תואם ל-Landing Page */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 animate-gradient-slow"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Orbs צבעוניים - Teal, Orange, Rose */}
      <div className="absolute top-[15%] left-[5%] w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-float-slow"></div>
      <div
        className="absolute bottom-[20%] right-[5%] w-64 h-64 rounded-full bg-orange-300/20 blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute top-[40%] right-[15%] w-48 h-48 rounded-full bg-rose-300/15 blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      ></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight leading-tight">
            {dict.titleLine1}
            <br className="sm:hidden" />
            {/* גרדיאנט כותרת מעודכן - תואם לכפתור (Teal -> Orange -> Amber) */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient mx-3">
              {dict.highlightedWord}
            </span>
          </h1>
          <div className="mt-6 max-w-4xl mx-auto text-lg md:text-xl leading-relaxed min-h-[8rem] md:min-h-[6rem]">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-teal-50/40 to-orange-50/40 backdrop-blur-lg rounded-3xl border-2 border-white/70 shadow-2xl group-hover:shadow-teal-200/30 transition-all duration-500"></div>
              <div className="relative p-8 md:p-10">
                {isVisible && (
                  <TypewriterText
                    text={dict.typewriterText}
                    delay={1200}
                    speed={32}
                    className="block text-center leading-relaxed text-transparent bg-clip-text bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 font-bold tracking-wide drop-shadow-sm"
                    locale={locale}
                  />
                )}
              </div>
              {/* קו תחתון - Teal/Orange */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-teal-400 via-orange-400 to-teal-400 rounded-full shadow-lg shadow-orange-300/40"></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-4xl mt-12 md:mt-16"
          aria-hidden="true"
        >
          {/* START: ויזואליזציית סינרגיה - מובייל (צבעים מעודכנים) */}
          <div className={`md:hidden relative h-64`}>
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 320 256"
            >
              <defs>
                <filter id="glow-mobile">
                  <feGaussianBlur
                    stdDeviation="3.5"
                    result="coloredBlur"
                  ></feGaussianBlur>
                  <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                  </feMerge>
                </filter>
              </defs>
              {/* קו שמאלי (טכנולוגי) - Teal */}
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 30 128 C 90 60, 130 60, 160 110"
                stroke="#0d9488"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
              {/* קו ימני (אנושי) - Orange */}
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 290 128 C 230 196, 190 196, 160 110"
                stroke="#f97316"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
            </svg>

            {/* אלמנט שמאל - כלים טכנולוגיים */}
            <div
              className={`absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-synergy-enter-left' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                {dict.synergy.techTools}
              </span>
            </div>

            {/* אלמנט ימין - ליווי אישי */}
            <div
              className={`absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-synergy-enter-right' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-orange-500" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                {dict.synergy.personalGuidance}
              </span>
            </div>

            {/* --- עודכן: לוגו במרכז (מובייל) --- */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${isVisible ? 'animate-match-point-appear' : ''}`}
            >
              <div className="p-3 bg-gradient-to-br from-white to-orange-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
          {/* END: ויזואליזציית סינרגיה למובייל */}

          {/* ויזואליזציית סינרגיה - דסקטופ (צבעים מעודכנים) */}
          <div className={`hidden md:block relative h-64`}>
            <div
              className={`absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${isVisible ? 'animate-synergy-enter-left' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700">
                {dict.synergy.techTools}
              </span>{' '}
            </div>
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${isVisible ? 'animate-synergy-enter-right' : ''}`}
            >
              <span className="font-bold text-gray-700">
                {dict.synergy.personalGuidance}
              </span>
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 700 256"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur
                    stdDeviation="3.5"
                    result="coloredBlur"
                  ></feGaussianBlur>
                  <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                  </feMerge>
                </filter>
              </defs>
              {/* קו שמאלי - Teal */}
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 60 128 C 180 50, 280 50, 350 128"
                stroke="#0d9488"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              {/* קו ימני - Orange */}
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 640 128 C 520 200, 420 200, 350 128"
                stroke="#f97316"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </svg>

            {/* --- עודכן: לוגו במרכז (דסקטופ) --- */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${isVisible ? 'animate-match-point-appear' : ''}`}
            >
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white to-orange-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                  />
                </div>
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-row items-center justify-center gap-4"
        >
          {/* כפתור ראשי - גרדיאנט חדש */}
          <Link href={`/${locale}/auth/register`}>
            <Button
              size="lg"
              className="text-base md:text-lg px-8 py-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <span className="hidden md:inline">{dict.ctaButton}</span>
              <span className="md:hidden">
                {dict.ctaButtonShort || dict.ctaButton}
              </span>
              {locale === 'he' ? (
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              )}
            </Button>
          </Link>
          {/* כפתור משני - צבעים מעודכנים */}
          <Link
            href={`/${locale}/questionnaire`}
            id="onboarding-target-questionnaire-button"
          >
            <Button
              variant="outline"
              size="lg"
              className="text-base md:text-lg px-8 py-6 border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 rounded-full transition-all duration-300"
            >
              <span className="hidden md:inline">{dict.secondaryButton}</span>
              <span className="md:hidden">
                {dict.secondaryButtonShort || dict.secondaryButton}
              </span>{' '}
            </Button>
          </Link>
        </motion.div>

        {/* 🎁 באנר קמפיין הפניות */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6"
        >
          <Link href={`/${locale}/friends`}>
            <div className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 hover:from-amber-100 hover:via-orange-100 hover:to-rose-100 border border-amber-200/60 hover:border-amber-300 rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm group-hover:rotate-12 transition-transform duration-300">
                <Handshake className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-amber-800 group-hover:text-amber-900">
                {locale === 'he'
                  ? 'הזמינו חברים וזכו בפרסים!'
                  : 'Invite friends & win prizes!'}
              </span>
              {locale === 'he' ? (
                <ArrowLeft className="w-4 h-4 text-amber-600 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </Link>
        </motion.div>

        <div className="mt-12 sm:mt-16 w-full max-w-6xl">
          <div className="md:hidden">
            <MobilePrinciplesTabs
              isVisible={isVisible}
              dict={{
                principlesHeader: dict.principlesHeader,
                principles: dict.principles,
              }}
            />
          </div>
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {dict.principlesHeader.title}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {dict.principlesHeader.subtitle}
                </p>
                <div className="relative mt-4">
                  {/* מפריד צבעוני מעודכן */}
                  <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 via-orange-400 to-rose-400 rounded-full mx-auto" />
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {dict.principles.map((principle, index) => (
                  <DesktopPrincipleCard
                    key={index}
                    principle={principle}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-slow {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-slow {
          animation: gradient-slow 15s ease infinite;
        }
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(-5px) translateX(20px);
          }
          75% {
            transform: translateY(-10px) translateX(5px);
          }
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        @keyframes synergy-enter-left {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
        .animate-synergy-enter-left {
          animation: synergy-enter-left 0.8s 0.2s cubic-bezier(0.25, 1, 0.5, 1)
            forwards;
        }
        @keyframes synergy-enter-right {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
        .animate-synergy-enter-right {
          animation: synergy-enter-right 0.8s 0.2s cubic-bezier(0.25, 1, 0.5, 1)
            forwards;
        }
        @keyframes path-draw-anim {
          to {
            stroke-dashoffset: 0;
          }
        }
        .path-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: path-draw-anim 1s 0.7s ease-out forwards;
        }
        @keyframes match-point-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-match-point-appear {
          animation: match-point-appear 0.6s 1.4s cubic-bezier(0.25, 1, 0.5, 1)
            forwards;
        }
      `}</style>
    </motion.section>
  );
};

export default HeroSection;
