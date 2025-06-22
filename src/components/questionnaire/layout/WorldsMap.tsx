// WorldsMap.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge, BadgeProps } from "@/components/ui/badge";
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
  Sparkles,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const worldsConfig = {
  PERSONALITY: {
    icon: User,
    label: "אישיות",
    description: "המאפיינים האישיותיים שלך וכיצד הם משפיעים על תפיסתך.",
    order: 1,
    themeColor: "sky",
    baseBg: "bg-sky-50 dark:bg-sky-900/30",
    iconBg: "bg-sky-100 dark:bg-sky-800/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    activeRing: "ring-sky-500",
    currentTopBarBg: "bg-sky-500 dark:bg-sky-600",
    currentActionButtonBg: "bg-sky-600 dark:bg-sky-500",
    currentActionButtonHoverBg: "hover:bg-sky-700 dark:hover:bg-sky-600",
    activeBadgeBg: "bg-sky-100 text-sky-800 border-sky-300",
  },
  VALUES: {
    icon: Heart,
    label: "ערכים ואמונות",
    description: "עולם הערכים המרכזי שלך והאמונות שמנחות אותך בחיים.",
    order: 2,
    themeColor: "rose",
    baseBg: "bg-rose-50 dark:bg-rose-900/30",
    iconBg: "bg-rose-100 dark:bg-rose-800/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    activeRing: "ring-rose-500",
    currentTopBarBg: "bg-rose-500 dark:bg-rose-600",
    currentActionButtonBg: "bg-rose-600 dark:bg-rose-500",
    currentActionButtonHoverBg: "hover:bg-rose-700 dark:hover:bg-rose-600",
    activeBadgeBg: "bg-rose-100 text-rose-800 border-rose-300",
  },
  RELATIONSHIP: {
    icon: Users,
    label: "זוגיות",
    description: "תפיסת הזוגיות שלך, ציפיות ומה חשוב לך במערכת יחסים.",
    order: 3,
    themeColor: "purple",
    baseBg: "bg-purple-50 dark:bg-purple-900/30",
    iconBg: "bg-purple-100 dark:bg-purple-800/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    activeRing: "ring-purple-500",
    currentTopBarBg: "bg-purple-500 dark:bg-purple-600",
    currentActionButtonBg: "bg-purple-600 dark:bg-purple-500",
    currentActionButtonHoverBg: "hover:bg-purple-700 dark:hover:bg-purple-600",
    activeBadgeBg: "bg-purple-100 text-purple-800 border-purple-300",
  },
  PARTNER: {
    icon: UserCheck,
    label: "העדפות לפרטנר",
    description: "העדפותיך ותכונות שחשובות לך בבן/בת הזוג האידיאליים.",
    order: 4,
    themeColor: "teal",
    baseBg: "bg-teal-50 dark:bg-teal-900/30",
    iconBg: "bg-teal-100 dark:bg-teal-800/50",
    iconColor: "text-teal-600 dark:text-teal-400",
    activeRing: "ring-teal-500",
    currentTopBarBg: "bg-teal-500 dark:bg-teal-600",
    currentActionButtonBg: "bg-teal-600 dark:bg-teal-500",
    currentActionButtonHoverBg: "hover:bg-teal-700 dark:hover:bg-teal-600",
    activeBadgeBg: "bg-teal-100 text-teal-800 border-teal-300",
  },
  RELIGION: {
    icon: Scroll,
    label: "דת ומסורת",
    description: "חיבורך לדת, אמונה ומסורת ישראל, וכיצד זה בא לידי ביטוי בחייך.",
    order: 5,
    themeColor: "amber",
    baseBg: "bg-amber-50 dark:bg-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-800/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-amber-500",
    currentTopBarBg: "bg-amber-500 dark:bg-amber-600",
    currentActionButtonBg: "bg-amber-600 dark:bg-amber-500",
    currentActionButtonHoverBg: "hover:bg-amber-700 dark:hover:bg-amber-600",
    activeBadgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
} as const;

type WorldId = keyof typeof worldsConfig;
type SingleWorldConfig = (typeof worldsConfig)[WorldId];

interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
}

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

const statusStyles = {
  completed: {
    badge: "bg-green-100 text-green-800 border-green-300",
    actionButton: "bg-green-600 hover:bg-green-700 text-white",
    trackerRing: "ring-green-500",
    trackerIcon: "text-green-500",
  },
  recommended: {
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
    actionButton: "bg-indigo-600 hover:bg-indigo-700 text-white",
    trackerRing: "ring-indigo-500",
    trackerIcon: "text-indigo-500 fill-indigo-200",
  },
  locked: {
    badge: "bg-slate-200 text-slate-600 border-slate-300",
    actionButton: "bg-slate-400 cursor-not-allowed text-white",
    trackerRing: "ring-slate-400",
    trackerIcon: "text-slate-400",
  },
};

interface WorldDisplayInfo {
  statusText: string;
  StatusIcon: React.ElementType;
  badgeClass: string;
  actionButtonText: string;
  ActionButtonIcon: React.ElementType;
  actionButtonClass: string;
  isLocked: boolean;
  trackerRingClass: string;
  trackerStatusIcon?: React.ReactElement;
}

function getWorldDisplayInfo(
  worldId: WorldId,
  config: SingleWorldConfig,
  currentWorld: WorldId,
  completedWorlds: WorldId[],
  nextRecommendedWorld: WorldId | undefined,
  isAccessible: boolean
): WorldDisplayInfo {
  const isCurrent = currentWorld === worldId;
  const isCompleted = completedWorlds.includes(worldId);
  const isRecommended = worldId === nextRecommendedWorld && !isCompleted;

  if (!isAccessible) {
    return {
      statusText: "נעול",
      StatusIcon: Lock,
      badgeClass: statusStyles.locked.badge,
      actionButtonText: "נעול",
      ActionButtonIcon: Lock,
      actionButtonClass: statusStyles.locked.actionButton,
      isLocked: true,
      trackerRingClass: "",
      trackerStatusIcon: (
        <Lock className={`w-3.5 h-3.5 ${statusStyles.locked.trackerIcon}`} />
      ),
    };
  }

  if (isCompleted) {
    return {
      statusText: "הושלם",
      StatusIcon: CheckCircle2,
      badgeClass: statusStyles.completed.badge,
      actionButtonText: "ערוך תשובות",
      ActionButtonIcon: Edit3,
      actionButtonClass: statusStyles.completed.actionButton,
      isLocked: false,
      trackerRingClass: `ring-2 ${statusStyles.completed.trackerRing}`,
      trackerStatusIcon: (
        <CheckCircle2
          className={`w-4 h-4 ${statusStyles.completed.trackerIcon}`}
        />
      ),
    };
  }

  if (isCurrent) {
    return {
      statusText: "פעיל כעת",
      StatusIcon: Play,
      badgeClass: config.activeBadgeBg,
      actionButtonText: "המשך בעולם זה",
      ActionButtonIcon: Play,
      actionButtonClass: `${config.currentActionButtonBg} ${config.currentActionButtonHoverBg} text-white`,
      isLocked: false,
      trackerRingClass: `ring-2 ${config.activeRing}`,
    };
  }

  if (isRecommended) {
    return {
      statusText: "מומלץ הבא",
      StatusIcon: Star,
      badgeClass: statusStyles.recommended.badge,
      actionButtonText: "התחל עולם מומלץ",
      ActionButtonIcon: Sparkles,
      actionButtonClass: statusStyles.recommended.actionButton,
      isLocked: false,
      trackerRingClass: `ring-2 ${statusStyles.recommended.trackerRing}`,
      trackerStatusIcon: (
        <Star className={`w-4 h-4 ${statusStyles.recommended.trackerIcon}`} />
      ),
    };
  }

  return {
    statusText: "זמין",
    StatusIcon: Info,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    actionButtonText: "התחל עולם זה",
    ActionButtonIcon: ArrowRight,
    actionButtonClass: "bg-sky-600 hover:bg-sky-700 text-white",
    isLocked: false,
    trackerRingClass: "",
  };
}

export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = "",
}: WorldsMapProps) {
  const isWorldAccessible = (): boolean => true;

  const completionPercent = useMemo(
    () =>
      WORLD_ORDER.length > 0
        ? Math.round((completedWorlds.length / WORLD_ORDER.length) * 100)
        : 0,
    [completedWorlds.length]
  );

  const nextRecommendedWorld = useMemo(
    () => WORLD_ORDER.find((world) => !completedWorlds.includes(world)),
    [completedWorlds]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div
      className={cn("space-y-8 font-sans", className)}
      id="onboarding-target-worlds-map"
    >
      <motion.header
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              מפת העולמות שלך
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              השלמת {completedWorlds.length} מתוך {WORLD_ORDER.length} עולמות
            </p>
            <div className="mt-3 w-full sm:max-w-xs">
              <Progress
                value={completionPercent}
                className="h-2 rounded-full"
                indicatorClassName="bg-gradient-to-r from-sky-400 to-indigo-500"
              />
            </div>
          </div>
          {nextRecommendedWorld && (
            <Button
              size="lg"
              onClick={() => onWorldChange?.(nextRecommendedWorld)}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 w-full sm:w-auto animate-pulse-slow"
            >
              <Sparkles className="h-5 w-5 mr-2 fill-current" />
              לעולם המומלץ: {worldsConfig[nextRecommendedWorld].label}
            </Button>
          )}
        </div>
      </motion.header>

      {/* --- World Journey Tracker --- */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-slate-50 dark:bg-slate-800/30 rounded-xl shadow-inner p-4"
      >
        <div className="overflow-x-auto scrollbar-hide py-4">
          <div className="relative flex items-center justify-between min-w-max w-full max-w-3xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2"></div>
            {WORLD_ORDER.map((worldId) => {
              const config = worldsConfig[worldId];
              const accessible = isWorldAccessible();
              const info = getWorldDisplayInfo(
                worldId,
                config,
                currentWorld,
                completedWorlds,
                nextRecommendedWorld,
                accessible
              );

              return (
                <TooltipProvider key={worldId} delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => accessible && onWorldChange?.(worldId)}
                        disabled={!accessible}
                        className="relative z-10 flex flex-col items-center gap-2 group focus:outline-none"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ease-in-out relative bg-white dark:bg-slate-800",
                            info.trackerRingClass
                          )}
                        >
                          <config.icon
                            className={cn(
                              "w-6 h-6",
                              config.iconColor,
                              !accessible && "opacity-50"
                            )}
                          />
                          {info.trackerStatusIcon && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-white dark:bg-slate-700 rounded-full p-0.5"
                            >
                              {info.trackerStatusIcon}
                            </motion.div>
                          )}
                        </motion.div>
                        <span className="text-xs font-medium text-center text-slate-700 dark:text-slate-300 w-20">
                          {config.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="dark:bg-slate-800">
                      <p>{config.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* --- World Cards Grid --- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
      >
        {WORLD_ORDER.map((worldId) => {
          const config = worldsConfig[worldId];
          const accessible = isWorldAccessible();
          const info = getWorldDisplayInfo(
            worldId,
            config,
            currentWorld,
            completedWorlds,
            nextRecommendedWorld,
            accessible
          );

          return (
            <motion.div
              key={worldId}
              variants={itemVariants}
              id={worldId === "PERSONALITY" ? "onboarding-target-world-card" : undefined}
              layout
            >
              <Card
                className={cn(
                  "flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shadow-lg hover:shadow-xl dark:bg-slate-800 border-2",
                  accessible
                    ? "border-transparent hover:-translate-y-1"
                    : "opacity-70 bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="p-5 sm:p-6 flex-grow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div
                      className={cn(
                        "p-3 rounded-lg flex-shrink-0",
                        config.iconBg
                      )}
                    >
                      <config.icon className={cn("w-7 h-7", config.iconColor)} />
                    </div>
                    <Badge variant="outline" className={cn("text-xs", info.badgeClass)}>
                      <info.StatusIcon className="w-3.5 h-3.5 ml-1" />
                      {info.statusText}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {config.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1 h-16 line-clamp-3">
                    {config.description}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 mt-auto">
                  <Button
                    className={cn("w-full font-medium", info.actionButtonClass)}
                    onClick={() => onWorldChange?.(worldId)}
                    disabled={info.isLocked}
                  >
                    <info.ActionButtonIcon className="w-4 h-4 ml-2" />
                    {info.actionButtonText}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}