// src/components/suggestions/interested/CompareDialog.tsx
// Side-by-side comparison of two saved suggestions

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Scale,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Badge available if needed
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  onActivate: (suggestion: ExtendedMatchSuggestion) => void;
}

const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

const TEXTS = {
  he: {
    title: 'השוואת הצעות',
    selectFirst: 'בחר/י הצעה ראשונה',
    selectSecond: 'בחר/י הצעה שנייה',
    age: 'גיל',
    city: 'עיר',
    occupation: 'תעסוקה',
    education: 'השכלה',
    religiousLevel: 'רמה דתית',
    matchReason: 'למה מתאים',
    activate: 'אשר/י',
    vs: 'לעומת',
    noData: 'לא צוין',
    chooseSuggestion: 'בחר/י',
  },
  en: {
    title: 'Compare Suggestions',
    selectFirst: 'Select first suggestion',
    selectSecond: 'Select second suggestion',
    age: 'Age',
    city: 'City',
    occupation: 'Occupation',
    education: 'Education',
    religiousLevel: 'Religious Level',
    matchReason: 'Why it matches',
    activate: 'Approve',
    vs: 'vs',
    noData: 'Not specified',
    chooseSuggestion: 'Choose',
  },
};

const CompareDialog: React.FC<CompareDialogProps> = ({
  open,
  onOpenChange,
  suggestions,
  userId,
  locale,
  onActivate,
}) => {
  const t = TEXTS[locale];
  const isRtl = locale === 'he';

  const [selectedA, setSelectedA] = useState<string | null>(
    suggestions[0]?.id || null
  );
  const [selectedB, setSelectedB] = useState<string | null>(
    suggestions[1]?.id || null
  );

  const suggestionA = suggestions.find((s) => s.id === selectedA);
  const suggestionB = suggestions.find((s) => s.id === selectedB);

  const getTarget = (suggestion: ExtendedMatchSuggestion) => {
    return suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;
  };

  const renderSelector = (
    selected: string | null,
    onSelect: (id: string) => void,
    exclude: string | null,
    label: string
  ) => (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-2">
        {suggestions
          .filter((s) => s.id !== exclude)
          .map((s) => {
            const target = getTarget(s);
            const mainImage = target.images?.find((img) => img.isMain);
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm',
                  selected === s.id
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {mainImage?.url ? (
                    <Image
                      src={getRelativeCloudinaryPath(mainImage.url)}
                      alt={target.firstName}
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <span className="font-medium">{target.firstName}</span>
              </button>
            );
          })}
      </div>
    </div>
  );

  const renderProfile = (
    suggestion: ExtendedMatchSuggestion | undefined,
    _side: 'left' | 'right'
  ) => {
    if (!suggestion) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[300px]">
          <p className="text-gray-400 text-sm">{t.chooseSuggestion}</p>
        </div>
      );
    }

    const target = getTarget(suggestion);
    const mainImage = target.images?.find((img) => img.isMain);
    const age = calculateAge(target.profile?.birthDate);

    const fields = [
      {
        icon: MapPin,
        label: t.city,
        value: target.profile?.city,
      },
      {
        icon: Briefcase,
        label: t.occupation,
        value: target.profile?.occupation,
      },
      {
        icon: GraduationCap,
        label: t.education,
        value: target.profile?.education,
      },
      {
        icon: Star,
        label: t.religiousLevel,
        value: target.profile?.religiousLevel,
      },
    ];

    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Photo + Name */}
        <div className="relative h-40">
          {mainImage?.url ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={target.firstName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <User className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 right-3 left-3 text-white">
            <h4 className="text-lg font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
              {target.firstName}
              {target.lastName ? ` ${target.lastName.charAt(0)}.` : ''}
            </h4>
            {age && (
              <p className="text-sm text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                {t.age}: {age}
              </p>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-3">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <field.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{field.label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {field.value || t.noData}
                </p>
              </div>
            </div>
          ))}

          {/* Match reason */}
          {suggestion.matchingReason && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-2">
                <Heart className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-600 font-medium">
                    {t.matchReason}
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                    {suggestion.matchingReason.length > 120
                      ? `${suggestion.matchingReason.substring(0, 120)}...`
                      : suggestion.matchingReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activate button */}
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl mt-2"
            onClick={() => onActivate(suggestion)}
          >
            <Heart
              className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')}
            />
            {t.activate}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl border-0 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Scale className="w-5 h-5 text-teal-500" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        {/* Selectors */}
        {suggestions.length > 2 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {renderSelector(selectedA, setSelectedA, selectedB, t.selectFirst)}
            {renderSelector(selectedB, setSelectedB, selectedA, t.selectSecond)}
          </div>
        )}

        {/* Comparison */}
        <div className="flex gap-4 items-stretch">
          {renderProfile(suggestionA, 'left')}

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border border-orange-200 shadow-sm">
              <span className="text-xs font-bold text-orange-600">{t.vs}</span>
            </div>
          </div>

          {renderProfile(suggestionB, 'right')}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
