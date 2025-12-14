import type { Metadata } from 'next';

// הגדרת כתובת האתר הבסיסית (חשוב כדי שוואטסאפ ימצא את התמונה)
// אם יש לך משתנה סביבה ל-URL, הוא ישתמש בו, אחרת ברירת המחדל היא הדומיין שלך
const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL('https://www.neshamatech.com');

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: 'הזמנה אישית ל-NeshamaTech 🕎',
  description: 'חג חנוכה שמח! חברים המליצו עליך לקהילת השידוכים האיכותית שלנו.',
  openGraph: {
    title: 'הזמנה אישית להצטרף ל-NeshamaTech 🕎',
    description:
      'חברים טובים דואגים לחברים. הצטרפו למערכת השידוכים שמשלבת טכנולוגיה ונשמה.',
    url: '/',
    siteName: 'NeshamaTech',
    images: [
      {
        url: '/hanukkah-invite-og.png', // הקובץ שיצרת
        width: 1200,
        height: 630,
        alt: 'NeshamaTech Hanukkah Invitation',
      },
    ],
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'הזמנה אישית ל-NeshamaTech 🕎',
    description: 'חג חנוכה שמח! הצטרפו לקהילה.',
    images: ['/hanukkah-invite-og.png'],
  },
};

export default function ReferralRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
