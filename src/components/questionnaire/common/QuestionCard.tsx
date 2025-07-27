// src/components/questionnaire/common/QuestionCard.tsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  AlertCircle,
  HelpCircle,
  SkipForward,
  Info,
  Star,
  X,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Question,
  AnswerValue,
  QuestionDepth,
} from "../types/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface QuestionCardProps {
  question: Question;
  depth: QuestionDepth;
  isRequired?: boolean;
  onSkip?: () => void;
  onBookmark?: () => void;
  onHelp?: () => void;
  className?: string;
  validationError?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
  language?: string;
  isFirstInList?: boolean;
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber'; // NEW: Added theme color prop
}

const depthLabels: Record<QuestionDepth, string> = {
  BASIC: "בסיסי",
  ADVANCED: "מתקדם",
  EXPERT: "מעמיק",
};

const depthDescriptions: Record<QuestionDepth, string> = {
  BASIC: "שאלות חובה המהוות את הבסיס להיכרות",
  ADVANCED: "שאלות מומלצות להיכרות מעמיקה יותר",
  EXPERT: "שאלות העשרה לחיבור מעמיק במיוחד",
};

export default function QuestionCard({
  question,
  depth,
  isRequired = false,
  onSkip,
  onBookmark,
  onHelp,
  className = "",
  validationError,
  isDisabled = false,
  children,
  isFirstInList = false,
  themeColor = 'sky', // Default theme color
}: QuestionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // REFINED: Motion variants for smoother animations
  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
  };

  const themeClasses = {
    border: `border-${themeColor}-500`,
    text: `text-${themeColor}-700`,
    bg: `bg-${themeColor}-100`,
    bgSoft: `bg-${themeColor}-50`,
    ring: `ring-${themeColor}-300`,
    icon: `text-${themeColor}-500`,
  };

  return (
    <motion.div
      key={question.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
    >
      <Card
        className={cn(
          "transition-all duration-300 shadow-lg rounded-xl overflow-hidden border",
          "bg-white",
          isDisabled ? "opacity-75 cursor-not-allowed" : "hover:shadow-xl",
          `border-t-4 ${themeClasses.border}`, // NEW: Thematic top border for atmosphere
          className
        )}
      >
        <CardHeader className="relative flex flex-col space-y-2 pb-3">
          <div className="flex items-center justify-between">
            {/* Left side: Metadata badges */}
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className={cn("text-xs font-medium border-2", themeClasses.border, themeClasses.bgSoft, themeClasses.text)}>
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      {depthLabels[depth]}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{depthDescriptions[depth]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRequired && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  שאלת חובה *
                </Badge>
              )}
            </div>

            {/* Right side: Action buttons */}
            <div className="flex items-center gap-1">
              {onBookmark && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsBookmarked(!isBookmarked)} className={cn("h-8 w-8 rounded-full", isBookmarked ? "text-amber-500 bg-amber-100" : "text-slate-400 hover:bg-slate-100")} aria-label={isBookmarked ? "הסר סימניה" : "הוסף סימניה"}>
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isBookmarked ? "הסר סימניה" : "שמור לעיון חוזר"}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
               {question.metadata?.helpText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowHelp(!showHelp)} className={cn("h-8 w-8 rounded-full", showHelp ? `${themeClasses.bg} ${themeClasses.text}` : "text-slate-400 hover:bg-slate-100")} aria-label={showHelp ? "הסתר עזרה" : "הצג עזרה"}>
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{showHelp ? "הסתר עזרה" : "למה אנחנו שואלים את זה?"}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
               )}
            </div>
          </div>

          {/* REFINED: Improved typography for the question itself */}
          <motion.div variants={contentVariants}>
            <h2 className="text-xl sm:text-2xl font-semibold mt-3 text-slate-800 leading-snug">
              {question.question}
            </h2>
          </motion.div>
        </CardHeader>

        <CardContent className="relative pt-2 space-y-4">
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* REFINED: Nicer alert for help text */}
                <Alert className={cn(themeClasses.bgSoft, `border-${themeColor}-200`)}>
                  <Lightbulb className={cn("h-4 w-4", themeClasses.icon)} />
                  <AlertDescription className={cn(themeClasses.text, 'font-medium')}>
                    {question.metadata.helpText}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {validationError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription className="text-sm">{validationError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4">
            <motion.div variants={contentVariants} className="relative">
              {children}
            </motion.div>
          </div>
        </CardContent>

        {onSkip && (
          <CardFooter className="relative flex justify-end items-center pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" size="sm" onClick={onSkip} disabled={isRequired || isDisabled} className={cn("text-slate-500 hover:text-slate-800", (isRequired || isDisabled) && "opacity-50 cursor-not-allowed")}>
              {isRequired ? "שאלת חובה" : "דלג על שאלה זו"}
              {!isRequired && <SkipForward className="w-4 h-4 mr-2" />}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}