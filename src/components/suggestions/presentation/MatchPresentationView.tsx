// src/components/suggestions/presentation/MatchPresentationView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import {
  Heart,
  Sparkles,
  User,
  GraduationCap,
  Scroll,
  MapPin,
  Briefcase,
  Quote,
  ChevronLeft,
  ChevronRight, // הוספתי לייבוא כי היה חסר בחלק מהמקרים
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../types';
import type {
  SuggestionsPresentationDict,
  AiAnalysisDict,
} from '@/types/dictionary';

// --- Sub-components Updated ---

const HeroIntroduction: React.FC<{
  matchmaker: { firstName: string; lastName: string };
  personalNote?: string | null;
  dict: SuggestionsPresentationDict['hero'];
}> = ({ matchmaker, personalNote, dict }) => (
  // Background: Teal -> Orange -> Rose (Soft)
  <div
    className="text-center p-6 rounded-2xl bg-gradient-to-br from-teal-100/50 via-orange-100/50 to-rose-100/50 border border-teal-200/40 shadow-lg"
    dir="rtl" // או דינמי אם יש לך את ה-locale כאן, אבל ה-Props לא כוללים locale כרגע.
    // מכיוון שאין locale ב-props של הקומפוננטה הזו, צריך להוסיף אותו לממשק או להסתמך על היישור למרכז (text-center) שקיים כבר.
    // הבעיה היא בציטוט למטה.
  >
    {' '}
    <div className="flex justify-center mb-4">
      <Avatar className="w-16 h-16 border-4 border-white shadow-md">
        {/* Avatar: Teal Gradient */}
        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-xl font-bold">
          {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
        </AvatarFallback>
      </Avatar>
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
      {dict.title}
    </h2>
    <p className="text-gray-600 mt-2">
      {dict.matchmakerThoughts.replace('{{name}}', matchmaker.firstName)}
    </p>
    {personalNote && (
      <div className="mt-4 max-w-2xl mx-auto">
        {/* Quote Box: Orange Tint */}
        <div className="relative bg-white/60 p-4 rounded-xl shadow-inner border border-orange-100">
          <Quote className="absolute top-2 right-2 w-8 h-8 text-orange-200/80 transform scale-x-[-1]" />
          <p className="text-lg text-orange-900 italic font-medium leading-relaxed">
            {personalNote}
          </p>
          <Quote className="absolute bottom-2 left-2 w-8 h-8 text-orange-200/80" />
        </div>
      </div>
    )}
  </div>
);

const ProfilePeek: React.FC<{
  targetParty: ExtendedMatchSuggestion['secondParty'];
  onViewProfileClick: () => void;
  dict: SuggestionsPresentationDict['peek'];
  locale: 'he' | 'en'; // Added locale for direction
}> = ({ targetParty, onViewProfileClick, dict, locale }) => {
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;
  return (
    <Card
      className="overflow-hidden shadow-xl transition-all hover:shadow-2xl border-0"
      dir={locale === 'he' ? 'rtl' : 'ltr'} // הוספת כיוון לכרטיס
    >
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="relative h-64 md:h-auto">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={`תמונה של ${targetParty.firstName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <User className="w-16 h-16 text-slate-400" />
            </div>
          )}
        </div>
        <div className="md:col-span-2 p-6 flex flex-col justify-between bg-white text-start">
          <div>
            <p className="text-sm font-semibold text-teal-600">
              {dict.opportunity}
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
              {targetParty.firstName} {targetParty.lastName}
              {age && (
                <span className="text-2xl font-bold text-gray-500 mx-2">
                  {dict.age.replace('{{age}}', age.toString())}
                </span>
              )}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{targetParty.profile?.city || dict.notSpecified}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-teal-500" />
                <span>
                  {targetParty.profile?.occupation || dict.notSpecified}
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn('mt-6', locale === 'he' ? 'text-left' : 'text-right')}
          >
            <Button
              onClick={onViewProfileClick}
              size="lg"
              className="font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {dict.viewProfileButton}
              {locale === 'he' ? (
                <ChevronLeft className="w-5 h-5 mr-2" />
              ) : (
                <ChevronRight className="w-5 h-5 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const KeyIngredients: React.FC<{
  matchingReason?: string | null;
  dict: SuggestionsPresentationDict['ingredients'];
}> = ({ matchingReason, dict }) => {
  const getHighlightsFromReason = () => {
    const highlights: { icon: React.ElementType; text: string }[] = [];
    const reason = matchingReason?.toLowerCase() || '';
    if (
      reason.includes('ערכים') ||
      reason.includes('השקפה') ||
      reason.includes('values')
    ) {
      highlights.push({ icon: Scroll, text: dict.values });
    }
    if (
      reason.includes('אישיות') ||
      reason.includes('אופי') ||
      reason.includes('personality')
    ) {
      highlights.push({ icon: Heart, text: dict.personality });
    }
    if (
      reason.includes('רקע') ||
      reason.includes('השכלה') ||
      reason.includes('background')
    ) {
      highlights.push({ icon: GraduationCap, text: dict.background });
    }
    if (highlights.length === 0 && matchingReason) {
      highlights.push({ icon: Sparkles, text: dict.spark });
    }
    return highlights;
  };

  const highlights = getHighlightsFromReason();

  if (highlights.length === 0) return null;

  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{dict.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item, index) => (
          <div
            key={index}
            // Card: White with Orange Top Border
            className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500 transform transition-transform hover:-translate-y-2"
          >
            {/* Icon: Orange Light Background */}
            <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <item.icon className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-xl text-gray-800">{item.text}</h4>
          </div>
        ))}
      </div>
      {matchingReason && (
        // Notes Card: Teal Tint
        <Card className="mt-6 bg-teal-50 border-teal-200">
          <CardContent className="p-4">
            <p className="text-teal-900 text-center">
              <span className="font-semibold">{dict.matchmakerNotes}</span>{' '}
              {matchingReason}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- Main Component ---
interface MatchPresentationViewProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onSwitchTab: (tab: 'profile' | 'details' | 'compatibility') => void;
  dict: SuggestionsPresentationDict;
  aiAnalysisDict: AiAnalysisDict;
  locale: 'he' | 'en';
}

const MatchPresentationView: React.FC<MatchPresentationViewProps> = ({
  suggestion,
  userId,
  onSwitchTab,
  dict,
  aiAnalysisDict,
  locale,
}) => {
  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;

  const currentUserParty = isFirstParty
    ? suggestion.firstParty
    : suggestion.secondParty;

  const handleViewProfile = () => {
    onSwitchTab('profile');
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gradient-to-b from-slate-50 to-orange-50/20">
      <HeroIntroduction
        matchmaker={suggestion.matchmaker}
        personalNote={
          isFirstParty
            ? suggestion.firstPartyNotes
            : suggestion.secondPartyNotes
        }
        dict={dict.hero}
      />

      <ProfilePeek
        targetParty={targetParty}
        onViewProfileClick={handleViewProfile}
        dict={dict.peek}
        locale={locale}
      />

      <KeyIngredients
        matchingReason={suggestion.matchingReason}
        dict={dict.ingredients}
      />

      <div className="text-center pt-4 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">
          {dict.aiCta.title}
        </h3>
        <p className="text-gray-600 max-w-xl mx-auto mb-4">
          {dict.aiCta.description}
        </p>
        <UserAiAnalysisDialog
          suggestedUserId={targetParty.id}
          dict={aiAnalysisDict}
          locale={locale}
          currentUserName={currentUserParty.firstName}
          suggestedUserName={targetParty.firstName}
        />
      </div>
    </div>
  );
};

export default MatchPresentationView;
