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
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  variant = "default",
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-900/20";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20";
      case "destructive":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-card";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow p-4",
        getVariantStyles(),
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-xl font-semibold mt-1">{value}</h3>

          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
