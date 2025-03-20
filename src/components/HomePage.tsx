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
  ArrowRight,
  Star,
  Activity,
  Sparkles,
  Zap,
  CheckCircle,
  Calendar,
  Award,
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
  color: "blue" | "green" | "orange" | "pink";
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
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient1: "from-blue-100 to-blue-50",
      gradient2: "from-blue-50 to-blue-100",
      avatar: "from-blue-500 to-blue-600",
    },
    green: {
      gradient1: "from-green-100 to-green-50",
      gradient2: "from-green-50 to-green-100",
      avatar: "from-green-500 to-green-600",
    },
    orange: {
      gradient1: "from-orange-100 to-orange-50",
      gradient2: "from-orange-50 to-orange-100",
      avatar: "from-orange-500 to-orange-600",
    },
    pink: {
      gradient1: "from-pink-100 to-pink-50",
      gradient2: "from-pink-50 to-pink-100",
      avatar: "from-pink-500 to-pink-600",
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
        <div className="flex items-center mt-auto">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses[color].avatar} flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300`}
          >
            {author[0]}
          </div>
          <p className="mr-4 font-semibold text-gray-800">{author}</p>
        </div>
      </CardContent>
    </Card>
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
              אנו מחברים בין אנשים איכותיים המחפשים קשר רציני, תוך שמירה על ערכי
              המסורת והצניעות
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

      {/* How It Works Section - Enhanced with connecting lines and better visuals */}
      <section className="py-16 md:py-20 px-4 bg-gray-50 relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50" />
        <div className="absolute left-0 top-1/4 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-60 h-60 bg-blue-200/20 rounded-full blur-3xl"></div>

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
              description="מילוי פרופיל אישי מפורט והגדרת העדפות לחיפוש"
              color="blue"
            />

            <Step
              number="2"
              title="קבלת הצעות מותאמות"
              description="המערכת מציעה התאמות פוטנציאליות על בסיס הפרופיל וההעדפות"
              color="green"
            />
            <Step
              number="3"
              title="יצירת קשר ראשוני"
              description="תקשורת ראשונית דרך המערכת או באמצעות שדכן/ית"
              color="orange"
            />
            <Step
              number="4"
              title="בניית קשר משמעותי"
              description="ליווי מקצועי לאורך התהליך עד ליצירת הקשר המיוחל"
              isLast={true}
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section - With improved card design */}
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
              text="בזכות המערכת הכרתי את בן זוגי. ההתאמה הייתה מדויקת והליווי היה מקצועי ורגיש"
              author="רחל, ירושלים"
              color="blue"
            />
            <TestimonialCard
              text="השדכנית שליוותה אותי הבינה בדיוק מה אני מחפש והצליחה להתאים לי את שידוך חיי"
              author="משה, בני ברק"
              color="orange"
            />
            <TestimonialCard
              text="המערכת עזרה לי למצוא את האחת בצורה צנועה ומכבדת. ממליץ בחום!"
              author="דוד, פתח תקווה"
              color="green"
            />
          </div>
        </div>
      </section>

      {/* Stats Section - New section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')]"></div>

        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              הנתונים מדברים בעד עצמם
            </h2>
            <div className="w-24 h-1 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">950+</div>
              <div className="text-white/80">זוגות מאושרים</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">12K+</div>
              <div className="text-white/80">משתמשים רשומים</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">96%</div>
              <div className="text-white/80">שביעות רצון</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">8</div>
              <div className="text-white/80">שנות ניסיון</div>
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
              הצטרפו היום למערכת השידוכים המובילה והתקדמו צעד אחד קדימה במציאת
              הזיווג המושלם עבורכם
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
                <FooterItem icon="📞" text="03-1234567" />
                <FooterItem icon="📱" text="054-1234567" />
                <FooterItem icon="✉️" text="info@example.com" />
                <FooterItem icon="📍" text="רחוב השקד 12, תל אביב" />
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
              <p className="text-gray-400">© כל הזכויות שמורות 2024</p>
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
