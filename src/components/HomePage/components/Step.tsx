// src/components/HomePage/components/Step.tsx
import React from "react";

export interface StepProps {
  number: string;
  title: string;
  description: React.ReactNode;
  isLast?: boolean;
  // Added "emerald" to the type definition to match the parent component's array
  color: "teal" | "amber" | "rose" | "orange" | "emerald";
}

// Modernized Step Component with enhanced visuals matching the Landing Page theme
const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
  isLast = false,
  color,
}) => {
  const colorClasses = {
    teal: {
      gradient: "from-teal-400 to-emerald-500",
      hover: "group-hover:text-teal-700",
      border: "group-hover:border-teal-200",
      shadow: "group-hover:shadow-teal-100",
      line: "from-teal-400 to-teal-200",
      bgBadge: "bg-teal-50",
    },
    amber: {
      gradient: "from-amber-400 to-orange-500",
      hover: "group-hover:text-amber-700",
      border: "group-hover:border-amber-200",
      shadow: "group-hover:shadow-amber-100",
      line: "from-amber-400 to-amber-200",
      bgBadge: "bg-amber-50",
    },
    rose: {
      gradient: "from-rose-400 to-pink-500",
      hover: "group-hover:text-rose-700",
      border: "group-hover:border-rose-200",
      shadow: "group-hover:shadow-rose-100",
      line: "from-rose-400 to-rose-200",
      bgBadge: "bg-rose-50",
    },
    orange: {
      gradient: "from-orange-400 to-red-500",
      hover: "group-hover:text-orange-700",
      border: "group-hover:border-orange-200",
      shadow: "group-hover:shadow-orange-100",
      line: "from-orange-400 to-orange-200",
      bgBadge: "bg-orange-50",
    },
    // Added emerald styling configuration
    emerald: {
      gradient: "from-emerald-400 to-green-500",
      hover: "group-hover:text-emerald-700",
      border: "group-hover:border-emerald-200",
      shadow: "group-hover:shadow-emerald-100",
      line: "from-emerald-400 to-emerald-200",
      bgBadge: "bg-emerald-50",
    },
  };

  const currentStyle = colorClasses[color];

  return (
    <div className="flex gap-6 items-start group relative">
      {/* Connecting line between steps */}
      {!isLast && (
        <div
          // RTL/LTR note: if direction is RTL, ensure 'right-6' is correct visually or use logical properties if available in tailwind config
          className={`absolute top-12 bottom-0 right-6 w-0.5 bg-gradient-to-b ${currentStyle.line} rounded-full opacity-40`}
        />
      )}

      {/* Number Circle */}
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStyle.gradient} text-white flex items-center justify-center flex-shrink-0 text-lg font-bold shadow-lg group-hover:scale-110 ${currentStyle.shadow} transition-all duration-500 z-10 relative`}
      >
        {number}
        {/* Glow effect behind the number */}
        <div className={`absolute inset-0 rounded-2xl blur opacity-40 bg-gradient-to-br ${currentStyle.gradient} -z-10`} />
      </div>

      {/* Content Card */}
      <div
        className={`flex-1 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm group-hover:shadow-lg transition-all duration-300 border border-white/60 ${currentStyle.border}`}
      >
        <h3
          className={`text-xl font-bold mb-3 text-gray-800 ${currentStyle.hover} transition-colors duration-300`}
        >
          {title}
        </h3>
        <div className="text-gray-600 leading-relaxed group-hover:text-gray-700">
          {description}
        </div>
      </div>
    </div>
  );
};

export default Step;