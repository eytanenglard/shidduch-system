import { NextResponse } from 'next/server';
// שים לב לשינוי כאן: הוספנו Prisma
import { PrismaClient, Prisma, UserRole } from '@prisma/client'; // ייבא UserRole אם אתה משתמש בו להשוואת תפקידים
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // התאם את הנתיב אם צריך
// import { logger } from '@/lib/logger'; // אם יש לך

const prisma = new PrismaClient();

// ... (פונקציות GET ו-PATCH שלך) ...

export async function DELETE(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  const candidateIdToDelete = params.candidateId;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Attempting to delete candidate by matchmaker. CandidateID: ${candidateIdToDelete}`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !session.user.role) {
    console.warn(`[${timestamp}] Unauthorized: No active session or role found for delete candidate operation. PerformingUserID: ${session?.user?.id}`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. לא זוהתה סשן פעיל או הרשאה.' },
      { status: 401 }
    );
  }

  const performingUserId = session.user.id;
  // בהנחה ש-session.user.role הוא מסוג UserRole מהסכמה שלך
  const performingUserRole = session.user.role as UserRole; 

  if (performingUserRole !== UserRole.ADMIN) { // השוואה מול ה-enum
    console.warn(`[${timestamp}] Forbidden: User does not have ADMIN role to delete candidate. PerformingUserID: ${performingUserId}, Role: ${performingUserRole}`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. נדרשת הרשאת אדמין.' },
      { status: 403 }
    );
  }

  if (!candidateIdToDelete) {
    console.warn(`[${timestamp}] Bad Request: candidateId is missing for delete operation. PerformingUserID: ${performingUserId}`);
    return NextResponse.json(
        { success: false, error: 'מזהה מועמד (candidateId) חסר.' },
        { status: 400 }
    );
  }

  if (candidateIdToDelete === performingUserId) {
    console.warn(`[${timestamp}] Forbidden: Admin attempting to delete their own account via candidate deletion endpoint. PerformingUserID: ${performingUserId}`);
    return NextResponse.json(
        { success: false, error: 'מנהל אינו יכול למחוק את חשבונו האישי דרך ממשק זה. השתמש בהגדרות חשבון אישיות.' },
        { status: 403 }
    );
  }

  try {
    const candidate = await prisma.user.findUnique({
      where: { id: candidateIdToDelete },
    });

    if (!candidate) {
      console.warn(`[${timestamp}] Candidate with ID ${candidateIdToDelete} not found for deletion. PerformingUserID: ${performingUserId}`);
      return NextResponse.json(
        { success: false, error: 'המועמד המבוקש למחיקה לא נמצא.' },
        { status: 404 }
      );
    }
    
    // בדוק אם המועמד הוא אדמין אחר - אולי תרצה למנוע מחיקה כזו
    if (candidate.role === UserRole.ADMIN) {
        console.warn(`[${timestamp}] Attempt to delete another admin account by admin. CandidateID: ${candidateIdToDelete}, PerformingUserID: ${performingUserId}`);
        // אתה יכול להחליט אם לאפשר זאת או לא. לדוגמה:
        // return NextResponse.json(
        //   { success: false, error: 'לא ניתן למחוק חשבון אדמין אחר דרך ממשק זה.' },
        //   { status: 403 }
        // );
    }


    // חשוב: מחיקת משתמש עם onDelete: Cascade בסכמה תמחק את כל הרשומות המקושרות.
    // אם יש רשומות שלא מוגדר להן onDelete: Cascade, תצטרך למחוק אותן ידנית כאן, בתוך טרנזקציה.
    // לדוגמה, אם verifiedBy ב-Profile הוא SetNull, לא ימחק את הפרופיל, רק יאפס את השדה.
    // הסכמה שלך נראית די טוב עם onDelete: Cascade ברוב המקומות הרלוונטיים למשתמש.
    
    // ודא שאתה מבין את ההשלכות של מחיקת משתמש על כל הנתונים המקושרים.
    // המודלים UserImage, Profile, Account, Session, Verification, QuestionnaireResponse, וכו'
    // ימחקו אוטומטית אם onDelete: Cascade מוגדר כראוי ביחסים ל-User.

    await prisma.user.delete({
      where: { id: candidateIdToDelete },
    });

    console.log(`[${timestamp}] Candidate ${candidateIdToDelete} (Role: ${candidate.role}) deleted successfully by admin ${performingUserId}`);
    return NextResponse.json(
      { success: true, message: 'המועמד נמחק בהצלחה.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error(`[${timestamp}] Candidate deletion failed. CandidateID: ${candidateIdToDelete}, PerformingUserID: ${performingUserId}, Error:`, error);
    
    // כאן השימוש הנכון ב-Prisma.PrismaClientKnownRequestError
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to delete not found.
            console.warn(`[${timestamp}] Attempted to delete non-existent candidate (Prisma P2025): ${candidateIdToDelete}. PerformingUserID: ${performingUserId}`);
            return NextResponse.json(
                { success: false, error: 'המועמד המבוקש למחיקה לא נמצא (שגיאת Prisma).'},
                { status: 404 }
            );
        }
        // ניתן להוסיף טיפול בקודים נוספים של Prisma אם רלוונטי
        console.error(`[${timestamp}] Prisma Known Error during candidate deletion: ${error.code}, Meta: ${JSON.stringify(error.meta)}. PerformingUserID: ${performingUserId}`);
        return NextResponse.json(
            { success: false, error: `שגיאת מסד נתונים במחיקת המועמד (קוד: ${error.code}).`},
            { status: 500 }
        );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        console.error(`[${timestamp}] Prisma Validation Error during candidate deletion: ${error.message}. PerformingUserID: ${performingUserId}`);
        return NextResponse.json(
            { success: false, error: `שגיאת ולידציה במחיקת המועמד: ${error.message}`},
            { status: 400 } // Bad Request
        );
    }


    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return NextResponse.json(
      {
        success: false,
        error: 'אירעה שגיאה במחיקת המועמד. נסה שוב מאוחר יותר.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  } 
  // finally { // לא חובה עם prisma client מודרני ב-Next.js
  //   await prisma.$disconnect();
  // }
}