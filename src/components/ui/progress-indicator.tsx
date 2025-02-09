import React from "react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  className = "" 
}: ProgressIndicatorProps) {
  const percentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1 text-sm text-gray-500">
        <span>התקדמות</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}