import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AvailabilityStatus, Gender } from "@prisma/client";
import { User, UserProfile } from "@/types/next-auth";

export async function PUT(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request data
    const data = await req.json();
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        images: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update or create profile with new schema
    const profile = await prisma.profile.upsert({
      where: {
        userId: user.id
      },
      create: {
        userId: user.id,
        // Personal Information
        gender:data?.gender,
        birthDate:data?.birthDate,
        nativeLanguage: data.nativeLanguage,
        additionalLanguages: data.additionalLanguages || [],
        height: data.height ? parseInt(data.height) : null,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        education: data.education,
        address: data.address,
        city: data.city,
        origin: data.origin,
        religiousLevel: data.religiousLevel,
        about: data.about,
        hobbies: data.hobbies,
        
        // Family Information
        parentStatus: data.parentStatus,
        siblings: data.siblings ? parseInt(data.siblings) : null,
        position: data.position ? parseInt(data.position) : null,
        
        // Matching Preferences
        preferredAgeMin: data.preferredAgeMin ? parseInt(data.preferredAgeMin) : null,
        preferredAgeMax: data.preferredAgeMax ? parseInt(data.preferredAgeMax) : null,
        preferredHeightMin: data.preferredHeightMin ? parseInt(data.preferredHeightMin) : null,
        preferredHeightMax: data.preferredHeightMax ? parseInt(data.preferredHeightMax) : null,
        preferredReligiousLevels: data.preferredReligiousLevels || [],
        preferredLocations: data.preferredLocations || [],
        preferredEducation: data.preferredEducation || [],
        preferredOccupations: data.preferredOccupations || [],
        
        // Contact and References
        contactPreference: data.contactPreference,
        referenceName1: data.referenceName1,
        referencePhone1: data.referencePhone1,
        referenceName2: data.referenceName2,
        referencePhone2: data.referencePhone2,
        
        // Profile Settings
        isProfileVisible: data.isProfileVisible ?? true,
        preferredMatchmakerGender: data.preferredMatchmakerGender as Gender | null,
        matchingNotes: data.matchingNotes,
        
        // Availability Status
        availabilityStatus: data.availabilityStatus as AvailabilityStatus ?? 'AVAILABLE',
        availabilityNote: data.availabilityNote,
        availabilityUpdatedAt: new Date(),
        
        // System Fields
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
      },
      update: {
        // Personal Information
        nativeLanguage: data.nativeLanguage,
        additionalLanguages: data.additionalLanguages,
        height: data.height ? parseInt(data.height) : null,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        education: data.education,
        address: data.address,
        city: data.city,
        origin: data.origin,
        religiousLevel: data.religiousLevel,
        about: data.about,
        hobbies: data.hobbies,
        
        // Family Information
        parentStatus: data.parentStatus,
        siblings: data.siblings ? parseInt(data.siblings) : null,
        position: data.position ? parseInt(data.position) : null,
        
        // Matching Preferences
        preferredAgeMin: data.preferredAgeMin ? parseInt(data.preferredAgeMin) : null,
        preferredAgeMax: data.preferredAgeMax ? parseInt(data.preferredAgeMax) : null,
        preferredHeightMin: data.preferredHeightMin ? parseInt(data.preferredHeightMin) : null,
        preferredHeightMax: data.preferredHeightMax ? parseInt(data.preferredHeightMax) : null,
        preferredReligiousLevels: data.preferredReligiousLevels,
        preferredLocations: data.preferredLocations,
        preferredEducation: data.preferredEducation,
        preferredOccupations: data.preferredOccupations,
        
        // Contact and References
        contactPreference: data.contactPreference,
        referenceName1: data.referenceName1,
        referencePhone1: data.referencePhone1,
        referenceName2: data.referenceName2,
        referencePhone2: data.referencePhone2,
        
        // Profile Settings
        isProfileVisible: data.isProfileVisible,
        preferredMatchmakerGender: data.preferredMatchmakerGender as Gender | null,
        matchingNotes: data.matchingNotes,
        
        // Availability Status
        availabilityStatus: data.availabilityStatus as AvailabilityStatus ?? 'AVAILABLE',
        availabilityNote: data.availabilityNote,
        availabilityUpdatedAt: new Date(),
        
        // System Fields
        updatedAt: new Date(),
        lastActive: new Date(),
      }
    });

    // Fetch updated user with all required information
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        images: true,
        profile: true
      }
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    // Transform the data to include user information
    const transformedProfile = {
      ...updatedUser.profile,
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      },
      images: updatedUser.images,
      mainImage: updatedUser.images.find(img => img.isMain) || null
    };

    return NextResponse.json({
      success: true,
      profile: transformedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof Error) {
      // Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        return NextResponse.json(
          { error: 'Database operation failed' },
          { status: 400 }
        );
      }
      
      // Validation errors
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}