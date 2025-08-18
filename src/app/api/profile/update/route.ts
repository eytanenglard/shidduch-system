// File: app/api/profile/update/route.ts

import { NextRequest, NextResponse } from "next/server";
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
  Profile, // Import Prisma's Profile type
} from "@prisma/client";
import type { UserProfile } from "@/types/next-auth";
import { updateUserAiProfile } from '@/lib/services/profileAiService'; // <--- 1. ייבוא

// Helper to convert to number or null
const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Helper to convert to Date or error if invalid for required fields
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

// Helper to convert to Date or null for optional fields
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
      preferredReligiousJourneys, 
      about,
      // --- START: הוספת שדות חדשים ---
      profileHeadline,
      humorStory,
      inspiringCoupleStory,
      influentialRabbi,
      // --- END: הוספת שדות חדשים ---
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
      preferredMaritalStatuses,
      preferredOrigins,
      preferredServiceTypes,
      preferredHeadCoverings,
      preferredKippahTypes,
      preferredShomerNegiah,
      preferredHasChildrenFromPrevious,
      preferredCharacterTraits,
      preferredHobbies,
      preferredAliyaStatus,
      hasViewedProfilePreview,
      hasMedicalInfo,
      medicalInfoDetails,
      medicalInfoDisclosureTiming,
      isMedicalInfoVisible,
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

    // --- Marital Status & Background (User's own) ---
    if (maritalStatus !== undefined) dataToUpdate.maritalStatus = emptyStringToNull(maritalStatus);
    if (hasChildrenFromPrevious !== undefined) dataToUpdate.hasChildrenFromPrevious = hasChildrenFromPrevious; // User's own
    if (parentStatus !== undefined) dataToUpdate.parentStatus = emptyStringToNull(parentStatus);
     if (fatherOccupation !== undefined) dataToUpdate.fatherOccupation = emptyStringToNull(fatherOccupation);
    if (motherOccupation !== undefined) dataToUpdate.motherOccupation = emptyStringToNull(motherOccupation);
    if (siblings !== undefined) dataToUpdate.siblings = toNumberOrNull(siblings);
    if (position !== undefined) dataToUpdate.position = toNumberOrNull(position);

    // --- Education, Occupation & Service (User's own) ---
    if (educationLevel !== undefined) dataToUpdate.educationLevel = emptyStringToNull(educationLevel);
    if (education !== undefined) dataToUpdate.education = emptyStringToNull(education);
    if (occupation !== undefined) dataToUpdate.occupation = emptyStringToNull(occupation);
    if (serviceType !== undefined) dataToUpdate.serviceType = emptyStringToNull(serviceType) as ServiceType | null;
    if (serviceDetails !== undefined) dataToUpdate.serviceDetails = emptyStringToNull(serviceDetails);

    // --- Religion & Lifestyle (User's own) ---
    if (religiousLevel !== undefined) dataToUpdate.religiousLevel = emptyStringToNull(religiousLevel);
        if (religiousJourney !== undefined) dataToUpdate.religiousJourney = emptyStringToNull(religiousJourney) as ReligiousJourney | null;

    if (shomerNegiah !== undefined) dataToUpdate.shomerNegiah = shomerNegiah;

    const existingProfileMinimal = await prisma.profile.findUnique({ where: { userId }, select: { gender: true }});
    const currentGenderForLogic = gender !== undefined ? gender : existingProfileMinimal?.gender;

    if (currentGenderForLogic === Gender.FEMALE) {
        if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
        if (gender !== undefined && gender === Gender.FEMALE) dataToUpdate.kippahType = null;
        else if (body.hasOwnProperty('kippahType') && kippahType === null) dataToUpdate.kippahType = null;
    } else if (currentGenderForLogic === Gender.MALE) {
        if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        if (gender !== undefined && gender === Gender.MALE) dataToUpdate.headCovering = null;
        else if (body.hasOwnProperty('headCovering') && headCovering === null) dataToUpdate.headCovering = null;
    } else {
        if (gender !== undefined && gender === null) {
           dataToUpdate.headCovering = null; dataToUpdate.kippahType = null;
        } else {
            if (headCovering !== undefined) dataToUpdate.headCovering = emptyStringToNull(headCovering) as HeadCoveringType | null;
            if (kippahType !== undefined) dataToUpdate.kippahType = emptyStringToNull(kippahType) as KippahType | null;
        }
    }
    if (preferredMatchmakerGender !== undefined) dataToUpdate.preferredMatchmakerGender = emptyStringToNull(preferredMatchmakerGender) as Gender | null;

    // --- Traits & Hobbies (User's own) ---
    if (profileCharacterTraits !== undefined) dataToUpdate.profileCharacterTraits = profileCharacterTraits || [];
    if (profileHobbies !== undefined) dataToUpdate.profileHobbies = profileHobbies || []; // User's own hobbies

    // --- About & Additional Info ---
    if (about !== undefined) dataToUpdate.about = emptyStringToNull(about);
      if (profileHeadline !== undefined) dataToUpdate.profileHeadline = emptyStringToNull(profileHeadline);
    if (humorStory !== undefined) dataToUpdate.humorStory = emptyStringToNull(humorStory);
    if (inspiringCoupleStory !== undefined) dataToUpdate.inspiringCoupleStory = emptyStringToNull(inspiringCoupleStory);
    if (influentialRabbi !== undefined) dataToUpdate.influentialRabbi = emptyStringToNull(influentialRabbi);
    if (matchingNotes !== undefined) dataToUpdate.matchingNotes = emptyStringToNull(matchingNotes);
    
    // --- Preferences (related to matching partner) ---
    if (preferredAgeMin !== undefined) dataToUpdate.preferredAgeMin = toNumberOrNull(preferredAgeMin);
    if (preferredAgeMax !== undefined) dataToUpdate.preferredAgeMax = toNumberOrNull(preferredAgeMax);
    if (preferredHeightMin !== undefined) dataToUpdate.preferredHeightMin = toNumberOrNull(preferredHeightMin);
    if (preferredHeightMax !== undefined) dataToUpdate.preferredHeightMax = toNumberOrNull(preferredHeightMax);
    if (preferredReligiousLevels !== undefined) dataToUpdate.preferredReligiousLevels = preferredReligiousLevels || [];
    if (preferredLocations !== undefined) dataToUpdate.preferredLocations = preferredLocations || [];
    if (preferredEducation !== undefined) dataToUpdate.preferredEducation = preferredEducation || [];
    if (preferredOccupations !== undefined) dataToUpdate.preferredOccupations = preferredOccupations || [];
    if (contactPreference !== undefined) dataToUpdate.contactPreference = emptyStringToNull(contactPreference);
    if (preferredMaritalStatuses !== undefined) dataToUpdate.preferredMaritalStatuses = preferredMaritalStatuses || [];
    if (preferredOrigins !== undefined) dataToUpdate.preferredOrigins = preferredOrigins || [];
    if (preferredServiceTypes !== undefined) dataToUpdate.preferredServiceTypes = preferredServiceTypes || [];
    if (preferredHeadCoverings !== undefined) dataToUpdate.preferredHeadCoverings = preferredHeadCoverings || [];
    if (preferredKippahTypes !== undefined) dataToUpdate.preferredKippahTypes = preferredKippahTypes || [];
    if (preferredShomerNegiah !== undefined) dataToUpdate.preferredShomerNegiah = emptyStringToNull(preferredShomerNegiah); // Assuming it's a string like "yes", "no" that needs to be nullable
    
    if (preferredHasChildrenFromPrevious !== undefined) {
      dataToUpdate.preferredHasChildrenFromPrevious = preferredHasChildrenFromPrevious;
    }

    if (preferredCharacterTraits !== undefined) dataToUpdate.preferredCharacterTraits = preferredCharacterTraits || []; // Preference for partner
    if (preferredHobbies !== undefined) dataToUpdate.preferredHobbies = preferredHobbies || []; // Preference for partner's hobbies
    if (preferredAliyaStatus !== undefined) dataToUpdate.preferredAliyaStatus = emptyStringToNull(preferredAliyaStatus);
    if (preferredReligiousJourneys !== undefined) dataToUpdate.preferredReligiousJourneys = preferredReligiousJourneys || [];

    // --- Profile Management ---
    if (isProfileVisible !== undefined) dataToUpdate.isProfileVisible = isProfileVisible;
    if (hasViewedProfilePreview !== undefined) dataToUpdate.hasViewedProfilePreview = hasViewedProfilePreview;
   
    // --- START: הוספת לוגיקת עדכון לשדות רפואיים ---
    if (hasMedicalInfo !== undefined) dataToUpdate.hasMedicalInfo = hasMedicalInfo;
    if (medicalInfoDetails !== undefined) dataToUpdate.medicalInfoDetails = emptyStringToNull(medicalInfoDetails);
    if (medicalInfoDisclosureTiming !== undefined) dataToUpdate.medicalInfoDisclosureTiming = emptyStringToNull(medicalInfoDisclosureTiming);
    if (isMedicalInfoVisible !== undefined) dataToUpdate.isMedicalInfoVisible = isMedicalInfoVisible;
    // --- END: הוספת לוגיקת עדכון לשדות רפואיים ---

    if (availabilityStatus !== undefined) {
      const statusValue = emptyStringToNull(availabilityStatus);
      dataToUpdate.availabilityStatus = (statusValue === null ? "AVAILABLE" : statusValue) as AvailabilityStatus;
      if (!body.hasOwnProperty('availabilityUpdatedAt') || availabilityUpdatedAt === undefined) {
        dataToUpdate.availabilityUpdatedAt = new Date();
      }
    }
    if (availabilityNote !== undefined) dataToUpdate.availabilityNote = emptyStringToNull(availabilityNote);
    if (body.hasOwnProperty('availabilityUpdatedAt') && availabilityUpdatedAt !== undefined) {
        dataToUpdate.availabilityUpdatedAt = toDateOrNull(availabilityUpdatedAt);
    }
    dataToUpdate.lastActive = new Date();

    // --- Perform the database update ---
    let updatedProfileRecord: Profile | null = null;
    if (Object.keys(dataToUpdate).length > 0) {
      try {
         dataToUpdate.needsAiProfileUpdate = true;
         
        updatedProfileRecord = await prisma.profile.update({
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

    // Construct the response, ensuring all UserProfile fields are mapped
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
      preferredReligiousJourneys: dbProfile.preferredReligiousJourneys ?? [],
      about: dbProfile.about || "",
        profileHeadline: dbProfile.profileHeadline || undefined,
      humorStory: dbProfile.humorStory || undefined,
      inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
      influentialRabbi: dbProfile.influentialRabbi || undefined,
      parentStatus: dbProfile.parentStatus || undefined,
      fatherOccupation: dbProfile.fatherOccupation || "",
      motherOccupation: dbProfile.motherOccupation || "",
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: refreshedUserWithProfile.isProfileComplete,
      // --- START: הוספת שדות רפואיים לתגובה ---
      hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
      medicalInfoDetails: dbProfile.medicalInfoDetails ?? undefined,
      medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
      isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
      // --- END: הוספת שדות רפואיים לתגובה ---
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender || undefined,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      matchingNotes: dbProfile.matchingNotes || "",
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
      preferredReligiousLevels: dbProfile.preferredReligiousLevels || [],
      preferredLocations: dbProfile.preferredLocations || [],
      preferredEducation: dbProfile.preferredEducation || [],
      preferredOccupations: dbProfile.preferredOccupations || [],
      contactPreference: dbProfile.contactPreference || undefined,
      preferredMaritalStatuses: dbProfile.preferredMaritalStatuses || [],
      preferredOrigins: dbProfile.preferredOrigins || [],
      preferredServiceTypes: (dbProfile.preferredServiceTypes as ServiceType[]) || [], 
      preferredHeadCoverings: (dbProfile.preferredHeadCoverings as HeadCoveringType[]) || [],
      preferredKippahTypes: (dbProfile.preferredKippahTypes as KippahType[]) || [],
      preferredShomerNegiah: dbProfile.preferredShomerNegiah || undefined, 
      preferredHasChildrenFromPrevious: dbProfile.preferredHasChildrenFromPrevious ?? undefined, 
      preferredCharacterTraits: dbProfile.preferredCharacterTraits || [], 
      preferredHobbies: dbProfile.preferredHobbies || [],                 
      preferredAliyaStatus: dbProfile.preferredAliyaStatus || undefined,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview, 

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
    console.error('Profile update route error:', error);
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