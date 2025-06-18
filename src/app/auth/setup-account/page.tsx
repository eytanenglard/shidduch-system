// src/app/auth/setup-account/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2, KeyRound, CheckCircle } from "lucide-react";

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  
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

      // --- START: התיקון המרכזי ---
      // נשתמש ב-window.location.assign כדי לכפות רענון מלא והפניה.
      // זה מבטיח שה-Middleware יקבל את הסשן המעודכן ביותר.
      // נוסיף השהיה קטנה כדי שהמשתמש יראה את הודעת ההצלחה.
      setTimeout(() => {
        window.location.assign('/profile'); 
      }, 1500); // 1.5 שניות
      // --- END: התיקון המרכזי ---

    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה בלתי צפויה.');
      setIsLoading(false); 
    }
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
                <p className="text-muted-foreground">הסיסמה נקבעה. הנך מועבר/ת אוטומטית לשלב הבא של השלמת הפרופיל.</p>
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