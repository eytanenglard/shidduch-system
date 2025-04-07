import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

const CTASection: React.FC = () => {
  return (
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
            הצטרפו היום למערכת Match Point המובילה והתקדמו צעד אחד קדימה במציאת
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
  );
};

export default CTASection;
