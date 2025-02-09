import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WorldCompletionStats } from "../types/progress";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Users,
  User,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";
import { WorldId, QuestionDepth } from "../types/worlds";
import type { QuestionnaireProgress } from "../types/progress";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  currentWorld: WorldId;
  progress: QuestionnaireProgress;
  onWorldSelect?: (worldId: WorldId) => void;
  className?: string;
}

const worldIcons = {
  VALUES: Heart,
  RELATIONSHIP: Users,
  PERSONALITY: User,
  GOALS: Briefcase,
};

const depthLabels: Record<QuestionDepth, string> = {
  BASIC: "בסיסי",
  ADVANCED: "מתקדם",
  EXPERT: "מעמיק",
};

export default function ProgressTracker({
  currentWorld,
  progress,
  onWorldSelect,
  className = "",
}: ProgressTrackerProps) {
  // Function to determine if a world is accessible
  const isWorldAccessible = (worldId: WorldId) => {
    const worldProgress = progress.worldProgress[worldId];
    if (!worldProgress) return false;

    // Check if all required worlds are completed
    const requiredWorlds = progress.navigation.availableWorlds;
    return requiredWorlds.includes(worldId);
  };

  // Function to get world completion status
  const getWorldCompletion = (worldId: WorldId): WorldCompletionStats => {
    const worldProgress = progress.worldProgress[worldId];
    if (!worldProgress) {
      return {
        basic: 0,
        advanced: 0,
        expert: 0,
        total: 0,
      };
    }

    const { completion } = worldProgress;
    const total = Math.round(
      ((completion.basic.completedQuestions +
        completion.advanced.completedQuestions +
        completion.expert.completedQuestions) /
        (completion.basic.totalQuestions +
          completion.advanced.totalQuestions +
          completion.expert.totalQuestions)) *
        100
    );

    return {
      basic: completion.basic.completionRate * 100,
      advanced: completion.advanced.completionRate * 100,
      expert: completion.expert.completionRate * 100,
      total: total,
    };
  };

  // Function to get world status icon
  const WorldStatusIcon = ({ worldId }: { worldId: WorldId }) => {
    const completion = getWorldCompletion(worldId);

    if (completion.total === 100) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }

    if (!isWorldAccessible(worldId)) {
      return <Lock className="w-5 h-5 text-gray-400" />;
    }

    if (worldId === currentWorld) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    }

    const hasWarnings = progress.worldProgress[worldId]?.blockers.length > 0;
    if (hasWarnings) {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }

    return null;
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Object.entries(worldIcons).map(([worldId, Icon]) => {
        const isActive = currentWorld === worldId;
        const isAccessible = isWorldAccessible(worldId as WorldId);
        const completion = getWorldCompletion(worldId as WorldId);

        return (
          <Card
            key={worldId}
            className={cn(
              "transition-all duration-200",
              isActive ? "ring-2 ring-blue-500" : "",
              !isAccessible ? "opacity-50" : "",
              "hover:shadow-md"
            )}
          >
            <CardContent className="p-4">
              {/* World header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    isAccessible && onWorldSelect?.(worldId as WorldId)
                  }
                  disabled={!isAccessible}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-5 h-5" />
                  <span>{worldId}</span>
                </Button>
                <WorldStatusIcon worldId={worldId as WorldId} />
              </div>

              {/* Completion progress bars */}
              <div className="space-y-3">
                {Object.entries(depthLabels).map(([depth, label]) => (
                  <div key={depth} className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{label}</span>
                      <span>
                        {completion[
                          depth.toLowerCase() as keyof typeof completion
                        ].toFixed(0)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        completion[
                          depth.toLowerCase() as keyof typeof completion
                        ]
                      }
                      className={cn(
                        depth === "BASIC"
                          ? "bg-blue-100"
                          : depth === "ADVANCED"
                          ? "bg-purple-100"
                          : "bg-green-100"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Warning messages if any */}
              {progress.worldProgress[worldId as WorldId]?.blockers.map(
                (blocker, index) => (
                  <div
                    key={index}
                    className="mt-3 text-sm text-amber-600 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{blocker.reason}</span>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Overall progress */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">התקדמות כללית</span>
            <span className="text-sm text-gray-600">
              {progress.summary.completion.completionRate.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={progress.summary.completion.completionRate * 100}
            className="h-3"
          />
        </CardContent>
      </Card>
    </div>
  );
}
