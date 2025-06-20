"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useMediaQuery } from '@/components/questionnaire/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// --- הגדרות הסיור (נשאר זהה) ---
const TOUR_STEPS = [
    // ... (מערך השלבים נשאר זהה לקודם) ...
    // --- שלב 1: פתיחה ---
    {
      targetElementId: null,
      title: 'ברוכים הבאים ל-Match Point!',
      content: 'אנחנו כל כך שמחים שהצטרפתם. בסיור קצר נראה לכם איך למקסם את הסיכויים שלכם למצוא התאמה מושלמת.',
      position: 'center' as const,
      icon: Sparkles
    },
    
    // --- שלבים 2-5: ניווט בסיסי (Navbar) ---
    {
      targetElementId: 'onboarding-target-profile-dropdown',
      title: 'הפרופיל שלכם (1/4)',
      content: 'כאן נמצא הפרופיל שלכם. חשוב לשמור אותו מלא ומעודכן. פרופיל מרשים הוא המפתח למשיכת הצעות איכותיות!',
      position: 'bottom' as const,
    },
    {
      targetElementId: 'onboarding-target-availability-status',
      title: 'סטטוס זמינות (2/4)',
      content: 'עדכנו כאן אם אתם פנויים להצעות או זקוקים להפסקה. זה עוזר לשדכנים לדעת מתי לפנות אליכם.',
      position: 'bottom' as const,
    },
    {
      targetElementId: 'onboarding-target-matches-link',
      title: 'ההצעות שלכם (3/4)',
      content: 'כאן יופיעו כל הצעות השידוכים שהשדכנים והמערכת יכינו עבורכם. כשתהיה הצעה חדשה, תקבלו על כך התראה.',
      position: 'bottom' as const,
    },
     {
      targetElementId: 'onboarding-target-messages-link',
      title: 'הודעות (4/4)',
      content: 'תיבת ההודעות שלכם. כאן תתנהל כל התקשורת עם השדכנים ועם הצעות שאושרו.',
      position: 'bottom' as const,
    },
  
    // --- שלבים 6-8: דף הבית (הצצה כללית) ---
     {
      targetElementId: 'onboarding-target-how-it-works',
      title: 'איך זה עובד?',
      content: 'כאן תוכלו לראות את שלבי התהליך שלנו, החל מהרישום ועד לבניית קשר משמעותי. שקיפות מלאה לאורך כל הדרך.',
      position: 'top' as const,
      scrollToElement: true,
      path: '/',
    },
     {
      targetElementId: 'onboarding-target-faq',
      title: 'שאלות נפוצות',
      content: 'יש לכם שאלות על התהליך, המחירים או הפרטיות? סביר להניח שהתשובה נמצאת כאן. שווה לבדוק!',
      position: 'top' as const,
      scrollToElement: true,
      path: '/',
    },
    {
      targetElementId: 'onboarding-target-chat-widget',
      title: 'צ\'אט עם עוזר AI',
      content: 'זקוקים לתשובה מהירה? העוזר הדיגיטלי שלנו זמין לענות על שאלות כלליות 24/7.',
      position: 'top' as const,
      scrollToElement: true,
      path: '/',
    },
  
    // --- שלבים 9-15: דף הפרופיל (הלב של המערכת) ---
    {
      targetElementId: 'onboarding-target-profile-card',
      title: 'כרטיס הפרופיל שלכם',
      content: 'זהו הכרטיס המרכזי שלכם. הוא מסכם את הפרטים החשובים ביותר ומאפשר גישה מהירה לעריכה.',
      position: 'bottom' as const,
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-edit-profile',
      title: 'עריכת פרטים אישיים',
      content: 'מכאן תוכלו לערוך את כל הפרטים האישיים שלכם, כמו גיל, גובה, עיסוק ועוד. חשוב שהפרטים יהיו מדויקים.',
      position: 'bottom' as const,
      path: '/profile',
    },
      {
      targetElementId: 'onboarding-target-photos',
      title: 'ניהול תמונות',
      content: 'פרופיל עם תמונות איכותיות מקבל הרבה יותר תשומת לב. כאן תוכלו להעלות, למחוק ולבחור תמונה ראשית.',
      position: 'top' as const,
      path: '/profile?tab=photos',
    },
    {
      targetElementId: 'onboarding-target-preferences',
      title: 'הגדרת העדפות',
      content: 'זהו אזור חשוב מאוד. כאן אתם מגדירים למערכת ולשדכנים את מי אתם מחפשים. ככל שתהיו מדויקים יותר, ההצעות יהיו רלוונטיות יותר.',
      position: 'top' as const,
      path: '/profile?tab=preferences',
    },
     {
      targetElementId: 'onboarding-target-questionnaire-tab',
      title: 'תשובות לשאלון',
      content: 'כאן תוכלו לראות את כל התשובות שעניתם בשאלון ההתאמה, לערוך אותן ולקבוע אילו מהן יהיו גלויות להצעות עתידיות.',
      position: 'top' as const,
      path: '/profile?tab=questionnaire',
    },
    {
      targetElementId: 'onboarding-target-visibility-control',
      title: 'שליטה על פרטיות',
      content: 'אתם בשליטה מלאה! ליד כל תשובה מהשאלון יש כפתור כזה. הוא מאפשר לכם לקבוע האם התשובה תהיה גלויה להצעות, או תישאר חסויה לשדכנים בלבד.',
      position: 'top' as const,
      path: '/profile?tab=questionnaire',
    },
    {
      targetElementId: 'onboarding-target-preview-profile',
      title: 'תצוגה מקדימה',
      content: 'רוצים לראות איך הפרופיל שלכם ייראה לצד השני? לחצו כאן לתצוגה מקדימה מלאה.',
      position: 'bottom' as const,
      path: '/profile',
    },
  
    // --- שלבים 16-22: שאלון ההתאמה (הכלי המרכזי) ---
    {
      targetElementId: 'onboarding-target-questionnaire-button',
      title: 'שאלון ההתאמה - הצעד הבא',
      content: 'הגיע הזמן לכלי החשוב ביותר שלכם! השלמת השאלון מאפשרת למנוע ה-AI שלנו למצוא עבורכם התאמות מדויקות ברמה שלא הכרתם. בואו נציץ פנימה.',
      position: 'top' as const,
      path: '/',
      nextPath: '/questionnaire',
    },
     {
      targetElementId: 'onboarding-target-worlds-map',
      title: 'מפת העולמות',
      content: 'השאלון מחולק ל"עולמות" שונים. כל עולם מתמקד בהיבט אחר של האישיות והחיים שלכם. אתם יכולים למלא אותם בכל סדר שתרצו.',
      position: 'bottom' as const,
      path: '/questionnaire',
    },
     {
      targetElementId: 'onboarding-target-world-card',
      title: 'כניסה לעולם',
      content: 'פשוט לחצו על כרטיס של עולם כדי להתחיל לענות על השאלות שבו. ההתקדמות שלכם נשמרת אוטומטית.',
      position: 'top' as const,
      path: '/questionnaire',
    },
     {
      targetElementId: 'onboarding-target-progress-sidebar',
      title: 'מעקב התקדמות',
      content: 'בתוך כל עולם, תוכלו לראות כאן את רשימת השאלות, לעבור ביניהן, ולעקוב אחר ההתקדמות שלכם.',
      position: 'left' as const,
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-question-card',
      title: 'כרטיס שאלה',
      content: 'כך נראית כל שאלה. קראו אותה בעיון וענו בכנות. התשובות שלכם הן הבסיס להתאמות האיכותיות שתקבלו.',
      position: 'top' as const,
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-navigation-buttons',
      title: 'ניווט בין שאלות',
      content: 'השתמשו בכפתורים אלה כדי לעבור בין השאלות. בסיום כל עולם, לחצו על "סיים עולם" כדי לחזור למפת העולמות.',
      position: 'top' as const,
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-exit-map',
      title: 'חזרה למפה',
      content: 'בכל רגע נתון, תוכלו לחזור למפת העולמות כדי לבחור עולם אחר.',
      position: 'left' as const,
      path: '/questionnaire?world=VALUES',
    },
  
    // --- שלב 23: סיום ---
    {
      targetElementId: null,
      title: 'הכל מוכן, יוצאים לדרך!',
      content: 'סיימנו את הסיור. כעת, כל מה שנותר הוא להשלים את השאלון. זכרו, ככל שתהיו מפורטים וכנים יותר, כך נוכל לעזור לכם טוב יותר. בהצלחה במסע!',
      position: 'center' as const,
      icon: Sparkles
    },
];

type StepPosition = (typeof TOUR_STEPS)[number]['position'];

// --- רכיבי עזר וקומפוננטות UI ---

const SpotlightHighlight: React.FC<{ rect: DOMRect | null; padding: number }> = ({ rect, padding }) => {
    if (!rect) return null;

    const animatedProperties = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
    };

    const staticStyles: React.CSSProperties = {
        position: 'fixed',
        borderRadius: '16px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        pointerEvents: 'none',
        zIndex: 2001,
    };

    return (
        <motion.div
            className="spotlight-highlight"
            style={staticStyles}
            animate={animatedProperties}
            initial={false}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
    );
};

const TourTooltip: React.FC<{
    step: (typeof TOUR_STEPS)[number];
    style: React.CSSProperties;
    totalSteps: number;
    currentStepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onEnd: () => void;
    finalPosition: StepPosition | null; // <-- שינוי: קבלת המיקום הסופי
}> = ({ step, style, totalSteps, currentStepIndex, onNext, onPrev, onEnd, finalPosition }) => {
    const { icon: Icon, title, content } = step;
    const effectivePosition = finalPosition || step.position; // <-- שינוי: שימוש במיקום הסופי

    const caretClasses: { [key in StepPosition]?: string } = {
        top: "bottom-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white",
        bottom: "top-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white",
        left: "top-1/2 -translate-y-1/2 right-[-8px] border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white",
    };

    return (
        <motion.div
            key={currentStepIndex}
            className={cn(
                "absolute z-[2002] w-[350px] max-w-[90vw] bg-white p-6 rounded-2xl shadow-2xl flex flex-col",
                effectivePosition === 'center' && "text-center items-center"
            )}
            style={style}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {/* <-- שינוי: שימוש במיקום הסופי עבור החץ --> */}
            {effectivePosition !== 'center' && <div className={cn("absolute", caretClasses[effectivePosition])}></div>}
            
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-pink-100 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-cyan-600" />
                </div>
            )}
            
            <h3 className="font-bold text-xl mb-3 text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{content}</p>
            
            <div className="flex justify-between items-center w-full mt-auto">
                <span className="text-xs font-medium text-gray-400">
                    {currentStepIndex + 1}/{totalSteps}
                </span>
                <div className="flex items-center gap-2">
                    {currentStepIndex > 0 && <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={onPrev}><ArrowLeft className="w-4 h-4"/></Button>}
                    {currentStepIndex < totalSteps - 1 ? 
                        <Button size="sm" onClick={onNext} className="rounded-full px-5">הבא</Button> :
                        <Button size="sm" onClick={onEnd} className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-5">יוצאים לדרך!</Button>
                    }
                </div>
            </div>
            
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onEnd}>
                <X className="w-5 h-5 text-gray-400"/>
            </Button>
        </motion.div>
    );
};


// --- רכיב הסיור הראשי ---
const OnboardingTour = () => {
    const { isTourActive, currentStep, nextStep, prevStep, endTour } = useOnboarding();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [isStepReady, setIsStepReady] = useState(false);
    const [finalPosition, setFinalPosition] = useState<StepPosition | null>(null); // <-- שינוי: state למיקום הסופי
    const { update } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const pathname = usePathname();

    const findElement = useCallback((elementId: string, onFound: (element: HTMLElement) => void, onFail: () => void) => {
        let retries = 0;
        const maxRetries = 500; 
        let animationFrameId: number;

        const attempt = () => {
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`%cOnboarding Tour: Element FOUND - ${elementId}`, 'color: #22c55e'); // הוספת לוג לאיתור מוצלח
                onFound(element);
            } else if (retries < maxRetries) {
                retries++;
                animationFrameId = requestAnimationFrame(attempt);
            } else {
                console.error(`Onboarding Tour: Element NOT FOUND after ${maxRetries} retries - ${elementId}`); // הוספת לוג לכישלון
                onFail();
            }
        };
        attempt();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    const handleEndTour = useCallback(async () => {
        // 1. סגור את הסיור באופן מיידי בצד הלקוח
        endTour(); 
        
        try {
            // 2. שלח את העדכון לשרת
            const response = await fetch('/api/user/complete-onboarding', { method: 'POST' });
            
            if (!response.ok) {
                throw new Error('Failed to update onboarding status on the server.');
            }
            
            console.log("Onboarding status updated on server.");

            // 3. רענן את הסשן של המשתמש כדי לקבל את הדגל המעודכן
            //    זהו השלב הקריטי שהיה חסר
            await update();
            console.log("Client session updated.");

        } catch (error) {
            console.error("Error completing the onboarding process:", error);
        }
    }, [endTour, update]); // <--- הוסף את update לתלות


    useEffect(() => {
        if (!isTourActive || currentStep === 0) {
            setIsStepReady(false);
            return;
        }

        const stepIndex = currentStep - 1;
        const stepConfig = TOUR_STEPS[stepIndex];

        if (!stepConfig) {
            handleEndTour();
            return;
        }

        const targetPath = stepConfig.path?.split('?')[0];
        const currentPath = pathname.split('?')[0];

        if (targetPath && currentPath !== targetPath) {
            setIsStepReady(false);
            router.push(stepConfig.path!);
            return;
        }

        // <-- שינוי: פונקציית מיקום חדשה וחכמה -->
        const getPosition = (rect: DOMRect | null, preferredPosition: StepPosition) => {
            const TOOLTIP_WIDTH = 350;
            const TOOLTIP_ESTIMATED_HEIGHT = 250;
            const PADDING = 15;

            if (!rect || preferredPosition === 'center' || isMobile) {
                return { pos: 'center' as const, style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } };
            }

            let pos = preferredPosition;
            
            if (pos === 'top' && (rect.top - TOOLTIP_ESTIMATED_HEIGHT - PADDING < 0)) {
                pos = 'bottom';
            } else if (pos === 'bottom' && (rect.bottom + TOOLTIP_ESTIMATED_HEIGHT + PADDING > window.innerHeight)) {
                if (rect.top - TOOLTIP_ESTIMATED_HEIGHT - PADDING >= 0) {
                    pos = 'top';
                } else {
                    pos = 'bottom'; // Fallback
                }
            }
            
            let style: React.CSSProperties = {};
            switch (pos) {
                case 'bottom': style = { top: rect.bottom + PADDING, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }; break;
                case 'top': style = { top: rect.top - PADDING, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }; break;
                case 'left': style = { top: rect.top + rect.height / 2, left: rect.left - PADDING, transform: 'translate(-100%, -50%)' }; break;
            }
            
            const baseLeft = style.left as number;
            const halfWidth = TOOLTIP_WIDTH / 2;
            if (baseLeft - halfWidth < PADDING) {
                style.left = PADDING + halfWidth;
            } else if (baseLeft + halfWidth > window.innerWidth - PADDING) {
                style.left = window.innerWidth - PADDING - halfWidth;
            }

            return { pos, style };
        };

        const processStep = () => {
            if (!stepConfig.targetElementId) {
                setTargetRect(null);
                const { pos, style } = getPosition(null, 'center');
                setFinalPosition(pos);
                setTooltipStyle(style);
                setIsStepReady(true);
                return;
            }

            const cleanupFinder = findElement(
                stepConfig.targetElementId,
                (element) => {
                    const setupPosition = () => {
                        const rect = element.getBoundingClientRect();
                        setTargetRect(rect);
                        const { pos, style } = getPosition(rect, stepConfig.position);
                        setFinalPosition(pos);
                        setTooltipStyle(style);
                        setIsStepReady(true);
                    };

                    if (stepConfig.scrollToElement) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(setupPosition, 400); 
                    } else {
                        setupPosition();
                    }
                },
                () => {
                    nextStep();
                }
            );
            return cleanupFinder;
        };

        setIsStepReady(false);
        const cleanup = processStep();
        return cleanup;

    }, [isTourActive, currentStep, pathname, isMobile, findElement, router, nextStep, handleEndTour]);
    
    if (!isTourActive || !isStepReady || currentStep === 0) {
        return null;
    }
    
    const step = TOUR_STEPS[currentStep - 1];

    return (
        <div className="fixed inset-0 z-[2000]" aria-live="polite">
            <AnimatePresence>
              {isMobile ? 
                <motion.div 
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                /> : 
                <SpotlightHighlight rect={targetRect} padding={8} />
              }

              <TourTooltip 
                step={step} 
                style={tooltipStyle}
                totalSteps={TOUR_STEPS.length}
                currentStepIndex={currentStep - 1}
                onNext={nextStep}
                onPrev={prevStep}
                onEnd={handleEndTour}
                finalPosition={finalPosition} // <-- שינוי: העברת המיקום הסופי
              />
            </AnimatePresence>
        </div>
    );
};
 
export default OnboardingTour;