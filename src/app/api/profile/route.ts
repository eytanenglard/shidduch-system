// --- START OF FILE route.ts (Updated) ---
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AvailabilityStatus } from "@prisma/client"; // Using Prisma enums directly if possible, or your defined types
import { UserProfile } from "@/types/next-auth";
// It's often better to use Prisma's generated types for UserProfile if it includes relations
// or define a more specific type for the response payload.
// For this example, I'll assume your imported UserProfile type is sufficient for the structure.

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

    // Determine the target user for the query
    let targetUserId: string;
    if (requestedUserId) {
      // If a specific userId is requested (e.g., by a matchmaker)
      // Here you might add authorization logic to check if the session.user has permission
      // to view requestedUserId's profile. For now, assuming it's allowed.
      targetUserId = requestedUserId;
    } else if (session.user.id) {
      // If no specific userId, fetch the profile of the logged-in user
      targetUserId = session.user.id;
    } else {
      // Fallback if session.user.id is not available for some reason (should not happen with proper auth)
       return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId }, // Query by the determined target user's ID
      include: {
        profile: { // Select only the necessary fields from the profile
          select: {
            id: true,
            // Personal Information & Demographics
            gender: true,
            birthDate: true,
            nativeLanguage: true,
            additionalLanguages: true,
            height: true,
            city: true,
            origin: true,
            aliyaCountry: true,
            aliyaYear: true,
            
            // Marital Status & Background
            maritalStatus: true,
            hasChildrenFromPrevious: true,
            parentStatus: true,
            siblings: true,
            position: true,

            // Education, Occupation & Service
            educationLevel: true,
            education: true, // Details of education
            occupation: true,
            serviceType: true,
            serviceDetails: true,

            // Religion & Lifestyle
            religiousLevel: true,
            shomerNegiah: true,
            headCovering: true, // For women
            kippahType: true,   // For men
            
            // Character Traits & Hobbies
            profileCharacterTraits: true,
            profileHobbies: true,

            // About & Additional Info
            about: true,
            matchingNotes: true, // Notes for matchmaker

            // Preferences (Assuming these are part of UserProfile model)
            preferredAgeMin: true,
            preferredAgeMax: true,
            preferredHeightMin: true,
            preferredHeightMax: true,
            preferredReligiousLevels: true,
            preferredLocations: true,
            preferredEducation: true, // This was an array of strings in your ProfileSection
            preferredOccupations: true, // This was an array of strings

            // Contact & Profile Settings
            contactPreference: true, // This was a single string/enum in ProfileSection
            isProfileVisible: true,
            preferredMatchmakerGender: true,
            
            // Availability
            availabilityStatus: true,
            availabilityNote: true,
            availabilityUpdatedAt: true,
            
            // System Fields
            userId: true, // Foreign key to user
            createdAt: true,
            updatedAt: true,
            lastActive: true,

          }
        },
        images: { // Select fields for images if needed, or true if all are needed
          select: {
            id: true,
            url: true,
            isMain: true,
            createdAt: true,
            // Add other image fields you need
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // user.profile will now only contain the fields selected above.
    // The type assertion might still be needed if Prisma's inferred type for `user.profile`
    // (after select) doesn't perfectly match your `UserProfile` type from `@/types/next-auth`.
    // However, with a `select` clause, user.profile should be much closer to what you need.
    const rawProfileData = user.profile;

    if (!rawProfileData) {
        return NextResponse.json(
            { error: 'Profile data not found for this user' },
            { status: 404 }
        );
    }

    // Construct the final profile object to be sent to the client.
    // This ensures that even if a field is null/undefined from DB,
    // it gets a default value expected by the client if necessary.
    // It also attaches the basic user info.
    const profileResponseData: UserProfile = {
      ...rawProfileData, // Spread all selected fields from rawProfileData
      
      // Explicitly set defaults or transformations if needed, though `select` handles missing fields well.
      // Most of these will come directly from rawProfileData due to the `select`
      gender: rawProfileData.gender || undefined, // Or null, depending on your type
      birthDate: rawProfileData.birthDate || null,
      nativeLanguage: rawProfileData.nativeLanguage || undefined,
      additionalLanguages: rawProfileData.additionalLanguages || [],
      height: rawProfileData.height ?? null,
      city: rawProfileData.city || "", // Default to empty string if client expects string
      origin: rawProfileData.origin || "",
      aliyaCountry: rawProfileData.aliyaCountry || "",
      aliyaYear: rawProfileData.aliyaYear || undefined,

      maritalStatus: rawProfileData.maritalStatus || undefined,
      hasChildrenFromPrevious: rawProfileData.hasChildrenFromPrevious ?? undefined, // Use ?? for booleans if null means undefined
      parentStatus: rawProfileData.parentStatus || undefined,
      siblings: rawProfileData.siblings || undefined,
      position: rawProfileData.position || undefined,

      educationLevel: rawProfileData.educationLevel || undefined,
      education: rawProfileData.education || "",
      occupation: rawProfileData.occupation || "",
      serviceType: rawProfileData.serviceType || undefined,
      serviceDetails: rawProfileData.serviceDetails || "",

      religiousLevel: rawProfileData.religiousLevel || undefined,
      shomerNegiah: rawProfileData.shomerNegiah ?? undefined,
      headCovering: rawProfileData.headCovering || undefined,
      kippahType: rawProfileData.kippahType || undefined,

      profileCharacterTraits: rawProfileData.profileCharacterTraits || [],
      profileHobbies: rawProfileData.profileHobbies || [],

      about: rawProfileData.about || "",
      matchingNotes: rawProfileData.matchingNotes || "",

      preferredAgeMin: rawProfileData.preferredAgeMin || undefined,
      preferredAgeMax: rawProfileData.preferredAgeMax || undefined,
      preferredHeightMin: rawProfileData.preferredHeightMin || undefined,
      preferredHeightMax: rawProfileData.preferredHeightMax || undefined,
      preferredReligiousLevels: rawProfileData.preferredReligiousLevels || [],
      preferredLocations: rawProfileData.preferredLocations || [],
      preferredEducation: rawProfileData.preferredEducation || [],
      preferredOccupations: rawProfileData.preferredOccupations || [],

      contactPreference: rawProfileData.contactPreference || undefined,
      isProfileVisible: rawProfileData.isProfileVisible ?? true, // Default to true if null/undefined
      preferredMatchmakerGender: rawProfileData.preferredMatchmakerGender || undefined,
      
      availabilityStatus: rawProfileData.availabilityStatus || AvailabilityStatus.AVAILABLE,
      availabilityNote: rawProfileData.availabilityNote || "",
      availabilityUpdatedAt: rawProfileData.availabilityUpdatedAt || null,
      
      // System and relational fields are already from rawProfileData
      id: rawProfileData.id,
      userId: rawProfileData.userId,
      createdAt: rawProfileData.createdAt,
      updatedAt: rawProfileData.updatedAt,
      lastActive: rawProfileData.lastActive || null,

      // User Information from the parent 'user' object
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // Add other user fields if they exist and are needed, e.g., user.id
        id: user.id, // Assuming user object has an id
      }
    };
    
    // Ensure that the structure of profileResponseData matches your UserProfile type.
    // The type assertion below is a safeguard, but ideally, the construction above ensures compatibility.
    // const typedProfileResponseData = profileResponseData as UserProfile;


    return NextResponse.json({
      success: true,
      profile: profileResponseData, // Send the carefully constructed profile
      images: user.images // Images are already selected as needed
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    // It's good practice to log the full error in development
    // In production, you might want a more generic message or structured logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
// --- END OF FILE route.ts (Updated) ---