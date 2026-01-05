// src/app/api/profile/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Prisma,
  Gender,
  ServiceType,
  HeadCoveringType,
  KippahType,
  AvailabilityStatus,
  ReligiousJourney,
  Profile,
} from "@prisma/client";
import type { UserProfile } from "@/types/next-auth";

// --- Helpers ---

const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const toRequiredDate = (value: string | number | Date | null | undefined, fieldName: string): Date => {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`Required date field '${fieldName}' is missing or empty.`);
  }
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value for required field '${fieldName}'.`);
  }
  return date;
};

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

const emptyStringToNull = (value: string | null | undefined): string | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
};


export async function PUT(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(req, { requests: 50, window: '10 m' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("❌ [Update Profile] Unauthorized attempt");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    console.log(`🔹 [Update Profile] Start update for UserID: ${userId}`);

    let body;
    try {
      body = await req.json();
      // --- LOG 1: בדיקת ה-Body הנכנס ---
      console.log("🔹 [Update Profile] Incoming Body Keys:", Object.keys(body));
      console.log("🔹 [Update Profile] Value of 'internalMatchmakerNotes' in body:", body.internalMatchmakerNotes);
    } catch (error) {
      console.error("Invalid JSON body:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      gender,
      birthDate,
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
      religiousJourney,
      about,
      profileHeadline,
      inspiringCoupleStory,
      influentialRabbi,
      isAboutVisible,
      isFriendsSectionVisible,
      isNeshamaTechSummaryVisible,
      parentStatus,
      fatherOccupation,
      motherOccupation,
      siblings,
      position,
      isProfileVisible,
      preferredMatchmakerGender,
      availabilityStatus,
      availabilityNote,
      availabilityUpdatedAt,
      matchingNotes,
      internalMatchmakerNotes, // <--- Destructuring here
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
      // Preferences
      preferredAgeMin,
      preferredAgeMax,
      preferredHeightMin,
      preferredHeightMax,
      preferredReligiousLevels,
      preferredLocations,
      preferredEducation,
      preferredOccupations,
      contactPreference,
      preferredMaritalStatuses,
      preferredOrigins,
      preferredServiceTypes,
      preferredHeadCoverings,
      preferredKippahTypes,
      preferredShomerNegiah,
      preferredPartnerHasChildren,
      preferredCharacterTraits,
      preferredHobbies,
      preferredAliyaStatus,
      preferredReligiousJourneys,
      hasViewedProfilePreview,
      hasMedicalInfo,
      medicalInfoDetails,
      medicalInfoDisclosureTiming,
      isMedicalInfoVisible,
      cvUrl,
      cvSummary,
    } = body as Partial<UserProfile>;

    const dataToUpdate: Prisma.ProfileUpdateInput = {};

    // --- Personal & Demographic ---
    if (gender !== undefined) dataToUpdate.gender = gender as Gender;
    if (birthDate !== undefined) {
      try {
        dataToUpdate.birthDate = toRequiredDate(birthDate, "birthDate");
      } catch (e) {
         if (e instanceof Error) return NextResponse.json({ success: false, message: e.message }, { status: 400 });
         return NextResponse.json({ success: false, message: "Invalid birthDate provided." }, { status: 400 });
      }
    }
    if (nativeLanguage !== undefined) dataToUpdate.nativeLanguage = emptyStringToNull(nativeLanguage);
    if (additionalLanguages !== undefined) dataToUpdate.additionalLanguages = additionalLanguages || [];
    if (height !== undefined) dataToUpdate.height = toNumberOrNull(height);
    if (city !== undefined) dataToUpdate.city = emptyStringToNull(city);
    if (origin !== undefined) dataToUpdate.origin = emptyStringToNull(origin);
    if (aliyaCountry !== undefined) dataToUpdate.aliyaCountry = emptyStringToNull(aliyaCountry);
    if (aliyaYear !== undefined) dataToUpdate.aliyaYear = toNumberOrNull(aliyaYear);

    // --- Marital Status ---
    if (maritalStatus !== undefined) dataToUpdate.maritalStatus = emptyStringToNull(maritalStatus);
    if (hasChildrenFromPrevious !== undefined) dataToUpdate.hasChildrenFromPrevious = hasChildrenFromPrevious;
    if (parentStatus !== undefined) dataToUpdate.parentStatus = emptyStringToNull(parentStatus);
    if (fatherOccupation !== undefined) dataToUpdate.fatherOccupation = emptyStringToNull(fatherOccupation);
    if (motherOccupation !== undefined) dataToUpdate.motherOccupation = emptyStringToNull(motherOccupation);
    if (siblings !== undefined) dataToUpdate.siblings = toNumberOrNull(siblings);
    if (position !== undefined) dataToUpdate.position = toNumberOrNull(position);

    // --- Education & Occupation ---
    if (educationLevel !== undefined) dataToUpdate.educationLevel = emptyStringToNull(educationLevel);
    if (education !== undefined) dataToUpdate.education = emptyStringToNull(education);
    if (occupation !== undefined) dataToUpdate.occupation = emptyStringToNull(occupation);
    if (serviceType !== undefined) dataToUpdate.serviceType = emptyStringToNull(serviceType) as ServiceType | null;
    if (serviceDetails !== undefined) dataToUpdate.serviceDetails = emptyStringToNull(serviceDetails);

    // --- Religion ---
    if (religiousLevel !== undefined) dataToUpdate.religiousLevel = emptyStringToNull(religiousLevel);
    if (religiousJourney !== undefined) {
        const val = emptyStringToNull(religiousJourney);
        if (val && Object.values(ReligiousJourney).includes(val as ReligiousJourney)) {
            dataToUpdate.religiousJourney = val as ReligiousJourney;
        } else {
             dataToUpdate.religiousJourney = null;
        }
    }
    if (shomerNegiah !== undefined) dataToUpdate.shomerNegiah = shomerNegiah;

    // Gender Logic for HeadCovering/Kippah
    const existingProfileMinimal = await prisma.profile.findUnique({ where: { userId }, select: { gender: true }});
    const currentGenderForLogic = gender !== undefined ? gender : existingProfileMinimal?.gender;

    if (currentGenderForLogic === Gender.FEMALE) {
        if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
        if (gender !== undefined && gender === Gender.FEMALE) dataToUpdate.kippahType = null;
        else if (Object.prototype.hasOwnProperty.call(body, 'kippahType') && kippahType === null) dataToUpdate.kippahType = null;
    } else if (currentGenderForLogic === Gender.MALE) {
        if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        if (gender !== undefined && gender === Gender.MALE) dataToUpdate.headCovering = null;
        else if (Object.prototype.hasOwnProperty.call(body, 'headCovering') && headCovering === null) dataToUpdate.headCovering = null;
    } else {
        if (gender !== undefined && gender === null) {
           dataToUpdate.headCovering = null; dataToUpdate.kippahType = null;
        } else {
            if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
            if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        }
    }
    if (preferredMatchmakerGender !== undefined) dataToUpdate.preferredMatchmakerGender = emptyStringToNull(preferredMatchmakerGender) as Gender | null;

    // --- Traits ---
    if (profileCharacterTraits !== undefined) dataToUpdate.profileCharacterTraits = profileCharacterTraits || [];
    if (profileHobbies !== undefined) dataToUpdate.profileHobbies = profileHobbies || [];

    // --- About ---
    if (about !== undefined) dataToUpdate.about = emptyStringToNull(about);
    if (profileHeadline !== undefined) dataToUpdate.profileHeadline = emptyStringToNull(profileHeadline);
    if (inspiringCoupleStory !== undefined) dataToUpdate.inspiringCoupleStory = emptyStringToNull(inspiringCoupleStory);
    if (influentialRabbi !== undefined) dataToUpdate.influentialRabbi = emptyStringToNull(influentialRabbi);
    
    // --- NOTES & INTERNAL DATA ---
    if (matchingNotes !== undefined) dataToUpdate.matchingNotes = emptyStringToNull(matchingNotes);
    
    // --- LOG 2: בדיקה לפני ההוספה לאובייקט העדכון ---
    if (internalMatchmakerNotes !== undefined) {
        console.log("✅ [Update Profile] internalMatchmakerNotes found in payload, updating to:", internalMatchmakerNotes);
        dataToUpdate.internalMatchmakerNotes = emptyStringToNull(internalMatchmakerNotes);
    } else {
        console.log("⚠️ [Update Profile] internalMatchmakerNotes is UNDEFINED in payload - skipping update.");
    }

    if (contactPreference !== undefined) dataToUpdate.contactPreference = emptyStringToNull(contactPreference);
    
    // --- Preferences ---
    if (preferredAgeMin !== undefined) dataToUpdate.preferredAgeMin = toNumberOrNull(preferredAgeMin);
    if (preferredAgeMax !== undefined) dataToUpdate.preferredAgeMax = toNumberOrNull(preferredAgeMax);
    if (preferredHeightMin !== undefined) dataToUpdate.preferredHeightMin = toNumberOrNull(preferredHeightMin);
    if (preferredHeightMax !== undefined) dataToUpdate.preferredHeightMax = toNumberOrNull(preferredHeightMax);
    if (preferredLocations !== undefined) dataToUpdate.preferredLocations = preferredLocations || [];
    if (preferredReligiousLevels !== undefined) dataToUpdate.preferredReligiousLevels = preferredReligiousLevels || [];
    
    if (preferredReligiousJourneys !== undefined) {
        const validJourneys = (preferredReligiousJourneys || []).filter(j => 
            Object.values(ReligiousJourney).includes(j as ReligiousJourney)
        ) as ReligiousJourney[];
        dataToUpdate.preferredReligiousJourneys = validJourneys;
    }

    if (preferredShomerNegiah !== undefined) dataToUpdate.preferredShomerNegiah = emptyStringToNull(preferredShomerNegiah);
    if (preferredPartnerHasChildren !== undefined) dataToUpdate.preferredPartnerHasChildren = emptyStringToNull(preferredPartnerHasChildren);
    if (preferredAliyaStatus !== undefined) dataToUpdate.preferredAliyaStatus = emptyStringToNull(preferredAliyaStatus);

    if (preferredHeadCoverings !== undefined) dataToUpdate.preferredHeadCoverings = preferredHeadCoverings || [];
    if (preferredKippahTypes !== undefined) dataToUpdate.preferredKippahTypes = preferredKippahTypes || [];
    if (preferredEducation !== undefined) dataToUpdate.preferredEducation = preferredEducation || [];
    if (preferredOccupations !== undefined) dataToUpdate.preferredOccupations = preferredOccupations || [];
    if (preferredServiceTypes !== undefined) dataToUpdate.preferredServiceTypes = preferredServiceTypes || [];
    if (preferredMaritalStatuses !== undefined) dataToUpdate.preferredMaritalStatuses = preferredMaritalStatuses || [];
    if (preferredOrigins !== undefined) dataToUpdate.preferredOrigins = preferredOrigins || [];
    if (preferredCharacterTraits !== undefined) dataToUpdate.preferredCharacterTraits = preferredCharacterTraits || [];
    if (preferredHobbies !== undefined) dataToUpdate.preferredHobbies = preferredHobbies || [];
    
    // --- Visibility ---
    if (isProfileVisible !== undefined) dataToUpdate.isProfileVisible = isProfileVisible;
    if (hasViewedProfilePreview !== undefined) dataToUpdate.hasViewedProfilePreview = hasViewedProfilePreview;
    if (isAboutVisible !== undefined) dataToUpdate.isAboutVisible = isAboutVisible;
    if (isFriendsSectionVisible !== undefined) dataToUpdate.isFriendsSectionVisible = isFriendsSectionVisible;
    if (isNeshamaTechSummaryVisible !== undefined) dataToUpdate.isNeshamaTechSummaryVisible = isNeshamaTechSummaryVisible;
   
    // --- Medical ---
    if (hasMedicalInfo !== undefined) dataToUpdate.hasMedicalInfo = hasMedicalInfo;
    if (medicalInfoDetails !== undefined) dataToUpdate.medicalInfoDetails = emptyStringToNull(medicalInfoDetails);
    if (medicalInfoDisclosureTiming !== undefined) dataToUpdate.medicalInfoDisclosureTiming = emptyStringToNull(medicalInfoDisclosureTiming);
    if (isMedicalInfoVisible !== undefined) dataToUpdate.isMedicalInfoVisible = isMedicalInfoVisible;
    if (cvUrl !== undefined) dataToUpdate.cvUrl = emptyStringToNull(cvUrl);
    if (cvSummary !== undefined) dataToUpdate.cvSummary = emptyStringToNull(cvSummary);
    
    // --- Availability ---
    if (availabilityStatus !== undefined) {
      const statusValue = emptyStringToNull(availabilityStatus);
      dataToUpdate.availabilityStatus = (statusValue === null ? "AVAILABLE" : statusValue) as AvailabilityStatus;
      if (!Object.prototype.hasOwnProperty.call(body, 'availabilityUpdatedAt') || availabilityUpdatedAt === undefined) {
        dataToUpdate.availabilityUpdatedAt = new Date();
      }
    }
    if (availabilityNote !== undefined) dataToUpdate.availabilityNote = emptyStringToNull(availabilityNote);
    if (Object.prototype.hasOwnProperty.call(body, 'availabilityUpdatedAt') && availabilityUpdatedAt !== undefined) {
        dataToUpdate.availabilityUpdatedAt = toDateOrNull(availabilityUpdatedAt);
    }
    dataToUpdate.lastActive = new Date();

    // --- Perform Update ---
    let updatedProfileRecord: Profile | null = null;
    
    // --- LOG 3: האובייקט שנשלח ל-Prisma ---
    console.log("🔹 [Update Profile] Final Prisma Data Object:", JSON.stringify(dataToUpdate, null, 2));

    if (Object.keys(dataToUpdate).length > 0) {
      try {
         dataToUpdate.needsAiProfileUpdate = true;
         
        updatedProfileRecord = await prisma.profile.update({
          where: { userId: userId },
          data: dataToUpdate,
        });
        console.log("✅ [Update Profile] Database update successful.");
    
      } catch (dbError) {
        console.error('❌ [Update Profile] Prisma update error:', dbError);
        if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2025') {
          return NextResponse.json({ success: false, message: 'Profile not found for this user to update.' }, { status: 404 });
        }
        throw dbError;
      }
    } else {
      console.log("⚠️ [Update Profile] No data to update provided.");
      updatedProfileRecord = await prisma.profile.findUnique({ where: { userId } });
    }

    if (!updatedProfileRecord) {
      return NextResponse.json({ success: false, message: "Profile not found or no update performed." }, { status: 404 });
    }

    const refreshedUserWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!refreshedUserWithProfile || !refreshedUserWithProfile.profile) {
      console.error("Failed to retrieve user or profile after update for userId:", userId);
      return NextResponse.json({ success: false, message: "Failed to retrieve updated profile after update." }, { status: 500 });
    }
    
    const dbProfile = refreshedUserWithProfile.profile;

    // --- LOG 4: בדיקת הערך בדאטה בייס אחרי השמירה ---
    console.log("🔹 [Update Profile] Value in DB after update:", dbProfile.internalMatchmakerNotes);

    // Construct Response
    const responseUserProfile: UserProfile = {
      id: dbProfile.id,
      userId: dbProfile.userId,
      gender: dbProfile.gender, 
      birthDate: new Date(dbProfile.birthDate),
      nativeLanguage: dbProfile.nativeLanguage || undefined,
      additionalLanguages: dbProfile.additionalLanguages || [],
      height: dbProfile.height ?? null,
      maritalStatus: dbProfile.maritalStatus || undefined,
      occupation: dbProfile.occupation || "",
      education: dbProfile.education || "",
      educationLevel: dbProfile.educationLevel || undefined,
      city: dbProfile.city || "",
      origin: dbProfile.origin || "",
      religiousLevel: dbProfile.religiousLevel || undefined,
      religiousJourney: dbProfile.religiousJourney || undefined,
      about: dbProfile.about || "",
      profileHeadline: dbProfile.profileHeadline || undefined,
      inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
      influentialRabbi: dbProfile.influentialRabbi || undefined,
      isAboutVisible: dbProfile.isAboutVisible ?? true,
      isFriendsSectionVisible: dbProfile.isFriendsSectionVisible ?? true,
      isNeshamaTechSummaryVisible: dbProfile.isNeshamaTechSummaryVisible ?? true,
      parentStatus: dbProfile.parentStatus || undefined,
      fatherOccupation: dbProfile.fatherOccupation || "",
      motherOccupation: dbProfile.motherOccupation || "",
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: refreshedUserWithProfile.isProfileComplete,
      hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
      medicalInfoDetails: dbProfile.medicalInfoDetails ?? undefined,
      medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
      isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
      needsAiProfileUpdate: dbProfile.needsAiProfileUpdate,
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender || undefined,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      matchingNotes: dbProfile.matchingNotes || "",
      
      // ✅ ודא שזה מוחזר כאן!
      internalMatchmakerNotes: dbProfile.internalMatchmakerNotes || "", 

      shomerNegiah: dbProfile.shomerNegiah ?? undefined,
      serviceType: dbProfile.serviceType || undefined,
      serviceDetails: dbProfile.serviceDetails || "",
      headCovering: dbProfile.headCovering || undefined,
      kippahType: dbProfile.kippahType || undefined,
      hasChildrenFromPrevious: dbProfile.hasChildrenFromPrevious ?? undefined, 
      profileCharacterTraits: dbProfile.profileCharacterTraits || [], 
      profileHobbies: dbProfile.profileHobbies || [],                 
      aliyaCountry: dbProfile.aliyaCountry || "",
      aliyaYear: dbProfile.aliyaYear ?? null,
      preferredAgeMin: dbProfile.preferredAgeMin ?? null,
      preferredAgeMax: dbProfile.preferredAgeMax ?? null,
      preferredHeightMin: dbProfile.preferredHeightMin ?? null,
      preferredHeightMax: dbProfile.preferredHeightMax ?? null,
      preferredLocations: dbProfile.preferredLocations || [],
      preferredReligiousLevels: dbProfile.preferredReligiousLevels || [],
      preferredReligiousJourneys: dbProfile.preferredReligiousJourneys ?? [],
      preferredEducation: dbProfile.preferredEducation || [],
      preferredOccupations: dbProfile.preferredOccupations || [],
      contactPreference: dbProfile.contactPreference || undefined,
      preferredMaritalStatuses: dbProfile.preferredMaritalStatuses || [],
      preferredOrigins: dbProfile.preferredOrigins || [],
      preferredServiceTypes: (dbProfile.preferredServiceTypes as ServiceType[]) || [], 
      preferredHeadCoverings: (dbProfile.preferredHeadCoverings as HeadCoveringType[]) || [],
      preferredKippahTypes: (dbProfile.preferredKippahTypes as KippahType[]) || [],
      preferredShomerNegiah: dbProfile.preferredShomerNegiah || undefined,
      preferredPartnerHasChildren: dbProfile.preferredPartnerHasChildren || undefined,
      preferredCharacterTraits: dbProfile.preferredCharacterTraits || [], 
      preferredHobbies: dbProfile.preferredHobbies || [],                 
      preferredAliyaStatus: dbProfile.preferredAliyaStatus || undefined,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview, 
      cvUrl: dbProfile.cvUrl,
      cvSummary: dbProfile.cvSummary,
      aiProfileSummary: dbProfile.aiProfileSummary, 
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
      user: {
        id: refreshedUserWithProfile.id,
        firstName: refreshedUserWithProfile.firstName,
        lastName: refreshedUserWithProfile.lastName,
        email: refreshedUserWithProfile.email,
      },
    };

    return NextResponse.json({
      success: true,
      profile: responseUserProfile,
    });

  } catch (error) {
    console.error('❌ [Update Profile] Fatal Error:', error);
    // ... Error handling blocks
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
         return NextResponse.json({ success: false, message: `Error: A field violates a unique constraint (${JSON.stringify(error.meta.target)}).` }, { status: 409 });
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