import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  color: "cyan" | "green" | "orange" | "pink";
}

// Matchmaker Card Component
const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  color,
}) => {
  // Mapping to new Palette:
  const colorClasses = {
    cyan: { // Maps to Teal
      gradient: "from-teal-500/10 to-teal-700/10",
      bg: "from-teal-400 to-teal-500",
      border: "border-teal-100",
      shadow: "shadow-teal-200/50",
      text: "text-teal-700",
    },
    green: { // Maps to Emerald
      gradient: "from-emerald-500/10 to-emerald-700/10",
      bg: "from-emerald-400 to-emerald-500",
      border: "border-emerald-100",
      shadow: "shadow-emerald-200/50",
      text: "text-emerald-700",
    },
    orange: { // Maps to Orange/Amber
      gradient: "from-orange-500/10 to-amber-700/10",
      bg: "from-orange-400 to-amber-500",
      border: "border-orange-100",
      shadow: "shadow-orange-200/50",
      text: "text-orange-700",
    },
    pink: { // Maps to Rose
      gradient: "from-rose-500/10 to-rose-700/10",
      bg: "from-rose-400 to-rose-500",
      border: "border-rose-100",
      shadow: "shadow-rose-200/50",
      text: "text-rose-700",
    },
  };

  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-transparent shadow-sm hover:shadow-2xl transition-all duration-500 rounded-2xl h-full">
      {/* Hover Glow Effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClasses[color].gradient} opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-all duration-500`}
      />
      
      <CardContent className="relative p-8 flex flex-col items-center text-center z-10">
        {/* Avatar */}
        <div
          className={`w-24 h-24 rounded-2xl rotate-3 group-hover:rotate-0 bg-gradient-to-br ${colorClasses[color].bg} flex items-center justify-center text-white text-3xl font-bold mb-6 ${colorClasses[color].shadow} shadow-lg transform group-hover:scale-110 transition-all duration-500 ease-out`}
        >
          {name.charAt(0)}
        </div>
        
        <h3 className="text-2xl font-bold mb-2 text-gray-800">{name}</h3>
        <p className={`text-sm font-semibold uppercase tracking-wider mb-4 ${colorClasses[color].text}`}>
          {role}
        </p>
        
        {/* Divider */}
        <div className={`w-16 h-1 bg-gradient-to-r ${colorClasses[color].bg} rounded-full mb-5 opacity-80`}></div>
        
        <p className="text-gray-600 text-base leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default MatchmakerCard;