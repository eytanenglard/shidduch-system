// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { UserStatus } from "@prisma/client"; // Import UserStatus for explicit checks

// Paths accessible without any authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/register', // Entry point for registration, logic inside will determine step
  '/auth/forgot-password',
  '/auth/reset-password', // Typically requires a token in URL
  '/auth/verify-email',   // Page for handling email verification links/codes
  // Public API routes
  '/api/auth/signin',
  '/api/auth/register',      // API for initial account creation
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/error',
  '/api/auth/callback/google', // Make sure to handle other providers if you have them
  '/api/auth/resend-verification-code', // Public for resending email OTP
  '/api/auth/verify-email-code',      // Public for submitting email OTP
  '/availability-response',
  '/api/matchmaker/inquiries',
  '/api/uploadthing',
];

// Paths accessible *after login* (token exists) but *before* all verifications/completions are done.
// These are needed for the user to complete their registration/verification or manage basic account settings.
const allowedWhileUnverifiedOrIncompletePaths = [
  '/auth/register',           // Main multi-step registration/completion page
  '/auth/verify-phone',       // Phone verification page
  '/auth/update-phone',       // Page to update phone during verification
  '/auth/signout',
  '/auth/error',
  '/account-settings',        // <<< ADDED: Allow access to account settings page
  // APIs for profile completion, verifications, and account management
  '/api/auth/complete-profile',    // Saves profile data
  '/api/auth/send-phone-code',     // Sends phone OTP
  '/api/auth/verify-phone-code',   // Verifies phone OTP
  '/api/auth/resend-phone-code',   // Resends phone OTP
  '/api/auth/update-and-resend-code',// Updates phone and resends OTP
  '/api/auth/delete',             // <<< ADDED: API for deleting account
  '/api/profile',                  // Example: if account settings calls API to update parts of profile not covered by completion
  '/api/auth/initiate-password-change', // If password change is allowed before full verification
  '/api/auth/complete-password-change', // If password change is allowed before full verification
  '/api/auth/send-verification',        // For re-sending email verification from account settings
  // Email verification specific page (if user navigates directly)
  // Note: /auth/register handles showing EmailVerificationCodeStep internally
  '/auth/verify-email',
];


export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("[Middleware] Check:", {
      path,
      tokenExists: !!token,
      userId: token?.id,
      userStatus: token?.status,
      isEmailVerified: token?.isVerified,
      isProfileComplete: token?.isProfileComplete,
      isPhoneVerified: token?.isPhoneVerified,
    });

    // Helper to check if path starts with any of the allowed paths
    const isPathAllowed = (allowedPaths: string[], currentPath: string) => {
        return allowedPaths.some(allowedPath =>
            currentPath === allowedPath || // Exact match
            (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) || // Wildcard match
            (allowedPath !== '/' && currentPath.startsWith(allowedPath)) // Prefix match for APIs like /api/auth/...
        );
    };

    // --- Scenario 1: No token ---
    if (!token) {
        const isPublic = isPathAllowed(publicPaths, path);
        if (!isPublic) {
            console.warn(`[Middleware] No token for non-public path: ${path}. Redirecting to signin.`);
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        }
        console.log(`[Middleware] Allowing unauthenticated access to public path: ${path}`);
        return NextResponse.next();
    }

    // --- Scenario 2: Token exists ---
    // User is authenticated. Now check their completion/verification status.

    const isAllowedGeneral = isPathAllowed(publicPaths, path) ||
                             isPathAllowed(allowedWhileUnverifiedOrIncompletePaths, path);


    // Status-based redirection if not on an explicitly allowed path for their current state
    if (!isAllowedGeneral) {
        if (token.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
            console.log(`[Middleware] User ${token.id} email not verified (status: ${token.status}). Redirecting to /auth/register for email verification from path: ${path}`);
            const redirectUrl = new URL('/auth/register?reason=verify_email', req.url);
            return NextResponse.redirect(redirectUrl);
        }
        // This block handles users who have verified email (or logged in via OAuth where email is often pre-verified)
        // but haven't completed profile or phone verification.
        else if (!token.isProfileComplete || !token.isPhoneVerified) {
            const reason = !token.isProfileComplete ? 'complete_profile' : 'verify_phone';
            const redirectTo = '/auth/register';
            console.log(`[Middleware] Redirecting incomplete user ${token.id} to ${redirectTo}?reason=${reason} from protected path: ${path}`);
            const redirectUrl = new URL(redirectTo, req.url);
            redirectUrl.searchParams.set('reason', reason);
            return NextResponse.redirect(redirectUrl);
        }
    }


    // Scenario 3: Token exists, and user is fully authenticated and verified (email, profile, phone).
    // If they try to access auth pages like signin/register, redirect them.
    // This check should only apply if the user is *fully* set up.
    if (
        (path.startsWith('/auth/signin') || path.startsWith('/auth/register')) &&
        token.status === UserStatus.ACTIVE && // Ensure they are active
        token.isVerified && // Email verified
        token.isProfileComplete &&
        token.isPhoneVerified
    ) {
        console.log(`[Middleware] Fully verified user ${token.id} accessing auth page ${path}. Redirecting to /dashboard or /profile.`);
        return NextResponse.redirect(new URL('/profile', req.url)); // Or /dashboard
    }
    
    console.log(`[Middleware] Allowing access for user ${token.id} (Status: ${token.status}, EmailVerified: ${token.isVerified}, ProfileComplete: ${token.isProfileComplete}, PhoneVerified: ${token.isPhoneVerified}) to path: ${path}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Helper to check if path starts with any of the allowed paths
        const isPathAllowed = (allowedPaths: string[], currentPath: string) => {
            return allowedPaths.some(allowedPath =>
                currentPath === allowedPath ||
                (allowedPath.endsWith('/*') && currentPath.startsWith(allowedPath.slice(0, -2))) ||
                (allowedPath !== '/' && currentPath.startsWith(allowedPath))
            );
        };

        const isPublic = isPathAllowed(publicPaths, path);

        if (isPublic) {
          console.log(`[Middleware/authorized] Allowing public access to: ${path}`);
          return true; // Allow access to public paths regardless of token
        }
        
        // For non-public paths, a token must exist.
        // The main middleware function will then handle redirection based on token.status, etc.
        const isAuthorizedByToken = !!token;
        console.log(`[Middleware/authorized] Path: ${path}, IsPublic: ${isPublic}, TokenExists: ${!!token}, Authorized: ${isAuthorizedByToken}`);
        return isAuthorizedByToken;
      },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error', // Custom error page
    }
  }
);

export const config = {
  matcher: [
    // Match all routes except for static assets, images, and specific NextAuth internal API routes
    '/((?!_next/static|_next/image|favicon.ico|assets|images).*)',
  ],
};