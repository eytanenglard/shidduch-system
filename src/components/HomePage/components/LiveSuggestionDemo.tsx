// src/components/HomePage/components/LiveSuggestionDemo.tsx
'use client';

import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';

// ייבוא קומפוננטות הליבה של פיצ'ר ההצעות
import MinimalSuggestionCard from '@/components/suggestions/cards/MinimalSuggestionCard';
import SuggestionDetailsModal from '@/components/suggestions/modals/SuggestionDetailsModal';

// ייבוא טיפוסים (Types)
import type { ExtendedMatchSuggestion } from '@/components/suggestions/types';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type { SuggestionsDictionary } from '@/types/dictionary';

/**
 * הממשק (interface) המגדיר את ה-props שהקומפוננטה מקבלת.
 * עודכן כדי לכלול את מילון התרגומים.
 */
interface LiveSuggestionDemoProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  demoAiAnalysis: AiSuggestionAnalysisResult | null;
  suggestionsDict: SuggestionsDictionary; // ✨ prop חדש עבור התרגומים
}

/**
 * קומפוננטה להצגת הדגמה חיה של כרטיס הצעה והמודאל הנפתח ממנו.
 * הקומפוננטה מנהלת את מצב הפתיחה/סגירה של המודאל ומעבירה לו את כל הנתונים הנדרשים,
 * כולל אובייקט התרגום המלא.
 */
export const LiveSuggestionDemo: React.FC<LiveSuggestionDemoProps> = ({
  suggestion,
  userId,
  demoAiAnalysis,
  suggestionsDict, // ✨ קבלת התרגומים מה-props
}) => {
  // ניהול מצב מקומי כדי לדעת אם המודאל פתוח או סגור
  const [isModalOpen, setIsModalOpen] = useState(false);

  // פונקציות עזר לניהול מצב המودאל
  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenModal = () => setIsModalOpen(true);

  // חילוץ המידע על השאלון של הצד השני מההצעה
  const questionnaireData =
    suggestion.secondParty.questionnaireResponses?.[0] || null;

  return (
    <div className="w-full max-w-sm lg:max-w-md mx-auto flex flex-col items-center gap-4">
      {/* 
        עטיפת הכרטיס בכפתור הופכת את כל היחידה ללחיצה ומשפרת נגישות.
        הטקסט ב-aria-label מספק תיאור ברור לקוראי מסך.
      */}
      <button
        type="button" // מונע התנהגות ברירת מחדל של שליחת טופס
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-full text-left"
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
          isApprovalDisabled={true} // בהדגמה, כפתור האישור מושבת
          dict={suggestionsDict.card} // ✨ העברת החלק הרלוונטי של המילון לקומפוננטת הכרטיס
        />

        {/* שכבת ריחוף (hover) המעודדת את המשתמש ללחוץ */}
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
          <ZoomIn className="w-12 h-12 mb-2" />
          <p className="font-bold text-lg text-center">לחצו להצגה מלאה</p>
          <p className="text-sm text-center text-white/80">
            גלו את נימוקי השדכן, התשובות ועוד
          </p>
        </div>
      </button>

      {/* 
        קומפוננטת המודאל המלאה. היא תמיד קיימת ב-DOM אך מוצגת רק כאשר isModalOpen=true.
        היא מקבלת את כל הנתונים הנדרשים, כולל אובייקט התרגומים המלא.
      */}
      <SuggestionDetailsModal
        suggestion={suggestion}
        userId={userId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionRequest={(suggestion, action) => {
          // מאחר וזו הדגמה, אנו מציגים התראה פשוטה במקום לבצע פעולה אמיתית.
          alert(
            `זוהי הדגמה בלבד. הפעולה המבוקשת היא "${action === 'approve' ? 'אישור' : 'דחייה'}" עבור ההצעה ל${suggestion.secondParty.firstName}. במערכת האמיתית, היה נפתח חלון אישור.`
          );
        }}
        questionnaire={questionnaireData}
        isDemo={true} // מסמן למודאל להתנהג כמצב הדגמה
        demoAnalysisData={demoAiAnalysis}
        dict={suggestionsDict} // ✨ העברת אובייקט התרגומים המלא למודאל
      />
    </div>
  );
};