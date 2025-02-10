import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";


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