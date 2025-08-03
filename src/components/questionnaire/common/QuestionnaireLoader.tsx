// src/components/questionnaire/common/QuestionnaireLoader.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Star, ShieldCheck } from 'lucide-react';

interface QuestionnaireLoaderProps {
  userName?: string | null;
  hasSavedProgress: boolean;
}

const loadingTips = [
  {
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    text: 'כל תשובה מקרבת אותך צעד נוסף למציאת קשר אמיתי ומשמעותי.',
  },
  {
    icon: <Star className="h-5 w-5 text-amber-500" />,
    text: 'השאלון שלנו נבנה על ידי שדכנים ופסיכולוגים כדי להבין את הסיפור הייחודי שלך.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
    text: 'הפרטיות שלך חשובה לנו. המידע שלך משמש את הצוות המקצועי שלנו בלבד.',
  },
  {
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    text: 'דיוק הוא המפתח. התשובות שלך עוזרות לנו למצוא לך התאמות איכותיות יותר.',
  },
];

const HeartbeatAnimation = () => (
  <div className="relative w-24 h-24">
    <svg
      className="absolute inset-0 w-full h-full animate-pulse-slow"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 50,20 A 15,15 0 0,1 80,50 L 50,80 L 20,50 A 15,15 0 0,1 50,20 Z"
        fill="rgba(239, 68, 68, 0.2)"
        stroke="rgba(239, 68, 68, 0.4)"
        strokeWidth="1"
      />
    </svg>
    <svg
      className="absolute inset-0 w-full h-full animate-heartbeat"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 50,20 A 15,15 0 0,1 80,50 L 50,80 L 20,50 A 15,15 0 0,1 50,20 Z"
        fill="rgb(239 68 68)"
      />
    </svg>
    <style jsx>{`
      @keyframes heartbeat {
        0%, 100% {
          transform: scale(0.95);
        }
        50% {
          transform: scale(1.05);
        }
      }
      .animate-heartbeat {
        animation: heartbeat 1.5s ease-in-out infinite;
        transform-origin: center;
      }
      @keyframes pulse-slow {
        0%, 100% {
          transform: scale(1);
          opacity: 0.2;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.4;
        }
      }
      .animate-pulse-slow {
        animation: pulse-slow 3s ease-in-out infinite;
        transform-origin: center;
      }
    `}</style>
  </div>
);

export default function QuestionnaireLoader({
  userName,
  hasSavedProgress,
}: QuestionnaireLoaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progressValue, setProgressValue] = useState(10);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % loadingTips.length);
    }, 4000);

    // Animate progress bar for visual feedback
    const progressInterval = setInterval(() => {
      setProgressValue((prev) => (prev >= 90 ? 20 : prev + 8));
    }, 500);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const welcomeMessage = hasSavedProgress
    ? `שמחים שחזרת, ${userName || 'להמשך המסע'}!`
    : `שלום, ${userName || 'לך'}! ברוך הבא למסע שלך.`;
  
  const subTitle = hasSavedProgress
    ? 'טוענים את ההתקדמות שלך כדי שתוכל/י להמשיך מהיכן שעצרת...'
    : 'אנחנו מכינים עבורך את השאלון האישי...';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-lg mx-auto shadow-xl border-t-4 border-rose-400">
          <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center">
            <HeartbeatAnimation />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-8">
              {welcomeMessage}
            </h2>
            <p className="text-slate-600 mt-2">{subTitle}</p>

            <div className="w-full my-8 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start text-center justify-center gap-3 p-4 bg-purple-50/50 rounded-lg min-h-[80px]"
                >
                  <div className="flex-shrink-0 mt-1">{loadingTips[currentTipIndex].icon}</div>
                  <p className="text-sm text-purple-800 text-right">
                    {loadingTips[currentTipIndex].text}
                  </p>
                </motion.div>
              </AnimatePresence>
              <Progress value={progressValue} className="w-full h-2 transition-all" />
            </div>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} NeshamaTech
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}