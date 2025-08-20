import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';
import MatchesClientPage from './MatchesClientPage';

// זהו רכיב שרת (Server Component). הוא רץ רק בשרת.
export default async function MatchesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // 1. טוענים את המילון המלא כאן, בצד השרת
  const dictionary = await getDictionary(locale);

  // 2. מעבירים את החלק של ההצעות (suggestions) כ-prop לרכיב הלקוח
  return <MatchesClientPage dict={dictionary.suggestions} />;
}
