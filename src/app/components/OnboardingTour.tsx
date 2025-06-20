"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, Sparkles } from 'lucide-react';
import { useMediaQuery } from '@/components/questionnaire/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Define the allowed positions as a distinct type. This is the source of truth.
type StepPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

// Define the shape of a single tour step object for type safety.
type TourStep = {
    targetElementId: string | null;
    title: string;
    content: string;
    position: StepPosition;
    icon?: React.ElementType;
    path?: string;
    scrollToElement?: boolean;
};

// Apply the types to the TOUR_STEPS array and remove the now-redundant "as const".
const TOUR_STEPS: readonly TourStep[] = [
    // --- התחלה ---
    {
      targetElementId: null,
      title: 'ברוכים הבאים ל-Match Point!',
      content: 'אנחנו כל כך שמחים שהצטרפתם. בסיור קצר נראה לכם איך למקסם את הסיכויים שלכם למצוא התאמה מושלמת.',
      position: 'center',
      icon: Sparkles
    },
    // ===============================================
    // ||   חלק א': סריקת דף הבית (/) מלמעלה למטה   ||
    // ===============================================
    {
      targetElementId: 'onboarding-target-questionnaire-button',
      title: 'הצעד הראשון והחשוב ביותר',
      content: 'הכל מתחיל כאן. השלמת שאלון ההתאמה היא המפתח שיאפשר למערכת שלנו למצוא עבורך התאמות מדויקות. בהמשך נציץ פנימה.',
      position: 'top',
      path: '/',
      scrollToElement: true,
    },
    {
      targetElementId: 'onboarding-target-how-it-works',
      title: 'איך התהליך עובד?',
      content: 'כאן תוכלו לראות את כל שלבי התהליך שלנו, מהרישום ועד לקשר משמעותי. שקיפות מלאה לאורך כל הדרך.',
      position: 'top',
      path: '/',
      scrollToElement: true,
    },
    {
      targetElementId: 'onboarding-target-faq',
      title: 'שאלות נפוצות',
      content: 'יש לכם שאלות על מחירים, פרטיות או התהליך? רוב הסיכויים שהתשובה נמצאת כאן.',
      position: 'top',
      path: '/',
      scrollToElement: true,
    },
    {
      targetElementId: 'onboarding-target-chat-widget',
      title: "צ'אט עם עוזר AI",
      content: 'זקוקים לתשובה מהירה 24/7? העוזר הדיגיטלי שלנו כאן כדי לענות על שאלות כלליות.',
      position: 'top',
      path: '/',
      scrollToElement: true,
    },
    // ===============================================
    // ||      חלק ב': סריקת דף הפרופיל (/profile)    ||
    // ===============================================
    {
      targetElementId: 'onboarding-target-profile-dropdown',
      title: 'ניהול הפרופיל והחשבון',
      content: 'עכשיו בוא נכיר את מרכז הבקרה האישי שלך. מכאן תוכל לגשת לכל הכלים החשובים.',
      position: 'bottom',
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-availability-status',
      title: 'עדכון זמינות',
      content: 'עדכנו כאן אם אתם פנויים להצעות או זקוקים להפסקה. זה עוזר לשדכנים לדעת מתי לפנות אליכם.',
      position: 'bottom',
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-matches-link',
      title: 'צפייה בהצעות',
      content: 'כאן יופיעו כל הצעות השידוכים שהשדכנים והמערכת יכינו עבורכם. כשתהיה הצעה חדשה, תקבלו על כך התראה.',
      position: 'bottom',
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-messages-link',
      title: 'תקשורת עם שדכנים',
      content: 'תיבת ההודעות שלכם. כאן תתנהל כל התקשורת עם השדכנים ועם הצעות שאושרו.',
      position: 'bottom',
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-profile-card',
      title: 'כרטיס הפרופיל שלך',
      content: 'זהו הכרטיס המרכזי שלכם. הוא מסכם את הפרטים החשובים ביותר ומאפשר גישה מהירה לעריכה.',
      position: 'bottom',
      path: '/profile',
    },
    {
      targetElementId: 'onboarding-target-edit-profile',
      title: 'עריכת פרטים אישיים',
      content: 'מכאן תוכלו לערוך את כל הפרטים האישיים שלכם, כמו גיל, גובה, עיסוק ועוד. חשוב שהפרטים יהיו מדויקים.',
      position: 'bottom',
      path: '/profile?tab=overview',
    },
    {
      targetElementId: 'onboarding-target-photos',
      title: 'ניהול תמונות',
      content: 'פרופיל עם תמונות איכותיות מקבל הרבה יותר תשומת לב. כאן תוכלו להעלות, למחוק ולבחור תמונה ראשית.',
      position: 'top',
      path: '/profile?tab=photos',
    },
    {
      targetElementId: 'onboarding-target-preferences',
      title: 'הגדרת העדפות',
      content: 'זהו אזור חשוב מאוד. כאן אתם מגדירים למערכת ולשדכנים את מי אתם מחפשים. ככל שתהיו מדויקים יותר, ההצעות יהיו רלוונטיות יותר.',
      position: 'top',
      path: '/profile?tab=preferences',
    },
    {
      targetElementId: 'onboarding-target-questionnaire-tab',
      title: 'צפייה ועריכת תשובות',
      content: 'כאן תוכלו לראות את כל התשובות שעניתם בשאלון ההתאמה, לערוך אותן ולקבוע אילו מהן יהיו גלויות להצעות עתידיות.',
      position: 'top',
      path: '/profile?tab=questionnaire',
    },
    {
      targetElementId: 'onboarding-target-visibility-control',
      title: 'שליטה על פרטיות',
      content: 'אתם בשליטה מלאה! כפתור זה מאפשר לכם לקבוע האם התשובה תהיה גלויה להצעות, או תישאר חסויה לשדכנים בלבד.',
      position: 'top',
      path: '/profile?tab=questionnaire',
    },
    {
      targetElementId: 'onboarding-target-preview-profile',
      title: 'תצוגה מקדימה',
      content: 'רוצים לראות איך הפרופיל שלכם ייראה לצד השני? לחצו כאן לתצוגה מקדימה מלאה.',
      position: 'bottom',
      path: '/profile',
    },
    // ===============================================
    // ||     חלק ג': הצצה לשאלון (/questionnaire)     ||
    // ===============================================
     {
      targetElementId: 'onboarding-target-worlds-map',
      title: 'מפת העולמות בשאלון',
      content: 'עכשיו בואו נציץ בכלי החזק ביותר שלכם. השאלון מחולק ל"עולמות". כל עולם מתמקד בהיבט אחר של האישיות והחיים שלכם.',
      position: 'bottom',
      path: '/questionnaire',
    },
     {
      targetElementId: 'onboarding-target-world-card',
      title: 'כניסה לעולם',
      content: 'פשוט לחצו על כרטיס של עולם כדי להתחיל לענות על השאלות שבו. ההתקדמות שלכם נשמרת אוטומטית.',
      position: 'top',
      path: '/questionnaire',
    },
    {
      targetElementId: 'onboarding-target-progress-sidebar',
      title: 'מעקב התקדמות',
      content: 'בתוך כל עולם, תוכלו לראות כאן את רשימת השאלות, לעבור ביניהן, ולעקוב אחר ההתקדמות שלכם.',
      position: 'left',
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-question-card',
      title: 'כרטיס שאלה',
      content: 'כך נראית כל שאלה. קראו אותה בעיון וענו בכנות. התשובות שלכם הן הבסיס להתאמות האיכותיות שתקבלו.',
      position: 'top',
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-navigation-buttons',
      title: 'ניווט בין שאלות',
      content: 'השתמשו בכפתורים אלה כדי לעבור בין השאלות. בסיום כל עולם, לחצו על "סיים עולם" כדי לחזור למפת העולמות.',
      position: 'top',
      path: '/questionnaire?world=VALUES',
    },
    {
      targetElementId: 'onboarding-target-exit-map',
      title: 'חזרה למפה',
      content: 'בכל רגע נתון, תוכלו לחזור למפת העולמות כדי לבחור עולם אחר.',
      position: 'left',
      path: '/questionnaire?world=VALUES',
    },
    // --- סיום ---
    {
      targetElementId: null,
      title: 'הכל מוכן, יוצאים לדרך!',
      content: 'סיימנו את הסיור. כעת, כל מה שנותר הוא להשלים את השאלון. זכרו, ככל שתהיו מפורטים וכנים יותר, כך נוכל לעזור לכם טוב יותר. בהצלחה במסע!',
      position: 'center',
      icon: Sparkles
    },
];

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
        zIndex: 9999,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-out, left 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out'
    };
    return <motion.div style={staticStyles} animate={animatedProperties} initial={false} transition={{ type: "spring", stiffness: 350, damping: 30 }} />;
};

const TourTooltip: React.FC<{ step: TourStep; style: React.CSSProperties; totalSteps: number; currentStepIndex: number; onNext: () => void; onPrev: () => void; onEnd: () => void; finalPosition: StepPosition | null; }> = ({ step, style, totalSteps, currentStepIndex, onNext, onPrev, onEnd, finalPosition }) => {
    const { icon: Icon, title, content } = step;
    const effectivePosition = finalPosition || step.position;
    const caretClasses: { [key in StepPosition]?: string } = {
        top: "bottom-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white",
        bottom: "top-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white",
        left: "top-1/2 -translate-y-1/2 right-[-8px] border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white",
        right: "top-1/2 -translate-y-1/2 left-[-8px] border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white"
    };

    return (
        <motion.div
            className={cn("fixed z-[10000] w-[350px] max-w-[90vw] bg-white p-6 rounded-2xl shadow-2xl flex flex-col", effectivePosition === 'center' && "text-center items-center")}
            style={style}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {effectivePosition !== 'center' && <div className={cn("absolute", caretClasses[effectivePosition])}></div>}
            {Icon && <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-pink-100 flex items-center justify-center mb-4"><Icon className="w-8 h-8 text-cyan-600" /></div>}
            <h3 className="font-bold text-xl mb-3 text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{content}</p>
            <div className="flex justify-between items-center w-full mt-auto">
                <span className="text-xs font-medium text-gray-400">{currentStepIndex + 1}/{totalSteps}</span>
                <div className="flex items-center gap-2">
                    {currentStepIndex > 0 && <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={onPrev}><ArrowLeft className="w-4 h-4" /></Button>}
                    {currentStepIndex < totalSteps - 1 ? <Button size="sm" onClick={onNext} className="rounded-full px-5">הבא</Button> : <Button size="sm" onClick={onEnd} className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-5">יוצאים לדרך!</Button>}
                </div>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onEnd}><X className="w-5 h-5 text-gray-400" /></Button>
        </motion.div>
    );
};

const OnboardingTour = () => {
    const { isTourActive, currentStep, nextStep, prevStep, endTour } = useOnboarding();
    const { update: updateSession } = useSession();
    
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [isStepReady, setIsStepReady] = useState(false);
    const [finalPosition, setFinalPosition] = useState<StepPosition | null>(null);
    
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const pathname = usePathname();

    const findElement = useCallback((elementId: string, onFound: (element: HTMLElement) => void, onFail: () => void) => {
        console.log(`[Tour Polling] 🕵️‍♂️ Starting to poll for element: #${elementId}`);
        let attempts = 0;
        const maxAttempts = 25; // 25 attempts * 200ms = 5 seconds
        
        const immediateElement = document.getElementById(elementId);
        if (immediateElement) {
            console.log(`[Tour Polling] ✅ Found #${elementId} immediately on first try!`);
            onFound(immediateElement);
            return () => {};
        }

        const intervalId = setInterval(() => {
            const element = document.getElementById(elementId);
            attempts++;
            
            if (element) {
                console.log(`[Tour Polling] ✅ Found #${elementId} after ${attempts} attempts.`);
                clearInterval(intervalId);
                onFound(element);
            } else {
                console.log(`[Tour Polling]... attempt #${attempts} for #${elementId} failed.`);
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.error(`[Tour Polling] ❌ FAILED: Element #${elementId} not found after ${maxAttempts} attempts (5 seconds).`);
                    onFail();
                }
            }
        }, 200);

        return () => {
            console.log(`[Tour Polling] 🧹 Cleaning up interval for #${elementId}.`);
            clearInterval(intervalId);
        };
    }, []);

    const handleEndTour = useCallback(async () => {
        endTour(); 
        try {
            await fetch('/api/user/complete-onboarding', { method: 'POST' });
            await updateSession();
        } catch (error) {
            console.error("Error completing onboarding:", error);
        }
    }, [endTour, updateSession]);

    // useEffect המלא והמתוקן עם בדיקת הנראות
    useEffect(() => {
        if (!isTourActive || currentStep === 0) {
            // התיקון: הסרת התנאי המיותר. קריאה זו היא אידמפוטנטית
            // (קריאה חוזרת עם אותו ערך לא גורמת לרינדור מחדש)
            // ולכן אינה דורשת את isStepReady במערך התלויות.
            setIsStepReady(false);
            return;
        }

        const stepConfig = TOUR_STEPS[currentStep - 1];
        if (!stepConfig) {
            handleEndTour();
            return;
        }

        setIsStepReady(false);

        const targetPath = stepConfig.path?.split('?')[0];
        const currentPath = pathname.split('?')[0];

        if (stepConfig.path && targetPath !== currentPath) {
            router.push(stepConfig.path);
            return;
        }

        const processStep = () => {
            if (!stepConfig.targetElementId) {
                setTargetRect(null);
                setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
                setFinalPosition('center');
                setIsStepReady(true);
                return () => {};
            }

            return findElement(
                stepConfig.targetElementId,
                (element) => { // onFound
                    const setupPosition = () => {
                        const rect = element.getBoundingClientRect();
                        
                        console.log(`[Tour Geometry] Element #${element.id} BoundingRect:`, { top: rect.top, left: rect.left, width: rect.width, height: rect.height });

                        if (rect.width === 0 && rect.height === 0 && stepConfig.targetElementId !== null) {
                            console.error(`[Tour Geometry] ❌ ERROR: Element #${element.id} was found in DOM, but has no dimensions! It's likely invisible. Skipping step.`);
                            nextStep();
                            return;
                        }

                        const TOOLTIP_WIDTH = 350;
                        const PADDING = 15;
                        // Because stepConfig.position is now correctly typed as StepPosition, 'pos' will
                        // have the correct wide type, and the switch statement will no longer error.
                        let pos: StepPosition = stepConfig.position;
                        if (isMobile) pos = 'bottom';
                        
                        let style: React.CSSProperties = {};
                        switch (pos) {
                            case 'bottom': style = { top: rect.bottom + PADDING, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }; break;
                            case 'top':    style = { top: rect.top - PADDING,     left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }; break;
                            case 'left':   style = { top: rect.top + rect.height / 2, left: rect.left - PADDING, transform: 'translate(-100%, -50%)' }; break;
                            case 'right':  style = { top: rect.top + rect.height / 2, left: rect.right + PADDING, transform: 'translateY(-50%)' }; break;
                        }

                        const baseLeft = (style.left as number) || (window.innerWidth / 2);
                        const halfWidth = TOOLTIP_WIDTH / 2;
                        if (pos === 'top' || pos === 'bottom') {
                            if (baseLeft - halfWidth < PADDING) style.left = PADDING + halfWidth;
                            else if (baseLeft + halfWidth > window.innerWidth - PADDING) style.left = window.innerWidth - PADDING - halfWidth;
                        }
                        
                        setTargetRect(rect); // עדכון targetRect כאן
                        setFinalPosition(pos);
                        setTooltipStyle(style);
                        setIsStepReady(true);
                    };

                    const isElementInView = (el: HTMLElement) => {
                        const rect = el.getBoundingClientRect();
                        return rect.top >= 0 && rect.bottom <= window.innerHeight;
                    };

                    if (stepConfig.scrollToElement || !isElementInView(element)) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(setupPosition, 700);
                    } else {
                        setupPosition();
                    }
                },
                () => { // onFail
                    console.error(`Tour element not found: #${stepConfig.targetElementId}, skipping step.`);
                    nextStep();
                }
            );
        };

        const cleanup = processStep();
        return cleanup;

    }, [isTourActive, currentStep, pathname, findElement, handleEndTour, isMobile, nextStep, router]);
    
    if (!isTourActive || !isStepReady || currentStep === 0) {
        return null;
    }
    
    const step = TOUR_STEPS[currentStep - 1];
    if (!step) return null;

    return (
        <div className="fixed inset-0 z-[9990]" aria-live="polite">
            <AnimatePresence>
              {targetRect && !isMobile ? 
                <SpotlightHighlight key={`spotlight-${currentStep}`} rect={targetRect} padding={8} /> : 
                <motion.div key={`backdrop-${currentStep}`} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              }
              <TourTooltip 
                key={`tooltip-${currentStep}`}
                step={step} 
                style={tooltipStyle} 
                totalSteps={TOUR_STEPS.length} 
                currentStepIndex={currentStep - 1} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onEnd={handleEndTour} 
                finalPosition={finalPosition} 
              />
            </AnimatePresence>
        </div>
    );
};
 
export default OnboardingTour;