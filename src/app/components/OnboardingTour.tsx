// src/app/components/OnboardingTour.tsx
"use client";

import React, { useState, useLayoutEffect } from 'react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMediaQuery } from '@/components/questionnaire/hooks/useMediaQuery';

// הגדרת שלבי הסיור
const tourSteps = [
  {
    targetElementId: null,
    title: 'ברוכים הבאים ל-Match Point!',
    content: 'אנחנו כל כך שמחים שהצטרפתם. בסיור קצר נראה לכם איך למקסם את הסיכויים שלכם למצוא התאמה מושלמת.',
    position: 'center' as const,
  },
  {
    targetElementId: 'onboarding-target-profile-dropdown',
    title: 'הפרופיל שלכם',
    content: 'כאן נמצא הפרופיל שלכם. חשוב לשמור אותו מלא ומעודכן. פרופיל מרשים הוא המפתח למשיכת הצעות איכותיות!',
    position: 'bottom' as const,
  },
  {
    targetElementId: 'onboarding-target-availability-status',
    title: 'סטטוס זמינות',
    content: 'עדכנו כאן אם אתם פנויים להצעות או זקוקים להפסקה. זה עוזר לנו לדעת מתי לפנות אליכם.',
    position: 'bottom' as const,
  },
  {
    targetElementId: 'onboarding-target-matches-link',
    title: 'ההצעות שלכם',
    content: 'כאן יופיעו כל הצעות השידוכים שהשדכנים והמערכת יכינו עבורכם. כשתהיה הצעה חדשה, תקבלו על כך התראה.',
    position: 'bottom' as const,
  },
  {
    targetElementId: 'onboarding-target-questionnaire-button',
    title: 'שאלון ההתאמה',
    content: 'זהו הכלי החשוב ביותר שלכם! השלמת השאלון מאפשרת למנוע ה-AI שלנו למצוא עבורכם התאמות מדויקות ברמה שלא הכרתם.',
    position: 'bottom' as const,
  },
  {
    targetElementId: null,
    title: 'הכל מוכן!',
    content: 'סיימנו את הסיור. הצעד הראשון והחשוב ביותר הוא למלא את שאלון ההתאמה. בהצלחה במסע!',
    position: 'center' as const,
  },
];

const OnboardingTour = () => {
  const { isTourActive, currentStep, nextStep, prevStep, endTour } = useOnboarding();
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const isMobile = useMediaQuery("(max-width: 768px)");

  useLayoutEffect(() => {
    if (!isTourActive || isMobile) {
      setHighlightStyle({});
      return;
    }
    const stepConfig = tourSteps[currentStep - 1];
    if (stepConfig?.targetElementId) {
      const element = document.getElementById(stepConfig.targetElementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          width: rect.width + 16,
          height: rect.height + 16,
          top: rect.top - 8,
          left: rect.left - 8,
        });
      }
    } else {
      setHighlightStyle({});
    }
  }, [isTourActive, currentStep, isMobile]);

  const handleEndTour = async () => {
    endTour();
    try {
      const response = await fetch('/api/user/complete-onboarding', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to update onboarding status');
      }
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
  };

  const step = tourSteps[currentStep - 1];
  if (!isTourActive || !step) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    const position = step.position;

    if (position === 'center' || isMobile) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    
    const rect = highlightStyle as { top: number; left: number; width: number; height: number };
    
    if (!rect.top) return { display: 'none' };
  
    switch (position) {
      case 'bottom':
        return { top: rect.top + rect.height + 10, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
      // FIX: Removed the unreachable 'top' case which caused the error.
      // case 'top':
      //   return { top: rect.top - 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' };
      default:
        // This default case handles any other unforeseen positions, though none are defined.
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <AnimatePresence>
      {isTourActive && (
        <motion.div
          className="fixed inset-0 z-[2000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!isMobile && (
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {step.targetElementId && (
                    <motion.rect
                      fill="black"
                      rx="16"
                      style={highlightStyle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    />
                  )}
                </mask>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="black" opacity="0.6" mask="url(#spotlight-mask)" />
            </svg>
          )}
          {isMobile && <div className="fixed inset-0 bg-black/70"></div>}

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[2001] w-80 max-w-[90vw] bg-white p-5 rounded-xl shadow-2xl"
            style={getTooltipPosition()}
          >
            <h3 className="font-bold text-lg mb-2 text-gray-800">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
            
            <div className="flex justify-between items-center mt-6">
              <Button variant="ghost" size="sm" onClick={handleEndTour} className="text-xs text-gray-500 hover:text-gray-700">דלג</Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevStep}><ArrowRight className="w-4 h-4"/></Button>}
                {currentStep < tourSteps.length ? 
                  <Button size="sm" onClick={nextStep}>הבא <ArrowLeft className="w-4 h-4 mr-1"/></Button> :
                  <Button size="sm" onClick={handleEndTour} className="bg-emerald-600 hover:bg-emerald-700">סיום</Button>
                }
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
                {tourSteps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full mx-1 transition-all ${i === currentStep - 1 ? 'bg-cyan-500 scale-125' : 'bg-gray-300'}`}></div>
                ))}
            </div>
            
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleEndTour}>
                <X className="w-4 h-4 text-gray-400"/>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;