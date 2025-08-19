// src/app/components/suggestions/presentation/MatchPresentationView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import {
  Heart,
  Sparkles,
  User,
  BookOpen,
  Scroll,
  MapPin,
  Briefcase,
  Quote,
  GraduationCap,
  ChevronLeft,
  type LucideProps,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../types';

// --- קומפוננטות עזר פנימיות לעיצוב החדש ---

/**
 * HeroIntroduction: פתיח אישי מהשדכן.
 * יוצר את המסגרת הרגשית להצעה.
 */
const HeroIntroduction: React.FC<{
  matchmaker: { firstName: string; lastName: string };
  personalNote?: string | null;
}> = ({ matchmaker, personalNote }) => (
  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-100/50 via-pink-100/50 to-blue-100/50 border border-purple-200/40 shadow-lg">
    <div className="flex justify-center mb-4">
      <Avatar className="w-16 h-16 border-4 border-white shadow-md">
        <AvatarFallback className="bg-purple-500 text-white text-xl font-bold">
          {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
        </AvatarFallback>
      </Avatar>
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
      הצעה מיוחדת בדרך אליך...
    </h2>
    <p className="text-gray-600 mt-2">
      מחשבות מהשדכן/ית, {matchmaker.firstName}:
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

/**
 * ProfilePeek: כרטיס הצצה למועמד/ת.
 * עונה על השאלה "מי?" ויוצר סקרנות.
 */
const ProfilePeek: React.FC<{
  targetParty: ExtendedMatchSuggestion['secondParty'];
  onViewProfileClick: () => void;
}> = ({ targetParty, onViewProfileClick }) => {
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
              הזדמנות להכיר את
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
              {targetParty.firstName} {targetParty.lastName}
              {age && (
                <span className="text-2xl font-bold text-gray-500 ml-2">
                  , {age}
                </span>
              )}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span>{targetParty.profile?.city || 'לא צוין'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <span>{targetParty.profile?.occupation || 'לא צוין'}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-left">
            <Button
              onClick={onViewProfileClick}
              size="lg"
              className="font-bold"
            >
              לפרופיל המלא
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * KeyIngredients: רכיבי המפתח להתאמה.
 * הופך נתונים לסיפור שיווקי ומשכנע.
 */
const KeyIngredients: React.FC<{
  matchingReason?: string | null;
}> = ({ matchingReason }) => {
  // לוגיקה פשוטה לחילוץ נקודות מסיבת ההתאמה
  const getHighlightsFromReason = () => {
    const highlights: { icon: React.ElementType; text: string }[] = [];
    const reason = matchingReason?.toLowerCase() || '';
    if (reason.includes('ערכים') || reason.includes('השקפה')) {
      highlights.push({ icon: Scroll, text: 'ערכים והשקפת עולם' });
    }
    if (reason.includes('אישיות') || reason.includes('אופי')) {
      highlights.push({ icon: Heart, text: 'חיבור אישיותי' });
    }
    if (reason.includes('רקע') || reason.includes('השכלה')) {
      highlights.push({ icon: GraduationCap, text: 'רקע וסגנון חיים' });
    }
    if (highlights.length === 0 && matchingReason) {
      highlights.push({ icon: Sparkles, text: 'ניצוץ מיוחד' });
    }
    return highlights;
  };

  const highlights = getHighlightsFromReason();

  if (highlights.length === 0) return null;

  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        רכיבי מפתח להתאמה מוצלחת
      </h3>
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
              <span className="font-semibold">פירוט מהשדכן/ית:</span>{' '}
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
}

const MatchPresentationView: React.FC<MatchPresentationViewProps> = ({
  suggestion,
  userId,
  onSwitchTab,
}) => {
  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;

  // פונקציה שתעביר את המשתמש לטאב הפרופיל
  const handleViewProfile = () => {
    onSwitchTab('profile');
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gradient-to-b from-slate-50 to-blue-50">
      {/* 1. הפתיח האישי */}
      <HeroIntroduction
        matchmaker={suggestion.matchmaker}
        personalNote={
          isFirstParty
            ? suggestion.firstPartyNotes
            : suggestion.secondPartyNotes
        }
      />

      {/* 2. כרטיס הצצה למועמד/ת */}
      <ProfilePeek
        targetParty={targetParty}
        onViewProfileClick={handleViewProfile}
      />

      {/* 3. רכיבי המפתח להתאמה */}
      <KeyIngredients matchingReason={suggestion.matchingReason} />

      {/* 4. חוות דעת נוספת - AI */}
      <div className="text-center pt-4 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">
          רוצה חוות דעת נוספת?
        </h3>
        <p className="text-gray-600 max-w-xl mx-auto mb-4">
          קבל ניתוח מעמיק מבוסס AI על נקודות החיבור, פוטנציאל לצמיחה ואפילו
          רעיונות לפתיחת שיחה.
        </p>
        <UserAiAnalysisDialog suggestedUserId={targetParty.id} />
      </div>
    </div>
  );
};

export default MatchPresentationView;
