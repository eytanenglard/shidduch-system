// src/app/[locale]/matches/MatchesClientPage.tsx

'use client';

import { useSession } from 'next-auth/react';
import MatchSuggestionsContainer from '@/components/suggestions/MatchSuggestionsContainer';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';

/**
 * הממשק (interface) מגדיר את ה-props שהרכיב הזה מקבל.
 * הוא מצפה לקבל אובייקט 'dict' המכיל את שני מילוני התרגום
 * הדרושים לו ולרכיבי הילד שלו: מילון ההצעות ומילון כרטיס הפרופיל.
 */
interface MatchesClientPageProps {
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
}

/**
 * רכיב צד-לקוח (Client Component) האחראי על הצגת עמוד ההצעות.
 * הוא מנהל את אימות המשתמש ומעביר את הנתונים והתרגומים לרכיב התצוגה הראשי.
 */
export default function MatchesClientPage({ suggestionsDict, profileCardDict }: MatchesClientPageProps) {
  // קבלת נתוני המשתמש והסטטוס של החיבור
  const { data: session, status } = useSession();

  // בזמן שהחיבור מתבצע, הצג את רכיב הטעינה האחיד
  if (status === 'loading') {
    return (
      <StandardizedLoadingSpinner 
        text="טוען התאמות..." 
        subtext="מחפשים את השידוכים המתאימים ביותר עבורך"
        className="min-h-[60vh]"
      />
    );
  }

  // אם המשתמש אינו מחובר, הצג הודעה מתאימה
  if (!session?.user?.id) {
    // ניתן להוסיף כאן רכיב מעוצב יותר או הפנייה לדף ההתחברות
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        אינך מורשה לצפות בדף זה. יש להתחבר למערכת.
      </div>
    );
  }

  // אם המשתמש מחובר, רנדר את קונטיינר ההצעות והעבר לו את הנתונים הנדרשים
  return (
    <MatchSuggestionsContainer
      userId={session.user.id}
      suggestionsDict={suggestionsDict}
      profileCardDict={profileCardDict}
    />
  );
}