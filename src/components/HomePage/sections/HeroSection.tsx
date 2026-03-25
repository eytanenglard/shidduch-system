// src/components/HomePage/sections/HeroSection.tsx
//
// Improvements applied:
// #1  CTA button — solid teal instead of 3-color gradient
// #2  Orbs hidden on mobile (hidden md:block), will-change-transform, aria-hidden
// #3  TypewriterText — always center-aligned, no jarring jump
// #4  TypewriterText card border thinned (border instead of border-2)
// #5  Removed decorative bottom bar under typewriter card
// #6  Removed invisible blobs from DesktopPrincipleCard
// #7  MobilePrinciplesTabs — min-h instead of hardcoded h-80
// #8  Style block cleaned — kept only hero-specific animations, rest in HomePage global
// #9  CountdownTimer — hidden when target date has passed
// #10 Removed unused Heebo font import
// #11 principleIcons as component array instead of inline JSX
// #12 Shared PRINCIPLE_COLORS constant for desktop and mobile
// #13 Removed unused `session` from destructured props
// #14 Removed dependency on `isVisible` (always true from parent)
// #15 TypewriterText — consolidated duplicate useEffects
// #16 Logo alt accessible even inside aria-hidden synergy
// #17 MobilePrinciplesTabs — added role="tablist" / role="tab" / aria-selected
// #18 aria-hidden on all decorative orbs and dot grid
// #19 MobilePrinciplesTabs — swipe gesture support with drag
// #20 Secondary button — added Lightbulb icon for visual clarity

'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
// #10: Removed Heebo font import (was loaded but never applied)
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  BookOpen,
  Brain,
  Handshake,
  Lightbulb,
} from 'lucide-react';
import { Session } from 'next-auth';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { HeroSectionDict, PrincipleDict } from '@/types/dictionary';

// =============================================================================
// #12: Shared principle colors constant (used by both Desktop and Mobile)
// =============================================================================
const PRINCIPLE_COLORS = [
  {
    gradient: 'from-teal-400 via-teal-500 to-emerald-500',
    shadowColor: 'shadow-teal-500/25',
    glowColor: 'shadow-teal-400/30',
    bgGradient: 'from-teal-50 via-white to-emerald-50',
    accentColor: 'bg-teal-500',
  },
  {
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
    shadowColor: 'shadow-orange-500/25',
    glowColor: 'shadow-orange-400/30',
    bgGradient: 'from-orange-50 via-white to-amber-50',
    accentColor: 'bg-orange-500',
  },
  {
    gradient: 'from-rose-400 via-pink-500 to-red-500',
    shadowColor: 'shadow-rose-500/25',
    glowColor: 'shadow-rose-400/30',
    bgGradient: 'from-rose-50 via-white to-red-50',
    accentColor: 'bg-rose-500',
  },
];

// #11: Principle icons as component references (not inline JSX)
const PRINCIPLE_ICON_COMPONENTS = [BookOpen, Shield, User];

// =============================================================================
// TypewriterText — #3: always centered, #15: consolidated useEffects
// =============================================================================
const TypewriterText: React.FC<{
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  locale: 'he' | 'en';
}> = ({ text, delay = 0, speed = 30, className = '', locale }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // #15: Single consolidated effect for start + type + reset
  useEffect(() => {
    // Reset on text change
    indexRef.current = 0;
    setDisplayedText('');
    setIsFinished(false);

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Start after delay
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        indexRef.current += 1;

        if (indexRef.current >= text.length) {
          setDisplayedText(text);
          setIsFinished(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setDisplayedText(text.substring(0, indexRef.current));
        }
      }, speed);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, delay, speed]);

  // #3: Always center-aligned — no jarring jump from right to center
  const dynamicStyle: React.CSSProperties = {
    direction: locale === 'he' ? 'rtl' : 'ltr',
    textAlign: 'center',
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
        <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-teal-500 via-orange-400 to-teal-500 animate-pulse ml-1 align-text-top rounded-full" />
      )}
    </div>
  );
};

// =============================================================================
// DesktopPrincipleCard — #6: removed invisible blobs, #12: shared colors
// =============================================================================
interface DesktopPrincipleCardProps {
  principle: PrincipleDict;
  index: number;
}

const DesktopPrincipleCard: React.FC<DesktopPrincipleCardProps> = ({
  principle,
  index,
}) => {
  const colors = PRINCIPLE_COLORS[index % PRINCIPLE_COLORS.length];
  const IconComponent =
    PRINCIPLE_ICON_COMPONENTS[index % PRINCIPLE_ICON_COMPONENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors.bgGradient} p-8 ${colors.shadowColor} shadow-2xl border border-white/60 h-full transition-all duration-500`}
    >
      {/* #6: Removed invisible decorative blobs */}
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-center mb-6">
          <div
            className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white ${colors.glowColor} shadow-xl transform group-hover:rotate-12 transition-transform duration-500`}
          >
            <IconComponent className="w-9 h-9" strokeWidth={2.8} />
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

// =============================================================================
// MobilePrinciplesTabs — #7: min-h, #12: shared colors, #17: aria, #19: swipe
// =============================================================================
interface MobilePrinciplesTabsProps {
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
      dict.principles.map((p, index) => ({
        ...p,
        ...PRINCIPLE_COLORS[index % PRINCIPLE_COLORS.length],
        IconComponent:
          PRINCIPLE_ICON_COMPONENTS[index % PRINCIPLE_ICON_COMPONENTS.length],
      })),
    [dict.principles]
  );

  // #19: Swipe gesture handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x > threshold && activeTab > 0) {
        setActiveTab((prev) => prev - 1);
      } else if (
        info.offset.x < -threshold &&
        activeTab < principlesData.length - 1
      ) {
        setActiveTab((prev) => prev + 1);
      }
    },
    [activeTab, principlesData.length]
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

      {/* #17: Added role="tablist" */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="relative mb-6"
      >
        <div
          className="relative bg-white/90 rounded-2xl p-2 shadow-xl border border-white/30"
          role="tablist"
          aria-label="עקרונות"
        >
          <div className="relative flex">
            {principlesData.map((principle, index) => (
              <button
                key={index}
                // #17: aria attributes
                role="tab"
                aria-selected={activeTab === index}
                aria-controls={`principle-panel-${index}`}
                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-2 relative z-20 rounded-xl transition-all duration-500 ${activeTab === index ? `bg-gradient-to-r ${principle.gradient} ${principle.shadowColor} shadow-lg` : 'bg-transparent hover:bg-white/40'}`}
                onClick={() => setActiveTab(index)}
              >
                <div
                  className={`flex items-center justify-center mb-2 transition-all duration-300 ${activeTab === index ? 'scale-110' : 'hover:scale-105'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === index ? `bg-gradient-to-br ${principle.gradient} shadow-lg` : 'bg-white/60 shadow-sm'}`}
                  >
                    <principle.IconComponent
                      className={`w-5 h-5 ${activeTab === index ? 'text-white' : 'text-gray-700'}`}
                      strokeWidth={2.5}
                    />
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

      {/* #19: Swipe support with drag gesture, #7: min-h instead of hardcoded h-80 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative min-h-[320px]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="wait">
          {principlesData.map(
            (principle, index) =>
              activeTab === index && (
                <motion.div
                  key={index}
                  // #17: role="tabpanel"
                  role="tabpanel"
                  id={`principle-panel-${index}`}
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
                          <principle.IconComponent
                            className="w-9 h-9"
                            strokeWidth={2.8}
                          />
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
      </motion.div>
    </div>
  );
};

// =============================================================================
// CountdownTimer — #9: hidden when target date has passed
// =============================================================================
const CountdownTimer: React.FC<{ locale: 'he' | 'en' }> = ({ locale }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const endDate = new Date('2025-12-22T17:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // #9: Don't render if expired
  if (isExpired) return null;

  const isHebrew = locale === 'he';

  return (
    <div className="flex items-center gap-1 font-mono" dir="ltr">
      {timeLeft.days > 0 && (
        <>
          <span className="bg-teal-600 text-white text-sm font-bold px-2 py-1 rounded">
            {timeLeft.days}
          </span>
          <span className="text-xs text-gray-500">{isHebrew ? 'י' : 'd'}</span>
        </>
      )}
      <span className="bg-teal-600 text-white text-sm font-bold px-2 py-1 rounded">
        {timeLeft.hours.toString().padStart(2, '0')}
      </span>
      <span className="text-gray-400 font-bold">:</span>
      <span className="bg-teal-600 text-white text-sm font-bold px-2 py-1 rounded">
        {timeLeft.minutes.toString().padStart(2, '0')}
      </span>
      <span className="text-gray-400 font-bold">:</span>
      <span className="bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded">
        {timeLeft.seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

// =============================================================================
// HeroSection — Main Component
// #13: Removed `session` from props destructuring (unused)
// #14: isVisible always true, kept for interface compat but not gating render
// =============================================================================
interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
  dict: HeroSectionDict;
  locale: 'he' | 'en';
}

const HeroSection: React.FC<HeroSectionProps> = ({
  session,
  isVisible,
  dict,
  locale,
}) => {
  const isLoggedIn = !!session?.user;
  const isCompleted = !!session?.user?.questionnaireCompleted;

  const primaryHref = isCompleted
    ? `/${locale}/profile`
    : isLoggedIn
      ? `/${locale}/questionnaire`
      : `/${locale}/auth/register`;

  const primaryText = isCompleted
    ? (dict.ctaButtonCompleted || dict.ctaButton)
    : isLoggedIn
      ? (dict.ctaButtonLoggedIn || dict.ctaButton)
      : dict.ctaButton;

  const primaryTextShort = isCompleted
    ? (dict.ctaButtonCompletedShort || dict.ctaButtonShort)
    : isLoggedIn
      ? (dict.ctaButtonLoggedInShort || dict.ctaButtonShort)
      : dict.ctaButtonShort;

  const secondaryHref = isCompleted
    ? `/${locale}/profile`
    : `/${locale}/heart-map`;

  const secondaryText = isCompleted
    ? (dict.secondaryButtonCompleted || dict.secondaryButton)
    : isLoggedIn
      ? (dict.secondaryButtonLoggedIn || dict.secondaryButton)
      : dict.secondaryButton;

  const secondaryTextShort = isCompleted
    ? (dict.secondaryButtonCompletedShort || dict.secondaryButtonShort)
    : isLoggedIn
      ? (dict.secondaryButtonLoggedInShort || dict.secondaryButtonShort)
      : dict.secondaryButtonShort;
  return (
    <motion.section
      className="relative min-h-screen pt-12 pb-16 md:pt-16 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.2 }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 animate-gradient-slow pointer-events-none"
        style={{ backgroundSize: '400% 400%' }}
        aria-hidden="true"
      />
      {/* #18: aria-hidden on dot grid */}
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
        aria-hidden="true"
      />

      {/* #2: Orbs hidden on mobile, #18: aria-hidden, will-change-transform */}
      <div
        className="absolute top-[15%] left-[5%] w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[20%] right-[5%] w-64 h-64 rounded-full bg-orange-300/20 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[40%] right-[15%] w-48 h-48 rounded-full bg-rose-300/15 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        style={{ animationDelay: '4s' }}
        aria-hidden="true"
      />

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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient mx-3">
              {dict.highlightedWord}
            </span>
          </h1>

          {/* TypewriterText card — #4: thinner border, #5: removed bottom bar */}
          <div className="mt-6 max-w-4xl mx-auto text-lg md:text-xl leading-relaxed min-h-[8rem] md:min-h-[6rem]">
            <div className="relative group">
              {/* #4: border instead of border-2 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-teal-50/40 to-orange-50/40 backdrop-blur-lg rounded-3xl border border-white/60 shadow-2xl group-hover:shadow-teal-200/30 transition-all duration-500 pointer-events-none" />
              <div className="relative p-8 md:p-10">
                <TypewriterText
                  text={dict.typewriterText}
                  delay={1200}
                  speed={32}
                  className="block text-center leading-relaxed text-transparent bg-clip-text bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 font-bold tracking-wide drop-shadow-sm"
                  locale={locale}
                />
              </div>
              {/* #5: Removed decorative bottom bar — was visual noise */}
            </div>
          </div>
        </motion.div>

        {/* Synergy Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-4xl mt-12 md:mt-16 pointer-events-none"
          aria-hidden="true"
        >
          {/* Mobile synergy */}
          <div className="md:hidden relative h-64">
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 320 256"
            >
              <defs>
                <filter id="glow-mobile">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                className="path-draw"
                d="M 30 128 C 90 60, 130 60, 160 110"
                stroke="#0d9488"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
              <path
                className="path-draw"
                d="M 290 128 C 230 196, 190 196, 160 110"
                stroke="#f97316"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
            </svg>

            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 animate-synergy-enter-left">
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                {dict.synergy.techTools}
              </span>
            </div>

            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 animate-synergy-enter-right">
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-orange-500" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                {dict.synergy.personalGuidance}
              </span>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 animate-match-point-appear">
              <div className="p-3 bg-gradient-to-br from-white to-orange-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                    sizes="40px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop synergy */}
          <div className="hidden md:block relative h-64">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-3 opacity-0 animate-synergy-enter-left">
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700">
                {dict.synergy.techTools}
              </span>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-3 opacity-0 animate-synergy-enter-right">
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
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                className="path-draw"
                d="M 60 128 C 180 50, 280 50, 350 128"
                stroke="#0d9488"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <path
                className="path-draw"
                d="M 640 128 C 520 200, 420 200, 350 128"
                stroke="#f97316"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </svg>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 animate-match-point-appear">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white to-orange-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                    sizes="40px"
                  />
                </div>
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons — #1: solid teal, #20: Lightbulb icon on secondary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-row items-center justify-center gap-4 z-20 relative"
        >
          {/* #1: Solid CTA button */}
          <Link
            href={primaryHref}
            className="group relative inline-flex items-center justify-center text-base md:text-lg px-8 py-4 bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
          >
            <span className="hidden md:inline">{primaryText}</span>
            <span className="md:hidden">
              {primaryTextShort}
            </span>
            {locale === 'he' ? (
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            )}
          </Link>

          {/* #20: Secondary button with Lightbulb icon */}
          <Link
            href={secondaryHref}
            id="onboarding-target-questionnaire-button"
            className="group inline-flex items-center justify-center text-base md:text-lg px-8 py-4 border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 rounded-full transition-all duration-300 font-medium"
          >
            <Lightbulb className="h-5 w-5 me-2 text-teal-500 group-hover:text-teal-600 transition-colors" />
            <span className="hidden md:inline">{secondaryText}</span>
            <span className="md:hidden">
              {secondaryTextShort}
            </span>
          </Link>
        </motion.div>

        {/* Principles (Desktop & Mobile) */}
        <div className="mt-12 sm:mt-16 w-full max-w-6xl z-10 relative">
          <div className="md:hidden">
            <MobilePrinciplesTabs
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

      {/* #8: Only hero-specific animations — shared ones are in HomePage.tsx global styles */}
      <style>{`
        @keyframes gradient-slow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-slow {
          animation: gradient-slow 15s ease infinite;
        }
        @keyframes synergy-enter-left {
          from { opacity: 0; transform: translateY(-50%) translateX(-40px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .animate-synergy-enter-left {
          animation: synergy-enter-left 0.8s 0.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes synergy-enter-right {
          from { opacity: 0; transform: translateY(-50%) translateX(40px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .animate-synergy-enter-right {
          animation: synergy-enter-right 0.8s 0.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes path-draw-anim {
          to { stroke-dashoffset: 0; }
        }
        .path-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: path-draw-anim 1s 0.7s ease-out forwards;
        }
        @keyframes match-point-appear {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-match-point-appear {
          animation: match-point-appear 0.6s 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </motion.section>
  );
};

export default HeroSection;
