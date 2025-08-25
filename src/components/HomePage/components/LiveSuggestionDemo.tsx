// src/components/HomePage/components/LiveSuggestionDemo.tsx
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

// ✨ 1. הגדרת טיפוס לתרגומי הדמו הספציפיים שנוספו
type SuggestionDemoDict = {
  hoverTitle: string;
  hoverSubtitle: string;
};

/**
 * ✨ 2. עדכון הממשק של ה-props
 * הוספנו את suggestionDemoDict כדי לקבל את התרגומים של שכבת הריחוף.
 */
interface LiveSuggestionDemoProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  demoAiAnalysis: AiSuggestionAnalysisResult | null;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
  suggestionDemoDict: SuggestionDemoDict; // הוספנו את ה-prop החדש
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
  suggestionDemoDict, // ✨ 3. קבלת ה-prop החדש
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenModal = () => setIsModalOpen(true);

  const questionnaireData =
    suggestion.secondParty.questionnaireResponses?.[0] || null;

  return (
    <div className="w-full max-w-sm lg:max-w-md mx-auto flex flex-col items-center gap-4">
      <button
        type="button"
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 w-full"
        onClick={handleOpenModal}
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
        />

        {/* 
          ✨ 4. עדכון הטקסטים הקשיחים לשימוש בתרגומים מה-dict
          הטקסטים "לחצו להצגה מלאה" וכו' הוחלפו במשתנים דינמיים.
        */}
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 pointer-events-none">
          <ZoomIn className="w-12 h-12 mb-2" />
          <p className="font-bold text-lg text-center">
            {suggestionDemoDict.hoverTitle}
          </p>
          <p className="text-sm text-center text-white/80">
            {suggestionDemoDict.hoverSubtitle}
          </p>
        </div>
      </button>

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
      />
    </div>
  );
};
