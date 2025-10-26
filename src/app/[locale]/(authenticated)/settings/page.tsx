// src/app/[locale]/(authenticated)/settings/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SettingsClientPage from './SettingsClientPage';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// הגדרת ה-props הנכונה
type SettingsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/settings`);
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <SettingsClientPage
        dict={dictionary.profilePage.accountSettings}
        locale={locale}
      />
    </div>
  );
}