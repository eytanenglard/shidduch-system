// src/middleware.ts - VERSION WITH FULL MANUAL CONTROL

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt'; // The key to getting session on the server

// --- START: I18N Imports & Config ---
import { i18n, type Locale } from '../i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
// --- END: I18N Imports & Config ---

// --- START: Path Definitions ---
// נתיבים ציבוריים לחלוטין, לא דורשים שום אימות
const PUBLIC_PATHS = [
  '/', // דף הבית
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
  '/questionnaire',
];

// נתיבים שדורשים אימות, אבל מותרים גם אם הפרופיל לא הושלם
const AUTHENTICATED_INCOMPLETE_ALLOWED_PATHS = [
  '/auth/setup-account',
  '/auth/verify-phone',
  '/auth/update-phone',
  '/settings', // הגדרות כלליות כמו מחיקת חשבון
];

// --- END: Path Definitions ---

// --- I18N Locale Detection Function ---
function getLocale(request: NextRequest): Locale {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = i18n.locales;
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages([...locales]);
  return matchLocale(languages, locales, i18n.defaultLocale) as Locale;
}

// --- Main Middleware Logic ---
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const secret = process.env.NEXTAUTH_SECRET;

  // 1. התעלם מנכסים סטטיים ומנתיבי API פנימיים
  if (
    pathname.startsWith('/api/') || // נטפל ב-API בנפרד אם צריך
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. לוגיקת ניהול שפות (I18N)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req);
    return NextResponse.redirect(new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url));
  }

  // 3. חילוץ השפה הנוכחית והנתיב ללא שפה
  const currentLocale = (pathname.split('/')[1] as Locale) || i18n.defaultLocale;
  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';

  // 4. קבלת הטוקן (הסשן) של המשתמש בצד השרת
  const token = await getToken({ req, secret });

  const isUserLoggedIn = !!token;
  const isAuthPage = pathWithoutLocale.startsWith('/auth');

  // 5. לוגיקת הרשאות
  if (isAuthPage) {
    // אם המשתמש מחובר ומנסה לגשת לדפי אימות (כניסה/הרשמה), הפנה אותו פנימה
    if (isUserLoggedIn) {
      return NextResponse.redirect(new URL(`/${currentLocale}/matches`, req.url));
    }
    // אם לא מחובר, אפשר לו להישאר בדף האימות
    return NextResponse.next();
  }
  
  // אם הנתיב דורש אימות והמשתמש לא מחובר
  const isPublic = PUBLIC_PATHS.includes(pathWithoutLocale);
  if (!isPublic && !isUserLoggedIn) {
      const signInUrl = new URL(`/${currentLocale}/auth/signin`, req.url);
      // שמירת הנתיב המקורי כדי לחזור אליו אחרי התחברות
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
  }

  // אם המשתמש מחובר, בדוק אם הפרופיל שלו שלם
  if (isUserLoggedIn) {
      // כאן ניתן להוסיף את הלוגיקה שלך לבדיקת שלמות הפרופיל מהטוקן
      const isProfileComplete = token.isProfileComplete && token.isPhoneVerified; // לדוגמה

      const isAllowedForIncomplete = AUTHENTICATED_INCOMPLETE_ALLOWED_PATHS.includes(pathWithoutLocale);

      // אם הפרופיל לא שלם והוא מנסה לגשת לעמוד שלא מורשה לו
      if (!isProfileComplete && !isAllowedForIncomplete && !isPublic) {
          // הפנה אותו לדף השלמת הפרופיל
          const setupUrl = new URL(`/${currentLocale}/auth/setup-account`, req.url);
          setupUrl.searchParams.set('reason', 'incomplete_profile');
          return NextResponse.redirect(setupUrl);
      }
  }

  // אם כל הבדיקות עברו, אפשר למשתמש להמשיך
  return NextResponse.next();
}


// הגדרת ה-matcher נשארת זהה
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon.ico|sw.js|site.webmanifest).*)',
  ],
};

