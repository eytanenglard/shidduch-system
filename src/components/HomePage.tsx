"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  Users,
  Shield,
  MessageCircle,
  ArrowLeft,
  ClipboardList,
  Sparkles,
  ChevronDown,
  CheckCircle,
  UserCheck,
  Lock,
  Cpu,
} from "lucide-react";

// Type definitions
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "blue" | "green" | "orange" | "pink";
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
  color: "blue" | "green" | "orange" | "pink";
}

interface TestimonialCardProps {
  text: string;
  author: string;
  result?: string;
  color: "blue" | "green" | "orange" | "pink";
}

interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  color: "blue" | "green" | "orange" | "pink";
}

interface FAQItemProps {
  question: string;
  answer: string;
}

// Component for feature cards with improved hover effects
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500/10 to-blue-700/10",
      bg: "from-blue-50 to-blue-100",
      text: "text-blue-600 group-hover:text-blue-700",
      title: "group-hover:text-blue-700",
      shadow: "shadow-blue-200/50",
    },
    green: {
      gradient: "from-green-500/10 to-green-700/10",
      bg: "from-green-50 to-green-100",
      text: "text-green-600 group-hover:text-green-700",
      title: "group-hover:text-green-700",
      shadow: "shadow-green-200/50",
    },
    orange: {
      gradient: "from-orange-500/10 to-orange-700/10",
      bg: "from-orange-50 to-orange-100",
      text: "text-orange-600 group-hover:text-orange-700",
      title: "group-hover:text-orange-700",
      shadow: "shadow-orange-200/50",
    },
    pink: {
      gradient: "from-pink-500/10 to-pink-700/10",
      bg: "from-pink-50 to-pink-100",
      text: "text-pink-600 group-hover:text-pink-700",
      title: "group-hover:text-pink-700",
      shadow: "shadow-pink-200/50",
    },
  };

  return (
    <Card className="group relative overflow-hidden border-none shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-100 transition-opacity duration-500" />
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClasses[color].gradient} opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500`}
      />
      <CardContent className="relative p-8 backdrop-blur-sm">
        <div className="mb-6 flex justify-center transform transition-transform duration-500 group-hover:scale-110">
          <div
            className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color].bg} shadow-md group-hover:shadow-lg transition-all duration-500 ${colorClasses[color].shadow}`}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: `w-8 h-8 ${colorClasses[color].text} transition-colors duration-500`,
            })}
          </div>
        </div>
        <h3
          className={`text-xl font-bold mb-3 text-gray-800 ${colorClasses[color].title} transition-colors duration-300 text-center`}
        >
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-center">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

// Modernized Step Component with enhanced visuals
const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
  isLast = false,
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      hover: "group-hover:text-blue-600",
      border: "group-hover:border-blue-100",
      shadow: "group-hover:shadow-blue-100",
      line: "from-blue-500 to-blue-200",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      hover: "group-hover:text-green-600",
      border: "group-hover:border-green-100",
      shadow: "group-hover:shadow-green-100",
      line: "from-green-500 to-green-200",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      hover: "group-hover:text-orange-600",
      border: "group-hover:border-orange-100",
      shadow: "group-hover:shadow-orange-100",
      line: "from-orange-500 to-orange-200",
    },
    pink: {
      gradient: "from-pink-500 to-pink-600",
      hover: "group-hover:text-pink-600",
      border: "group-hover:border-pink-100",
      shadow: "group-hover:shadow-pink-100",
      line: "from-pink-500 to-pink-200",
    },
  };

  return (
    <div className="flex gap-6 items-start group relative">
      {/* Connecting line between steps */}
      {!isLast && (
        <div
          className={`absolute top-12 bottom-0 right-6 w-0.5 bg-gradient-to-b ${colorClasses[color].line} rounded-full`}
        />
      )}

      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color].gradient} text-white flex items-center justify-center flex-shrink-0 text-lg font-bold shadow-lg group-hover:scale-110 ${colorClasses[color].shadow} transition-all duration-500 z-10`}
      >
        {number}
      </div>
      <div
        className={`flex-1 bg-white/80 backdrop-blur-sm p-5 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 border border-gray-50 ${colorClasses[color].border}`}
      >
        <h3
          className={`text-xl font-bold mb-2 text-gray-800 ${colorClasses[color].hover} transition-colors duration-300`}
        >
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
          {description}
        </p>
      </div>
    </div>
  );
};

// Modernized Testimonial Card with enhanced aesthetics
const TestimonialCard: React.FC<TestimonialCardProps> = ({
  text,
  author,
  result,
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient1: "from-blue-100 to-blue-50",
      gradient2: "from-blue-50 to-blue-100",
      avatar: "from-blue-500 to-blue-600",
      result: "text-blue-600",
    },
    green: {
      gradient1: "from-green-100 to-green-50",
      gradient2: "from-green-50 to-green-100",
      avatar: "from-green-500 to-green-600",
      result: "text-green-600",
    },
    orange: {
      gradient1: "from-orange-100 to-orange-50",
      gradient2: "from-orange-50 to-orange-100",
      avatar: "from-orange-500 to-orange-600",
      result: "text-orange-600",
    },
    pink: {
      gradient1: "from-pink-100 to-pink-50",
      gradient2: "from-pink-50 to-pink-100",
      avatar: "from-pink-500 to-pink-600",
      result: "text-pink-600",
    },
  };

  return (
    <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 h-full">
      {/* Improved decorative elements */}
      <div
        className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${colorClasses[color].gradient1} opacity-50 rounded-full`}
      />
      <div
        className={`absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br ${colorClasses[color].gradient2} opacity-30 rounded-full`}
      />

      {/* Content with enhanced styling */}
      <CardContent className="relative p-8 h-full flex flex-col backdrop-blur-sm">
        <div className="mb-4 text-4xl text-gray-300 font-serif opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          ❝
        </div>
        <p className="text-gray-700 leading-relaxed text-lg mb-6 flex-grow">
          {text}
        </p>
        <div className="flex flex-col mt-auto">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses[color].avatar} flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300`}
            >
              {author[0]}
            </div>
            <p className="mr-4 font-semibold text-gray-800">{author}</p>
          </div>
          {result && (
            <div
              className={`mt-3 pt-3 border-t border-gray-100 ${colorClasses[color].result} font-medium text-sm flex items-center`}
            >
              <Heart className="w-4 h-4 ml-1" fill="currentColor" /> {result}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Matchmaker Card Component
const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500/10 to-blue-700/10",
      bg: "from-blue-100 to-blue-200",
      border: "border-blue-100",
      shadow: "shadow-blue-100/50",
    },
    green: {
      gradient: "from-green-500/10 to-green-700/10",
      bg: "from-green-100 to-green-200",
      border: "border-green-100",
      shadow: "shadow-green-100/50",
    },
    orange: {
      gradient: "from-orange-500/10 to-orange-700/10",
      bg: "from-orange-100 to-orange-200",
      border: "border-orange-100",
      shadow: "shadow-orange-100/50",
    },
    pink: {
      gradient: "from-pink-500/10 to-pink-700/10",
      bg: "from-pink-100 to-pink-200",
      border: "border-pink-100",
      shadow: "shadow-pink-100/50",
    },
  };

  return (
    <Card className="group relative overflow-hidden border border-gray-100 hover:border-transparent shadow-sm hover:shadow-xl transition-all duration-500">
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClasses[color].gradient} opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500`}
      />
      <CardContent className="relative p-6 flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${colorClasses[color].bg} flex items-center justify-center text-white text-2xl font-bold mb-4 ${colorClasses[color].shadow} group-hover:scale-110 transition-all duration-300`}
        >
          {name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold mb-1 text-gray-800">{name}</h3>
        <p className="text-sm text-gray-500 mb-3">{role}</p>
        <div className={`w-12 h-0.5 ${colorClasses[color].border} mb-3`}></div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

// FAQ Item Component
const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="flex justify-between items-center w-full py-4 text-right text-gray-800 hover:text-blue-600 focus:outline-none transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-lg">{question}</span>
        <span
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Section - Enhanced with more modern animations and effects */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Enhanced backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white" />

        {/* Animated background shapes */}
        <div
          className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-blue-200/40 to-blue-300/30 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-70 animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-70 animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-green-200/30 to-green-300/20 rounded-full opacity-60 animate-pulse"
          style={{ animationDuration: "15s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-16 md:w-24 h-16 md:h-24 bg-gradient-to-br from-pink-200/30 to-pink-300/20 rounded-full opacity-60 animate-pulse"
          style={{ animationDuration: "10s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className={`transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 md:mb-8 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                MATCH POINT
              </span>
              <br />
              בניית קשר
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                משמעותי{" "}
              </span>
              על בסיס ערכים משותפים
            </h1>
          </div>

          <div
            className={`transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
              מערכת המשלבת טכנולוגיה מתקדמת וליווי אישי לאיתור התאמות מדויקות
              ומשמעותיות
            </p>
          </div>

          <div
            className={`transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            {!session ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl w-full sm:w-auto group"
                  >
                    הרשמה למערכת
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-xl w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    התחברות
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/profile">
                <Button
                  size="lg"
                  className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl group"
                >
                  לאזור האישי
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>

          <div
            className={`mt-16 max-w-md mx-auto transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <Link href="/questionnaire">
              <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-70" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 rounded-xl blur-sm transition-all duration-300" />
                <CardContent className="relative p-6 flex items-center">
                  <div className="p-3 mr-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
                      שאלון התאמה
                    </h3>
                    <p className="text-gray-600 text-sm">
                      מלא/י שאלון מקיף לקבלת הצעות שידוך מותאמות אישית
                    </p>
                  </div>
                  <ArrowLeft className="h-5 w-5 mr-auto text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Section - New */}
      <section className="py-16 md:py-20 px-4 bg-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-70"></div>
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          <svg
            className="absolute right-0 top-0 h-full opacity-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C40,100 60,100 100,0 L100,100 L0,100 Z"
              fill="url(#grad2)"
            ></path>
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              מה הופך את
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                {" "}
                Match Point{" "}
              </span>
              לייחודית?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              השילוב המושלם בין טכנולוגיה מתקדמת לבין הנגיעה האנושית והמסורתית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 transform md:translate-x-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-50 opacity-50 rounded-full transform translate-x-20 -translate-y-20"></div>

              <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
                האתגר במערכות קיימות
              </h3>

              <ul className="space-y-3 relative">
                <ComparisonItem isNegative>
                  חוסר פרטיות ודיסקרטיות באפליקציות היכרויות רגילות
                </ComparisonItem>
                <ComparisonItem isNegative>
                  פתרונות שאינם מותאמים לערכי הקהילה המסורתית והדתית
                </ComparisonItem>
                <ComparisonItem isNegative>
                  שיעור גבוה של אכזבות וחוסר התאמה אמיתית
                </ComparisonItem>
                <ComparisonItem isNegative>
                  מוגבלות לחוגים חברתיים קיימים בלבד
                </ComparisonItem>
                <ComparisonItem isNegative>
                  שדכנים מסורתיים: עלויות גבוהות, רשת קשרים מוגבלת ותהליך ממושך
                </ComparisonItem>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 transform md:-translate-x-4 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-50 opacity-50 rounded-full transform -translate-x-20 translate-y-20"></div>

              <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
                הפתרון של Match Point
              </h3>

              <ul className="space-y-3 relative">
                <ComparisonItem>
                  יעילות ומידה לקנה: שדכנים מנהלים פי 7 יותר לקוחות בעזרת
                  הטכנולוגיה שלנו
                </ComparisonItem>
                <ComparisonItem>
                  ליווי אנושי: הדרכה אישית משדכנים מקצועיים לאורך כל התהליך
                </ComparisonItem>
                <ComparisonItem>
                  התאמה מדויקת יותר: אלגוריתם AI עם 27 ממדי התאמה
                </ComparisonItem>
                <ComparisonItem>
                  פרטיות מלאה: פרופילים נראים רק לשדכנים מורשים
                </ComparisonItem>
                <ComparisonItem>
                  מחוייבות לערכים: מערכת המכבדת את המסורת תוך שימוש בטכנולוגיה
                  מתקדמת
                </ComparisonItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced cards with improved hover effects */}
      <section className="py-16 md:py-20 px-4 bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              למה
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                לבחור{" "}
              </span>
              במערכת שלנו?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="פרטיות מלאה"
              description="שמירה קפדנית על פרטיות המשתמשים ואבטחת מידע מתקדמת"
              color="blue"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="התאמה מדויקת"
              description="מערכת חכמה המתאימה בין מועמדים על בסיס ערכים ושאיפות משותפות"
              color="green"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="ליווי אישי"
              description="צוות שדכנים מקצועי ומנוסה לאורך כל התהליך"
              color="orange"
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="תקשורת בטוחה"
              description="פלטפורמה מאובטחת ליצירת קשר ראשוני בין המועמדים"
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Algorithm Section - New */}
      <section className="py-16 md:py-20 px-4 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-70"></div>

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute left-0 top-1/3 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute right-0 bottom-1/4 w-60 h-60 bg-orange-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                    הטכנולוגיה
                  </span>{" "}
                  שמאחורי ההתאמה המושלמת
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-6"></div>
                <p className="text-lg text-gray-600 mb-8">
                  במערכת Match Point אנו משלבים בינה מלאכותית מתקדמת עם ההבנה
                  האנושית העמוקה של שדכנים מקצועיים
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 mr-4">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">
                        התאמה עם 27 ממדים
                      </h3>
                      <p className="text-gray-600">
                        האלגוריתם שלנו מנתח את הפרופילים ומייצר התאמות
                        פוטנציאליות על בסיס 27 ממדי התאמה שונים - הרבה מעבר למה
                        שעין אנושית יכולה לעבד
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600 mr-4">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">
                        שיפור מתמיד מהמשוב
                      </h3>
                      <p className="text-gray-600">
                        המערכת לומדת ומשתפרת באופן מתמיד מהמשוב של המשתמשים
                        והשדכנים, מה שמוביל להתאמות טובות יותר עם הזמן
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 mr-4">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">
                        ארכיטקטורת פרטיות
                      </h3>
                      <p className="text-gray-600">
                        הצפנה מקצה לקצה ואבטחת מידע ברמה הגבוהה ביותר מבטיחים
                        שהפרטים האישיים שלך נשארים פרטיים לחלוטין
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5 rounded-2xl transform rotate-3"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                <div className="flex justify-between mb-6">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    match-algorithm.js
                  </div>
                </div>

                <div
                  className="font-mono text-sm text-left overflow-hidden"
                  dir="ltr"
                >
                  <div className="mb-1">
                    <span className="text-purple-600">const</span>{" "}
                    <span className="text-blue-600">computeCompatibility</span>{" "}
                    <span className="text-gray-500">=</span>{" "}
                    <span className="text-purple-600">(</span>
                    <span className="text-orange-600">profile1</span>,{" "}
                    <span className="text-orange-600">profile2</span>
                    <span className="text-purple-600">)</span>{" "}
                    <span className="text-purple-600">{`=>`}</span>{" "}
                    <span className="text-purple-600">{"{"}</span>
                  </div>
                  <div className="mb-1 pl-4">
                    <span className="text-purple-600">let</span>{" "}
                    compatibilityScore <span className="text-gray-500">=</span>{" "}
                    <span className="text-blue-600">0</span>;
                  </div>
                  <div className="mb-1 pl-4 text-gray-500">
                    {"// Core values compatibility (weighted x3)"}
                  </div>
                  <div className="mb-1 pl-4">
                    compatibilityScore <span className="text-gray-500">+=</span>{" "}
                    <span className="text-blue-600">valueCompatibility</span>
                    <span className="text-purple-600">(</span>profile1, profile2
                    <span className="text-purple-600">)</span>{" "}
                    <span className="text-gray-500">*</span>{" "}
                    <span className="text-blue-600">3</span>;
                  </div>
                  <div className="mb-1 pl-4 text-gray-500">
                    {"// Lifestyle compatibility (weighted x2)"}
                  </div>
                  <div className="mb-1 pl-4">
                    compatibilityScore <span className="text-gray-500">+=</span>{" "}
                    <span className="text-blue-600">
                      lifestyleCompatibility
                    </span>
                    <span className="text-purple-600">(</span>profile1, profile2
                    <span className="text-purple-600">)</span>{" "}
                    <span className="text-gray-500">*</span>{" "}
                    <span className="text-blue-600">2</span>;
                  </div>
                  <div className="mb-1 pl-4 text-gray-500">
                    {"// Family background compatibility"}
                  </div>
                  <div className="mb-1 pl-4">
                    compatibilityScore <span className="text-gray-500">+=</span>{" "}
                    <span className="text-blue-600">familyCompatibility</span>
                    <span className="text-purple-600">(</span>profile1, profile2
                    <span className="text-purple-600">)</span>;
                  </div>
                  <div className="mb-1 pl-4 text-gray-500">
                    {"// Goals and aspirations alignment"}
                  </div>
                  <div className="mb-1 pl-4">
                    compatibilityScore <span className="text-gray-500">+=</span>{" "}
                    <span className="text-blue-600">goalsCompatibility</span>
                    <span className="text-purple-600">(</span>profile1, profile2
                    <span className="text-purple-600">)</span>{" "}
                    <span className="text-gray-500">*</span>{" "}
                    <span className="text-blue-600">1.5</span>;
                  </div>
                  <div className="mb-1 pl-4 text-gray-500">
                    {"// Additional dimensions..."}
                  </div>
                  <div className="mb-1 pl-4">
                    <span className="text-purple-600">return</span>{" "}
                    compatibilityScore <span className="text-gray-500">/</span>{" "}
                    <span className="text-blue-600">maxPossibleScore</span>;
                  </div>
                  <div>
                    <span className="text-purple-600">{"}"}</span>;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced with connecting lines and better visuals */}
      <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                איך זה{" "}
              </span>
              עובד?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full" />
          </div>

          <div className="space-y-12 md:space-y-16 lg:space-y-20">
            <Step
              number="1"
              title="הרשמה למערכת"
              description="מילוי פרופיל אישי מפורט והגדרת העדפות לחיפוש לאחר תהליך רישום פשוט וידידותי"
              color="blue"
            />

            <Step
              number="2"
              title="שאלון ערכים מקיף"
              description="מיפוי אישיות, רקע משפחתי ומסורות, והשקפות עולם שיאפשרו למערכת להכיר אותך לעומק"
              color="green"
            />

            <Step
              number="3"
              title="שיפור פרופיל בעזרת AI"
              description="המערכת מציעה שאלות ממוקדות להרחבת הפרופיל ומספקת תובנות להדגשת האיכויות הייחודיות שלך"
              color="orange"
            />

            <Step
              number="4"
              title="סקירה אישית של שדכן"
              description="שדכן מקצועי סוקר את הפרופיל שלך באופן אישי, מוסיף הערות והמלצות, ומכין אסטרטגיית התאמה מותאמת"
              color="pink"
            />

            <Step
              number="5"
              title="ניתוח התאמה חכם"
              description="האלגוריתם מנתח עשרות אלפי פרופילים לפי 27 ממדי התאמה ומייצר רשימת מועמדים פוטנציאליים"
              color="blue"
            />

            <Step
              number="6"
              title="התאמה אישית מהשדכן"
              description="השדכן בוחר את ההתאמות האופטימליות מתוך הצעות האלגוריתם, תוך שקילת גורמי התאמה מעודנים"
              color="green"
            />

            <Step
              number="7"
              title="הצעת התאמה וקבלת משוב"
              description="הצגת הצעת ההתאמה, איסוף משוב מפורט במקרה של דחייה, ולמידה מתמדת לשיפור התאמות עתידיות"
              color="orange"
            />

            <Step
              number="8"
              title="יצירת קשר ראשוני"
              description="תקשורת מאובטחת וליווי מהשדכן המקצועי לאורך כל שלבי ההיכרות הראשונית"
              color="pink"
            />

            <Step
              number="9"
              title="בניית קשר משמעותי"
              description="ליווי מקצועי לאורך התהליך עד ליצירת הקשר המיוחל והמשמעותי"
              isLast={true}
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* Matchmaker Team Section - New */}
      <section className="py-16 md:py-20 px-4 bg-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-70"></div>
        <div className="absolute top-0 left-0 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              הכירו את
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                {" "}
                צוות השדכנים{" "}
              </span>
              שלנו
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              צוות המומחים שלנו מביא עשרות שנות ניסיון וידע עמוק בליווי זוגות
              לקראת חיים משותפים
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <MatchmakerCard
              name="דינה אנגלרד"
              role="שדכנית ראשית"
              description="עם נסיון של 8 שנים בתחום השידוכים וכישורים בינאישיים יוצאי דופן. מתמחה בהבנת הצרכים העמוקים של המועמדים."
              color="blue"
            />
            <MatchmakerCard
              name="איתן אנגלרד"
              role="מייסד ומנכ״ל"
              description="יזם טכנולוגי עם התמחות בשידוכים. פיתח את פלטפורמת התוכנה הייחודית שלנו ואחראי באופן אישי ל-2 שידוכים מוצלחים."
              color="green"
            />
            {/*  <MatchmakerCard
              name="רחל לוי"
              role="שדכנית בכירה"
              description="מומחית בהתאמת זוגות בקהילה הדתית-לאומית, עם הבנה עמוקה של ערכי המסורת ויכולת מוכחת ביצירת התאמות מוצלחות."
              color="orange"
            />
            <MatchmakerCard
              name="דוד כהן"
              role="יועץ זוגיות"
              description="בעל הכשרה בייעוץ זוגי ומומחה בליווי זוגות בשלבים הראשונים של הקשר. מסייע ביצירת יסודות איתנים לקשר ארוך טווח."
              color="pink"
            /> */}
          </div>
        </div>
      </section>

      {/* Success Stories Section - Enhanced Testimonials */}
      <section className="py-16 md:py-20 px-4 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              סיפורי
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                הצלחה{" "}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <TestimonialCard
              text="בזכות Match Point הכרתי את בן זוגי. ההתאמה הייתה מדויקת מעבר למה שציפיתי! הליווי המקצועי של דינה היה חם ורגיש לאורך כל התהליך."
              author="רחל, ירושלים"
              result="נשואה 8 חודשים"
              color="blue"
            />
            <TestimonialCard
              text="אחרי שניסיתי כמה אפליקציות היכרויות רגילות, השדכנית שליוותה אותי ב-Match Point הבינה בדיוק מה אני מחפש והצליחה להתאים לי את שידוך חיי"
              author="משה, בני ברק"
              result="מאורס"
              color="orange"
            />
            <TestimonialCard
              text="המערכת עזרה לי למצוא את האחת בצורה צנועה ומכבדת. ממליץ בחום לכל מי שרציני לגבי מציאת זיווג אמיתי שמתאים לערכים שלו!"
              author="דוד, פתח תקווה"
              result="נשוי שנה וחצי"
              color="green"
            />
          </div>

          <div className="mt-12 text-center">
            <Link href="/success-stories">
              <Button
                variant="outline"
                className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-xl group"
              >
                <span>לעוד סיפורי הצלחה</span>
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section - New */}
      <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50"></div>

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              שאלות
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                {" "}
                נפוצות{" "}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              אלו התשובות לשאלות הנפוצות ביותר על שירות Match Point שלנו
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="space-y-2">
              <FAQItem
                question="מה המחיר של השירות?"
                answer="אנו מציעים מספר תוכניות: רישום בסיסי בחינם הכולל פרופיל ראשוני ו-3 הצעות התאמה. מנוי סטנדרטי ב-95₪ לשנה המעניק גישה להצעות התאמה מתמשכות, ומנוי פרימיום ב-270₪ לשנה הכולל התאמה ותמיכה מועדפת. בנוסף, ישנה עמלת הצלחה של 1,000₪ מכל צד (2,000₪ בסך הכל) במקרה של אירוסין."
              />
              <FAQItem
                question="האם השירות מתאים לכל הזרמים ביהדות?"
                answer="כן! המערכת שלנו מתוכננת להתאים לכל הקהילות היהודיות, עם אפשרויות להתאמה מדויקת לפי רמת הדתיות והמסורות הספציפיות. אנו משרתים כרגע את הקהילה הדתית-לאומית בישראל, יהדות אורתודוכסית מודרנית בחו״ל, וקהילות חרדיות, עם תוכניות להרחבה לקהילות יהודיות נוספות."
              />
              <FAQItem
                question="כיצד נשמרת הפרטיות שלי במערכת?"
                answer="פרטיות המשתמשים היא בראש סדר העדיפויות שלנו. הפרופילים נראים רק לשדכנים מורשים ולא לשאר המשתמשים. אנו משתמשים בהצפנה מקצה לקצה וארכיטקטורת אפס-ידע להגנה על המידע האישי שלך. התמונות והפרטים האישיים שלך לעולם לא יהיו חשופים ללא הסכמתך המפורשת."
              />
              <FAQItem
                question="כמה זמן בממוצע לוקח למצוא התאמה?"
                answer="בעוד שהזמן משתנה בהתאם לגורמים רבים, המשתמשים שלנו מוצאים התאמות משמעותיות בזמן קצר משמעותית מהממוצע בשוק. בעוד הממוצע בשוק עומד על כ-2.5 שנים, מרבית המשתמשים שלנו מוצאים התאמות מוצלחות תוך 6-12 חודשים, הודות לשילוב הייחודי של טכנולוגיה וליווי אישי."
              />
              <FAQItem
                question="האם יש אירועים או מפגשים קהילתיים?"
                answer="בהחלט! אנו מארגנים מגוון אירועים קהילתיים כולל מפגשים חברתיים, סדנאות, והרצאות. אירועים אלה מספקים הזדמנויות טבעיות להיכרות בסביבה נעימה ותומכת. לחברי המנוי שלנו ניתנת גישה מועדפת לאירועים אלה, עם מחירים הנעים בין 15₪-30₪ למפגשים חברתיים, 30₪-60₪ לסדנאות, ו-300₪-600₪ לסופי שבוע מיוחדים."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Assurance Section - New */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')]"></div>

        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  הפרטיות שלך חשובה לנו
                </h2>
                <div className="w-24 h-1 bg-white/30 rounded-full mb-6 mx-auto"></div>
                <p className="text-lg text-white/90 mb-6 mx-auto max-w-md">
                  בעולם השידוכים, הדיסקרטיות והפרטיות הן קריטיות. ב-Match Point
                  פיתחנו מערכת שמתעדפת את האבטחה והפרטיות שלך בכל שלב.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">
                    פרופילים גלויים רק לשדכנים מורשים, מבטיחים דיסקרטיות מלאה
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">
                    הצפנת מידע מקצה לקצה להגנה על כל הנתונים האישיים
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">
                    בדיקות אבטחה קבועות וביקורות חיצוניות לוודא עמידה בסטנדרטים
                    המחמירים ביותר
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">
                    מדיניות אפס-שיתוף - המידע שלך לעולם לא נמכר או משותף עם
                    צדדים שלישיים
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">
                    יכולת שליטה מלאה בנתונים שלך בכל עת
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative max-w-sm">
                <div className="absolute inset-0 bg-white/10 rounded-2xl blur-lg transform rotate-6"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-8 rounded-2xl border border-white/30">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white/30 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-center">
                    הבטחת הפרטיות שלנו
                  </h3>

                  <p className="text-white/90 text-center mb-6">
                    &quot;אנו מתחייבים לשמור על הפרטיות והכבוד של כל משתמש
                    במערכת שלנו, תוך יצירת סביבה בטוחה ומכבדת למציאת הזיווג
                    המושלם&quot;
                  </p>

                  <div className="text-center">
                    <Link href="/privacy">
                      <Button
                        variant="outline"
                        className="border-2 border-white/50 bg-white text-blue-600 hover:bg-white/90 transition-all duration-300 rounded-xl"
                      >
                        קראו את מדיניות הפרטיות
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - New enhanced call to action */}
      <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-70"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <svg
            className="absolute left-0 top-0 h-full opacity-5"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C40,100 60,100 100,0 L100,100 L0,100 Z"
              fill="url(#grad1)"
            ></path>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-blue-100">
            <div className="inline-block mb-6 p-3 bg-blue-100 rounded-full text-blue-600">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              מוכנים להתחיל את
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                {" "}
                המסע שלכם?{" "}
              </span>
            </h2>

            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              הצטרפו היום למערכת Match Point המובילה והתקדמו צעד אחד קדימה
              במציאת הזיווג המושלם עבורכם
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                >
                  <span>להרשמה מיידית</span>
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-xl"
                >
                  למידע נוסף
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - With enhanced modern design */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 md:py-16 px-4 relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTEwIDEwaDIwdjIwSDEwVjEweiIvPjwvZz48L2c+PC9zdmc+')]"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 group mb-6">
                <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:scale-110">
                  <Heart
                    className="h-7 w-7 text-blue-400 transition-all duration-300 group-hover:text-blue-300"
                    fill="#1e293b"
                  />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-all duration-300">
                  Match Point
                </span>
              </Link>

              <p className="text-gray-400 mb-6">
                משלבים טכנולוגיה מתקדמת וליווי אישי ליצירת קשרים משמעותיים ארוכי
                טווח.
              </p>

              <div className="flex space-x-4 rtl:space-x-reverse">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600/20 transition-colors duration-300"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-400/20 transition-colors duration-300"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gradient-to-br from-purple-600/20 to-pink-600/20 transition-colors duration-300"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
                  ניווט מהיר
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-blue-300/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink href="/">דף הבית</FooterLink>
                <FooterLink href="/about">אודות</FooterLink>
                <FooterLink href="/faq">שאלות נפוצות</FooterLink>
                <FooterLink href="/matches">שידוכים זמינים</FooterLink>
                <FooterLink href="/success-stories">סיפורי הצלחה</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
                  מידע שימושי
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-blue-300/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink href="/privacy">פרטיות</FooterLink>
                <FooterLink href="/terms">תנאי שימוש</FooterLink>
                <FooterLink href="/help">עזרה ותמיכה</FooterLink>
                <FooterLink href="/blog">בלוג</FooterLink>
                <FooterLink href="/pricing">תוכניות ומחירים</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
                  יצירת קשר
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-blue-300/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <FooterItem icon="📱" text="054-321-0040" />
                <FooterItem icon="✉️" text="matchpoint.center@gmail.com" />
                <FooterItem icon="📍" text="רעננה" />
                <FooterItem icon="🕒" text="א'-ה' 9:00-18:00, ו' 9:00-13:00" />
              </ul>
            </div>
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-700/50">
            <div className="text-center">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-400/10 text-blue-400 hover:from-blue-500/20 hover:to-blue-400/20 transition-colors duration-300">
                  מחברים לבבות בדרך הנכונה
                </span>
              </div>
              <p className="text-gray-400">
                © כל הזכויות שמורות Match Point 2025
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Contact Button - Enhanced with animation */}
      <div className="fixed bottom-8 left-8 z-50 animate-bounce-slow">
        <Button
          size="lg"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 group"
        >
          <MessageCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          <span className="group-hover:mr-1 transition-all">דברו איתנו</span>
        </Button>
      </div>
    </div>
  );
}

// Helper component for the comparison items
const ComparisonItem = ({
  children,
  isNegative = false,
}: {
  children: React.ReactNode;
  isNegative?: boolean;
}) => (
  <li className="flex items-start">
    <div
      className={`p-1 rounded-full ${
        isNegative ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
      } mr-3 mt-1 flex-shrink-0`}
    >
      {isNegative ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
    <span
      className={`text-sm ${isNegative ? "text-gray-700" : "text-gray-700"}`}
    >
      {children}
    </span>
  </li>
);

// Helper component for footer links
const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <li className="transition-transform hover:translate-x-1">
    <Link
      href={href}
      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center"
    >
      <span className="ml-2">›</span>
      {children}
    </Link>
  </li>
);

// Helper component for footer items with icons
const FooterItem = ({ icon, text }: { icon: string; text: string }) => (
  <li className="flex items-center transition-transform hover:translate-x-1">
    <span className="ml-2">{icon}</span>
    <span className="text-gray-300 hover:text-white transition-colors duration-300">
      {text}
    </span>
  </li>
);
