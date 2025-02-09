import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Scroll, Heart, Users, User, ArrowRight } from "lucide-react";
import type { WorldId } from "../types/types";
import { cn } from "@/lib/utils";

interface WorldIntroProps {
  worldId: WorldId;
  title: string;
  description: string;
  estimatedTime: number;
  totalQuestions: number;
  requiredQuestions: number;
  depths: Array<"BASIC" | "ADVANCED" | "EXPERT">;
  onStart: () => void;
  className?: string;
}

const worldIcons = {
  RELIGION: Scroll,
  VALUES: Heart,
  RELATIONSHIP: Users,
  PERSONALITY: User,
  PARTNER: Heart,
} as const;

const worldStyles = {
  RELIGION: {
    bg: "bg-indigo-100",
    hover: "hover:bg-indigo-200",
    border: "border-indigo-300",
    text: "text-indigo-500",
  },
  VALUES: {
    bg: "bg-pink-100",
    hover: "hover:bg-pink-200",
    border: "border-pink-300",
    text: "text-pink-500",
  },
  RELATIONSHIP: {
    bg: "bg-purple-100",
    hover: "hover:bg-purple-200",
    border: "border-purple-300",
    text: "text-purple-500",
  },
  PERSONALITY: {
    bg: "bg-blue-100",
    hover: "hover:bg-blue-200",
    border: "border-blue-300",
    text: "text-blue-500",
  },
  PARTNER: {
    bg: "bg-pink-100",
    hover: "hover:bg-pink-200",
    border: "border-pink-300",
    text: "text-pink-500",
  },
} as const;

const depthInfo = {
  BASIC: {
    label: "שאלות בסיסיות",
    description: "שאלות חובה המהוות את הבסיס להיכרות",
    color: "text-blue-600",
  },
  ADVANCED: {
    label: "שאלות מתקדמות",
    description: "שאלות מומלצות להיכרות מעמיקה יותר",
    color: "text-purple-600",
  },
  EXPERT: {
    label: "שאלות מעמיקות",
    description: "שאלות העשרה לחיבור מעמיק במיוחד",
    color: "text-green-600",
  },
} as const;

export default function WorldIntro({
  worldId,
  title,
  description,
  estimatedTime,
  totalQuestions,
  requiredQuestions,
  depths,
  onStart,
  className = "",
}: WorldIntroProps) {
  const WorldIcon = worldIcons[worldId];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className={cn("max-w-2xl mx-auto p-4", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-full", worldStyles[worldId].bg)}>
              <WorldIcon className={cn("w-8 h-8", worldStyles[worldId].text)} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-gray-500 mt-1">{description}</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-4"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {estimatedTime}
              </div>
              <div className="text-sm text-gray-500">דקות</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-500">שאלות</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {requiredQuestions}
              </div>
              <div className="text-sm text-gray-500">שאלות חובה</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-medium">רמות העומק בעולם זה:</h3>
            {depths.map((depth) => (
              <div
                key={depth}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={cn(
                    "mt-1 w-2 h-2 rounded-full",
                    depth === "BASIC"
                      ? "bg-blue-500"
                      : depth === "ADVANCED"
                      ? "bg-purple-500"
                      : "bg-green-500"
                  )}
                />
                <div>
                  <h4 className={cn("font-medium", depthInfo[depth].color)}>
                    {depthInfo[depth].label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {depthInfo[depth].description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <Button onClick={onStart} className="w-full" size="lg">
              בוא/י נתחיל
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
