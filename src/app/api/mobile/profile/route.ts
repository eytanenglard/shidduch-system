// src/app/api/mobile/profile/route.ts
// ==========================================
// NeshamaTech Mobile - Profile API
// GET: Fetch authenticated user's full profile
// PUT: Update authenticated user's profile
// ==========================================

import { NextRequest } from "next/server";
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
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// --- Helpers (same as web route) ---

const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const emptyStringToNull = (value: string | null | undefined): string | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
};

// ==========================================
// Helper: Build profile response shape
// Shared between GET and PUT responses
// ==========================================
function buildProfileResponse(p: Profile) {
  return {
    // IDs
    id: p.id,
    userId: p.userId,

    // Basic Info
    gender: p.gender,
    birthDate: p.birthDate,
    birthDateIsApproximate: p.birthDateIsApproximate ?? false,
    height: p.height,
    maritalStatus: p.maritalStatus,
    hasChildrenFromPrevious: p.hasChildrenFromPrevious,
    occupation: p.occupation,
    education: p.education,
    educationLevel: p.educationLevel,
    city: p.city,
    origin: p.origin,
    aliyaCountry: p.aliyaCountry,
    aliyaYear: p.aliyaYear,
    nativeLanguage: p.nativeLanguage,
    additionalLanguages: p.additionalLanguages || [],

    // Family
    parentStatus: p.parentStatus,
    fatherOccupation: p.fatherOccupation,
    motherOccupation: p.motherOccupation,
    siblings: p.siblings,
    position: p.position,

    // Religion
    religiousLevel: p.religiousLevel,
    religiousJourney: p.religiousJourney,
    shomerNegiah: p.shomerNegiah,
    serviceType: p.serviceType,
    serviceDetails: p.serviceDetails,
    headCovering: p.headCovering,
    kippahType: p.kippahType,

    // Character & About
    profileHeadline: p.profileHeadline,
    about: p.about,
    isAboutVisible: p.isAboutVisible ?? true,
    inspiringCoupleStory: p.inspiringCoupleStory,
    influentialRabbi: p.influentialRabbi,
    internalMatchmakerNotes: p.internalMatchmakerNotes,
    profileCharacterTraits: p.profileCharacterTraits || [],
    profileHobbies: p.profileHobbies || [],

    // Matchmaker Preference
    preferredMatchmakerGender: p.preferredMatchmakerGender,

    // Medical Info
    hasMedicalInfo: p.hasMedicalInfo,
    medicalInfoDetails: p.medicalInfoDetails,
    medicalInfoDisclosureTiming: p.medicalInfoDisclosureTiming,
    isMedicalInfoVisible: p.isMedicalInfoVisible,

    // Preferences - Ranges
    preferredAgeMin: p.preferredAgeMin,
    preferredAgeMax: p.preferredAgeMax,
    preferredHeightMin: p.preferredHeightMin,
    preferredHeightMax: p.preferredHeightMax,

    // Preferences - Single Select
    preferredShomerNegiah: p.preferredShomerNegiah,
    preferredPartnerHasChildren: p.preferredPartnerHasChildren,
    preferredAliyaStatus: p.preferredAliyaStatus,

    // Preferences - Multi Select
    preferredLocations: p.preferredLocations || [],
    preferredReligiousLevels: p.preferredReligiousLevels || [],
    preferredReligiousJourneys: p.preferredReligiousJourneys || [],
    preferredEducation: p.preferredEducation || [],
    preferredOccupations: p.preferredOccupations || [],
    preferredMaritalStatuses: p.preferredMaritalStatuses || [],
    preferredOrigins: p.preferredOrigins || [],
    preferredServiceTypes: p.preferredServiceTypes || [],
    preferredHeadCoverings: p.preferredHeadCoverings || [],
    preferredKippahTypes: p.preferredKippahTypes || [],
    preferredCharacterTraits: p.preferredCharacterTraits || [],
    preferredHobbies: p.preferredHobbies || [],

    // Notes
    matchingNotes: p.matchingNotes,

    // System
    availabilityStatus: p.availabilityStatus,

    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ==========================================
// OPTIONS (CORS)
// ==========================================
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET /api/mobile/profile
// Returns the authenticated user's full profile
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: {
          orderBy: { isMain: "desc" },
          select: {
            id: true,
            url: true,
            isMain: true,
          },
        },
      },
    });

    if (!userWithProfile) {
      return corsError(req, "User not found", 404);
    }

    if (!userWithProfile.profile) {
      return corsError(req, "Profile not found. Please complete your profile on the website first.", 404);
    }

    const profile = buildProfileResponse(userWithProfile.profile);

    console.log(`[mobile/profile] GET profile for user ${userId}`);

    return corsJson(req, {
      success: true,
      data: {
        profile,
        user: {
          id: userWithProfile.id,
          firstName: userWithProfile.firstName,
          lastName: userWithProfile.lastName,
          email: userWithProfile.email,
          phone: userWithProfile.phone,
        },
        images: userWithProfile.images,
      },
    });
  } catch (error) {
    console.error("[mobile/profile] GET Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}

// ==========================================
// PUT /api/mobile/profile
// Updates the authenticated user's profile
// Accepts partial data - only updates provided fields
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return corsError(req, "Invalid JSON body", 400);
    }

    console.log(`[mobile/profile] PUT update for user ${userId}, keys: ${Object.keys(body).join(", ")}`);

    // Build the Prisma update object - only include fields that were sent
    const dataToUpdate: Prisma.ProfileUpdateInput = {};

    // ---- Personal & Demographic ----
    if (body.height !== undefined) dataToUpdate.height = toNumberOrNull(body.height);
    if (body.city !== undefined) dataToUpdate.city = emptyStringToNull(body.city);
    if (body.origin !== undefined) dataToUpdate.origin = emptyStringToNull(body.origin);
    if (body.occupation !== undefined) dataToUpdate.occupation = emptyStringToNull(body.occupation);
    if (body.education !== undefined) dataToUpdate.education = emptyStringToNull(body.education);
    if (body.nativeLanguage !== undefined) dataToUpdate.nativeLanguage = emptyStringToNull(body.nativeLanguage);
    if (body.additionalLanguages !== undefined) dataToUpdate.additionalLanguages = body.additionalLanguages || [];
    if (body.aliyaCountry !== undefined) dataToUpdate.aliyaCountry = emptyStringToNull(body.aliyaCountry);
    if (body.aliyaYear !== undefined) dataToUpdate.aliyaYear = toNumberOrNull(body.aliyaYear);

    // ---- Family ----
    if (body.parentStatus !== undefined) dataToUpdate.parentStatus = emptyStringToNull(body.parentStatus);
    if (body.fatherOccupation !== undefined) dataToUpdate.fatherOccupation = emptyStringToNull(body.fatherOccupation);
    if (body.motherOccupation !== undefined) dataToUpdate.motherOccupation = emptyStringToNull(body.motherOccupation);
    if (body.siblings !== undefined) dataToUpdate.siblings = toNumberOrNull(body.siblings);
    if (body.position !== undefined) dataToUpdate.position = toNumberOrNull(body.position);

    // ---- Religion (limited editable fields from mobile) ----
    if (body.shomerNegiah !== undefined) dataToUpdate.shomerNegiah = body.shomerNegiah;
    if (body.serviceDetails !== undefined) dataToUpdate.serviceDetails = emptyStringToNull(body.serviceDetails);
    if (body.influentialRabbi !== undefined) dataToUpdate.influentialRabbi = emptyStringToNull(body.influentialRabbi);
   if (body.preferredMatchmakerGender !== undefined) {
  dataToUpdate.preferredMatchmakerGender = emptyStringToNull(body.preferredMatchmakerGender) as Gender | null;
}

    // ---- Traits & Character ----
    if (body.profileCharacterTraits !== undefined) dataToUpdate.profileCharacterTraits = body.profileCharacterTraits || [];
    if (body.profileHobbies !== undefined) dataToUpdate.profileHobbies = body.profileHobbies || [];

    // ---- About ----
    if (body.profileHeadline !== undefined) dataToUpdate.profileHeadline = emptyStringToNull(body.profileHeadline);
    if (body.about !== undefined) dataToUpdate.about = emptyStringToNull(body.about);
    if (body.isAboutVisible !== undefined) dataToUpdate.isAboutVisible = body.isAboutVisible;
    if (body.inspiringCoupleStory !== undefined) dataToUpdate.inspiringCoupleStory = emptyStringToNull(body.inspiringCoupleStory);
    if (body.internalMatchmakerNotes !== undefined) dataToUpdate.internalMatchmakerNotes = emptyStringToNull(body.internalMatchmakerNotes);

    // ---- Medical Info ----
    if (body.hasMedicalInfo !== undefined) {
      dataToUpdate.hasMedicalInfo = body.hasMedicalInfo;
      // If user unchecks medical info, clear the details
      if (!body.hasMedicalInfo) {
        dataToUpdate.medicalInfoDetails = null;
        dataToUpdate.medicalInfoDisclosureTiming = null;
        dataToUpdate.isMedicalInfoVisible = false;
      }
    }
    if (body.medicalInfoDetails !== undefined) dataToUpdate.medicalInfoDetails = emptyStringToNull(body.medicalInfoDetails);
    if (body.medicalInfoDisclosureTiming !== undefined) dataToUpdate.medicalInfoDisclosureTiming = emptyStringToNull(body.medicalInfoDisclosureTiming);
    if (body.isMedicalInfoVisible !== undefined) dataToUpdate.isMedicalInfoVisible = body.isMedicalInfoVisible;

    // ---- Notes ----
    if (body.matchingNotes !== undefined) dataToUpdate.matchingNotes = emptyStringToNull(body.matchingNotes);

    // ---- Preferences - Ranges ----
    if (body.preferredAgeMin !== undefined) dataToUpdate.preferredAgeMin = toNumberOrNull(body.preferredAgeMin);
    if (body.preferredAgeMax !== undefined) dataToUpdate.preferredAgeMax = toNumberOrNull(body.preferredAgeMax);
    if (body.preferredHeightMin !== undefined) dataToUpdate.preferredHeightMin = toNumberOrNull(body.preferredHeightMin);
    if (body.preferredHeightMax !== undefined) dataToUpdate.preferredHeightMax = toNumberOrNull(body.preferredHeightMax);

    // ---- Preferences - Single Select ----
    if (body.preferredShomerNegiah !== undefined) dataToUpdate.preferredShomerNegiah = emptyStringToNull(body.preferredShomerNegiah);
    if (body.preferredPartnerHasChildren !== undefined) dataToUpdate.preferredPartnerHasChildren = emptyStringToNull(body.preferredPartnerHasChildren);
    if (body.preferredAliyaStatus !== undefined) dataToUpdate.preferredAliyaStatus = emptyStringToNull(body.preferredAliyaStatus);

    // ---- Preferences - Multi Select (Arrays) ----
    if (body.preferredLocations !== undefined) dataToUpdate.preferredLocations = body.preferredLocations || [];
    if (body.preferredReligiousLevels !== undefined) dataToUpdate.preferredReligiousLevels = body.preferredReligiousLevels || [];

    if (body.preferredReligiousJourneys !== undefined) {
      const validJourneys = (body.preferredReligiousJourneys || []).filter(
        (j: string) => Object.values(ReligiousJourney).includes(j as ReligiousJourney)
      ) as ReligiousJourney[];
      dataToUpdate.preferredReligiousJourneys = validJourneys;
    }

    if (body.preferredEducation !== undefined) dataToUpdate.preferredEducation = body.preferredEducation || [];
    if (body.preferredOccupations !== undefined) dataToUpdate.preferredOccupations = body.preferredOccupations || [];
    if (body.preferredMaritalStatuses !== undefined) dataToUpdate.preferredMaritalStatuses = body.preferredMaritalStatuses || [];
    if (body.preferredOrigins !== undefined) dataToUpdate.preferredOrigins = body.preferredOrigins || [];
    if (body.preferredServiceTypes !== undefined) dataToUpdate.preferredServiceTypes = body.preferredServiceTypes || [];
    if (body.preferredHeadCoverings !== undefined) dataToUpdate.preferredHeadCoverings = body.preferredHeadCoverings || [];
    if (body.preferredKippahTypes !== undefined) dataToUpdate.preferredKippahTypes = body.preferredKippahTypes || [];
    if (body.preferredCharacterTraits !== undefined) dataToUpdate.preferredCharacterTraits = body.preferredCharacterTraits || [];
    if (body.preferredHobbies !== undefined) dataToUpdate.preferredHobbies = body.preferredHobbies || [];

    // ---- System Fields (always update on save) ----
    dataToUpdate.lastActive = new Date();
    dataToUpdate.contentUpdatedAt = new Date();
    dataToUpdate.needsAiProfileUpdate = true;

    // ---- Perform Update ----
    if (Object.keys(dataToUpdate).length <= 3) {
      console.log(`[mobile/profile] No meaningful data to update for user ${userId}`);
      return corsError(req, "No data provided to update", 400);
    }

    let updatedProfile: Profile;
    try {
      updatedProfile = await prisma.profile.update({
        where: { userId },
        data: dataToUpdate,
      });
    } catch (dbError) {
      console.error("[mobile/profile] Prisma update error:", dbError);
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === "P2025") {
          return corsError(req, "Profile not found", 404);
        }
      }
      throw dbError;
    }

    console.log(`[mobile/profile] PUT success for user ${userId}`);

    return corsJson(req, {
      success: true,
      data: {
        profile: buildProfileResponse(updatedProfile),
      },
    });
  } catch (error) {
    console.error("[mobile/profile] PUT Error:", error);

    if (error instanceof Prisma.PrismaClientValidationError) {
      return corsError(req, "Data validation failed", 400);
    }

    return corsError(req, "Internal server error", 500);
  }
}