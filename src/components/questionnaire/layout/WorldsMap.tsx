import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scroll,
  Heart,
  Users,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Star,
  Play,
  UserCheck,
} from "lucide-react";
import type { WorldId } from "../types/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
}

const worldsConfig = {
  RELATIONSHIP: {
    icon: Users,
    color: "bg-purple-100",
    activeColor: "bg-purple-600",
    hoverColor: "hover:bg-purple-200",
    borderColor: "border-purple-300",
    textColor: "text-purple-700",
    activeTextColor: "text-white",
    label: "זוגיות",
    description: "תפיסת הזוגיות והציפיות ממערכת היחסים",
    order: 3,
  },
  VALUES: {
    icon: Heart,
    color: "bg-pink-100",
    activeColor: "bg-pink-600",
    hoverColor: "hover:bg-pink-200",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    activeTextColor: "text-white",
    label: "ערכים ואמונות",
    description: "עולם הערכים והאמונות שלך",
    order: 2,
  },
  PERSONALITY: {
    icon: User,
    color: "bg-blue-100",
    activeColor: "bg-blue-600",
    hoverColor: "hover:bg-blue-200",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    activeTextColor: "text-white",
    label: "אישיות",
    description: "המאפיינים האישיותיים שלך",
    order: 1,
  },
  PARTNER: {
    icon: UserCheck,
    color: "bg-pink-100",
    activeColor: "bg-pink-600",
    hoverColor: "hover:bg-pink-200",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    activeTextColor: "text-white",
    label: "פרטנר",
    description: "מה חשוב לך בבן/בת הזוג",
    order: 4,
  },
  RELIGION: {
    icon: Scroll,
    color: "bg-indigo-100",
    activeColor: "bg-indigo-600",
    hoverColor: "hover:bg-indigo-200",
    borderColor: "border-indigo-300",
    textColor: "text-indigo-700",
    activeTextColor: "text-white",
    label: "דת ומסורת",
    description: "חיבור לדת, אמונה ומסורת ישראל",
    order: 5,
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
  const [expanded, setExpanded] = useState<WorldId | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  //כרגע כל העולמות מוגדרים כנגישים
  const isWorldAccessible = (): boolean => {
    return true; // Allow access to all worlds
  };

  // נוסיף תיאור מצב התקדמות כללי
  const completionPercent =
    completedWorlds.length > 0
      ? Math.round((completedWorlds.length / WORLD_ORDER.length) * 100)
      : 0;

  const nextRecommendedWorld = WORLD_ORDER.find(
    (world) => !completedWorlds.includes(world)
  );

  // אנימציה עבור תנועת הכרטיסים
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  // אנימציה עבור החלפת תוכן
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="text-center sm:text-right mb-4 sm:mb-0">
          <h3 className="font-medium text-lg">מפת העולמות</h3>
          <div className="text-sm text-gray-500 mt-1">
            השלמת {completedWorlds.length} מתוך {WORLD_ORDER.length} עולמות
          </div>

          <div className="mt-2 w-full sm:max-w-[200px]">
            <div className="relative">
              <Progress value={completionPercent} className="h-2 bg-gray-100" />
              <div
                className={cn(
                  "absolute inset-0 h-2 rounded-full transition-all",
                  completionPercent === 100
                    ? "bg-green-500"
                    : completionPercent > 50
                    ? "bg-blue-500"
                    : "bg-blue-400"
                )}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {nextRecommendedWorld && nextRecommendedWorld !== currentWorld && (
          <Button
            size="sm"
            onClick={() => onWorldChange?.(nextRecommendedWorld)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
          >
            <Play className="h-3 w-3 ml-1" />
            עבור לעולם המומלץ הבא
          </Button>
        )}
      </div>

      {/* Progress Visual Tracker */}
      <div className="flex items-center justify-center mb-6 overflow-x-auto py-2">
        <div className="flex items-center max-w-lg w-full relative">
          {/* Connection Lines */}
          <div className="absolute h-1 bg-gray-200 top-1/2 left-5 right-5 -translate-y-1/2 z-0"></div>

          {/* World Circles */}
          {WORLD_ORDER.map((worldId, index) => {
            const config = worldsConfig[worldId];
            const isActive = currentWorld === worldId;
            const isCompleted = completedWorlds.includes(worldId);
            const isAccessible = isWorldAccessible();

            // לקבוע כמה מלא המעגל לפי התקדמות
            const progressClass = isCompleted
              ? "bg-green-500"
              : isActive
              ? config.activeColor
              : "bg-gray-200";

            // לקבוע איזה תוכן להציג במעגל (איקון או מספר)
            const circleContent = isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : isAccessible ? (
              <span className="text-sm font-medium">{index + 1}</span>
            ) : (
              <Lock className="h-3.5 w-3.5 text-gray-400" />
            );

            return (
              <TooltipProvider key={worldId} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="relative z-10 flex-1 flex justify-center"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.button
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          "border-2 border-white shadow-sm transition-all",
                          isActive
                            ? "ring-2 ring-offset-2 ring-blue-500 animate-pulse"
                            : "",
                          progressClass,
                          isActive || isCompleted
                            ? "text-white"
                            : "text-gray-600",
                          !isAccessible
                            ? "cursor-not-allowed opacity-70"
                            : "hover:shadow-md"
                        )}
                        onClick={() => isAccessible && onWorldChange?.(worldId)}
                        disabled={!isAccessible}
                      >
                        {circleContent}
                      </motion.button>
                      <div className="absolute -bottom-6 text-xs font-medium whitespace-nowrap">
                        {config.label}
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-2 max-w-[200px]">
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs">{config.description}</p>
                    {isCompleted && (
                      <p className="text-xs text-green-600 mt-1">✓ הושלם</p>
                    )}
                    {isActive && (
                      <p className="text-xs text-blue-600 mt-1">◉ פעיל כעת</p>
                    )}
                    {!isAccessible && (
                      <p className="text-xs text-gray-500 mt-1">
                        השלם את העולמות הקודמים
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* World Cards */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          className
        )}
      >
        {WORLD_ORDER.map((worldId) => {
          const config = worldsConfig[worldId];
          const Icon = config.icon;
          const isActive = currentWorld === worldId;
          const isCompleted = completedWorlds.includes(worldId);
          const isAccessible = isWorldAccessible();
          const isHovered = hoveredWorld === worldId;
          const isExpanded = expanded === worldId;

          // מעבר על הסטטוס של העולם לקביעת הסגנון
          let statusIcon: React.ReactNode = null;
          let statusText = "";
          let statusClass = "";

          if (isCompleted) {
            statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
            statusText = "הושלם";
            statusClass = "text-green-600";
          } else if (!isAccessible) {
            statusIcon = <Lock className="w-5 h-5 text-gray-400" />;
            statusText = "נעול";
            statusClass = "text-gray-400";
          } else if (isActive) {
            statusIcon = <Play className="w-5 h-5 text-blue-500" />;
            statusText = "פעיל כעת";
            statusClass = "text-blue-600";
          } else {
            statusIcon = <Info className="w-5 h-5 text-blue-400" />;
            statusText = "זמין";
            statusClass = "text-blue-400";
          }

          return (
            <motion.div
              key={worldId}
              initial="hidden"
              animate="visible"
              whileHover={isAccessible ? "hover" : ""}
              whileTap={isAccessible ? "tap" : ""}
              variants={cardVariants}
              onClick={() => {
                if (isExpanded) {
                  setExpanded(null);
                  onWorldChange?.(worldId);
                } else {
                  setExpanded(worldId);
                }
              }}
            >
              <Card
                className={cn(
                  "transition-all duration-200 overflow-hidden h-full",
                  isActive
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "hover:shadow-md",
                  !isAccessible && "cursor-not-allowed opacity-90"
                )}
                onMouseEnter={() => setHoveredWorld(worldId)}
                onMouseLeave={() => setHoveredWorld(null)}
              >
                <div
                  className={cn(
                    "h-2",
                    isActive
                      ? config.activeColor
                      : isCompleted
                      ? "bg-green-500"
                      : "bg-gray-200"
                  )}
                ></div>

                <CardContent
                  className={cn("p-4", isExpanded ? "pb-8" : "pb-4")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        isActive ? config.activeColor : config.color
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isActive ? config.activeTextColor : config.textColor
                        )}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium flex items-center">
                        {config.label}
                        {isActive && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            פעיל
                          </span>
                        )}
                      </h3>

                      <AnimatePresence mode="wait">
                        {(isHovered ||
                          isExpanded ||
                          (isMobile && isActive)) && (
                          <motion.p
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={contentVariants}
                            className="text-xs text-gray-500 mt-1"
                          >
                            {config.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Status Icon */}
                    <div className="flex flex-col items-center ml-1">
                      {statusIcon}
                      <span className={cn("text-xs mt-1", statusClass)}>
                        {isMobile ? "" : statusText}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <p className="text-sm text-gray-600 mb-3">
                          {config.description}
                        </p>

                        <Button
                          className={cn(
                            "w-full",
                            isCompleted
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onWorldChange?.(worldId);
                          }}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              ערוך תשובות
                            </>
                          ) : isActive ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              המשך בעולם זה
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              התחל עולם זה
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isActive && !isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t text-xs text-gray-600 flex items-center"
                    >
                      <Star className="h-3 w-3 text-amber-500 mr-1" />
                      אתה נמצא כעת בעולם זה
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
