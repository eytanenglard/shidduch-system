// File: src/app/api/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Gender, HeadCoveringType, KippahType, ServiceType, ReligiousJourney, AvailabilityStatus } from "@prisma/client";
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
    // אם צוין ID בבקשה, השתמש בו. אחרת, השתמש ב-ID של המשתמש המחובר.
    const targetUserId = requestedUserId || session.user.id;

    // שלוף את המשתמש יחד עם כל המידע המקושר שלו (פרופיל, תמונות, והמלצות)
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
                isMain: 'desc' // ודא שהתמונה הראשית תמיד ראשונה
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

    // בנה את אובייקט התגובה המלא שישלח חזרה ללקוח
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
      
      // שדות הסיפור והתוכן האישי
      about: dbProfile.about || "",
      isAboutVisible: dbProfile.isAboutVisible ?? true,
      profileHeadline: dbProfile.profileHeadline || undefined,
      inspiringCoupleStory: dbProfile.inspiringCoupleStory || undefined,
      influentialRabbi: dbProfile.influentialRabbi || undefined,
      
      // דבר המערכת והמלצות
      manualEntryText: dbProfile.manualEntryText || undefined,
      isNeshamaTechSummaryVisible: dbProfile.isNeshamaTechSummaryVisible ?? true,
      testimonials: dbProfile.testimonials || [],
      isFriendsSectionVisible: dbProfile.isFriendsSectionVisible ?? true,

      // העדפות שידוך
      matchingNotes: dbProfile.matchingNotes || "",
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

      // הגדרות והעדפות מקצועיות
      contactPreference: dbProfile.contactPreference || undefined,
      preferredMatchmakerGender: dbProfile.preferredMatchmakerGender,

      // סטטוס ומידע מערכתי
      isProfileVisible: dbProfile.isProfileVisible,
      isProfileComplete: userWithProfile.isProfileComplete,
      availabilityStatus: dbProfile.availabilityStatus,
      availabilityNote: dbProfile.availabilityNote || "",
      availabilityUpdatedAt: dbProfile.availabilityUpdatedAt ? new Date(dbProfile.availabilityUpdatedAt) : null,
      verifiedBy: dbProfile.verifiedBy || undefined,
      createdAt: new Date(dbProfile.createdAt),
      updatedAt: new Date(dbProfile.updatedAt),
      lastActive: dbProfile.lastActive ? new Date(dbProfile.lastActive) : null,
      hasViewedProfilePreview: dbProfile.hasViewedProfilePreview,
      needsAiProfileUpdate: dbProfile.needsAiProfileUpdate,
      
      // מידע רפואי (חסוי)
      hasMedicalInfo: dbProfile.hasMedicalInfo ?? undefined,
   medicalInfoDetails: dbProfile.isMedicalInfoVisible 
        ? dbProfile.medicalInfoDetails ?? undefined 
        : undefined,      medicalInfoDisclosureTiming: dbProfile.medicalInfoDisclosureTiming ?? undefined,
      isMedicalInfoVisible: dbProfile.isMedicalInfoVisible,
      
      // מידע בסיסי על המשתמש
      user: {
        id: userWithProfile.id,
        firstName: userWithProfile.firstName,
        lastName: userWithProfile.lastName,
        email: userWithProfile.email,
      }
    };
    
    // החזרת תשובה מוצלחת עם כל הנתונים
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