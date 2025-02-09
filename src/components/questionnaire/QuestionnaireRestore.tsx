"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

 

  export default function QuestionnaireRestore() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const restoreQuestionnaire = async () => {
        try {
          setIsProcessing(true);
          const savedData = localStorage.getItem("tempQuestionnaire");

          if (!savedData || !session?.user?.id) {
            router.push("/dashboard");
            return;
          }

          const questionnaireData = JSON.parse(savedData);
          // עדכון ה-userId לפי המשתמש שהתחבר
          questionnaireData.userId = session.user.id;

          const response = await fetch("/api/questionnaire", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(questionnaireData),
          });

          if (!response.ok) {
            throw new Error("Failed to save questionnaire");
          }

          // מחיקת הנתונים הזמניים מ-localStorage
          localStorage.removeItem("tempQuestionnaire");

          // ניווט לדף המתאים בהתאם למצב השאלון
          if (questionnaireData.completed) {
            router.push("/dashboard");
          } else {
            router.push("/questionnaire");
          }
        } catch (err) {
          console.error("Error restoring questionnaire:", err);
          setError("אירעה שגיאה בשחזור הנתונים. אנא נסה שוב.");
        } finally {
          setIsProcessing(false);
        }
      };

      if (session?.user) {
        restoreQuestionnaire();
      }
    }, [session, router]);

    if (error) {
      return (
        <div className="container mx-auto p-4 max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push("/questionnaire")}>
              חזור לשאלון
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">משחזר את נתוני השאלון...</p>
            <p className="text-sm text-gray-500 mt-2">אנא המתן</p>
          </CardContent>
        </Card>
      </div>
    );
  }
