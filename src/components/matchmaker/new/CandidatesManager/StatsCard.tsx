"use client";

import React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  bgGradient?: string;
  iconColor?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  variant = "default",
  bgGradient,
  iconColor = "text-primary",
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-emerald-200";
      case "warning":
        return "border-amber-200";
      case "destructive":
        return "border-red-200";
      default:
        return "border-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 p-4 overflow-hidden",
        bgGradient ? `bg-gradient-to-br ${bgGradient}` : "bg-card",
        getVariantStyles(),
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="mr-4 flex-shrink-0">
          <div className={`p-2.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        </div>

        <div className="flex-1 text-right">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <h3 className="text-xl font-bold">{value}</h3>

          {trend && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <span
                className={cn(
                  "text-sm font-medium flex items-center gap-0.5",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : "-"}{trend.value}%
                <span className={`${trend.isPositive ? "rotate-0" : "rotate-180"} transition-transform`}>
                  ↑
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Animated background pattern for more visual appeal */}
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="40" fill="currentColor" />
        </svg>
      </div>
    </Card>
  );
};

export default StatsCard;