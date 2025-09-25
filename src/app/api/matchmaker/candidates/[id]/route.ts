import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService';
import { Locale } from "../../../../../../i18n-config";
import { emailService } from "@/lib/email/emailService";

export const dynamic = 'force-dynamic';

/**
 * GET: אחזור פרופיל של מועמד ספציפי.
 * נגיש לשדכנים ומנהלים.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!performingUser || (performingUser.role !== UserRole.MATCHMAKER && performingUser.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;

    const candidateData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isVerified: true,
        role: true,
        profile: true,
        images: {
          orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }]
        }
      }
    });

    if (!candidateData) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: candidateData.profile,
      user: {
        id: candidateData.id,
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        isVerified: candidateData.isVerified,
        role: candidateData.role,
      },
      images: candidateData.images
    });
  } catch (error) {
    console.error("Error fetching candidate profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidate profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: עדכון פרטי פרופיל של מועמד.
 * נגיש לשדכנים ומנהלים. מעבד רק את השדות שנשלחו בבקשה.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // קבלת שפה (locale) מפרמטר ב-URL לצורך שליחת מייל מתורגם
    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') as Locale) || 'he';

    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
select: { role: true, firstName: true, lastName: true } // נשלוף את השם הפרטי ושם המשפחה
    });

    if (!performingUser || (performingUser.role !== UserRole.MATCHMAKER && performingUser.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    
    const { id: candidateIdToUpdate } = params;

    const candidateToUpdate = await prisma.user.findUnique({
      where: { id: candidateIdToUpdate },
      select: { id: true, role: true, email: true, firstName: true } // נשלוף פרטים הנדרשים למייל
    });

    if (!candidateToUpdate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    if (candidateToUpdate.role === UserRole.ADMIN && performingUser.role !== UserRole.ADMIN) {
        return NextResponse.json(
            { success: false, error: "Unauthorized - Admins can only be edited by other Admins." },
            { status: 403 }
        );
    }

    const incomingData = await req.json();

    // שלב מקדים: נשלוף את הפרופיל המקורי כדי שנוכל להשוות את 'דבר המערכת'
    const originalProfile = await prisma.profile.findUnique({
        where: { userId: candidateIdToUpdate },
        select: { manualEntryText: true }
    });
    
    const dataForUpdate: Prisma.ProfileUpdateInput = {};

    // הגדרת סוגי השדות לצורך טיפול נכון בערכים
    const numericFields = ['height', 'siblings', 'position', 'preferredAgeMin', 'preferredAgeMax', 'preferredHeightMin', 'preferredHeightMax', 'aliyaYear'];
    const stringAndEnumFields = ['gender', 'preferredMatchmakerGender', 'maritalStatus', 'serviceType', 'headCovering', 'kippahType', 'contactPreference', 'preferredShomerNegiah', 'preferredPartnerHasChildren', 'preferredAliyaStatus', 'availabilityStatus' , 'religiousJourney', 'medicalInfoDetails', 'medicalInfoDisclosureTiming', 'fatherOccupation', 'motherOccupation', 'manualEntryText', 'about', 'profileHeadline'];
    const booleanFields = ['shomerNegiah', 'hasChildrenFromPrevious', 'preferredHasChildrenFromPrevious', 'isProfileVisible', 'hasMedicalInfo', 'isMedicalInfoVisible', 'birthDateIsApproximate'];
    const arrayFields = ['additionalLanguages', 'profileCharacterTraits', 'profileHobbies', 'preferredReligiousLevels', 'preferredLocations', 'preferredEducation', 'preferredOccupations', 'preferredMaritalStatuses', 'preferredOrigins', 'preferredServiceTypes', 'preferredHeadCoverings', 'preferredKippahTypes', 'preferredCharacterTraits', 'preferredHobbies', 'preferredReligiousJourneys'];
    const dateFields = ['birthDate'];

    // מעבר על כל השדות שהתקבלו בבקשה
    for (const key in incomingData) {
      if (Object.prototype.hasOwnProperty.call(incomingData, key)) {
        let value = incomingData[key];

        if (numericFields.includes(key)) {
            if (value === "" || value === undefined || value === null) {
                dataForUpdate[key] = null;
            } else {
                const parsed = parseInt(String(value), 10);
                dataForUpdate[key] = isNaN(parsed) ? null : parsed;
            }
        } else if (stringAndEnumFields.includes(key)) {
            dataForUpdate[key] = (value === "" || value === undefined) ? null : value;
        } else if (booleanFields.includes(key)) {
            if (value === undefined || value === null) {
                dataForUpdate[key] = null;
            } else if (typeof value === 'boolean') {
                dataForUpdate[key] = value;
            } else {
                dataForUpdate[key] = value === 'true';
            }
        } else if (arrayFields.includes(key)) {
            if (value === undefined || value === null) {
                dataForUpdate[key] = [];
            } else if (Array.isArray(value)) {
                dataForUpdate[key] = value;
            }
        } else if (dateFields.includes(key)) {
            if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    dataForUpdate[key] = date;
                }
            } else {
                dataForUpdate[key] = null;
            }
        }
      }
    }
    
    // בצע את העדכון רק אם יש נתונים לעדכן
    if (Object.keys(dataForUpdate).length > 0) {
        const updatedProfile = await prisma.profile.update({
          where: { userId: candidateIdToUpdate },
          data: {
            ...dataForUpdate,
            updatedAt: new Date(),
            lastActive: new Date(),
            needsAiProfileUpdate: true, // נסמן תמיד לעדכון AI לאחר שינוי ידני
          }
        });

        // --- לוגיקת שליחת המייל ---
        const newSummaryText = incomingData.manualEntryText;
        const oldSummaryText = originalProfile?.manualEntryText;

        // שלח מייל רק אם השדה 'manualEntryText' נשלח בבקשת העדכון,
        // הוא לא ריק, והתוכן שלו השתנה מהערך הקודם.
        if (newSummaryText !== undefined && newSummaryText.trim() !== '' && newSummaryText !== oldSummaryText) {
            try {
                await emailService.sendProfileSummaryUpdateEmail({
                    locale,
                    email: candidateToUpdate.email,
                    firstName: candidateToUpdate.firstName,
                    matchmakerName: session.user.name || "השדכן/ית שלך"
                });
                console.log(`[Email Notification] Profile summary update email sent successfully to ${candidateToUpdate.email}.`);
            } catch (emailError) {
                // חשוב: לא נכשיל את כל הבקשה אם שליחת המייל נכשלה.
                // נתעד את השגיאה ונמשיך בזרימה התקינה של עדכון הפרופיל.
                console.error(`[Email Notification] Failed to send profile summary update email to ${candidateToUpdate.email}:`, emailError);
            }
        }
        // --- סוף לוגיקת שליחת המייל ---

        // הפעלת עדכון פרופיל AI ברקע
        updateUserAiProfile(candidateIdToUpdate).catch(err => {
            console.error(`[AI Profile Trigger - Matchmaker Update] Failed to update AI profile in the background for candidate ${candidateIdToUpdate}:`, err);
        });

        return NextResponse.json({
          success: true,
          profile: updatedProfile
        });
    }

    // אם לא נשלחו נתונים רלוונטיים לעדכון, החזר את הפרופיל הקיים ללא שינוי
    const currentProfile = await prisma.profile.findUnique({ where: { userId: candidateIdToUpdate } });
    return NextResponse.json({ success: true, profile: currentProfile, message: "No data provided for update." });

  } catch (error) {
    console.error("Error updating candidate profile:", error);
    let errorMessage = "Failed to update candidate profile";
    let statusCode = 500;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            errorMessage = `שגיאה: נראה שאחד השדות שהזנת (כמו מייל או טלפון אם רלוונטי לפרופיל) כבר קיים במערכת עבור משתמש אחר. (${error.meta?.target})`;
            statusCode = 409;
        } else if (error.code === 'P2025') {
            errorMessage = "הפרופיל או המועמד המבוקש לעדכון לא נמצא.";
            statusCode = 404;
        } else {
            errorMessage = `שגיאת מסד נתונים (קוד ${error.code}).`;
        }
        console.error("Prisma Known Error on PATCH:", error.code, error.message, error.meta);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        const relevantError = error.message.split('\n').pop() || error.message;
        errorMessage = `שגיאת ולידציה בעדכון הפרופיל: ${relevantError}`;
        statusCode = 400;
        console.error("Prisma Validation Error on PATCH:", error.message);
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage, details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined },
      { status: statusCode }
    );
  }
}


/**
 * DELETE: מחיקת מועמד.
 * נגיש למנהלים בלבד.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const candidateIdToDelete = params.id;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] DELETE request for candidate ID: ${candidateIdToDelete}`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !session.user.role) {
    console.warn(`[${timestamp}] Unauthorized DELETE attempt: No active session or role. PerformingUserID: ${session?.user?.id}`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. לא זוהתה סשן פעיל או הרשאה.' },
      { status: 401 }
    );
  }

  const performingUserId = session.user.id;
  const performingUserRole = session.user.role as UserRole; 

  if (performingUserRole !== UserRole.ADMIN) {
    console.warn(`[${timestamp}] Forbidden DELETE attempt: User ${performingUserId} (Role: ${performingUserRole}) is not ADMIN.`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. נדרשת הרשאת אדמין.' },
      { status: 403 }
    );
  }

  if (!candidateIdToDelete) {
    console.warn(`[${timestamp}] Bad Request DELETE: candidateId is missing. PerformingUserID: ${performingUserId}`);
    return NextResponse.json(
        { success: false, error: 'מזהה מועמד (candidateId) חסר.' },
        { status: 400 }
    );
  }

  if (candidateIdToDelete === performingUserId) {
    console.warn(`[${timestamp}] Forbidden DELETE: Admin ${performingUserId} attempting to delete their own account via candidate deletion endpoint.`);
    return NextResponse.json(
        { success: false, error: 'מנהל אינו יכול למחוק את חשבונו האישי דרך ממשק זה. השתמש בהגדרות חשבון אישיות.' },
        { status: 403 }
    );
  }

  try {
    const candidateToDelete = await prisma.user.findUnique({
      where: { id: candidateIdToDelete },
      select: { id: true, role: true, email: true }
    });

    if (!candidateToDelete) {
      console.warn(`[${timestamp}] Candidate with ID ${candidateIdToDelete} not found for deletion. Requested by Admin: ${performingUserId}`);
      return NextResponse.json(
        { success: false, error: 'המועמד המבוקש למחיקה לא נמצא.' },
        { status: 404 }
      );
    }

    // הפעולה 'onDelete: Cascade' בסכמת Prisma תדאג למחיקת כל הנתונים המקושרים (פרופיל, תמונות וכו')
    await prisma.user.delete({
      where: { id: candidateIdToDelete },
    });

    console.log(`[${timestamp}] Candidate ${candidateIdToDelete} (Email: ${candidateToDelete.email}, Role: ${candidateToDelete.role}) deleted successfully by admin ${performingUserId}`);
    return NextResponse.json(
      { success: true, message: 'המועמד נמחק בהצלחה.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error(`[${timestamp}] Candidate deletion failed for ID ${candidateIdToDelete}. Requested by Admin: ${performingUserId}. Error:`, error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            console.warn(`[${timestamp}] Prisma P2025 Error on DELETE: Attempted to delete non-existent candidate ${candidateIdToDelete}. Requested by Admin: ${performingUserId}`);
            return NextResponse.json(
                { success: false, error: 'המועמד המבוקש למחיקה לא נמצא (שגיאת Prisma).'},
                { status: 404 }
            );
        }
        console.error(`[${timestamp}] Prisma Known Error during DELETE for candidate ${candidateIdToDelete}: Code ${error.code}, Meta: ${JSON.stringify(error.meta)}. Requested by Admin: ${performingUserId}`);
        return NextResponse.json(
            { success: false, error: `שגיאת מסד נתונים במחיקת המועמד (קוד: ${error.code}).`},
            { status: 500 }
        );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        console.error(`[${timestamp}] Prisma Validation Error during DELETE for candidate ${candidateIdToDelete}: ${error.message}. Requested by Admin: ${performingUserId}`);
        return NextResponse.json(
            { success: false, error: `שגיאת ולידציה במחיקת המועמד: ${error.message}`},
            { status: 400 }
        );
    }

    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה בעת מחיקת המועמד.';
    return NextResponse.json(
      {
        success: false,
        error: 'אירעה שגיאה במחיקת המועמד. נסה שוב מאוחר יותר.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}