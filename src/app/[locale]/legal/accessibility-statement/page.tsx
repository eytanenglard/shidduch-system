// src/app/[locale]/legal/accessibility-statement/page.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Accessibility,
  CheckCircle,
  Type,
  Contrast,
  Eye,
  Hand,
  Speech,
  MousePointer,
  Sparkles,
} from 'lucide-react';

// רכיב עזר ליצירת פריט ברשימת התכונות
const FeatureItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <li className="flex items-start gap-4">
    <div className="flex-shrink-0 mt-1 p-2 bg-cyan-100 rounded-full">
      <Icon className="w-5 h-5 text-cyan-700" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </li>
);

// רכיב העמוד הראשי
const AccessibilityStatementPage = () => {
  const brandName = 'NeshamaTech';
  const companyNameLegal = `ג'ואיש מאצ'פוינט בע"מ`;
  const lastUpdatedDate = '28 באוגוסט 2025';
  const supportEmail = 'accessibility@neshamatech.com'; // מומלץ ליצור כתובת ייעודית
  const pageTitle = `הצהרת נגישות | ${brandName}`;
  const pageDescription = `הצהרת הנגישות של אתר ${brandName}. אנו מחויבים לספק חוויה שוויונית ונגישה לכלל המשתמשים.`;
  const privacyPolicyUrl = '/legal/privacy-policy';
  const termsOfServiceUrl = '/legal/terms-of-service';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <div className="bg-gradient-to-br from-cyan-50 via-white to-pink-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl bg-white shadow-xl rounded-2xl p-8 sm:p-12 border border-gray-200/50">
          <header className="mb-10 text-center border-b pb-6 border-gray-200">
            <div className="inline-block p-4 bg-gradient-to-r from-cyan-100 to-pink-100 rounded-2xl mb-4">
              <Accessibility className="w-10 h-10 text-cyan-700" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              הצהרת נגישות
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              אתר השידוכים {brandName}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              עדכון אחרון: {lastUpdatedDate}
            </p>
          </header>

          <article
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed text-right"
            dir="rtl"
          >
            <h2 id="commitment">מחויבותנו לנגישות</h2>
            <p>
              חברת {companyNameLegal} (להלן: "החברה"), המפעילה את אתר{' '}
              <strong>{brandName}</strong>, רואה חשיבות עליונה בהנגשת שירותיה
              לאנשים עם מוגבלות, על מנת לאפשר חווית גלישה נוחה, יעילה ושוויונית
              לכלל המשתמשים. אנו משקיעים מאמצים ומשאבים רבים על מנת להבטיח כי
              האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
              נגישות לשירות), התשע"ג-2013.
            </p>
            <p>
              התאמות הנגישות בוצעו בהתאם להמלצות התקן הישראלי (ת"י 5568) לנגישות
              תכנים באינטרנט ברמת AA, המבוסס על הנחיות WCAG 2.1 הבינלאומיות.
            </p>

            <h2 id="level">רמת הנגישות ותאימות</h2>
            <ul>
              <li>
                <strong>רמת נגישות:</strong> האתר תומך בדרישות התקן ברמה AA.
              </li>
              <li>
                <strong>דפדפנים נתמכים:</strong> האתר נבדק ותומך בדפדפנים
                המודרניים והנפוצים ביותר, לרבות Google Chrome, Mozilla Firefox,
                Safari, ו-Microsoft Edge בגרסאותיהם העדכניות ביותר.
              </li>
            </ul>

            <h2 id="features">אמצעי הנגישות הקיימים באתר</h2>
            <p>
              באתר הוטמעו מגוון רחב של אמצעים טכנולוגיים על מנת להבטיח חווית
              שימוש מיטבית לכלל הגולשים.
            </p>

            <h3 className="flex items-center gap-3">
              <Sparkles className="text-blue-600" />
              סרגל נגישות ייעודי
            </h3>
            <p>
              באתר מוטמע כלי נגישות ייעודי המאפשר למשתמשים להתאים את תצוגת האתר
              לצרכיהם האישיים. ניתן לפתוח את תפריט הנגישות באמצעות לחיצה על
              כפתור הנגישות הצף בפינת המסך. הכלי מציע את האפשרויות הבאות:
            </p>
            <ul className="space-y-4 not-prose list-none p-0">
              <FeatureItem
                icon={Type}
                title="התאמת גודל הגופן"
                description="מאפשר הגדלה והקטנה של הטקסטים באתר לרמת הקריאות הנוחה למשתמש."
              />
              <FeatureItem
                icon={Contrast}
                title="מצבי תצוגה וניגודיות"
                description="כולל מצב ניגודיות גבוהה (בהיר) ומצב תצוגה כהה (ניגודיות הפוכה), לשיפור הקריאות עבור משתמשים עם לקויות ראייה."
              />
              <FeatureItem
                icon={Eye}
                title="גופן קריא"
                description="החלפת גופן האתר לגופן בסיסי וקריא, נטול תגים (Sans-Serif), לשיפור חווית הקריאה."
              />
              <FeatureItem
                icon={MousePointer}
                title="סמן גדול"
                description="הגדלת סמן העכבר לשני גדלים שונים לניווט קל יותר."
              />
              <FeatureItem
                icon={Hand}
                title="הפחתת תנועה"
                description="ביטול או הפחתה של אנימציות ותנועות באתר, עבור משתמשים הרגישים לתנועה."
              />
              <FeatureItem
                icon={Speech}
                title="הקראת טקסט"
                description="אפשרות להפעלת קורא טקסטים המקריא את התוכן הנבחר בלחיצת עכבר."
              />
            </ul>

            <h3 className="flex items-center gap-3 mt-8">
              <CheckCircle className="text-emerald-600" />
              התאמות נוספות באתר
            </h3>
            <ul>
              <li>
                <strong>ניווט באמצעות מקלדת:</strong> האתר מותאם באופן מלא
                לניווט באמצעות מקלד בלבד (שימוש במקשי Tab, Shift+Tab, Enter
                והחצים).
              </li>
              <li>
                <strong>התאמה לקוראי מסך:</strong> האתר נבנה תוך שימוש במבנה
                סמנטי נכון (כותרות, פסקאות, רשימות) ושימוש בתכונות ARIA
                (Accessible Rich Internet Applications) על מנת להבטיח תאימות
                מלאה עם תוכנות קורא מסך כגון NVDA ו-JAWS.
              </li>
              <li>
                <strong>טקסט חלופי לתמונות:</strong> לכל התמונות המשמעותיות באתר
                נוסף טקסט אלטרנטיבי (Alt Text) המפרט את תוכנן.
              </li>
              <li>
                <strong>טפסים נגישים:</strong> כל הטפסים באתר, כולל טפסי ההרשמה
                והשאלונים, כוללים תוויות (Labels) ברורות והנחיות למילוי.
              </li>
              <li>
                <strong>הימנעות מהבהובים:</strong> האתר אינו מכיל תכנים מהבהבים
                או נעים במהירות העלולים לסכן משתמשים.
              </li>
            </ul>

            <h2 id="limitations">אזורים שאינם נגישים ופניות</h2>
            <p>
              אנו עושים כל שביכולתנו להבטיח שכל חלקי האתר יהיו נגישים באופן מלא.
              עם זאת, ייתכן ויתגלו חלקים או יכולות מסוימות שטרם הונגשו במלואם.
              אנו ממשיכים במאמצים לשפר את נגישות האתר כחלק ממחויבותנו לאפשר
              שימוש בו עבור כלל האוכלוסייה.
            </p>
            <p>
              אם נתקלתם בבעיית נגישות או יש לכם הצעה לשיפור, נשמח אם תפנו אלינו.
              אנו רואים בפניותיכם הזדמנות לשיפור.
            </p>

            <h2 id="contact">פרטי רכז הנגישות</h2>
            <p>
              לכל פנייה בנושא נגישות, ניתן ליצור קשר עם רכז הנגישות של החברה:
            </p>
            <ul>
              <li>
                <strong>שם:</strong> [יש להזין שם מלא של איש הקשר]
              </li>
              <li>
                <strong>דוא"ל:</strong>{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-cyan-600 hover:text-cyan-700"
                >
                  {supportEmail}
                </a>
              </li>
              <li>
                <strong>טלפון:</strong> [יש להזין מספר טלפון]
              </li>
            </ul>
            <p>
              בפנייתכם, אנא צרפו כמה שיותר פרטים: תיאור הבעיה, קישור לעמוד בו
              נתקלתם בבעיה, ופרטי מערכת ההפעלה והדפדפן שלכם.
            </p>
            <p>
              הצהרה זו עודכנה לאחרונה בתאריך: <strong>{lastUpdatedDate}</strong>
              .
            </p>
          </article>
        </div>
      </div>
    </>
  );
};

export default AccessibilityStatementPage;
