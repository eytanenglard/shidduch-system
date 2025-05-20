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
            education: true, // תיאור טקסטואלי
            educationLevel: true, // רמת השכלה מובנית
            // address: true, // הוסר מ-UserProfile
            city: true,
            origin: true,
            religiousLevel: true,
            about: true,
            // hobbies: true, // הוסר (הוחלף ב-profileHobbies)

            // --- שדות חדשים מ-UserProfile ---
            shomerNegiah: true,
            serviceType: true,
            serviceDetails: true,
            headCovering: true, // לנשים
            kippahType: true, // לגברים
            hasChildrenFromPrevious: true,
            profileCharacterTraits: true,
            profileHobbies: true,
            aliyaCountry: true,
            aliyaYear: true,
            
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

    const formattedUsers = users.map(user => {
      // Since profile is guaranteed by `isNot: null`, user.profile will exist.
      const profile = user.profile!; 

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        isVerified: user.isVerified,
        images: user.images,
        profile: {
          ...profile,
          birthDate: profile.birthDate.toISOString(), // birthDate is Date, non-null in UserProfile
          lastActive: profile.lastActive?.toISOString(),
          availabilityUpdatedAt: profile.availabilityUpdatedAt?.toISOString(),
          createdAt: profile.createdAt.toISOString(), // createdAt is Date, non-null in UserProfile
          updatedAt: profile.updatedAt.toISOString(), // updatedAt is Date, non-null in UserProfile
          user: { // This field is part of the UserProfile type definition
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        }
      };
    });

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
