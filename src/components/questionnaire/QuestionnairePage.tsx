"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MatchmakingQuestionnaire from "@/components/questionnaire/MatchmakingQuestionnaire";

export default function QuestionnairePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const handleComplete = async () => {
    try {
      await router.push("/questionnaire/complete");
    } catch (err) {
      console.error("Error completing questionnaire:", err);
      setError("אירעה שגיאה בסיום השאלון. אנא נסה שוב.");
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">טוען...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">שאלון התאמה</CardTitle>
          <p className="text-gray-600 mt-2">
            המידע שתספק/י יעזור לנו למצוא את ההתאמה המיטבית עבורך
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showQuestionnaire ? (
            <div className="text-center space-y-6">
              <div className="space-y-2 text-gray-600">
                <p>ברוכים הבאים לשאלון ההתאמה שלנו!</p>
                <p>
                  השאלון מסייע לנו להכיר אותך טוב יותר ולמצוא את ההתאמות הטובות
                  ביותר עבורך.
                </p>
                <p>זמן מילוי משוער: 20-30 דקות</p>
                <p>ניתן לשמור את ההתקדמות ולחזור בכל עת</p>
              </div>

              <div className="space-y-4">
                {!session ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 mb-4">
                      מומלץ להתחבר למערכת לפני מילוי השאלון כדי לשמור את התשובות
                      שלך
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Link href="/auth/register">
                        <Button>הרשמה</Button>
                      </Link>
                      <Link href="/auth/signin">
                        <Button variant="outline">התחברות</Button>
                      </Link>
                    </div>
                  </div>
                ) : null}

                <Button
                  size="lg"
                  onClick={() => setShowQuestionnaire(true)}
                  className="mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "טוען..." : "התחל בשאלון"}
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <MatchmakingQuestionnaire
              userId={session?.user?.id}
              onComplete={handleComplete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
