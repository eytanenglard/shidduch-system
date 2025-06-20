// src/components/HomePage/sections/FAQSection.tsx

import React from "react";
import FAQItem from "../components/FAQItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const FAQSection: React.FC = () => {
  return (
    <section id="onboarding-target-faq" className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50"></div>

      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            שאלות
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700">
              {" "}
              נפוצות{" "}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full mb-6" />
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

        {/* --- בלוק יצירת קשר חדש --- */}
        <div className="mt-12 text-center bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            לא מצאתם את התשובה?
          </h3>
          <p className="text-gray-600 mb-6">
            אנחנו כאן כדי לעזור. צרו איתנו קשר ונשמח לענות על כל שאלה.
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>ליצירת קשר</span>
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;