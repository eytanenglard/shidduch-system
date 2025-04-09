import React from "react";
import Image from "next/image";

// עדכון רכיב הכרטיס עם תצוגה מרכזית ומקצועית
interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  tags: string[];
  color: string;
  imageSrc?: string;
}

const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  tags,
  color,
  imageSrc,
}) => {
  const getGradientByColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-cyan-700";
      case "green":
        return "from-teal-500 to-teal-700";
      default:
        return "from-cyan-500 to-cyan-700";
    }
  };

  const getButtonColorByColor = () => {
    switch (color) {
      case "cyan":
        return "bg-cyan-600 hover:bg-cyan-700";
      case "green":
        return "bg-teal-600 hover:bg-teal-700";
      default:
        return "bg-cyan-600 hover:bg-cyan-700";
    }
  };

  const getTagColorByColor = () => {
    switch (color) {
      case "cyan":
        return "bg-cyan-100 text-cyan-800";
      case "green":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-cyan-100 text-cyan-800";
    }
  };

  return (
    <div className="rounded-xl shadow-lg overflow-hidden bg-white border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
      <div className="p-8 flex flex-col items-center">
        {/* תמונה מעוגלת */}
        <div className="w-48 h-48 mb-6 overflow-hidden rounded-full border-4 border-white shadow-md relative">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div
              className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${getGradientByColor()}`}
            >
              <span className="text-white text-6xl font-bold opacity-30">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* פרטי השדכן */}
        <h3 className="text-2xl font-bold text-gray-800 mb-1 text-center">
          {name}
        </h3>
        <p
          className={`text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r ${getGradientByColor()} text-center`}
        >
          {role}
        </p>

        {/* תגיות התמחות */}
        <div className="flex flex-wrap gap-2 justify-center mb-5">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`text-sm px-3 py-1 rounded-full ${getTagColorByColor()}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* תיאור */}
        <p className="text-gray-600 mb-6 text-center leading-relaxed">
          {description}
        </p>

        {/* כפתור */}
        <button
          className={`px-8 py-3 rounded-lg text-white ${getButtonColorByColor()} transition-colors duration-300 font-medium`}
        >
          קבע פגישה
        </button>
      </div>
    </div>
  );
};

const MatchmakerTeamSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* רקע דקורטיבי */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* כותרת מרכזית */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            הכירו את
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
              {" "}
              המייסדים{" "}
            </span>
            שלנו
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            המייסדים שלנו מביאים ניסיון עשיר וגישה ייחודית לעולם השידוכים,
            בשילוב טכנולוגיה מתקדמת וראייה אישית
          </p>
        </div>

        {/* כרטיסי השדכנים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 max-w-5xl mx-auto">
          <MatchmakerCard
            name="דינה אנגלרד"
            role="שדכנית ראשית"
            description="עם ניסיון של 8 שנים בתחום השידוכים, דינה מביאה כישורים בינאישיים יוצאי דופן והבנה עמוקה של צרכי המועמדים. הגישה האישית והאמפתית שלה יצרה עשרות זוגות מאושרים והיא מלווה כל מועמד בדרך מותאמת אישית."
            color="cyan"
            tags={["מומחית התאמה", "ליווי אישי", "2+ שנות ניסיון"]}
            imageSrc="/images/team/eitan.jpg"
          />
          <MatchmakerCard
            name="איתן אנגלרד"
            role="מייסד ומנכ״ל"
            description="יזם טכנולוגי עם התמחות בשידוכים. איתן פיתח את פלטפורמת התוכנה הייחודית שלנו ומשלב ידע טכנולוגי עם הבנה עמוקה של פסיכולוגיה חברתית. הגישה החדשנית שלו יצרה את השיטה הייחודית שמאפיינת את המשרד שלנו."
            color="green"
            tags={["חדשנות טכנולוגית", "אלגוריתם התאמה", "יזמות"]}
            imageSrc="/images/team/eitan.jpg"
          />
        </div>
      </div>
    </section>
  );
};

export default MatchmakerTeamSection;
