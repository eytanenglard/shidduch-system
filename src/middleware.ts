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
  // Public API routes (ensure these are genuinely public or protected elsewhere if needed)
  '/api/auth/signin',
  '/api/auth/register',      // API for initial account creation
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/error',
  '/api/auth/callback/google',
  '/api/auth/resend-verification-code', // Public for resending email OTP
  '/api/auth/verify-email-code',      // Public for submitting email OTP
  '/availability-response',
  '/api/matchmaker/inquiries',
  '/api/uploadthing',
];

// Paths accessible *after login* but *before* all verifications are complete.
// These are needed for the user to complete their registration/verification.
const allowedWhileUnverifiedPaths = [
  '/auth/register',           // Main multi-step registration/completion page
  '/auth/verify-phone',       // Phone verification page
  '/auth/update-phone',       // Page to update phone during verification
  '/auth/signout',
  '/api/auth/signout',
  '/auth/error',
  // APIs for profile completion and verifications
  '/api/auth/complete-profile',    // Saves profile data
  '/api/auth/send-phone-code',     // Sends phone OTP
  '/api/auth/verify-phone-code',   // Verifies phone OTP
  '/api/auth/resend-phone-code',   // Resends phone OTP
  '/api/auth/update-and-resend-code',// Updates phone and resends OTP
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
      isEmailVerified: token?.isVerified, // Email verification status
      isProfileComplete: token?.isProfileComplete,
      isPhoneVerified: token?.isPhoneVerified,
    });

    // --- Scenario 1: No token ---
    if (!token) {
        const isPublic = publicPaths.some(publicPath =>
            path === publicPath || (publicPath.endsWith('/*') && path.startsWith(publicPath.slice(0, -2))) || (publicPath !== '/' && path.startsWith(publicPath))
        );
        if (!isPublic) {
            console.warn(`[Middleware] No token for non-public path: ${path}. Redirecting to signin.`);
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url); // Preserve intended destination
            return NextResponse.redirect(signInUrl);
        }
        console.log(`[Middleware] Allowing unauthenticated access to public path: ${path}`);
        return NextResponse.next();
    }

    // --- Scenario 2: Token exists ---
    // User is authenticated. Now check their completion/verification status.

    // If user's email is not yet verified (for email/password signups)
    // and they are trying to access something other than allowed paths.
    // UserStatus.PENDING_EMAIL_VERIFICATION indicates this state.
    if (token.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
        const isAllowed = publicPaths.includes(path) ||
                          allowedWhileUnverifiedPaths.includes(path) ||
                          path.startsWith('/api/auth/resend-verification-code') || // API for email verify
                          path.startsWith('/api/auth/verify-email-code');       // API for email verify
                          
        if (!isAllowed) {
            console.log(`[Middleware] User ${token.id} email not verified (status: ${token.status}). Redirecting to /auth/register for email verification from path: ${path}`);
            const redirectUrl = new URL('/auth/register?reason=verify_email', req.url);
            return NextResponse.redirect(redirectUrl);
        }
    }
    // If profile is not complete OR phone is not verified
    else if (!token.isProfileComplete || !token.isPhoneVerified) {
      console.log(`[Middleware] User ${token.id} incomplete. Profile: ${token.isProfileComplete}, Phone: ${token.isPhoneVerified}. Path: ${path}`);

      const isAllowedUnverified = allowedWhileUnverifiedPaths.some(allowedPath =>
          path.startsWith(allowedPath)
      );
      const isPublic = publicPaths.some(publicPath =>
        path === publicPath || (publicPath.endsWith('/*') && path.startsWith(publicPath.slice(0, -2))) || (publicPath !== '/' && path.startsWith(publicPath))
      );

      console.log(`[Middleware] Path checks for incomplete user ${token.id}:`, { path, isAllowedUnverified, isPublic });

      if (!isAllowedUnverified && !isPublic) {
        const reason = !token.isProfileComplete ? 'complete_profile' : 'verify_phone';
        const redirectTo = '/auth/register';
        console.log(`[Middleware] Redirecting incomplete user ${token.id} to ${redirectTo}?reason=${reason} from protected path: ${path}`);
        const redirectUrl = new URL(redirectTo, req.url);
        redirectUrl.searchParams.set('reason', reason);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Scenario 3: Token exists, email verified, profile complete, AND phone is verified
    // User is fully authenticated and verified.
    // If they try to access auth pages like signin/register, redirect them to profile.
    if ((path.startsWith('/auth/signin') || path.startsWith('/auth/register')) && token.isProfileComplete && token.isPhoneVerified) {
        console.log(`[Middleware] Fully verified user ${token.id} accessing auth page ${path}. Redirecting to /profile.`);
        return NextResponse.redirect(new URL('/profile', req.url));
    }
    
    console.log(`[Middleware] Allowing access for user ${token.id} to path: ${path}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const isPublic = publicPaths.some(publicPath =>
            path === publicPath || (publicPath.endsWith('/*') && path.startsWith(publicPath.slice(0, -2))) || (publicPath !== '/' && path.startsWith(publicPath))
        );

        if (isPublic) {
          console.log(`[Middleware/authorized] Allowing public access to: ${path}`);
          return true;
        }
        
        // For non-public paths, a token must exist.
        const isAuthorizedByToken = !!token;
        console.log(`[Middleware/authorized] Path: ${path}, IsPublic: ${isPublic}, TokenExists: ${!!token}, Authorized: ${isAuthorizedByToken}`);
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
    '/((?!_next/static|_next/image|favicon.ico|assets|images|api/auth/session|api/auth/providers|api/auth/csrf|api/auth/signout|api/auth/error|api/auth/callback).*)',
  ],
};