// src/components/questionnaire/common/WorldIntro.tsx
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Scroll,
  Heart,
  Users,
  User,
  ArrowRight,
  Star,
  Award,
  Brain,
  Sparkles,
  Clock,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import type { WorldId, QuestionDepth } from "../types/types";
import { cn } from "@/lib/utils";

interface WorldIntroProps {
  worldId: WorldId;
  title: string;
  description: string;
  // estimatedTime עדיין יכול להתקבל, אך לא נשתמש בו ישירות לתצוגה אם נרצה טווח קבוע
  estimatedTime: number;
  totalQuestions: number;
  requiredQuestions: number;
  depths: Array<QuestionDepth>;
  onStart: () => void;
  className?: string;
}

// --- Configuration for World Icons and Styles (נשאר כפי שהוא) ---
const worldDisplayConfig: Record<
  WorldId,
  {
    Icon: React.ElementType;
    primaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    bgLight: string;
    textLight: string;
    iconBg: string;
  }
> = {
  RELIGION: {
    Icon: Scroll,
    primaryColor: "amber-500",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-400",
    bgLight: "bg-amber-50 dark:bg-amber-900/30",
    textLight: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-800/50",
  },
  VALUES: {
    Icon: Heart,
    primaryColor: "rose-500",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
    bgLight: "bg-rose-50 dark:bg-rose-900/30",
    textLight: "text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-100 dark:bg-rose-800/50",
  },
  RELATIONSHIP: {
    Icon: Users,
    primaryColor: "purple-500",
    gradientFrom: "from-purple-500",
    gradientTo: "to-violet-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/30",
    textLight: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-100 dark:bg-purple-800/50",
  },
  PERSONALITY: {
    Icon: User,
    primaryColor: "sky-500",
    gradientFrom: "from-sky-500",
    gradientTo: "to-cyan-400",
    bgLight: "bg-sky-50 dark:bg-sky-900/30",
    textLight: "text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-100 dark:bg-sky-800/50",
  },
  PARTNER: {
    Icon: CheckCircle2,
    primaryColor: "teal-500",
    gradientFrom: "from-teal-500",
    gradientTo: "to-emerald-500",
    bgLight: "bg-teal-50 dark:bg-teal-900/30",
    textLight: "text-teal-700 dark:text-teal-300",
    iconBg: "bg-teal-100 dark:bg-teal-800/50",
  },
};

// --- Configuration for Depth Levels (נשאר כפי שהוא) ---
const depthDisplayConfig: Record<
  QuestionDepth,
  {
    label: string;
    description: string;
    Icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  BASIC: {
    label: "יסודות",
    description: "שאלות ליבה להבנת הבסיס וההעדפות המרכזיות שלך.",
    Icon: Star,
    iconColor: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-900/50",
    borderColor: "border-sky-200 dark:border-sky-700",
  },
  ADVANCED: {
    label: "העמקה",
    description: "שאלות מורכבות יותר החוקרות ניואנסים ונקודות מבט מעמיקות.",
    Icon: Brain,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/50",
    borderColor: "border-purple-200 dark:border-purple-700",
  },
  EXPERT: {
    label: "מומחיות", // אפשר לשנות ל"התבוננות" או "רפלקציה"
    description: "שאלות רפלקטיביות הדורשות התבוננות פנימית עמוקה במיוחד.",
    Icon: Award,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/50",
    borderColor: "border-amber-200 dark:border-amber-700",
  },
};

// --- Main Component ---
export default function WorldIntro({
  worldId,
  title,
  description,
  // estimatedTime, // לא נשתמש בו ישירות לתצוגה
  totalQuestions,
  requiredQuestions,
  depths,
  onStart,
  className = "",
}: WorldIntroProps) {
  const config = worldDisplayConfig[worldId];
  const { Icon, gradientFrom, gradientTo, bgLight, textLight, iconBg } = config;

  // קביעת טווח הזמן לתצוגה
  const displayEstimatedTime = "10-20 דקות"; // <-- שינוי כאן

  // Framer Motion Variants (נשאר כפי שהוא)
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "circOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const statItemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 15, delay: 0.2 },
    },
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900",
        className
      )}
    >
      <motion.div
        className="w-full max-w-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 backdrop-blur-md">
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* World Icon, Title, and Description */}
            <motion.div variants={itemVariants} className="text-center">
              <div
                className={cn(
                  "mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg",
                  iconBg,
                  `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
                )}
              >
                <Icon className={cn("w-10 h-10 text-white")} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {title}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {description}
              </p>
            </motion.div>

            {/* Key Statistics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                {
                  label: "זמן משוער",
                  value: displayEstimatedTime, // <-- שימוש במשתנה החדש
                  IconComp: Clock,
                },
                {
                  label: "סך כל שאלות",
                  value: totalQuestions,
                  IconComp: HelpCircle,
                },
                {
                  label: "שאלות חובה",
                  value: requiredQuestions,
                  IconComp: CheckCircle2,
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={statItemVariants}
                  className={cn(
                    "p-4 rounded-lg text-center",
                    bgLight,
                    "border border-slate-200 dark:border-slate-700/70 shadow-sm"
                  )}
                >
                  <stat.IconComp
                    className={cn("w-6 h-6 mx-auto mb-2", textLight)}
                  />
                  <div className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Depth Levels Information (נשאר כפי שהוא) */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                <Sparkles className={cn("w-5 h-5 mr-2", textLight)} />
                רמות העומק בעולם זה:
              </h3>
              {depths.map((depthKey) => {
                const depthConfig = depthDisplayConfig[depthKey];
                if (!depthConfig) { // הוספת בדיקה למקרה שרמת עומק לא מוגדרת
                    console.warn(`Depth configuration for "${depthKey}" not found.`);
                    return null;
                }
                return (
                  <motion.div
                    key={depthKey}
                    variants={itemVariants}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border shadow-sm",
                      depthConfig.bgColor,
                      depthConfig.borderColor
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md flex-shrink-0",
                        depthConfig.iconColor,
                        depthConfig.bgColor.replace("-50", "-100")
                      )}
                    >
                      <depthConfig.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          "font-semibold",
                          depthConfig.iconColor.replace("text-", "text-slate-")
                        )}
                      >
                        {depthConfig.label}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {depthConfig.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Start Button (נשאר כפי שהוא) */}
            <motion.div variants={itemVariants} className="pt-4">
              <Button
                onClick={onStart}
                size="lg"
                className={cn(
                  "w-full text-lg font-medium py-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105",
                  `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white hover:shadow-xl`
                )}
              >
                בוא/י נתחיל את המסע
                <ArrowRight className="w-5 h-5 mr-2 animate-pulse-fast" />
              </Button>
            </motion.div>

            {/* Subtle Footer/Hint (נשאר כפי שהוא) */}
            <motion.p
              variants={itemVariants}
              className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2"
            >
              התשובות שלך עוזרות לנו להכיר אותך טוב יותר. ניתן לחזור ולערוך בכל
              שלב.
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
      <style jsx global>{`
        @keyframes pulse-fast {
          0%,
          100% {
            opacity: 1;
            transform: translateX(0);
          }
          50% {
            opacity: 0.7;
            transform: translateX(2px);
          }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}