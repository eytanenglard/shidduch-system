// src/components/ui/timeline.tsx
import * as React from "react";
import { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  title: string;
  description?: string;
  date: Date;
  icon: LucideIcon;
  status?: "default" | "success" | "warning" | "error";
}

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
}

const statusStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-green-100 text-green-600",
  warning: "bg-yellow-100 text-yellow-600",
  error: "bg-red-100 text-red-600",
};

export function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <div className={cn("relative space-y-8", className)} {...props}>
      {items.map((item, index) => (
        <div key={index} className="flex gap-4 items-start">
          {/* Icon Container */}
          <div className="relative">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                statusStyles[item.status || "default"]
              )}
            >
              {React.createElement(item.icon, { className: "w-4 h-4" })}
            </div>
            {index !== items.length - 1 && (
              <div className="absolute top-8 left-4 w-[2px] h-16 bg-gray-200" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{item.title}</h4>
              <time className="text-sm text-gray-500">
                {formatDistanceToNow(item.date, {
                  addSuffix: true,
                  locale: he,
                })}
              </time>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
