"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Signin":
        return "נסה להתחבר שוב";
      case "OAuthSignin":
        return "נסה להתחבר שוב";
      case "OAuthCallback":
        return "שגיאה בתהליך ההתחברות";
      case "OAuthCreateAccount":
        return "שגיאה ביצירת החשבון";
      case "EmailCreateAccount":
        return "שגיאה ביצירת החשבון";
      case "Callback":
        return "שגיאה בתהליך ההתחברות";
      case "OAuthAccountNotLinked":
        return "החשבון כבר מקושר למשתמש אחר";
      case "EmailSignin":
        return "בדוק את תיבת הדואר שלך";
      case "CredentialsSignin":
        return "פרטי ההתחברות שגויים";
      default:
        return "שגיאה בתהליך ההתחברות";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            שגיאה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {error ? getErrorMessage(error) : "שגיאה לא ידועה"}
          </p>
          <Button
            onClick={() => router.push("/auth/signin")}
            className="w-full"
          >
            חזרה לדף ההתחברות
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
