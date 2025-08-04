// src/components/HomePage/sections/HeroSection.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Heart,
  Shield,
  User,
  BookOpen,
  Sparkles,
  Brain,
  Handshake,
  ChevronDown,
} from 'lucide-react';
import { Session } from 'next-auth';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

const PrincipleItem: React.FC<{
  icon: React.ReactNode;
  text: string;
  delay: number;
}> = ({ icon, text, delay }) => {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex-shrink-0 text-cyan-700">{icon}</div>
      <span className="text-gray-700 text-sm sm:text-base font-medium">
        {text}
      </span>
    </motion.div>
  );
};

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const logoUrl =
    'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png';

  const [showCursor, setShowCursor] = useState(true);

  // הסרת הקורסור אחרי סיום האנימציה
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCursor(false);
    }, 5500); // 5.5 שניות אחרי תחילת הטעינה

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.section
      className="relative min-h-screen pt-24 pb-16 md:pt-28 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      transition={{ staggerChildren: 0.2 }}
    >
      {/* --- רקעים ואלמנטים מרחפים משודרגים --- */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* חלקיקים מרחפים */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-[10%] w-4 h-4 rounded-full bg-gradient-to-r from-cyan-700 to-pink-500 opacity-60 animate-float-particle"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute top-3/5 right-[15%] w-3 h-3 rounded-full bg-gradient-to-r from-teal-600 to-amber-500 opacity-50 animate-float-particle"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-1/3 left-[20%] w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-cyan-700 opacity-40 animate-float-particle"
          style={{ animationDelay: '4s' }}
        ></div>
        <div
          className="absolute top-2/5 right-[70%] w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-teal-600 opacity-70 animate-float-particle"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* --- כותרת עם אפקט מכונת כתיבה --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center relative mb-8"
        >
          {/* אפקט זוהר ברקע */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-teal-600/10 via-transparent to-amber-400/10 rounded-full blur-3xl animate-pulse-glow -z-10"></div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            <span
              className="block text-gray-800 overflow-hidden whitespace-nowrap animate-typing-line1"
              style={{
                width: '0',
                animationDelay: '0.5s',
                animationFillMode: 'forwards',
              }}
            >
              זוגיות שמתחילה
            </span>
            <span
              className="block overflow-hidden whitespace-nowrap animate-typing-line2 relative bg-gradient-to-r from-cyan-500 to-pink-500 text-transparent bg-clip-text"
              style={{
                width: '0',
                animationDelay: '2.8s',
                animationFillMode: 'forwards',
              }}
            >
              מהנשמה
              {showCursor && (
                <span className="inline-block w-1 h-[1em] bg-pink-500 animate-blink mr-2 align-middle"></span>
              )}
            </span>
          </h1>
        </motion.div>

        {/* --- תיאור עם עיצוב פסיפס ואפקט מכונת כתיבה --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          // השינוי הוא בשורת ה-transition, ה-delay עודכן ל-5.2 שניות
          transition={{ duration: 0.8, delay: 5.2 }}
          className="mt-12 max-w-5xl mx-auto relative"
        >
          {/* --- START: שינוי 1 - התאמת צבעי הרקע --- */}
          <div className="mosaic-description-container bg-gradient-to-br from-cyan-500/10 via-pink-500/10 to-cyan-500/10 rounded-3xl p-10 relative overflow-hidden border border-cyan-500/10 text-center">
            {/* רקע מסתובב מעודכן */}
            <div
              className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] opacity-80 animate-rotate-mosaic"
              style={{
                background: `conic-gradient(
                  rgba(6, 182, 212, 0.08) 0deg,
                  rgba(236, 72, 153, 0.08) 180deg,
                  rgba(6, 182, 212, 0.08) 360deg
                )`,
              }}
            ></div>
            {/* --- END: שינוי 1 --- */}

            {/* סימן ציטוט */}
            <div className="absolute -top-6 right-8 text-9xl text-cyan-600/20 font-serif leading-none">
              “
            </div>

            {/* הטקסט עם אפקט מכונת כתיבה */}
            <div className="relative z-10">
              <div className="text-xl md:text-2xl lg:text-3xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                <span
                  className="inline-block overflow-hidden whitespace-nowrap animate-typing-description-1 opacity-0"
                  style={{
                    width: '0',
                    animationDelay: '5.5s',
                    animationFillMode: 'forwards',
                  }}
                >
                  בעולם שבו הצעות לדייט מסתכמות לרוב בתמונה ותיאור כללי, אנו
                  מאמינים בדרך אחרת.
                </span>

                <span
                  className="opacity-0 animate-fade-in-word"
                  style={{
                    animationDelay: '8.5s',
                    animationFillMode: 'forwards',
                  }}
                >
                  {' '}
                </span>

                <span
                  className="inline-block overflow-hidden whitespace-nowrap animate-typing-description-2 opacity-0"
                  style={{
                    width: '0',
                    animationDelay: '9s',
                    animationFillMode: 'forwards',
                  }}
                >
                  יצרנו עבורכם מסע היכרות אישי, המתחיל בשאלון ייחודי.
                </span>

                <span
                  className="opacity-0 animate-fade-in-word"
                  style={{
                    animationDelay: '12s',
                    animationFillMode: 'forwards',
                  }}
                >
                  {' '}
                </span>

                {/* START: פיצול הטקסט לשתי שורות עם אנימציות נפרדות */}
                {/* שורה ראשונה של החלק השלישי */}
                <span
                  className="inline-block overflow-hidden whitespace-nowrap animate-typing-description-3a opacity-0"
                  style={{
                    width: '0',
                    animationDelay: '12.5s', // מתחיל כרגיל
                    animationFillMode: 'forwards',
                  }}
                >
                  הוא מאפשר לנו להכיר אתכם לעומק, וכך להגיש לכם הצעות שידוך שהן
                </span>

                {/* רווח וירידת שורה */}
                <span
                  className="opacity-0 animate-fade-in-word"
                  style={{
                    animationDelay: '15s', // מופיע אחרי סיום השורה הראשונה
                    animationFillMode: 'forwards',
                  }}
                >
                  {' '}
                  <br /> {/* ירידת שורה מפורשת */}
                </span>

                {/* שורה שנייה של החלק השלישי */}
                <span
                  className="inline-block overflow-hidden whitespace-nowrap animate-typing-description-3b opacity-0"
                  style={{
                    width: '0',
                    animationDelay: '15.5s', // מתחיל אחרי ירידת השורה
                    animationFillMode: 'forwards',
                  }}
                >
                  הרבה יותר מפרטים יבשים –{' '}
                </span>
                {/* END: פיצול הטקסט */}

                {/* החלק המודגש - עם דיליי מעודכן */}
                <span
                  className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 relative opacity-0 animate-fade-in-highlight"
                  style={{
                    animationDelay: '17.5s', // דחינו את ההשהיה
                    animationFillMode: 'forwards',
                  }}
                >
                  הן סיפור שלם
                  <span
                    className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full animate-underline-grow"
                    style={{
                      animationDelay: '18s', // דחינו גם את זה
                      transformOrigin: 'right',
                      transform: 'scaleX(0)',
                      animationFillMode: 'forwards',
                    }}
                  ></span>
                </span>

                {/* חלק אחרון - עם דיליי מעודכן */}
                <span
                  className="inline-block overflow-hidden whitespace-nowrap animate-typing-description-4 opacity-0"
                  style={{
                    width: '0',
                    animationDelay: '18.5s', // דחינו גם את זה
                    animationFillMode: 'forwards',
                  }}
                >
                  , שמאפשר לכם לקבל החלטה ממקום של הבנה אמיתית.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- START: שינוי 2 - חלק ויזואליזציית הסינרגיה מופיע פעם אחת ובמיקום קבוע --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }} // הופעה מעט אחרי התיבה
          className="w-full max-w-4xl mt-12 md:mt-16"
        >
          {/* גרסת מובייל */}
          <div className="md:hidden flex flex-col items-center gap-3">
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-cyan-700" />
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
                <Handshake className="w-8 h-8 text-pink-500" />
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
                  <Image
                    src={getRelativeCloudinaryPath(logoUrl)}
                    alt="NeshamaTech Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-pink-500">
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
                <Brain className="w-8 h-8 text-cyan-700" />
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
                stroke="#0891b2"
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
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-pink-500">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        {/* --- END: שינוי 2 --- */}

        {/* --- כפתורי קריאה לפעולה משודרגים --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/register">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
              <span className="relative z-10 flex items-center">
                הצעד הראשון שלי
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
          <Link
            href="/questionnaire"
            id="onboarding-target-questionnaire-button"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-2 border-teal-600/30 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-600/50 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              לשאלון ההיכרות
            </Button>
          </Link>
        </motion.div>

        {/* --- סרגל עקרונות משודרג --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 w-full max-w-5xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 bg-white/70 backdrop-blur-md py-6 px-8 rounded-2xl shadow-lg border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600/5 via-transparent to-amber-400/5"></div>

            <PrincipleItem
              icon={<BookOpen className="w-5 h-5" />}
              text="פרופיל עם סיפור, לא רק תמונה"
              delay={0.7}
            />
            <PrincipleItem
              icon={<Shield className="w-5 h-5" />}
              text="דיסקרטיות מוחלטת בכל שלב"
              delay={0.8}
            />
            <PrincipleItem
              icon={<User className="w-5 h-5" />}
              text="ליווי של שדכן שמבין אותך"
              delay={0.9}
            />
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes typing-description-3a {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        @keyframes typing-description-3b {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        .animate-typing-description-3a {
          animation: typing-description-3a 2.5s steps(60, end) forwards;
        }

        .animate-typing-description-3b {
          animation: typing-description-3b 2s steps(30, end) forwards;
        }

        /* והסר את ההגדרה הישנה הזו כדי למנוע כפילות */
        /* .animate-typing-description-3 {
          animation: typing-description-3 3.5s steps(70, end) forwards;
        } */
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

        /* אנימציות מכונת כתיבה לכותרת */
        @keyframes typing-line1 {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes typing-line2 {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .animate-typing-line1 {
          animation: typing-line1 2s steps(20, end) forwards;
        }

        .animate-typing-line2 {
          animation: typing-line2 2s steps(15, end) forwards;
        }

        /* אנימציות מכונת כתיבה לתיאור */
        @keyframes typing-description-1 {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        @keyframes typing-description-2 {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        @keyframes typing-description-3 {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        @keyframes typing-description-4 {
          from {
            width: 0;
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        .animate-typing-description-1 {
          animation: typing-description-1 3s steps(60, end) forwards;
        }

        .animate-typing-description-2 {
          animation: typing-description-2 2.5s steps(45, end) forwards;
        }

        .animate-typing-description-3 {
          animation: typing-description-3 3.5s steps(70, end) forwards;
        }

        .animate-typing-description-4 {
          animation: typing-description-4 2s steps(40, end) forwards;
        }

        /* אנימציה להופעת מילים בודדות */
        @keyframes fade-in-word {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-word {
          animation: fade-in-word 0.3s ease-out forwards;
        }

        /* אנימציה לחלק המודגש */
        @keyframes fade-in-highlight {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-highlight {
          animation: fade-in-highlight 0.6s ease-out forwards;
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }

        /* אנימציות פסיפס */
        @keyframes rotate-mosaic {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-rotate-mosaic {
          animation: rotate-mosaic 25s linear infinite;
        }

        @keyframes fade-in-description {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-description {
          animation: fade-in-description 1s ease-out forwards;
        }

        @keyframes underline-grow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        .animate-underline-grow {
          animation: underline-grow 1s ease-out forwards;
        }

        /* אפקט זוהר */
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        /* חלקיקים מרחפים */
        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.3;
          }
        }
        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .group:hover .animate-shimmer {
          animation: shimmer 0.8s ease-in-out;
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
