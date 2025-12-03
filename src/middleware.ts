// src/middleware.ts - VERSION WITH ADMIN SUPPORT AND STATIC FILE FIX

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { i18n, type Locale } from '../i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// --- Path Definitions ---
const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
  '/questionnaire',
  '/contact',
  '/feedback',
];

// 🎯 נתיבים ייעודיים לאדמין/שדכן
const ADMIN_PATHS = [
  '/admin/engagement',
  '/matchmaker/suggestions',
  '/matchmaker/clients',
];

// נתיבים שחיוניים להשלמת פרופיל, גם אם המשתמש כבר מחובר
const SETUP_PATHS = [
  '/auth/register',
  '/auth/setup-account',
  '/auth/verify-phone',
  '/auth/update-phone',
  '/settings', 
];

const PUBLIC_API_PATHS = ['/api/feedback'];

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
  // ====================== LOGGING START: Entry Point ======================
  console.log(`\n\n=========================================================`);
  console.log(`--- [Middleware] New Request Received ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`➡️  Incoming Full URL: ${req.url}`);
  // ======================= LOGGING END =======================

  const { pathname } = req.nextUrl;

  // בדיקה האם מדובר בקובץ סטטי לפי הסיומת שלו
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname);

  // 1. התעלם מנכסים סטטיים ומנתיבי API פנימיים
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('/favicon.ico') ||
    isStaticFile || // <-- התיקון החשוב: מאפשר גישה ישירה לקבצים ב-public
    PUBLIC_API_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/api/')
  ) {
    console.log(`[Middleware] Path is a static asset or internal API route. Skipping auth logic.`);
    console.log(`=========================================================\n`);
    return NextResponse.next();
  }

  // 2. לוגיקת ניהול שפות (I18N)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // ====================== LOGGING START: Locale Check ======================
  console.log(`   Pathname being checked: ${pathname}`);
  console.log(`   Is Pathname Missing Locale?: ${pathnameIsMissingLocale}`);
  // ======================= LOGGING END =======================

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req);
    const newUrl = new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url);

    // ====================== LOGGING START: Redirecting for Locale ======================
    console.error(`❌ [Middleware] Pathname is missing locale. REDIRECTING NOW.`);
    console.error(`   Detected browser/header locale preference: ${locale}`);
    console.error(`   Redirecting from "${pathname}" to: ${newUrl.toString()}`);
    console.log(`=========================================================\n`);
    // ======================= LOGGING END =======================

    return NextResponse.redirect(newUrl);
  }

  // 3. חילוץ פרטי הנתיב והסשן
  const currentLocale = (pathname.split('/')[1] as Locale) || i18n.defaultLocale;
  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isUserLoggedIn = !!token;
  
  const isProfileConsideredComplete = !!token?.isProfileComplete && !!token?.isPhoneVerified;
  
  // 🎯 הוספה: בדיקת תפקיד המשתמש
  const userRole = token?.role as string | undefined;
  const isAdmin = userRole === 'ADMIN';
  const isMatchmaker = userRole === 'MATCHMAKER' || isAdmin;

  // ====================== LOGGING START: Context Analysis ======================
  console.log(`   Detected Locale from URL: ${currentLocale}`);
  console.log(`   Path without Locale: ${pathWithoutLocale}`);
  console.log(`   Is User Logged In?: ${isUserLoggedIn}`);
  if (token) {
    console.log(`   User ID from token: ${token.id}`);
    console.log(`   User Role: ${userRole}`); // 🎯 לוג חדש
    console.log(`   Is Admin?: ${isAdmin}`); // 🎯 לוג חדש
  }
  console.log(`   Is Profile Considered Complete?: ${isProfileConsideredComplete}`);
  // ======================= LOGGING END =======================

  // 4. לוגיקת הרשאות מאוחדת
  const isPublicPath = PUBLIC_PATHS.includes(pathWithoutLocale);
  const isSetupPath = SETUP_PATHS.includes(pathWithoutLocale);
  const isAdminPath = ADMIN_PATHS.some(path => pathWithoutLocale.startsWith(path));

  // ====================== LOGGING START: Path Classification ======================
  console.log(`   Is Public Path?: ${isPublicPath}`);
  console.log(`   Is Setup Path?: ${isSetupPath}`);
  console.log(`   Is Admin Path?: ${isAdminPath}`); // 🎯 לוג חדש
  // ======================= LOGGING END =======================

  // --- תרחיש 1: המשתמש מחובר ---
  if (isUserLoggedIn) {
    console.log(`[Middleware] Evaluating rules for LOGGED-IN user...`);
    
    // 🎯 חדש: בדיקה מיוחדת לנתיבי אדמין
    if (isAdminPath) {
      if (!isAdmin) {
        // משתמש רגיל מנסה לגשת לאזור אדמין
        const unauthorizedUrl = new URL(`/${currentLocale}/`, req.url);
        console.warn(`[Middleware] Non-admin user trying to access admin area. Redirecting to home.`);
        console.warn(`   User role: ${userRole}, Required: ADMIN`);
        console.warn(`   Redirecting to: ${unauthorizedUrl.toString()}`);
        console.log(`=========================================================\n`);
        return NextResponse.redirect(unauthorizedUrl);
      }
      // אדמין - תן לו גישה
      console.log(`[Middleware] Admin user access granted to admin area "${pathname}".`);
      console.log(`=========================================================\n`);
      return NextResponse.next();
    }
    
    // אם הפרופיל שלו שלם והוא מנסה לגשת לדף התחברות/הרשמה
    if (isProfileConsideredComplete && (pathWithoutLocale.startsWith('/auth/signin') || pathWithoutLocale.startsWith('/auth/register'))) {
      const redirectUrl = new URL(`/${currentLocale}/profile`, req.url);
      console.warn(`[Middleware] Logged-in user with complete profile is on auth page. Redirecting to profile.`);
      console.warn(`   Redirecting to: ${redirectUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(redirectUrl);
    }

    // אם הפרופיל שלו *לא* שלם והוא מנסה לגשת לדף שאינו ציבורי ואינו חלק מתהליך ההרשמה
    // 🎯 עדכון: אדמין/שדכן לא צריך פרופיל שלם
    if (!isProfileConsideredComplete && !isPublicPath && !isSetupPath && !isMatchmaker) {
      const setupUrl = new URL(`/${currentLocale}/auth/register`, req.url);
      setupUrl.searchParams.set('reason', 'complete_profile');
      console.warn(`[Middleware] Logged-in user with INCOMPLETE profile is on a protected page. Redirecting to complete profile.`);
      console.warn(`   Redirecting to: ${setupUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(setupUrl);
    }
    
    console.log(`[Middleware] Logged-in user access granted to "${pathname}".`);
  }
  // --- תרחיש 2: המשתמש *לא* מחובר ---
  else {
    console.log(`[Middleware] Evaluating rules for GUEST user...`);
    // אם הוא מנסה לגשת לדף שאינו ציבורי
    if (!isPublicPath) {
      const signInUrl = new URL(`/${currentLocale}/auth/signin`, req.url);
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      console.warn(`[Middleware] Guest user trying to access a protected page. Redirecting to sign-in.`);
      console.warn(`   Redirecting to: ${signInUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(signInUrl);
    }
    
    console.log(`[Middleware] Guest user access granted to public page "${pathname}".`);
  }

  // ברירת מחדל אחרונה - אם שום כלל לא עצר את הבקשה
  console.log(`✅ [Middleware] All checks passed. Allowing request to continue to its destination.`);
  console.log(`=========================================================\n`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon.ico|sw.js|site.webmanifest).*)',
  ],
};