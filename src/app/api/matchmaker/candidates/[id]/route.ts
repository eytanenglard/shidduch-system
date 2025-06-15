import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client"; // הוספתי Prisma עבור סוגי שגיאות
import { updateUserAiProfile } from '@/lib/services/profileAiService'; // <--- 1. ייבוא

// פונקציית GET הקיימת שלך
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

    // Verify that the user is a matchmaker or admin
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
        role: true, // Added to fetch candidate's role
        profile: true,
        images: {
          orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }] // Main image first
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
      user: { // Include user basic details
        id: candidateData.id,
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        isVerified: candidateData.isVerified,
        role: candidateData.role, // Include role in user object
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

// פונקציית PATCH הקיימת שלך
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

    // Only Matchmakers or Admins can edit
    if (!performingUser || (performingUser.role !== UserRole.MATCHMAKER && performingUser.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    
    const { id: candidateIdToUpdate } = params; // ID of the candidate to update

    const candidateExists = await prisma.user.findUnique({
      where: { id: candidateIdToUpdate },
      select: { id: true, role: true } // Fetch role to prevent non-admins from editing admins
    });

    if (!candidateExists) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Prevent non-admin matchmakers from editing admin profiles (if desired)
    if (candidateExists.role === UserRole.ADMIN && performingUser.role !== UserRole.ADMIN) {
        return NextResponse.json(
            { success: false, error: "Unauthorized - Admins can only be edited by other Admins." },
            { status: 403 }
        );
    }


    const profileData = await req.json();

    // Ensure numeric fields are numbers or null
    const numericFields = ['height', 'siblings', 'position', 'preferredAgeMin', 'preferredAgeMax', 'preferredHeightMin', 'preferredHeightMax', 'aliyaYear'];
    numericFields.forEach(field => {
        if (profileData[field] === "" || profileData[field] === undefined) {
            profileData[field] = null;
        } else if (profileData[field] !== null) {
            profileData[field] = parseInt(profileData[field], 10);
            if (isNaN(profileData[field])) {
                // Or throw an error if invalid number is critical
                console.warn(`Invalid number for ${field}: ${profileData[field]}, setting to null`);
                profileData[field] = null;
            }
        }
    });
    
    // Ensure enum fields are valid enum values or null
    const enumFields = ['gender', 'preferredMatchmakerGender', 'maritalStatus', 'serviceType', 'headCovering', 'kippahType', 'contactPreference', 'preferredShomerNegiah', 'preferredPartnerHasChildren', 'preferredAliyaStatus', 'availabilityStatus'];
    enumFields.forEach(field => {
        if (profileData[field] === "" || profileData[field] === undefined) {
            profileData[field] = null;
        }
        // Add specific enum validation here if needed, though Prisma handles this on write
    });

    // Ensure boolean fields are booleans or null
    const booleanFields = ['shomerNegiah', 'hasChildrenFromPrevious', 'preferredHasChildrenFromPrevious', 'isProfileVisible'];
    booleanFields.forEach(field => {
        if (profileData[field] === undefined) {
            profileData[field] = null; // Or a default boolean if appropriate
        } else if (typeof profileData[field] !== 'boolean' && profileData[field] !== null) {
             // Attempt to convert common string representations
            if (profileData[field] === 'true') profileData[field] = true;
            else if (profileData[field] === 'false') profileData[field] = false;
            else profileData[field] = null; // Default to null if not clearly boolean
        }
    });

    // Ensure array fields are arrays
    const arrayFields = ['additionalLanguages', 'profileCharacterTraits', 'profileHobbies', 'preferredReligiousLevels', 'preferredLocations', 'preferredEducation', 'preferredOccupations', 'preferredMaritalStatuses', 'preferredOrigins', 'preferredServiceTypes', 'preferredHeadCoverings', 'preferredKippahTypes', 'preferredCharacterTraits', 'preferredHobbies'];
    arrayFields.forEach(field => {
        if (profileData[field] === undefined || profileData[field] === null) {
            profileData[field] = []; // Default to empty array
        } else if (!Array.isArray(profileData[field])) {
            console.warn(`Field ${field} is not an array, attempting to convert or defaulting to empty.`);
            // Basic attempt to convert comma-separated string or single value to array
            if (typeof profileData[field] === 'string' && profileData[field].includes(',')) {
                profileData[field] = profileData[field].split(',').map((s: string) => s.trim());
            } else if (typeof profileData[field] === 'string' && profileData[field].trim() !== '') {
                 profileData[field] = [profileData[field].trim()];
            } else {
                profileData[field] = [];
            }
        }
    });
    
    // Separate data for User model and Profile model if needed,
    // but current PATCH seems to only update Profile.

    const updatedProfile = await prisma.profile.update({
      where: { userId: candidateIdToUpdate },
      data: {
        ...profileData,
        updatedAt: new Date(), // Explicitly set updatedAt
        lastActive: new Date() // Also update lastActive
      }
    });
  // --- START OF NEW CODE ---
    // 2. הפעלת עדכון פרופיל ה-AI ברקע עבור המועמד שעודכן
    updateUserAiProfile(candidateIdToUpdate).catch(err => {
        console.error(`[AI Profile Trigger - Matchmaker Update] Failed to update AI profile in the background for candidate ${candidateIdToUpdate}:`, err);
    });
    // --- END OF NEW CODE ---
    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error("Error updating candidate profile:", error);
    let errorMessage = "Failed to update candidate profile";
    let statusCode = 500;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (error.code === 'P2002') { // Unique constraint failed
            errorMessage = `שגיאה: נראה שאחד השדות שהזנת (כמו מייל או טלפון אם רלוונטי לפרופיל) כבר קיים במערכת עבור משתמש אחר. (${error.meta?.target})`;
            statusCode = 409; // Conflict
        } else if (error.code === 'P2025') { // Record to update not found
            errorMessage = "הפרופיל או המועמד המבוקש לעדכון לא נמצא.";
            statusCode = 404;
        } else {
            errorMessage = `שגיאת מסד נתונים (קוד ${error.code}).`;
        }
        console.error("Prisma Known Error on PATCH:", error.code, error.message, error.meta);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        errorMessage = `שגיאת ולידציה בעדכון הפרופיל: ${error.message}`;
        statusCode = 400; // Bad Request
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

// פונקציית DELETE החדשה
export async function DELETE(
  req: NextRequest, // NextRequest is fine here, not used for body
  { params }: { params: { id: string } }
) {
  const candidateIdToDelete = params.id; // Changed from params.candidateId to params.id to match your GET/PATCH
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

  // Only ADMINs can delete candidates
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

  // Prevent admin from deleting themselves via this endpoint
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
      select: { id: true, role: true, email: true } // Select role to log and potentially prevent deleting other admins
    });

    if (!candidateToDelete) {
      console.warn(`[${timestamp}] Candidate with ID ${candidateIdToDelete} not found for deletion. Requested by Admin: ${performingUserId}`);
      return NextResponse.json(
        { success: false, error: 'המועמד המבוקש למחיקה לא נמצא.' },
        { status: 404 }
      );
    }

    // Optional: Prevent an admin from deleting another admin (unless explicitly allowed)
    // if (candidateToDelete.role === UserRole.ADMIN) {
    //   console.warn(`[${timestamp}] Admin ${performingUserId} attempting to delete another Admin ${candidateToDelete.id} (${candidateToDelete.email}). This might be restricted.`);
    //   return NextResponse.json(
    //     { success: false, error: 'לא ניתן למחוק חשבון אדמין אחר דרך ממשק זה כרגע.' },
    //     { status: 403 }
    //   );
    // }

    // onDelete: Cascade in your schema should handle related data (Profile, Images, Accounts, etc.)
    // Verify this carefully for all related models.
    await prisma.user.delete({
      where: { id: candidateIdToDelete },
    });

    console.log(`[${timestamp}] Candidate ${candidateIdToDelete} (Email: ${candidateToDelete.email}, Role: ${candidateToDelete.role}) deleted successfully by admin ${performingUserId}`);
    return NextResponse.json(
      { success: true, message: 'המועמד נמחק בהצלחה.' },
      { status: 200 } // OK
    );

  } catch (error: unknown) {
    console.error(`[${timestamp}] Candidate deletion failed for ID ${candidateIdToDelete}. Requested by Admin: ${performingUserId}. Error:`, error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to delete not found.
            console.warn(`[${timestamp}] Prisma P2025 Error on DELETE: Attempted to delete non-existent candidate ${candidateIdToDelete}. Requested by Admin: ${performingUserId}`);
            return NextResponse.json(
                { success: false, error: 'המועמד המבוקש למחיקה לא נמצא (שגיאת Prisma).'},
                { status: 404 }
            );
        }
        // Log other Prisma known errors
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