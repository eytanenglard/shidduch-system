// src/components/HomePage/sections/OurMethodSection.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Smile,
  Users,
  BookOpen,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WorldData {
  id: number;
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  fullDescription: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  angle: number;
  personalExample: string;
  insight: string;
}

interface ConstellationLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

const MatchingConstellation: React.FC = () => {
  const [hoveredWorld, setHoveredWorld] = useState<number | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<number | null>(1);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // --- START: UPDATED TEXT DATA ---
  const worlds: WorldData[] = [
    {
      id: 1,
      icon: <Heart className="w-8 h-8" />,
      title: 'עולם הערכים',
      shortDesc: 'הבסיס לבית משותף',
      fullDescription:
        'מה באמת חשוב לכם בחיים, במשפחה ובזוגיות? כאן אנחנו יורדים לשורשים כדי למצוא מישהו שהולך באותו כיוון ערכי כמוכם.',
      color: 'from-rose-400 to-pink-500',
      gradientFrom: '#fb7185',
      gradientTo: '#ec4899',
      angle: -72,
      personalExample: 'מהו הערך החשוב ביותר שתרצו להנחיל בבית שתקימו?',
      insight: 'כשיש בסיס ערכי משותף, קל יותר להתמודד עם אתגרי החיים, ביחד.',
    },
    {
      id: 2,
      icon: <Smile className="w-8 h-8" />,
      title: 'עולם האישיות',
      shortDesc: 'הדינמיקה הטבעית שלכם',
      fullDescription:
        'איך אתם מגיבים במצבי לחץ? מה נותן לכם אנרגיה? אנו מחפשים אישיות שתשלים אתכם ותיצור דינמיקה זורמת וטבעית, כזו שבה שניכם יכולים פשוט להיות עצמכם.',
      color: 'from-amber-400 to-orange-500',
      gradientFrom: '#fbbf24',
      gradientTo: '#f97316',
      angle: -144,
      personalExample: 'איך הייתם מתארים את עצמכם בשלוש מילים לחבר קרוב?',
      insight:
        'התאמה אישיותית נכונה הופכת את הזוגיות למקום בטוח ומהנה להיות בו.',
    },
    {
      id: 3,
      icon: <Users className="w-8 h-8" />,
      title: 'עולם הזוגיות',
      shortDesc: 'החזון שלכם ל"ביחד"',
      fullDescription:
        'מה החזון שלכם ל"ביחד"? איך נראה ערב אידיאלי? איך פותרים קונפליקטים? אנו מבינים את תפיסת הזוגיות שלכם כדי למצוא מישהו שרוצה לבנות את אותו הבית.',
      color: 'from-emerald-400 to-teal-500',
      gradientFrom: '#34d399',
      gradientTo: '#14b8a6',
      angle: 144,
      personalExample:
        'מהי "שפת האהבה" העיקרית שלכם, ואיך אתם אוהבים לקבל אהבה?',
      insight:
        'כשהחזונות לזוגיות מתיישרים, קל יותר להתחיל לצעוד יחד באותו המסלול.',
    },
    {
      id: 4,
      icon: <BookOpen className="w-8 h-8" />,
      title: 'העולם הדתי והרוחני',
      shortDesc: 'החיבור הרוחני שלכם',
      fullDescription:
        'מה המקום של הדת והמסורת בחייכם? מה החזון החינוכי לילדים? אנו ניגשים לנושאים אלו ברגישות ובדיוק כדי למצוא התאמה רוחנית אמיתית.',
      color: 'from-sky-400 to-blue-500',
      gradientFrom: '#38bdf8',
      gradientTo: '#3b82f6',
      angle: 72,
      personalExample: 'איך נראית שמירת השבת שלכם בפועל, ומה הגמישות שלכם?',
      insight: 'התאמה רוחנית יוצרת בית שמלא במשמעות, עומק ושפה משותפת.',
    },
    {
      id: 5,
      icon: <Target className="w-8 h-8" />,
      title: 'ציפיות מהשותף',
      shortDesc: 'הצרכים שלכם בזוגיות',
      fullDescription:
        'אילו תכונות בשותף לחיים יעזרו לכם להיות הגרסה הטובה ביותר של עצמכם? כאן אנו מבינים את הצרכים העמוקים שלכם, כדי למצוא אדם שיצמח אתכם וייתן לכם ביטחון.',
      color: 'from-violet-400 to-purple-500',
      gradientFrom: '#a78bfa',
      gradientTo: '#8b5cf6',
      angle: 0,
      personalExample:
        'מהי התכונה האחת, החשובה ביותר, שחייבת להיות בבן/בת הזוג?',
      insight: 'הבנת הצרכים ההדדיים היא המפתח לתקשורת פתוחה וזוגיות בריאה.',
    },
  ];
  // --- END: UPDATED TEXT DATA ---

  useEffect(() => {
    if (hasInteracted) return;
    const interval = setInterval(() => {
      setSelectedWorld((prev) => (prev ? (prev % worlds.length) + 1 : 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [hasInteracted, worlds.length]);

  const generateConstellationLines = (): ConstellationLine[] => {
    const lines: ConstellationLine[] = [];
    const centerX = 250;
    const centerY = 250;
    const radius = 170;
    worlds.forEach((world, index) => {
      const nextIndex = (index + 1) % worlds.length;
      const nextWorld = worlds[nextIndex];
      const x1 = centerX + Math.cos((world.angle * Math.PI) / 180) * radius;
      const y1 = centerY + Math.sin((world.angle * Math.PI) / 180) * radius;
      const x2 = centerX + Math.cos((nextWorld.angle * Math.PI) / 180) * radius;
      const y2 = centerY + Math.sin((nextWorld.angle * Math.PI) / 180) * radius;
      lines.push({ id: `line-${index}`, x1, y1, x2, y2, opacity: 0.4 });
    });
    return lines;
  };

  const handleWorldInteraction = (worldId: number) => {
    setHasInteracted(true);
    setSelectedWorld(selectedWorld === worldId ? null : worldId);
    setHoveredWorld(null);
  };

  const activeWorld = hoveredWorld || selectedWorld;
  const displayedWorld = worlds.find((w) => w.id === activeWorld) || worlds[0];

  return (
    <div ref={sectionRef} className="relative w-full max-w-7xl mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-md border border-gray-200 mb-8">
          <Heart className="w-6 h-6 text-rose-500" />
          <span className="text-gray-700 font-medium text-lg">
            הגישה האנושית שלנו
          </span>
        </div>
        <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
          אנחנו רואים את האדם
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600">
            {' '}
            שמאחורי הפרופיל{' '}
          </span>
        </h3>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          כדי למצוא התאמה אמיתית, אנחנו צריכים להכיר אתכם באמת. לכן פיתחנו שיטה
          ייחודית המתבוננת בחמישה עולמות מרכזיים שמרכיבים אתכם. כך אנחנו מוצאים
          חיבור שלם, לא חלקי.
        </p>
      </motion.div>

      <div className="flex flex-col xl:flex-row items-center gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative flex-1 min-w-0"
        >
          {/* Constellation SVG and elements - UNCHANGED */}
          <div className="relative w-[500px] h-[500px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-sky-50/80 rounded-full blur-3xl" />
            <svg
              viewBox="0 0 500 500"
              className="absolute inset-0 w-full h-full"
            >
              {generateConstellationLines().map((line) => (
                <motion.line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="url(#lineGradient)"
                  strokeWidth="1.5"
                  opacity={line.opacity}
                  className="transition-opacity duration-700"
                />
              ))}
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id="coreGradient">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="70%" stopColor="#fef3ff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fdf4ff" stopOpacity="0.8" />
                </radialGradient>
                {worlds.map((world) => (
                  <radialGradient
                    key={`gradient-${world.id}`}
                    id={`worldGradient-${world.id}`}
                  >
                    <stop
                      offset="0%"
                      stopColor={world.gradientFrom}
                      stopOpacity="0.9"
                    />
                    <stop
                      offset="100%"
                      stopColor={world.gradientTo}
                      stopOpacity="0.8"
                    />
                  </radialGradient>
                ))}
              </defs>
              <motion.circle
                cx="250"
                cy="250"
                r="28"
                fill="url(#coreGradient)"
                className="drop-shadow-lg"
                animate={{ scale: activeWorld ? 1.1 : 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
              />
              <foreignObject x="232" y="232" width="36" height="36">
                <div className="flex items-center justify-center w-full h-full">
                  <Sparkles className="w-7 h-7 text-violet-600" />
                </div>
              </foreignObject>
            </svg>
            {worlds.map((world, index) => {
              const centerX = 250;
              const centerY = 250;
              const radius = 170;
              const x =
                centerX + Math.cos((world.angle * Math.PI) / 180) * radius;
              const y =
                centerY + Math.sin((world.angle * Math.PI) / 180) * radius;
              const isActive = activeWorld === world.id;
              return (
                <motion.div
                  key={world.id}
                  className="absolute cursor-pointer group"
                  style={{ left: x - 35, top: y - 35 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.15 }}
                  onMouseEnter={() =>
                    !hasInteracted && setHoveredWorld(world.id)
                  }
                  onMouseLeave={() => !hasInteracted && setHoveredWorld(null)}
                  onClick={() => handleWorldInteraction(world.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-[70px] h-[70px] rounded-full bg-gradient-to-br ${world.color} flex items-center justify-center text-white shadow-xl relative overflow-hidden transition-all duration-300 ${isActive ? 'ring-4 ring-white/50' : ''}`}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${world.color} rounded-full blur-md`}
                      animate={{
                        scale: isActive ? 1.8 : 1,
                        opacity: isActive ? 0.4 : 0,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110">
                      {world.icon}
                    </div>
                    {isActive && (
                      <>
                        <motion.div
                          className="absolute inset-0 border-2 border-white/60 rounded-full"
                          animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 border-2 border-white/40 rounded-full"
                          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 0.8,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <motion.div
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${isActive ? 'bg-white text-gray-800 shadow-md' : 'text-gray-600'} transition-all duration-300`}
                    >
                      {world.title}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Information panel on the right - UNCHANGED */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex-1 max-w-2xl"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayedWorld.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/60 relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${displayedWorld.color} opacity-5 rounded-3xl`}
              />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
              <div className="relative z-10">
                <div className="flex items-start gap-6 mb-8">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${displayedWorld.color} text-white shadow-lg flex-shrink-0`}
                  >
                    {displayedWorld.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-3xl font-bold text-gray-800 mb-2">
                      {displayedWorld.title}
                    </h4>
                    <p className="text-lg text-gray-600 font-medium">
                      {displayedWorld.shortDesc}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg mb-8">
                  {displayedWorld.fullDescription}
                </p>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 mb-6 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 mt-3 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">
                        למשל, אנו שואלים:
                      </h5>
                      <p className="text-gray-600 italic">
                        “{displayedWorld.personalExample}”
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-violet-50 to-rose-50 rounded-2xl p-6 border border-violet-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-violet-800 mb-2">
                        התובנה שלנו:
                      </h5>
                      <p className="text-violet-700">
                        {displayedWorld.insight}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2">
                  <span className="text-sm text-gray-500 ml-3">
                    מימד {displayedWorld.id} מתוך {worlds.length}
                  </span>
                  {worlds.map((world) => (
                    <button
                      key={world.id}
                      onClick={() => handleWorldInteraction(world.id)}
                      className={`h-2 rounded-full transition-all duration-300 ${world.id === displayedWorld.id ? `bg-gradient-to-r ${displayedWorld.color} flex-1 min-w-[60px]` : 'bg-gray-200 w-6 hover:bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            {hasInteracted
              ? 'לחצו על העולמות או על סרגל ההתקדמות לניווט'
              : 'רחפו מעל העולמות או המתינו לסיור אוטומטי'}
          </motion.div>
        </motion.div>
      </div>

      {/* --- START: UPDATED CTA AT THE END OF THE SECTION --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1 }}
        className="text-center mt-20"
      >
        <div className="max-w-4xl mx-auto">
          <h4 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            מוכנים להתחיל את המסע?
          </h4>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            השאלון הייחודי שלנו הוא הצעד הראשון. הוא לא טכני, הוא אישי. <br />
            זו ההזדמנות שלכם לספר לנו את הסיפור שלכם, כדי שאנחנו נוכל למצוא את
            הפרק הבא שלו.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/questionnaire">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-8 py-4 text-lg font-semibold"
              >
                <span className="flex items-center gap-3">
                  אני רוצה להתחיל את המסע שלי
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <div className="flex items-center gap-3 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">
                חוויה אישית • תובנות עבורכם • דיסקרטי לחלוטין
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      {/* --- END: UPDATED CTA --- */}
    </div>
  );
};

const OurMethodSection: React.FC = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <motion.section
      ref={sectionRef}
      id="our-method"
      className="relative py-20 md:py-28 px-4 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-rose-200/30 to-pink-300/20 rounded-full blur-3xl animate-soft-float" />
        <div
          className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-purple-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-40 left-1/3 w-48 h-48 bg-gradient-to-br from-sky-200/20 to-cyan-300/15 rounded-full blur-3xl animate-soft-float"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-20 right-10 w-36 h-36 bg-gradient-to-br from-emerald-200/25 to-teal-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:30px_30px]"></div>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="decorativeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            d="M0,100 C300,50 600,150 1200,100 L1200,0 L0,0 Z"
            fill="url(#decorativeGradient)"
            className="animate-gentle-pulse"
          />
          <path
            d="M0,700 C400,650 800,750 1200,700 L1200,800 L0,800 Z"
            fill="url(#decorativeGradient)"
            className="animate-gentle-pulse"
            style={{ animationDelay: '2s' }}
          />
        </svg>
      </div>

      <div className="relative max-w-8xl mx-auto">
        <MatchingConstellation />
      </div>

      <style jsx>{`
        @keyframes gentle-pulse {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        @keyframes soft-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(0.5deg);
          }
          75% {
            transform: translateY(3px) rotate(-0.5deg);
          }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }
        .animate-soft-float {
          animation: soft-float 6s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default OurMethodSection;
