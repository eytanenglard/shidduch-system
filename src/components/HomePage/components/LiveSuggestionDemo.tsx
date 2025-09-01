'use client';

import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import MinimalSuggestionCard from '@/components/suggestions/cards/MinimalSuggestionCard';
import SuggestionDetailsModal from '@/components/suggestions/modals/SuggestionDetailsModal';
import type { ExtendedMatchSuggestion } from '@/components/suggestions/types';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';

// הגדרת טיפוס לתרגומי הדמו הספציפיים שנוספו
type SuggestionDemoDict = {
  hoverTitle: string;
  hoverSubtitle: string;
};

// עדכון הממשק של ה-props
interface LiveSuggestionDemoProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  demoAiAnalysis: AiSuggestionAnalysisResult | null;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
  suggestionDemoDict: SuggestionDemoDict;
  locale: 'he' | 'en';
}

/**
 * קומפוננטה להצגת הדגמה חיה של כרטיס הצעה והמודאל הנפתח ממנו.
 */
export const LiveSuggestionDemo: React.FC<LiveSuggestionDemoProps> = ({
  suggestion,
  userId,
  demoAiAnalysis,
  suggestionsDict,
  profileCardDict,
  locale,
  suggestionDemoDict,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenModal = () => setIsModalOpen(true);

  const questionnaireData =
    suggestion.secondParty.questionnaireResponses?.[0] || null;

  return (
    <div className="w-full max-w-sm lg:max-w-md mx-auto flex flex-col items-center gap-4">
      {/*
       * ===================================================================
       * כאן בוצע התיקון המרכזי:
       * 1. תג ה-<button> הוחלף ב-<div> כדי למנוע קינון לא חוקי של כפתורים.
       * 2. נוסף 'role="button"' ו-'tabIndex={0}' לשמירה על נגישות (מיקוד וזיהוי על ידי קוראי מסך).
       * 3. נוסף אירוע 'onKeyDown' כדי לאפשר הפעלה באמצעות מקלדת (Enter או Space).
       * ===================================================================
       */}
      <div
        role="button"
        tabIndex={0}
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500"
        onClick={handleOpenModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); // מונע גלילה בעת לחיצה על מקש רווח
            handleOpenModal();
          }
        }}
        aria-label={`הצג הצעה עבור ${suggestion.secondParty.firstName}`}
      >
        <MinimalSuggestionCard
          suggestion={suggestion}
          userId={userId}
          onClick={handleOpenModal}
          onInquiry={handleOpenModal}
          onApprove={handleOpenModal}
          onDecline={handleOpenModal}
          isApprovalDisabled={true}
          dict={suggestionsDict.card}
          locale={locale}
        />

        {/* שכבת הריחוף עם הטקסט הדינמי */}
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 pointer-events-none">
          <ZoomIn className="w-12 h-12 mb-2" />
          <p className="font-bold text-lg text-center">
            {suggestionDemoDict.hoverTitle}
          </p>
          <p className="text-sm text-center text-white/80">
            {suggestionDemoDict.hoverSubtitle}
          </p>
        </div>
      </div>

      <SuggestionDetailsModal
        suggestion={suggestion}
        userId={userId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionRequest={(suggestion, action) => {
          alert(
            `זוהי הדגמה בלבד. הפעולה המבוקשת היא "${action === 'approve' ? 'אישור' : 'דחייה'}" עבור ההצעה ל${suggestion.secondParty.firstName}. במערכת האמיתית, היה נפתח חלון אישור.`
          );
        }}
        questionnaire={questionnaireData}
        isDemo={true}
        demoAnalysisData={demoAiAnalysis}
        dict={{
          suggestions: suggestionsDict,
          profileCard: profileCardDict,
        }}
        locale={locale}
      />
    </div>
  );
};
