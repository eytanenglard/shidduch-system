
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
// ✅ 1. ייבא את רכיב הלקוח החדש שיצרת
import MatchmakerDashboardPageClient from './MatchmakerDashboardPageClient'; 

// זהו רכיב שרת (Server Component).
export default async function SuggestionsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // 2. טוענים את המילון המלא כאן, בצד השרת.
  const dictionary = await getDictionary(locale);

  // 3. קוראים לרכיב הלקוח ומעבירים לו את החלק הרלוונטי של המילון כ-prop.
  return <MatchmakerDashboardPageClient dict={dictionary.suggestions} />;
}