// src/app/layout.tsx

'use client'; // הוספת הוראה זו הכרחית כדי להשתמש ב-usePathname

import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import { LanguageProvider } from "@/app/contexts/LanguageContext";
import { usePathname } from "next/navigation"; // 1. ייבוא של usePathname

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// שינינו את שם המטא-דאטה כדי למנוע התנגשות עם משתנה אחר
// export const metadata = siteMetadata; // שורה זו מוסרת כי מטא-דאטה דינמי נטען אחרת בקליינט-קומפוננט

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 2. הגדרת משתנים לבדיקת הנתיב הנוכחי
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  // הגדרת ברירת מחדל לשפה ולכיווניות
  const defaultLanguage = "he";
  const isRTL = defaultLanguage === "he";

  return (
    <html
      lang={defaultLanguage}
      dir={isRTL ? "rtl" : "ltr"}
      className={isRTL ? "dir-rtl" : "dir-ltr"}
      suppressHydrationWarning
    >
      <head>
          <title>NeshamaTech - זוגיות שמתחילה מהנשמה</title>
          <meta name="description" content="NeshamaTech - משלבים טכנולוגיה עם לב ליצירת קשרים משמעותיים. שיטת התאמה ייחודית, ליווי אישי ודיסקרטיות מלאה." />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <LanguageProvider>
            <div
              className={`min-h-screen flex flex-col ${
                isRTL ? "dir-rtl" : "dir-ltr"
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* 3. הצגה מותנית של ה-Navbar */}
              {/* הוא יופיע בכל עמוד, חוץ מדף הבית */}
              {!isHomePage && <Navbar />}

              <main className="flex-1 w-full">{children}</main>
            </div>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}