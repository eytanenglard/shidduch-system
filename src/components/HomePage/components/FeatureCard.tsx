import React from "react";
import { Card, CardContent } from "@/components/ui/card";

// Type definitions
export interface FeatureCardProps {
  // --- The type was changed here to be more specific and solve the error ---
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  description: string;
  color: "cyan" | "green" | "orange" | "pink";
}

// Component for feature cards with improved hover effects
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  const colorClasses = {
    cyan: {
      gradient: "from-cyan-500/10 to-cyan-700/10",
      bg: "from-cyan-50 to-cyan-100",
      text: "text-cyan-600 group-hover:text-cyan-700",
      title: "group-hover:text-cyan-700",
      shadow: "shadow-cyan-200/50",
    },
    green: {
      gradient: "from-green-500/10 to-green-700/10",
      bg: "from-green-50 to-green-100",
      text: "text-green-600 group-hover:text-green-700",
      title: "group-hover:text-green-700",
      shadow: "shadow-green-200/50",
    },
    orange: {
      gradient: "from-orange-500/10 to-orange-700/10",
      bg: "from-orange-50 to-orange-100",
      text: "text-orange-600 group-hover:text-orange-700",
      title: "group-hover:text-orange-700",
      shadow: "shadow-orange-200/50",
    },
    pink: {
      gradient: "from-pink-500/10 to-pink-700/10",
      bg: "from-pink-50 to-pink-100",
      text: "text-pink-600 group-hover:text-pink-700",
      title: "group-hover:text-pink-700",
      shadow: "shadow-pink-200/50",
    },
  };

  return (
    <Card className="group relative overflow-hidden border-none shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-100 transition-opacity duration-500" />
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClasses[color].gradient} opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500`}
      />
      <CardContent className="relative p-8 backdrop-blur-sm">
        <div className="mb-6 flex justify-center transform transition-transform duration-500 group-hover:scale-110">
          <div
            className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color].bg} shadow-md group-hover:shadow-lg transition-all duration-500 ${colorClasses[color].shadow}`}
          >
            {React.cloneElement(icon, {
              className: `w-8 h-8 ${colorClasses[color].text} transition-colors duration-500`,
            })}
          </div>
        </div>
        <h3
          className={`text-xl font-bold mb-3 text-gray-800 ${colorClasses[color].title} transition-colors duration-300 text-center`}
        >
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-center">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;