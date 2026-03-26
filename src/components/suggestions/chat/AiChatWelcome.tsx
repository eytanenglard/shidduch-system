// src/components/suggestions/chat/AiChatWelcome.tsx
// =============================================================================
// Welcome screen for the smart assistant (when no messages yet)
// Shows 3 entry points: discovery question, ask about suggestion, share thoughts
// =============================================================================

'use client';

import React from 'react';
import { Sparkles, MessageCircle, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatWelcomeProps {
  locale: 'he' | 'en';
  isGeneralChat: boolean;
  isLoadingDiscovery: boolean;
  onQuickPrompt: (text: string) => void;
}

export default function AiChatWelcome({
  locale,
  isGeneralChat,
  isLoadingDiscovery,
  onQuickPrompt,
}: AiChatWelcomeProps) {
  const isHebrew = locale === 'he';

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
    // Suggestion-specific welcome (existing behavior)
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          {isHebrew ? 'שלום! אני העוזר החכם שלך' : "Hi! I'm your smart assistant"}
        </h3>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
          {isHebrew
            ? 'שאל/י אותי שאלות על ההצעה הזו ואני אעזור לך להחליט'
            : 'Ask me questions about this suggestion and I\'ll help you decide'}
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

  // General chat — smart assistant welcome
  return (
    <div className="text-center py-6 px-4">
      <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-7 h-7 text-violet-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        {isHebrew ? 'העוזר החכם שלך' : 'Your Smart Assistant'}
      </h3>
      <p className="text-xs text-gray-500 max-w-[300px] mx-auto leading-relaxed mb-5">
        {isHebrew
          ? 'אני כאן כדי ללמוד מה חשוב לך, לחפש לך התאמות, ולעזור לך בתהליך'
          : "I'm here to learn what matters to you, find matches, and help you through the process"}
      </p>

      {/* Entry point cards */}
      <div className="space-y-2 max-w-[300px] mx-auto">
        <button
          onClick={() => onQuickPrompt(isHebrew ? 'בוא נתחיל - ספר/י לי מה חשוב לך בבן/בת זוג' : "Let's start - tell me what's important to you in a partner")}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl',
            'bg-violet-50 border border-violet-200 hover:border-violet-300',
            'transition-all hover:shadow-sm text-right group cursor-pointer',
          )}
        >
          <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-800">
              {isHebrew ? 'שיחת דיוק' : 'Discovery Chat'}
            </p>
            <p className="text-[11px] text-violet-500">
              {isHebrew ? 'ספר/י לי על עצמך ומה את/ה מחפש/ת' : 'Tell me about yourself and what you seek'}
            </p>
          </div>
        </button>

        <button
          onClick={() => onQuickPrompt(isHebrew ? 'יש לי שאלה על הצעה שקיבלתי' : 'I have a question about a suggestion I received')}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl',
            'bg-teal-50 border border-teal-200 hover:border-teal-300',
            'transition-all hover:shadow-sm text-right group cursor-pointer',
          )}
        >
          <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Search className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-teal-800">
              {isHebrew ? 'שאלה על הצעה' : 'Ask About Suggestion'}
            </p>
            <p className="text-[11px] text-teal-500">
              {isHebrew ? 'שאל/י על הצעה שקיבלת' : 'Ask about a suggestion you received'}
            </p>
          </div>
        </button>

        <button
          onClick={() => onQuickPrompt(isHebrew ? 'אני רוצה לשתף משהו על מה שאני מחפש/ת' : 'I want to share something about what I\'m looking for')}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl',
            'bg-amber-50 border border-amber-200 hover:border-amber-300',
            'transition-all hover:shadow-sm text-right group cursor-pointer',
          )}
        >
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {isHebrew ? 'שיתוף חופשי' : 'Share Freely'}
            </p>
            <p className="text-[11px] text-amber-500">
              {isHebrew ? 'שתף/י מחשבות, תחושות, תובנות' : 'Share thoughts, feelings, insights'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
