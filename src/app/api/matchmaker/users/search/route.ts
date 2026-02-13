// src/app/api/matchmaker/users/search/route.ts
// =============================================================================
// NeshamaTech - User Search for Matchmaker
// חיפוש יוזרים לפי שם, מייל או טלפון — לשימוש השדכן
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== 'MATCHMAKER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 2. Parse query
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 20) : 8;

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    // 3. Search users
    const users = await prisma.user.findMany({
      where: {
        role: 'CANDIDATE',
        status: 'ACTIVE',
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: {
            gender: true,
            city: true,
            availabilityStatus: true,
          },
        },
        images: {
          where: { isMain: true },
          select: { url: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        gender: u.profile?.gender || null,
        city: u.profile?.city || null,
        availabilityStatus: u.profile?.availabilityStatus || null,
        mainImage: u.images[0]?.url || null,
      })),
    });
  } catch (error) {
    console.error('[User Search] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}