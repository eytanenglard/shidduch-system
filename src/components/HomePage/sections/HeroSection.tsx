import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // <-- 1. הוספת ייבוא
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
import { getRelativeCloudinaryPath } from '@/lib/utils'; // <-- 1. הוספת ייבוא

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'pink';
}> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 text-right">
    <div
      className={`p-1.5 sm:p-2 rounded-full ${
        color === 'cyan' ? 'bg-cyan-100' : 'bg-pink-100'
      }`}
    >
      {icon}
    </div>
    <div>
      <span
        className={`font-bold text-sm sm:text-base ${
          color === 'cyan' ? 'text-cyan-600' : 'text-pink-500'
        }`}
      >
        {value}
      </span>
      <span className="block text-xs sm:text-sm text-gray-600 leading-tight">
        {label}
      </span>
    </div>
  </div>
);

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const getStaggerDelay = (index: number) => ({
    transitionDelay: `${100 + index * 150}ms`,
  });

  const logoUrl =
    'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png';

  return (
    <section className="relative min-h-screen pt-20 pb-16 md:pt-24 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8">
      {/* --- Backgrounds and Floating Elements --- */}
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
        {/* --- 1. Main Content: Headline, Description, Buttons --- */}
        <div
          className={`text-center transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={getStaggerDelay(0)}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight">
            הדרך
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 animate-gradient mx-3">
              החכמה והאישית
            </span>
            למצוא אהבה
          </h1>
          {/* ======================= שינוי 2: עדכון שם החברה בטקסט ======================= */}
          <p className="mt-6 max-w-xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
            NeshamaTech משלבת טכנולוגיית AI מתקדמת עם ליווי של שדכנים מומחים,
            כדי להציע לך התאמות מדויקות וליווי אישי בדרך לזוגיות שתמיד רצית.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
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
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full transition-all duration-300"
              >
                לשאלון ההתאמה
              </Button>
            </Link>
          </div>
        </div>

        {/* --- 2. Synergy Visualization --- */}
        <div
          className={`w-full max-w-4xl mt-12 md:mt-16 transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={getStaggerDelay(1)}
        >
          {/* ========================================================== */}
          {/* ||      גרסה מעודכנת למובייל (אנכית)                  || */}
          {/* ========================================================== */}
          <div className="md:hidden flex flex-col items-center gap-3">
            {/* AI Technology */}
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${
                isVisible ? 'animate-fade-in-up' : ''
              }`}
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-cyan-500" />
              </div>
              <span className="font-bold text-gray-700">טכנולוגיית AI</span>
            </div>

            {/* Dashed line */}
            <div
              className={`h-8 w-px border-r border-dashed border-gray-400 opacity-0 ${
                isVisible ? 'animate-fade-in-up' : ''
              }`}
              style={{ animationDelay: '400ms' }}
            />

            {/* Human Touch */}
            <div
              className={`flex flex-col items-center gap-2 opacity-0 ${
                isVisible ? 'animate-fade-in-up' : ''
              }`}
              style={{ animationDelay: '600ms' }}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Handshake className="w-8 h-8 text-pink-500" />
              </div>
              <span className="font-bold text-gray-700">ליווי אישי</span>
            </div>

            {/* "Leads to..." Icon */}
            <div
              className={`opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '800ms' }}
            >
              <ChevronDown className="w-7 h-7 text-gray-400 my-2" />
            </div>

            {/* ======================= שינוי 3: החלפת לוגו ושם (מובייל) ======================= */}
            <div
              className={`opacity-0 ${
                isVisible ? 'animate-mobile-match-point' : ''
              }`}
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
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                  NeshamaTech
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* ||        גרסה מעודכנת לדסקטופ (מוסתרת במובייל)      || */}
          {/* ========================================================== */}
          <div className={`hidden md:block relative h-64`}>
            <div
              className={`absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${
                isVisible ? 'animate-synergy-enter-left' : ''
              }`}
            >
              <div className="p-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                <Brain className="w-8 h-8 text-cyan-500" />
              </div>
              <span className="font-bold text-gray-700">טכנולוגיית AI</span>
            </div>
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-3 opacity-0 ${
                isVisible ? 'animate-synergy-enter-right' : ''
              }`}
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
            {/* ======================= שינוי 4: החלפת לוגו ושם (דסקטופ) ======================= */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 ${
                isVisible ? 'animate-match-point-appear' : ''
              }`}
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
        </div>

        {/* --- 3. Stats Bar (Social Proof) --- */}
        <div
          className={`mt-12 md:mt-20 w-full max-w-5xl transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={getStaggerDelay(2)}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 bg-white/60 backdrop-blur-md py-4 px-6 rounded-2xl shadow-lg border border-white/50">
            <StatItem
              icon={<Shield className="h-5 w-5 text-cyan-600" />}
              label="דיסקרטיות"
              value="100%"
              color="cyan"
            />
            <StatItem
              icon={<Heart className="h-5 w-5 text-pink-500" />}
              label="מדדי תאימות"
              value="+50"
              color="pink"
            />
            <StatItem
              icon={<User className="h-5 w-5 text-cyan-600" />}
              label="ליווי אישי"
              value="24/6"
              color="cyan"
            />
            <StatItem
              icon={<Lightbulb className="h-5 w-5 text-pink-500" />}
              label="שידוך מנומק"
              value="AI + שדכן"
              color="pink"
            />
            <StatItem
              icon={<Sparkles className="h-5 w-5 text-cyan-600" />}
              label="מסורת וחדשנות"
              value="מושלם"
              color="cyan"
            />
            <StatItem
              icon={<Users className="h-5 w-5 text-pink-500" />}
              label="צוות שדכנים"
              value="מקצועי"
              color="pink"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
