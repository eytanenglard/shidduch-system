
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

// Type definitions
export interface FeatureCardProps {
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  description: string;
  // שומרים על שמות המפתחות לתאימות, אך העיצוב בפועל ישתנה ל-Teal, Emerald, Orange, Rose
  color: "cyan" | "green" | "orange" | "pink";
}

// Component for feature cards with improved hover effects and new color palette
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  const colorClasses = {
    // Cyan mapped to Teal (Primary Brand Color)
    cyan: {
      gradient: "from-teal-500/20 to-teal-700/20",
      bg: "from-teal-50 to-teal-100",
      text: "text-teal-600 group-hover:text-teal-700",
      title: "group-hover:text-teal-700",
      shadow: "shadow-teal-500/25",
      border: "border-teal-100",
    },
    // Green mapped to Emerald (Fresh look)
    green: {
      gradient: "from-emerald-500/20 to-emerald-700/20",
      bg: "from-emerald-50 to-emerald-100",
      text: "text-emerald-600 group-hover:text-emerald-700",
      title: "group-hover:text-emerald-700",
      shadow: "shadow-emerald-500/25",
      border: "border-emerald-100",
    },
    // Orange mapped to Orange/Amber (Warmth)
    orange: {
      gradient: "from-orange-500/20 to-amber-600/20",
      bg: "from-orange-50 to-amber-50",
      text: "text-orange-600 group-hover:text-orange-700",
      title: "group-hover:text-orange-700",
      shadow: "shadow-orange-500/25",
      border: "border-orange-100",
    },
    // Pink mapped to Rose (Matches Hero section accent)
    pink: {
      gradient: "from-rose-500/20 to-red-600/20",
      bg: "from-rose-50 to-red-50",
      text: "text-rose-600 group-hover:text-rose-700",
      title: "group-hover:text-rose-700",
      shadow: "shadow-rose-500/25",
      border: "border-rose-100",
    },
  };

  const currentStyle = colorClasses[color];

  return (
    <Card 
      className={`group relative overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border ${currentStyle.border} bg-white/80 backdrop-blur-sm`}
    >
      {/* רקע בסיס */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-100 transition-opacity duration-500" />
      
      {/* רקע בריחוף - גלוס צבעוני */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${currentStyle.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`}
      />
      
      <CardContent className="relative p-8">
        <div className="mb-6 flex justify-center transform transition-transform duration-500 group-hover:scale-110">
          <div
            className={`p-4 rounded-2xl bg-gradient-to-br ${currentStyle.bg} shadow-md group-hover:shadow-lg transition-all duration-500 ${currentStyle.shadow} ring-1 ring-white/60`}
          >
            {React.cloneElement(icon, {
              className: `w-8 h-8 ${currentStyle.text} transition-colors duration-500`,
            })}
          </div>
        </div>
        <h3
          className={`text-xl font-bold mb-3 text-gray-800 ${currentStyle.title} transition-colors duration-300 text-center`}
        >
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300 text-center">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;