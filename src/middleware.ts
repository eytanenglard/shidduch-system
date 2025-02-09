import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// הגדרת הנתיבים הציבוריים שלא דורשים אימות
const publicPaths = [
  '/auth/signin',
  '/auth/register',
  '/auth/verify-email',
  '/auth/verify',
  '/auth/complete-registration',
  '/api/auth/complete-registration',
  '/availability-response',
  '/api/matchmaker/inquiries'
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // בדיקה אם הנתיב הוא ציבורי
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      return NextResponse.next();
    }

    // בדיקת סטטוס משתמש
    if (token?.status === "PENDING") {
      // אם המשתמש לא מאומת ומנסה לגשת לדף מוגן
      if (!path.startsWith("/verify-email")) {
        const email = token.email as string;
        return NextResponse.redirect(
          new URL(`/auth/verify-email?email=${encodeURIComponent(email)}`, req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // מאפשר גישה לנתיבים ציבוריים
        if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
          return true;
        }
        
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/matches/:path*',
    '/preferences/:path*',
    '/profile/:path*',
    '/matchmaker/:path*',
    '/api/matchmaker/:path*',
    '/api/profile/:path*',
    '/api/preferences/:path*',
    '/api/auth/verify',
    '/auth/complete-registration',
    '/api/auth/complete-registration',
    '/availability-response',
    '/api/matchmaker/inquiries/:path*',

  ]
};