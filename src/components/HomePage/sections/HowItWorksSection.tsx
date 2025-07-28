// src/components/HomePage/sections/HowItWorksSection.tsx

import React from 'react';
import Step from '../components/Step';
// --- שינוי 1: החלף את הייבוא ---
import { DemoProfileCard } from '../components/DemoProfileCard';

const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="py-16 md:py-20 px-4 bg-white relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>
      {/* --- שינוי 2: הגדל את הרוחב המקסימלי כדי לתת מקום לשתי העמודות --- */}
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700 animate-gradient"
              style={{ backgroundSize: '200% 200%' }}
            >
              המסע שלך
            </span>{' '}
            מתחיל כאן
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full" />
        </div>

        {/* --- שינוי 3: פריסה חדשה של שתי עמודות --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12 items-start">
          {/* עמודה ימנית: הצעדים */}
          <div className="space-y-10">
            <Step
              number="1"
              title="הרשמה ומילוי פרופיל"
              description="מלאו פרופיל אישי מפורט ושאלון ערכים מקיף שיאפשרו למערכת להכיר אתכם לעומק."
              color="cyan"
            />
            <Step
              number="2"
              title="שיפור פרופיל וסקירת שדכן"
              description="ה-AI שלנו עוזר לכם להבליט את הייחודיות שלכם, ושדכן מקצועי סוקר ומוסיף תובנות אישיות."
              color="green"
            />
            <Step
              number="3"
              title="ניתוח התאמה חכם ואישי"
              description="האלגוריתם מנתח התאמות והשדכן בוחר את ההצעות עם הפוטנציאל הגבוה ביותר, תוך שילוב אינטואיציה וניסיון."
              color="orange"
            />
            <Step
              number="4"
              title="קבלת הצעה וליווי אישי"
              description="קבלו הצעות מנומקות ואיכותיות, וצאו לדייט עם ליווי ותמיכה מהשדכן לאורך כל הדרך."
              isLast={true}
              color="pink"
            />
          </div>

          {/* עמודה שמאלית: הדמו האינטראקטיבי */}
          <div className="lg:sticky lg:top-28">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              זו לא עוד הצעה. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                זו התחלה של סיפור.
              </span>
            </h3>
            <DemoProfileCard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;