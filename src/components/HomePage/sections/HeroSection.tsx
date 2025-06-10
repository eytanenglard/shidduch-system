// src/components/HomePage/sections/HeroSection.tsx
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
ArrowLeft,
ClipboardList,
Heart,
Shield,
User,
BookOpen,
Users,
Sparkles,
Brain, // For AI
Handshake, // For Personal Touch
} from "lucide-react";
import { Session } from "next-auth";

interface HeroSectionProps {
session: Session | null;
isVisible: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
const [scrollY, setScrollY] = useState(0);
const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
const [puzzleContainerTop, setPuzzleContainerTop] = useState(0); // For mobile animation timing
const puzzleContainerRef = useRef<HTMLDivElement>(null);
const sectionRef = useRef<HTMLElement>(null);

useEffect(() => {
const handleScroll = () => {
setScrollY(window.scrollY);
};
window.addEventListener("scroll", handleScroll, { passive: true });
return () => window.removeEventListener("scroll", handleScroll);
}, []);

// Effect to get the initial position of the puzzle container for mobile animation
useEffect(() => {
if (puzzleContainerRef.current) {
    // We add a delay to ensure the page layout is stable before getting the offsetTop
    const timer = setTimeout(() => {
        if(puzzleContainerRef.current) {
            setPuzzleContainerTop(puzzleContainerRef.current.offsetTop);
        }
    }, 100);
    return () => clearTimeout(timer);
}
}, [puzzleContainerRef]);

useEffect(() => {
const handleMouseMove = (e: MouseEvent) => {
if (sectionRef.current) {
const { left, top, width, height } =
sectionRef.current.getBoundingClientRect();
const x = (e.clientX - left) / width;
const y = (e.clientY - top) / height;
setMousePosition({ x, y });
}
};
window.addEventListener("mousemove", handleMouseMove);
return () => window.removeEventListener("mousemove", handleMouseMove);
}, []);

const getPuzzleAnimation = () => {
    if (!puzzleContainerRef.current || puzzleContainerTop === 0) {
        return { progress: 0 };
    }

    // 1. בדיקה אם אנחנו במובייל (מסך ברוחב קטן מ-768px)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // 2. הגדרת נקודת התחלה ומשך אנימציה שונים למובייל ולדסקטופ
    let startPosition;
    let animationDuration;

    if (isMobile) {
        // במובייל: נתחיל את האנימציה מוקדם יותר.
        // האנימציה תתחיל כשהחלק העליון של הקונטיינר יהיה כ-40% מגובה המסך *לפני* שהוא מגיע לחלק העליון של החלון.
        // אתה יכול לשחק עם המספר 0.4 כדי להקדים או לאחר את האנימציה.
        startPosition = puzzleContainerTop - (window.innerHeight * 0.4);
        
        // נקצר מעט את משך האנימציה במובייל לתחושה מהירה יותר
        animationDuration = 500;
    } else {
        // בדסקטופ: נשאר עם ההתנהגות המקורית שהאנימציה מתחילה כשהאזור מגיע לחלק העליון
        startPosition = puzzleContainerTop;
        animationDuration = 700;
    }

    const endPosition = startPosition + animationDuration;

    // 3. חישוב התקדמות האנימציה נשאר זהה
    const progress = Math.min(
        Math.max((scrollY - startPosition) / (endPosition - startPosition), 0),
        1
    );

    return { progress };
};


const puzzleAnim = getPuzzleAnimation();

const getParallaxStyle = (depth = 1) => {
if (typeof window !== "undefined" && window.innerWidth < 768) {
return {};
}
const moveX = (mousePosition.x - 0.5) * 30 * depth;
const moveY = (mousePosition.y - 0.5) * 30 * depth;
return {
transform: `translate(${moveX}px, ${moveY}px)`,
};
};

const getStaggerDelay = (index: number) => ({
transitionDelay: `${200 + index * 150}ms`,
});

return (
<section
ref={sectionRef}
className="relative min-h-screen pt-0 overflow-hidden flex flex-col -mt-0.25 w-full"
>
<div
className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow"
style={{ backgroundSize: "400% 400%" }}
/>
<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>
<div
className="absolute top-20 right-[15%] w-20 md:w-32 h-20 md:h-32 rounded-full bg-gradient-to-br from-cyan-200/20 to-cyan-300/10 animate-float-slow backdrop-blur-sm"
style={{ ...getParallaxStyle(0.5), animationDuration: "15s" }}
></div>
<div
className="absolute -bottom-10 left-[10%] w-24 md:w-40 h-24 md:h-40 rounded-full bg-gradient-to-br from-pink-200/20 to-pink-300/10 animate-float-slow backdrop-blur-sm"
style={{ ...getParallaxStyle(0.3), animationDuration: "18s", animationDelay: "1s" }}
></div>
<div
className="absolute top-1/3 left-[20%] w-16 md:w-20 h-16 md:h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-cyan-300/10 animate-float-slow backdrop-blur-sm"
style={{ ...getParallaxStyle(0.7), animationDuration: "12s", animationDelay: "2s" }}
></div>
<div
className="absolute bottom-1/4 right-[20%] w-20 md:w-28 h-20 md:h-28 rounded-full bg-gradient-to-br from-pink-200/20 to-pink-300/10 animate-float-slow backdrop-blur-sm"
style={{ ...getParallaxStyle(0.4), animationDuration: "20s", animationDelay: "3s" }}
></div>
<div className="absolute inset-0 opacity-5 overflow-hidden">
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square border-[1px] border-cyan-500/20 rounded-full"></div>
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square border-[1px] border-pink-500/20 rounded-full"></div>
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] aspect-square border-[1px] border-cyan-500/20 rounded-full"></div>
</div>
<div className="relative w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col">
    <div
      className={`text-center mb-6 sm:mb-4 md:mb-[-50px] transition-all duration-1000 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={getStaggerDelay(0)}
    >
      <div className="inline-block mb-3">
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 px-4 py-2 rounded-full">
          <Heart className="h-4 w-4 text-pink-500 fill-pink-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-600">שידוכים לציבור הדתי</span>
        </div>
      </div>
      <div className="relative w-full max-w-lg mx-auto">
        <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-pink-500/30 rounded-full"></div>
      </div>
    </div>

    <div className="flex flex-col lg:flex-row lg:grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
      <div className="w-full lg:col-span-5 text-center lg:text-right mt-4 lg:mt-0 flex flex-col">
        <div className="order-1 lg:order-3">
          <div
            className={`mb-6 transition-all duration-1000 transform ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
            style={getStaggerDelay(1)}
          >
            <Link href="/questionnaire">
              <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 rounded-xl max-w-md mx-auto lg:mr-0 lg:ml-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-white to-pink-50 opacity-80" />
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500" />
                <CardContent className="relative p-4 sm:p-6 flex items-center">
                  <div className="relative p-3 sm:p-4 mr-3 sm:mr-5 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 overflow-hidden">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                    <ClipboardList className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300">שאלון התאמה</h3>
                    <p className="text-xs sm:text-sm text-gray-600">מלא/י שאלון מקיף לקבלת הצעות שידוך מותאמות אישית</p>
                  </div>
                  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-auto text-pink-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500" />
                </CardContent>
              </Card>
            </Link>
          </div>
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
            style={getStaggerDelay(2)}
          >
            {!session ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto lg:mr-0 lg:ml-auto">
                <Link href="/auth/register" className="w-full">
                  <Button size="lg" className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full animate-shimmer"></span>
                    <span className="relative z-10">הרשמה למערכת</span>
                    <ArrowLeft className="relative z-10 mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/signin" className="w-full">
                  <Button variant="outline" size="lg" className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full transition-all duration-300">התחברות</Button>
                </Link>
              </div>
            ) : (
              <div className="flex justify-center lg:justify-end">
                <Link href="/profile" className="w-full sm:w-auto">
                  <Button size="lg" className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full animate-shimmer"></span>
                    <span className="relative z-10">לאזור האישי</span>
                    <ArrowLeft className="relative z-10 mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Updated main text content */}
        <div
          className={`order-3 lg:order-1 mt-6 lg:mt-0 transition-all duration-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
          style={getStaggerDelay(4)}
        >
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 md:mb-8 lg:mb-10 max-w-xl mx-auto lg:mr-0 lg:ml-auto leading-relaxed">
            החלום שלך על <span className="font-bold text-cyan-500">זוגיות מושלמת</span> ו<span className="font-bold text-pink-500">החיים שתמיד רצית</span>, קרוב מתמיד.
            ב-Match Point, שדכנים מקצועיים וטכנולוגיית <span className="font-bold text-cyan-500">AI</span> מתקדמת חוברים יחד כדי למצוא לך התאמות מדויקות מתוך מאגר עצום. הגדל/י משמעותית את הסיכוי שלך – מהר, יעיל ובדיסקרטיות.
            <br />
            <span className="mt-2 inline-block font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 animate-gradient">
              זה הזמן להתחיל. הירשמ/י עכשיו וגלה/י את ההבדל!
            </span>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-1"></div>

      {/* Puzzle/Connection Visualization Area */}
      <div
        ref={puzzleContainerRef}
        className={`order-2 w-full lg:col-span-6 relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] transition-all duration-1000 transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ transitionDelay: "350ms" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl aspect-square">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-full h-full border-[1px] border-dashed border-gray-400 rounded-full animate-spin-slow"></div>
              <div className="absolute w-3/4 h-3/4 border-[1px] border-dashed border-gray-400 rounded-full animate-spin-reverse-slow"></div>
            </div>

            {/* Left Card (Personal Guidance) */}
            <div
              className="absolute top-1/2 left-[20%] lg:left-[25%] transform -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
              style={{
                transform: `translate(calc(-50% + ${puzzleAnim.progress * 75}px), -50%)`,
              }}
            >
              <div className="w-48 h-[20rem] sm:w-56 sm:h-[23rem] md:w-64 md:h-[26rem] lg:w-72 lg:h-[29rem] bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-3xl shadow-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center text-white transform hover:scale-105 transition-transform">
                <Handshake className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-3 sm:mb-4 text-cyan-200" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-center">הליווי האישי שלך</h3>
                <p className="text-sm sm:text-base text-cyan-100 text-center leading-relaxed px-1 w-full mb-3 sm:mb-4">
                  הלב הפועם של Match Point: שדכן אישי שמכיר אותך, מבין את צרכיך, ומלווה אותך ברגישות ובמקצועיות לאורך כל הדרך.
                </p>
                <div className="mt-auto space-y-1.5 text-center">
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-cyan-400/60 rounded-full">ליווי אישי</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-cyan-400/60 rounded-full">הקשבה</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-cyan-400/60 rounded-full">רגישות</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-cyan-400/60 rounded-full">ניסיון אנושי</span>
                </div>
              </div>
            </div>

            {/* Right Card (AI Power) */}
            <div
              className="absolute top-1/2 right-[20%] transform -translate-y-1/2 translate-x-1/2 transition-all duration-700 ease-out"
              style={{
                transform: `translate(calc(50% - ${puzzleAnim.progress * 75}px), -50%)`,
              }}
            >
               <div className="w-48 h-[20rem] sm:w-56 sm:h-[23rem] md:w-64 md:h-[26rem] lg:w-72 lg:h-[29rem] bg-gradient-to-br from-pink-500 to-pink-700 rounded-3xl shadow-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center text-white transform hover:scale-105 transition-transform">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-3 sm:mb-4 text-pink-200" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-center">עוצמת ה-AI שלנו</h3>
                <p className="text-sm sm:text-base text-pink-100 text-center leading-relaxed px-1 w-full mb-3 sm:mb-4">
                  המוח החכם של Match Point: מערכת AI פורצת דרך המנתחת עשרות אלפי פרופילים ומסייעת לשדכן שלך לאתר עבורך את ההתאמות המדויקות ביותר מתוך מאגר עצום.
                </p>
                <div className="mt-auto space-y-1.5 text-center">
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-pink-400/60 rounded-full">AI מתקדם</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-pink-400/60 rounded-full">מאגר רחב</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-pink-400/60 rounded-full">התאמות מדויקות</span>
                    <span className="block text-xs sm:text-sm px-3 py-1 bg-pink-400/60 rounded-full">יעילות</span>
                </div>
              </div>
            </div>

            {/* Connection Animation */}
       <div
  className="absolute top-1/2 left-1/2 pointer-events-none z-30"
  style={{
    // שינוי 1: גורמים לעיגול להופיע מהר יותר
    opacity: Math.min(puzzleAnim.progress * 2.5, 1),
    
    // שינוי 2: גורמים לעיגול להתחיל לגדול מוקדם יותר
    transform: `translate(-50%, -50%) scale(${0.5 + Math.min(puzzleAnim.progress * 1.8, 1) * 1.2})`,
    
    // נקצר את ה-transition כדי שהתגובה תהיה מיידית יותר
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  }}
>
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-white"
                  style={{
                    filter: `blur(${8 + puzzleAnim.progress * 10}px)`,
                    opacity: 0.8,
                  }}
                ></div>
                <div className="absolute inset-0">
                  <div
                    className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-ping"
                    style={{ animationDuration: "1.5s", marginTop: "-5px", marginLeft: "-10px" }}
                  ></div>
                  <div
                    className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-pink-400 rounded-full animate-ping"
                    style={{ animationDuration: "1.8s", marginTop: "5px", marginLeft: "10px" }}
                  ></div>
                </div>
                
                {/* Updated Connected message */}
                <div className="relative bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-6 sm:px-9 py-4 sm:py-5 rounded-full shadow-lg flex flex-col items-center gap-1.5 sm:gap-2.5 text-center">
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                        <Heart className="w-4 h-4 sm:w-6 sm:h-6 fill-white animate-pulse" />
                        <span className="font-bold text-lg sm:text-xl md:text-2xl whitespace-nowrap">Match Point</span>
                    </div>
                    <span className="text-sm sm:text-base md:text-base mt-1 leading-relaxed max-w-[220px] sm:max-w-[300px] md:max-w-sm">
                        כשהלב והמוח הטכנולוגי נפגשים: יותר שידוכים, יותר הצלחות, יותר אהבה.
                    </span>
                </div>
                <div className="absolute -inset-2 sm:-inset-4 border-2 border-white/20 rounded-full animate-ping" style={{ animationDuration: "3s" }}></div>
                <div className="absolute -inset-4 sm:-inset-8 border-2 border-white/10 rounded-full animate-ping" style={{ animationDuration: "4s" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      className={`mt-6 sm:mt-8 transition-all duration-1000 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={getStaggerDelay(5)}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:flex-row items-center justify-between gap-3 sm:gap-4 bg-white/40 backdrop-blur-sm py-4 sm:py-5 px-4 sm:px-8 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-cyan-600">100%</span><br /><span className="text-xs sm:text-sm text-gray-600">דיסקרטיות</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-pink-100"><Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-pink-500">50+</span><br /><span className="text-xs sm:text-sm text-gray-600">מדדי תאימות</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100"><User className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-cyan-600">24/6</span><br /><span className="text-xs sm:text-sm text-gray-600">ליווי אישי</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-pink-100"><BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-pink-500">20+</span><br /><span className="text-xs sm:text-sm text-gray-600">שת״פ עם קהילות</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100"><Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-cyan-600">מקצועי</span><br /><span className="text-xs sm:text-sm text-gray-600">צוות שדכנים</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-full bg-pink-100"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /></div>
          <div><span className="font-semibold text-sm sm:text-base text-pink-500">מושלם</span><br /><span className="text-xs sm:text-sm text-gray-600">מסורת וחדשנות</span></div>
        </div>
      </div>
    </div>
  </div>
</section>
);
};
// Add these animations to your global CSS or tailwind config if not already present:
// .animate-float-slow { animation: float 6s ease-in-out infinite; }
// @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
// .animate-gradient-slow { animation: gradient-anim 15s ease infinite; }
// @keyframes gradient-anim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
// .animate-spin-slow { animation: spin 20s linear infinite; }
// @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
// .animate-spin-reverse-slow { animation: spin-reverse 15s linear infinite; }
// @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
// .animate-shimmer { animation: shimmer 2.5s infinite; }
// @keyframes shimmer { 100% { transform: translateX(100%); } }
// .animate-gradient { animation: gradient-text 3s ease infinite; }
// @keyframes gradient-text { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
export default HeroSection;