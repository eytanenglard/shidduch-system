'use client';
import { useSession } from 'next-auth/react';
import MatchSuggestionsContainer from '@/components/suggestions/MatchSuggestionsContainer';
import { Skeleton } from '@/components/ui/skeleton';
import type { SuggestionsDictionary } from '@/types/dictionary'; // ✨ 1. ייבוא הטיפוס של המילון

// ✨ 2. הגדרת ה-props שהרכיב יקבל
interface MatchesClientPageProps {
  dict: SuggestionsDictionary;
}

// ✨ 3. הרכיב מקבל את המילון (dict) כ-prop
export default function MatchesClientPage({ dict }: MatchesClientPageProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    // This can be a more sophisticated skeleton component later
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!session?.user?.id) {
    // You might want a more user-friendly message or a redirect
    return <div>לא מורשה לצפות בדף זה</div>;
  }

  // ✨ 4. מעבירים את כל מילון ההצעות (dict) הלאה לקונטיינר הראשי
  return <MatchSuggestionsContainer userId={session.user.id} dict={dict} />;
}
