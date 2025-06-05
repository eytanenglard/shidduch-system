import React from "react";
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

        {/* --- שינוי כאן: הגריד הותאם ל-2 סיפורים ונראה טוב יותר --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <TestimonialCard
            text="תמיד חלמתי על שותף לחיים עם שאיפות ערכיות דומות – להקים בית של חסד, ציונות ותורה. Match Point חיברו אותי לאדם שחולם בדיוק את אותו החלום. זה חיבור של נשמה ומטרה."
            author="שרה, ירושלים"
            result="בדרך לחתונה"
            color="green"
          />
          <TestimonialCard
            text="הקסם של Match Point הוא ביכולת לראות מעבר לפרטים היבשים. איתן והמערכת זיהו את החיבור העמוק בערכי המשפחה ובווייב הכללי שלנו. זו התאמה שמרגישה כמו בית מהרגע הראשון."
            author="מרים, ירוחם"
            result="מאורסת"
            color="orange"
          />
        </div>

        <div className="mt-12 text-center">
          {/* 
            --- התייחסות לשאלתך על הכפתור ---
            המלצה: מכיוון שכרגע יש רק שני סיפורי הצלחה, הייתי ממליץ להסיר זמנית את הכפתור "לעוד סיפורי הצלחה".
            כפתור שמוביל לעמוד שמכיל רק את אותם שני סיפורים עלול להרגיש מאכזב למשתמש.
            כאשר יהיו לך 4-5 סיפורים, תוכל ליצור עמוד ייעודי ולהחזיר את הכפתור.
            כרגע, השארתי אותו כאן כהערה כדי שתוכל להפעיל אותו בקלות בעתיד.
          */}
          {/* 
          <Link href="/success-stories">
            <Button
              variant="outline"
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>לעוד סיפורי הצלחה</span>
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          */}
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;