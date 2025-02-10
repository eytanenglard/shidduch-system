import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {  // Removed unused req parameter
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // שליפת כל המועמדים הפעילים שיש להם פרופיל
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: 'CANDIDATE',
        profile: {
          isNot: null  // רק משתמשים עם פרופיל
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isVerified: true,
        images: {
          select: {
            id: true,
            url: true,
            isMain: true
          }
        },
        profile: {
          select: {
            id: true,
            gender: true,
            birthDate: true,
            nativeLanguage: true,
            additionalLanguages: true,
            height: true,
            maritalStatus: true,
            occupation: true,
            education: true,
            address: true,
            city: true,
            origin: true,
            religiousLevel: true,
            about: true,
            hobbies: true,
            parentStatus: true,
            siblings: true,
            position: true,
            preferredAgeMin: true,
            preferredAgeMax: true,
            preferredHeightMin: true,
            preferredHeightMax: true,
            preferredReligiousLevels: true,
            preferredLocations: true,
            preferredEducation: true,
            preferredOccupations: true,
            contactPreference: true,
            referenceName1: true,
            referencePhone1: true,
            referenceName2: true,
            referencePhone2: true,
            isProfileVisible: true,
            preferredMatchmakerGender: true,
            matchingNotes: true,
            verifiedBy: true,
            availabilityStatus: true,
            availabilityNote: true,
            availabilityUpdatedAt: true,
            lastActive: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      isVerified: user.isVerified,
      images: user.images,
      profile: {
        ...user.profile,
        birthDate: user.profile?.birthDate,
        lastActive: user.profile?.lastActive?.toISOString(),
        availabilityUpdatedAt: user.profile?.availabilityUpdatedAt?.toISOString(),
        createdAt: user.profile?.createdAt?.toISOString(),
        updatedAt: user.profile?.updatedAt?.toISOString(),
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      }
    }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        clients: formattedUsers,
        count: formattedUsers.length
      }),
      { status: 200 }
    );

  } catch (error: Error | unknown) {  // Added proper type annotation
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Profile fetch error:', errorMessage);
    
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500 }
    );
  }
}