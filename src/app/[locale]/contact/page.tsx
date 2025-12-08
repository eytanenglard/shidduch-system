// src/app/[locale]/contact/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import ContactClient from './ContactClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type ContactPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען..."
          subtext="מכינים את הטופס ליצירת קשר"
        />
      }
    >
      <ContactClient dict={dictionary.contactPage} />
    </Suspense>
  );
}
