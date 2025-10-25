import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // חיפוש משתמשים לפי שם, אימייל או ID
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            status: 'ACTIVE',
            isProfileComplete: false, // רק משתמשים שלא השלימו פרופיל
          },
          {
            OR: [
              {
                firstName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                id: {
                  contains: query,
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: {
            city: true,
          },
        },
        dripCampaign: {
          select: {
            lastSentType: true,
            updatedAt: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}