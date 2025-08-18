// src/components/analytics/GoogleAnalytics.tsx (גרסה מעודכנת עם ניהול הסכמה)
'use client'

import { useState, useEffect } from 'react';
import Script from 'next/script';

const GoogleAnalytics = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // נבדוק את ההסכמה השמורה ב-localStorage רק בצד הלקוח
    const storedConsent = localStorage.getItem('cookie_consent');
    if (storedConsent === 'true') {
      setHasConsent(true);
    }
  }, []);

  // אם אין מזהה אנליטיקס או שהמשתמש לא הסכים, אל תטען כלום
  if (!gaId || !hasConsent) {
    return null;
  }

  // רק אם יש הסכמה, נטען את הסקריפטים
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

export default GoogleAnalytics;