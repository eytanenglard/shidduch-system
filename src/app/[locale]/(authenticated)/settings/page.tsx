// src/app/[locale]/settings/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SettingsClientPage from './SettingsClientPage';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SettingsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // ✨ 1. אימות סשן בצד השרת - אבטחה טובה יותר
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/settings`);
  }

  // ✨ 2. טעינת המילון המלא בצד השרת
  const dictionary = await getDictionary(locale);

  // ✨ 3. העברת החלק הרלוונטי מהמילון לקומפוננטת הלקוח
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <SettingsClientPage dict={dictionary.profilePage.accountSettings} />
    </div>
  );
}