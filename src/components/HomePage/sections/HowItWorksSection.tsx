import React from "react";
import Step from "../components/Step";

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700 animate-gradient"
              style={{ backgroundSize: "200% 200%" }}
            >
              איך זה{" "}
            </span>
            עובד?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full" />
        </div>

        <div className="space-y-12 md:space-y-16 lg:space-y-20">
          <Step
            number="1"
            title="הרשמה למערכת"
            description="מילוי פרופיל אישי מפורט והגדרת העדפות לחיפוש לאחר תהליך רישום פשוט וידידותי"
            color="cyan"
          />

          <Step
            number="2"
            title="שאלון ערכים מקיף"
            description="מיפוי אישיות, רקע משפחתי ומסורות, והשקפות עולם שיאפשרו למערכת להכיר אותך לעומק"
            color="green"
          />

          <Step
            number="3"
            title="שיפור פרופיל בעזרת AI"
            description="המערכת מציעה שאלות ממוקדות להרחבת הפרופיל ומספקת תובנות להדגשת האיכויות הייחודיות שלך"
            color="orange"
          />

          <Step
            number="4"
            title="סקירה אישית של שדכן"
            description="שדכן מקצועי סוקר את הפרופיל שלך באופן אישי, מוסיף הערות והמלצות, ומכין אסטרטגיית התאמה מותאמת"
            color="pink"
          />

          <Step
            number="5"
            title="ניתוח התאמה חכם"
            description="האלגוריתם מנתח עשרות אלפי פרופילים לפי 27 ממדי התאמה ומייצר רשימת מועמדים פוטנציאליים"
            color="cyan"
          />

          <Step
            number="6"
            title="התאמה אישית מהשדכן"
            description="השדכן בוחר את ההתאמות האופטימליות מתוך הצעות האלגוריתם, תוך שקילת גורמי התאמה מעודנים"
            color="green"
          />

          <Step
            number="7"
            title="הצעת התאמה וקבלת משוב"
            description="הצגת הצעת ההתאמה, איסוף משוב מפורט במקרה של דחייה, ולמידה מתמדת לשיפור התאמות עתידיות"
            color="orange"
          />

          <Step
            number="8"
            title="יצירת קשר ראשוני"
            description="תקשורת מאובטחת וליווי מהשדכן המקצועי לאורך כל שלבי ההיכרות הראשונית"
            color="pink"
          />

          <Step
            number="9"
            title="בניית קשר משמעותי"
            description="ליווי מקצועי לאורך התהליך עד ליצירת הקשר המיוחל והמשמעותי"
            isLast={true}
            color="cyan"
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
