import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService';
export const dynamic = 'force-dynamic';

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
    
    const { id: candidateIdToUpdate } = params;

    const candidateExists = await prisma.user.findUnique({
      where: { id: candidateIdToUpdate },
      select: { id: true, role: true }
    });

    if (!candidateExists) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    if (candidateExists.role === UserRole.ADMIN && performingUser.role !== UserRole.ADMIN) {
        return NextResponse.json(
            { success: false, error: "Unauthorized - Admins can only be edited by other Admins." },
            { status: 403 }
        );
    }

    const profileData = await req.json();

    const numericFields = ['height', 'siblings', 'position', 'preferredAgeMin', 'preferredAgeMax', 'preferredHeightMin', 'preferredHeightMax', 'aliyaYear'];
    numericFields.forEach(field => {
        if (profileData[field] === "" || profileData[field] === undefined) {
            profileData[field] = null;
        } else if (profileData[field] !== null) {
            profileData[field] = parseInt(profileData[field], 10);
            if (isNaN(profileData[field])) {
                console.warn(`Invalid number for ${field}: ${profileData[field]}, setting to null`);
                profileData[field] = null;
            }
        }
    });
    
    // --- START: הוספת שדות מקצוע הורים לרשימת העיבוד ---
    const stringAndEnumFields = ['gender', 'preferredMatchmakerGender', 'maritalStatus', 'serviceType', 'headCovering', 'kippahType', 'contactPreference', 'preferredShomerNegiah', 'preferredPartnerHasChildren', 'preferredAliyaStatus', 'availabilityStatus' , 'religiousJourney', 'medicalInfoDetails', 'medicalInfoDisclosureTiming', 'fatherOccupation', 'motherOccupation'];
    // --- END: הוספת שדות מקצוע הורים לרשימת העיבוד ---
    stringAndEnumFields.forEach(field => {
        if (profileData[field] === "" || profileData[field] === undefined) {
            profileData[field] = null;
        }
    });

    const booleanFields = ['shomerNegiah', 'hasChildrenFromPrevious', 'preferredHasChildrenFromPrevious', 'isProfileVisible', 'hasMedicalInfo', 'isMedicalInfoVisible'];
    booleanFields.forEach(field => {
        if (profileData[field] === undefined) {
            profileData[field] = null;
        } else if (typeof profileData[field] !== 'boolean' && profileData[field] !== null) {
            if (profileData[field] === 'true') profileData[field] = true;
            else if (profileData[field] === 'false') profileData[field] = false;
            else profileData[field] = null;
        }
    });

    const arrayFields = ['additionalLanguages', 'profileCharacterTraits', 'profileHobbies', 'preferredReligiousLevels', 'preferredLocations', 'preferredEducation', 'preferredOccupations', 'preferredMaritalStatuses', 'preferredOrigins', 'preferredServiceTypes', 'preferredHeadCoverings', 'preferredKippahTypes', 'preferredCharacterTraits', 'preferredHobbies', 'preferredReligiousJourneys'];
    arrayFields.forEach(field => {
        if (profileData[field] === undefined || profileData[field] === null) {
            profileData[field] = [];
        } else if (!Array.isArray(profileData[field])) {
            console.warn(`Field ${field} is not an array, attempting to convert or defaulting to empty.`);
            if (typeof profileData[field] === 'string' && profileData[field].includes(',')) {
                profileData[field] = profileData[field].split(',').map((s: string) => s.trim());
            } else if (typeof profileData[field] === 'string' && profileData[field].trim() !== '') {
                 profileData[field] = [profileData[field].trim()];
            } else {
                profileData[field] = [];
            }
        }
    });
    
    const updatedProfile = await prisma.profile.update({
      where: { userId: candidateIdToUpdate },
      data: {
        ...profileData,
        updatedAt: new Date(),
        lastActive: new Date()
      }
    });

    updateUserAiProfile(candidateIdToUpdate).catch(err => {
        console.error(`[AI Profile Trigger - Matchmaker Update] Failed to update AI profile in the background for candidate ${candidateIdToUpdate}:`, err);
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });
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
        errorMessage = `שגיאת ולידציה בעדכון הפרופיל: ${error.message}`;
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