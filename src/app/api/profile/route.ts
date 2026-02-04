// src/app/api/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserProfile } from "@/types/next-auth";

// הגדרה זו מבטיחה שה-Route Handler ירוץ תמיד מחדש ולא ישמר ב-Cache.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    const session = await getServerSession(authOptions);
    
    // ודא שהמשתמש מחובר. נדרש סשן כדי לגשת לכל פרופיל.
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // קבע עבור איזה משתמש נשלפים הנתונים:
    const targetUserId = requestedUserId || session.user.id;
    
    // ✨ FIX: Check if the requester is the owner of the profile
    const isOwner = session.user.id === targetUserId;

    // שלוף את המשתמש יחד עם כל המידע המקושר שלו
    const userWithProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: {
          include: {
            testimonials: {
              orderBy: {
                createdAt: 'desc',
              }
            }
          }
        },
        images: {
            orderBy: {
                isMain: 'desc' 
            }
        },
      }
    });

    if (!userWithProfile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const dbProfile = userWithProfile.profile;

    if (!dbProfile) {
        return NextResponse.json(
            { success: false, message: 'Profile data not found for user.' },
            { status: 404 }
        );
    }

    // בנה את אובייקט התגובה המלא שישלח חזרה ללקוח
    const profileResponseData: UserProfile = {
      id: dbProfile.id,
      userId: dbProfile.userId,
      gender: dbProfile.gender,
      birthDate: dbProfile.birthDate ? new Date(dbProfile.birthDate) : new Date(), // Fallback if missing, though integrity check exists
      nativeLanguage: dbProfile.nativeLanguage || undefined,
      additionalLanguages: dbProfile.additionalLanguages || [],
      height: dbProfile.height ?? null,
      city: dbProfile.city || "",
      origin: dbProfile.origin || "",
      aliyaCountry: dbProfile.aliyaCountry || "",
      aliyaYear: dbProfile.aliyaYear ?? null,
      maritalStatus: dbProfile.maritalStatus || undefined,
      hasChildrenFromPrevious: dbProfile.hasChildrenFromPrevious ?? undefined,
      parentStatus: dbProfile.parentStatus || undefined,
      fatherOccupation: dbProfile.fatherOccupation || "",
      motherOccupation: dbProfile.motherOccupation || "",
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      educationLevel: dbProfile.educationLevel || undefined,
      education: dbProfile.education || "",
      occupation: dbProfile.occupation || "",
      serviceType: dbProfile.serviceType,
      serviceDetails: dbProfile.serviceDetails || "",
      religiousLevel: dbProfile.religiousLevel || undefined,
      religiousJourney: dbProfile.religiousJourney,
      shomerNegiah: dbProfile.shomerNegiah ?? undefined,
      headCovering: dbProfile.headCovering,
      kippahType: dbProfile.kippahType,
      profileCharacterTraits: dbProfile.profileCharacterTraits || [],
      profileHobbies: dbProfile.profileHobbies || [],
      
      about: dbProfile.about || "",
      isAboutVisible: dbProfile.isAboutVisible ?? true,
      profileHeadline: dbProfile.profileHeadline || undefined,
      inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
      influentialRabbi: dbProfile.influentialRabbi || undefined,
      
      manualEntryText: dbProfile.manualEntryText || undefined,
      isNeshamaTechSummaryVisible: dbProfile.isNeshamaTechSummaryVisible ?? true,
      testimonials: dbProfile.testimonials || [],
      isFriendsSectionVisible: dbProfile.isFriendsSectionVisible ?? true,

      matchingNotes: dbProfile.matchingNotes || "",
      internalMatchmakerNotes: dbProfile.internalMatchmakerNotes || "", // ✅ FIX: Added missing field
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

      contactPreference: dbProfile.contactPreference || undefined,
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender,

      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: userWithProfile.isProfileComplete,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      verifiedBy: dbProfile.verifiedBy || undefined,
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
      contentUpdatedAt: dbProfile.contentUpdatedAt ? new Date(dbProfile.contentUpdatedAt) : null, 
      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview,
      needsAiProfileUpdate: dbProfile.needsAiProfileUpdate,
      
      hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
      // ✨ FIX: Allow owner to see details even if hidden
      medicalInfoDetails: (isOwner || dbProfile.isMedicalInfoVisible)
        ? dbProfile.medicalInfoDetails ?? undefined 
        : undefined,      
      medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
      isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
      cvUrl: dbProfile.cvUrl,
      cvSummary: dbProfile.cvSummary,
      aiProfileSummary: dbProfile.aiProfileSummary,

      user: {
        id: userWithProfile.id,
        firstName: userWithProfile.firstName,
        lastName: userWithProfile.lastName,
        email: userWithProfile.email,
        phone: userWithProfile.phone,
      }
    };
    
    return NextResponse.json({
      success: true,
      profile: profileResponseData,
      images: userWithProfile.images || []
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching profile.';
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// ========================================================================
// ✨ PUT/PATCH Handler - Update Profile
// ========================================================================
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updateData = { ...body };

    // ✅ FIX: Clean medical fields if hasMedicalInfo is false
    if (updateData.hasMedicalInfo === false) {
      updateData.medicalInfoDetails = null;
      updateData.medicalInfoDisclosureTiming = null;
      updateData.isMedicalInfoVisible = false;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.user;
    delete updateData.testimonials;

    // Convert Date strings to Date objects if needed
    if (updateData.birthDate && typeof updateData.birthDate === 'string') {
      updateData.birthDate = new Date(updateData.birthDate);
    }
    if (updateData.availabilityUpdatedAt && typeof updateData.availabilityUpdatedAt === 'string') {
      updateData.availabilityUpdatedAt = new Date(updateData.availabilityUpdatedAt);
    }

    // Update the profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        contentUpdatedAt: new Date(),
      },
      include: {
        testimonials: {
          orderBy: {
            createdAt: 'desc',
          }
        }
      }
    });

    // Get the full user data for response
    const userWithProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            testimonials: {
              orderBy: {
                createdAt: 'desc',
              }
            }
          }
        },
        images: {
          orderBy: {
            isMain: 'desc'
          }
        }
      }
    });

    if (!userWithProfile?.profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found after update' },
        { status: 404 }
      );
    }

    const dbProfile = userWithProfile.profile;

    // Build response (same structure as GET)
    const profileResponseData: UserProfile = {
      id: dbProfile.id,
      userId: dbProfile.userId,
      gender: dbProfile.gender,
      birthDate: dbProfile.birthDate ? new Date(dbProfile.birthDate) : new Date(),
      nativeLanguage: dbProfile.nativeLanguage || undefined,
      additionalLanguages: dbProfile.additionalLanguages || [],
      height: dbProfile.height ?? null,
      city: dbProfile.city || "",
      origin: dbProfile.origin || "",
      aliyaCountry: dbProfile.aliyaCountry || "",
      aliyaYear: dbProfile.aliyaYear ?? null,
      maritalStatus: dbProfile.maritalStatus || undefined,
      hasChildrenFromPrevious: dbProfile.hasChildrenFromPrevious ?? undefined,
      parentStatus: dbProfile.parentStatus || undefined,
      fatherOccupation: dbProfile.fatherOccupation || "",
      motherOccupation: dbProfile.motherOccupation || "",
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      educationLevel: dbProfile.educationLevel || undefined,
      education: dbProfile.education || "",
      occupation: dbProfile.occupation || "",
      serviceType: dbProfile.serviceType,
      serviceDetails: dbProfile.serviceDetails || "",
      religiousLevel: dbProfile.religiousLevel || undefined,
      religiousJourney: dbProfile.religiousJourney,
      shomerNegiah: dbProfile.shomerNegiah ?? undefined,
      headCovering: dbProfile.headCovering,
      kippahType: dbProfile.kippahType,
      profileCharacterTraits: dbProfile.profileCharacterTraits || [],
      profileHobbies: dbProfile.profileHobbies || [],
      
      about: dbProfile.about || "",
      isAboutVisible: dbProfile.isAboutVisible ?? true,
      profileHeadline: dbProfile.profileHeadline || undefined,
      inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
      influentialRabbi: dbProfile.influentialRabbi || undefined,
      
      manualEntryText: dbProfile.manualEntryText || undefined,
      isNeshamaTechSummaryVisible: dbProfile.isNeshamaTechSummaryVisible ?? true,
      testimonials: dbProfile.testimonials || [],
      isFriendsSectionVisible: dbProfile.isFriendsSectionVisible ?? true,

      matchingNotes: dbProfile.matchingNotes || "",
       internalMatchmakerNotes: dbProfile.internalMatchmakerNotes || "", 
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
      preferredCharacterTraits: dbProfile.preferredCharacterTraits || [],
      preferredHobbies: dbProfile.preferredHobbies || [],
      preferredAliyaStatus: dbProfile.preferredAliyaStatus || undefined,
      preferredReligiousJourneys: dbProfile.preferredReligiousJourneys ?? [],

      contactPreference: dbProfile.contactPreference || undefined,
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender,

      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: userWithProfile.isProfileComplete,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      verifiedBy: dbProfile.verifiedBy || undefined,
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
            contentUpdatedAt: new Date(), // או להשתמש בערך מה-updatedProfile אם שלפת אותו

      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview,
      needsAiProfileUpdate: dbProfile.needsAiProfileUpdate,
      
      hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
      medicalInfoDetails: dbProfile.medicalInfoDetails ?? undefined,
      medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
      isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
      cvUrl: dbProfile.cvUrl,
      cvSummary: dbProfile.cvSummary,
      aiProfileSummary: dbProfile.aiProfileSummary,
  priorityScore: dbProfile.priorityScore,
  priorityCategory: dbProfile.priorityCategory,
  redFlags: dbProfile.redFlags || [],
  greenFlags: dbProfile.greenFlags || [],
  difficultyScore: dbProfile.difficultyScore,
  readinessLevel: dbProfile.readinessLevel,
  missingFields: dbProfile.missingFields || [],
      user: {
        id: userWithProfile.id,
        firstName: userWithProfile.firstName,
        lastName: userWithProfile.lastName,
        email: userWithProfile.email,
      }
    };

    return NextResponse.json({
      success: true,
      profile: profileResponseData,
      images: userWithProfile.images || []
    });

  } catch (error) {
    console.error('Profile update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while updating profile.';
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH is an alias for PUT in this case
export async function PATCH(req: Request) {
  return PUT(req);
}