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
  UserCheck, // Added UserCheck icon
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
import { Badge } from "@/components/ui/badge"; // Added Badge import

interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
}

// Updated config with UserCheck for Partner
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
    icon: UserCheck, // Changed icon
    color: "bg-pink-100", // Adjusted color to match Values for example, change if needed
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

// Define the keys of worldsConfig as a specific type
type WorldConfigKey = keyof typeof worldsConfig;

// Define the order using the specific type
const WORLD_ORDER: WorldConfigKey[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

// Define Badge variants (add to your theme or global CSS if needed)
// Assuming your Badge component accepts these variant names as strings
const badgeVariants = {
  default: "border-transparent bg-blue-100 text-blue-800",
  success: "border-transparent bg-green-100 text-green-800",
  warning: "border-transparent bg-yellow-100 text-yellow-800",
  secondary: "border-transparent bg-gray-100 text-gray-800",
  outline: "text-foreground", // Default outline style
};

// Define the type for the badge variant keys
type BadgeVariant = keyof typeof badgeVariants;

export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = "",
}: WorldsMapProps) {
  const [hoveredWorld, setHoveredWorld] = useState<WorldId | null>(null);
  const [expanded, setExpanded] = useState<WorldId | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Type safety: Ensure WorldId is compatible with WorldConfigKey if needed elsewhere
  // This check is usually implicit if WorldId is defined as keyof typeof worldsConfig
  // Example assertion if types were potentially incompatible:
  // const currentWorldTyped: WorldConfigKey = currentWorld;

  const isWorldAccessible = (): boolean => {
    // Implement logic here if some worlds should be locked initially
    // For now, all worlds are accessible
    return true;
  };

  const completionPercent =
    completedWorlds.length > 0
      ? Math.round((completedWorlds.length / WORLD_ORDER.length) * 100)
      : 0;

  // Find the next recommended world
  const nextRecommendedWorld = WORLD_ORDER.find(
    (world) => !completedWorlds.includes(world)
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

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
            {/* Progress bar - simple version */}
            <Progress value={completionPercent} className="h-2" />
          </div>
        </div>

        {/* Recommended World Button */}
        {nextRecommendedWorld && nextRecommendedWorld !== currentWorld && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => onWorldChange?.(nextRecommendedWorld)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white gap-1 shadow-md hover:shadow-lg transition-shadow animate-pulse-slow" // Added animation
                >
                  <Star className="h-4 w-4 ml-1 fill-current" />{" "}
                  {/* Filled star */}
                  עבור לעולם המומלץ: {worldsConfig[nextRecommendedWorld].label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>המשך בסדר המומלץ לחוויה מיטבית</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
            const isRecommended =
              worldId === nextRecommendedWorld && !isCompleted; // Is this the next recommended?

            const progressClass = isCompleted
              ? "bg-green-500"
              : isActive
              ? config.activeColor
              : isRecommended // Highlight recommended world
              ? "bg-gradient-to-r from-blue-400 to-cyan-400"
              : "bg-gray-200";

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
                            ? "ring-2 ring-offset-2 ring-blue-500" // Simpler active indicator
                            : isRecommended // Highlight recommended
                            ? "ring-2 ring-offset-1 ring-cyan-400"
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
                        {/* Recommended Star Indicator */}
                        {isRecommended && (
                          <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 fill-current" />
                        )}
                        {circleContent}
                      </motion.button>
                      {/* World Label Below Circle */}
                      <div className="absolute -bottom-6 text-xs font-medium whitespace-nowrap">
                        {config.label}
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  {/* Enhanced Tooltip Content */}
                  <TooltipContent
                    side="top"
                    className="p-2 max-w-[200px] text-center"
                  >
                    <p className="font-medium text-base mb-1">{config.label}</p>
                    <p className="text-xs text-gray-600">
                      {config.description}
                    </p>
                    <div className="mt-2 flex justify-center">
                      {isCompleted && (
                        <Badge className={cn("text-xs", badgeVariants.success)}>
                          ✓ הושלם
                        </Badge>
                      )}
                      {isActive && (
                        <Badge className={cn("text-xs", badgeVariants.default)}>
                          ◉ פעיל כעת
                        </Badge>
                      )}
                      {isRecommended && (
                        <Badge className={cn("text-xs", badgeVariants.warning)}>
                          ★ מומלץ הבא
                        </Badge>
                      )}
                      {!isCompleted &&
                        !isActive &&
                        !isRecommended &&
                        isAccessible && (
                          <Badge
                            className={cn("text-xs", badgeVariants.outline)}
                          >
                            ○ זמין
                          </Badge>
                        )}
                      {!isAccessible && (
                        <Badge
                          className={cn("text-xs", badgeVariants.secondary)}
                        >
                          <Lock className="h-3 w-3 mr-1" /> נעול
                        </Badge>
                      )}
                    </div>
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
          const isRecommended =
            worldId === nextRecommendedWorld && !isCompleted;
          const isHovered = hoveredWorld === worldId;
          const isExpanded = expanded === worldId;

          let statusText = "";
          // *** FIX START ***
          // Declare badgeVariant with the specific BadgeVariant type
          let badgeVariant: BadgeVariant = "outline";
          // *** FIX END ***

          if (isCompleted) {
            statusText = "הושלם";
            badgeVariant = "success";
          } else if (!isAccessible) {
            statusText = "נעול";
            badgeVariant = "secondary";
          } else if (isActive) {
            statusText = "פעיל כעת";
            badgeVariant = "default";
          } else if (isRecommended) {
            statusText = "מומלץ הבא";
            badgeVariant = "warning";
          } else {
            statusText = "זמין";
            badgeVariant = "outline"; // Explicitly setting default
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
                if (!isAccessible) return; // Prevent action on locked cards
                if (isExpanded) {
                  setExpanded(null); // Close if already expanded
                } else {
                  setExpanded(worldId); // Expand this card
                }
                // Optionally navigate immediately on click if not expanded
                // if (!isExpanded && onWorldChange) {
                //    onWorldChange(worldId);
                // }
              }}
            >
              <Card
                className={cn(
                  "transition-all duration-200 overflow-hidden h-full cursor-pointer", // Added cursor-pointer
                  isActive
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "hover:shadow-md",
                  isRecommended ? "ring-2 ring-cyan-400 shadow-md" : "", // Recommended highlight
                  !isAccessible && "cursor-not-allowed opacity-90 bg-gray-50" // Style locked cards
                )}
                onMouseEnter={() => setHoveredWorld(worldId)}
                onMouseLeave={() => setHoveredWorld(null)}
              >
                {/* Top color bar */}
                <div
                  className={cn(
                    "h-2",
                    isActive
                      ? config.activeColor
                      : isCompleted
                      ? "bg-green-500"
                      : isRecommended
                      ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                      : "bg-gray-200"
                  )}
                ></div>

                <CardContent
                  className={cn("p-4", isExpanded ? "pb-8" : "pb-4")}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
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

                    {/* Title and Status Badge */}
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center">
                        {config.label}
                        {/* *** FIX START *** */}
                        {/* Remove 'as any'. The type of badgeVariant is now correctly inferred */}
                        <Badge
                          variant={badgeVariant}
                          className="ml-2 text-xs px-1.5 py-0.5"
                        >
                          {/* *** FIX END *** */}
                          {/* Icons for badges */}
                          {badgeVariant === "success" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {badgeVariant === "warning" && (
                            <Star className="h-3 w-3 mr-1" />
                          )}
                          {badgeVariant === "default" && (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          {badgeVariant === "secondary" && (
                            <Lock className="h-3 w-3 mr-1" />
                          )}
                          {statusText}
                        </Badge>
                      </h3>

                      {/* Description (shown on hover/expand) */}
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
                  </div>

                  {/* Expanded Content */}
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

                        {/* Action Button */}
                        <Button
                          className={cn(
                            "w-full",
                            isCompleted
                              ? "bg-green-600 hover:bg-green-700"
                              : isRecommended
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          )}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click when button is clicked
                            if (isAccessible && onWorldChange) {
                              onWorldChange(worldId);
                            }
                          }}
                          disabled={!isAccessible}
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
                          ) : isRecommended ? (
                            <>
                              <Star className="w-4 h-4 mr-2 fill-current" />
                              התחל עולם מומלץ
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

                  {/* Indicator for active world (when not expanded) */}
                  {isActive && !isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t text-xs text-gray-600 flex items-center"
                    >
                      <Info className="h-3 w-3 text-blue-500 mr-1" />
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

// Remember to add the animation if needed:
/*
@layer utilities {
  @keyframes pulse-slow {
    50% { opacity: .7; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}
*/
