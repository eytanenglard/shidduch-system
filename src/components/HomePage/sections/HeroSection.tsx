// src/components/HomePage/sections/HeroSection.tsx

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Heart,
  Shield,
  User,
  Lightbulb,
  Users,
  Sparkles,
  Brain,
  Handshake,
  ChevronDown,
} from 'lucide-react';
import { Session } from 'next-auth';

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

// ====================== שלב 1: עדכון קומפוננטת העזר StatItem ======================
// עדכנו את הצבעים שנתמכים מ-'cyan'/'pink' ל-'teal'/'orange'
const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'teal' | 'orange';
}> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 text-right">
    <div
      className={`p-1.5 sm:p-2 rounded-full ${color === 'teal' ? 'bg-teal-100' : 'bg-orange-100'}`}
    >
      {icon}
    </div>
    <div>
      <span
        className={`font-bold text-sm sm:text-base ${color === 'teal' ? 'text-teal-600' : 'text-orange-600'}`}
      >
        {value}
      </span>
      <span className="block text-xs sm:text-sm text-gray-600 leading-tight">
        {label}
      </span>
    </div>
  </div>
);
// =================================================================================

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const getStaggerDelay = (index: number) => ({
    transitionDelay: `${100 + index * 150}ms`,
  });

  return (
    <section className="relative min-h-screen pt-20 pb-16 md:pt-24 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8">
      {/* ===== עדכון 1: עדכון הרקעים הכלליים ===== */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-orange-50 animate-gradient-slow"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <div className="absolute top-1/4 left-[10%] w-32 h-32 rounded-full bg-teal-200/20 blur-2xl animate-float-slow"></div>
      <div
        className="absolute bottom-1/4 right-[10%] w-40 h-40 rounded-full bg-orange-200/20 blur-2xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      ></div>
      {/* ======================================== */}

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* --- Main Content: Headline, Description, Buttons --- */}
        <div
          className={`text-center transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={getStaggerDelay(0)}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight">
            הדרך
            {/* ===== עדכון 2: עדכון הגראדינט בכותרת הראשית ===== */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-500 animate-gradient mx-3">
              החכמה והאישית
            </span>
            {/* ================================================ */}
            למצוא אהבה
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
            NeshamaTech משלבת טכנולוגיית AI מתקדמת עם ליווי של שדכנים מומחים,
            כדי להציע לך התאמות מדויקות וליווי אישי בדרך לזוגיות שתמיד רצית.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              {/* ===== עדכון 3: עדכון הגראדינט בכפתור הראשי ===== */}
              <Button
                size="lg"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                <span className="relative z-10">מתחילים עכשיו</span>
                <ArrowLeft className="relative z-10 mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link
              href="/questionnaire"
              id="onboarding-target-questionnaire-button"
            >
              {/* ===== עדכון 4: עדכון הצבעים בכפתור המשני ===== */}
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-2 border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 rounded-full transition-all duration-300"
              >
                לשאלון ההתאמה
              </Button>
            </Link>
          </div>
        </div>

        {/* --- Synergy Visualization --- */}
        <div
          className={`w-full max-w-4xl mt-12 md:mt-16 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={getStaggerDelay(1)}
        >
          {/* גרסה למובייל */}
          <div className="md:hidden flex flex-col items-center gap-3">
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                {/* ===== עדכון 5: עדכון צבע אייקון ===== */}
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700">טכנולוגיית AI</span>
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
                {/* ===== עדכון 6: עדכון צבע אייקון ===== */}
                <Handshake className="w-8 h-8 text-orange-500" />
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
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl border-2 border-white">
                <Heart
                  className="w-7 h-7 text-red-500 fill-current animate-pulse"
                  style={{ animationDuration: '1.5s' }}
                />
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-500">
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
                {/* ===== עדכון 7: עדכון צבע אייקון ===== */}
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <span className="font-bold text-gray-700">טכנולוגיית AI</span>
            </div>
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${isVisible ? 'animate-synergy-enter-right' : ''}`}
            >
              <span className="font-bold text-gray-700">ליווי אישי</span>
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                {/* ===== עדכון 8: עדכון צבע אייקון ===== */}
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
              {/* ===== עדכון 9: עדכון צבעי קווי ה-SVG ===== */}
              <path
                className={`${isVisible ? 'path-draw' : ''}`}
                d="M 60 128 C 180 50, 280 50, 350 128"
                stroke="#0d9488"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />
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
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${isVisible ? 'animate-match-point-appear' : ''}`}
            >
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl border-2 border-white">
                <Heart
                  className="w-7 h-7 text-red-500 fill-current animate-pulse"
                  style={{ animationDuration: '1.5s' }}
                />
                {/* ===== עדכון 10: עדכון שם המותג והגראדינט ===== */}
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-500">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Stats Bar (Social Proof) --- */}
        <div
          className={`mt-12 md:mt-20 w-full max-w-5xl transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={getStaggerDelay(2)}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 bg-white/60 backdrop-blur-md py-4 px-6 rounded-2xl shadow-lg border border-white/50">
            {/* שורה 1: טיל | כתום | טיל */}
            <StatItem
              icon={<Shield className="h-5 w-5 text-teal-600" />}
              label="דיסקרטיות"
              value="100%"
              color="teal"
            />
            <StatItem
              icon={<Heart className="h-5 w-5 text-orange-600" />}
              label="מדדי תאימות"
              value="+50"
              color="orange"
            />
            <StatItem
              icon={<User className="h-5 w-5 text-teal-600" />}
              label="ליווי אישי"
              value="24/6"
              color="teal"
            />

            {/* שורה 2: כתום | טיל | כתום */}
            <StatItem
              icon={<Lightbulb className="h-5 w-5 text-orange-600" />}
              label="שידוך מנומק"
              value="AI + שדכן"
              color="orange"
            />

            {/* ===================== התיקון הוא בשורה הבאה ===================== */}
            <StatItem
              icon={<Sparkles className="h-5 w-5 text-teal-600" />}
              label="מסורת וחדשנות"
              value="מושלם"
              color="teal"
            />
            {/* =================================================================== */}

            <StatItem
              icon={<Users className="h-5 w-5 text-orange-600" />}
              label="צוות שדכנים"
              value="מקצועי"
              color="orange"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
