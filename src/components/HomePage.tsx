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
}

interface TestimonialCardProps {
  text: string;
  author: string;
}

// Component for feature cards
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <Card className="group relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardContent className="relative p-8">
      <div className="mb-6 flex justify-center">
        <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

// Modernized Step Component
const Step: React.FC<StepProps> = ({ number, title, description }) => (
  <div className="flex gap-6 items-start group">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 text-lg font-bold shadow-lg group-hover:scale-110 transition-transform">
      {number}
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

// Modernized Testimonial Card
const TestimonialCard: React.FC<TestimonialCardProps> = ({ text, author }) => (
  <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 opacity-50 rounded-full transform translate-x-16 -translate-y-16" />
    <CardContent className="relative p-8">
      <div className="mb-6 text-4xl text-blue-400 font-serif">❝</div>
      <p className="text-gray-700 leading-relaxed text-lg mb-6">{text}</p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
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
    <div className="min-h-screen">
      {/* Hero Section - Now with more modern design */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-20" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            בניית קשר
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              משמעותי{" "}
            </span>
            על בסיס ערכים משותפים
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            אנו מחברים בין אנשים איכותיים המחפשים קשר רציני, תוך שמירה על ערכי
            המסורת והצניעות
          </p>

          {!session ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                >
                  הרשמה למערכת
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-2 hover:bg-gray-50 transition-colors duration-300 rounded-xl"
                >
                  התחברות
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
              >
                לאזור האישי
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          )}
          <Link href="/components/questionnaire">
            <FeatureCard
              icon={<ClipboardList className="w-8 h-8 text-blue-600" />}
              title="שאלון התאמה"
              description="מלא/י שאלון מקיף לקבלת הצעות שידוך מותאמות אישית"
            />
          </Link>
        </div>
      </section>

      {/* Features Section - With modern cards */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              למה
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                לבחור{" "}
              </span>
              במערכת שלנו?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* How It Works Section - With modern steps */}
      <section className="py-20 px-4 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50" />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                איך זה{" "}
              </span>
              עובד?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="space-y-12">
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
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section - With modern cards */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              סיפורי
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                הצלחה{" "}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Footer - With modern design */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-bold text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                ניווט מהיר
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-blue-400 transition-colors"
                  >
                    אודות
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-blue-400 transition-colors"
                  >
                    צור קשר
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-blue-400 transition-colors"
                  >
                    שאלות נפוצות
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                מידע שימושי
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-blue-400 transition-colors"
                  >
                    מדיניות פרטיות
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-blue-400 transition-colors"
                  >
                    תנאי שימוש
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    className="hover:text-blue-400 transition-colors"
                  >
                    נגישות
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                יצירת קשר
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <span className="ml-2">📞</span>
                  <span>03-1234567</span>
                </li>
                <li className="flex items-center">
                  <span className="ml-2">📱</span>
                  <span>054-1234567</span>
                </li>
                <li className="flex items-center">
                  <span className="ml-2">✉️</span>
                  <span>info@example.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="text-center">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400">
                  מחברים לבבות בדרך הנכונה
                </span>
              </div>
              <p className="text-gray-400">© כל הזכויות שמורות 2024</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Contact Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <MessageCircle className="w-5 h-5 ml-2" />
          דברו איתנו
        </Button>
      </div>
    </div>
  );
}
