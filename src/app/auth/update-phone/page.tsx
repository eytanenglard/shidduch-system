// app/auth/update-phone/page.tsx
'use client';

import { useState, useCallback } from 'react'; // Added useCallback
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';

const UpdatePhonePage = () => {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const [newPhone, setNewPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        setError(null); // Clear previous errors

        // Basic phone number format validation
        if (!/^0\d{9}$/.test(newPhone)) {
            setError("פורמט מספר הטלפון אינו תקין (לדוגמה: 0501234567).");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/update-and-resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPhone }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Use error message from API if available
                throw new Error(result.error || 'עדכון מספר הטלפון נכשל.');
            }

            // Success! Redirect back to the verification page to enter the new code
            console.log("Phone updated, redirecting back to verify page.");
            router.push('/auth/verify-phone');

        } catch (err: unknown) { // Catch error as unknown
             // Type check the error before accessing properties
             if (err instanceof Error) {
                 setError(err.message);
             } else {
                 setError('אירעה שגיאה בלתי צפויה בעת עדכון מספר הטלפון.');
             }
        } finally {
            setIsLoading(false); // Stop loading indicator
        }
    }, [newPhone, router]); // Dependencies for useCallback

    // --- Session Handling & Loading State ---
    if (sessionStatus === 'loading') {
        return (
             <div className="min-h-screen flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                 <span className="ml-2">טוען נתונים...</span>
             </div>
         );
    }
     if (sessionStatus === 'unauthenticated') {
         // If user somehow gets here unauthenticated, redirect to signin
         router.push('/auth/signin?callbackUrl=/auth/update-phone');
         return null; // Return null while redirecting
    }
    // --- End Session Handling ---


    // --- Render Component ---
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6"> {/* Adjusted padding */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">עדכון מספר טלפון</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base"> {/* Adjusted text size */}
                        הזן/י את מספר הטלפון הנכון שלך.
                        <br />קוד אימות חדש יישלח אליו באמצעות WhatsApp.
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>שגיאה</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Update Phone Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 text-right">
                            מספר טלפון חדש
                        </label>
                         <div className="relative">
                            {/* Icon on the right for RTL */}
                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            <Input
                                type="tel" // Use tel type for better mobile experience
                                id="phone"
                                name="phone"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="0501234567"
                                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 shadow-sm text-right" // Added text-right
                                required
                                disabled={isLoading}
                                dir="ltr" // Keep input direction LTR for phone numbers
                                autoComplete="tel" // Add autocomplete hint
                            />
                         </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3"> {/* Added py-3 */}
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'עדכן ושלח קוד חדש'}
                    </Button>
                </form>

                 {/* Link back to Verification Page */}
                 <div className="text-center mt-4">
                     <Link href="/auth/verify-phone" className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline">
                         חזרה לאימות קוד
                     </Link>
                 </div>
            </div>
        </div>
    );
};

export default UpdatePhonePage;