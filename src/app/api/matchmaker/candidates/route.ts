import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client"; // Added UserRole

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // ---- START OF CHANGE ----
    if (!session?.user?.id) { // Check for user ID as well
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Not logged in' }),
        { status: 401 }
      );
    }

    // Fetch user role for permission check
    const performingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!performingUser || !allowedRoles.includes(performingUser.role)) {
        return new NextResponse(
            JSON.stringify({ error: 'Unauthorized - Matchmaker or Admin access required' }),
            { status: 403 }
        );
    }
    // ---- END OF CHANGE ----

    // שליפת כל המועמדים הפעילים שיש להם פרופיל
   const users = await prisma.user.findMany({
  where: {
    // --- START OF CHANGE ---
    // שינינו את התנאי כדי לכלול את כל המשתמשים שאינם חסומים או לא פעילים.
    // זה יכלול משתמשים בסטטוס 'ACTIVE', 'PENDING_PHONE_VERIFICATION' וכו'.
    status: {
      notIn: ['BLOCKED', 'INACTIVE']
    },
    // --- END OF CHANGE ---
    role: 'CANDIDATE',
    profile: {
      isNot: null  // נשאיר את התנאי הזה כדי להבטיח שלמשתמש יש רשומת פרופיל כלשהי, גם אם חלקית
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
          },
          orderBy: [{isMain: 'desc'}, {createdAt: 'asc'}] // Main image first
        },
        profile: {
          select: {
            id: true,
            gender: true,
            birthDate: true,
             birthDateIsApproximate: true,
            nativeLanguage: true,
            additionalLanguages: true,
            height: true,
            maritalStatus: true,
            occupation: true,
            education: true, 
            educationLevel: true, 
            city: true,
            origin: true,
            religiousLevel: true,
            about: true,
            shomerNegiah: true,
            serviceType: true,
            serviceDetails: true,
            headCovering: true, 
            kippahType: true, 
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
          birthDate: profile.birthDate.toISOString(), 
          lastActive: profile.lastActive?.toISOString(),
          availabilityUpdatedAt: profile.availabilityUpdatedAt?.toISOString(),
          createdAt: profile.createdAt.toISOString(), 
          updatedAt: profile.updatedAt.toISOString(), 
          // user: { // This field is part of the UserProfile type definition - consider if needed client-side
          //   firstName: user.firstName,
          //   lastName: user.lastName,
          //   email: user.email
          // }
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

  } catch (error: Error | unknown) {  
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