// pages/questionnaire/map.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import WorldsMap from "@/components/questionnaire/layout/WorldsMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WorldId } from "@/components/questionnaire/types/types";

export default function QuestionnairesMapPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentWorld, setCurrentWorld] = useState<WorldId>("VALUES");
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's questionnaire progress
  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (status === "loading") return;

      try {
        setIsLoading(true);
        setError(null);

        if (status === "authenticated" && session?.user?.id) {
          // Fetch the user's progress
          const response = await fetch("/api/questionnaire");
          const data = await response.json();

          if (data.success && data.data) {
            // Update states with saved progress
            setCompletedWorlds(data.data.worldsCompleted || []);

            // If a current world is saved, use it
            if (data.data.currentWorld) {
              setCurrentWorld(data.data.currentWorld);
            }
            // Otherwise select the first incomplete world
            else if (data.data.worldsCompleted?.length > 0) {
              const allWorlds: WorldId[] = [
                "PERSONALITY",
                "VALUES",
                "RELATIONSHIP",
                "PARTNER",
                "RELIGION",
              ];
              const nextWorld = allWorlds.find(
                (world) => !data.data.worldsCompleted.includes(world)
              );
              if (nextWorld) {
                setCurrentWorld(nextWorld);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading questionnaire data:", error);
        setError("אירעה שגיאה בטעינת נתוני השאלון. אנא נסה שוב מאוחר יותר.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaire();
  }, [status, session]);

  // Handle world selection
  const handleWorldChange = (worldId: WorldId) => {
    // Navigate to the questionnaire with the selected world
    router.push(`/questionnaire?world=${worldId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">טוען...</p>
          <p className="text-sm text-gray-500 mt-2">מאחזר את נתוני השאלון</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/questionnaire")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לשאלון
            </Button>

            <h1 className="text-2xl font-bold">מפת העולמות</h1>
          </div>

          {session?.user && (
            <div className="text-sm text-gray-500">
              מחובר כ: {session.user.name || session.user.email}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-medium mb-4">בחר עולם לעבור אליו</h2>
          <p className="text-gray-600 mb-6">
            במפת העולמות תוכל/י לנווט בחופשיות בין העולמות השונים בשאלון. כל
            עולם מתמקד בהיבט שונה ומאפשר לך להשלים אותו בהדרגה.
          </p>

          <WorldsMap
            currentWorld={currentWorld}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
          />
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            השתמש במפת העולמות כדי לעבור בין חלקי השאלון ולשנות תשובות בכל עת.
          </p>
          <p>התקדמותך נשמרת אוטומטית.</p>
        </div>
      </div>
    </div>
  );
}
