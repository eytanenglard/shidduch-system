// src/components/suggestions/chat/AiChatHowItWorks.tsx
// =============================================================================
// Explainer dialog — "How the Smart Assistant works"
// =============================================================================

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Compass, Search, UserCheck, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatHowItWorksProps {
  locale: 'he' | 'en';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS_HE = [
  {
    icon: Compass,
    title: 'שיחת דיוק',
    description: 'אני שואל/ת שאלות כדי להבין מה באמת חשוב לך בבן/בת הזוג',
    color: 'text-violet-600 bg-violet-100',
  },
  {
    icon: Search,
    title: 'חיפוש חכם',
    description: 'מחפש/ת במאגר שלנו התאמות שמתאימות בדיוק לך — על בסיס מה שלמדתי',
    color: 'text-teal-600 bg-teal-100',
  },
  {
    icon: UserCheck,
    title: 'הצגת מועמד/ת',
    description: 'מציג/ה לך פרופיל אחד בכל פעם עם הסבר למה זו התאמה טובה',
    color: 'text-sky-600 bg-sky-100',
  },
  {
    icon: MessageCircle,
    title: 'שיחה על ההצעה',
    description: 'אפשר לשאול אותי כל שאלה על ההתאמה — אני אענה בכנות ובפירוט',
    color: 'text-amber-600 bg-amber-100',
  },
  {
    icon: Heart,
    title: 'החלטה',
    description: 'אם מעוניין/ת — נוצרת הצעה רשמית. אם לא — עוברים להבא/ה',
    color: 'text-rose-600 bg-rose-100',
  },
];

const STEPS_EN = [
  {
    icon: Compass,
    title: 'Discovery Chat',
    description: 'I ask questions to understand what truly matters to you in a partner',
    color: 'text-violet-600 bg-violet-100',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'I search our database for matches tailored to you — based on what I learned',
    color: 'text-teal-600 bg-teal-100',
  },
  {
    icon: UserCheck,
    title: 'Candidate Presentation',
    description: 'I present one profile at a time with an explanation of why it\'s a good match',
    color: 'text-sky-600 bg-sky-100',
  },
  {
    icon: MessageCircle,
    title: 'Discussion',
    description: 'Ask me anything about the match — I\'ll answer honestly and in detail',
    color: 'text-amber-600 bg-amber-100',
  },
  {
    icon: Heart,
    title: 'Decision',
    description: 'If interested — an official suggestion is created. If not — we move to the next one',
    color: 'text-rose-600 bg-rose-100',
  },
];

export default function AiChatHowItWorks({ locale, open, onOpenChange }: AiChatHowItWorksProps) {
  const isHebrew = locale === 'he';
  const steps = isHebrew ? STEPS_HE : STEPS_EN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md', isHebrew && 'text-right')}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isHebrew ? 'איך העוזר החכם עובד?' : 'How does the Smart Assistant work?'}
          </DialogTitle>
          <DialogDescription>
            {isHebrew
              ? 'העוזר החכם מלווה אותך בתהליך מובנה למציאת ההתאמה הטובה ביותר'
              : 'The Smart Assistant guides you through a structured process to find your best match'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', step.color)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
                    <h4 className="text-sm font-semibold text-gray-800">{step.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            {isHebrew
              ? '10 הצעות בשבוע | הכל נשמר ומשתפר עם הזמן | פרטיות מלאה'
              : '10 suggestions per week | Everything is saved & improves over time | Full privacy'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
