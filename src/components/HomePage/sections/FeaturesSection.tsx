import React from "react";
import FeatureCard from "../components/FeatureCard";
import { Shield, Users, Heart, MessageCircle } from "lucide-react";

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-white relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            למה
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 animate-gradient"
              style={{ backgroundSize: "200% 200%" }}
            >
              {" "}
              לבחור{" "}
            </span>
            במערכת שלנו?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="פרטיות מלאה"
            description="שמירה קפדנית על פרטיות המשתמשים ואבטחת מידע מתקדמת"
            color="blue"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="התאמה מדויקת"
            description="מערכת חכמה המתאימה בין מועמדים על בסיס ערכים ושאיפות משותפות"
            color="green"
          />
          <FeatureCard
            icon={<Heart className="w-8 h-8" />}
            title="ליווי אישי"
            description="צוות שדכנים מקצועי ומנוסה לאורך כל התהליך"
            color="orange"
          />
          <FeatureCard
            icon={<MessageCircle className="w-8 h-8" />}
            title="תקשורת בטוחה"
            description="פלטפורמה מאובטחת ליצירת קשר ראשוני בין המועמדים"
            color="pink"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
