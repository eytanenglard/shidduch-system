// src/components/suggestions/chat/AiChatRejectionPicker.tsx
// =============================================================================
// Quick rejection category picker — shown inline when "Not for me" is tapped
// =============================================================================

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MapPin, Calendar, Compass, HelpCircle, Frown, GraduationCap, Camera, Send } from 'lucide-react';

const REJECTION_OPTIONS = [
  { category: 'NOT_ATTRACTED', icon: Frown, he: 'לא נמשכתי', en: 'Not attracted' },
  { category: 'RELIGIOUS_GAP', icon: Heart, he: 'פער דתי', en: 'Religious gap' },
  { category: 'AGE_GAP', icon: Calendar, he: 'פער גילאים', en: 'Age gap' },
  { category: 'GEOGRAPHIC_GAP', icon: MapPin, he: 'מרחק גיאוגרפי', en: 'Geographic distance' },
  { category: 'EDUCATION_GAP', icon: GraduationCap, he: 'פער השכלתי', en: 'Education gap' },
  { category: 'BAD_PHOTOS', icon: Camera, he: 'תמונות לא ברורות', en: 'Unclear photos' },
  { category: 'GUT_FEELING', icon: Compass, he: 'תחושת בטן', en: 'Gut feeling' },
  { category: 'OTHER', icon: HelpCircle, he: 'אחר', en: 'Other' },
] as const;

interface AiChatRejectionPickerProps {
  locale: 'he' | 'en';
  onSelect: (category: string, freeText?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function AiChatRejectionPicker({
  locale,
  onSelect,
  onCancel,
  disabled,
}: AiChatRejectionPickerProps) {
  const isHebrew = locale === 'he';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');

  const handleCategoryClick = (category: string) => {
    // For "other" — show text input first
    if (category === 'OTHER') {
      setSelectedCategory('OTHER');
      return;
    }
    // For regular categories — select and show optional text
    setSelectedCategory(category);
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onSelect(selectedCategory, freeText.trim() || undefined);
  };

  // If a category is selected, show optional free text input
  if (selectedCategory) {
    return (
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 text-center">
          {isHebrew ? 'רוצה להוסיף פרטים? (לא חובה)' : 'Want to add details? (optional)'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={isHebrew ? 'למשל: חיפשתי מישהו יותר...' : 'e.g., I was looking for someone more...'}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
            maxLength={200}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="px-3 py-2 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full text-[11px] text-gray-400 hover:text-gray-500 py-1 transition-colors"
        >
          {isHebrew ? 'דלג — שלח בלי פרטים' : 'Skip — send without details'}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 text-center">
        {isHebrew ? 'למה לא מתאים?' : 'Why not a match?'}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {REJECTION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.category}
              onClick={() => handleCategoryClick(opt.category)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
                'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200',
                'transition-all active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {isHebrew ? opt.he : opt.en}
            </button>
          );
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-[11px] text-gray-400 hover:text-gray-500 py-1 transition-colors"
      >
        {isHebrew ? 'ביטול' : 'Cancel'}
      </button>
    </div>
  );
}
