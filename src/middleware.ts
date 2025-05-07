// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

// Paths accessible without any authentication
const publicPaths = [
  '/',                       // Home page
  '/auth/signin',            // Sign in page
  '/auth/register',          // Initial registration page/component access
  '/auth/forgot-password',   // Forgot password page
  '/auth/reset-password',    // Reset password page (requires token in URL usually)
  '/auth/verify-email',      // Email verification page (needs token in URL)
  // '/auth/verify',         // Might be too generic, handled by specific verification pages
  // Public API routes
  '/api/auth/signin',
  '/api/auth/register',      // Registration API
  '/api/auth/session',       // NextAuth session endpoint
  '/api/auth/csrf',          // NextAuth CSRF endpoint
  '/api/auth/providers',     // NextAuth providers endpoint
  '/api/auth/error',         // NextAuth error endpoint (usually redirected to)
  '/api/auth/callback/google', // Google OAuth callback API
  '/availability-response',  // Example specific public page
  '/api/matchmaker/inquiries', // Example specific public API
  '/api/uploadthing',        // Example file upload public API
];

// Paths accessible *after login* but *before* phone verification is complete
// These paths are necessary for the user to complete the verification process
const allowedWhileUnverifiedPaths = [
  // Core authentication flow pages/APIs
  '/auth/register',           // Multi-step form for profile completion
  '/auth/verify-phone',       // The primary phone verification page
  '/auth/update-phone',       // Page to update the phone number during verification
  '/auth/signout',            // Standard signout page
  '/api/auth/signout',        // Signout API
  '/auth/error',              // Standard error page
  // APIs needed during profile completion and verification
  '/api/auth/complete-profile', // API to save profile data before phone verification
  '/api/auth/send-phone-code',  // API to trigger OTP send (used after profile completion)
  '/api/auth/verify-phone-code',// API to verify the OTP entered by the user
  '/api/auth/resend-phone-code',// API to request a new OTP
  '/api/auth/update-and-resend-code', // API to update phone and send new OTP
  // Email verification (if allowed before phone verification)
  '/auth/verify-email',       // Page to display email verification status/prompt (if needed)
  // '/api/auth/resend-email-verification' // API to resend email link (if needed)
];


export default withAuth(
  // Middleware function that runs *after* authorization check passes (token exists or path is public)
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Log entry for debugging
    console.log("[Middleware] Check:", {
      path,
      tokenExists: !!token,
      userId: token?.id,
      isPhoneVerified: token?.isPhoneVerified,
      // Add other relevant token fields for debugging if needed
      // isEmailVerified: token?.isVerified,
      // isProfileComplete: token?.isProfileComplete, // Less relevant now
      // status: token?.status,
    });

    // --- Scenario 1: No token ---
    // If `authorized` callback allowed access without a token (i.e., it's a public path), let it through.
    // If somehow it gets here without a token for a non-public path, the `authorized` callback
    // should have already redirected, but we double-check. `withAuth` usually handles this.
    if (!token) {
        const isPublic = publicPaths.some(publicPath =>
            path === publicPath || (publicPath !== '/' && path.startsWith(publicPath))
        );
        if (!isPublic) {
            // Should ideally not be reached if `authorized` works correctly
            console.warn(`[Middleware] No token found for non-public path: ${path}. Redirecting to signin.`);
            return NextResponse.redirect(new URL('/auth/signin', req.url));
        }
         console.log(`[Middleware] Allowing unauthenticated access to public path: ${path}`);
        return NextResponse.next(); // Allow access to public path
    }

    // --- Scenario 2: Token exists ---
    // Now we handle authenticated users based on phone verification status.

    // Check if phone verification is required and not completed
    if (!token.isPhoneVerified) {
      console.log(`[Middleware] User ${token.id} phone not verified. Path: ${path}`);

      // Check if the current path is allowed during the verification process or is public
      const isAllowedUnverified = allowedWhileUnverifiedPaths.some(allowedPath =>
          path.startsWith(allowedPath)
      );
      const isPublicPath = publicPaths.some(publicPath =>
        path === publicPath || (publicPath !== '/' && path.startsWith(publicPath))
      );


      console.log(`[Middleware] Path checks for unverified user ${token.id}:`, { path, isAllowedUnverified, isPublicPath });
// If the path is NOT specifically allowed for unverified users and NOT public...
if (!isAllowedUnverified && !isPublicPath) {
  // ***** THIS IS THE KEY CHANGE *****
  // Instead of always redirecting to verify-phone, redirect to the registration/completion page first.
  const redirectTo = '/auth/register'; // Or '/auth/complete-registration' if that's your actual page path
  console.log(`[Middleware] Redirecting unverified user ${token.id} to ${redirectTo} from protected path: ${path}`);
  const redirectUrl = new URL(redirectTo, req.url);
  return NextResponse.redirect(redirectUrl);
} else {
  // Allow access if the path is specifically allowed for unverified users or is public
  console.log(`[Middleware] Allowing access for unverified user ${token.id} to allowed/public path: ${path}`);
  return NextResponse.next();
}
    }

    // --- Scenario 3: Token exists AND phone is verified ---
    // User is authenticated and has verified their phone. Allow access.
    console.log(`[Middleware] Allowing verified user ${token.id} access to path: ${path}`);
    return NextResponse.next();
  },
  {
    // Callbacks for `withAuth`
    callbacks: {
      // Determines if the user is authorized to access *any* page (public or protected)
      // It runs *before* the main middleware function above.
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Check if the path is explicitly public
        const isPublic = publicPaths.some(publicPath =>
            path === publicPath || (publicPath !== '/' && path.startsWith(publicPath))
        );

        // Allow access to public paths regardless of token existence
        if (isPublic) {
          console.log(`[Middleware/authorized] Allowing access to public path: ${path}`);
          return true; // Authorized because the path is public
        }

        // For any non-public path, a token MUST exist.
        // If a token exists, they are authorized *to proceed to the main middleware function*
        // which will then check for phone verification status.
        const isAuthorized = !!token;
        console.log(`[Middleware/authorized] Path: ${path}, IsPublic: ${isPublic}, TokenExists: ${!!token}, Authorized: ${isAuthorized}`);
        return isAuthorized; // True if token exists, false otherwise
      },
    },
    // Configuration for `withAuth`
    pages: {
        signIn: '/auth/signin',   // Page to redirect to if `authorized` returns false
        error: '/auth/error',     // Page for other errors (e.g., OAuth errors)
        // signOut: '/auth/signout', // Optional: Custom signout page
    }
  }
);

// Matcher: Defines which paths the middleware should run on.
// Exclude static files, images, and specific auth API routes handled internally.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (custom assets folder)
     * - images (custom images folder)
     * - /api/auth/session|providers|csrf|signout|error (core next-auth routes not needing middleware logic here)
     * - /api/auth/callback/* (OAuth callbacks handled differently)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|images|api/auth/session|api/auth/providers|api/auth/csrf|api/auth/signout|api/auth/error|api/auth/callback).*)',

    // Explicitly include top-level protected routes if needed for clarity,
    // though the general matcher above should cover them.
    // '/profile/:path*',
    // '/dashboard/:path*',
    // '/matches/:path*',
    // '/preferences/:path*',
    // '/matchmaker/:path*',

    // Include protected API routes for checks
    // '/api/profile/:path*',
    // '/api/matchmaker/:path*',
    // '/api/preferences/:path*',
    // '/api/notifications/:path*',
    // '/api/questionnaire/:path*',
    // '/api/suggestions/:path*',
     ],
};