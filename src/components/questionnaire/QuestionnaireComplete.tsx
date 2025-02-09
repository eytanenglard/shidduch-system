"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function QuestionnairePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">טוען...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-xl mx-auto bg-green-50 border-green-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">תודה על מילוי השאלון!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="text-center text-gray-600 space-y-2">
            <p>התשובות שלך נשמרו בהצלחה במערכת</p>
            <p>הצוות שלנו יעבור על התשובות ויחזור אליך בהקדם</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              בזמן שהצוות עובד על ההתאמות עבורך, תוכל/י להשלים את הפרופיל האישי
              שלך
            </AlertDescription>
          </Alert>

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => router.push("/profile")}
              className="flex items-center"
            >
              המשך לפרופיל
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
