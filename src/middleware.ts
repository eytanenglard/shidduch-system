import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// הגדרת הנתיבים הציבוריים שלא דורשים אימות
const publicPaths = [
  '/',  // דף הבית
  '/auth/signin',
  '/auth/register',
  '/auth/verify-email',
  '/auth/verify',
  '/auth/google-callback', // החלפת complete-registration בנתיב החדש
  '/api/auth/complete-profile', // שינוי שם API
  '/availability-response',
  '/api/matchmaker/inquiries'
];

// נתיבים שמותר לגשת אליהם גם ללא פרופיל מלא
const allowWithoutProfilePaths = [
  '/auth/google-callback', // החלפת complete-registration
  '/api/auth/complete-profile', // שינוי שם API
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
      isProfileComplete: token?.isProfileComplete,
      hasProfile: !!token?.profile
    });
    
    // בדיקה אם זה חלק מתהליך ההתחברות עם Google
    if (path.startsWith('/api/auth/callback/google')) {
      return NextResponse.next();
    }
    
    // בדיקה אם הנתיב הוא ציבורי
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      return NextResponse.next();
    }

    // בדיקה מיוחדת: אם זה משתמש מאומת שהפרופיל שלו לא הושלם
    if (token?.isVerified && token?.isProfileComplete === false) {
      console.log("User without complete profile detected, redirect check for path:", path);
      
      // אם המשתמש לא נמצא כבר בדף השלמת הרישום, הפנה אותו לשם
      if (!allowWithoutProfilePaths.some(allowedPath => path.startsWith(allowedPath))) {
        console.log("Redirecting to google callback for profile completion");
        return NextResponse.redirect(
          new URL('/auth/google-callback', req.url) // שינוי היעד להפניה
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
    // החרג assets סטטיים ונכסים אחרים
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
    '/dashboard/:path*',
    '/matches/:path*',
    '/preferences/:path*',
    '/profile/:path*',
    '/matchmaker/:path*',
    '/api/matchmaker/:path*',
    '/api/profile/:path*',
    '/api/preferences/:path*',
    '/api/auth/verify',
    '/auth/google-callback',
    '/api/auth/complete-profile',
    '/availability-response',
    '/api/matchmaker/inquiries/:path*',
  ]
};