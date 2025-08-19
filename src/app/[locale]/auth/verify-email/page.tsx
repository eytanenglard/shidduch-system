// src/app/auth/verify-email/page.tsx

import VerifyEmailPageClient from "@/components/auth/VerifyEmailClient"; // שם הקובץ החדש שיצרת
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function Loading() {
    return <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />;
}

export default function VerifyEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Suspense fallback={<Loading />}>
                <VerifyEmailPageClient />
            </Suspense>
        </div>
    );
}