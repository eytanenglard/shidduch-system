// src/app/api/user/export-data/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        isPhoneVerified: true,
        isProfileComplete: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        engagementEmailsConsent: true,
        promotionalEmailsConsent: true,
        profile: {
          select: {
            gender: true,
            birthDate: true,
            city: true,
            height: true,
            education: true,
            occupation: true,
            about: true,
            religiousLevel: true,
            headCovering: true,
            hasChildren: true,
            maritalStatus: true,
            updatedAt: true,
          },
        },
        questionnaireResponses: {
          select: {
            worldId: true,
            answers: true,
            isComplete: true,
            completedAt: true,
            updatedAt: true,
          },
        },
        images: {
          select: {
            url: true,
            isMain: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build export payload
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user,
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="neshamatech-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('[Export Data] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
