import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// הגדרת הנתיבים הציבוריים שלא דורשים אימות
const publicPaths = [
  '/',  // הוספת דף הבית כנתיב ציבורי
  '/auth/signin',
  '/auth/register',
  '/auth/verify-email',
  '/auth/verify',
  '/auth/complete-registration',
  '/api/auth/complete-registration',
  '/availability-response',
  '/api/matchmaker/inquiries'
];

// נתיבים שמותר לגשת אליהם גם ללא פרופיל מלא
const allowWithoutProfilePaths = [
  '/auth/complete-registration',
  '/api/auth/complete-registration',
  '/auth/signout',
  '/api/auth/signout',
  '/auth/error'
];


export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    console.log("Middleware check:", { 
      path, 
      tokenExists: !!token,
      userID: token?.id,
      isVerified: token?.isVerified,
      hasProfile: !!token?.profile,
      hasBirthDate: !!token?.profile?.birthDate
    });
    
    // בדיקה אם זה חלק מתהליך ההתחברות עם Google
    if (path.startsWith('/api/auth/callback/google')) {
      return NextResponse.next();
    }
    
    // בדיקה אם הנתיב הוא ציבורי
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      return NextResponse.next();
    }

    // בדיקה מיוחדת: אם זה משתמש מאומת שחסר לו פרופיל או תאריך לידה
    if (token?.isVerified && (!token.profile || !token.profile?.birthDate)) {
      console.log("User without complete profile detected, redirect check for path:", path);
      
      // אם המשתמש לא נמצא כבר בדף השלמת הרישום, הפנה אותו לשם
      if (!allowWithoutProfilePaths.some(allowedPath => path.startsWith(allowedPath))) {
        console.log("Redirecting to complete registration");
        return NextResponse.redirect(
          new URL('/auth/complete-registration', req.url)
        );
      }
    }
    
    // שאר הבדיקות נשארות כפי שהן...
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // אם זה חלק מתהליך ההתחברות עם Google, תמיד להרשות
        if (path.startsWith('/api/auth/callback/google')) {
          return true;
        }
        
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
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