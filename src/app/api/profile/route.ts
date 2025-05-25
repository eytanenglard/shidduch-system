// File: app/api/profile/route.ts (GET handler)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AvailabilityStatus, Gender, HeadCoveringType, KippahType, ServiceType } from "@prisma/client"; // Import enums if needed for casting
import type { UserProfile } from "@/types/next-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let targetUserId: string;
    if (requestedUserId) {
      targetUserId = requestedUserId;
    } else if (session.user.id) {
      targetUserId = session.user.id;
    } else {
       return NextResponse.json(
        { success: false, message: 'User ID not found in session' },
        { status: 400 }
      );
    }

    const userWithProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: {
            id: true,
            userId: true,
            gender: true,
            birthDate: true, // This is DateTime in Prisma
            nativeLanguage: true,
            additionalLanguages: true,
            height: true,
            city: true,
            origin: true,
            aliyaCountry: true,
            aliyaYear: true,
            maritalStatus: true,
            hasChildrenFromPrevious: true,
            parentStatus: true,
            siblings: true,
            position: true,
            educationLevel: true,
            education: true,
            occupation: true,
            serviceType: true,
            serviceDetails: true,
            religiousLevel: true,
            shomerNegiah: true,
            headCovering: true,
            kippahType: true,
            profileCharacterTraits: true,
            profileHobbies: true,
            about: true,
            matchingNotes: true,
            preferredAgeMin: true,
            preferredAgeMax: true,
            preferredHeightMin: true,
            preferredHeightMax: true,
            preferredReligiousLevels: true,
            preferredLocations: true,
            preferredEducation: true,
            preferredOccupations: true,
            contactPreference: true,
            isProfileVisible: true,
            preferredMatchmakerGender: true,
            availabilityStatus: true,
            availabilityNote: true,
            availabilityUpdatedAt: true,
            preferredMaritalStatuses: true,
            preferredOrigins: true,
            preferredServiceTypes: true,
            preferredHeadCoverings: true,
            preferredKippahTypes: true,
            preferredShomerNegiah: true,
            preferredHasChildrenFromPrevious: true,
            preferredCharacterTraits: true, // Assuming this is for partner preferences in Prisma model
            preferredHobbies: true,         // Assuming this is for partner preferences in Prisma model
            preferredAliyaStatus: true,     // Assuming this is for partner preferences in Prisma model
            createdAt: true,
            updatedAt: true,
            lastActive: true,
            verifiedBy: true, // Added this field as it was in UserProfile Omit
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true,
            createdAt: true,
            cloudinaryPublicId: true, // Ensure all UserImage fields are selected
            updatedAt: true,
          }
        }
      }
    });

    if (!userWithProfile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const dbProfile = userWithProfile.profile;

    if (!dbProfile) { // If dbProfile is null, it means no profile record exists.
        // This is a critical data issue if a profile is expected.
        // Depending on your logic, you might return an error or a UserProfile with defaults for a non-existent profile.
        // For now, let's assume if birthDate is required in UserProfile, dbProfile must exist and have it.
        console.error(`Profile data not found for user ID: ${targetUserId}, but UserProfile type requires fields like birthDate.`);
        return NextResponse.json(
            { success: false, message: 'Profile data integrity issue: Core profile data missing.' },
            { status: 500 } // Or 404 if it's acceptable for a profile to not exist
        );
    }

    // If birthDate is NOT nullable in Prisma (DateTime, not DateTime?), then dbProfile.birthDate will be a Date object.
    // If it IS nullable in Prisma (DateTime?), then you need to decide if UserProfile.birthDate can be null.
    // Given the error, UserProfile.birthDate CANNOT be null.
    // So, dbProfile.birthDate from Prisma MUST be a non-null Date.
    if (!dbProfile.birthDate) {
        // This case should ideally not happen if birthDate is non-nullable in Prisma's Profile model
        // and a profile record exists.
        console.error(`birthDate is null or undefined for profile ID: ${dbProfile.id}, which is not allowed by UserProfile type.`);
        return NextResponse.json(
            { success: false, message: 'Data integrity issue: birthDate is missing for the profile.' },
            { status: 500 }
        );
    }


    const profileResponseData: UserProfile = {
      id: dbProfile.id,
      userId: dbProfile.userId,
      gender: dbProfile.gender, // Assuming dbProfile.gender is Gender, not Gender | null
      birthDate: new Date(dbProfile.birthDate), // Directly use new Date() as dbProfile.birthDate is now guaranteed to be non-null
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
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      educationLevel: dbProfile.educationLevel || undefined,
      education: dbProfile.education || "",
      occupation: dbProfile.occupation || "",
      serviceType: dbProfile.serviceType as ServiceType | null || undefined, // Cast if necessary
      serviceDetails: dbProfile.serviceDetails || "",
      religiousLevel: dbProfile.religiousLevel || undefined,
      shomerNegiah: dbProfile.shomerNegiah ?? undefined,
      headCovering: dbProfile.headCovering as HeadCoveringType | null || undefined, // Cast
      kippahType: dbProfile.kippahType as KippahType | null || undefined,       // Cast
      profileCharacterTraits: dbProfile.profileCharacterTraits || [],
      profileHobbies: dbProfile.profileHobbies || [],
      about: dbProfile.about || "",
      matchingNotes: dbProfile.matchingNotes || "",
      preferredAgeMin: dbProfile.preferredAgeMin ?? null,
      preferredAgeMax: dbProfile.preferredAgeMax ?? null,
      preferredHeightMin: dbProfile.preferredHeightMin ?? null,
      preferredHeightMax: dbProfile.preferredHeightMax ?? null,
      preferredReligiousLevels: dbProfile.preferredReligiousLevels || [],
      preferredLocations: dbProfile.preferredLocations || [],
      preferredEducation: dbProfile.preferredEducation || [],
      preferredOccupations: dbProfile.preferredOccupations || [],
      contactPreference: dbProfile.contactPreference || undefined,
      isProfileVisible: dbProfile.isProfileVisible, // Assuming non-nullable boolean from Prisma
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender as Gender | null || undefined, // Cast
      availabilityStatus: dbProfile.availabilityStatus, // Assuming non-nullable enum from Prisma
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      preferredMaritalStatuses: dbProfile.preferredMaritalStatuses || [],
      preferredOrigins: dbProfile.preferredOrigins || [],
      preferredServiceTypes: (dbProfile.preferredServiceTypes as ServiceType[]) || [],
      preferredHeadCoverings: (dbProfile.preferredHeadCoverings as HeadCoveringType[]) || [],
      preferredKippahTypes: (dbProfile.preferredKippahTypes as KippahType[]) || [],
      preferredShomerNegiah: dbProfile.preferredShomerNegiah || undefined, // This was string in your old UserProfile
      preferredHasChildrenFromPrevious: dbProfile.preferredHasChildrenFromPrevious ?? undefined,
      preferredCharacterTraits: dbProfile.preferredCharacterTraits || [], // Partner preference
      preferredHobbies: dbProfile.preferredHobbies || [],                 // Partner preference
      preferredAliyaStatus: dbProfile.preferredAliyaStatus || undefined,
      verifiedBy: dbProfile.verifiedBy || undefined, // Added from Omit
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
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
    console.error('Profile fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching profile.';
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}