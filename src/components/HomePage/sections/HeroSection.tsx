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

  return (
    <div className={className}>
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

// --- קומפוננטת כרטיסיית העקרונות החדשה ---
interface PrincipleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  gradientFrom: string;
  gradientTo: string;
}

const PrincipleCard: React.FC<PrincipleCardProps> = ({
  icon,
  title,
  description,
  delay,
  gradientFrom,
  gradientTo,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        y: -5,
        scale: 1.02,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }}
      className="group relative flex flex-col items-center text-center p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg transition-all duration-300 border border-white/80 w-full"
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-300`}
      />
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-md`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: 'w-7 h-7',
        })}
      </div>
      <h4 className="mb-2 text-base font-bold text-gray-800 tracking-tight sm:text-lg">
        {title}
      </h4>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
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
                    speed={25}
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
        >
          {/* גרסת מובייל */}
          <div className="md:hidden flex flex-col items-center gap-3">
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                {' '}
                <Brain className="w-8 h-8 text-cyan-500" />{' '}
              </div>
              <span className="font-bold text-gray-700">כלים חכמים</span>
            </div>
            <div
              className={`h-8 w-px border-r border-dashed border-gray-400 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '400ms' }}
            />
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '600ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                {' '}
                <Handshake className="w-8 h-8 text-pink-500" />{' '}
              </div>
              <span className="font-bold text-gray-700">ליווי אישי</span>
            </div>
            <div
              className={`opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '800ms' }}
            >
              <ChevronDown className="w-7 h-7 text-gray-400 my-2" />
            </div>
            <div
              className={`opacity-0 ${isVisible ? 'animate-mobile-match-point' : ''}`}
              style={{ animationDelay: '1000ms' }}
            >
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl border-2 border-white">
                <div className="relative w-8 h-8">
                  {' '}
                  <Image
                    src={getRelativeCloudinaryPath(logoUrl)}
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                  />{' '}
                </div>
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                  NeshamaTech
                </span>
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
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/register">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
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
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-2 border-cyan-200 text-cyan-600 bg-white/50 hover:bg-white hover:border-cyan-300 rounded-full transition-all duration-300"
            >
              לשאלון ההיכרות
            </Button>
          </Link>
        </motion.div>

        {/* --- אזור העקרונות החדש והמשופר --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-20 sm:mt-24 w-full max-w-5xl"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-700 sm:text-3xl">
              הגישה שלנו
            </h3>
            <p className="mt-2 text-gray-500">
              שלושה עקרונות יסוד שמבטיחים חוויה אחרת, עמוקה ואמיתית.
            </p>
            <div className="mt-4 w-20 h-1 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <PrincipleCard
              icon={<BookOpen />}
              title="פרופיל עם סיפור, לא רק תמונה"
              description="אנו בונים נרטיב עשיר שמעבר לתמונה, כדי שתוכלו להכיר את האדם האמיתי."
              delay={0.7}
              gradientFrom="from-cyan-400"
              gradientTo="to-blue-500"
            />
            <PrincipleCard
              icon={<Shield />}
              title="דיסקרטיות מוחלטת בכל שלב"
              description="הפרטיות שלכם היא ערך עליון. כל המידע מאובטח ונחשף רק באישורכם המלא."
              delay={0.8}
              gradientFrom="from-purple-400"
              gradientTo="to-indigo-500"
            />
            <PrincipleCard
              icon={<User />}
              title="ליווי של שדכן שמבין אותך"
              description="לא עוד אלגוריתם קר. שדכן אישי מלווה אתכם, מקשיב ומכוון להצלחה."
              delay={0.9}
              gradientFrom="from-pink-400"
              gradientTo="to-rose-500"
            />
          </div>
        </motion.div>
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
      `}</style>
    </motion.section>
  );
};

export default HeroSection;
