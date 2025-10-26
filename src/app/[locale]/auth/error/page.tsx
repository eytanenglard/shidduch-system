// src/app/[locale]/auth/error/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import AuthErrorClient from './AuthErrorClient';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
}

// ▼▼▼ כאן השינוי ▼▼▼

// 1. הגדרת טיפוס (type) נכון עבור ה-props
type ErrorPageProps = {
  params: Promise<{ locale: Locale }>;
};

// 2. עדכון חתימת הפונקציה והוספת await
export default async function ErrorPage({ params }: ErrorPageProps) {
  const { locale } = await params; // <-- הוספת await
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Suspense fallback={<Loading />}>
        <AuthErrorClient dict={dictionary.auth.errorPage} />
      </Suspense>
    </div>
  );
}