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
} from "lucide-react";
import { Session } from "next-auth";

interface HeroSectionProps {
  session: Session | null;
  isVisible: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ session, isVisible }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const puzzleContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Handle scroll events for puzzle animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track mouse movement for parallax effects
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

  // Calculate puzzle animation based on scroll position
  const getPuzzleAnimation = () => {
    if (!puzzleContainerRef.current) return { progress: 0 };

    const startPosition = 50; // Start animation earlier
    const endPosition = 300;
    const progress = Math.min(
      Math.max((scrollY - startPosition) / (endPosition - startPosition), 0),
      1
    );

    return { progress };
  };

  const puzzleAnim = getPuzzleAnimation();

  // Calculate parallax positions based on mouse movement
  const getParallaxStyle = (depth = 1) => {
    // Disable parallax on mobile for better performance
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return {};
    }

    const moveX = (mousePosition.x - 0.5) * 30 * depth;
    const moveY = (mousePosition.y - 0.5) * 30 * depth;
    return {
      transform: `translate(${moveX}px, ${moveY}px)`,
    };
  };

  // Animation variants for staggered elements
  const getStaggerDelay = (index: number) => ({
    transitionDelay: `${200 + index * 150}ms`,
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen pt-0 overflow-hidden flex flex-col -mt-0.25 w-full"
    >
      {/* Enhanced gradient background with animated gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow"
        style={{ backgroundSize: "400% 400%" }}
      />

      {/* Enhanced background patterns and effects */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Animated floating orbs with parallax effect - reduced on mobile */}
      <div
        className="absolute top-20 right-[15%] w-20 md:w-32 h-20 md:h-32 rounded-full bg-gradient-to-br from-cyan-200/20 to-cyan-300/10 animate-float-slow backdrop-blur-sm"
        style={{
          ...getParallaxStyle(0.5),
          animationDuration: "15s",
        }}
      ></div>
      <div
        className="absolute -bottom-10 left-[10%] w-24 md:w-40 h-24 md:h-40 rounded-full bg-gradient-to-br from-pink-200/20 to-pink-300/10 animate-float-slow backdrop-blur-sm"
        style={{
          ...getParallaxStyle(0.3),
          animationDuration: "18s",
          animationDelay: "1s",
        }}
      ></div>
      <div
        className="absolute top-1/3 left-[20%] w-16 md:w-20 h-16 md:h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-cyan-300/10 animate-float-slow backdrop-blur-sm"
        style={{
          ...getParallaxStyle(0.7),
          animationDuration: "12s",
          animationDelay: "2s",
        }}
      ></div>
      <div
        className="absolute bottom-1/4 right-[20%] w-20 md:w-28 h-20 md:h-28 rounded-full bg-gradient-to-br from-pink-200/20 to-pink-300/10 animate-float-slow backdrop-blur-sm"
        style={{
          ...getParallaxStyle(0.4),
          animationDuration: "20s",
          animationDelay: "3s",
        }}
      ></div>

      {/* Sacred geometry pattern for spiritual dimension */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square border-[1px] border-cyan-500/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square border-[1px] border-pink-500/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] aspect-square border-[1px] border-cyan-500/20 rounded-full"></div>
      </div>

      <div className="relative w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col">
        {/* Mobile layout order: 1. Title */}
        <div
          className={`text-center mb-6 sm:mb-4 md:mb-[-50px] transition-all duration-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
          style={getStaggerDelay(0)}
        >
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 px-4 py-2 rounded-full">
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-600">
                שידוכים לציבור הדתי
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-lg mx-auto">
            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-pink-500/30 rounded-full"></div>
          </div>
        </div>

        {/* Mobile layout: Different column order for mobile and desktop */}
        <div className="flex flex-col lg:flex-row lg:grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
          {/* Mobile-first reordering */}
          <div className="w-full lg:col-span-5 text-center lg:text-right mt-4 lg:mt-0 flex flex-col">
            {/* Mobile layout order: 2. Buttons */}
            <div className="order-1 lg:order-3">
              {/* Questionnaire card */}
              <div
                className={`mb-6 transition-all duration-1000 transform ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={getStaggerDelay(1)}
              >
                <Link href="/questionnaire">
                  <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 rounded-xl max-w-md mx-auto lg:mr-0 lg:ml-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-white to-pink-50 opacity-80" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500" />
                    <CardContent className="relative p-4 sm:p-6 flex items-center">
                      <div className="relative p-3 sm:p-4 mr-3 sm:mr-5 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 overflow-hidden">
                        {/* Inner shimmer effect */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                        <ClipboardList className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300">
                          שאלון התאמה
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          מלא/י שאלון מקיף לקבלת הצעות שידוך מותאמות אישית
                        </p>
                      </div>
                      <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-auto text-pink-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500" />
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Authentication buttons */}
              <div
                className={`transition-all duration-1000 transform ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={getStaggerDelay(2)}
              >
                {!session ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto lg:mr-0 lg:ml-auto">
                    <Link href="/auth/register" className="w-full">
                      <Button
                        size="lg"
                        className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                      >
                        {/* Button background shimmer effect */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full animate-shimmer"></span>

                        <span className="relative z-10">הרשמה למערכת</span>
                        <ArrowLeft className="relative z-10 mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>

                    <Link href="/auth/signin" className="w-full">
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full transition-all duration-300"
                      >
                        התחברות
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex justify-center lg:justify-end">
                    <Link href="/profile" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="text-sm sm:text-base w-full md:text-lg px-4 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                      >
                        {/* Button background shimmer effect */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full animate-shimmer"></span>

                        <span className="relative z-10">לאזור האישי</span>
                        <ArrowLeft className="relative z-10 mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile layout order: 4. Text content */}
            <div
              className={`order-3 lg:order-1 mt-6 lg:mt-0 transition-all duration-1000 transform ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={getStaggerDelay(4)}
            >
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 md:mb-8 lg:mb-10 max-w-xl mx-auto lg:mr-0 lg:ml-auto leading-relaxed">
                אנחנו שדכנים שעובדים ביחד עם{" "}
                <span className="font-bold text-cyan-500">AI</span> ש
                <span className="font-bold bg-gradient-to-r from-cyan-500 to-pink-500 text-transparent bg-clip-text">
                  החלום שלנו זה להגשים לך את החלום
                </span>{" "}
                ולחבר אותך עם{" "}
                <span className="font-bold text-cyan-500">
                  בן או בת הזוג שלך
                </span>{" "}
                כמה שיותר מהר, כדי שתוכל/י לחיות את{" "}
                <span className="font-bold text-pink-500">
                  החיים שתמיד רצית
                </span>
                .
                <br />
                <span className="mt-2 inline-block font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 animate-gradient">
                  אז למה את/ה מחכה? קדימה בוא/י נתחיל!
                </span>
              </p>
            </div>
          </div>

          {/* Central spacing column for larger screens */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Mobile layout order: 3. Puzzle Animation */}
          <div
            ref={puzzleContainerRef}
            className={`order-2 w-full lg:col-span-6 relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            {/* Modernized, more spiritual puzzle visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl aspect-square">
                {/* Sacred geometry background elements - simplified on mobile */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="w-full h-full border-[1px] border-dashed border-gray-400 rounded-full animate-spin-slow"></div>
                  <div className="absolute w-3/4 h-3/4 border-[1px] border-dashed border-gray-400 rounded-full animate-spin-reverse-slow"></div>
                </div>

                {/* Left Piece (Tradition) - Smaller on mobile */}
                <div
                  className="absolute top-1/2 left-1/4 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
                  style={{
                    transform: `translate(calc(-50% + ${
                      puzzleAnim.progress * 50
                    }px), -50%)`,
                  }}
                >
                  <div className="relative">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-3xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-xl flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                      {/* Background pattern */}
                      <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjIiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L3N2Zz4=')]"></div>
                      </div>

                      {/* Inner glow */}
                      <div className="absolute inset-4 bg-cyan-300/20 rounded-2xl filter blur-md"></div>

                      {/* Connector - enhanced with depth */}
                      <div className="absolute right-0 top-1/2 transform translate-x-1/4 -translate-y-1/2 w-8 sm:w-12 md:w-16 h-20 sm:h-28 md:h-40 overflow-visible z-10">
                        <div className="absolute inset-0 bg-cyan-500 rounded-l-2xl shadow-lg"></div>
                        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-7 sm:w-10 md:w-14 h-7 sm:h-10 md:h-14 bg-white rounded-full border-4 sm:border-8 border-cyan-500/80 shadow-lg z-20"></div>
                      </div>

                      {/* Content */}
                      <div className="relative flex flex-col items-center justify-center p-2 sm:p-3 md:p-5 mr-3 sm:mr-4 md:mr-6 z-10">
                        {/* Traditional symbols */}
                        <div className="absolute opacity-10 inset-0 flex items-center justify-center">
                          <svg
                            width="70"
                            height="70"
                            viewBox="0 0 100 100"
                            className="text-white/30 fill-current"
                          >
                            <path d="M50,10 L90,90 L10,90 Z" />
                          </svg>
                        </div>

                        <span className="text-white text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold drop-shadow-md mb-1 sm:mb-2 md:mb-4">
                          מסורת
                        </span>
                        <p className="text-cyan-100 text-xs sm:text-sm md:text-base lg:text-lg text-center mb-2 md:mb-5">
                          ערכים, משפחה ומורשת
                        </p>
                        <div className="mt-1 sm:mt-2 flex flex-wrap justify-center gap-1 sm:gap-2">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            קהילה
                          </span>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            ערכים
                          </span>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            אמונה
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Piece (Technology) */}
                <div
                  className="absolute top-1/2 right-1/4 transform -translate-y-1/2 translate-x-1/2 transition-all duration-700 ease-out"
                  style={{
                    transform: `translate(calc(50% - ${
                      puzzleAnim.progress * 50
                    }px), -50%)`,
                  }}
                >
                  <div className="relative">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-3xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      {/* Background pattern */}
                      <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjIiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTIwIDIwaDIwdjIwSDIweiIvPjwvZz48L3N2Zz4=')]"></div>
                      </div>

                      {/* Inner glow */}
                      <div className="absolute inset-4 bg-pink-300/20 rounded-2xl filter blur-md"></div>

                      {/* Connector - enhanced with depth */}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1/4 -translate-y-1/2 w-8 sm:w-12 md:w-16 h-20 sm:h-28 md:h-40 overflow-visible z-10">
                        <div className="absolute inset-0 bg-pink-500 rounded-r-2xl shadow-lg"></div>
                        <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-7 sm:w-10 md:w-14 h-7 sm:h-10 md:h-14 bg-white rounded-full border-4 sm:border-8 border-pink-500/80 shadow-lg z-20"></div>
                      </div>

                      {/* Content */}
                      <div className="relative flex flex-col items-center justify-center p-2 sm:p-3 md:p-5 ml-3 sm:ml-4 md:ml-6 z-10">
                        {/* Tech symbols */}
                        <div className="absolute opacity-10 inset-0 flex items-center justify-center">
                          <svg
                            width="70"
                            height="70"
                            viewBox="0 0 100 100"
                            className="text-white/30 fill-current"
                          >
                            <circle cx="50" cy="50" r="40" />
                          </svg>
                        </div>

                        <span className="text-white text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold drop-shadow-md mb-1 sm:mb-2 md:mb-4">
                          טכנולוגיה
                        </span>
                        <p className="text-pink-100 text-xs sm:text-sm md:text-base lg:text-lg text-center mb-2 md:mb-5">
                          חדשנות, יעילות ודיוק
                        </p>
                        <div className="mt-1 sm:mt-2 flex flex-wrap justify-center gap-1 sm:gap-2">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            AI
                          </span>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            התאמה
                          </span>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
                            פרטיות
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Animation */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                  style={{
                    opacity: puzzleAnim.progress,
                    scale: 0.5 + puzzleAnim.progress * 1.2,
                    transition: "opacity 0.7s ease-out, scale 0.7s ease-out",
                  }}
                >
                  {/* Connection Effects */}
                  <div className="relative">
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-full bg-white"
                      style={{
                        filter: `blur(${8 + puzzleAnim.progress * 10}px)`,
                        opacity: 0.8,
                      }}
                    ></div>

                    {/* Particles - reduced count on mobile */}
                    <div className="absolute inset-0">
                      <div
                        className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-ping"
                        style={{
                          animationDuration: "1.5s",
                          marginTop: "-5px",
                          marginLeft: "-10px",
                        }}
                      ></div>
                      <div
                        className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-pink-400 rounded-full animate-ping"
                        style={{
                          animationDuration: "1.8s",
                          marginTop: "5px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>

                    {/* Connected message */}
                    <div className="relative bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1 sm:gap-2">
                      <Heart className="w-3 h-3 sm:w-5 sm:h-5 fill-white animate-pulse" />
                      <span className="font-bold text-sm sm:text-lg md:text-xl">
                        החיבור המושלם
                      </span>
                    </div>

                    {/* Ring effect around connection - smaller on mobile */}
                    <div
                      className="absolute -inset-2 sm:-inset-4 border-2 border-white/20 rounded-full animate-ping"
                      style={{ animationDuration: "3s" }}
                    ></div>
                    <div
                      className="absolute -inset-4 sm:-inset-8 border-2 border-white/10 rounded-full animate-ping"
                      style={{ animationDuration: "4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div
          className={`mt-6 sm:mt-8 transition-all duration-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
          style={getStaggerDelay(5)}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:flex-row items-center justify-between gap-3 sm:gap-4 bg-white/40 backdrop-blur-sm py-4 sm:py-5 px-4 sm:px-8 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-cyan-600">
                  100%
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  אבטחת פרטיות
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-pink-100">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-pink-500">
                  50+
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  מדדי תאימות
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-cyan-600">
                  24/6
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  ליווי אישי
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-pink-100">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-pink-500">
                  20+
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  שת״פ עם קהילות
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-cyan-100">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-cyan-600">
                  מקצועי
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  צוות שדכנים
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-pink-100">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-pink-500">
                  מושלם
                </span>
                <br />
                <span className="text-xs sm:text-sm text-gray-600">
                  מסורת וחדשנות
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Add these animations to your global CSS or tailwind config:
//
// .animate-float-slow {
//   animation: float 6s ease-in-out infinite;
// }
// @keyframes float {
//   0%, 100% { transform: translateY(0); }
//   50% { transform: translateY(-20px); }
// }
//
// .animate-gradient-slow {
//   animation: gradient-anim 15s ease infinite;
// }
// @keyframes gradient-anim {
//   0% { background-position: 0% 50%; }
//   50% { background-position: 100% 50%; }
//   100% { background-position: 0% 50%; }
// }
//
// .animate-spin-slow {
//   animation: spin 20s linear infinite;
// }
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
//
// .animate-spin-reverse-slow {
//   animation: spin-reverse 15s linear infinite;
// }
// @keyframes spin-reverse {
//   from { transform: rotate(360deg); }
//   to { transform: rotate(0deg); }
// }
//
// .animate-shimmer {
//   animation: shimmer 2.5s infinite;
// }
// @keyframes shimmer {
//   100% { transform: translateX(100%); }
// }
//
// .animate-gradient {
//   animation: gradient-text 3s ease infinite;
// }
// @keyframes gradient-text {
//   0%, 100% { background-position: 0% 50%; }
//   50% { background-position: 100% 50%; }
// }

export default HeroSection;
