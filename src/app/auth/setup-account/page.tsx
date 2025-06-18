// src/app/auth/setup-account/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// --- 1. ייבוא של useSession ---
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2, KeyRound, CheckCircle } from "lucide-react";

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // --- 2. קבלת הפונקציה update מ-useSession ---
  const { update } = useSession();
  
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("קישור הגדרת החשבון אינו תקין או חסר. אנא השתמש בקישור שנשלח אליך במייל.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים.");
      return;
    }
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'שגיאה בהגדרת החשבון.');
      }

      setSuccess(true);
      toast.success("החשבון הוגדר בהצלחה! הנך מועבר/ת להשלמת הפרופיל.");

      // --- 3. עדכון הסשן והפניה חכמה ---
      // עדכון הסשן כדי שה-Middleware יקבל את הסטטוס החדש של המשתמש
      await update();
      
      // הפניה לדף גנרי. ה-Middleware ידאג להפנות לדף הנכון (השלמת פרופיל / אימות טלפון)
      router.push('/profile');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה בלתי צפויה.');
      setIsLoading(false); // יש לעצור את הטעינה גם במקרה של שגיאה
    } 
    // finally block is not needed here since loading is handled in catch and redirect happens on success
  };
  
  if (success) {
    return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="mt-4">החשבון הוגדר בהצלחה!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">כעת, לאחר שקבעת סיסמה, נעביר אותך להשלמת פרטי הפרופיל שלך.</p>
                <Loader2 className="mt-4 h-6 w-6 animate-spin mx-auto" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>הגדרת חשבון וקביעת סיסמה</CardTitle>
        <CardDescription>
          שלב אחרון לפני שתוכל/י להתחיל. אנא בחר/י סיסמה לחשבונך.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded-md">{error}</div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="password">סיסמה חדשה</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
                <p className="text-xs text-muted-foreground mt-1">לפחות 8 תווים, כולל אותיות ומספרים.</p>
            </div>
            <div>
                <Label htmlFor="confirmPassword">אישור סיסמה</Label>
                <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
             <CardFooter className="p-0 pt-4">
                 <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    {isLoading ? 'מגדיר סיסמה...' : 'הגדר סיסמה והמשך'}
                </Button>
            </CardFooter>
            </form>
        )}
      </CardContent>
    </Card>
  );
}

// Suspense Boundary for useSearchParams
export default function SetupAccountPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <SetupAccountForm />
            </Suspense>
        </div>
    );
}