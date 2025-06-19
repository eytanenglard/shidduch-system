// src/app/(authenticated)/profile/components/dashboard/ProfileChecklist.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, User, BookOpen, Camera, Phone, SlidersHorizontal, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import type { User as SessionUserType } from '@/types/next-auth';
import { Button } from '@/components/ui/button';

interface ChecklistItemProps {
  isCompleted: boolean;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void; // Added onClick for actions that aren't links
  icon: React.ElementType;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ isCompleted, title, description, link, onClick, icon: Icon }) => {
  const content = (
    <div className="flex-1">
      <h4 className={cn("font-semibold", isCompleted ? 'text-gray-500 line-through' : 'text-gray-800')}>{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
      {!isCompleted && (
        <div className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-flex items-center gap-1 group cursor-pointer">
          המשך לשלב זה <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </div>
      )}
    </div>
  );

  const wrapperProps = {
    layout: true,
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    transition: { duration: 0.3 },
    className: cn("flex items-start gap-4 p-3 rounded-lg transition-all", isCompleted ? 'bg-emerald-50/60' : 'bg-blue-50/60 hover:bg-blue-100/70'),
  };

  const interactiveElement = link ? (
    <Link href={link} className="flex-1">
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className="text-left w-full flex-1">
      {content}
    </button>
  );

  return (
    <motion.div {...wrapperProps}>
      <div className="flex-shrink-0 mt-1">
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-blue-400" />
        )}
      </div>
      {interactiveElement}
      <Icon className={cn("w-6 h-6 flex-shrink-0 opacity-50", isCompleted ? "text-emerald-400" : "text-blue-400")} />
    </motion.div>
  );
};

interface ProfileChecklistProps {
  user: SessionUserType;
  // This prop will be passed from UnifiedProfileDashboard to trigger the preview dialog
  onPreviewClick: () => void; 
}

export const ProfileChecklist: React.FC<ProfileChecklistProps> = ({ user, onPreviewClick }) => {
  
  // --- Enhanced Task Definitions ---
  const coreTasks = [
    { 
      id: 'photo', 
      isCompleted: (user.images?.length ?? 0) > 0, 
      title: 'העלאת תמונת פרופיל', 
      description: 'פרופיל עם תמונה מקבל פי 10 יותר פניות. העלה/י תמונה ברורה.', 
      link: '#photos', // This will require an ID on the PhotosSection component container
      icon: Camera 
    },
    { 
      id: 'about', 
      isCompleted: !!user.profile?.about && user.profile.about.trim().length > 100,
      title: 'כתיבת "קצת עליי"', 
      description: 'ספר/י על עצמך, מה מניע אותך ומה את/ה אוהב/ת. זה המקום שלך לזרוח!', 
      link: '#profile', // This will require an ID on the ProfileSection component container
      icon: User 
    },
    { 
      id: 'questionnaire', 
      isCompleted: !!user.questionnaireCompleted,
      title: 'מילוי שאלון התאמה', 
      description: 'השלב החשוב ביותר! מאפשר למערכת ה-AI למצוא עבורך התאמות מדויקות.', 
      link: '/questionnaire', 
      icon: BookOpen 
    },
    { 
      id: 'phone', 
      isCompleted: !!user.isPhoneVerified, 
      title: 'אימות מספר טלפון', 
      description: 'אימות הטלפון חיוני ליצירת קשר ולאבטחת חשבונך.', 
      link: '/auth/verify-phone', 
      icon: Phone 
    },
  ];

  const bonusTasks = [
    { 
    id: 'preferences', 
  isCompleted: (user.profile?.preferredAgeMin != null && (user.profile?.preferredReligiousLevels?.length ?? 0) > 0),
      title: 'הגדרת העדפות לשידוך (בונוס)', 
      description: 'הגדר/י מה את/ה מחפש/ת כדי שנוכל למקד את החיפוש עבורך.', 
      link: '#preferences', // This will require an ID on the PreferencesSection component container
      icon: SlidersHorizontal
    },
    { 
      id: 'review', 
      isCompleted: false, // This task is never "completed" but serves as a constant prompt
      title: 'סקירה סופית של הפרופיל (מומלץ)', 
      description: 'צפה/י בפרופיל שלך כפי שמועמדים אחרים יראו אותו וודא/י שהכל נראה מצוין.', 
      onClick: onPreviewClick, // Use the passed-in function
      icon: Edit3 
    }
  ];

  const allTasks = [...coreTasks, ...bonusTasks];
  const coreTasksCompletedCount = coreTasks.filter(t => t.isCompleted).length;
  const isCoreComplete = coreTasksCompletedCount === coreTasks.length;
  
  const tasksToShow = isCoreComplete ? bonusTasks.filter(t => !t.isCompleted) : coreTasks.filter(t => !t.isCompleted);
  
  // If everything is done (except the "review" task which is always shown if others are done), don't show the component.
  if (isCoreComplete && tasksToShow.length <= 1) { // <= 1 because the review task is always there
    return null;
  }
  
  const completionPercentage = Math.round((coreTasksCompletedCount / coreTasks.length) * 100);

  return (
    <Card className="mb-8 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-cyan-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">מסלול ההצלחה שלך</CardTitle>
        <CardDescription>
          {isCoreComplete 
            ? "כל הכבוד! השלמת את כל שלבי החובה. הנה עוד כמה דברים שישפרו את הפרופיל שלך:"
            : "השלם את הצעדים הבאים כדי לשפר את הפרופיל שלך ולקבל הצעות טובות יותר!"
          }
        </CardDescription>
        <div className="pt-2">
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-medium text-gray-700">השלמת שלבי החובה</span>
                <span className="font-bold text-cyan-600">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
            {tasksToShow.map((task) => (
                <ChecklistItem 
                  key={task.id} 
                  isCompleted={task.isCompleted}
                  title={task.title}
                  description={task.description}
                  link={task.link}
                  onClick={task.onClick}
                  icon={task.icon}
                />
            ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};