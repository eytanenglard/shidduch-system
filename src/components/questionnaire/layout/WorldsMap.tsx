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
import { Progress } from "@/components/ui/progress"; // Ensure this path is correct
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
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Ensure this path is correct
import { useMediaQuery } from "../hooks/useMediaQuery"; // Ensure this path is correct

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
    currentActionButtonHoverBg: "bg-sky-700 dark:bg-sky-600",
    activeBadgeBg: "bg-sky-500 dark:bg-sky-400",
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
    currentActionButtonHoverBg: "bg-rose-700 dark:bg-rose-600",
    activeBadgeBg: "bg-rose-500 dark:bg-rose-400",
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
    currentActionButtonHoverBg: "bg-purple-700 dark:bg-purple-600",
    activeBadgeBg: "bg-purple-500 dark:bg-purple-400",
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
    currentActionButtonHoverBg: "bg-teal-700 dark:bg-teal-600",
    activeBadgeBg: "bg-teal-500 dark:bg-teal-400",
  },
  RELIGION: {
    icon: Scroll,
    label: "דת ומסורת",
    description:
      "חיבורך לדת, אמונה ומסורת ישראל, וכיצד זה בא לידי ביטוי בחייך.",
    order: 5,
    themeColor: "amber",
    baseBg: "bg-amber-50 dark:bg-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-800/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-amber-500",
    currentTopBarBg: "bg-amber-500 dark:bg-amber-600",
    currentActionButtonBg: "bg-amber-600 dark:bg-amber-500",
    currentActionButtonHoverBg: "bg-amber-700 dark:bg-amber-600",
    activeBadgeBg: "bg-amber-500 dark:bg-amber-400",
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

const statusColors = {
  completed: {
    bg: "bg-green-500 dark:bg-green-600",
    text: "text-white",
    ring: "ring-green-500",
    iconBg: "bg-green-100 dark:bg-green-800/50",
    iconColor: "text-green-600 dark:text-green-400",
    badgeClass: "bg-green-500 hover:bg-green-600 text-white",
  },
  recommended: {
    bg: "bg-indigo-500 dark:bg-indigo-600",
    text: "text-white",
    ring: "ring-indigo-500",
    iconBg: "bg-indigo-100 dark:bg-indigo-800/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
  },
  locked: {
    bg: "bg-slate-500 dark:bg-slate-700",
    text: "text-white",
    ring: "ring-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-400 dark:text-slate-500",
    badgeClass: "bg-slate-500 text-white",
  },
  defaultBg: "bg-slate-100 dark:bg-slate-800",
  defaultAvailableBadge: {
    text: "זמין",
    className:
      "border-slate-400 text-slate-600 dark:border-slate-500 dark:text-slate-300",
    variant: "outline" as BadgeProps["variant"],
  },
};

interface WorldDisplayInfo {
  statusTextCard: string;
  StatusIconComponentCard: React.ElementType;
  statusIconColorCard: string;
  cardBorderClass: string;
  topBarClass: string;
  actionButtonText: string;
  ActionButtonIcon: React.ElementType;
  actionButtonClass: string;
  isLocked: boolean;
  trackerCircleBg: string;
  trackerIconColor: string;
  trackerRingClass: string;
  trackerStatusIconElement: JSX.Element | null;
  trackerLabelSuffix: string;
  tooltipBadge: {
    text: string;
    className: string;
    Icon?: React.ElementType;
    variant?: BadgeProps["variant"];
  };
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
      statusTextCard: "נעול",
      StatusIconComponentCard: Lock,
      statusIconColorCard: statusColors.locked.iconColor,
      cardBorderClass: "border-slate-300 dark:border-slate-600 opacity-60",
      topBarClass: statusColors.locked.bg,
      actionButtonText: "נעול",
      ActionButtonIcon: Lock,
      actionButtonClass: `${statusColors.locked.bg} text-white cursor-not-allowed`,
      isLocked: true,
      trackerCircleBg: statusColors.locked.iconBg,
      trackerIconColor: statusColors.locked.iconColor,
      trackerRingClass: "",
      trackerStatusIconElement: (
        <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      ),
      trackerLabelSuffix: " (נעול)",
      tooltipBadge: {
        text: "נעול",
        className: statusColors.locked.badgeClass,
        Icon: Lock,
      },
    };
  }
  if (isCompleted) {
    return {
      statusTextCard: "הושלם",
      StatusIconComponentCard: CheckCircle2,
      statusIconColorCard: statusColors.completed.iconColor,
      cardBorderClass: "border-green-500 dark:border-green-600",
      topBarClass: statusColors.completed.bg,
      actionButtonText: "ערוך תשובות",
      ActionButtonIcon: Edit3,
      actionButtonClass: `${statusColors.completed.bg} hover:opacity-90 text-white`,
      isLocked: false,
      trackerCircleBg: statusColors.completed.iconBg,
      trackerIconColor: statusColors.completed.iconColor,
      trackerRingClass: `ring-2 ${statusColors.completed.ring} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`,
      trackerStatusIconElement: (
        <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
      ),
      trackerLabelSuffix: " (הושלם)",
      tooltipBadge: {
        text: "✓ הושלם",
        className: statusColors.completed.badgeClass,
      },
    };
  }
  if (isCurrent) {
    return {
      statusTextCard: "פעיל כעת",
      StatusIconComponentCard: Play,
      statusIconColorCard: config.iconColor,
      cardBorderClass: `${config.activeRing.replace(
        "ring-",
        "border-"
      )} dark:${config.activeRing.replace("ring-", "border-")}`,
      topBarClass: config.currentTopBarBg,
      actionButtonText: "המשך בעולם זה",
      ActionButtonIcon: Play,
      actionButtonClass: `${config.currentActionButtonBg} hover:${config.currentActionButtonHoverBg} text-white`,
      isLocked: false,
      trackerCircleBg: config.iconBg,
      trackerIconColor: config.iconColor,
      trackerRingClass: `ring-2 ${config.activeRing} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`,
      trackerStatusIconElement: null,
      trackerLabelSuffix: " (פעיל)",
      tooltipBadge: {
        text: "◉ פעיל",
        className: `${config.activeBadgeBg} text-white`,
      },
    };
  }
  if (isRecommended) {
    return {
      statusTextCard: "מומלץ הבא",
      StatusIconComponentCard: Star,
      statusIconColorCard: statusColors.recommended.iconColor,
      cardBorderClass: "border-indigo-500 dark:border-indigo-600",
      topBarClass: statusColors.recommended.bg,
      actionButtonText: "התחל עולם מומלץ",
      ActionButtonIcon: Sparkles,
      actionButtonClass: `${statusColors.recommended.bg} hover:opacity-90 text-white`,
      isLocked: false,
      trackerCircleBg: statusColors.recommended.iconBg,
      trackerIconColor: statusColors.recommended.iconColor,
      trackerRingClass: `ring-2 ${statusColors.recommended.ring} ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800/30`,
      trackerStatusIconElement: (
        <Star className="h-4 w-4 text-indigo-500 dark:text-indigo-400 fill-current" />
      ),
      trackerLabelSuffix: " (מומלץ)",
      tooltipBadge: {
        text: "★ מומלץ",
        className: statusColors.recommended.badgeClass,
      },
    };
  }
  return {
    statusTextCard: "זמין",
    StatusIconComponentCard: Info,
    statusIconColorCard: "text-slate-500 dark:text-slate-400",
    cardBorderClass: "border-slate-200 dark:border-slate-700",
    topBarClass: statusColors.defaultBg,
    actionButtonText: "התחל עולם זה",
    ActionButtonIcon: ArrowRight,
    actionButtonClass:
      "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white",
    isLocked: false,
    trackerCircleBg: config.baseBg,
    trackerIconColor: config.iconColor,
    trackerRingClass: "",
    trackerStatusIconElement: null,
    trackerLabelSuffix: "",
    tooltipBadge: statusColors.defaultAvailableBadge,
  };
}

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
  }, [completedWorlds]); // Removed WORLD_ORDER.length

  const nextRecommendedWorld = useMemo(() => {
    return WORLD_ORDER.find((world) => !completedWorlds.includes(world));
  }, [completedWorlds]); // Removed WORLD_ORDER

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

  return (
    <div className={cn("space-y-8 font-sans", className)}>
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
                indicatorClassName="bg-sky-500 dark:bg-sky-400"
              />
            </div>
          </div>

          {nextRecommendedWorld && worldsConfig[nextRecommendedWorld] && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    onClick={() => onWorldChange?.(nextRecommendedWorld)}
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 w-full sm:w-auto animate-pulse-slow"
                    disabled={currentWorld === nextRecommendedWorld}
                  >
                    <Sparkles className="h-5 w-5 mr-2 fill-current" />
                    {currentWorld === nextRecommendedWorld
                      ? `אתה בעולם המומלץ: ${worldsConfig[nextRecommendedWorld].label}`
                      : `לעולם המומלץ: ${worldsConfig[nextRecommendedWorld].label}`}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 p-2 rounded-md shadow-lg"
                >
                  <p>המשך בסדר המומלץ לחוויה מיטבית והבנה מעמיקה.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      <div className="relative bg-slate-50 dark:bg-slate-800/30 rounded-xl shadow-inner">
        <div
          className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2"
          style={{ zIndex: 0 }}
        ></div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent px-2 sm:px-4 py-8">
          <div className="relative flex items-start justify-start sm:justify-between gap-x-4 xs:gap-x-6 min-w-max sm:min-w-full w-full max-w-3xl sm:mx-auto">
            {WORLD_ORDER.map((worldId) => {
              const config = worldsConfig[worldId];
              const Icon = config.icon;
              const accessible = isWorldAccessible();
              const worldInfo = getWorldDisplayInfo(
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
                      <motion.button
                        onClick={() => accessible && onWorldChange?.(worldId)}
                        disabled={!accessible}
                        className={cn(
                          "relative z-10 flex flex-col items-center gap-2 group",
                          accessible
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-60"
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
                            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ease-in-out relative",
                            worldInfo.trackerCircleBg,
                            worldInfo.trackerRingClass,
                            "group-hover:shadow-lg"
                          )}
                        >
                          {worldInfo.trackerStatusIconElement ? (
                            <div className="relative">
                              {worldInfo.trackerStatusIconElement}
                              {worldId === nextRecommendedWorld &&
                                !completedWorlds.includes(worldId) &&
                                !worldInfo.trackerStatusIconElement && (
                                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 fill-yellow-400" />
                                )}
                            </div>
                          ) : (
                            <Icon
                              className={cn(
                                "w-6 h-6 sm:w-7 sm:h-7",
                                worldInfo.trackerIconColor
                              )}
                            />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-center text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 w-20 sm:w-24 whitespace-normal break-words">
                          {config.label}
                        </span>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 p-3 rounded-md shadow-lg max-w-xs text-right"
                    >
                      <h4 className="font-semibold text-base mb-1">
                        {config.label}
                        {worldInfo.trackerLabelSuffix}
                      </h4>
                      <p className="text-xs">{config.description}</p>
                      {worldInfo.tooltipBadge && (
                        <div className="mt-2">
                          <Badge
                            variant={
                              worldInfo.tooltipBadge.variant || "default"
                            }
                            className={cn(
                              "text-xs",
                              worldInfo.tooltipBadge.className
                            )}
                          >
                            {worldInfo.tooltipBadge.Icon && (
                              <worldInfo.tooltipBadge.Icon className="h-3 w-3 ml-1 inline" />
                            )}
                            {worldInfo.tooltipBadge.text}
                          </Badge>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6",
          className
        )}
      >
        {WORLD_ORDER.map((worldId) => {
          const config = worldsConfig[worldId];
          const Icon = config.icon;
          const accessible = isWorldAccessible();
          const isExpanded = expandedWorldId === worldId;
          const worldInfo = getWorldDisplayInfo(
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
                  worldInfo.cardBorderClass,
                  !accessible &&
                    "opacity-70 bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed"
                )}
              >
                <div className={cn("h-1.5", worldInfo.topBarClass)}></div>
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
                        <worldInfo.StatusIconComponentCard
                          className={cn(
                            "w-3.5 h-3.5 ml-1.5",
                            worldInfo.statusIconColorCard
                          )}
                        />
                        <span
                          className={cn(
                            "font-medium",
                            worldInfo.statusIconColorCard
                          )}
                        >
                          {worldInfo.statusTextCard}
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
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mr-auto"
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
                            worldInfo.actionButtonClass
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onWorldChange) {
                              onWorldChange(worldId);
                              setExpandedWorldId(null);
                            }
                          }}
                          disabled={worldInfo.isLocked}
                        >
                          <worldInfo.ActionButtonIcon className="w-4 h-4 ml-2" />
                          {worldInfo.actionButtonText}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isExpanded &&
                    !isMobile &&
                    currentWorld !== worldId &&
                    accessible && (
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
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: currentColor transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: currentColor;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .scrollbar-thumb-slate-300 {
          --scrollbar-color: #cbd5e1; /* slate-300 */
          color: var(--scrollbar-color);
        }
        .dark .scrollbar-thumb-slate-600 {
          --scrollbar-color: #475569; /* slate-600 */
          color: var(--scrollbar-color);
        }
      `}</style>
    </div>
  );
}
