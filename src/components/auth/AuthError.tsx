// src/app/components/auth/AuthError.tsx

'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin": return "פרטי ההתחברות שהזנת אינם נכונים. אנא נסה שנית.";
      case "OAuthAccountNotLinked": return "כתובת מייל זו כבר משויכת לספק אחר (למשל, גוגל). אנא התחבר באמצעותו.";
      default: return "אירעה שגיאה לא צפויה בתהליך האימות. אנא נסה שנית.";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <CardTitle className="text-2xl font-bold text-red-600 mt-4">
          אירעה שגיאה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-gray-600">{getErrorMessage(error)}</p>
        <Button onClick={() => router.push("/auth/signin")} className="w-full">
          חזרה לדף ההתחברות
        </Button>
      </CardContent>
    </Card>
  );
}