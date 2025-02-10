import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserProfile } from "@/types/next-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userQuery = requestedUserId 
      ? { id: requestedUserId }
      : { email: session.user.email };

    const user = await prisma.user.findUnique({
      where: userQuery,
      include: {
        profile: true,
        images: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userProfile = user.profile as unknown as UserProfile;

    const profile = {
      ...userProfile,
      // Personal Information
      gender:userProfile?.gender|| null,
      birthDate:userProfile?.birthDate|| null,
      nativeLanguage: userProfile?.nativeLanguage || null,
      additionalLanguages: userProfile?.additionalLanguages || [],
      height: userProfile?.height || null,
      maritalStatus: userProfile?.maritalStatus || null,
      occupation: userProfile?.occupation || "",
      education: userProfile?.education || "",
      address: userProfile?.address || null,
      city: userProfile?.city || null,
      origin: userProfile?.origin || null,
      religiousLevel: userProfile?.religiousLevel || null,
      about: userProfile?.about || null,
      hobbies: userProfile?.hobbies || null,

      // Family Information
      parentStatus: userProfile?.parentStatus || null,
      siblings: userProfile?.siblings || null,
      position: userProfile?.position || null,

      // Matching Preferences
      preferredAgeMin: userProfile?.preferredAgeMin || null,
      preferredAgeMax: userProfile?.preferredAgeMax || null,
      preferredHeightMin: userProfile?.preferredHeightMin || null,
      preferredHeightMax: userProfile?.preferredHeightMax || null,
      preferredReligiousLevels: userProfile?.preferredReligiousLevels || [],
      preferredLocations: userProfile?.preferredLocations || [],
      preferredEducation: userProfile?.preferredEducation || [],
      preferredOccupations: userProfile?.preferredOccupations || [],

      // Contact and References
      contactPreference: userProfile?.contactPreference || null,
      referenceName1: userProfile?.referenceName1 || "",
      referencePhone1: userProfile?.referencePhone1 || "",
      referenceName2: userProfile?.referenceName2 || "",
      referencePhone2: userProfile?.referencePhone2 || "",

      // Profile Settings
      isProfileVisible: userProfile?.isProfileVisible ?? true,
      preferredMatchmakerGender: userProfile?.preferredMatchmakerGender || null,
      matchingNotes: userProfile?.matchingNotes || null,
      verifiedBy: userProfile?.verifiedBy || null,

      // Availability Status
      availabilityStatus: userProfile?.availabilityStatus || 'AVAILABLE',
      availabilityNote: userProfile?.availabilityNote || null,
      availabilityUpdatedAt: userProfile?.availabilityUpdatedAt || null,

      // System Fields
      createdAt: userProfile?.createdAt || new Date(),
      updatedAt: userProfile?.updatedAt || new Date(),
      lastActive: userProfile?.lastActive || null,

      // User Information
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    };

    return NextResponse.json({
      success: true,
      profile,
      images: user.images
    });

  } catch (error) {
    console.error('Profile fetch error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}