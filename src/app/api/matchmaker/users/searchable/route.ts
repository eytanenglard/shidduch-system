// =============================================================================
// src/app/api/matchmaker/users/searchable/route.ts
// =============================================================================
//
// GET — Search registered users (not manually added) who have profiles
// Query params: ?q=searchTerm&page=1&limit=50
//
// Returns users with: role=CANDIDATE, source=REGISTRATION, has Profile
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify matchmaker/admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !['MATCHMAKER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      role: 'CANDIDATE',
      source: 'REGISTRATION',
      // Must have a profile
      profile: { isNot: null },
    };

    // Name search
    if (query.length > 0) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          profile: {
            select: {
              gender: true,
              city: true,
              availabilityStatus: true,
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      gender: u.profile?.gender,
      city: u.profile?.city,
      availabilityStatus: u.profile?.availabilityStatus,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('[matchmaker/users/searchable] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}