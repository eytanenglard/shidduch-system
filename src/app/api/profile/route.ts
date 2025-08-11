// File: app/api/profile/route.ts (GET handler)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Gender, HeadCoveringType, KippahType, ServiceType, ReligiousJourney  } from "@prisma/client"; // Import enums if needed for casting
import type { UserProfile } from "@/types/next-auth";
export const dynamic = 'force-dynamic';
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
        isProfileComplete: true, // <--- FIX 1: Select the isProfileComplete field from the User model.
        profile: {
          select: {
            id: true,
            userId: true,
            gender: true,
            birthDate: true,
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
            fatherOccupation: true,
            motherOccupation: true,
            siblings: true,
            position: true,
            educationLevel: true,
            education: true,
            occupation: true,
            serviceType: true,
            serviceDetails: true,
            religiousLevel: true,
            religiousJourney: true,
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
                        preferredReligiousJourneys: true,

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
            preferredCharacterTraits: true,
            preferredHobbies: true,
            preferredAliyaStatus: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
            verifiedBy: true,
            hasViewedProfilePreview: true,
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true,
            createdAt: true,
            cloudinaryPublicId: true,
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

    if (!dbProfile) {
        console.error(`Profile data not found for user ID: ${targetUserId}`);
        return NextResponse.json(
            { success: false, message: 'Profile data not found for user.' },
            { status: 404 }
        );
    }

    if (!dbProfile.birthDate) {
        console.error(`birthDate is null or undefined for profile ID: ${dbProfile.id}`);
        return NextResponse.json(
            { success: false, message: 'Data integrity issue: birthDate is missing for the profile.' },
            { status: 500 }
        );
    }

    const profileResponseData: UserProfile = {
      id: dbProfile.id,
      userId: dbProfile.userId,
      gender: dbProfile.gender,
      birthDate: new Date(dbProfile.birthDate),
      nativeLanguage: dbProfile.nativeLanguage || undefined,
      additionalLanguages: dbProfile.additionalLanguages || [],
      height: dbProfile.height ?? null,
      city: dbProfile.city || "",
      origin: dbProfile.origin || "",
      aliyaCountry: dbProfile.aliyaCountry || "",
      aliyaYear: dbProfile.aliyaYear ?? null,
      maritalStatus: dbProfile.maritalStatus || undefined,
      hasChildrenFromPrevious: dbProfile.hasChildrenFromPrevious ?? undefined,
       fatherOccupation: dbProfile.fatherOccupation || "",
      motherOccupation: dbProfile.motherOccupation || "",
      parentStatus: dbProfile.parentStatus || undefined,
      siblings: dbProfile.siblings ?? null,
      position: dbProfile.position ?? null,
      educationLevel: dbProfile.educationLevel || undefined,
      education: dbProfile.education || "",
      occupation: dbProfile.occupation || "",
      serviceType: dbProfile.serviceType as ServiceType | null || undefined,
      serviceDetails: dbProfile.serviceDetails || "",
      religiousLevel: dbProfile.religiousLevel || undefined,
      
      religiousJourney: dbProfile.religiousJourney || undefined,
      shomerNegiah: dbProfile.shomerNegiah ?? undefined,
      headCovering: dbProfile.headCovering as HeadCoveringType | null || undefined,
      kippahType: dbProfile.kippahType as KippahType | null || undefined,
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
      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: userWithProfile.isProfileComplete, // <--- FIX 2: Add the property to the response object.
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender as Gender | null || undefined,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
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
            preferredReligiousJourneys: dbProfile.preferredReligiousJourneys ?? [],

      verifiedBy: dbProfile.verifiedBy || undefined,
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview,
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