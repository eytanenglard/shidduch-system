import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock } from "lucide-react";

const PrivacyAssuranceSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white relative overflow-hidden">
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
                  מדיניות אפס-שיתוף - המידע שלך לעולם לא נמכר או משותף עם צדדים
                  שלישיים
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
                  &quot;אנו מתחייבים לשמור על הפרטיות והכבוד של כל משתמש במערכת
                  שלנו, תוך יצירת סביבה בטוחה ומכבדת למציאת הזיווג המושלם&quot;
                </p>

                <div className="text-center">
                  <Link href="/privacy">
                    <Button
                      variant="outline"
                      className="border-2 border-white/50 bg-white text-cyan-600 hover:bg-white/90 transition-all duration-300 rounded-xl"
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
  );
};

export default PrivacyAssuranceSection;
