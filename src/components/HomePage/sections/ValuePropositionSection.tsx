import React from "react";
import ComparisonItem from "../components/ComparisonItem";

const ValuePropositionSection: React.FC = () => {
  return (
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
  );
};

export default ValuePropositionSection;
