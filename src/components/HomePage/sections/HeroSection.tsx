// src/components/HomePage/sections/HeroSection.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Shield,
  User,
  BookOpen,
  Brain,
  Handshake,
  ChevronDown,
} from 'lucide-react';
import { Session } from 'next-auth';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- קומפוננטת אפקט מכונת הכתיבה ---
const TypewriterTextWithHighlights: React.FC<{
  delay?: number;
  speed?: number;
  className?: string;
}> = ({ delay = 0, speed = 30, className = '' }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const wordsWithStyles = useMemo(
    () => [
      { text: 'בעולם', style: 'normal' },
      { text: 'שבו', style: 'normal' },
      { text: 'הצעות', style: 'normal' },
      { text: 'לדייטים', style: 'normal' },
      { text: 'מסתכמות', style: 'normal' },
      { text: 'לרוב', style: 'normal' },
      { text: 'בתמונה', style: 'normal' },
      { text: 'ותיאור', style: 'normal' },
      { text: 'כללי,', style: 'normal' },
      { text: 'אנו', style: 'normal' },
      { text: 'מאמינים', style: 'normal' },
      { text: 'בדרך', style: 'normal' },
      { text: 'אחרת.', style: 'normal' },
      { text: 'יצרנו', style: 'normal' },
      { text: 'עבורכם', style: 'normal' },
      { text: 'מסע', style: 'tech' },
      { text: 'היכרות', style: 'tech' },
      { text: 'אישי,', style: 'tech' },
      { text: 'המתחיל', style: 'normal' },
      { text: 'בשאלון', style: 'tech' },
      { text: 'ייחודי.', style: 'tech' },
      { text: 'הוא', style: 'normal' },
      { text: 'מאפשר', style: 'normal' },
      { text: 'לנו', style: 'normal' },
      { text: 'להכיר', style: 'personal' },
      { text: 'אתכם', style: 'personal' },
      { text: 'לעומק,', style: 'personal' },
      { text: 'וכך', style: 'normal' },
      { text: 'להגיש', style: 'normal' },
      { text: 'לכם', style: 'normal' },
      { text: 'הצעות', style: 'normal' },
      { text: 'שידוך', style: 'normal' },
      { text: 'שהן', style: 'normal' },
      { text: 'הרבה', style: 'normal' },
      { text: 'יותר', style: 'normal' },
      { text: 'מפרטים', style: 'normal' },
      { text: 'יבשים', style: 'normal' },
      { text: '–', style: 'normal' },
      { text: 'הן', style: 'normal' },
      { text: 'סיפור', style: 'personal' },
      { text: 'שלם,', style: 'personal' },
      { text: 'שמאפשר', style: 'normal' },
      { text: 'לכם', style: 'normal' },
      { text: 'לקבל', style: 'normal' },
      { text: 'החלטה', style: 'normal' },
      { text: 'ממקום', style: 'normal' },
      { text: 'של', style: 'normal' },
      { text: 'הבנה', style: 'personal' },
      { text: 'אמיתית.', style: 'personal' },
    ],
    []
  );

  useEffect(() => {
    const startTimer = setTimeout(() => setIsStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted || currentWordIndex >= wordsWithStyles.length) return;
    const currentWord = wordsWithStyles[currentWordIndex];
    if (currentCharIndex < currentWord.text.length) {
      const timer = setTimeout(() => setCurrentCharIndex((p) => p + 1), speed);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentWordIndex((p) => p + 1);
        setCurrentCharIndex(0);
      }, speed * 2);
      return () => clearTimeout(timer);
    }
  }, [currentWordIndex, currentCharIndex, speed, isStarted, wordsWithStyles]);

  const getWordStyle = (style: string) => {
    switch (style) {
      case 'tech':
        return 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 font-bold';
      case 'personal':
        return 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-bold';
      default:
        return '';
    }
  };
  const fullText =
    'בעולם שבו הצעות לדייטים מסתכמות לרוב בתמונה ותיאור כללי, אנו מאמינים בדרך אחרת. יצרנו עבורכם מסע היכרות אישי, המתחיל בשאלון ייחודי. הוא מאפשר לנו להכיר אתכם לעומק, וכך להגיש לכם הצעות שידוך שהן הרבה יותר מפרטים יבשים – הן סיפור שלם, שמאפשר לכם לקבל החלטה ממקום של הבנה אמיתית.';

  return (
    <div
      className={className}
      aria-label={fullText} // הוספנו: תווית סטטית עם כל התוכן
      aria-live="polite" // הוספנו: יודיע על שינויים בסיום האנימציה
    >
      {' '}
      <span className="inline-block">
        {wordsWithStyles.slice(0, currentWordIndex).map((word, index) => (
          <span key={index}>
            <span className={getWordStyle(word.style)}>{word.text}</span>{' '}
          </span>
        ))}
        {currentWordIndex < wordsWithStyles.length && (
          <span>
            <span
              className={getWordStyle(wordsWithStyles[currentWordIndex].style)}
            >
              {wordsWithStyles[currentWordIndex].text.slice(
                0,
                currentCharIndex
              )}
            </span>
            <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-cyan-500 via-pink-400 to-cyan-500 animate-pulse ml-1 align-text-top shadow-sm shadow-cyan-400/40 rounded-full"></span>
          </span>
        )}
      </span>
    </div>
  );
};

// --- קומפוננטת כרטיסיית העקרונות עבור דסקטופ ---
interface DesktopPrincipleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const DesktopPrincipleCard: React.FC<DesktopPrincipleCardProps> = ({
  icon,
  title,
  description,
  index,
}) => {
  const getColors = (idx: number) => {
    const colors = [
      {
        gradient: 'from-cyan-400 via-cyan-500 to-blue-500',
        shadowColor: 'shadow-cyan-500/25',
        glowColor: 'shadow-cyan-400/30',
        bgGradient: 'from-cyan-50 via-white to-blue-50',
        accentColor: 'bg-cyan-500',
      },
      {
        gradient: 'from-purple-400 via-purple-500 to-indigo-500',
        shadowColor: 'shadow-purple-500/25',
        glowColor: 'shadow-purple-400/30',
        bgGradient: 'from-purple-50 via-white to-indigo-50',
        accentColor: 'bg-purple-500',
      },
      {
        gradient: 'from-pink-400 via-pink-500 to-rose-500',
        shadowColor: 'shadow-pink-500/25',
        glowColor: 'shadow-pink-400/30',
        bgGradient: 'from-pink-50 via-white to-rose-50',
        accentColor: 'bg-pink-500',
      },
    ];
    return colors[idx];
  };

  const colors = getColors(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors.bgGradient} p-8 ${colors.shadowColor} shadow-2xl border border-white/50 h-full transition-all duration-500`}
    >
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-xl" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-lg" />

      {/* Floating particles */}
      <div
        className="absolute top-6 left-8 w-2 h-2 rounded-full bg-white/40 animate-bounce"
        style={{ animationDelay: `${index * 0.5}s` }}
      />
      <div
        className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
        style={{ animationDelay: `${index * 0.5 + 1}s` }}
      />
      <div
        className="absolute bottom-8 right-8 w-1 h-1 rounded-full bg-white/50 animate-bounce"
        style={{ animationDelay: `${index * 0.5 + 2}s` }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon with enhanced design */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white ${colors.glowColor} shadow-xl transform group-hover:rotate-12 transition-transform duration-500`}
            style={{
              filter: 'contrast(1.1) brightness(1.05)',
              WebkitFilter: 'contrast(1.1) brightness(1.05)',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-9 h-9',
              strokeWidth: 2.8,
              fill: 'none',
              stroke: 'currentColor',
            })}
            <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-sm" />
          </div>
        </div>

        {/* Title with enhanced typography */}
        <h4 className="font-bold text-gray-800 text-lg mb-4 text-center leading-tight">
          {title}
        </h4>

        {/* Description with better spacing */}
        <p className="text-gray-700 text-sm leading-relaxed text-center flex-1">
          {description}
        </p>

        {/* Bottom accent line */}
        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mx-auto" />
      </div>
    </motion.div>
  );
};

// --- קומפוננטת הטאבים החדשה למובייל ---
interface MobilePrinciplesTabsProps {
  isVisible: boolean;
}

const MobilePrinciplesTabs: React.FC<MobilePrinciplesTabsProps> = ({
  isVisible,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const principles = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'יותר מתמונה, סיפור שלם',
      shortTitle: 'סיפור שלם',
      description:
        'השאלון המעמיק שלנו מתרגם את מי שאתם לנרטיב עשיר, ומאפשר היכרות אמיתית מהרגע הראשון.',
      gradient: 'from-cyan-400 via-cyan-500 to-blue-500',
      shadowColor: 'shadow-cyan-500/25',
      glowColor: 'shadow-cyan-400/30',
      bgGradient: 'from-cyan-50 via-white to-blue-50',
      accentColor: 'bg-cyan-500',
      index: 0,
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'פרטיות מלאה, שליטה מוחלטת',
      shortTitle: 'פרטיות מלאה',
      description:
        'הפרופיל שלכם נחשף רק לשדכן האישי. כל צעד ושיתוף מידע נעשים אך ורק באישורכם המפורש.',
      gradient: 'from-purple-400 via-purple-500 to-indigo-500',
      shadowColor: 'shadow-purple-500/25',
      glowColor: 'shadow-purple-400/30',
      bgGradient: 'from-purple-50 via-white to-indigo-50',
      accentColor: 'bg-purple-500',
      index: 1,
    },
    {
      icon: <User className="w-6 h-6" />,
      title: 'טכנולוגיה חכמה, לב אנושי',
      shortTitle: 'לב אנושי',
      description:
        'הכוח של המערכת שלנו בידיים של שדכן מנוסה. הוא משתמש בכלים כדי לראות את האדם, ומלווה אתכם אישית להצלחה.',
      gradient: 'from-pink-400 via-pink-500 to-rose-500',
      shadowColor: 'shadow-pink-500/25',
      glowColor: 'shadow-pink-400/30',
      bgGradient: 'from-pink-50 via-white to-rose-50',
      accentColor: 'bg-pink-500',
      index: 2,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="text-center mb-8"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-3">הגישה שלנו</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto leading-relaxed">
          שלושה עקרונות יסוד שמבטיחים חוויה עמוקה ואמיתית
        </p>

        {/* Decorative elements */}
        <div className="relative mt-4">
          <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 rounded-full mx-auto" />
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-pink-400" />
        </div>
      </motion.div>

      {/* Modern Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="relative mb-6"
      >
        {/* Background container without blur effect */}
        <div className="relative bg-white/90 rounded-2xl p-2 shadow-xl border border-white/30">
          {/* Tab buttons */}
          <div className="relative flex">
            {principles.map((principle, index) => (
              <button
                key={index}
                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-2 relative z-20 rounded-xl transition-all duration-500 ${
                  activeTab === index
                    ? `bg-gradient-to-r ${principle.gradient} ${principle.shadowColor} shadow-lg`
                    : 'bg-transparent hover:bg-white/40'
                }`}
                onClick={() => setActiveTab(index)}
              >
                {/* אייקון עם רקע צבעוני כמו בתוכן */}
                <div
                  className={`flex items-center justify-center mb-2 transition-all duration-300 ${
                    activeTab === index ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === index
                        ? `bg-gradient-to-br ${principle.gradient} shadow-lg`
                        : 'bg-white/60 shadow-sm'
                    }`}
                  >
                    {React.cloneElement(principle.icon, {
                      className: `w-5 h-5 ${activeTab === index ? 'text-white' : 'text-gray-700'}`,
                      strokeWidth: 2.5,
                    })}
                  </div>
                </div>

                {/* טקסט מתחת לאייקון */}
                <div
                  className={`text-xs font-bold text-center leading-tight flex items-center justify-center px-1 transition-all duration-300 ${
                    activeTab === index
                      ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transform scale-105'
                      : 'text-gray-900 hover:text-black'
                  }`}
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

      {/* Content Area with Advanced Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative"
      >
        {principles.map((principle, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              activeTab === index
                ? 'opacity-100 transform translate-x-0 scale-100'
                : index < activeTab
                  ? 'opacity-0 transform -translate-x-full scale-95'
                  : 'opacity-0 transform translate-x-full scale-95'
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${principle.bgGradient} p-8 ${principle.shadowColor} shadow-2xl border border-white/50`}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-lg" />

              {/* Floating particles */}
              <div
                className="absolute top-6 left-8 w-2 h-2 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: '0s' }}
              />
              <div
                className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
                style={{ animationDelay: '1s' }}
              />
              <div
                className="absolute bottom-8 right-8 w-1 h-1 rounded-full bg-white/50 animate-bounce"
                style={{ animationDelay: '2s' }}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon with enhanced design */}
                <div className="flex items-center justify-center mb-6">
                  <div
                    className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.gradient} flex items-center justify-center text-white ${principle.glowColor} shadow-xl transform rotate-6 hover:rotate-12 transition-transform duration-300`}
                    style={{
                      filter: 'contrast(1.1) brightness(1.05)',
                      WebkitFilter: 'contrast(1.1) brightness(1.05)',
                    }}
                  >
                    {React.cloneElement(principle.icon, {
                      className: 'w-9 h-9',
                      strokeWidth: 2.8,
                      fill: 'none',
                      stroke: 'currentColor',
                    })}
                    <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-sm" />
                  </div>
                </div>

                {/* Title with enhanced typography */}
                <h4 className="font-bold text-gray-800 text-xl mb-4 text-center leading-tight tracking-wide">
                  {principle.title}
                </h4>

                {/* Description with better spacing */}
                <p className="text-gray-700 text-base leading-relaxed text-center px-2 max-w-md mx-auto">
                  {principle.description}
                </p>

                {/* Bottom accent line */}
                <div className="mt-6 w-12 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mx-auto" />
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder for height */}
        <div className="h-80" />
      </motion.div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="flex justify-center mt-6 gap-2"
      >
        {principles.map((principle, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              activeTab === index
                ? `w-8 ${principle.accentColor}`
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </motion.div>
    </div>
  );
};

// --- הקומפוננטה הראשית: HeroSection ---
interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const logoUrl =
    'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png';

  return (
    <motion.section
      className="relative min-h-screen pt-24 pb-16 md:pt-28 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      transition={{ staggerChildren: 0.2 }}
    >
      {/* --- רקעים ואלמנטים צפים --- */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <div className="absolute top-1/4 left-[10%] w-32 h-32 rounded-full bg-cyan-200/20 blur-2xl animate-float-slow"></div>
      <div
        className="absolute bottom-1/4 right-[10%] w-40 h-40 rounded-full bg-pink-200/20 blur-2xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* --- תוכן ראשי: כותרת, תיאור, כפתורים --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight">
            זוגיות שמתחילה
            <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 animate-gradient mx-3">
              מהנשמה
            </span>
          </h1>

          <div className="mt-6 max-w-4xl mx-auto text-lg md:text-xl leading-relaxed min-h-[8rem] md:min-h-[6rem]">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-cyan-50/40 to-pink-50/40 backdrop-blur-lg rounded-3xl border-2 border-white/70 shadow-2xl group-hover:shadow-cyan-200/30 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/20 via-transparent to-pink-100/20 rounded-3xl"></div>
              <div className="absolute top-4 left-4 w-3 h-3 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full animate-pulse shadow-md shadow-cyan-400/30"></div>
              <div
                className="absolute top-6 right-6 w-2 h-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full animate-pulse shadow-md shadow-pink-400/30"
                style={{ animationDelay: '1s' }}
              ></div>
              <div
                className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-gradient-to-br from-cyan-300 to-pink-300 rounded-full animate-pulse shadow-sm shadow-cyan-300/40"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div className="absolute top-2 left-16 w-12 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"></div>
              <div className="absolute bottom-2 right-16 w-12 h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent"></div>
              <div className="relative p-8 md:p-10">
                {isVisible && (
                  <TypewriterTextWithHighlights
                    delay={1200}
                    speed={32}
                    className="block text-center leading-relaxed text-transparent bg-clip-text bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 font-bold tracking-wide drop-shadow-sm"
                  />
                )}
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 rounded-full shadow-lg shadow-pink-300/40"></div>
              <div className="absolute -top-2 left-1/3 w-4 h-4 bg-cyan-200/30 rounded-full blur-sm animate-float-slow"></div>
              <div
                className="absolute -bottom-2 right-1/3 w-5 h-5 bg-pink-200/30 rounded-full blur-sm animate-float-slow"
                style={{ animationDelay: '2s' }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* --- ויזואליזציית סינרגיה --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-4xl mt-12 md:mt-16"
          aria-hidden="true" // הוספנו: מסתיר את כל האלמנט והילדים שלו מקוראי מסך
        >
          {/* גרסת מובייל - עודכנה להיות כמו גרסת דסקטופ */}
          <div className={`md:hidden relative h-64`}>
            {/* SVG של הקווים */}
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
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 30 128 C 90 60, 130 60, 160 110"
                stroke="#06b6d4"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 290 128 C 230 196, 190 196, 160 110"
                stroke="#ec4899"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow-mobile)"
              />
            </svg>

            {/* אלמנט שמאל - כלים חכמים */}
            <div
              className={`absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-synergy-enter-left' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-cyan-500" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                כלים חכמים
              </span>
            </div>

            {/* אלמנט ימין - ליווי אישי */}
            <div
              className={`absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-synergy-enter-right' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-pink-500" />
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">
                ליווי אישי
              </span>
            </div>

            {/* לוגו במרכז */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${isVisible ? 'animate-match-point-appear' : ''}`}
            >
              <div className="p-3 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-9 h-9">
                  <Image
                    src={getRelativeCloudinaryPath(logoUrl)}
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* גרסת דסקטופ */}
          <div className={`hidden md:block relative h-64`}>
            <div
              className={`absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${isVisible ? 'animate-synergy-enter-left' : ''}`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-cyan-500" />
              </div>
              <span className="font-bold text-gray-700">כלים טכנולוגיים</span>
            </div>
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${isVisible ? 'animate-synergy-enter-right' : ''}`}
            >
              <span className="font-bold text-gray-700">ליווי אישי</span>
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-pink-500" />
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
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 60 128 C 180 50, 280 50, 350 128"
                stroke="#06b6d4"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 640 128 C 520 200, 420 200, 350 128"
                stroke="#ec4899"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </svg>
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${isVisible ? 'animate-match-point-appear' : ''}`}
            >
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-9 h-9">
                  <Image
                    src={getRelativeCloudinaryPath(logoUrl)}
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- כפתורי קריאה לפעולה --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/register">
            <Button
              size="lg"
              className="text-base md:text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              הצעד הראשון שלי
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link
            href="/questionnaire"
            id="onboarding-target-questionnaire-button"
          >
            <Button
              variant="outline"
              size="lg"
              className="text-base md:text-lg px-8 py-6 border-2 border-cyan-200 text-cyan-600 bg-white/50 hover:bg-white hover:border-cyan-300 rounded-full transition-all duration-300"
            >
              לשאלון
            </Button>
          </Link>
        </motion.div>

        {/* --- START: אזור העקרונות עם התוכן המעודכן --- */}
        <div className="mt-12 sm:mt-16 w-full max-w-6xl">
          {/* Mobile Version - Beautiful Tabs */}
          <div className="md:hidden">
            <MobilePrinciplesTabs isVisible={isVisible} />
          </div>

          {/* Desktop Version - Side by Side Cards */}
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  הגישה שלנו
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  שלושה עקרונות יסוד שמבטיחים חוויה עמוקה ואמיתית
                </p>

                {/* Decorative line */}
                <div className="relative mt-4">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 rounded-full mx-auto" />
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-pink-400" />
                </div>
              </div>

              {/* Cards with updated content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DesktopPrincipleCard
                  icon={<BookOpen />}
                  title="יותר מתמונה, סיפור שלם"
                  description="השאלון המעמיק שלנו מתרגם את מי שאתם לנרטיב עשיר, ומאפשר היכרות אמיתית מהרגע הראשון."
                  index={0}
                />
                <DesktopPrincipleCard
                  icon={<Shield />}
                  title="פרטיות מלאה, שליטה מוחלטת"
                  description="הפרופיל שלכם נחשף רק לשדכן האישי. כל צעד ושיתוף מידע נעשים אך ורק באישורכם המפורש."
                  index={1}
                />
                <DesktopPrincipleCard
                  icon={<User />}
                  title="טכנולוגיה חכמה, לב אנושי"
                  description="הכוח של המערכת שלנו בידיים של שדכן מנוסה. הוא משתמש בכלים כדי לראות את האדם, ומלווה אתכם אישית להצלחה."
                  index={2}
                />
              </div>
            </motion.div>
          </div>
        </div>
        {/* --- END: אזור העקרונות עם התוכן המעודכן --- */}
      </div>

      <style jsx>{`
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
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        @keyframes mobile-match-point {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-mobile-match-point {
          animation: mobile-match-point 0.6s cubic-bezier(0.25, 1, 0.5, 1)
            forwards;
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

        @keyframes text-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-text-appear {
          animation: text-appear 0.5s 2.2s ease-out forwards;
        }
      `}</style>
    </motion.section>
  );
};

export default HeroSection;
