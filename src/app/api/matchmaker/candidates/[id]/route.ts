import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify that the user is a matchmaker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker access required" },
        { status: 403 }
      );
    }

    // Get candidate ID from params
    const { id } = params;

    // Fetch candidate profile with all related data
    const candidateData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isVerified: true,
        profile: true,
        images: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!candidateData) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: candidateData.profile,
      user: {
        id: candidateData.id,
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        isVerified: candidateData.isVerified
      },
      images: candidateData.images
    });
  } catch (error) {
    console.error("Error fetching candidate profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidate profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify that the user is a matchmaker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker access required" },
        { status: 403 }
      );
    }

    // Get candidate ID from params
    const { id } = params;

    // Verify candidate exists
    const candidateExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!candidateExists) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Parse profile update data
    const profileData = await req.json();

    // Clean and process data
    // Handle numeric values properly
    if (profileData.height === "") profileData.height = null;
    if (profileData.siblings === "") profileData.siblings = null;
    if (profileData.position === "") profileData.position = null;
    if (profileData.preferredAgeMin === "") profileData.preferredAgeMin = null;
    if (profileData.preferredAgeMax === "") profileData.preferredAgeMax = null;
    if (profileData.preferredHeightMin === "") profileData.preferredHeightMin = null;
    if (profileData.preferredHeightMax === "") profileData.preferredHeightMax = null;
    
    // Handle Enum values properly
    if (profileData.preferredMatchmakerGender === "") profileData.preferredMatchmakerGender = null;
    if (profileData.gender === "") profileData.gender = null;

    // Create or update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: id },
      data: profileData
    });

    // Update lastActive timestamp
    await prisma.profile.update({
      where: { userId: id },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error("Error updating candidate profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update candidate profile" },
      { status: 500 }
    );
  }
}