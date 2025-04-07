import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  color: "blue" | "green" | "orange" | "pink";
}

// Matchmaker Card Component
const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  color,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500/10 to-blue-700/10",
      bg: "from-blue-100 to-blue-200",
      border: "border-blue-100",
      shadow: "shadow-blue-100/50",
    },
    green: {
      gradient: "from-green-500/10 to-green-700/10",
      bg: "from-green-100 to-green-200",
      border: "border-green-100",
      shadow: "shadow-green-100/50",
    },
    orange: {
      gradient: "from-orange-500/10 to-orange-700/10",
      bg: "from-orange-100 to-orange-200",
      border: "border-orange-100",
      shadow: "shadow-orange-100/50",
    },
    pink: {
      gradient: "from-pink-500/10 to-pink-700/10",
      bg: "from-pink-100 to-pink-200",
      border: "border-pink-100",
      shadow: "shadow-pink-100/50",
    },
  };

  return (
    <Card className="group relative overflow-hidden border border-gray-100 hover:border-transparent shadow-sm hover:shadow-xl transition-all duration-500">
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClasses[color].gradient} opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500`}
      />
      <CardContent className="relative p-6 flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${colorClasses[color].bg} flex items-center justify-center text-white text-2xl font-bold mb-4 ${colorClasses[color].shadow} group-hover:scale-110 transition-all duration-300`}
        >
          {name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold mb-1 text-gray-800">{name}</h3>
        <p className="text-sm text-gray-500 mb-3">{role}</p>
        <div className={`w-12 h-0.5 ${colorClasses[color].border} mb-3`}></div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

export default MatchmakerCard;
