// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { UserStatus } from "@prisma/client";

// Paths accessible without any authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/legal/terms-of-service',
  '/legal/privacy-policy',
  // Public API routes
  '/api/auth/signin', // Generally not needed if using NextAuth pages, but good to have
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/error',
  '/api/auth/callback/google',
  '/api/auth/resend-verification-code',
  '/api/auth/verify-email-code',
  '/api/uploadthing', // Assuming this is public for uploads
];

// Paths accessible *after login* (token exists) but *before* all verifications/completions are done.
const allowedWhileIncompleteOrUnverifiedPaths = [
  '/auth/register',           // Main multi-step registration/completion page
  '/auth/verify-phone',       // Phone verification page
  '/auth/update-phone',       // Page to update phone during verification
  '/auth/signout',            // NextAuth internal path for signout
  '/auth/error',
  '/account-settings',        // For basic account management
  // APIs for profile completion, verifications, and account management
  '/api/auth/complete-profile',
  '/api/auth/send-phone-code',
  '/api/auth/verify-phone-code',
  '/api/auth/resend-phone-code',
  '/api/auth/update-and-resend-code',
  '/api/auth/delete',
  '/api/profile', // Example: If account settings calls API to update parts of profile
  '/api/auth/initiate-password-change',
  '/api/auth/complete-password-change',
  '/api/auth/send-verification', // For re-sending email verification
  '/api/user/accept-terms', // <<< API to accept terms, must be accessible during completion
];


export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api/');

    console.log("[Middleware] Check:", {
      path,
      isApiRoute,
      tokenExists: !!token,
      userId: token?.id,
      userStatus: token?.status,
      isEmailVerified: token?.isVerified,
      isProfileComplete: token?.isProfileComplete,
      isPhoneVerified: token?.isPhoneVerified,
      termsAccepted: !!token?.termsAndPrivacyAcceptedAt,
    });

    // Helper to check if path starts with any of the allowed paths
    const isPathAllowed = (allowedPaths: string[], currentPath: string): boolean => {
        return allowedPaths.some(allowedPath => {
            // Exact match or prefix match for API routes that might have dynamic parts
            if (currentPath === allowedPath) return true;
            if (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) return true;
            // More robust prefix match for API routes and specific auth pages
            if (allowedPath !== '/' && currentPath.startsWith(allowedPath) && (allowedPath.startsWith('/api/') || allowedPath.startsWith('/auth/'))) return true;
            return false;
        });
    };

    // --- Scenario 1: No token ---
    if (!token) {
        const isPublic = isPathAllowed(publicPaths, path);
        if (!isPublic) {
            // If it's an API route and requires auth, return JSON error
            if (isApiRoute) {
                console.warn(`[Middleware] Unauthorized API access to ${path} - No token. Returning 401 JSON.`);
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            console.warn(`[Middleware] No token for non-public page: ${path}. Redirecting to signin.`);
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url); // Preserve original destination
            return NextResponse.redirect(signInUrl);
        }
        console.log(`[Middleware] Allowing unauthenticated access to public path: ${path}`);
        return NextResponse.next();
    }

    // --- Scenario 2: Token exists ---
    // User is authenticated. Now check their completion/verification status.

    const needsEmailVerification = token.status === UserStatus.PENDING_EMAIL_VERIFICATION && !token.isVerified;
    const needsProfileCompletion = !token.isProfileComplete;
    const needsPhoneVerification = !token.isPhoneVerified;
    const needsTermsAcceptance = !token.termsAndPrivacyAcceptedAt;

    const overallNeedsCompletion = needsEmailVerification || needsProfileCompletion || needsPhoneVerification || needsTermsAcceptance;

    // Is the current path allowed for users who are still in the process of completing/verifying?
    const isAllowedForIncompleteUser = isPathAllowed(publicPaths, path) || // Public paths are always allowed
                                      isPathAllowed(allowedWhileIncompleteOrUnverifiedPaths, path);


    if (overallNeedsCompletion && !isAllowedForIncompleteUser) {
        let reason = '';
        if (needsTermsAcceptance) reason = 'accept_terms';
        else if (needsEmailVerification) reason = 'verify_email';
        else if (needsProfileCompletion) reason = 'complete_profile';
        else if (needsPhoneVerification) reason = 'verify_phone';

        // If it's an API route and it's not explicitly allowed for incomplete users, return JSON error
        if (isApiRoute) {
            console.warn(`[Middleware] User ${token.id} needs completion (${reason}). API call to protected path ${path} blocked. Returning 403 JSON.`);
            return NextResponse.json({
                error: `Action required: ${reason}. Please complete your profile/verification.`,
                reason: reason,
            }, { status: 403 }); // 403 Forbidden as user is authenticated but not authorized for this action yet
        }

        // For page navigations, redirect to the main registration/completion flow
        const redirectTo = '/auth/register';
        console.log(`[Middleware] Redirecting incomplete user ${token.id} (needs: ${reason}) to ${redirectTo}?reason=${reason} from path: ${path}`);
        const redirectUrl = new URL(redirectTo, req.url);
        if (reason) redirectUrl.searchParams.set('reason', reason);
        return NextResponse.redirect(redirectUrl);
    }


    // Scenario 3: Token exists, and user is fully authenticated and set up.
    // If they try to access auth pages like signin/register, redirect them.
    if (
        (path.startsWith('/auth/signin') || path.startsWith('/auth/register')) &&
        token.status === UserStatus.ACTIVE &&
        token.isVerified &&
        token.isProfileComplete &&
        token.isPhoneVerified &&
        token.termsAndPrivacyAcceptedAt // And terms accepted
    ) {
        console.log(`[Middleware] Fully verified user ${token.id} accessing auth page ${path}. Redirecting to /profile.`);
        return NextResponse.redirect(new URL('/profile', req.url)); // Or /dashboard
    }
    
    console.log(`[Middleware] Allowing access for user ${token.id} (Status: ${token.status}, EmailVerified: ${token.isVerified}, ProfileComplete: ${token.isProfileComplete}, PhoneVerified: ${token.isPhoneVerified}, TermsAccepted: ${!!token.termsAndPrivacyAcceptedAt}) to path: ${path}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        const isPathAllowed = (allowedPaths: string[], currentPath: string): boolean => {
            return allowedPaths.some(allowedPath => {
                if (currentPath === allowedPath) return true;
                if (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) return true;
                if (allowedPath !== '/' && currentPath.startsWith(allowedPath) && (allowedPath.startsWith('/api/') || allowedPath.startsWith('/auth/'))) return true;
                return false;
            });
        };

        const isPublic = isPathAllowed(publicPaths, path);

        if (isPublic) {
          console.log(`[Middleware/authorizedCB] Allowing public access to: ${path}`);
          return true;
        }
        
        const isAuthorizedByToken = !!token; // For non-public paths, a token must exist.
        console.log(`[Middleware/authorizedCB] Path: ${path}, IsPublic: ${isPublic}, TokenExists: ${!!token}, Authorized: ${isAuthorizedByToken}`);
        return isAuthorizedByToken;
      },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    }
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|images|sw.js|site.webmanifest).*)', // Added more common static exclusions
  ],
};