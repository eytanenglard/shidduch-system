// src/app/[locale]/settings/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SettingsClientPage from './SettingsClientPage';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ▼▼▼ CHANGE WAS MADE HERE ▼▼▼
export default async function SettingsPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params; // Destructure locale inside the function
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/settings`);
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* ✨ שינוי: העברת ה-locale שהתקבל מה-URL כ-prop לקומפוננטת הלקוח */}
      <SettingsClientPage
        dict={dictionary.profilePage.accountSettings}
        locale={locale}
      />
    </div>
  );
}