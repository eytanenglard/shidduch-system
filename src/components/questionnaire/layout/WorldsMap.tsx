import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scroll,
  Heart,
  Users,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { WorldId } from "../types/types";
import { cn } from "@/lib/utils";

interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
}

const worldsConfig = {
  RELATIONSHIP: {
    icon: Users,
    color: "bg-purple-100 hover:bg-purple-200",
    borderColor: "border-purple-300",
    textColor: "text-purple-700",
    label: "זוגיות",
    description: "תפיסת הזוגיות והציפיות ממערכת היחסים",
  },
  VALUES: {
    icon: Heart,
    color: "bg-pink-100 hover:bg-pink-200",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    label: "ערכים ואמונות",
    description: "עולם הערכים והאמונות שלך",
  },
  PERSONALITY: {
    icon: User,
    color: "bg-blue-100 hover:bg-blue-200",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    label: "אישיות",
    description: "המאפיינים האישיותיים שלך",
  },
  PARTNER: {
    icon: Heart,
    color: "bg-pink-100 hover:bg-pink-200",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    label: "פרטנר",
    description: "מה חשוב לך בבן/בת הזוג",
  },
  RELIGION: {
    icon: Scroll,
    color: "bg-purple-100 hover:bg-purple-200",
    borderColor: "border-purple-300",
    textColor: "text-purple-700",
    label: "דת ומסורת",
    description: "חיבור לדת, אמונה ומסורת ישראל",
  },
} as const;

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = "",
}: WorldsMapProps) {
  const [hoveredWorld, setHoveredWorld] = useState<WorldId | null>(null);

  const isWorldAccessible = (worldId: WorldId): boolean => {
    const targetIndex = WORLD_ORDER.indexOf(worldId);

    // The first world is always accessible
    if (targetIndex === 0) return true;

    // Can access if the previous world is completed
    const previousWorld = WORLD_ORDER[targetIndex - 1];
    return completedWorlds.includes(previousWorld);
  };

  return (
    <div className={cn("p-4 grid grid-cols-2 gap-4", className)}>
      {WORLD_ORDER.map((worldId) => {
        const config = worldsConfig[worldId];
        const Icon = config.icon;
        const isActive = currentWorld === worldId;
        const isCompleted = completedWorlds.includes(worldId);
        const isAccessible = isWorldAccessible(worldId);
        const isHovered = hoveredWorld === worldId;

        return (
          <motion.div
            key={worldId}
            initial={{ scale: 1 }}
            animate={{
              scale: isHovered ? 1.05 : 1,
              opacity: isAccessible ? 1 : 0.7,
            }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className={cn(
                "transition-all duration-200 cursor-pointer",
                config.color,
                isActive && `ring-2 ring-${config.borderColor}`,
                "hover:shadow-lg"
              )}
              onClick={() => isAccessible && onWorldChange?.(worldId)}
              onMouseEnter={() => setHoveredWorld(worldId)}
              onMouseLeave={() => setHoveredWorld(null)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={cn("flex items-center gap-2", config.textColor)}
                  >
                    <Icon className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">{config.label}</h3>
                      {isHovered && (
                        <p className="text-sm text-gray-600">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Icon */}
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : !isAccessible ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : isActive ? (
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {isHovered && isAccessible && !isCompleted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-600 pt-2"
                  >
                    {isActive ? "ממשיך/ה בעולם זה" : "לחץ/י למעבר לעולם זה"}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
