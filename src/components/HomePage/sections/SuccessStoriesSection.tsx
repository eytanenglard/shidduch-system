import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TestimonialCard from "../components/TestimonialCard";

const SuccessStoriesSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            סיפורי
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700 animate-gradient"
              style={{ backgroundSize: "200% 200%" }}
            >
              {" "}
              הצלחה{" "}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <TestimonialCard
            text="בזכות Match Point הכרתי את בן זוגי. ההתאמה הייתה מדויקת מעבר למה שציפיתי! הליווי המקצועי של דינה היה חם ורגיש לאורך כל התהליך."
            author="רחל, ירושלים"
            result="נשואה 8 חודשים"
            color="cyan"
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
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>לעוד סיפורי הצלחה</span>
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
