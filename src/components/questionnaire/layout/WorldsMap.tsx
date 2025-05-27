// WorldsMap.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Sparkles, // For recommended
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { WorldId } from "../types/types"; // Assuming types.ts is in ../types/
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery"; // Assuming useMediaQuery.ts is in ../hooks/

interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
}

// Enhanced worldsConfig for a more "Apple-like" aesthetic
// Using a more cohesive and modern color palette.
// Added specific colors for states like completed, recommended.
const worldsConfig = {
  PERSONALITY: {
    icon: User,
    baseBg: "bg-sky-50 dark:bg-sky-900/30",
    iconBg: "bg-sky-100 dark:bg-sky-800/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    activeRing: "ring-sky-500",
    label: "אישיות",
    description: "המאפיינים האישיותיים שלך וכיצד הם משפיעים על תפיסתך.",
    order: 1,
  },
  VALUES: {
    icon: Heart,
    baseBg: "bg-rose-50 dark:bg-rose-900/30",
    iconBg: "bg-rose-100 dark:bg-rose-800/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    activeRing: "ring-rose-500",
    label: "ערכים ואמונות",
    description: "עולם הערכים המרכזי שלך והאמונות שמנחות אותך בחיים.",
    order: 2,
  },
  RELATIONSHIP: {
    icon: Users,
    baseBg: "bg-purple-50 dark:bg-purple-900/30",
    iconBg: "bg-purple-100 dark:bg-purple-800/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    activeRing: "ring-purple-500",
    label: "זוגיות",
    description: "תפיסת הזוגיות שלך, ציפיות ומה חשוב לך במערכת יחסים.",
    order: 3,
  },
  PARTNER: {
    icon: UserCheck,
    baseBg: "bg-teal-50 dark:bg-teal-900/30",
    iconBg: "bg-teal-100 dark:bg-teal-800/50",
    iconColor: "text-teal-600 dark:text-teal-400",
    activeRing: "ring-teal-500",
    label: "העדפות לפרטנר",
    description: "העדפותיך ותכונות שחשובות לך בבן/בת הזוג האידיאליים.",
    order: 4,
  },
  RELIGION: {
    icon: Scroll,
    baseBg: "bg-amber-50 dark:bg-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-800/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-amber-500",
    label: "דת ומסורת",
    description:
      "חיבורך לדת, אמונה ומסורת ישראל, וכיצד זה בא לידי ביטוי בחייך.",
    order: 5,
  },
} as const;

type WorldConfigKey = keyof typeof worldsConfig;

const WORLD_ORDER: WorldConfigKey[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

// Common styling for status colors (can be centralized or part of theme)
const statusColors = {
  completed: {
    bg: "bg-green-500 dark:bg-green-600",
    text: "text-white",
    ring: "ring-green-500",
    iconBg: "bg-green-100 dark:bg-green-800/50",
    iconColor: "text-green-600 dark:text-green-400",
  },
  recommended: {
    bg: "bg-indigo-500 dark:bg-indigo-600",
    text: "text-white",
    ring: "ring-indigo-500",
    iconBg: "bg-indigo-100 dark:bg-indigo-800/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  locked: {
    bg: "bg-slate-200 dark:bg-slate-700",
    text: "text-slate-500 dark:text-slate-400",
    ring: "ring-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-400 dark:text-slate-500",
  },
  defaultBg: "bg-slate-100 dark:bg-slate-800",
};

export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = "",
}: WorldsMapProps) {
  const [expandedWorldId, setExpandedWorldId] = useState<WorldId | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isWorldAccessible = (): boolean => {
    return true;
  };

  const completionPercent = useMemo(() => {
    return WORLD_ORDER.length > 0
      ? Math.round((completedWorlds.length / WORLD_ORDER.length) * 100)
      : 0;
  }, [completedWorlds]);

  const nextRecommendedWorld = useMemo(() => {
    return WORLD_ORDER.find((world) => !completedWorlds.includes(world));
  }, [completedWorlds]);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.99, transition: { duration: 0.1 } },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      paddingTop: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: "1rem",
      paddingTop: "1rem",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  // Main render
  return (
    <div className={cn("space-y-8 font-sans", className)}>
      {/* Header Section */}
      <header className="bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
              מפת העולמות שלך
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              השלמת {completedWorlds.length} מתוך {WORLD_ORDER.length} עולמות (
              {completionPercent}%)
            </p>
            <div className="mt-3 w-full sm:max-w-xs">
              <Progress
                value={completionPercent}
                className="h-2.5 rounded-full"
              />
            </div>
          </div>

          {nextRecommendedWorld && nextRecommendedWorld !== currentWorld && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    onClick={() => onWorldChange?.(nextRecommendedWorld)}
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 w-full sm:w-auto animate-pulse-slow"
                  >
                    <Sparkles className="h-5 w-5 mr-2 fill-current" />
                    לעולם המומלץ: {worldsConfig[nextRecommendedWorld].label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800"
                >
                  <p>המשך בסדר המומלץ לחוויה מיטבית והבנה מעמיקה.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      {/* Progress Visual Tracker - Enhanced "Apple-like" map */}
      <div className="relative px-4 py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl shadow-inner">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2"></div>
        <div className="relative flex justify-between items-start w-full max-w-3xl mx-auto">
          {WORLD_ORDER.map((worldId) => {
            const config = worldsConfig[worldId];
            const Icon = config.icon;
            const isCurrent = currentWorld === worldId;
            const isCompleted = completedWorlds.includes(worldId);
            const accessible = isWorldAccessible();
            const isRecommended =
              worldId === nextRecommendedWorld && !isCompleted;

            let circleBg: string = config.baseBg;
            let iconColor: string = config.iconColor;
            let ringClass = "";
            // *** FIX START: Explicitly type statusIcon and statusText ***
            let statusIcon: JSX.Element | null = null;
            let statusText: string = config.label;
            // *** FIX END ***

            if (!accessible) {
              circleBg = statusColors.locked.bg;
              iconColor = statusColors.locked.iconColor;
              statusIcon = (
                <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              );
              statusText = `${config.label} (נעול)`;
            } else if (isCompleted) {
              circleBg = statusColors.completed.iconBg;
              iconColor = statusColors.completed.iconColor;
              ringClass = `ring-2 ${statusColors.completed.ring} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`;
              statusIcon = (
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              );
              statusText = `${config.label} (הושלם)`;
            } else if (isCurrent) {
              circleBg = config.iconBg;
              iconColor = config.iconColor;
              ringClass = `ring-2 ${config.activeRing} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`;
              statusText = `${config.label} (פעיל)`; // This is fine as statusText is now string
            } else if (isRecommended) {
              circleBg = statusColors.recommended.iconBg;
              iconColor = statusColors.recommended.iconColor;
              ringClass = `ring-2 ${statusColors.recommended.ring} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`;
              statusIcon = (
                <Star className="h-4 w-4 text-indigo-500 dark:text-indigo-400 fill-current" />
              );
              statusText = `${config.label} (מומלץ)`;
            }

            return (
              <TooltipProvider key={worldId} delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => accessible && onWorldChange?.(worldId)}
                      disabled={!accessible}
                      className={cn(
                        "relative z-10 flex flex-col items-center gap-2 cursor-pointer disabled:cursor-not-allowed group",
                        !accessible && "opacity-60"
                      )}
                      whileHover={accessible ? { scale: 1.05 } : {}}
                      whileTap={accessible ? { scale: 0.98 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ease-in-out",
                          circleBg,
                          ringClass,
                          "group-hover:shadow-lg"
                        )}
                      >
                        {statusIcon ? (
                          <div className="relative">
                            {statusIcon}
                            {isRecommended && !isCompleted && (
                              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                        ) : (
                          <Icon
                            className={cn("w-6 h-6 sm:w-7 sm:h-7", iconColor)}
                          />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-center text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 w-20 whitespace-normal">
                        {config.label}{" "}
                        {/* Displaying original label here, statusText is for tooltip */}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 p-3 rounded-md shadow-lg max-w-xs"
                  >
                    <h4 className="font-semibold text-base mb-1">
                      {statusText}
                    </h4>{" "}
                    {/* Using the full statusText here */}
                    <p className="text-xs">{config.description}</p>
                    <div className="mt-2">
                      {isCompleted && (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          ✓ הושלם
                        </Badge>
                      )}
                      {isCurrent && !isCompleted && (
                        <Badge
                          variant="default"
                          className={cn(
                            config.activeRing.replace("ring-", "bg-"),
                            "text-white"
                          )}
                        >
                          ◉ פעיל
                        </Badge>
                      )}
                      {isRecommended && !isCompleted && (
                        <Badge
                          variant="default"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                          ★ מומלץ
                        </Badge>
                      )}
                      {!isCompleted &&
                        !isCurrent &&
                        !isRecommended &&
                        accessible && (
                          <Badge
                            variant="outline"
                            className="border-slate-400 text-slate-600 dark:border-slate-500 dark:text-slate-300"
                          >
                            ○ זמין
                          </Badge>
                        )}
                      {!accessible && (
                        <Badge
                          variant="secondary"
                          className="bg-slate-500 text-white"
                        >
                          <Lock className="h-3 w-3 mr-1 inline" />
                          נעול
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

      {/* World Cards Section */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6",
          className
        )}
      >
        {WORLD_ORDER.map((worldId) => {
          const config = worldsConfig[worldId];
          const Icon = config.icon;
          const isCurrent = currentWorld === worldId;
          const isCompleted = completedWorlds.includes(worldId);
          const accessible = isWorldAccessible();
          const isRecommended =
            worldId === nextRecommendedWorld && !isCompleted;
          const isExpanded = expandedWorldId === worldId;

          let cardBorderColor: string =
            "border-slate-200 dark:border-slate-700";
          let topBarBg: string = statusColors.defaultBg;
          let statusIconColor: string = "text-slate-500 dark:text-slate-400";
          let actionButtonClass: string =
            "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600";

          // *** FIX START: Explicitly type statusTextCard and StatusIconComponentType ***
          let statusTextCard: string = "זמין";
          let StatusIconComponent: React.ElementType = Info; // Use React.ElementType for component types
          // *** FIX END ***

          let actionButtonText = "התחל עולם זה";
          let ActionButtonIcon = ArrowRight;

          if (!accessible) {
            statusTextCard = "נעול";
            StatusIconComponent = Lock;
            statusIconColor = statusColors.locked.iconColor;
            topBarBg = statusColors.locked.bg;
            actionButtonText = "נעול";
          } else if (isCompleted) {
            statusTextCard = "הושלם";
            StatusIconComponent = CheckCircle2;
            statusIconColor = statusColors.completed.iconColor;
            topBarBg = statusColors.completed.bg;
            cardBorderColor = "border-green-500 dark:border-green-600";
            actionButtonText = "ערוך תשובות";
            ActionButtonIcon = CheckCircle2;
            actionButtonClass =
              "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600";
          } else if (isCurrent) {
            statusTextCard = "פעיל כעת";
            StatusIconComponent = Play;
            statusIconColor = config.iconColor;
            topBarBg = config.iconBg
              .replace("100", "500")
              .replace("dark:bg-sky-800/50", "dark:bg-sky-600");
            cardBorderColor = `${config.activeRing.replace(
              "ring-",
              "border-"
            )} dark:${config.activeRing.replace("ring-", "border-")}`;
            actionButtonText = "המשך בעולם זה";
            ActionButtonIcon = Play;
            actionButtonClass = `${config.iconBg
              .replace("100", "600")
              .replace(
                "dark:bg-sky-800/50",
                "dark:bg-sky-500"
              )} hover:${config.iconBg
              .replace("100", "700")
              .replace("dark:bg-sky-800/50", "dark:bg-sky-600")} text-white`;
          } else if (isRecommended) {
            statusTextCard = "מומלץ הבא";
            StatusIconComponent = Star;
            statusIconColor = statusColors.recommended.iconColor;
            topBarBg = statusColors.recommended.bg;
            cardBorderColor = "border-indigo-500 dark:border-indigo-600";
            actionButtonText = "התחל עולם מומלץ";
            ActionButtonIcon = Sparkles;
            actionButtonClass =
              "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600";
          }

          return (
            <motion.div
              key={worldId}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover={accessible ? "hover" : ""}
              whileTap={accessible ? "tap" : ""}
              layout
            >
              <Card
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden h-full shadow-lg hover:shadow-xl dark:bg-slate-800",
                  "border-2",
                  cardBorderColor,
                  !accessible &&
                    "opacity-70 bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed"
                )}
              >
                <div className={cn("h-1.5", topBarBg)}></div>

                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-lg flex-shrink-0",
                        config.iconBg
                      )}
                    >
                      <Icon className={cn("w-6 h-6", config.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {config.label}
                      </h3>
                      <div className="flex items-center text-xs mt-1">
                        <StatusIconComponent
                          className={cn("w-3.5 h-3.5 mr-1.5", statusIconColor)}
                        />
                        <span className={cn("font-medium", statusIconColor)}>
                          {statusTextCard}
                        </span>
                      </div>
                    </div>
                    {accessible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedWorldId(isExpanded ? null : worldId)
                        }
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label={isExpanded ? "הצג פחות" : "הצג יותר"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && accessible && (
                      <motion.div
                        key="content"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={contentVariants}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {config.description}
                        </p>
                        <Button
                          className={cn(
                            "w-full mt-4 text-white font-medium py-2.5 px-4 rounded-md shadow-sm hover:shadow-md transition-shadow",
                            actionButtonClass,
                            !accessible && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (accessible && onWorldChange) {
                              onWorldChange(worldId);
                              setExpandedWorldId(null);
                            }
                          }}
                          disabled={!accessible}
                        >
                          <ActionButtonIcon className="w-4 h-4 mr-2" />
                          {actionButtonText}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isExpanded && !isMobile && !isCurrent && accessible && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                      {config.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes pulse-slow {
          50% {
            opacity: 0.85;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
