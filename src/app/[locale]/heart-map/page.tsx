import type { Locale } from '../../../../i18n-config';
import HeartMapPageClient from '@/components/heart-map/HeartMapPageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HeartMapPage(props: Props) {
  const params = await props.params;
  const locale = params.locale as Locale;

  return <HeartMapPageClient locale={locale} />;
}
