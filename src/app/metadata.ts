import type { Metadata } from 'next';

export const metadata: Metadata = {
  // הכותרת מציגה את המהות וה-DNA של המותג
  title: 'NeshamaTech | המקום בו נשמה פוגשת טכנולוגיה',

  // התיאור מתחיל עם ההבטחה (הסלוגן) ומסביר איך היא מתממשת
  description: 'זוגיות שמתחילה מהנשמה. ב-NeshamaTech, אנו משתמשים בטכנולוגיה מתקדמת וליווי אישי כדי לחשוף את התאימות האמיתית שמעבר לפרופיל. הצטרפו למסע דיסקרטי ומכבד למציאת קשר רציני ומשמעותי.',

  keywords: [
    'שידוכים',
    'נשמה וטכנולוגיה',
    'זוגיות שמתחילה מהנשמה',
    'NeshamaTech',
    'קשר רציני',
    'היכרויות עומק',
    'שדכנות מודרנית',
    'התאמה לפי אישיות',
    'Jewish Matchmaking',
  ],

  openGraph: {
    title: 'NeshamaTech | המקום בו נשמה פוגשת טכנולוגיה',
    description: 'זוגיות שמתחילה מהנשמה. פלטפורמה המשלבת טכנולוגיה וליווי אישי ליצירת חיבורים אמיתיים.',
    url: 'https://www.neshamatech.com', // <-- עדכון לדומיין החדש
    siteName: 'NeshamaTech',
    images: [
      {
        url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png',
        width: 1200,
        height: 630,
        alt: 'הלוגו של NeshamaTech - טכנולוגיה ונשמה',
      },
    ],
    locale: 'he_IL',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'NeshamaTech | נשמה פוגשת טכנולוגיה',
    description: 'זוגיות שמתחילה מהנשמה. חיבורים אמיתיים המבוססים על טכנולוגיה וליווי אישי.',
    images: ['https://res.cloudcloud.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png'],
  },
};