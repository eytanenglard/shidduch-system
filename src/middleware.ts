// src/middleware.ts - VERSION WITH I18N, AUTH, AND RATE LIMITING

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { UserStatus } from '@prisma/client';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- START: I18N Imports & Config ---
import { i18n } from '../i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
// --- END: I18N Imports & Config ---


// --- START: Rate Limiting Configuration (ללא שינוי) ---
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in the environment");
}
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit_matchpoint',
});
// --- END: Rate Limiting Configuration ---


// --- START: I18N Locale Detection Function ---
function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);
  const locale = matchLocale(languages, locales, i18n.defaultLocale);
  return locale;
}
// --- END: I18N Locale Detection Function ---


// --- START: Path Definitions (ללא שינוי) ---
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/contact',
  '/questionnaire',
  '/auth/forgot-password',
  '/api/auth/request-password-reset',
  '/auth/reset-password',
  '/api/auth/reset-password',
  '/auth/setup-account',
  '/api/auth/complete-setup',
  '/auth/accept-invitation',
  '/api/auth/callback/google',
  '/api/uploadthing',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
  '/auth/error',
  '/api/auth/session',
];
const allowedWhileIncompleteOrUnverifiedPaths = [
  '/auth/register',
  '/auth/verify-phone',
  '/api/user/accept-terms',
  '/settings',
  '/api/auth/delete',
  '/api/auth/send-verification',
  '/api/auth/initiate-password-change',
  '/api/auth/complete-password-change',
  '/api/auth/verify-phone-code',
  '/api/auth/resend-phone-code',
  '/api/auth/update-and-resend-code',
  '/auth/update-phone',
  '/api/auth/session',
];
const rateLimitedPaths = [
  '/api/chat',
  '/api/contact',
];
// --- END: Path Definitions ---


// --- Main Middleware Logic wrapped by withAuth ---
export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const pathname = req.nextUrl.pathname;
    
    // --- ✨ START: I18N ROUTING LOGIC (RUNS FIRST) ---
    // שלב 1: לבדוק אם הנתיב הוא נכס סטטי או API שאין לתרגם
    const isAssetOrApi = pathname.startsWith('/api/') || 
                         pathname.startsWith('/_next/') || 
                         pathname.includes('/favicon.ico') ||
                         pathname.startsWith('/assets/') ||
                         pathname.startsWith('/images/');

    // שלב 2: לבדוק אם הנתיב הנוכחי חסר קידומת שפה (למשל, /he או /en)
    const pathnameIsMissingLocale = i18n.locales.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    // שלב 3: אם חסרה קידומת שפה וזה לא נכס סטטי/API, בצע הפנייה
    if (pathnameIsMissingLocale && !isAssetOrApi) {
      const locale = getLocale(req); // זיהוי השפה המועדפת
      
      // הפנייה לכתובת ה-URL הנכונה עם קידומת השפה
      return NextResponse.redirect(
        new URL(`/${locale}${pathname}`, req.url)
      );
    }
    // --- ✨ END: I18N ROUTING LOGIC ---


    // --- ✨ START: EXTRACT LOCALE FOR REDIRECTS ---
    // מכאן והלאה, אנו מניחים שלנתיב יש קידומת שפה. נחלץ אותה.
    const locale = pathname.split('/')[1] || i18n.defaultLocale;
    // --- ✨ END: EXTRACT LOCALE FOR REDIRECTS ---

    
    const isApiRoute = pathname.startsWith('/api/');

    // --- START: Rate Limiting Logic (ללא שינוי) ---
    if (process.env.NODE_ENV === 'production' && rateLimitedPaths.some(p => pathname.endsWith(p))) {
        const token = req.nextauth.token;
        const identifier = token?.id || req.ip || '127.0.0.1';
        
        try {
            const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
            if (!success) {
                console.warn(`[RateLimit PROD] Blocked request for identifier: ${identifier}.`);
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
        } catch (error) {
            console.error("[RateLimit ERROR] Failed to connect to Upstash Redis.", error);
        }
    }
    // --- END: Rate Limiting Logic ---

    const token = req.nextauth.token;

    // Helper function להסרת קידומת השפה מהנתיב לצורך בדיקות ההרשאות
    const getPathWithoutLocale = (currentPath: string) => {
      const parts = currentPath.split('/');
      if (i18n.locales.includes(parts[1] as any)) {
        parts.splice(1, 1);
        return parts.join('/') || '/';
      }
      return currentPath;
    };
    
    const pathWithoutLocale = getPathWithoutLocale(pathname);

    const isPathAllowed = (allowedPaths: string[], currentPath: string): boolean => {
      return allowedPaths.some(allowedPath => currentPath.startsWith(allowedPath));
    };

    // --- Scenario 1: No token (משתמש לא מחובר) ---
    if (!token) {
        const allPublicPaths = [...publicPaths, ...rateLimitedPaths];
        const isPublic = isPathAllowed(allPublicPaths, pathWithoutLocale);

        if (!isPublic) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            // ✨ עדכון: הפנייה לדף ההתחברות עם קידומת השפה הנכונה
            const signInUrl = new URL(`/${locale}/auth/signin`, req.url);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        }
        return NextResponse.next();
    }

    // --- Scenario 2: Token exists (משתמש מחובר) ---
    const needsEmailVerification = token.status === UserStatus.PENDING_EMAIL_VERIFICATION && !token.isVerified;
    const needsProfileCompletion = !token.isProfileComplete;
    const needsPhoneVerification = !token.isPhoneVerified;
    const needsTermsAcceptance = !token.termsAndPrivacyAcceptedAt;
    const overallNeedsCompletion = needsEmailVerification || needsProfileCompletion || needsPhoneVerification || needsTermsAcceptance;
    
    const isAuthPage = pathWithoutLocale.startsWith('/auth/signin') || pathWithoutLocale.startsWith('/auth/register');

    if (isAuthPage) {
        if (!overallNeedsCompletion) {
            // ✨ עדכון: הפנייה לדף הפרופיל עם קידומת השפה
            return NextResponse.redirect(new URL(`/${locale}/profile`, req.url));
        }
        if (pathWithoutLocale.startsWith('/auth/signin')) {
             // ✨ עדכון: הפנייה לדף ההרשמה עם קידומת השפה
             return NextResponse.redirect(new URL(`/${locale}/auth/register`, req.url));
        }
        return NextResponse.next();
    }

    const allAllowedWhileIncomplete = [...publicPaths, ...allowedWhileIncompleteOrUnverifiedPaths, ...rateLimitedPaths];
    const isAllowedForIncompleteUser = isPathAllowed(allAllowedWhileIncomplete, pathWithoutLocale);

    if (overallNeedsCompletion && !isAllowedForIncompleteUser) {
        let reason = '';
        if (needsTermsAcceptance) reason = 'accept_terms';
        else if (needsEmailVerification) reason = 'verify_email';
        else if (needsProfileCompletion) reason = 'complete_profile';
        else if (needsPhoneVerification) reason = 'verify_phone';

        if (isApiRoute) {
            return NextResponse.json({ error: `Action required: ${reason}.` }, { status: 403 });
        }
        
        // ✨ עדכון: הפנייה לדף ההרשמה עם קידומת השפה
        const redirectUrl = new URL(`/${locale}/auth/register`, req.url);
        if (reason) redirectUrl.searchParams.set('reason', reason);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // מכיוון שהלוגיקה הראשית מטפלת בכל, נאשר כאן תמיד
        // כדי שהמידלוור הראשי שלנו ירוץ תמיד.
        return true; 
      },
    },
    pages: {
        // הערה: נתיבים אלה הם סטטיים. הלוגיקה הראשית שלנו דואגת
        // להפניות הדינמיות עם השפה הנכונה, כך שזה בסדר להשאיר אותם כך.
        signIn: '/auth/signin',
        error: '/auth/error',
    }
  }
);


export const config = {
  // עדכון ה-matcher כדי שיתעלם מנתיבי API, נכסים סטטיים, וכו'.
  // זה מונע מהמידלוור לרוץ על בקשות לא רלוונטיות ומשפר ביצועים.
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon.ico|sw.js|site.webmanifest).*)',
  ],
};