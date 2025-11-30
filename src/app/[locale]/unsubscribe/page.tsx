// src/app/[locale]/unsubscribe/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import UnsubscribeClient from './UnsubscribeClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
    return <StandardizedLoadingSpinner />;
}

type UnsubscribePageProps = {
    params: Promise<{ locale: Locale }>;
};

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    
    return (
        // הסרתי bg-gray-50
        <div className="min-h-screen flex items-center justify-center p-4">
            <Suspense fallback={<Loading />}>
                <UnsubscribeClient dict={dictionary.auth.unsubscribePage} />
            </Suspense>
        </div>
    );
}