"use client";
import { useSession } from "next-auth/react";
import MatchSuggestionsContainer from "@/components/suggestions/MatchSuggestionsContainer";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return <div>לא מורשה לצפות בדף זה</div>;
  }

  return <MatchSuggestionsContainer userId={session.user.id} />;
}
