import React from "react";

export interface StepProps {
  number: string;
  title: string;
  description: React.ReactNode; // שונה מ-string ל-React.ReactNode
  isLast?: boolean;
  color: "cyan" | "green" | "orange" | "pink";
}

// Modernized Step Component with enhanced visuals
const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
  isLast = false,
  color,
}) => {
  const colorClasses = {
    cyan: {
      gradient: "from-cyan-500 to-cyan-600",
      hover: "group-hover:text-cyan-600",
      border: "group-hover:border-cyan-100",
      shadow: "group-hover:shadow-cyan-100",
      line: "from-cyan-500 to-cyan-200",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      hover: "group-hover:text-green-600",
      border: "group-hover:border-green-100",
      shadow: "group-hover:shadow-green-100",
      line: "from-green-500 to-green-200",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      hover: "group-hover:text-orange-600",
      border: "group-hover:border-orange-100",
      shadow: "group-hover:shadow-orange-100",
      line: "from-orange-500 to-orange-200",
    },
    pink: {
      gradient: "from-pink-500 to-pink-600",
      hover: "group-hover:text-pink-600",
      border: "group-hover:border-pink-100",
      shadow: "group-hover:shadow-pink-100",
      line: "from-pink-500 to-pink-200",
    },
  };

  return (
    <div className="flex gap-6 items-start group relative">
      {/* Connecting line between steps */}
      {!isLast && (
        <div
          className={`absolute top-12 bottom-0 right-6 w-0.5 bg-gradient-to-b ${colorClasses[color].line} rounded-full`}
        />
      )}

      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color].gradient} text-white flex items-center justify-center flex-shrink-0 text-lg font-bold shadow-lg group-hover:scale-110 ${colorClasses[color].shadow} transition-all duration-500 z-10`}
      >
        {number}
      </div>
      <div
        className={`flex-1 bg-white/80 backdrop-blur-sm p-5 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 border border-gray-50 ${colorClasses[color].border}`}
      >
        <h3
          className={`text-xl font-bold mb-2 text-gray-800 ${colorClasses[color].hover} transition-colors duration-300`}
        >
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
          {description}
        </p>
      </div>
    </div>
  );
};

export default Step;