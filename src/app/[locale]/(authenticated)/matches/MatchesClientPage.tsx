// src/app/[locale]/matches/MatchesClientPage.tsx

'use client';

import { useSession } from 'next-auth/react';
import MatchSuggestionsContainer from '@/components/suggestions/MatchSuggestionsContainer';
import { Skeleton } from '@/components/ui/skeleton';
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

  // בזמן שהחיבור מתבצע, הצג שלד טעינה (skeleton)
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
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
