// middleware.ts - VERSION WITH RATE LIMITING FOR HEROKU

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server'; // Import NextRequest
import type { NextRequestWithAuth } from "next-auth/middleware";
import { UserStatus } from "@prisma/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// --- START: Rate Limiting Configuration ---
// Check if environment variables are set
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in the environment");
}

// Create a new Redis client instance.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // Allow 10 requests per 10 seconds. Adjust as needed.
  analytics: true,
  prefix: 'ratelimit_matchpoint', // Unique prefix for your app
});
// --- END: Rate Limiting Configuration ---

// Paths accessible without any authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/contact',
  '/questionnaire',
  // --- START: FIX FOR FORGOT/RESET PASSWORD ---
  '/auth/forgot-password',    // Page for the "Forgot Password" form
  '/api/auth/request-password-reset',// API to handle the forgot password request
  '/auth/reset-password',     // Page for the "Reset Password" form (from email link)
  '/api/auth/reset-password', // API to handle the actual password reset
  // --- END: FIX FOR FORGOT/RESET PASSWORD ---
  '/auth/setup-account',       // Page for user to set password from invite
  '/api/auth/complete-setup',   // API to process the password setup
  '/auth/accept-invitation',    // Page for a generic invitation
  '/api/auth/callback/google',
  '/api/uploadthing',
   '/legal/privacy-policy',           // <--- הוסף
  '/legal/terms-of-service',         // <--- הוסף
  '/auth/error',                     // <--- הוסף אם דף השגיאה צריך להיות ציבורי          // <--- הוסף
'/api/auth/session',
];

// Paths accessible *after login* but *before* completion.
const allowedWhileIncompleteOrUnverifiedPaths = [
  '/auth/register',
  '/auth/verify-phone',
  '/api/user/accept-terms',
  '/settings',                  // The account settings page itself
  '/api/auth/delete',                   // The API endpoint for account deletion
  '/api/auth/send-verification',        // To allow resending verification emails from the settings page
  '/api/auth/initiate-password-change', // To allow password changes
  '/api/auth/complete-password-change',
  '/api/auth/verify-phone-code',
  '/api/auth/resend-phone-code',
  '/api/auth/update-and-resend-code',
  '/auth/update-phone',
   // To complete password changes
];

// --- NEW: Add the chat API path to a separate constant for rate limiting ---
const rateLimitedPaths = [
    '/api/chat',
    '/api/contact',
];

export default withAuth(
  async function middleware(req: NextRequestWithAuth) { // Added 'async'
    const path = req.nextUrl.pathname;

    // --- START: Rate Limiting Logic ---
    // Check if the current path needs to be rate-limited
    if (rateLimitedPaths.some(p => path.startsWith(p))) {
        const token = req.nextauth.token;
        // Identifier can be user ID (if logged in) or IP address (for guests)
        const identifier = token?.id || req.ip || '127.0.0.1';
        
        console.log(`[RateLimit] Checking request for identifier: ${identifier} on path: ${path}`);
        
        const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

        if (!success) {
            console.warn(`[RateLimit] Blocked request for identifier: ${identifier}. Remaining: ${remaining}/${limit}. Resets in: ${new Date(reset).toLocaleTimeString()}`);
            return NextResponse.json({ error: 'יותר מדי בקשות, אנא המתן מספר שניות ונסה שוב.' }, { status: 429 });
        }
        
        console.log(`[RateLimit] Allowed request for identifier: ${identifier}. Remaining: ${remaining}/${limit}.`);
    }
    // --- END: Rate Limiting Logic ---

    // --- START: Your existing middleware logic ---
    const token = req.nextauth.token;
    const isApiRoute = path.startsWith('/api/');

    // Helper to check if path starts with any of the allowed paths
    const isPathAllowed = (allowedPaths: string[], currentPath: string): boolean => {
        return allowedPaths.some(allowedPath => {
            if (currentPath === allowedPath) return true;
            if (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) return true;
            // More specific check to avoid broad matches like /auth allowing /auth/anything
            if (currentPath.startsWith(allowedPath) && (currentPath.length === allowedPath.length || currentPath.charAt(allowedPath.length) === '/')) return true;
            return false;
        });
    };

    // --- Scenario 1: No token ---
    if (!token) {
        const allPublicPaths = [...publicPaths, ...rateLimitedPaths];
        const isPublic = isPathAllowed(allPublicPaths, path);

        if (!isPublic) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        }
        return NextResponse.next();
    }

    // --- Scenario 2: Token exists ---
    const needsEmailVerification = token.status === UserStatus.PENDING_EMAIL_VERIFICATION && !token.isVerified;
    const needsProfileCompletion = !token.isProfileComplete;
    const needsPhoneVerification = !token.isPhoneVerified;
    const needsTermsAcceptance = !token.termsAndPrivacyAcceptedAt;
    const overallNeedsCompletion = needsEmailVerification || needsProfileCompletion || needsPhoneVerification || needsTermsAcceptance;
    
    // Add rate-limited paths to the list of paths an incomplete user can access.
    const allAllowedWhileIncomplete = [...publicPaths, ...allowedWhileIncompleteOrUnverifiedPaths, ...rateLimitedPaths];

    const isAllowedForIncompleteUser = isPathAllowed(allAllowedWhileIncomplete, path);

    if (overallNeedsCompletion && !isAllowedForIncompleteUser) {
        let reason = '';
        if (needsTermsAcceptance) reason = 'accept_terms';
        else if (needsEmailVerification) reason = 'verify_email';
        else if (needsProfileCompletion) reason = 'complete_profile';
        else if (needsPhoneVerification) reason = 'verify_phone';

        if (isApiRoute) {
            return NextResponse.json({
                error: `Action required: ${reason}. Please complete your profile/verification.`,
                reason: reason,
            }, { status: 403 });
        }

        const redirectTo = '/auth/register';
        const redirectUrl = new URL(redirectTo, req.url);
        if (reason) redirectUrl.searchParams.set('reason', reason);
        return NextResponse.redirect(redirectUrl);
    }

    // --- Scenario 3: Fully verified user ---
    if (
        (path.startsWith('/auth/signin') || path.startsWith('/auth/register')) &&
        token.status === UserStatus.ACTIVE &&
        token.isVerified &&
        token.isProfileComplete &&
        token.isPhoneVerified &&
        token.termsAndPrivacyAcceptedAt
    ) {
        return NextResponse.redirect(new URL('/profile', req.url));
    }
    
    return NextResponse.next();
    // --- END: Your existing middleware logic ---
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        const isPathAllowed = (allowedPaths: string[], currentPath: string): boolean => {
            return allowedPaths.some(allowedPath => {
                if (currentPath === allowedPath) return true;
                if (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) return true;
                if (currentPath.startsWith(allowedPath) && (currentPath.length === allowedPath.length || currentPath.charAt(allowedPath.length) === '/')) return true;
                return false;
            });
        };
        
        const allPublicPaths = [...publicPaths, ...rateLimitedPaths];
        const isPublic = isPathAllowed(allPublicPaths, path);

        if (isPublic) {
          return true;
        }
        
        return !!token;
      },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    }
  }
);

// We keep the main matcher as it is. It's broad, and we filter inside the middleware.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|images|sw.js|site.webmanifest).*)',
  ],
};