// src/app/components/suggestions/presentation/MatchPresentationView.tsx
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

// --- קומפוננטות עזר פנימיות לעיצוב החדש ---

const HeroIntroduction: React.FC<{
  matchmaker: { firstName: string; lastName: string };
  personalNote?: string | null;
  dict: SuggestionsPresentationDict['hero'];
}> = ({ matchmaker, personalNote, dict }) => (
  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-100/50 via-pink-100/50 to-blue-100/50 border border-purple-200/40 shadow-lg">
    <div className="flex justify-center mb-4">
      <Avatar className="w-16 h-16 border-4 border-white shadow-md">
        <AvatarFallback className="bg-purple-500 text-white text-xl font-bold">
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
        <div className="relative bg-white/60 p-4 rounded-xl shadow-inner border border-purple-100">
          <Quote className="absolute top-2 right-2 w-8 h-8 text-purple-200/80 transform scale-x-[-1]" />
          <p className="text-lg text-purple-800 italic font-medium leading-relaxed">
            {personalNote}
          </p>
          <Quote className="absolute bottom-2 left-2 w-8 h-8 text-purple-200/80" />
        </div>
      </div>
    )}
  </div>
);

const ProfilePeek: React.FC<{
  targetParty: ExtendedMatchSuggestion['secondParty'];
  onViewProfileClick: () => void;
  dict: SuggestionsPresentationDict['peek'];
}> = ({ targetParty, onViewProfileClick, dict }) => {
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;
  return (
    <Card className="overflow-hidden shadow-xl transition-all hover:shadow-2xl">
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
        <div className="md:col-span-2 p-6 flex flex-col justify-between bg-white">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              {dict.opportunity}
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
              {targetParty.firstName} {targetParty.lastName}
              {age && (
                <span className="text-2xl font-bold text-gray-500 ml-2">
                  {dict.age.replace('{{age}}', age.toString())}
                </span>
              )}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span>{targetParty.profile?.city || dict.notSpecified}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <span>
                  {targetParty.profile?.occupation || dict.notSpecified}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-left">
            <Button
              onClick={onViewProfileClick}
              size="lg"
              className="font-bold"
            >
              {dict.viewProfileButton}
              <ChevronLeft className="w-5 h-5 mr-2" />
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
            className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500 transform transition-transform hover:-translate-y-2"
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <item.icon className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-xl text-gray-800">{item.text}</h4>
          </div>
        ))}
      </div>
      {matchingReason && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-gray-700 text-center">
              <span className="font-semibold">{dict.matchmakerNotes}</span>{' '}
              {matchingReason}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- הקומפוננטה הראשית המעודכנת ---
interface MatchPresentationViewProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onSwitchTab: (tab: 'profile' | 'details' | 'compatibility') => void;
  dict: SuggestionsPresentationDict;
  aiAnalysisDict: AiAnalysisDict;
  locale: 'he' | 'en'; // ✨ הוספת המאפיין החסר
}

const MatchPresentationView: React.FC<MatchPresentationViewProps> = ({
  suggestion,
  userId,
  onSwitchTab,
  dict,
  aiAnalysisDict,
  locale, // ✨ קליטת המאפיין
}) => {
  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;
  
  // ✨ הוספת משתנים עבור שמות המשתמשים
  const currentUserParty = isFirstParty
    ? suggestion.firstParty
    : suggestion.secondParty;

  const handleViewProfile = () => {
    onSwitchTab('profile');
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gradient-to-b from-slate-50 to-blue-50">
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
        {/* ✨ עדכון הקריאה עם כל המאפיינים הנדרשים */}
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