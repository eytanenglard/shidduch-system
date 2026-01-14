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
 * עודכן לעיצוב התואם את ה-HeroSection (Teal/Orange palette).
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
       * עדכון עיצובי:
       * 1. צללים (Shadows): הוחלפו לצללים צבעוניים (Teal/Orange) כדי להתאים ל-Hero.
       * 2. מסגרת (Border): נוספה מסגרת עדינה לבנה/שקופה למראה "זכוכית".
       * 3. פוקוס (Ring): עודכן לצבע Teal.
       * ===================================================================
       */}
      <div
        role="button"
        tabIndex={0}
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-xl shadow-teal-900/5 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 border border-white/60 bg-white"
        onClick={handleOpenModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
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

        {/* 
         * שכבת הריחוף (Overlay) - עודכנה לגרדיאנט Teal עמוק ושקיפות 
         * במקום שחור פשוט, כדי להתאים לאווירה היוקרתית והנקייה של ה-Hero.
         */}
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/95 via-teal-800/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white p-4 pointer-events-none backdrop-blur-[2px]">
          {/* אייקון עם אנימציה קלה */}
          <div className="bg-white/10 p-3 rounded-full mb-3 backdrop-blur-sm border border-white/20 transform group-hover:scale-110 transition-transform duration-300">
            <ZoomIn className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          
          <p className="font-bold text-xl text-center drop-shadow-sm">
            {suggestionDemoDict.hoverTitle}
          </p>
          <p className="text-sm text-center text-teal-50 mt-1 max-w-[80%] leading-relaxed">
            {suggestionDemoDict.hoverSubtitle}
          </p>
          
          {/* פס קישוט תחתון התואם לגרדיאנט של הכפתור הראשי */}
          <div className="mt-4 w-12 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 rounded-full shadow-lg shadow-orange-500/30" />
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