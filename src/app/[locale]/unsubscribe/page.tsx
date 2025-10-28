// src/app/[locale]/unsubscribe/page.tsx

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import UnsubscribeClient from './UnsubscribeClient'; // We'll create this next

function Loading() {
    return <Loader2 className="h-8 w-8 animate-spin" />;
}

type UnsubscribePageProps = {
    params: { locale: Locale };
};

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
    const { locale } = params;
    const dictionary = await getDictionary(locale);
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<Loading />}>
                <UnsubscribeClient dict={dictionary.auth.unsubscribePage} />
            </Suspense>
        </div>
    );
}