import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Save,
  LogOut,
  Settings,
  HelpCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { WorldId } from "../types/worlds";
import type { QuestionnaireProgress } from "../types/progress";

interface NavigationBarProps {
  currentWorld: WorldId;
  progress: QuestionnaireProgress;
  onSave?: (progress: QuestionnaireProgress) => Promise<void>;
  onExit?: () => void;
  className?: string;
}

export default function NavigationBar({
  currentWorld,
  progress,
  onSave,
  onExit,
  className = "",
}: NavigationBarProps) {
  const totalProgress = Math.round(
    (progress.summary.completion.completionRate || 0) * 100
  );
  const estimatedTimeRemaining = Math.round(
    progress.summary.timeTracking.estimatedTimeRemaining / 60
  );
  const hasWarnings = progress.summary.qualityMetrics.contradictions.length > 0;

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-white border-b z-50 ${className}`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left section - Progress & Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Progress value={totalProgress} className="w-32" />
            <span className="text-sm text-gray-600">{totalProgress}%</span>
          </div>

          {estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>כ-{estimatedTimeRemaining} דקות נותרו</span>
            </div>
          )}

          {hasWarnings && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">יש לך תשובות שדורשות תשומת לב</span>
            </div>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave?.(progress)}
            title="שמירה"
          >
            <Save className="w-4 h-4 ml-2" />
            שמירה
          </Button>

          <Button variant="ghost" size="sm" title="הגדרות">
            <Settings className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" title="עזרה">
            <HelpCircle className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExit?.()}
            className="mr-2"
          >
            <LogOut className="w-4 h-4 ml-2" />
            יציאה
          </Button>
        </div>
      </div>
    </div>
  );
}
