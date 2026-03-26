// src/lib/services/profileService.ts
// Single source of truth for building profile response objects from Prisma data

import type { UserProfile } from '@/types/next-auth';

// --- Helpers ---

export const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

export const toRequiredDate = (value: string | number | Date | null | undefined, fieldName: string): Date => {
  if (value === null || value === undefined || String(value).trim() === '') {
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

export const toDateOrNull = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const emptyStringToNull = (value: string | null | undefined): string | null => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return value;
};

// --- Profile Response Builder ---

interface BuildProfileResponseOptions {
  /** Whether the requesting user is the profile owner (affects medical info visibility) */
  isOwner?: boolean;
}

/**
 * Builds a UserProfile response object from Prisma profile + user records.
 * Single source of truth used by both GET /api/profile and PUT /api/profile/update.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProfileResponse(
  dbProfile: any,
  user: { id: string; firstName: string | null; lastName: string | null; email: string; phone?: string | null; isProfileComplete?: boolean },
  options: BuildProfileResponseOptions = {}
): UserProfile {
  const { isOwner = false } = options;

  return {
    id: dbProfile.id,
    userId: dbProfile.userId,
    gender: dbProfile.gender,
    birthDate: dbProfile.birthDate ? new Date(dbProfile.birthDate) : new Date(),
    birthDateIsApproximate: dbProfile.birthDateIsApproximate ?? undefined,
    nativeLanguage: dbProfile.nativeLanguage || undefined,
    additionalLanguages: dbProfile.additionalLanguages || [],
    height: dbProfile.height ?? null,
    city: dbProfile.city || '',
    origin: dbProfile.origin || '',
    aliyaCountry: dbProfile.aliyaCountry || '',
    aliyaYear: dbProfile.aliyaYear ?? null,
    maritalStatus: dbProfile.maritalStatus || undefined,
    hasChildrenFromPrevious: dbProfile.hasChildrenFromPrevious ?? undefined,
    parentStatus: dbProfile.parentStatus || undefined,
    fatherOccupation: dbProfile.fatherOccupation || '',
    motherOccupation: dbProfile.motherOccupation || '',
    siblings: dbProfile.siblings ?? null,
    position: dbProfile.position ?? null,
    educationLevel: dbProfile.educationLevel || undefined,
    education: dbProfile.education || '',
    occupation: dbProfile.occupation || '',
    serviceType: dbProfile.serviceType || undefined,
    serviceDetails: dbProfile.serviceDetails || '',
    religiousLevel: dbProfile.religiousLevel || undefined,
    religiousJourney: dbProfile.religiousJourney || undefined,
    shomerNegiah: dbProfile.shomerNegiah ?? undefined,
    smokingStatus: dbProfile.smokingStatus ?? null,
    preferredSmokingStatus: dbProfile.preferredSmokingStatus ?? null,
    headCovering: dbProfile.headCovering || undefined,
    kippahType: dbProfile.kippahType || undefined,
    profileCharacterTraits: dbProfile.profileCharacterTraits || [],
    profileHobbies: dbProfile.profileHobbies || [],

    about: dbProfile.about || '',
    isAboutVisible: dbProfile.isAboutVisible ?? true,
    profileHeadline: dbProfile.profileHeadline || undefined,
    inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
    influentialRabbi: dbProfile.influentialRabbi || undefined,

    manualEntryText: dbProfile.manualEntryText || undefined,
    isNeshamaTechSummaryVisible: dbProfile.isNeshamaTechSummaryVisible ?? true,
    testimonials: dbProfile.testimonials || [],
    isFriendsSectionVisible: dbProfile.isFriendsSectionVisible ?? true,

    matchingNotes: dbProfile.matchingNotes || '',
    internalMatchmakerNotes: dbProfile.internalMatchmakerNotes || '',
    preferredAgeMin: dbProfile.preferredAgeMin ?? null,
    preferredAgeMax: dbProfile.preferredAgeMax ?? null,
    preferredHeightMin: dbProfile.preferredHeightMin ?? null,
    preferredHeightMax: dbProfile.preferredHeightMax ?? null,
    preferredReligiousLevels: dbProfile.preferredReligiousLevels || [],
    preferredLocations: dbProfile.preferredLocations || [],
    preferredEducation: dbProfile.preferredEducation || [],
    preferredOccupations: dbProfile.preferredOccupations || [],
    preferredMaritalStatuses: dbProfile.preferredMaritalStatuses || [],
    preferredOrigins: dbProfile.preferredOrigins || [],
    preferredServiceTypes: dbProfile.preferredServiceTypes || [],
    preferredHeadCoverings: dbProfile.preferredHeadCoverings || [],
    preferredKippahTypes: dbProfile.preferredKippahTypes || [],
    preferredShomerNegiah: dbProfile.preferredShomerNegiah || undefined,
    preferredPartnerHasChildren: dbProfile.preferredPartnerHasChildren || undefined,
    preferredCharacterTraits: dbProfile.preferredCharacterTraits || [],
    preferredHobbies: dbProfile.preferredHobbies || [],
    preferredAliyaStatus: dbProfile.preferredAliyaStatus || undefined,
    preferredReligiousJourneys: dbProfile.preferredReligiousJourneys ?? [],
    preferredEthnicBackgrounds: dbProfile.preferredEthnicBackgrounds ?? [],

    contactPreference: dbProfile.contactPreference || undefined,
    preferredMatchmakerGender: dbProfile.preferredMatchmakerGender || undefined,

    isProfileVisible: dbProfile.isProfileVisible,
    isProfileComplete: user.isProfileComplete ?? false,
    availabilityStatus: dbProfile.availabilityStatus,
    availabilityNote: dbProfile.availabilityNote || '',
    availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
    verifiedBy: dbProfile.verifiedBy || undefined,
    createdAt: new Date(dbProfile.createdAt),
    updatedAt: new Date(dbProfile.updatedAt),
    contentUpdatedAt: dbProfile.contentUpdatedAt ? new Date(dbProfile.contentUpdatedAt) : null,
    lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
    hasViewedProfilePreview: dbProfile.hasViewedProfilePreview,
    needsAiProfileUpdate: dbProfile.needsAiProfileUpdate,

    hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
    medicalInfoDetails: (isOwner || dbProfile.isMedicalInfoVisible)
      ? dbProfile.medicalInfoDetails ?? undefined
      : undefined,
    medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
    isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
    cvUrl: dbProfile.cvUrl,
    cvSummary: dbProfile.cvSummary,
    aiProfileSummary: dbProfile.aiProfileSummary,

    // Priority/matchmaker fields (may be null on profiles without scoring)
    priorityScore: dbProfile.priorityScore,
    priorityCategory: dbProfile.priorityCategory,
    redFlags: dbProfile.redFlags || [],
    greenFlags: dbProfile.greenFlags || [],
    difficultyScore: dbProfile.difficultyScore,
    readinessLevel: dbProfile.readinessLevel,
    missingFields: dbProfile.missingFields || [],

    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...(user.phone !== undefined ? { phone: user.phone } : {}),
    },
  };
}
