"use client";

import React from "react";
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
} from "lucide-react";

// Type definitions
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
}

interface TestimonialCardProps {
  text: string;
  author: string;
}

// Component for feature cards with improved hover effects
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <Card className="group relative overflow-hidden border-none shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500" />
    <CardContent className="relative p-8 backdrop-blur-sm">
      <div className="mb-6 flex justify-center transform transition-transform duration-500 group-hover:scale-110">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-md group-hover:shadow-lg transition-all duration-500">
          {React.cloneElement(icon as React.ReactElement, {
            className:
              "w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors duration-500",
          })}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-700 transition-colors duration-300 text-center">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-center">
        {description}
      </p>
    </CardContent>
  </Card>
);

// Modernized Step Component with enhanced visuals
const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
  isLast = false,
}) => (
  <div className="flex gap-6 items-start group relative">
    {/* Connecting line between steps */}
    {!isLast && (
      <div className="absolute top-12 bottom-0 right-6 w-0.5 bg-gradient-to-b from-blue-500 to-blue-200 rounded-full" />
    )}

    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 text-lg font-bold shadow-lg group-hover:scale-110 group-hover:shadow-blue-200 transition-all duration-500 z-10">
      {number}
    </div>
    <div className="flex-1 bg-white/80 backdrop-blur-sm p-5 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 border border-blue-50 group-hover:border-blue-100">
      <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
        {description}
      </p>
    </div>
  </div>
);

// Modernized Testimonial Card with enhanced aesthetics
const TestimonialCard: React.FC<TestimonialCardProps> = ({ text, author }) => (
  <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 h-full">
    {/* Improved decorative elements */}
    <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 opacity-50 rounded-full" />
    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 opacity-30 rounded-full" />

    {/* Content with enhanced styling */}
    <CardContent className="relative p-8 h-full flex flex-col backdrop-blur-sm">
      <div className="mb-4 text-4xl text-blue-400 font-serif opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        ❝
      </div>
      <p className="text-gray-700 leading-relaxed text-lg mb-6 flex-grow">
        {text}
      </p>
      <div className="flex items-center mt-auto">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300">
          {author[0]}
        </div>
        <p className="mr-4 font-semibold text-gray-800">{author}</p>
      </div>
    </CardContent>
  </Card>
);

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Section - Enhanced with more modern animations and effects */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Enhanced backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white" />

        {/* Animated background shapes */}
        <div
          className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-20 animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-20 animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-10 animate-pulse"
          style={{ animationDuration: "15s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="animate-fadeIn"
            style={{ "--animation-delay": "0.2s" } as React.CSSProperties}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 md:mb-8 leading-tight">
              בניית קשר
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                משמעותי{" "}
              </span>
              על בסיס ערכים משותפים
            </h1>
          </div>

          <div
            className="animate-fadeIn"
            style={{ "--animation-delay": "0.4s" } as React.CSSProperties}
          >
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
              אנו מחברים בין אנשים איכותיים המחפשים קשר רציני, תוך שמירה על ערכי
              המסורת והצניעות
            </p>
          </div>

          <div
            className="animate-fadeIn"
            style={{ "--animation-delay": "0.6s" } as React.CSSProperties}
          >
            {!session ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl w-full sm:w-auto"
                  >
                    הרשמה למערכת
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 hover:bg-gray-50 transition-colors duration-300 rounded-xl w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    התחברות
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/profile">
                <Button
                  size="lg"
                  className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                >
                  לאזור האישי
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>

          <div
            className="mt-16 max-w-md mx-auto animate-fadeIn"
            style={{ "--animation-delay": "0.8s" } as React.CSSProperties}
          >
            <Link href="/questionnaire">
              <FeatureCard
                icon={<ClipboardList className="w-8 h-8 text-blue-600" />}
                title="שאלון התאמה"
                description="מלא/י שאלון מקיף לקבלת הצעות שידוך מותאמות אישית"
              />
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
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                לבחור{" "}
              </span>
              במערכת שלנו?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-blue-600" />}
              title="פרטיות מלאה"
              description="שמירה קפדנית על פרטיות המשתמשים ואבטחת מידע מתקדמת"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-600" />}
              title="התאמה מדויקת"
              description="מערכת חכמה המתאימה בין מועמדים על בסיס ערכים ושאיפות משותפות"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8 text-blue-600" />}
              title="ליווי אישי"
              description="צוות שדכנים מקצועי ומנוסה לאורך כל התהליך"
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8 text-blue-600" />}
              title="תקשורת בטוחה"
              description="פלטפורמה מאובטחת ליצירת קשר ראשוני בין המועמדים"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced with connecting lines and better visuals */}
      <section className="py-16 md:py-20 px-4 bg-gray-50 relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50" />
        <div className="absolute left-0 top-1/4 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-60 h-60 bg-purple-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                איך זה{" "}
              </span>
              עובד?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="space-y-12 md:space-y-16 lg:space-y-20">
            <Step
              number="1"
              title="הרשמה למערכת"
              description="מילוי פרופיל אישי מפורט והגדרת העדפות לחיפוש"
            />

            <Step
              number="2"
              title="קבלת הצעות מותאמות"
              description="המערכת מציעה התאמות פוטנציאליות על בסיס הפרופיל וההעדפות"
            />
            <Step
              number="3"
              title="יצירת קשר ראשוני"
              description="תקשורת ראשונית דרך המערכת או באמצעות שדכן/ית"
            />
            <Step
              number="4"
              title="בניית קשר משמעותי"
              description="ליווי מקצועי לאורך התהליך עד ליצירת הקשר המיוחל"
              isLast={true}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section - With improved card design */}
      <section className="py-16 md:py-20 px-4 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              סיפורי
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient"
                style={{ backgroundSize: "200% 200%" }}
              >
                {" "}
                הצלחה{" "}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <TestimonialCard
              text="בזכות המערכת הכרתי את בן זוגי. ההתאמה הייתה מדויקת והליווי היה מקצועי ורגיש"
              author="רחל, ירושלים"
            />
            <TestimonialCard
              text="השדכנית שליוותה אותי הבינה בדיוק מה אני מחפש והצליחה להתאים לי את שידוך חיי"
              author="משה, בני ברק"
            />
            <TestimonialCard
              text="המערכת עזרה לי למצוא את האחת בצורה צנועה ומכבדת. ממליץ בחום!"
              author="דוד, פתח תקווה"
            />
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
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  ניווט מהיר
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4"></ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  מידע שימושי
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4"></ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  יצירת קשר
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30" />
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <li className="flex items-center transition-transform hover:translate-x-1">
                  <span className="ml-2">📞</span>
                  <span>03-1234567</span>
                </li>
                <li className="flex items-center transition-transform hover:translate-x-1">
                  <span className="ml-2">📱</span>
                  <span>054-1234567</span>
                </li>
                <li className="flex items-center transition-transform hover:translate-x-1">
                  <span className="ml-2">✉️</span>
                  <span>info@example.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-700/50">
            <div className="text-center">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors duration-300">
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
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group"
        >
          <MessageCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          <span className="group-hover:mr-1 transition-all">דברו איתנו</span>
        </Button>
      </div>
    </div>
  );
}
