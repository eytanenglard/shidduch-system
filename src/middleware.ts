// src/middleware.ts - גרסה מתוקנת עם תמיכה ב-App Router

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
  '/friends',
];

const REFERRAL_PUBLIC_PATHS = [
  '/friends',
  '/referral/dashboard',
];

const ADMIN_PATHS = [
  '/admin/engagement',
  '/admin/referrals',
  '/matchmaker/suggestions',
  '/matchmaker/clients',
];

const SETUP_PATHS = [
  '/auth/register',
  '/auth/setup-account',
  '/auth/verify-phone',
  '/auth/update-phone',
  '/settings',
];

const POST_SETUP_PATHS = [
  '/profile',
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
  console.log(`\n\n=========================================================`);
  console.log(`--- [Middleware] New Request Received ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`➡️  Incoming Full URL: ${req.url}`);

  const { pathname, search } = req.nextUrl;

  // 🔴 תיקון: בדיקה לקבצים סטטיים קודם כל
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname);

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/logo.png') ||
    isStaticFile ||
    PUBLIC_API_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/api/')
  ) {
    console.log(`[Middleware] Static asset or API route. Skipping.`);
    console.log(`=========================================================\n`);
    return NextResponse.next();
  }

  // 🔴 תיקון: טיפול ב-referral short links
  if (pathname.startsWith('/r/')) {
    const locale = getLocale(req);
    const code = pathname.split('/r/')[1];
    const newUrl = new URL(`/${locale}/r/${code}${search}`, req.url);
    
    console.log(`[Middleware] Referral short link. Redirecting with locale.`);
    console.log(`   Code: ${code}`);
    console.log(`   Redirecting to: ${newUrl.toString()}`);
    console.log(`=========================================================\n`);
    
    return NextResponse.redirect(newUrl);
  }

  // 🔴 תיקון מרכזי: בדיקת locale עם לוגיקה משופרת
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  console.log(`   Pathname: ${pathname}`);
  console.log(`   Missing Locale?: ${pathnameIsMissingLocale}`);

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req);
    
    // 🔴 חשוב: טיפול נכון ב-root path
    let newPathname: string;
    
    if (pathname === '/') {
      // Root path - פשוט הוסף את ה-locale
      newPathname = `/${locale}`;
    } else {
      // כל נתיב אחר - הוסף את ה-locale לפני הנתיב
      newPathname = `/${locale}${pathname}`;
    }
    
    const newUrl = new URL(newPathname + search, req.url);

    console.log(`[Middleware] Adding locale to path.`);
    console.log(`   Detected locale: ${locale}`);
    console.log(`   Original path: ${pathname}`);
    console.log(`   New path: ${newPathname}`);
    console.log(`   Redirecting to: ${newUrl.toString()}`);
    console.log(`=========================================================\n`);

    return NextResponse.redirect(newUrl);
  }

  // 🔴 חילוץ locale ונתיב נקי
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = (segments[0] as Locale) || i18n.defaultLocale;
  
  // 🔴 תיקון: הסרת locale בצורה נכונה
  const pathWithoutLocale = '/' + segments.slice(1).join('/') || '/';

  console.log(`   Segments: ${JSON.stringify(segments)}`);
  console.log(`   Current Locale: ${currentLocale}`);
  console.log(`   Path without Locale: ${pathWithoutLocale}`);

  // 🔴 טוען את ה-token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isUserLoggedIn = !!token;
  const isProfileConsideredComplete = !!token?.isProfileComplete && !!token?.isPhoneVerified;
  const userRole = token?.role as string | undefined;
  const isAdmin = userRole === 'ADMIN';
  const isMatchmaker = userRole === 'MATCHMAKER' || isAdmin;

  console.log(`   Is User Logged In?: ${isUserLoggedIn}`);
  if (token) {
    console.log(`   User ID: ${token.id}`);
    console.log(`   User Role: ${userRole}`);
    console.log(`   Is Admin?: ${isAdmin}`);
  }
  console.log(`   Profile Complete?: ${isProfileConsideredComplete}`);

  // 🔴 בדיקות נתיב
  const isPublicPath = 
    PUBLIC_PATHS.includes(pathWithoutLocale) || 
    pathWithoutLocale.startsWith('/testimonial');
  const isSetupPath = SETUP_PATHS.includes(pathWithoutLocale);
  const isAdminPath = ADMIN_PATHS.some(path => pathWithoutLocale.startsWith(path));
  const isReferralPublicPath = REFERRAL_PUBLIC_PATHS.some(path => pathWithoutLocale.startsWith(path));
  const isPostSetupPath = POST_SETUP_PATHS.includes(pathWithoutLocale);

  console.log(`   Is Public Path?: ${isPublicPath}`);
  console.log(`   Is Setup Path?: ${isSetupPath}`);
  console.log(`   Is Admin Path?: ${isAdminPath}`);
  console.log(`   Is Referral Public Path?: ${isReferralPublicPath}`);
  console.log(`   Is Post Setup Path?: ${isPostSetupPath}`);

  // 🔴 נתיבי רפרל ציבוריים
  if (isReferralPublicPath) {
    console.log(`[Middleware] Referral public path. Allowing access.`);
    console.log(`=========================================================\n`);
    return NextResponse.next();
  }

  // --- לוגיקת הרשאות ---
  if (isUserLoggedIn) {
    console.log(`[Middleware] Evaluating LOGGED-IN user...`);

    // 🔴 בדיקת גישה לאדמין
    if (isAdminPath) {
      if (!isAdmin) {
        const redirectUrl = new URL(`/${currentLocale}/`, req.url);
        console.warn(`[Middleware] Non-admin trying to access admin area.`);
        console.warn(`   User role: ${userRole}`);
        console.warn(`   Redirecting to: ${redirectUrl.toString()}`);
        console.log(`=========================================================\n`);
        return NextResponse.redirect(redirectUrl);
      }
      console.log(`[Middleware] Admin access granted.`);
      console.log(`=========================================================\n`);
      return NextResponse.next();
    }

    // 🔴 משתמש מחובר עם פרופיל שלם על דף התחברות
    if (isProfileConsideredComplete && (pathWithoutLocale === '/auth/signin' || pathWithoutLocale === '/auth/register')) {
      const redirectUrl = new URL(`/${currentLocale}/profile`, req.url);
      console.warn(`[Middleware] Logged-in user with complete profile on auth page.`);
      console.warn(`   Redirecting to: ${redirectUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(redirectUrl);
    }

    // 🔴 משתמש מחובר עם פרופיל לא שלם
    if (
      !isProfileConsideredComplete && 
      !isPublicPath && 
      !isSetupPath && 
      !isMatchmaker && 
      !isPostSetupPath
    ) {
      const setupUrl = new URL(`/${currentLocale}/auth/register`, req.url);
      setupUrl.searchParams.set('reason', 'complete_profile');
      console.warn(`[Middleware] Incomplete profile. Redirecting to setup.`);
      console.warn(`   Redirecting to: ${setupUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(setupUrl);
    }

    console.log(`[Middleware] Logged-in user access granted.`);
  } else {
    // משתמש לא מחובר
    console.log(`[Middleware] Evaluating GUEST user...`);
    
    if (!isPublicPath) {
      const signInUrl = new URL(`/${currentLocale}/auth/signin`, req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      console.warn(`[Middleware] Guest trying to access protected page.`);
      console.warn(`   Redirecting to: ${signInUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(signInUrl);
    }

    console.log(`[Middleware] Guest access granted to public page.`);
  }

  console.log(`✅ [Middleware] All checks passed. Allowing request.`);
  console.log(`=========================================================\n`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon.ico|logo.png|sw.js|site.webmanifest).*)',
  ],
};