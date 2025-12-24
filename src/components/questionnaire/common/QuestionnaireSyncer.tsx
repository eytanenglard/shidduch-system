// src/components/questionnaire/common/QuestionnaireSyncer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function QuestionnaireSyncer() {
  const { data: session, status } = useSession();
  const isSyncing = useRef(false);

  useEffect(() => {
    const syncData = async () => {
      // 1. תנאים להפעלת הסנכרון: משתמש מחובר + לא מסנכרן כרגע
      if (
        status !== 'authenticated' ||
        !session?.user?.id ||
        isSyncing.current
      ) {
        return;
      }

      // 2. בדיקה אם יש מידע לוקאלי
      const localDataString = localStorage.getItem('tempQuestionnaire');
      if (!localDataString) return;

      try {
        const localData = JSON.parse(localDataString);

        // בדיקה שהמידע הלוקאלי מכיל תוכן אמיתי
        if (!localData.answers || localData.answers.length === 0) {
          return;
        }

        isSyncing.current = true;
        console.log(
          '[QuestionnaireSyncer] Found local data for registered user. Syncing...'
        );

        // 3. עדכון ה-ID של המשתמש במידע הלוקאלי ל-ID האמיתי מהסשן
        localData.userId = session.user.id;

        // 4. שליחה לשרת
        const response = await fetch('/api/questionnaire', {
          method: 'PUT', // שימוש ב-PUT כפי שמוגדר ב-API שלך לעדכון/יצירה
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(localData),
        });

        if (!response.ok) {
          throw new Error('Failed to sync questionnaire data');
        }

        const result = await response.json();

        // 5. ניקוי הלוקאל סטורג' רק לאחר הצלחה וודאית
        localStorage.removeItem('tempQuestionnaire');

        console.log('[QuestionnaireSyncer] Sync successful:', result);
        toast.success('התשובות שלך לשאלון נשמרו ושוחזרו בהצלחה!');
      } catch (error) {
        console.error('[QuestionnaireSyncer] Sync failed:', error);
        // הערה: אנחנו *לא* מוחקים את ה-localStorage במקרה של שגיאה, כדי לנסות שוב בפעם הבאה
      } finally {
        isSyncing.current = false;
      }
    };

    syncData();
  }, [status, session]);

  // הרכיב הזה לא מרנדר כלום, הוא רק לוגיקה
  return null;
}
