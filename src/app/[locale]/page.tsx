import HomePage from '@/components/HomePage/HomePage';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../i18n-config';

export default async function Page({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);
  return <HomePage dict={dictionary} />;
}
