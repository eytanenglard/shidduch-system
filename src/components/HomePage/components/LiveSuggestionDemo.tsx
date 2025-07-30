// src/components/HomePage/components/LiveSuggestionDemo.tsx
'use client';

import React, { useState } from 'react';
import MinimalSuggestionCard from '@/app/components/suggestions/cards/MinimalSuggestionCard';
import SuggestionDetailsModal from '@/app/components/suggestions/modals/SuggestionDetailsModal';
import type { ExtendedMatchSuggestion } from '@/app/components/suggestions/types';
import { ZoomIn } from 'lucide-react';
// (הייבוא של UserAiAnalysisDialog לא נדרש יותר ישירות כאן, אך נשאיר אותו כי הוא לא מזיק)
import { UserAiAnalysisDialog } from '@/app/components/suggestions/dialogs/UserAiAnalysisDialog';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

interface LiveSuggestionDemoProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  demoAiAnalysis: AiSuggestionAnalysisResult | null;
}

export const LiveSuggestionDemo: React.FC<LiveSuggestionDemoProps> = ({
  suggestion,
  userId,
  demoAiAnalysis,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenModal = () => setIsModalOpen(true);

  const questionnaireData =
    suggestion.secondParty.questionnaireResponses?.[0] || null;

  return (
    <div className="w-full max-w-sm lg:max-w-md mx-auto flex flex-col items-center gap-4">
      <div
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        onClick={handleOpenModal}
        role="button"
        tabIndex={0}
        aria-label={`הצג הצעה עבור ${suggestion.secondParty.firstName}`}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && handleOpenModal()
        }
      >
        <MinimalSuggestionCard
          suggestion={suggestion}
          userId={userId}
          onClick={handleOpenModal}
          onInquiry={handleOpenModal}
          onApprove={handleOpenModal}
          onDecline={handleOpenModal}
          isApprovalDisabled={true}
        />
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
          <ZoomIn className="w-12 h-12 mb-2" />
          <p className="font-bold text-lg text-center">לחצו להצגה מלאה</p>
          <p className="text-sm text-center text-white/80">
            גלו את נימוקי השדכן, התשובות ועוד
          </p>
        </div>
      </div>

      {/* --- שינוי --- */}
      {/* הסרנו את הקומפוננטה UserAiAnalysisDialog שהייתה כאן. */}
      {/* הכפתור לניתוח AI יופיע רק בתוך המודאל הגדול (SuggestionDetailsModal) */}
      {/* תחת הטאב "ניתוח התאמה". */}

      <SuggestionDetailsModal
        suggestion={suggestion}
        userId={userId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusChange={async () => {
          alert(
            'זוהי הדגמה בלבד. במערכת האמיתית, הפעולה שלך הייתה מעדכנת את סטטוס ההצעה.'
          );
          handleCloseModal();
        }}
        // @ts-ignore
        questionnaire={questionnaireData}
        isDemo={true}
        demoAnalysisData={demoAiAnalysis}
      />
    </div>
  );
};