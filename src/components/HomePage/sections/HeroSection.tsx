// src/components/HomePage/sections/HeroSection.tsx

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Shield, User, Users, Sparkles, Brain, Handshake } from "lucide-react";
import { Session } from "next-auth";

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color: 'cyan' | 'pink' }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 text-right">
    <div className={`p-1.5 sm:p-2 rounded-full ${color === 'cyan' ? 'bg-cyan-100' : 'bg-pink-100'}`}>
      {icon}
    </div>
    <div>
      <span className={`font-bold text-sm sm:text-base ${color === 'cyan' ? 'text-cyan-600' : 'text-pink-500'}`}>{value}</span>
      <span className="block text-xs sm:text-sm text-gray-600 leading-tight">{label}</span>
    </div>
  </div>
);

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const getStaggerDelay = (index: number) => ({
    transitionDelay: `${100 + index * 150}ms`,
  });

  return (
    <section className="relative min-h-screen pt-20 pb-16 md:pt-24 md:pb-20 overflow-hidden flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8">
      {/* --- רקעים ואלמנטים צפים --- */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow"
        style={{ backgroundSize: "400% 400%" }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <div className="absolute top-1/4 left-[10%] w-32 h-32 rounded-full bg-cyan-200/20 blur-2xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-[10%] w-40 h-40 rounded-full bg-pink-200/20 blur-2xl animate-float-slow" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* --- 1. התוכן המרכזי: כותרת, תיאור וכפתורים --- */}
        <div
          className={`text-center transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={getStaggerDelay(0)}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight">
            הדרך
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 animate-gradient mx-3">
              החכמה והאישית
            </span>
            למצוא אהבה
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
            Match Point משלבת טכנולוגיית AI מתקדמת עם ליווי של שדכנים מומחים, כדי להציע לך התאמות מדויקות וליווי אישי בדרך לזוגיות שתמיד רצית.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                <span className="relative z-10">מתחילים עכשיו</span>
                <ArrowLeft className="relative z-10 mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/questionnaire">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full transition-all duration-300">
                לשאלון ההתאמה
              </Button>
            </Link>
          </div>
        </div>

        {/* --- 2. הוויזואליזציה המשודרגת: "סינרגיה והתמזגות" --- */}
        <div
          className={`relative w-full max-w-2xl h-64 mt-16 transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={getStaggerDelay(1)}
        >
          {/* אלמנט ה-AI (שמאל) */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-synergy-enter-left">
            <Brain className="w-16 h-16 text-cyan-400 opacity-80" />
          </div>

          {/* אלמנט הליווי האישי (ימין) */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 animate-synergy-enter-right">
            <Handshake className="w-16 h-16 text-pink-400 opacity-80" />
          </div>
          
          {/* אנימציית ה-SVG שמחברת ביניהם */}
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            {/* נשתמש ב-2 קווים כדי ליצור אפקט של זרימה משני הכיוונים */}
            <path
              className="path-draw-from-left"
              d="M 64 128 C 150 80, 250 80, 320 128"
              stroke="url(#lineGradient)" strokeWidth="3" fill="none" strokeLinecap="round"
            />
             <path
              className="path-draw-from-right"
              d="M 636 128 C 550 80, 450 80, 380 128"
              stroke="url(#lineGradient)" strokeWidth="3" fill="none" strokeLinecap="round"
            />
          </svg>

          {/* התוצאה: הלב והכרטיסים במרכז */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             {/* כרטיס פרופיל שמאלי - מופיע באנימציה */}
            <div className="absolute top-1/2 -translate-y-1/2 animate-card-appear-left" style={{ right: 'calc(50% + 30px)'}}>
                <div className="w-28 h-16 bg-white/60 backdrop-blur-md rounded-lg shadow-lg border border-white/50 p-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">א</div>
                    <span className="text-xs font-semibold text-gray-800">אביתר</span>
                </div>
            </div>
            {/* כרטיס פרופיל ימני - מופיע באנימציה */}
             <div className="absolute top-1/2 -translate-y-1/2 animate-card-appear-right" style={{ left: 'calc(50% + 30px)'}}>
                <div className="w-28 h-16 bg-white/60 backdrop-blur-md rounded-lg shadow-lg border border-white/50 p-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">ת</div>
                    <span className="text-xs font-semibold text-gray-800">תמר</span>
                </div>
            </div>
            {/* לב במרכז */}
            <div className="transform scale-0 animate-heart-scale-in">
              <div className="p-3 bg-white rounded-full shadow-2xl">
                <Heart className="w-6 h-6 text-pink-500 fill-current animate-pulse" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. שורת הנתונים (Social Proof) --- */}
        <div
          className={`mt-20 w-full max-w-4xl transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={getStaggerDelay(2)}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-white/60 backdrop-blur-md py-4 px-6 rounded-2xl shadow-lg border border-white/50">
            <StatItem icon={<Shield className="h-5 w-5 text-cyan-600" />} label="דיסקרטיות" value="100%" color="cyan" />
            <StatItem icon={<Users className="h-5 w-5 text-pink-500" />} label="צוות שדכנים" value="מקצועי" color="pink" />
            <StatItem icon={<User className="h-5 w-5 text-cyan-600" />} label="ליווי אישי" value="24/6" color="cyan" />
            <StatItem icon={<Heart className="h-5 w-5 text-pink-500" />} label="מדדי תאימות" value="50+" color="pink" />
            <StatItem icon={<Sparkles className="h-5 w-5 text-cyan-600" />} label="מסורת וחדשנות" value="מושלם" color="cyan" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;