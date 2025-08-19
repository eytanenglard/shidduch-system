// src/components/dashboard/ProfileChecklist.tsx

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  User,
  BookOpen,
  Camera,
  Target,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { User as SessionUserType } from '@/types/next-auth';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { Gender } from '@prisma/client';

// Helper Types & Constants
const QUESTION_COUNTS: Record<
  'VALUES' | 'PERSONALITY' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION',
  number
> = {
  VALUES: 19,
  PERSONALITY: 19,
  RELATIONSHIP: 19,
  PARTNER: 17,
  RELIGION: 19,
};

const WORLD_NAMES_MAP = {
  values: 'ערכים',
  personality: 'אישיות',
  relationship: 'זוגיות',
  partner: 'פרטנר',
  religion: 'דת ומסורת',
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
  worldProgress?: {
    world: string;
    completed: number;
    total: number;
    isDone: boolean;
  }[];
  isActive: boolean;
  setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  isCompleted,
  title,
  description,
  link,
  onClick,
  icon: Icon,
  missingItems,
  worldProgress,
  isActive,
  setActiveItemId,
}) => {
  const canExpand =
    (missingItems && missingItems.length > 0) ||
    (worldProgress && worldProgress.length > 0);
  const isExpanded = isActive && canExpand;

  const handleInteraction = () => {
    if (isCompleted) return;
    if (onClick) {
      onClick();
    } else if (canExpand && !link) {
      setActiveItemId((prev) => (prev === id ? null : id));
    }
  };

  const cardContent = (
    <>
      <div className="relative w-full flex justify-center mb-3">
        <div
          className={cn(
            'relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 transform group-hover:scale-110',
            isCompleted
              ? 'bg-emerald-100 shadow-emerald-500/10'
              : 'bg-cyan-100 shadow-cyan-500/10'
          )}
        >
          <Icon
            className={cn(
              'w-7 h-7 transition-colors duration-300',
              isCompleted ? 'text-emerald-500' : 'text-cyan-600'
            )}
          />
        </div>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              delay: 0.2,
            }}
            className="absolute -top-1 -right-1"
          >
            <CheckCircle
              className="w-5 h-5 text-emerald-500 bg-white rounded-full p-0.5"
              fill="white"
            />
          </motion.div>
        )}
      </div>
      <h4
        className={cn(
          'font-bold text-sm text-center transition-colors',
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'
        )}
      >
        {title}
      </h4>
      {!isCompleted && (
        <p className="text-xs text-center text-gray-500 mt-1 leading-tight h-8">
          {description}
        </p>
      )}
    </>
  );

  const interactiveContent =
    link && !isCompleted ? (
      <Link href={link} passHref legacyBehavior>
        <a className="block h-full w-full">{cardContent}</a>
      </Link>
    ) : (
      <button
        onClick={handleInteraction}
        className="h-full w-full text-left"
        disabled={isCompleted}
      >
        {cardContent}
      </button>
    );

  return (
    <motion.div
      layout
      onMouseEnter={() => canExpand && setActiveItemId(id)}
      className={cn(
        'relative flex flex-col rounded-2xl transition-all duration-300 group overflow-hidden',
        isCompleted ? 'bg-white/40' : 'bg-white/70 shadow-md',
        isExpanded && 'shadow-xl bg-white'
      )}
    >
      <div className={cn('p-4', !isCompleted && 'cursor-pointer')}>
        {interactiveContent}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-3 text-sm">
              <h4 className="font-semibold text-xs mb-2 text-gray-800">
                מה חסר להשלמת השלב?
              </h4>
              {missingItems && (
                <ul className="list-disc pr-4 space-y-1.5 text-gray-600 text-xs">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {worldProgress && (
                <div className="space-y-2">
                  {worldProgress.map((world) => (
                    <div
                      key={world.world}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={cn(
                          'font-medium',
                          world.isDone ? 'text-emerald-600' : 'text-gray-700'
                        )}
                      >
                        {world.world}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {world.completed}/{world.total}
                        </span>
                        {world.isDone && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

export const ProfileChecklist: React.FC<ProfileChecklistProps> = ({
  user,
  onPreviewClick,
  hasSeenPreview,
  questionnaireResponse,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const getMissingItems = useMemo(() => {
    const p = user.profile;
    if (!p) return { personalDetails: [], partnerPreferences: [] };

    // --- START OF UPDATED LOGIC ---
    const personalDetails = [
      // From "קצת עלי ומידע נוסף" Card
      !p.profileHeadline && 'כותרת פרופיל',
      (!p.about || p.about.trim().length < 100) && 'כתיבת "קצת עליי" (100+ תווים)',
      !p.inspiringCoupleStory && 'הזוג שנותן לי השראה',
      !p.influentialRabbi && 'דמות רבנית/רוחנית משפיעה',

      // From "מידע רפואי ורגיש" Card
      (p.hasMedicalInfo === null || p.hasMedicalInfo === undefined) && 'התייחסות למידע רפואי',
      (p.hasMedicalInfo === true && !p.medicalInfoDetails) && 'פירוט מידע רפואי',
      (p.hasMedicalInfo === true && !p.medicalInfoDisclosureTiming) && 'תזמון חשיפת מידע רפואי',

      // From "פרטים אישיים ודמוגרפיים" Card
      !p.birthDate && 'תאריך לידה',
      !p.height && 'גובה',
      !p.city && 'עיר מגורים',
      !p.origin && 'מוצא/עדה',
      !p.nativeLanguage && 'שפת אם',
      p.aliyaCountry && !p.aliyaYear && 'שנת עלייה',

      // From "מצב משפחתי ורקע" Card
      !p.maritalStatus && 'מצב משפחתי',
      p.maritalStatus &&
        ['divorced', 'widowed', 'annulled'].includes(p.maritalStatus) &&
        (p.hasChildrenFromPrevious === null || p.hasChildrenFromPrevious === undefined) &&
        'התייחסות לילדים מקשר קודם',
      !p.parentStatus && 'סטטוס הורים',
      !p.fatherOccupation && 'מקצוע האב',
      !p.motherOccupation && 'מקצוע האם',
      (p.siblings === null || p.siblings === undefined) && 'מספר אחים/אחיות',
      (p.position === null || p.position === undefined) && 'מיקום במשפחה',

      // From "דת ואורח חיים" Card
      !p.religiousLevel && 'רמה דתית',
      !p.religiousJourney && 'מסע דתי',
      (p.shomerNegiah === null || p.shomerNegiah === undefined) && 'שמירת נגיעה',

      // From "השכלה, עיסוק ושירות" Card
      !p.educationLevel && 'רמת השכלה',
      !p.education && 'פירוט השכלה',
      !p.occupation && 'עיסוק נוכחי',
      !p.serviceType && 'סוג שירות',
      !p.serviceDetails && 'פרטי שירות',

      // From "תכונות אופי ותחביבים" Card
      (!p.profileCharacterTraits || p.profileCharacterTraits.length === 0) && 'תכונות אופי',
      (!p.profileHobbies || p.profileHobbies.length === 0) && 'תחביבים',
    ].filter(Boolean);

    const partnerPreferences = [
      // From "תיאור כללי והעדפות קשר" Card
      (!p.matchingNotes || p.matchingNotes.trim().length === 0) && "תיאור כללי על המועמד/ת",
      !p.contactPreference && "אופן יצירת קשר מועדף",

      // From "העדפות גיל וגובה" Card
      (!p.preferredAgeMin || !p.preferredAgeMax) && 'טווח גילאים מועדף',
      (!p.preferredHeightMin || !p.preferredHeightMax) && 'טווח גובה מועדף',

      // From "מיקום, רמה דתית ואורח חיים" Card
      (!p.preferredLocations || p.preferredLocations.length === 0) && 'אזורי מגורים מועדפים',
      (!p.preferredReligiousLevels || p.preferredReligiousLevels.length === 0) && 'רמות דתיות מועדפות',
      (!p.preferredReligiousJourneys || p.preferredReligiousJourneys.length === 0) && 'רקע דתי מועדף',
      (p.preferredShomerNegiah === null || p.preferredShomerNegiah === undefined) && 'העדפת שמירת נגיעה',

      // From "השכלה, תעסוקה ושירות" Card
      (!p.preferredEducation || p.preferredEducation.length === 0) && 'רמות השכלה מועדפות',
      (!p.preferredOccupations || p.preferredOccupations.length === 0) && 'תחומי עיסוק מועדפים',
      (!p.preferredServiceTypes || p.preferredServiceTypes.length === 0) && 'סוג שירות מועדף',

      // From "רקע אישי ומשפחתי" Card
      (!p.preferredMaritalStatuses || p.preferredMaritalStatuses.length === 0) && 'מצב משפחתי מועדף',
      (p.preferredPartnerHasChildren === null || p.preferredPartnerHasChildren === undefined) && 'העדפה לגבי ילדים מקשר קודם',
      (!p.preferredOrigins || p.preferredOrigins.length === 0) && 'מוצא/עדה מועדפים',
      !p.preferredAliyaStatus && 'העדפת סטטוס עלייה',

      // From "אופי ותחומי עניין" Card
      (!p.preferredCharacterTraits || p.preferredCharacterTraits.length === 0) && 'תכונות אופי מועדפות',
      (!p.preferredHobbies || p.preferredHobbies.length === 0) && 'תחביבים מועדפים',
    ].filter(Boolean);
    // --- END OF UPDATED LOGIC ---


    // Gender-specific items
    if (p.gender === Gender.FEMALE) {
      if (!p.headCovering) personalDetails.push('כיסוי ראש');
      if (!p.preferredKippahTypes || p.preferredKippahTypes.length === 0)
        partnerPreferences.push('סוג כיפה מועדף לבן הזוג');
    } else if (p.gender === Gender.MALE) {
      if (!p.kippahType) personalDetails.push('סוג כיפה');
      if (!p.preferredHeadCoverings || p.preferredHeadCoverings.length === 0)
        partnerPreferences.push('כיסוי ראש מועדף לבת הזוג');
    }

    return {
      personalDetails: personalDetails as string[],
      partnerPreferences: partnerPreferences as string[],
    };
  }, [user.profile]);

  const questionnaireProgress = useMemo(() => {
    const getAnswerCountFromJsonArray = (jsonValue: unknown): number => {
      if (Array.isArray(jsonValue)) return jsonValue.length;
      return 0;
    };

    if (!questionnaireResponse) {
      return (Object.keys(WORLD_NAMES_MAP) as WorldKey[]).map((key) => ({
        world: WORLD_NAMES_MAP[key],
        completed: 0,
        total:
          QUESTION_COUNTS[key.toUpperCase() as keyof typeof QUESTION_COUNTS],
        isDone: false,
      }));
    }

    const qr = questionnaireResponse;
    return (Object.keys(WORLD_NAMES_MAP) as WorldKey[]).map((key) => {
      const uppercaseKey = key.toUpperCase() as keyof typeof QUESTION_COUNTS;
      const answersFieldKey = `${key}Answers` as keyof QuestionnaireResponse;
      const completedCount = getAnswerCountFromJsonArray(qr[answersFieldKey]);
      return {
        world: WORLD_NAMES_MAP[key],
        completed: completedCount,
        total: QUESTION_COUNTS[uppercaseKey],
        isDone: qr.worldsCompleted?.includes(uppercaseKey) ?? false,
      };
    });
  }, [questionnaireResponse]);

  const questionnaireCompleted = questionnaireResponse?.completed ?? false;

  const tasks = [
    {
      id: 'photo',
      isCompleted: (user.images?.length ?? 0) >= 3,
      title: 'העלאת תמונות',
      description: 'הכרטיס ביקור הראשוני שלך.',
      link: '/profile?tab=photos',
      icon: Camera,
      missingItems:
        (user.images?.length ?? 0) < 3
          ? [`נדרשות לפחות 3 תמונות (הועלו: ${user.images?.length ?? 0})`]
          : [],
    },
    {
      id: 'personal_details',
      isCompleted: getMissingItems.personalDetails.length === 0,
      title: 'פרטים אישיים',
      description: 'הבסיס להכיר אותך לעומק.',
      link: '/profile?tab=overview',
      icon: User,
      missingItems: getMissingItems.personalDetails,
    },
    {
      id: 'partner_preferences',
      isCompleted: getMissingItems.partnerPreferences.length === 0,
      title: 'העדפות התאמה',
      description: 'לדייק את מי שמחפשים.',
      link: '/profile?tab=preferences',
      icon: Target,
      missingItems: getMissingItems.partnerPreferences,
    },
    {
      id: 'questionnaire',
      isCompleted: questionnaireCompleted,
      title: 'שאלון התאמה',
      description: 'המפתח להתאמות AI.',
      link: '/questionnaire',
      icon: BookOpen,
      worldProgress: questionnaireProgress ?? undefined,
    },
    {
      id: 'review',
      isCompleted: hasSeenPreview,
      title: 'תצוגה מקדימה',
      description: 'לראות איך אחרים רואים אותך.',
      onClick: onPreviewClick,
      icon: Edit3,
      missingItems: !hasSeenPreview
        ? ['יש לצפות בתצוגה המקדימה של הפרופיל']
        : [],
    },
  ];

  const completionPercentage = useMemo(() => {
    const QUESTIONNAIRE_WEIGHT = 20;
    const OTHER_TASKS_WEIGHT = 80;

    const totalQuestions = Object.values(QUESTION_COUNTS).reduce(
      (sum, count) => sum + count,
      0
    );
    const answeredQuestions = questionnaireProgress.reduce(
      (sum, world) => sum + world.completed,
      0
    );
    const questionnaireContribution =
      totalQuestions > 0
        ? (answeredQuestions / totalQuestions) * QUESTIONNAIRE_WEIGHT
        : 0;

    const p = user.profile;
    const otherTasksStatus: boolean[] = [];

    // Task 1: Photos
    otherTasksStatus.push((user.images?.length ?? 0) >= 3);

    if (p) {
       // --- START OF UPDATED LOGIC FOR PROGRESS BAR ---
      // Personal Details Checks
      otherTasksStatus.push(!!p.profileHeadline);
      otherTasksStatus.push(!!(p.about && p.about.trim().length >= 100));
      otherTasksStatus.push(!!p.inspiringCoupleStory);
      otherTasksStatus.push(!!p.influentialRabbi);
      otherTasksStatus.push(p.hasMedicalInfo !== null && p.hasMedicalInfo !== undefined);
      otherTasksStatus.push(!p.hasMedicalInfo || !!p.medicalInfoDetails);
      otherTasksStatus.push(!p.hasMedicalInfo || !!p.medicalInfoDisclosureTiming);
      otherTasksStatus.push(!!p.birthDate);
      otherTasksStatus.push(!!p.height);
      otherTasksStatus.push(!!p.city);
      otherTasksStatus.push(!!p.origin);
      otherTasksStatus.push(!!p.nativeLanguage);
      otherTasksStatus.push(!p.aliyaCountry || !!p.aliyaYear);
      otherTasksStatus.push(!!p.maritalStatus);
      otherTasksStatus.push(
        !['divorced', 'widowed', 'annulled'].includes(p.maritalStatus || '') ||
          (p.hasChildrenFromPrevious !== null && p.hasChildrenFromPrevious !== undefined)
      );
      otherTasksStatus.push(!!p.parentStatus);
      otherTasksStatus.push(!!p.fatherOccupation);
      otherTasksStatus.push(!!p.motherOccupation);
      otherTasksStatus.push(p.siblings !== null && p.siblings !== undefined);
      otherTasksStatus.push(p.position !== null && p.position !== undefined);
      otherTasksStatus.push(!!p.religiousLevel);
      otherTasksStatus.push(!!p.religiousJourney);
      otherTasksStatus.push(
        p.shomerNegiah !== null && p.shomerNegiah !== undefined
      );
      otherTasksStatus.push(!!p.educationLevel);
      otherTasksStatus.push(!!p.education);
      otherTasksStatus.push(!!p.occupation);
      otherTasksStatus.push(!!p.serviceType);
      otherTasksStatus.push(!!p.serviceDetails);
      otherTasksStatus.push(
        !!(p.profileCharacterTraits && p.profileCharacterTraits.length > 0)
      );
      otherTasksStatus.push(
        !!(p.profileHobbies && p.profileHobbies.length > 0)
      );

      // Partner Preferences Checks
      otherTasksStatus.push(!!(p.matchingNotes && p.matchingNotes.trim().length > 0));
      otherTasksStatus.push(!!p.contactPreference);
      otherTasksStatus.push(!!(p.preferredAgeMin && p.preferredAgeMax));
      otherTasksStatus.push(!!(p.preferredHeightMin && p.preferredHeightMax));
      otherTasksStatus.push(
        !!(p.preferredLocations && p.preferredLocations.length > 0)
      );
      otherTasksStatus.push(
        !!(p.preferredReligiousLevels && p.preferredReligiousLevels.length > 0)
      );
      otherTasksStatus.push(
        !!(
          p.preferredReligiousJourneys &&
          p.preferredReligiousJourneys.length > 0
        )
      );
      otherTasksStatus.push(
        p.preferredShomerNegiah !== null &&
          p.preferredShomerNegiah !== undefined
      );
      otherTasksStatus.push(
        !!(p.preferredEducation && p.preferredEducation.length > 0)
      );
      otherTasksStatus.push(
        !!(p.preferredOccupations && p.preferredOccupations.length > 0)
      );
      otherTasksStatus.push(
        !!(p.preferredServiceTypes && p.preferredServiceTypes.length > 0)
      );
      otherTasksStatus.push(
        !!(p.preferredMaritalStatuses && p.preferredMaritalStatuses.length > 0)
      );
      otherTasksStatus.push(
        p.preferredPartnerHasChildren !== null &&
          p.preferredPartnerHasChildren !== undefined
      );
      otherTasksStatus.push(
        !!(p.preferredOrigins && p.preferredOrigins.length > 0)
      );
      otherTasksStatus.push(!!p.preferredAliyaStatus);
      otherTasksStatus.push(
        !!(p.preferredCharacterTraits && p.preferredCharacterTraits.length > 0)
      );
      otherTasksStatus.push(
        !!(p.preferredHobbies && p.preferredHobbies.length > 0)
      );

      // Gender-specific checks
      if (p.gender === Gender.FEMALE) {
        otherTasksStatus.push(!!p.headCovering); // personal
        otherTasksStatus.push(
          !!(p.preferredKippahTypes && p.preferredKippahTypes.length > 0)
        ); // preference
      } else if (p.gender === Gender.MALE) {
        otherTasksStatus.push(!!p.kippahType); // personal
        otherTasksStatus.push(
          !!(p.preferredHeadCoverings && p.preferredHeadCoverings.length > 0)
        ); // preference
      }
      // --- END OF UPDATED LOGIC FOR PROGRESS BAR ---
    } else {
      // If no profile, add placeholders for all items
      const totalProfileFields = 54; // Calculated number of fields including gender-specific ones
      otherTasksStatus.push(...Array(totalProfileFields).fill(false));
    }

    // Task 5: Review
    otherTasksStatus.push(hasSeenPreview);

    const totalOtherTasks = otherTasksStatus.length;
    const completedOtherTasks = otherTasksStatus.filter(
      (isCompleted) => isCompleted
    ).length;

    const otherTasksContribution =
      totalOtherTasks > 0
        ? (completedOtherTasks / totalOtherTasks) * OTHER_TASKS_WEIGHT
        : 0;

    return Math.round(questionnaireContribution + otherTasksContribution);
  }, [user, questionnaireProgress, hasSeenPreview]);

  const isAllComplete = completionPercentage >= 100;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 rounded-3xl shadow-xl border border-white/50 bg-white/70 backdrop-blur-md overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
                {isAllComplete && (
                  <Sparkles className="w-6 h-6 text-amber-500" />
                )}
                {isAllComplete
                  ? `כל הכבוד, ${user.firstName}! הפרופיל שלך מושלם!`
                  : `ברוך הבא, ${user.firstName}! בוא נכין את הפרופיל שלך להצלחה`}
              </h2>
              <AnimatePresence initial={false}>
                {!isMinimized && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      marginTop: '0.25rem',
                    }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-slate-600 text-sm md:text-base overflow-hidden"
                  >
                    {isAllComplete
                      ? 'השלמת את כל השלבים. פרופיל עשיר הוא המפתח למציאת ההתאמה המדויקת ביותר.'
                      : 'השלמת הצעדים הבאים תקדם אותך משמעותית למציאת התאמה.'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-4 md:mt-0 md:w-auto lg:w-1/3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    השלמת הפרופיל
                  </span>
                  <span className="font-bold text-cyan-600">
                    {completionPercentage}%
                  </span>
                </div>
                <Progress
                  value={completionPercentage}
                  className="h-2 bg-slate-200/70"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:bg-slate-200/50 rounded-full flex-shrink-0"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'הרחב' : 'מזער'}
              >
                {isMinimized ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {!isMinimized && (
              <motion.div
                key="checklist-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: { opacity: { delay: 0.1 } },
                }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.3 } }}
                className="overflow-hidden"
                onMouseLeave={() => setActiveItemId(null)}
              >
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                  {tasks.map((task) => (
                    <ChecklistItem
                      key={task.id}
                      {...task}
                      isActive={activeItemId === task.id}
                      setActiveItemId={setActiveItemId}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};