// src/app/[locale]/auth/error/AuthErrorClient.tsx
'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { AuthErrorDict } from '@/types/dictionaries/auth';

interface AuthErrorClientProps {
    dict: AuthErrorDict;
}

export default function AuthErrorClient({ dict }: AuthErrorClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return dict.errors.CredentialsSignin;
      case "OAuthAccountNotLinked":
        return dict.errors.OAuthAccountNotLinked;
      default:
        return dict.errors.Default;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <CardTitle className="text-2xl font-bold text-red-600 mt-4">
          {dict.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-gray-600">{getErrorMessage(error)}</p>
        <Button onClick={() => router.push("/auth/signin")} className="w-full">
          {dict.backButton}
        </Button>
      </CardContent>
    </Card>
  );
}