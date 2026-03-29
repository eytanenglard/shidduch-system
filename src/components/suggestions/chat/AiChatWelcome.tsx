// src/components/suggestions/chat/AiChatWelcome.tsx
// =============================================================================
// Welcome screen for the smart assistant (when no messages yet)
// First-time users see an onboarding flow; returning users see entry points
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, Search, Loader2, Brain, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AiChatWelcomeProps {
  locale: 'he' | 'en';
  isGeneralChat: boolean;
  isLoadingDiscovery: boolean;
  onQuickPrompt: (text: string) => void;
}

const ONBOARDING_KEY = 'neshama_onboarding_seen';

const onboardingSteps = {
  he: [
    { icon: Brain, title: 'אני לומדת מה חשוב לך', desc: 'ככל שנדבר יותר, אבין טוב יותר מה את/ה מחפש/ת — ואציע התאמות מדויקות יותר.', color: 'violet' },
    { icon: Heart, title: 'אציג לך מועמדים', desc: 'אחרי כמה שאלות, אחפש במאגר ואציג לך פרופילים שמתאימים — עם הסבר למה.', color: 'rose' },
    { icon: ShieldCheck, title: 'פרטיות מלאה', desc: 'אף מועמד לא רואה את השיחה שלנו. הכל נשאר בינינו ומשמש רק לשיפור ההצעות שלך.', color: 'teal' },
  ],
  en: [
    { icon: Brain, title: 'I learn what matters to you', desc: 'The more we chat, the better I understand what you seek — and the more accurate my suggestions become.', color: 'violet' },
    { icon: Heart, title: "I'll present candidates", desc: "After a few questions, I'll search our database and present matching profiles — with explanations.", color: 'rose' },
    { icon: ShieldCheck, title: 'Full privacy', desc: "No candidate sees our conversation. Everything stays between us and is only used to improve your suggestions.", color: 'teal' },
  ],
};

export default function AiChatWelcome({
  locale,
  isGeneralChat,
  isLoadingDiscovery,
  onQuickPrompt,
}: AiChatWelcomeProps) {
  const isHebrew = locale === 'he';
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (isGeneralChat && typeof window !== 'undefined') {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setShowOnboarding(true);
    }
  }, [isGeneralChat]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleNextStep = () => {
    const steps = onboardingSteps[isHebrew ? 'he' : 'en'];
    if (onboardingStep < steps.length - 1) {
      setOnboardingStep((s) => s + 1);
    } else {
      handleOnboardingComplete();
    }
  };

  if (isLoadingDiscovery) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          {isHebrew ? 'מכין שאלה בשבילך...' : 'Preparing a question for you...'}
        </p>
      </div>
    );
  }

  if (!isGeneralChat) {
    // Suggestion-specific welcome
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          {isHebrew ? 'שלום! אני נשמה 💜' : "Hi! I'm Neshama 💜"}
        </h3>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
          {isHebrew
            ? 'שאל/י אותי שאלות על ההצעה הזו ואני אעזור לך להחליט. את/ה גם יכול/ה לבקש לראות את הפרופיל המלא.'
            : "Ask me questions about this suggestion and I'll help you decide. You can also ask to see the full profile."}
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {(isHebrew
            ? ['ספר/י לי עליו/ה', 'למה אנחנו מתאימים?', 'מה הרקע שלו/ה?']
            : ['Tell me about them', 'Why are we compatible?', "What's their background?"]
          ).map((prompt) => (
            <button
              key={prompt}
              className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200"
              onClick={() => onQuickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === First-time onboarding ===
  if (showOnboarding) {
    const steps = onboardingSteps[isHebrew ? 'he' : 'en'];
    const step = steps[onboardingStep];
    const Icon = step.icon;
    const colorMap: Record<string, string> = {
      violet: 'from-violet-500 to-purple-600',
      rose: 'from-rose-500 to-pink-600',
      teal: 'from-teal-500 to-emerald-600',
    };

    return (
      <div className="text-center py-6 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className={cn(
              'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br shadow-lg',
              colorMap[step.color],
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-2">{step.title}</h3>
            <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed mb-6">
              {step.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === onboardingStep ? 'bg-violet-500 w-6' : 'bg-gray-300',
              )}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={handleOnboardingComplete}
            className="text-xs px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isHebrew ? 'דלג' : 'Skip'}
          </button>
          <button
            onClick={handleNextStep}
            className="text-xs px-6 py-2 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors shadow-md"
          >
            {onboardingStep < steps.length - 1
              ? (isHebrew ? 'הבא' : 'Next')
              : (isHebrew ? 'בואו נתחיל!' : "Let's start!")}
          </button>
        </div>
      </div>
    );
  }

  // === Returning user — mood selector + entry points ===
  const moodOptions = isHebrew ? [
    { emoji: '🔍', label: 'רוצה לגלות מישהו חדש', prompt: 'בוא נתחיל - אני רוצה לגלות מישהו/י חדש/ה', color: 'violet' },
    { emoji: '💭', label: 'רוצה לדבר על מה שמפריע לי', prompt: 'אני רוצה לדבר על משהו שמפריע לי בתהליך השידוכים', color: 'teal' },
    { emoji: '🎯', label: 'רוצה לעדכן מה שאני מחפש', prompt: 'אני רוצה לעדכן את ההעדפות שלי - שמתי לב שכמה דברים השתנו', color: 'amber' },
    { emoji: '❓', label: 'שאלה על הצעה שקיבלתי', prompt: 'יש לי שאלה על הצעה שקיבלתי', color: 'rose' },
  ] : [
    { emoji: '🔍', label: 'Discover someone new', prompt: "Let's start - I want to discover someone new", color: 'violet' },
    { emoji: '💭', label: 'Talk about how I feel', prompt: 'I want to talk about something that bothers me about the process', color: 'teal' },
    { emoji: '🎯', label: 'Update what I seek', prompt: "I want to update my preferences - I've noticed some things have changed", color: 'amber' },
    { emoji: '❓', label: 'Question about a suggestion', prompt: 'I have a question about a suggestion I received', color: 'rose' },
  ];

  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-50 border-violet-200 hover:border-violet-300 hover:bg-violet-100',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-300 hover:bg-teal-100',
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:bg-amber-100',
    rose: 'bg-rose-50 border-rose-200 hover:border-rose-300 hover:bg-rose-100',
  };

  return (
    <div className="text-center py-6 px-4">
      <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-7 h-7 text-violet-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        {isHebrew ? 'היי, מה בא לך היום?' : 'Hey, what would you like today?'}
      </h3>
      <p className="text-xs text-gray-500 max-w-[300px] mx-auto leading-relaxed mb-5">
        {isHebrew
          ? 'בחר/י מצב רוח ונתחיל'
          : 'Pick a mood and let\'s begin'}
      </p>

      {/* Mood cards */}
      <div className="space-y-2 max-w-[300px] mx-auto">
        {moodOptions.map((mood) => (
          <button
            key={mood.emoji}
            onClick={() => onQuickPrompt(mood.prompt)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border',
              'transition-all hover:shadow-sm text-right group cursor-pointer',
              colorClasses[mood.color],
            )}
          >
            <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
              {mood.emoji}
            </span>
            <p className="text-sm font-medium text-gray-700 flex-1">
              {mood.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
