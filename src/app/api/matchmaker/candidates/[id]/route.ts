// src/app/api/matchmaker/candidates/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { updateUserAiProfile, generateNarrativeProfile } from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';
import { Locale } from "../../../../../../i18n-config";
import { emailService } from "@/lib/email/emailService";

export const dynamic = 'force-dynamic';

/**
 * GET: אחזור פרופיל של מועמד ספציפי.
 * נגיש לשדכנים ומנהלים.
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
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

    const params = await props.params;
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
        profile: {
          include: {
            testimonials: true
          }
        },
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
 * מבצע עדכון ב-DB ומיד לאחר מכן מפעיל תהליך רקע לעדכון הווקטור וסיכום ה-AI.
 */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') as Locale) || 'he';

    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, firstName: true, lastName: true }
    });

    if (!performingUser || (performingUser.role !== UserRole.MATCHMAKER && performingUser.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    
    const params = await props.params;
    const { id: candidateIdToUpdate } = params;

    const candidateToUpdate = await prisma.user.findUnique({
      where: { id: candidateIdToUpdate },
      select: { id: true, role: true, email: true, firstName: true, lastName: true }
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

    // --- חילוץ שדות User (שם פרטי/משפחה) ---
    const { firstName, lastName, ...profileDataRaw } = incomingData;

    // עדכון טבלת User אם נשלחו שמות
    if (firstName || lastName) {
      await prisma.user.update({
        where: { id: candidateIdToUpdate },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
      });
    }

    // הכנת נתונים לעדכון טבלת Profile
    const originalProfile = await prisma.profile.findUnique({
        where: { userId: candidateIdToUpdate },
        select: { manualEntryText: true }
    });
    
    const dataForUpdate: Prisma.ProfileUpdateInput = {};

    const numericFields = ['height', 'siblings', 'position', 'preferredAgeMin', 'preferredAgeMax', 'preferredHeightMin', 'preferredHeightMax', 'aliyaYear'];
    const stringAndEnumFields = ['gender', 'preferredMatchmakerGender', 'maritalStatus', 'serviceType', 'headCovering', 'kippahType', 'contactPreference', 'preferredShomerNegiah', 'preferredPartnerHasChildren', 'preferredAliyaStatus', 'availabilityStatus', 'religiousJourney', 'medicalInfoDetails', 'medicalInfoDisclosureTiming', 'fatherOccupation', 'motherOccupation', 'manualEntryText', 'about', 'profileHeadline', 'city', 'occupation', 'education', 'educationLevel', 'origin', 'religiousLevel', 'referredBy', 'availabilityNote', 'nativeLanguage', 'serviceDetails', 'aliyaCountry', 'parentStatus', 'matchingNotes', 'internalMatchmakerNotes', 'smokingStatus', 'preferredSmokingStatus'];
    const booleanFields = ['shomerNegiah', 'hasChildrenFromPrevious',  'isProfileVisible', 'hasMedicalInfo', 'isMedicalInfoVisible', 'birthDateIsApproximate'];
    const arrayFields = ['additionalLanguages', 'profileCharacterTraits', 'profileHobbies', 'preferredReligiousLevels', 'preferredLocations', 'preferredEducation', 'preferredOccupations', 'preferredMaritalStatuses', 'preferredOrigins', 'preferredServiceTypes', 'preferredHeadCoverings', 'preferredKippahTypes', 'preferredCharacterTraits', 'preferredHobbies', 'preferredReligiousJourneys'];
    const dateFields = ['birthDate'];

    for (const key in profileDataRaw) {
      if (Object.prototype.hasOwnProperty.call(profileDataRaw, key)) {
        const value = profileDataRaw[key];

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
    
    let updatedProfile: any = null;

    // ביצוע עדכון פרופיל
    if (Object.keys(dataForUpdate).length > 0) {
        updatedProfile = await prisma.profile.update({
          where: { userId: candidateIdToUpdate },
          data: {
            ...dataForUpdate,
            updatedAt: new Date(),
            lastActive: new Date(),
            needsAiProfileUpdate: true, // מסמנים זמנית שצריך עדכון, עד שתהליך הרקע יסתיים
                     contentUpdatedAt: new Date(),

          }
        });

        // בדיקה אם השתנה ה-manualEntryText לשליחת התראה
        const newSummaryText = incomingData.manualEntryText;
        const oldSummaryText = originalProfile?.manualEntryText;

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
                console.error(`[Email Notification] Failed to send profile summary update email`, emailError);
            }
        }

        // =================================================================================
        // 🔥 עדכון רקע (Background Process) - ווקטור + סיכום AI 🔥
        // =================================================================================
        // אנחנו מריצים את הפונקציה הזו ללא await כדי לא לעכב את התשובה ללקוח
        (async () => {
            try {
                console.log(`[Background Update] Starting full AI update for user ${candidateIdToUpdate}...`);
                
                // 1. עדכון ווקטור (עבור מנוע החיפוש)
                await updateUserAiProfile(candidateIdToUpdate);
                console.log(`[Background Update] Vector updated successfully.`);

                // 2. עדכון סיכום פרופיל (AI Summary)
                // שלב א': יצירת הנרטיב המילולי המעודכן
                const narrative = await generateNarrativeProfile(candidateIdToUpdate);
                
                if (narrative) {
                    // שלב ב': שליחה ל-AI ליצירת הסיכום
                    const summary = await aiService.generateProfileSummary(narrative);
                    
                    if (summary) {
                        // שלב ג': שמירה ב-DB וכיבוי הדגל
                        await prisma.profile.update({
                            where: { userId: candidateIdToUpdate },
                            data: { 
                                aiProfileSummary: summary as any, // המרה לפורמט JSON של פריזמה
                                needsAiProfileUpdate: false 
                            }
                        });
                        console.log(`[Background Update] AI Summary updated and saved successfully.`);
                    } else {
                        console.warn(`[Background Update] AI returned null summary.`);
                    }
                } else {
                    console.warn(`[Background Update] Failed to generate narrative.`);
                }
            } catch (err) {
                console.error(`[Background Update] Failed for candidate ${candidateIdToUpdate}:`, err);
            }
        })();
        // =================================================================================
    }

    // אם לא עודכן פרופיל (למשל רק שם משתמש), נשלוף את הקיים
    if (!updatedProfile) {
        updatedProfile = await prisma.profile.findUnique({ where: { userId: candidateIdToUpdate } });
    }

    return NextResponse.json({
        success: true,
        profile: updatedProfile,
        user: {
            firstName: firstName || candidateToUpdate.firstName,
            lastName: lastName || candidateToUpdate.lastName
        }
    });

  } catch (error) {
    console.error("Error updating candidate profile:", error);
    
    let errorMessage = "Failed to update candidate profile";
    let statusCode = 500;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            errorMessage = `שגיאה: נראה שאחד השדות שהזנת (כמו מייל או טלפון) כבר קיים במערכת.`;
            statusCode = 409;
        } else if (error.code === 'P2025') {
            errorMessage = "הפרופיל לא נמצא.";
            statusCode = 404;
        } else {
            errorMessage = `שגיאת מסד נתונים (קוד ${error.code}).`;
        }
        console.error("Prisma Known Error on PATCH:", error.code, error.message);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        errorMessage = `שגיאת ולידציה בנתונים.`;
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
  props: { params: Promise<{ id: string }> }
) {
  const timestamp = new Date().toISOString();
  
  const params = await props.params;
  const candidateIdToDelete = params.id;
  
  console.log(`[${timestamp}] DELETE request for candidate ID: ${candidateIdToDelete}`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !session.user.role) {
    console.warn(`[${timestamp}] Unauthorized DELETE attempt: No active session or role.`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. לא זוהתה סשן פעיל או הרשאה.' },
      { status: 401 }
    );
  }

  const performingUserId = session.user.id;
  const performingUserRole = session.user.role as UserRole; 

  if (performingUserRole !== UserRole.ADMIN) {
    console.warn(`[${timestamp}] Forbidden DELETE attempt: User ${performingUserId} is not ADMIN.`);
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. נדרשת הרשאת אדמין.' },
      { status: 403 }
    );
  }

  if (!candidateIdToDelete) {
    return NextResponse.json(
        { success: false, error: 'מזהה מועמד (candidateId) חסר.' },
        { status: 400 }
    );
  }

  if (candidateIdToDelete === performingUserId) {
    return NextResponse.json(
        { success: false, error: 'מנהל אינו יכול למחוק את חשבונו האישי דרך ממשק זה.' },
        { status: 403 }
    );
  }

  try {
    const candidateToDelete = await prisma.user.findUnique({
      where: { id: candidateIdToDelete },
      select: { id: true, role: true, email: true }
    });

    if (!candidateToDelete) {
      return NextResponse.json(
        { success: false, error: 'המועמד המבוקש למחיקה לא נמצא.' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: candidateIdToDelete },
    });

    console.log(`[${timestamp}] Candidate ${candidateIdToDelete} deleted successfully by admin ${performingUserId}`);
    return NextResponse.json(
      { success: true, message: 'המועמד נמחק בהצלחה.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error(`[${timestamp}] Candidate deletion failed. Error:`, error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'המועמד המבוקש למחיקה לא נמצא.'},
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: `שגיאת מסד נתונים במחיקת המועמד (קוד: ${error.code}).`},
            { status: 500 }
        );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
            { success: false, error: `שגיאת ולידציה במחיקת המועמד.`},
            { status: 400 }
        );
    }

    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה.';
    return NextResponse.json(
      {
        success: false,
        error: 'אירעה שגיאה במחיקת המועמד.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}