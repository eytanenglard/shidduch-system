"use client";

import React from 'react';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { CheckCircle, User, BookOpen, Camera, Phone, SlidersHorizontal, Edit3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import type { User as SessionUserType } from '@/types/next-auth';

interface ChecklistItemProps {
  isCompleted: boolean;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
  icon: React.ElementType;
  isBonus?: boolean;
}

// --- רכיב פריט משימה בעיצוב חדש, מזמין ואינטראקטיבי ---
const ChecklistItem: React.FC<ChecklistItemProps> = ({ isCompleted, title, description, link, onClick, icon: Icon, isBonus }) => {
  const content = (
    <>
      <div className="relative w-full flex justify-center mb-4">
        <div className={cn(
          "relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
          isCompleted ? "bg-emerald-100 shadow-emerald-500/10" : "bg-cyan-100 shadow-cyan-500/10",
          isBonus && !isCompleted && "bg-amber-100 shadow-amber-500/10"
        )}>
          <Icon className={cn(
            "w-8 h-8 transition-colors duration-300", 
            isCompleted ? "text-emerald-500" : "text-cyan-600",
            isBonus && !isCompleted && "text-amber-600"
          )} />
        </div>
        {isCompleted && (
           <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
            className="absolute -top-1 -right-1"
          >
            <CheckCircle className="w-6 h-6 text-emerald-500 bg-white rounded-full p-0.5" fill="white" />
          </motion.div>
        )}
      </div>
      <h4 className={cn(
        "font-bold text-sm text-center transition-colors",
        isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'
      )}>
        {title}
      </h4>
      {!isCompleted && (
        <p className="text-xs text-center text-gray-500 mt-1 leading-tight h-8">
          {description}
        </p>
      )}
    </>
  );

  const wrapperProps = {
    className: cn(
      "relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 group h-full",
      isCompleted 
        ? 'bg-white/40 cursor-default' 
        : 'bg-white/70 hover:shadow-xl hover:bg-white cursor-pointer shadow-md'
    ),
    layout: true,
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
    whileHover: isCompleted ? {} : { y: -4, transition: { type: "spring", stiffness: 300, damping: 15 } },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  };

  if (link && !isCompleted) {
    return (
      <Link href={link} passHref legacyBehavior>
        <motion.a {...wrapperProps}>
          {content}
        </motion.a>
      </Link>
    );
  }
  
  return (
    <motion.button onClick={onClick} {...wrapperProps} disabled={isCompleted}>
      {content}
    </motion.button>
  );
};

// --- רכיב הצ'קליסט הראשי, מעוצב כבאנר קבלת פנים אינטראקטיבי ---
export const ProfileChecklist: React.FC<{
  user: SessionUserType;
  onPreviewClick: () => void;
}> = ({ user, onPreviewClick }) => {
  
  const coreTasks = [
    { 
      id: 'photo', 
      isCompleted: (user.images?.length ?? 0) > 0, 
      title: 'העלאת תמונות', 
      description: 'הרושם הראשוני הוא קריטי.', 
      link: '/profile?tab=photos',
      icon: Camera 
    },
    { 
      id: 'about', 
      isCompleted: !!user.profile?.about && user.profile.about.trim().length > 100,
      title: 'כתיבת "קצת עליי"', 
      description: 'המקום לספר על עצמך במילים שלך.', 
      link: '/profile?tab=overview',
      icon: User 
    },
    { 
      id: 'questionnaire', 
      isCompleted: !!user.questionnaireCompleted,
      title: 'שאלון התאמה', 
      description: 'השלב החשוב ביותר להתאמות AI.', 
      link: '/questionnaire', 
      icon: BookOpen 
    },
    { 
      id: 'phone', 
      isCompleted: !!user.isPhoneVerified, 
      title: 'אימות טלפון', 
      description: 'חיוני ליצירת קשר ואבטחה.', 
      link: '/auth/verify-phone', 
      icon: Phone 
    },
  ];

  const bonusTasks = [
    { 
      id: 'preferences', 
      isCompleted: (user.profile?.preferredAgeMin != null && (user.profile?.preferredReligiousLevels?.length ?? 0) > 0),
      title: 'הגדרת העדפות', 
      description: 'דייק/י את החיפוש אחר הנפש התאומה.', 
      link: '/profile?tab=preferences',
      icon: SlidersHorizontal,
      isBonus: true
    },
    { 
      id: 'review', 
      isCompleted: false, // This task is never "completed" in the list
      title: 'סקירת הפרופיל', 
      description: 'צפה/י איך הפרופיל שלך נראה לאחרים.', 
      onClick: onPreviewClick,
      icon: Edit3,
      isBonus: true
    }
  ];

  const completedCoreCount = coreTasks.filter(t => t.isCompleted).length;
  const isCoreComplete = completedCoreCount === coreTasks.length;
  
  const tasksToShow = isCoreComplete ? bonusTasks.filter(t => !t.isCompleted) : coreTasks;
  
  const totalStepsForProgress = coreTasks.length;
  const completionPercentage = Math.round((completedCoreCount / totalStepsForProgress) * 100);

  // החלטה אם להציג את הרכיב בכלל: אם כל משימות החובה והבונוס הושלמו, אין מה להציג
  if (isCoreComplete && bonusTasks.every(task => task.isCompleted)) {
      return null;
  }
  
  return (
    <AnimatePresence>
        {tasksToShow.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, transition: { duration: 0.4 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8 rounded-3xl shadow-xl border border-white/50 bg-white/70 backdrop-blur-md overflow-hidden"
            >
              <div className="p-6">
                <div className="md:flex md:items-center md:justify-between">
                  <div className="text-center md:text-right">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
                       {isCoreComplete && <Sparkles className="w-6 h-6 text-amber-500" />}
                      {isCoreComplete 
                        ? `כל הכבוד, ${user.firstName}! הפרופיל שלך מוכן!`
                        : `ברוך הבא, ${user.firstName}! בוא נכין את הפרופיל שלך להצלחה`
                      }
                    </h2>
                    <p className="text-slate-600 mt-1 text-sm md:text-base">
                      {isCoreComplete
                        ? 'השלמת את כל השלבים החשובים. אלו צעדים נוספים שישפרו את הסיכויים שלך:'
                        : 'השלמת הצעדים הבאים תעזור לנו למצוא עבורך את ההתאמות הטובות ביותר.'
                      }
                    </p>
                  </div>
                  {!isCoreComplete && (
                      <div className="mt-4 md:mt-0 md:w-1/3">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-700">התקדמות שלבי חובה</span>
                            <span className="font-bold text-cyan-600">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2 bg-slate-200/70" />
                      </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <AnimatePresence>
                      {tasksToShow.map((task) => (
                          <ChecklistItem 
                            key={task.id} 
                            {...task}
                          />
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};