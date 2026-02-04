// src/app/[locale]/(authenticated)/profile/components/dashboard/ProfileChecklist.tsx

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
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { User as SessionUserType } from '@/types/next-auth';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { Gender } from '@prisma/client';
import { ProfileChecklistDict } from '@/types/dictionary';

// --- כמות שאלות בכל עולם ---
const QUESTION_COUNTS: Record<
  'VALUES' | 'PERSONALITY' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION',
  number
> = {
  PERSONALITY: 25,
  VALUES: 23,
  RELATIONSHIP: 22,
  PARTNER: 19,
  RELIGION: 20,
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
  dict: ProfileChecklistDict;
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
  dict,
}) => {
  const canExpand =
    (missingItems && missingItems.length > 0) ||
    (worldProgress && worldProgress.length > 0);
  const isExpanded = isActive && canExpand;

  const handleInteraction = (event: React.PointerEvent) => {
    if (isCompleted) return;
    event.preventDefault();
    if (onClick) {
      onClick();
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
              : 'bg-gradient-to-br from-teal-50 to-orange-50 shadow-teal-500/10'
          )}
        >
          <Icon
            className={cn(
              'w-7 h-7 transition-colors duration-300',
              isCompleted ? 'text-emerald-500' : 'text-teal-600'
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
            className="absolute -top-1 -end-1"
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
        onPointerDown={handleInteraction}
        className="h-full w-full text-start"
        disabled={isCompleted}
      >
        {cardContent}
      </button>
    );

  return (
    <motion.div
      layout
      className={cn(
        'relative flex flex-col rounded-2xl transition-all duration-300 group overflow-hidden',
        isCompleted ? 'bg-white/40' : 'bg-white/70 shadow-md',
        isExpanded && 'shadow-xl bg-white'
      )}
    >
      <div className={cn('p-4 relative', !isCompleted && 'cursor-pointer')}>
        {interactiveContent}
        {canExpand && !isCompleted && (
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveItemId((prev) => (prev === id ? null : id));
            }}
            className="absolute bottom-1 end-1 w-8 h-8 rounded-full text-gray-500 hover:bg-gray-200/50"
            aria-label={isExpanded ? dict.minimizeLabel : dict.expandLabel}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        )}
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
            <div className="bg-gradient-to-br from-teal-50/50 via-white to-orange-50/50 border-t border-teal-100 px-4 py-3 text-sm">
              <h4 className="font-semibold text-xs mb-2 text-gray-800">
                {dict.missingItemsTitle}
              </h4>
              {missingItems && (
                <ul className="list-disc ps-4 space-y-1.5 text-gray-600 text-xs">
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
                        {WORLD_NAMES_MAP[world.world as WorldKey] ||
                          world.world}
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
  dict: ProfileChecklistDict;
  locale: string;
  onNavigateToTab: (tab: string) => void;
  onCompletionChange?: (percentage: number) => void;
}

export const ProfileChecklist: React.FC<ProfileChecklistProps> = ({
  user,
  onPreviewClick,
  hasSeenPreview,
  questionnaireResponse,
  dict,
  locale,
  onNavigateToTab,
  onCompletionChange,
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const missingItemsDict = dict.missingItems;

  const getLabel = (key: string): string => {
    return missingItemsDict?.[key as keyof typeof missingItemsDict] || key;
  };

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const isReligious = useMemo(() => {
    const level = user.profile?.religiousLevel;
    if (!level) return false;
    const nonReligiousLevels = [
      'SECULAR',
      'TRADITIONAL',
      'DATI_CHILONI',
      'MASORTI',
    ];
    return !nonReligiousLevels.includes(level);
  }, [user.profile?.religiousLevel]);

  // ============================================
  // getMissingItems - מה חסר למשתמש (להצגה)
  // הוסרו: testimonials, influentialRabbi, serviceDetails
  // ============================================
  const getMissingItems = useMemo(() => {
    const p = user.profile;
    if (!p) return { personalDetails: [], partnerPreferences: [] };

    const personalDetails = [
      !p.profileHeadline && getLabel('profileHeadline'),
      (!p.about || p.about.trim().length < 100) && getLabel('about'),

      // Medical info
      (p.hasMedicalInfo === null || p.hasMedicalInfo === undefined) &&
        getLabel('medicalInfoReference'),
      p.hasMedicalInfo === true &&
        !p.medicalInfoDetails &&
        getLabel('medicalInfoDetails'),
      p.hasMedicalInfo === true &&
        !p.medicalInfoDisclosureTiming &&
        getLabel('medicalInfoDisclosureTiming'),

      // Basic info
      !p.birthDate && getLabel('birthDate'),
      !p.height && getLabel('height'),
      !p.city && getLabel('city'),
      !p.origin && getLabel('origin'),
      !p.nativeLanguage && getLabel('nativeLanguage'),

      // Family status
      !p.maritalStatus && getLabel('maritalStatus'),
      p.maritalStatus &&
        ['divorced', 'widowed', 'annulled'].includes(p.maritalStatus) &&
        (p.hasChildrenFromPrevious === null ||
          p.hasChildrenFromPrevious === undefined) &&
        getLabel('childrenFromPreviousReference'),

      // Family origin
      !p.parentStatus && getLabel('parentStatus'),
      !p.fatherOccupation && getLabel('fatherOccupation'),
      !p.motherOccupation && getLabel('motherOccupation'),
      (p.siblings === null || p.siblings === undefined) && getLabel('siblings'),
      (p.position === null || p.position === undefined) && getLabel('position'),

      // Religion
      !p.religiousLevel && getLabel('religiousLevel'),
      !p.religiousJourney && getLabel('religiousJourney'),
      (p.shomerNegiah === null || p.shomerNegiah === undefined) &&
        getLabel('shomerNegiah'),

      // Education & Work
      !p.educationLevel && getLabel('educationLevel'),
      !p.education && getLabel('educationDetails'),
      !p.occupation && getLabel('occupation'),
      !p.serviceType && getLabel('serviceType'),
      // הוסר: serviceDetails

      // Character & Hobbies
      (!p.profileCharacterTraits || p.profileCharacterTraits.length === 0) &&
        getLabel('characterTraits'),
      (!p.profileHobbies || p.profileHobbies.length === 0) &&
        getLabel('hobbies'),
    ].filter(Boolean);

    const partnerPreferences = [
      (!p.matchingNotes || p.matchingNotes.trim().length === 0) &&
        getLabel('matchingNotes'),
      (!p.preferredAgeMin || !p.preferredAgeMax) &&
        getLabel('preferredAgeRange'),
      (!p.preferredHeightMin || !p.preferredHeightMax) &&
        getLabel('preferredHeightRange'),
      (!p.preferredLocations || p.preferredLocations.length === 0) &&
        getLabel('preferredLocations'),
      (!p.preferredReligiousLevels ||
        p.preferredReligiousLevels.length === 0) &&
        getLabel('preferredReligiousLevels'),
      (!p.preferredReligiousJourneys ||
        p.preferredReligiousJourneys.length === 0) &&
        getLabel('preferredReligiousJourneys'),
      (p.preferredShomerNegiah === null ||
        p.preferredShomerNegiah === undefined) &&
        getLabel('preferredShomerNegiah'),
      (!p.preferredEducation || p.preferredEducation.length === 0) &&
        getLabel('preferredEducation'),
      (!p.preferredOccupations || p.preferredOccupations.length === 0) &&
        getLabel('preferredOccupations'),
      (!p.preferredServiceTypes || p.preferredServiceTypes.length === 0) &&
        getLabel('preferredServiceTypes'),
      (!p.preferredMaritalStatuses ||
        p.preferredMaritalStatuses.length === 0) &&
        getLabel('preferredMaritalStatuses'),
      (p.preferredPartnerHasChildren === null ||
        p.preferredPartnerHasChildren === undefined) &&
        getLabel('preferredPartnerHasChildren'),
      (!p.preferredOrigins || p.preferredOrigins.length === 0) &&
        getLabel('preferredOrigins'),
      !p.preferredAliyaStatus && getLabel('preferredAliyaStatus'),
      (!p.preferredCharacterTraits ||
        p.preferredCharacterTraits.length === 0) &&
        getLabel('preferredCharacterTraits'),
      (!p.preferredHobbies || p.preferredHobbies.length === 0) &&
        getLabel('preferredHobbies'),
    ].filter(Boolean);

    // Gender specific checks - ONLY IF RELIGIOUS
    if (p.gender === Gender.FEMALE) {
      if (isReligious && !p.headCovering)
        personalDetails.push(getLabel('headCovering'));
      if (
        isReligious &&
        (!p.preferredKippahTypes || p.preferredKippahTypes.length === 0)
      )
        partnerPreferences.push(getLabel('preferredKippahTypes'));
    } else if (p.gender === Gender.MALE) {
      if (isReligious && !p.kippahType)
        personalDetails.push(getLabel('kippahType'));
      if (
        isReligious &&
        (!p.preferredHeadCoverings || p.preferredHeadCoverings.length === 0)
      )
        partnerPreferences.push(getLabel('preferredHeadCoverings'));
    }

    return {
      personalDetails: personalDetails as string[],
      partnerPreferences: partnerPreferences as string[],
    };
  }, [user.profile, missingItemsDict, isReligious]);

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

  const isQuestionnaireFullyAnswered = useMemo(() => {
    if (!questionnaireProgress || questionnaireProgress.length === 0)
      return false;
    return questionnaireProgress.every(
      (world) => world.completed >= world.total
    );
  }, [questionnaireProgress]);

  const questionnaireCompleted =
    (questionnaireResponse?.completed ?? false) || isQuestionnaireFullyAnswered;

  // ============================================
  // tasks - רק 4 משימות (הוסר review/hasSeenPreview)
  // ============================================
  const tasks = [
    {
      id: 'photo',
      isCompleted: (user.images?.length ?? 0) >= 3,
      title: dict.tasks.photos.title,
      description: dict.tasks.photos.description,
      onClick: () => onNavigateToTab('photos'),
      icon: Camera,
      missingItems:
        (user.images?.length ?? 0) < 3
          ? [
              dict.tasks.photos.missing.replace(
                '{{count}}',
                (3 - (user.images?.length ?? 0)).toString()
              ),
            ]
          : [],
    },
    {
      id: 'personal_details',
      isCompleted: getMissingItems.personalDetails.length === 0,
      title: dict.tasks.personalDetails.title,
      description: dict.tasks.personalDetails.description,
      onClick: () => onNavigateToTab('overview'),
      icon: User,
      missingItems: getMissingItems.personalDetails,
    },
    {
      id: 'partner_preferences',
      isCompleted: getMissingItems.partnerPreferences.length === 0,
      title: dict.tasks.partnerPreferences.title,
      description: dict.tasks.partnerPreferences.description,
      onClick: () => onNavigateToTab('preferences'),
      icon: Target,
      missingItems: getMissingItems.partnerPreferences,
    },
    {
      id: 'questionnaire',
      isCompleted: questionnaireCompleted,
      title: dict.tasks.questionnaire.title,
      description: dict.tasks.questionnaire.description,
      link: '/questionnaire',
      icon: BookOpen,
      worldProgress: questionnaireProgress ?? undefined,
    },
  ];

  // ============================================
  // completionPercentage - חישוב אחוזי השלמה
  // הוסרו: testimonials, influentialRabbi, serviceDetails, hasSeenPreview
  // תוקן: באג של about כפול
  // ============================================
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

    // Task 1: Photos (3 לפחות)
    otherTasksStatus.push((user.images?.length ?? 0) >= 3);

    if (p) {
      // --- Personal Details ---
      otherTasksStatus.push(!!p.profileHeadline);
      otherTasksStatus.push(!!(p.about && p.about.trim().length >= 100));

      // Medical info
      const medicalAnswered =
        p.hasMedicalInfo !== null && p.hasMedicalInfo !== undefined;
      otherTasksStatus.push(medicalAnswered);
      if (p.hasMedicalInfo === true) {
        otherTasksStatus.push(!!p.medicalInfoDetails);
        otherTasksStatus.push(!!p.medicalInfoDisclosureTiming);
      }

      // Basic info
      otherTasksStatus.push(!!p.birthDate);
      otherTasksStatus.push(!!p.height);
      otherTasksStatus.push(!!p.city);
      otherTasksStatus.push(!!p.origin);
      otherTasksStatus.push(!!p.nativeLanguage);

      // Family status
      otherTasksStatus.push(!!p.maritalStatus);
      if (['divorced', 'widowed', 'annulled'].includes(p.maritalStatus || '')) {
        otherTasksStatus.push(
          p.hasChildrenFromPrevious !== null &&
            p.hasChildrenFromPrevious !== undefined
        );
      }

      // Family origin
      otherTasksStatus.push(!!p.parentStatus);
      otherTasksStatus.push(!!p.fatherOccupation);
      otherTasksStatus.push(!!p.motherOccupation);
      otherTasksStatus.push(p.siblings !== null && p.siblings !== undefined);
      otherTasksStatus.push(p.position !== null && p.position !== undefined);

      // Religion
      otherTasksStatus.push(!!p.religiousLevel);
      otherTasksStatus.push(!!p.religiousJourney);
      otherTasksStatus.push(
        p.shomerNegiah !== null && p.shomerNegiah !== undefined
      );

      // Education & Work (הוסר serviceDetails)
      otherTasksStatus.push(!!p.educationLevel);
      otherTasksStatus.push(!!p.education);
      otherTasksStatus.push(!!p.occupation);
      otherTasksStatus.push(!!p.serviceType);

      // Character & Hobbies
      otherTasksStatus.push(
        !!(p.profileCharacterTraits && p.profileCharacterTraits.length > 0)
      );
      otherTasksStatus.push(
        !!(p.profileHobbies && p.profileHobbies.length > 0)
      );

      // --- Partner Preferences ---
      otherTasksStatus.push(
        !!(p.matchingNotes && p.matchingNotes.trim().length > 0)
      );
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

      // --- Gender-specific (CONDITIONAL for religious) ---
      if (p.gender === Gender.FEMALE) {
        if (isReligious) otherTasksStatus.push(!!p.headCovering);
        if (isReligious)
          otherTasksStatus.push(
            !!(p.preferredKippahTypes && p.preferredKippahTypes.length > 0)
          );
      } else if (p.gender === Gender.MALE) {
        if (isReligious) otherTasksStatus.push(!!p.kippahType);
        if (isReligious)
          otherTasksStatus.push(
            !!(p.preferredHeadCoverings && p.preferredHeadCoverings.length > 0)
          );
      }
    } else {
      // If no profile, add placeholders
      otherTasksStatus.push(...Array(40).fill(false));
    }

    // הוסר: hasSeenPreview

    const totalOtherTasks = otherTasksStatus.length;
    const completedOtherTasks = otherTasksStatus.filter(Boolean).length;

    const otherTasksContribution =
      totalOtherTasks > 0
        ? (completedOtherTasks / totalOtherTasks) * OTHER_TASKS_WEIGHT
        : 0;

    return Math.round(questionnaireContribution + otherTasksContribution);
  }, [user, questionnaireProgress, isReligious]);

  const isAllComplete = completionPercentage >= 100;

  React.useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(completionPercentage);
    }
  }, [completionPercentage, onCompletionChange]);

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 rounded-3xl shadow-xl border border-white/50 bg-gradient-to-br from-white/80 via-white/70 to-teal-50/30 backdrop-blur-md overflow-hidden"
        dir={direction}
      >
        <div className="p-4 sm:p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 text-center md:text-start">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
                {isAllComplete && (
                  <Sparkles className="w-6 h-6 text-amber-500" />
                )}
                {(() => {
                  const isFemale = user.profile?.gender === 'FEMALE';
                  const welcomeText =
                    isFemale && dict.welcome_female
                      ? dict.welcome_female
                      : dict.welcome;
                  const allCompleteText =
                    isFemale && dict.allComplete_female
                      ? dict.allComplete_female
                      : dict.allComplete;
                  const textToShow = isAllComplete
                    ? allCompleteText
                    : welcomeText;
                  return textToShow.replace(
                    '{{firstName}}',
                    user.firstName || ''
                  );
                })()}
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
                      ? dict.allCompleteSubtitle
                      : dict.welcomeSubtitle}
                  </motion.p>
                )}
                {!isAllComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center md:justify-start gap-1.5 mt-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-xs text-teal-600">
                      {dict.privacyNote || 'כל המידע נשמר בדיסקרטיות מלאה'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-4 md:mt-0 md:w-auto lg:w-1/3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span
                    id="profile-completion-label"
                    className="font-medium text-gray-700"
                  >
                    {dict.completionLabel.replace(
                      '{{percentage}}',
                      completionPercentage.toString()
                    )}
                  </span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-500">
                    {completionPercentage}%
                  </span>
                </div>
                <Progress
                  value={completionPercentage}
                  aria-labelledby="profile-completion-label"
                  className="h-2 bg-slate-200/70 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:via-orange-400 [&>div]:to-amber-500"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:bg-teal-100/50 rounded-full flex-shrink-0"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? dict.expandLabel : dict.minimizeLabel}
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
              >
                <ul className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <ChecklistItem
                        key={task.id}
                        {...task}
                        isActive={activeItemId === task.id}
                        setActiveItemId={setActiveItemId}
                        dict={dict}
                      />
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
