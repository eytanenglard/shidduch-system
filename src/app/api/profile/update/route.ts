// File: app/api/profile/update/route.ts (or your specific path)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Prisma,
  Gender,
  ServiceType,
  HeadCoveringType,
  KippahType,
  AvailabilityStatus,
} from "@prisma/client";
import type { UserProfile } from "@/types/next-auth"; // Assuming UserProfile type is defined

// Helper to convert to number or null
// הטיפוס של value יכול להיות מחרוזת, מספר, null, או undefined, במיוחד כשמגיע מ-form data או JSON.
const toNumberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Helper to convert to Date or null
// הטיפוס של value יכול להיות מחרוזת תאריך, מספר (timestamp), אובייקט Date, null, או undefined.
const toDateOrNull = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  // If it's already a Date object and valid, return it
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value); // Works for strings (date strings) and numbers (timestamps)
  return isNaN(date.getTime()) ? null : date;
};


export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body", error },
        { status: 400 }
      );
    }

    const {
      // Fields from UserProfile that are updatable
      gender,
      birthDate,
      nativeLanguage,
      additionalLanguages,
      height,
      maritalStatus,
      occupation,
      education,
      educationLevel,
      city,
      origin,
      religiousLevel,
      about,
      parentStatus,
      siblings,
      position,
      isProfileVisible,
      preferredMatchmakerGender,
      availabilityStatus,
      availabilityNote,
      availabilityUpdatedAt,
      matchingNotes,
      shomerNegiah,
      serviceType,
      serviceDetails,
      headCovering,
      kippahType,
      hasChildrenFromPrevious,
      profileCharacterTraits,
      profileHobbies,
      aliyaCountry,
      aliyaYear,
      preferredAgeMin,
      preferredAgeMax,
      preferredHeightMin,
      preferredHeightMax,
      preferredReligiousLevels,
      preferredLocations,
      preferredEducation,
      preferredOccupations,
      contactPreference,
    } = body as Partial<UserProfile>; // Type assertion for easier access

    // Construct the data payload for Prisma update
    const dataToUpdate: Prisma.ProfileUpdateInput = {};

    // --- Personal & Demographic ---
    if (gender !== undefined) dataToUpdate.gender = gender as Gender;
    if (birthDate !== undefined) {
        const bd = toDateOrNull(birthDate);
        if (bd) dataToUpdate.birthDate = bd;
    }
    if (nativeLanguage !== undefined) dataToUpdate.nativeLanguage = nativeLanguage === "" ? null : nativeLanguage;
    if (additionalLanguages !== undefined) dataToUpdate.additionalLanguages = additionalLanguages || [];
    if (height !== undefined) dataToUpdate.height = toNumberOrNull(height);
    if (city !== undefined) dataToUpdate.city = city === "" ? null : city;
    if (origin !== undefined) dataToUpdate.origin = origin === "" ? null : origin;
    if (aliyaCountry !== undefined) dataToUpdate.aliyaCountry = aliyaCountry === "" ? null : aliyaCountry;
    if (aliyaYear !== undefined) dataToUpdate.aliyaYear = toNumberOrNull(aliyaYear);

    // --- Marital Status & Background ---
    if (maritalStatus !== undefined) dataToUpdate.maritalStatus = maritalStatus === "" ? null : maritalStatus;
    if (hasChildrenFromPrevious !== undefined) dataToUpdate.hasChildrenFromPrevious = hasChildrenFromPrevious;
    if (parentStatus !== undefined) dataToUpdate.parentStatus = parentStatus === "" ? null : parentStatus;
    if (siblings !== undefined) dataToUpdate.siblings = toNumberOrNull(siblings);
    if (position !== undefined) dataToUpdate.position = toNumberOrNull(position);

    // --- Education, Occupation & Service ---
    if (educationLevel !== undefined) dataToUpdate.educationLevel = educationLevel === "" ? null : educationLevel;
    if (education !== undefined) dataToUpdate.education = education === "" ? null : education;
    if (occupation !== undefined) dataToUpdate.occupation = occupation === "" ? null : occupation;
    if (serviceType !== undefined) dataToUpdate.serviceType = serviceType as ServiceType || null;
    if (serviceDetails !== undefined) dataToUpdate.serviceDetails = serviceDetails === "" ? null : serviceDetails;

    // --- Religion & Lifestyle ---
    if (religiousLevel !== undefined) dataToUpdate.religiousLevel = religiousLevel === "" ? null : religiousLevel;
    if (shomerNegiah !== undefined) dataToUpdate.shomerNegiah = shomerNegiah;
    
    if (gender !== undefined) { // Only adjust gender-specific fields if gender is part of the update
        if (gender === Gender.FEMALE) {
            if (headCovering !== undefined) dataToUpdate.headCovering = headCovering as HeadCoveringType || null;
            dataToUpdate.kippahType = null; 
        } else if (gender === Gender.MALE) {
            if (kippahType !== undefined) dataToUpdate.kippahType = kippahType as KippahType || null;
            dataToUpdate.headCovering = null;
        } else { // If gender is being set to null or an unexpected value (though Gender enum should prevent this)
            dataToUpdate.headCovering = null;
            dataToUpdate.kippahType = null;
        }
    } else { // Gender is not being updated, handle headCovering/kippahType if they are sent independently
        // This assumes client might send these even if gender isn't changing,
        // or that the current gender is known and these fields are relevant.
        // To be safer, you might want to fetch current profile's gender if not provided in update.
        if (headCovering !== undefined) dataToUpdate.headCovering = headCovering as HeadCoveringType || null;
        if (kippahType !== undefined) dataToUpdate.kippahType = kippahType as KippahType || null;
    }
    
    if (preferredMatchmakerGender !== undefined) dataToUpdate.preferredMatchmakerGender = preferredMatchmakerGender as Gender || null;

    // --- Traits & Hobbies ---
    if (profileCharacterTraits !== undefined) dataToUpdate.profileCharacterTraits = profileCharacterTraits || [];
    if (profileHobbies !== undefined) dataToUpdate.profileHobbies = profileHobbies || [];

    // --- About & Additional Info ---
    if (about !== undefined) dataToUpdate.about = about === "" ? null : about;
    if (matchingNotes !== undefined) dataToUpdate.matchingNotes = matchingNotes === "" ? null : matchingNotes;
    
    // --- Preferences (related to matching) ---
    if (preferredAgeMin !== undefined) dataToUpdate.preferredAgeMin = toNumberOrNull(preferredAgeMin);
    if (preferredAgeMax !== undefined) dataToUpdate.preferredAgeMax = toNumberOrNull(preferredAgeMax);
    if (preferredHeightMin !== undefined) dataToUpdate.preferredHeightMin = toNumberOrNull(preferredHeightMin);
    if (preferredHeightMax !== undefined) dataToUpdate.preferredHeightMax = toNumberOrNull(preferredHeightMax);
    if (preferredReligiousLevels !== undefined) dataToUpdate.preferredReligiousLevels = preferredReligiousLevels || [];
    if (preferredLocations !== undefined) dataToUpdate.preferredLocations = preferredLocations || [];
    if (preferredEducation !== undefined) dataToUpdate.preferredEducation = preferredEducation || [];
    if (preferredOccupations !== undefined) dataToUpdate.preferredOccupations = preferredOccupations || [];
    if (contactPreference !== undefined) dataToUpdate.contactPreference = contactPreference === "" ? null : contactPreference;
    
    // --- Profile Management ---
    if (isProfileVisible !== undefined) dataToUpdate.isProfileVisible = isProfileVisible;
    if (availabilityStatus !== undefined) dataToUpdate.availabilityStatus = availabilityStatus as AvailabilityStatus || AvailabilityStatus.AVAILABLE;
    if (availabilityNote !== undefined) dataToUpdate.availabilityNote = availabilityNote === "" ? null : availabilityNote;
    
    // Update availabilityUpdatedAt if availabilityStatus changes or if explicitly provided
    let updateAvailabilityTimestamp = false;
    if (availabilityUpdatedAt !== undefined) {
        const au = toDateOrNull(availabilityUpdatedAt);
        if (au) {
            dataToUpdate.availabilityUpdatedAt = au;
            updateAvailabilityTimestamp = true; // Mark as updated even if by explicit value
        }
    }
    if (availabilityStatus !== undefined && !updateAvailabilityTimestamp) {
        // If availabilityStatus is being updated, and availabilityUpdatedAt was not explicitly set
        dataToUpdate.availabilityUpdatedAt = new Date();
    }


    // Ensure lastActive is updated
    dataToUpdate.lastActive = new Date();


    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: true,
        images: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!refreshedUser || !refreshedUser.profile) {
      return NextResponse.json(
        { success: false, message: "Failed to retrieve updated profile after update." },
        { status: 500 }
      );
    }

    const responseUserProfile: UserProfile = {
      ...refreshedUser.profile,
      birthDate: new Date(refreshedUser.profile.birthDate),
      createdAt: new Date(refreshedUser.profile.createdAt),
      updatedAt: new Date(refreshedUser.profile.updatedAt),
      lastActive: refreshedUser.profile.lastActive ? new Date(refreshedUser.profile.lastActive) : null,
      availabilityUpdatedAt: refreshedUser.profile.availabilityUpdatedAt ? new Date(refreshedUser.profile.availabilityUpdatedAt) : null,
      user: {
        firstName: refreshedUser.firstName,
        lastName: refreshedUser.lastName,
        email: refreshedUser.email,
      },
      // images: refreshedUser.images, // uncomment if UserProfile includes images directly
      // mainImage: refreshedUser.images.find(img => img.isMain) || null, // uncomment if UserProfile includes mainImage
    };

    return NextResponse.json({
      success: true,
      profile: responseUserProfile,
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
         return NextResponse.json({ success: false, message: `A profile with this ${error.meta.target} already exists.` }, { status: 409 });
      }
      if (error.code === 'P2025') { 
        return NextResponse.json({ success: false, message: 'Profile not found for this user.' }, { status: 404 });
      }
      return NextResponse.json(
        { success: false, message: 'Database operation failed.', code: error.code, details: error.message },
        { status: 400 }
      );
    } 
    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
          { success: false, message: 'Data validation failed.', details: error.message },
          { status: 400 }
        );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message || 'An unexpected error occurred.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}