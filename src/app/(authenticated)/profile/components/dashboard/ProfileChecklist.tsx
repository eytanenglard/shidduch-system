// ProfileChecklist.tsx

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { CheckCircle, User, BookOpen, Camera, Target, ChevronUp, ChevronDown, Sparkles, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import type { User as SessionUserType } from '@/types/next-auth';
// ✅✅✅ ייבוא QuestionnaireResponse מהמקום הנכון. הוא מכיל את שדות ה-JSON.
import type { QuestionnaireResponse } from '@/types/next-auth';

// Helper Types & Constants
const QUESTION_COUNTS: Record<'VALUES' | 'PERSONALITY' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION', number> = {
    VALUES: 19, PERSONALITY: 19, RELATIONSHIP: 19, PARTNER: 17, RELIGION: 19
};

const WORLD_NAMES_MAP = {
    values: 'ערכים', personality: 'אישיות', relationship: 'זוגיות', partner: 'פרטנר', religion: 'דת ומסורת'
} as const;

type WorldKey = keyof typeof WORLD_NAMES_MAP;

interface ChecklistItemProps {
    id: string;
    isCompleted: boolean;
    title: string;
    description: string;
    link?: string;
    onClick?: () => void;
    icon: React.ElementType;
    missingItems?: string[];
    worldProgress?: { world: string; completed: number; total: number; isDone: boolean }[];
    isActive: boolean;
    setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
    id, isCompleted, title, description, link, onClick, icon: Icon,
    missingItems, worldProgress, isActive, setActiveItemId
}) => {
    const canExpand = (missingItems && missingItems.length > 0) || (worldProgress && worldProgress.length > 0);
    const isExpanded = isActive && canExpand;

    const handleInteraction = () => {
        if (isCompleted) return;
        if (onClick) {
            onClick();
        } else if (canExpand && !link) {
            setActiveItemId(prev => (prev === id ? null : id));
        }
    };
    
    const cardContent = (
      <>
        <div className="relative w-full flex justify-center mb-3">
            <div className={cn(
                "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                isCompleted ? "bg-emerald-100 shadow-emerald-500/10" : "bg-cyan-100 shadow-cyan-500/10"
            )}>
                <Icon className={cn("w-7 h-7 transition-colors duration-300", isCompleted ? "text-emerald-500" : "text-cyan-600")} />
            </div>
            {isCompleted && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }} className="absolute -top-1 -right-1">
                    <CheckCircle className="w-5 h-5 text-emerald-500 bg-white rounded-full p-0.5" fill="white" />
                </motion.div>
            )}
        </div>
        <h4 className={cn("font-bold text-sm text-center transition-colors", isCompleted ? 'text-gray-400 line-through' : 'text-gray-800')}>{title}</h4>
        {!isCompleted && <p className="text-xs text-center text-gray-500 mt-1 leading-tight h-8">{description}</p>}
      </>
    );

    const interactiveContent = (
      link && !isCompleted ? (
        <Link href={link} passHref legacyBehavior>
          <a className="block h-full w-full">{cardContent}</a>
        </Link>
      ) : (
        <button onClick={handleInteraction} className="h-full w-full text-left" disabled={isCompleted}>{cardContent}</button>
      )
    );

    return (
        <motion.div
            layout
            onMouseEnter={() => canExpand && setActiveItemId(id)}
            className={cn(
                "relative flex flex-col rounded-2xl transition-all duration-300 group overflow-hidden",
                isCompleted ? 'bg-white/40' : 'bg-white/70 shadow-md',
                isExpanded && "shadow-xl bg-white"
            )}
        >
            <div className={cn("p-4", !isCompleted && "cursor-pointer")}>
                {interactiveContent}
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-3 text-sm">
                            <h4 className="font-semibold text-xs mb-2 text-gray-800">מה חסר להשלמת השלב?</h4>
                            {missingItems && (<ul className="list-disc pr-4 space-y-1.5 text-gray-600 text-xs">{missingItems.map(item => <li key={item}>{item}</li>)}</ul>)}
                            {worldProgress && (<div className="space-y-2">{worldProgress.map(world => (<div key={world.world} className="flex items-center justify-between text-xs"><span className={cn("font-medium", world.isDone ? "text-emerald-600" : "text-gray-700")}>{world.world}</span><div className="flex items-center gap-2"><span className="font-mono text-xs">{world.completed}/{world.total}</span>{world.isDone && <CheckCircle className="h-4 w-4 text-emerald-500" />}</div></div>))}</div>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface ProfileChecklistProps {
  user: SessionUserType;
  hasSeenPreview: boolean;
  onPreviewClick: () => void;
  questionnaireResponse: QuestionnaireResponse | null;
}

export const ProfileChecklist: React.FC<ProfileChecklistProps> = ({ user, onPreviewClick, hasSeenPreview, questionnaireResponse }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const getMissingItems = useMemo(() => {
        const p = user.profile;
        if (!p) return { personalDetails: [], partnerPreferences: [] };
        return {
            personalDetails: [
                (!p.about || p.about.trim().length < 100) && 'כתיבת "קצת עליי" (100+ תווים)',
                !p.height && 'גובה', !p.maritalStatus && 'מצב משפחתי', !p.city && 'עיר מגורים',
                !p.occupation && 'עיסוק', !p.educationLevel && 'רמת השכלה', !p.origin && 'מוצא/עדה',
                !p.religiousLevel && 'רמה דתית', !p.serviceType && 'סוג שירות צבאי/לאומי',
                (!p.profileHobbies || p.profileHobbies.length === 0) && 'תחביבים',
                (!p.profileCharacterTraits || p.profileCharacterTraits.length === 0) && 'תכונות אופי',
            ].filter((item): item is string => !!item),
            
            partnerPreferences: [
                (!p.preferredAgeMin || !p.preferredAgeMax) && 'טווח גילאים מועדף',
                (!p.preferredHeightMin || !p.preferredHeightMax) && 'טווח גובה מועדף',
                (!p.preferredReligiousLevels || p.preferredReligiousLevels.length === 0) && 'רמות דתיות מועדפות',
                (!p.preferredLocations || p.preferredLocations.length === 0) && 'אזורי מגורים מועדפים',
                (!p.preferredMaritalStatuses || p.preferredMaritalStatuses.length === 0) && 'מצב משפחתי מועדף',
                !p.preferredShomerNegiah && 'העדפת שמירת נגיעה',
                !p.preferredPartnerHasChildren && 'העדפה לגבי ילדים מקשר קודם',
                (!p.preferredCharacterTraits || p.preferredCharacterTraits.length === 0) && 'תכונות אופי מועדפות',
                (!p.preferredHobbies || p.preferredHobbies.length === 0) && 'תחביבים מועדפים',
            ].filter((item): item is string => !!item),
        };
    }, [user.profile]);

    // ✅✅✅ *** קוד משופר וחסין תקלות *** ✅✅✅
    const questionnaireProgress = useMemo(() => {
        // פונקציית עזר בטוחה לספירת תשובות ממערך
        const getAnswerCountFromJsonArray = (jsonValue: unknown): number => {
            if (Array.isArray(jsonValue)) {
                return jsonValue.length;
            }
            return 0; // אם המידע אינו מערך (או null/undefined), נחזיר 0
        };

        // אם אין אובייקט תשובות כלל, נחזיר 0 התקדמות לכל העולמות.
        if (!questionnaireResponse) {
            return (Object.keys(WORLD_NAMES_MAP) as WorldKey[]).map(key => ({
                world: WORLD_NAMES_MAP[key],
                completed: 0,
                total: QUESTION_COUNTS[key.toUpperCase() as keyof typeof QUESTION_COUNTS],
                isDone: false,
            }));
        }

        const qr = questionnaireResponse;

        return (Object.keys(WORLD_NAMES_MAP) as WorldKey[]).map(key => {
            const uppercaseKey = key.toUpperCase() as keyof typeof QUESTION_COUNTS;
            const answersFieldKey = `${key}Answers` as keyof QuestionnaireResponse;
            
            // סופר את התשובות מהשדה הספציפי של ה-JSON באמצעות פונקציית העזר
            const completedCount = getAnswerCountFromJsonArray(qr[answersFieldKey]);

            return {
                world: WORLD_NAMES_MAP[key],
                completed: completedCount,
                total: QUESTION_COUNTS[uppercaseKey],
                // קובע אם העולם הושלם על פי המערך `worldsCompleted`
                isDone: qr.worldsCompleted?.includes(uppercaseKey) ?? false,
            };
        });
    }, [questionnaireResponse]);
    // ------------------------------------------

    const questionnaireCompleted = questionnaireResponse?.completed ?? false;
    
    const tasks = [
        { id: 'photo', isCompleted: (user.images?.length ?? 0) >= 3, title: 'העלאת תמונות', description: 'הכרטיס ביקור הראשוני שלך.', link: '/profile?tab=photos', icon: Camera, missingItems: (user.images?.length ?? 0) < 3 ? [`נדרשות לפחות 3 תמונות (הועלו: ${user.images?.length ?? 0})`] : [] },
        { id: 'personal_details', isCompleted: getMissingItems.personalDetails.length === 0, title: 'פרטים אישיים', description: 'הבסיס להכיר אותך לעומק.', link: '/profile?tab=overview', icon: User, missingItems: getMissingItems.personalDetails },
        { id: 'partner_preferences', isCompleted: getMissingItems.partnerPreferences.length === 0, title: 'העדפות בן/בת זוג', description: 'לדייק את מי שמחפשים.', link: '/profile?tab=preferences', icon: Target, missingItems: getMissingItems.partnerPreferences },
        { id: 'questionnaire', isCompleted: questionnaireCompleted, title: 'שאלון התאמה', description: 'המפתח להתאמות AI.', link: '/questionnaire', icon: BookOpen, worldProgress: questionnaireProgress ?? undefined },
        { id: 'review', isCompleted: hasSeenPreview, title: 'תצוגה מקדימה', description: 'לראות איך אחרים רואים אותך.', onClick: onPreviewClick, icon: Edit3, missingItems: !hasSeenPreview ? ['יש לצפות בתצוגה המקדימה של הפרופיל'] : [] },
    ];

    const completedCount = tasks.filter(t => t.isCompleted).length;
    const isAllComplete = completedCount === tasks.length;
    const completionPercentage = Math.round((completedCount / tasks.length) * 100);

    return (
        <AnimatePresence>
            <motion.div layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }} transition={{ duration: 0.5, ease: "easeOut" }} className="mb-8 rounded-3xl shadow-xl border border-white/50 bg-white/70 backdrop-blur-md overflow-hidden">
                <div className="p-4 sm:p-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 text-center md:text-right">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
                                {isAllComplete && <Sparkles className="w-6 h-6 text-amber-500" />}
                                {isAllComplete ? `כל הכבוד, ${user.firstName}! הפרופיל שלך מושלם!` : `ברוך הבא, ${user.firstName}! בוא נכין את הפרופיל שלך להצלחה`}
                            </h2>
                            <AnimatePresence initial={false}>
                                {!isMinimized && (<motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: '0.25rem' }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-slate-600 text-sm md:text-base overflow-hidden">{isAllComplete ? 'השלמת את כל השלבים. פרופיל עשיר הוא המפתח למציאת ההתאמה המדויקת ביותר.' : 'השלמת הצעדים הבאים תקדם אותך משמעותית למציאת התאמה.'}</motion.p>)}
                            </AnimatePresence>
                        </div>
                        <div className="mt-4 md:mt-0 md:w-auto lg:w-1/3 flex items-center gap-4">
                             <div className="flex-1">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-medium text-gray-700">השלמת הפרופיל</span>
                                    <span className="font-bold text-cyan-600">{completionPercentage}%</span>
                                </div>
                                <Progress value={completionPercentage} className="h-2 bg-slate-200/70" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-200/50 rounded-full flex-shrink-0" onClick={() => setIsMinimized(!isMinimized)} aria-label={isMinimized ? "הרחב" : "מזער"}>
                                {isMinimized ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                    <AnimatePresence initial={false}>
                        {!isMinimized && (
                            <motion.div key="checklist-content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1, transition: { opacity: { delay: 0.1 } } }} exit={{ height: 0, opacity: 0, transition: { duration: 0.3 } }} className="overflow-hidden" onMouseLeave={() => setActiveItemId(null)}>
                                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                                    {tasks.map((task) => (<ChecklistItem key={task.id} {...task} isActive={activeItemId === task.id} setActiveItemId={setActiveItemId} />))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};