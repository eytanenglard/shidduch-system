'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import type { SFQuestion, SFAnswers, SectorValue, SectorGroup, LifeStageValue } from '@/components/soul-fingerprint/types';
import { isQuestionVisible } from '@/components/soul-fingerprint/types';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import AccordionQuestion from './AccordionQuestion';
import ConfettiBurst from './ConfettiBurst';

interface UnansweredItem {
  question: SFQuestion;
  sectionIcon: string;
  sectionTitleKey: string;
  sectionIndex: number;
  isPartner: boolean;
}

interface Props {
  answers: SFAnswers;
  gender: 'MALE' | 'FEMALE';
  sectorGroup: SectorGroup | null;
  sector: SectorValue | null;
  lifeStage: LifeStageValue | null;
  onAnswer: (questionId: string, value: string | string[] | number | null) => void;
  onExit: () => void;
  onComplete: () => void;
  t: (key: string) => string;
  translateTag: (tag: string) => string;
  isRTL: boolean;
}

/** Trigger haptic feedback if available */
function triggerHaptic(duration = 50) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch {
    // Silently ignore — not all browsers support vibrate
  }
}

export default function FinishLineMode({
  answers,
  gender,
  sectorGroup,
  sector,
  lifeStage,
  onAnswer,
  onExit,
  onComplete,
  t,
  translateTag,
  isRTL,
}: Props) {
  // Bug fix #1: use questionId instead of numeric index for active tracking
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  // Track questions that were just answered — they'll fade out
  const [justAnswered, setJustAnswered] = useState<Set<string>>(new Set());
  const [celebrationShown, setCelebrationShown] = useState(false);
  const fadeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Bug fix #2: store initial count on mount for accurate progress bar
  const initialCountRef = useRef<number | null>(null);

  // Get ALL unanswered required questions across all sections
  const unansweredItems = useMemo(() => {
    const items: UnansweredItem[] = [];
    for (let si = 0; si < SF_SECTIONS.length; si++) {
      const section = SF_SECTIONS[si];
      for (const q of section.questions) {
        if (!isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender)) continue;
        if (q.isOptional) continue;
        // Skip questions that are in the "just answered" fade-out state
        if (justAnswered.has(q.id)) continue;

        const ans = answers[q.id];
        const isUnanswered =
          ans === null || ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0);

        if (isUnanswered) {
          items.push({
            question: q,
            sectionIcon: section.icon,
            sectionTitleKey: section.titleKey,
            sectionIndex: si,
            isPartner: q.forPartner && !q.forSelf,
          });
        }
      }
    }
    return items;
  }, [answers, gender, sectorGroup, sector, lifeStage, justAnswered]);

  // Set initial count once on first render
  useEffect(() => {
    if (initialCountRef.current === null && unansweredItems.length > 0) {
      initialCountRef.current = unansweredItems.length;
    }
  }, [unansweredItems.length]);

  const initialCount = initialCountRef.current || unansweredItems.length || 1;

  // Set first unanswered as active on mount
  useEffect(() => {
    if (activeQuestionId === null && unansweredItems.length > 0) {
      setActiveQuestionId(unansweredItems[0].question.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for completion
  useEffect(() => {
    if (unansweredItems.length === 0 && !celebrationShown) {
      setCelebrationShown(true);
      triggerHaptic(200);
      const timer = setTimeout(() => {
        onComplete();
      }, 3500); // More time for confetti
      return () => clearTimeout(timer);
    }
  }, [unansweredItems.length, celebrationShown, onComplete]);

  // Cleanup timers
  useEffect(() => {
    const timers = fadeTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      onAnswer(questionId, value);
      triggerHaptic(50);

      // After 1.5s, add to justAnswered so it fades out
      const timer = setTimeout(() => {
        setJustAnswered((prev) => new Set(prev).add(questionId));
      }, 1500);
      fadeTimers.current.set(questionId, timer);
    },
    [onAnswer]
  );

  const isQuestionAnswered = useCallback(
    (questionId: string) => {
      const ans = answers[questionId];
      if (ans === null || ans === undefined || ans === '') return false;
      if (Array.isArray(ans) && ans.length === 0) return false;
      return true;
    },
    [answers]
  );

  // Bug fix #1: auto-advance using questionId
  const handleAutoAdvance = useCallback(
    (currentQuestionId: string) => {
      const currentIdx = unansweredItems.findIndex((item) => item.question.id === currentQuestionId);
      if (currentIdx < 0) return;

      // Find the next unanswered question that isn't answered yet
      for (let i = currentIdx + 1; i < unansweredItems.length; i++) {
        const nextId = unansweredItems[i].question.id;
        if (!isQuestionAnswered(nextId)) {
          setActiveQuestionId(nextId);
          setTimeout(() => {
            const el = document.getElementById(`fl-question-${nextId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 350);
          return;
        }
      }
      // If no next found, try from the beginning
      for (let i = 0; i < currentIdx; i++) {
        const nextId = unansweredItems[i].question.id;
        if (!isQuestionAnswered(nextId)) {
          setActiveQuestionId(nextId);
          setTimeout(() => {
            const el = document.getElementById(`fl-question-${nextId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 350);
          return;
        }
      }
    },
    [unansweredItems, isQuestionAnswered]
  );

  // Bug fix #3: group by section, filtering out empty sections
  const groupedItems = useMemo(() => {
    const groups: { sectionIcon: string; sectionTitleKey: string; items: UnansweredItem[] }[] = [];
    let currentGroup: (typeof groups)[0] | null = null;

    for (const item of unansweredItems) {
      if (!currentGroup || currentGroup.sectionTitleKey !== item.sectionTitleKey) {
        currentGroup = {
          sectionIcon: item.sectionIcon,
          sectionTitleKey: item.sectionTitleKey,
          items: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }
    // Filter out groups that only have answered items (shouldn't happen, but safety)
    return groups.filter((g) => g.items.length > 0);
  }, [unansweredItems]);

  // Celebration state with confetti
  if (celebrationShown && unansweredItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <ConfettiBurst />
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            {t('finishLine.allDone')}
          </h2>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            {t('finishLine.allDoneSubtitle')}
          </p>
        </div>
      </div>
    );
  }

  // Progress percentage based on initial count
  const progressPercent = Math.max(5, ((initialCount - unansweredItems.length) / initialCount) * 100);

  // Running question number for display
  let questionNumber = 0;

  return (
    <div className="max-w-xl mx-auto py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back to normal mode */}
      <button
        onClick={onExit}
        className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors mb-4 text-sm"
      >
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t('finishLine.backToSections')}
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-1.5 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">
            {t('finishLine.title')}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {/* Animated counter */}
          <AnimatedCount count={unansweredItems.length} t={t} />
        </h2>
        <p className="text-sm text-gray-500">
          {t('finishLine.description')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className={`flex items-center justify-between mb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-500 font-medium">
            {t('finishLine.remaining').replace('{{count}}', String(unansweredItems.length))}
          </span>
          <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t('finishLine.almostThere')}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Questions grouped by section */}
      <div className="space-y-6">
        {groupedItems.map((group) => (
          <div key={group.sectionTitleKey}>
            {/* Section label */}
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-base">{group.sectionIcon}</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t(group.sectionTitleKey)}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">
                {group.items.length}
              </span>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {group.items.map((item) => {
                questionNumber++;
                const questionId = item.question.id;
                const answered = isQuestionAnswered(questionId);
                const isEngaging = item.question.type === 'slider' || item.question.type === 'singleChoice';

                return (
                  <div
                    key={questionId}
                    id={`fl-question-${questionId}`}
                    className={`transition-all duration-500 ${
                      answered ? 'opacity-60 scale-[0.98]' : ''
                    }`}
                  >
                    {/* Partner badge + engaging question hint */}
                    <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {item.isPartner && (
                        <span className={`text-[10px] text-teal-500 font-medium ${isRTL ? 'mr-2' : 'ml-2'}`}>
                          {t('finishLine.partnerQuestion')}
                        </span>
                      )}
                      {isEngaging && !answered && (
                        <span className={`text-[10px] text-amber-400 font-medium flex items-center gap-0.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                          <Sparkles className="w-2.5 h-2.5" />
                          {t('finishLine.quickAnswer')}
                        </span>
                      )}
                    </div>
                    <AccordionQuestion
                      question={item.question}
                      answers={answers}
                      onAnswer={handleAnswer}
                      t={t}
                      translateTag={translateTag}
                      isRTL={isRTL}
                      isActive={activeQuestionId === questionId}
                      isAnswered={answered}
                      onActivate={() => {
                        setActiveQuestionId(questionId);
                        setTimeout(() => {
                          const el = document.getElementById(`fl-question-${questionId}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 350);
                      }}
                      onDeactivate={() => setActiveQuestionId(null)}
                      onAutoAdvance={() => handleAutoAdvance(questionId)}
                      questionNumber={questionNumber}
                      totalQuestions={unansweredItems.length}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom motivational text */}
      <div className="text-center mt-8 mb-4">
        <p className="text-xs text-gray-400">
          {unansweredItems.length <= 5
            ? t('finishLine.lastFew')
            : t('finishLine.keepGoing')}
        </p>
      </div>
    </div>
  );
}

/** Animated number counter with flip effect */
function AnimatedCount({ count, t }: { count: number; t: (key: string) => string }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      setIsAnimating(true);
      // Brief delay for exit animation, then update number
      const timer = setTimeout(() => {
        setDisplayCount(count);
        prevCount.current = count;
        // Remove animation class after enter animation
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <span>
      {t('finishLine.subtitle').split('{{count}}')[0]}
      <span
        className={`inline-block tabular-nums transition-all duration-300 ${
          isAnimating
            ? 'scale-125 text-amber-600'
            : 'scale-100 text-gray-800'
        }`}
      >
        {displayCount}
      </span>
      {t('finishLine.subtitle').split('{{count}}')[1]}
    </span>
  );
}
