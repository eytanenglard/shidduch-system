import React from "react";
import MatchmakerCard from "../components/MatchmakerCard";

const MatchmakerTeamSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-70"></div>
      <div className="absolute top-0 left-0 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            הכירו את
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              {" "}
              צוות השדכנים{" "}
            </span>
            שלנו
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            צוות המומחים שלנו מביא עשרות שנות ניסיון וידע עמוק בליווי זוגות
            לקראת חיים משותפים
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <MatchmakerCard
            name="דינה אנגלרד"
            role="שדכנית ראשית"
            description="עם נסיון של 8 שנים בתחום השידוכים וכישורים בינאישיים יוצאי דופן. מתמחה בהבנת הצרכים העמוקים של המועמדים."
            color="blue"
          />
          <MatchmakerCard
            name="איתן אנגלרד"
            role="מייסד ומנכ״ל"
            description="יזם טכנולוגי עם התמחות בשידוכים. פיתח את פלטפורמת התוכנה הייחודית שלנו ואחראי באופן אישי ל-2 שידוכים מוצלחים."
            color="green"
          />
          <MatchmakerCard
            name="רחל לוי"
            role="שדכנית בכירה"
            description="מומחית בהתאמת זוגות בקהילה הדתית-לאומית, עם הבנה עמוקה של ערכי המסורת ויכולת מוכחת ביצירת התאמות מוצלחות."
            color="orange"
          />
          <MatchmakerCard
            name="דוד כהן"
            role="יועץ זוגיות"
            description="בעל הכשרה בייעוץ זוגי ומומחה בליווי זוגות בשלבים הראשונים של הקשר. מסייע ביצירת יסודות איתנים לקשר ארוך טווח."
            color="pink"
          />
        </div>
      </div>
    </section>
  );
};

export default MatchmakerTeamSection;
