// src/middleware.ts - גרסה מתוקנת עם תמיכה ב-App Router + CORS

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { i18n, type Locale } from '../i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// =============================================================================
// CORS Configuration
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://www.neshamatech.com',
  'https://neshamatech.com',
  'http://localhost:8081',   // Expo Web dev
  'http://localhost:3000',   // Next.js dev
  'http://localhost:19006',  // Expo Web alternative port
  'http://localhost:19000',  // Expo dev server
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// =============================================================================
// Path Definitions
// =============================================================================

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
  '/legal/accessibility-statement',
  '/legal/child-safety',
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

const POST_SETUP_PATHS: string[] = [];

const PUBLIC_API_PATHS = ['/api/feedback'];

// =============================================================================
// I18N Locale Detection Function
// =============================================================================

function getLocale(request: NextRequest): Locale {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = i18n.locales;
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages([...locales]);
  return matchLocale(languages, locales, i18n.defaultLocale) as Locale;
}

// =============================================================================
// Main Middleware Logic
// =============================================================================

export async function middleware(req: NextRequest) {
  console.log(`\n\n=========================================================`);
  console.log(`--- [Middleware] New Request Received ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`➡️  Incoming Full URL: ${req.url}`);
  console.log(`➡️  Method: ${req.method}`);

  const { pathname, search } = req.nextUrl;
  const origin = req.headers.get('origin');

  // ==========================================================================
  // 1. CORS Handling for API Routes (MUST BE FIRST!)
  // ==========================================================================
  
  if (pathname.startsWith('/api/')) {
    console.log(`[Middleware] API route detected: ${pathname}`);
    console.log(`   Origin: ${origin}`);
    console.log(`   Method: ${req.method}`);

    const corsHeaders = getCorsHeaders(origin);

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      console.log(`[Middleware] CORS preflight request. Returning 204.`);
      console.log(`=========================================================\n`);
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // For actual API requests, add CORS headers and continue
    const response = NextResponse.next();
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    console.log(`[Middleware] API request. Adding CORS headers and continuing.`);
    console.log(`=========================================================\n`);
    return response;
  }

  // ==========================================================================
  // 2. Static Files - Skip middleware
  // ==========================================================================

  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname);

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/logo.png') ||
    isStaticFile
  ) {
    console.log(`[Middleware] Static asset. Skipping.`);
    console.log(`=========================================================\n`);
    return NextResponse.next();
  }

  // ==========================================================================
  // 3. Referral Short Links
  // ==========================================================================

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

  // ==========================================================================
  // 4. Locale Detection and Redirect
  // ==========================================================================

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  console.log(`   Pathname: ${pathname}`);
  console.log(`   Missing Locale?: ${pathnameIsMissingLocale}`);

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req);
    
    let newPathname: string;
    
    if (pathname === '/') {
      newPathname = `/${locale}`;
    } else {
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

  // ==========================================================================
  // 5. Extract Locale and Clean Path
  // ==========================================================================

  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = (segments[0] as Locale) || i18n.defaultLocale;
  const pathWithoutLocale = '/' + segments.slice(1).join('/') || '/';

  console.log(`   Segments: ${JSON.stringify(segments)}`);
  console.log(`   Current Locale: ${currentLocale}`);
  console.log(`   Path without Locale: ${pathWithoutLocale}`);

  // ==========================================================================
  // 6. Authentication Check
  // ==========================================================================

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

  // ==========================================================================
  // 7. Path Type Detection
  // ==========================================================================

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

  // ==========================================================================
  // 8. Referral Public Paths - Allow Access
  // ==========================================================================

  if (isReferralPublicPath) {
    console.log(`[Middleware] Referral public path. Allowing access.`);
    console.log(`=========================================================\n`);
    return NextResponse.next();
  }

  // ==========================================================================
  // 9. Authorization Logic
  // ==========================================================================

  if (isUserLoggedIn) {
    console.log(`[Middleware] Evaluating LOGGED-IN user...`);

    // Admin path check
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

    // Logged-in user with complete profile on auth page
    if (isProfileConsideredComplete && (pathWithoutLocale === '/auth/signin' || pathWithoutLocale === '/auth/register')) {
      const redirectUrl = new URL(`/${currentLocale}/profile`, req.url);
      console.warn(`[Middleware] Logged-in user with complete profile on auth page.`);
      console.warn(`   Redirecting to: ${redirectUrl.toString()}`);
      console.log(`=========================================================\n`);
      return NextResponse.redirect(redirectUrl);
    }

    // Logged-in user with incomplete profile
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
    // Guest user
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

// =============================================================================
// Middleware Config
// =============================================================================

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets|images|favicon.ico|logo.png|sw.js|site.webmanifest).*)',
  ],
};