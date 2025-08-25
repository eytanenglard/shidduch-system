// src/app/[locale]/auth/update-phone/UpdatePhoneClient.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import type { UpdatePhoneDict } from '@/types/dictionaries/auth';

interface UpdatePhoneClientProps {
    dict: UpdatePhoneDict;
}

const UpdatePhoneClient = ({ dict }: UpdatePhoneClientProps) => {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const [newPhone, setNewPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!/^0\d{9}$/.test(newPhone)) {
            setError(dict.errors.invalidFormat);
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
                throw new Error(result.error || dict.errors.updateFailed);
            }
            router.push('/auth/verify-phone');
        } catch (err: unknown) {
             if (err instanceof Error) {
                 setError(err.message);
             } else {
                 setError(dict.errors.unexpected);
             }
        } finally {
            setIsLoading(false);
        }
    }, [newPhone, router, dict]);

    if (sessionStatus === 'loading') {
        return (
             <div className="min-h-screen flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                 <span className="ml-2">{dict.loaderText}</span>
             </div>
         );
    }
    if (sessionStatus === 'unauthenticated') {
         router.push('/auth/signin?callbackUrl=/auth/update-phone');
         return null;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">{dict.title}</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: dict.description.replace(/\n/g, '<br />') }} />
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{dict.errors.title}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 text-right">{dict.newPhoneLabel}</label>
                         <div className="relative">
                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            <Input
                                type="tel"
                                id="phone"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder={dict.newPhonePlaceholder}
                                required
                                disabled={isLoading}
                                dir="ltr"
                                autoComplete="tel"
                            />
                         </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : dict.submitButton}
                    </Button>
                </form>

                 <div className="text-center mt-4">
                     <Link href="/auth/verify-phone" className="text-sm text-cyan-600 hover:underline">
                         {dict.backToVerificationLink}
                     </Link>
                 </div>
            </div>
        </div>
    );
};

export default UpdatePhoneClient;