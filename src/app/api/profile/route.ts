// src/app/api/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserProfile } from "@/types/next-auth";
import { sanitizeText } from '@/lib/sanitize';
import { profileUpdateSchema } from '@/lib/validations/profileSchemas';
import { buildProfileResponse } from '@/lib/services/profileService';

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
        profileTags: {
          select: {
            sectionAnswers: true,
            updatedAt: true,
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

    // Build response using shared service
    const profileResponseData = buildProfileResponse(dbProfile, {
      id: userWithProfile.id,
      firstName: userWithProfile.firstName,
      lastName: userWithProfile.lastName,
      email: userWithProfile.email,
      phone: userWithProfile.phone,
      isProfileComplete: userWithProfile.isProfileComplete,
    }, { isOwner });
    
    return NextResponse.json({
      success: true,
      profile: profileResponseData,
      images: userWithProfile.images || [],
      sfAnswers: userWithProfile.profileTags?.sectionAnswers || null,
      sfUpdatedAt: userWithProfile.profileTags?.updatedAt?.toISOString?.() ?? null,
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

    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Cast to any to preserve compatibility with Prisma's strict enum types
    // Zod validation above ensures the data shape is correct at runtime
    const updateData: any = { ...validation.data };

    // Sanitize user-provided text fields
    if (typeof updateData.about === 'string') updateData.about = sanitizeText(updateData.about, 5000);
    if (typeof updateData.profileHeadline === 'string') updateData.profileHeadline = sanitizeText(updateData.profileHeadline, 300);
    if (typeof updateData.inspiringCoupleStory === 'string') updateData.inspiringCoupleStory = sanitizeText(updateData.inspiringCoupleStory, 2000);
    if (typeof updateData.influentialRabbi === 'string') updateData.influentialRabbi = sanitizeText(updateData.influentialRabbi, 200);
    if (typeof updateData.matchingNotes === 'string') updateData.matchingNotes = sanitizeText(updateData.matchingNotes, 5000);
    if (typeof updateData.manualEntryText === 'string') updateData.manualEntryText = sanitizeText(updateData.manualEntryText, 5000);
    if (typeof updateData.availabilityNote === 'string') updateData.availabilityNote = sanitizeText(updateData.availabilityNote, 1000);
    if (typeof updateData.medicalInfoDetails === 'string') updateData.medicalInfoDetails = sanitizeText(updateData.medicalInfoDetails, 5000);
    if (typeof updateData.education === 'string') updateData.education = sanitizeText(updateData.education, 500);
    if (typeof updateData.occupation === 'string') updateData.occupation = sanitizeText(updateData.occupation, 200);
    if (typeof updateData.serviceDetails === 'string') updateData.serviceDetails = sanitizeText(updateData.serviceDetails, 500);
    if (typeof updateData.fatherOccupation === 'string') updateData.fatherOccupation = sanitizeText(updateData.fatherOccupation, 200);
    if (typeof updateData.motherOccupation === 'string') updateData.motherOccupation = sanitizeText(updateData.motherOccupation, 200);
    if (typeof updateData.city === 'string') updateData.city = sanitizeText(updateData.city, 100);
    if (typeof updateData.origin === 'string') updateData.origin = sanitizeText(updateData.origin, 100);

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

    // Build response using shared service
    const profileResponseData = buildProfileResponse(dbProfile, {
      id: userWithProfile.id,
      firstName: userWithProfile.firstName,
      lastName: userWithProfile.lastName,
      email: userWithProfile.email,
      isProfileComplete: userWithProfile.isProfileComplete,
    }, { isOwner: true });

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