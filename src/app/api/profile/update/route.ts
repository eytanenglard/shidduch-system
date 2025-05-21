// File: app/api/profile/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // ודא שהנתיב נכון
import prisma from "@/lib/prisma"; // ודא שהנתיב נכון
import {
  Prisma,
  Gender,
  ServiceType,
  HeadCoveringType,
  KippahType,
  AvailabilityStatus, // זה הטיפוס Enum
} from "@prisma/client";
import type { UserProfile } from "@/types/next-auth"; // ודא שהנתיב והטיפוס נכונים

// Helper to convert to number or null
const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Helper to convert to Date or null
const toDateOrNull = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

// Helper to convert empty string or null to null, otherwise return the string
const emptyStringToNull = (value: string | null | undefined): string | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
};

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Invalid JSON body:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      gender,
      birthDate, // שים לב: birthDate הוא חובה (DateTime) בסכמה שלך
      nativeLanguage,
      additionalLanguages,
      height,
      maritalStatus,
      occupation,
      education,
      educationLevel,
      city,
      origin,
      religiousLevel,
      about,
      parentStatus,
      siblings,
      position,
      isProfileVisible,
      preferredMatchmakerGender,
      availabilityStatus,
      availabilityNote,
      availabilityUpdatedAt,
      matchingNotes,
      shomerNegiah,
      serviceType,
      serviceDetails,
      headCovering,
      kippahType,
      hasChildrenFromPrevious,
      profileCharacterTraits,
      profileHobbies,
      aliyaCountry,
      aliyaYear,
      preferredAgeMin,
      preferredAgeMax,
      preferredHeightMin,
      preferredHeightMax,
      preferredReligiousLevels,
      preferredLocations,
      preferredEducation,
      preferredOccupations,
      contactPreference,
    } = body as Partial<UserProfile>;

    const dataToUpdate: Prisma.ProfileUpdateInput = {};

    // --- Personal & Demographic ---
    if (gender !== undefined) dataToUpdate.gender = gender as Gender;

    if (birthDate !== undefined) {
      const bdValue = toDateOrNull(birthDate);
      if (bdValue instanceof Date) { // `birthDate` הוא חובה בסכמה, אז נעדכן רק אם הערך תקין
        dataToUpdate.birthDate = bdValue;
      }
      // אם bdValue הוא null (קלט לא תקין), השדה לא יתעדכן. אפשר להוסיף החזרת שגיאה אם רוצים.
    }

    if (nativeLanguage !== undefined) dataToUpdate.nativeLanguage = emptyStringToNull(nativeLanguage);
    if (additionalLanguages !== undefined) dataToUpdate.additionalLanguages = additionalLanguages || [];
    if (height !== undefined) dataToUpdate.height = toNumberOrNull(height);
    if (city !== undefined) dataToUpdate.city = emptyStringToNull(city);
    if (origin !== undefined) dataToUpdate.origin = emptyStringToNull(origin);
    if (aliyaCountry !== undefined) dataToUpdate.aliyaCountry = emptyStringToNull(aliyaCountry);
    if (aliyaYear !== undefined) dataToUpdate.aliyaYear = toNumberOrNull(aliyaYear);

    // --- Marital Status & Background ---
    if (maritalStatus !== undefined) dataToUpdate.maritalStatus = emptyStringToNull(maritalStatus);
    if (hasChildrenFromPrevious !== undefined) dataToUpdate.hasChildrenFromPrevious = hasChildrenFromPrevious;
    if (parentStatus !== undefined) dataToUpdate.parentStatus = emptyStringToNull(parentStatus);
    if (siblings !== undefined) dataToUpdate.siblings = toNumberOrNull(siblings);
    if (position !== undefined) dataToUpdate.position = toNumberOrNull(position);

    // --- Education, Occupation & Service ---
    if (educationLevel !== undefined) dataToUpdate.educationLevel = emptyStringToNull(educationLevel);
    if (education !== undefined) dataToUpdate.education = emptyStringToNull(education);
    if (occupation !== undefined) dataToUpdate.occupation = emptyStringToNull(occupation);
    if (serviceType !== undefined) dataToUpdate.serviceType = emptyStringToNull(serviceType) as ServiceType | null;
    if (serviceDetails !== undefined) dataToUpdate.serviceDetails = emptyStringToNull(serviceDetails);

    // --- Religion & Lifestyle ---
    if (religiousLevel !== undefined) dataToUpdate.religiousLevel = emptyStringToNull(religiousLevel);
    if (shomerNegiah !== undefined) dataToUpdate.shomerNegiah = shomerNegiah;

    const currentGenderForLogic = gender !== undefined ? gender : (await prisma.profile.findUnique({ where: { userId }, select: { gender: true } }))?.gender;

    if (currentGenderForLogic === Gender.FEMALE) {
        if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
        if (gender !== undefined && gender === Gender.FEMALE) {
            dataToUpdate.kippahType = null;
        } else if (body.hasOwnProperty('kippahType') && kippahType === null) {
            dataToUpdate.kippahType = null;
        }
    } else if (currentGenderForLogic === Gender.MALE) {
        if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        if (gender !== undefined && gender === Gender.MALE) {
            dataToUpdate.headCovering = null;
        } else if (body.hasOwnProperty('headCovering') && headCovering === null) {
            dataToUpdate.headCovering = null;
        }
    } else {
        if (gender !== undefined && gender === null) {
           dataToUpdate.headCovering = null;
           dataToUpdate.kippahType = null;
        } else {
            if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
            if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        }
    }
    
    if (preferredMatchmakerGender !== undefined) dataToUpdate.preferredMatchmakerGender = emptyStringToNull(preferredMatchmakerGender) as Gender | null;

    // --- Traits & Hobbies ---
    if (profileCharacterTraits !== undefined) dataToUpdate.profileCharacterTraits = profileCharacterTraits || [];
    if (profileHobbies !== undefined) dataToUpdate.profileHobbies = profileHobbies || [];

    // --- About & Additional Info ---
    if (about !== undefined) dataToUpdate.about = emptyStringToNull(about);
    if (matchingNotes !== undefined) dataToUpdate.matchingNotes = emptyStringToNull(matchingNotes);
    
    // --- Preferences (related to matching) ---
    if (preferredAgeMin !== undefined) dataToUpdate.preferredAgeMin = toNumberOrNull(preferredAgeMin);
    if (preferredAgeMax !== undefined) dataToUpdate.preferredAgeMax = toNumberOrNull(preferredAgeMax);
    if (preferredHeightMin !== undefined) dataToUpdate.preferredHeightMin = toNumberOrNull(preferredHeightMin);
    if (preferredHeightMax !== undefined) dataToUpdate.preferredHeightMax = toNumberOrNull(preferredHeightMax);
    if (preferredReligiousLevels !== undefined) dataToUpdate.preferredReligiousLevels = preferredReligiousLevels || [];
    if (preferredLocations !== undefined) dataToUpdate.preferredLocations = preferredLocations || [];
    if (preferredEducation !== undefined) dataToUpdate.preferredEducation = preferredEducation || [];
    if (preferredOccupations !== undefined) dataToUpdate.preferredOccupations = preferredOccupations || [];
    if (contactPreference !== undefined) dataToUpdate.contactPreference = emptyStringToNull(contactPreference);
    
    // --- Profile Management ---
    if (isProfileVisible !== undefined) dataToUpdate.isProfileVisible = isProfileVisible;

    if (availabilityStatus !== undefined) {
      const statusValue = emptyStringToNull(availabilityStatus);
      if (statusValue === null) {
        // ברירת מחדל אם נשלח ריק או null
        dataToUpdate.availabilityStatus = "AVAILABLE" as AvailabilityStatus; // השתמש במחרוזת ישירות
      } else {
        // ודא שהערך הוא אחד מהערכים החוקיים של ה-enum (אופציונלי, לחיזוק הוולידציה)
        // const validStatuses: string[] = Object.values(AvailabilityStatus); // זה לא יעבוד ישירות עם הטיפוס
        // אם אתה רוצה ולידציה, תצטרך להגדיר מערך של מחרוזות חוקיות
        dataToUpdate.availabilityStatus = statusValue as AvailabilityStatus;
      }
      // עדכן availabilityUpdatedAt אם availabilityStatus משתנה, אלא אם הקליינט שלח תאריך ספציפי
      if (!body.hasOwnProperty('availabilityUpdatedAt') || availabilityUpdatedAt === undefined) {
        dataToUpdate.availabilityUpdatedAt = new Date();
      }
    }

    if (availabilityNote !== undefined) dataToUpdate.availabilityNote = emptyStringToNull(availabilityNote);

    // עדכן availabilityUpdatedAt אם נשלח במפורש מהקליינט
    // (הלוגיקה למעלה כבר מכסה את המקרה שבו הוא משתנה עקב שינוי ב-availabilityStatus)
    if (body.hasOwnProperty('availabilityUpdatedAt') && availabilityUpdatedAt !== undefined) {
        const auDate = toDateOrNull(availabilityUpdatedAt);
        // עבור שדה DateTime?, הקצאת null היא תקינה כדי לאפס אותו.
        dataToUpdate.availabilityUpdatedAt = auDate;
    }
    
    // עדכון lastActive (DateTime?)
    dataToUpdate.lastActive = new Date(); // תמיד יהיה Date תקין, לא null.

    // --- Perform the database update ---
    let updatedProfileFromDb;
    if (Object.keys(dataToUpdate).length > 0) {
      try {
        updatedProfileFromDb = await prisma.profile.update({
          where: { userId: userId },
          data: dataToUpdate,
        });
      } catch (dbError) {
        console.error('Prisma profile update error:', dbError);
        if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2025') {
          return NextResponse.json({ success: false, message: 'Profile not found for this user to update.' }, { status: 404 });
        }
        throw dbError;
      }
    } else {
      updatedProfileFromDb = await prisma.profile.findUnique({ where: { userId } });
      if (!updatedProfileFromDb) {
        return NextResponse.json({ success: false, message: "Profile not found." }, { status: 404 });
      }
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: true,
      }
    });

    if (!refreshedUser || !refreshedUser.profile) {
      console.error("Failed to retrieve user or profile after update for userId:", userId);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve updated profile after update." },
        { status: 500 }
      );
    }

    const responseUserProfile: UserProfile = {
      ...refreshedUser.profile,
      birthDate: new Date(refreshedUser.profile.birthDate), // Prisma מחזיר Date, המרה ל-Date מבטיחה שזה אכן אובייקט Date
      createdAt: new Date(refreshedUser.profile.createdAt),
      updatedAt: new Date(refreshedUser.profile.updatedAt),
      lastActive: refreshedUser.profile.lastActive ? new Date(refreshedUser.profile.lastActive) : null,
      availabilityUpdatedAt: refreshedUser.profile.availabilityUpdatedAt ? new Date(refreshedUser.profile.availabilityUpdatedAt) : null,
      user: {
        firstName: refreshedUser.firstName,
        lastName: refreshedUser.lastName,
        email: refreshedUser.email,
      },
    };

    return NextResponse.json({
      success: true,
      profile: responseUserProfile,
    });

  } catch (error) {
    console.error('Profile update route error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
         return NextResponse.json({ success: false, message: `Error: A field violates a unique constraint (${error.meta.target}).` }, { status: 409 });
      }
      if (error.code === 'P2025') { 
        return NextResponse.json({ success: false, message: 'Record to update or affect not found.' }, { status: 404 });
      }
      return NextResponse.json(
        { success: false, message: 'Database operation failed.', code: error.code, details: error.message },
        { status: 400 }
      );
    } 
    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
          { success: false, message: 'Data validation failed for database operation.', details: error.message },
          { status: 400 }
        );
    }
    let errorMessage = 'An unexpected error occurred during profile update.';
    if (error instanceof Error && error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}