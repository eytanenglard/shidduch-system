// =============================================================================
// src/app/api/mobile/matchmaker/candidates/search/route.ts
// =============================================================================
//
// GET — Search candidates by name/email/phone
// Query params: ?q=searchTerm&limit=15&gender=MALE&city=...&status=AVAILABLE
//
// Mobile mirror of /api/matchmaker/users/search with JWT auth + filters
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 30) : 15;

    // Optional filters
    const gender = searchParams.get('gender'); // MALE | FEMALE
    const city = searchParams.get('city');
    const availabilityStatus = searchParams.get('status'); // AVAILABLE | DATING | etc.
    const religiousLevel = searchParams.get('religiousLevel');

    if (!query || query.length < 2) {
      return corsJson(req, { success: true, users: [], totalCount: 0 });
    }

    // Build where clause
    const where: any = {
      role: 'CANDIDATE',
      status: 'ACTIVE',
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    };

    // Profile-level filters
    const profileFilter: any = {};
    if (gender) profileFilter.gender = gender;
    if (city) profileFilter.city = { contains: city, mode: 'insensitive' };
    if (availabilityStatus) profileFilter.availabilityStatus = availabilityStatus;
    if (religiousLevel) profileFilter.religiousLevel = { contains: religiousLevel, mode: 'insensitive' };

    if (Object.keys(profileFilter).length > 0) {
      where.profile = { is: profileFilter };
    }

    const users = await prisma.user.findMany({
      where,
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
            religiousLevel: true,
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

    return corsJson(req, {
      success: true,
      users: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        gender: u.profile?.gender || null,
        city: u.profile?.city || null,
        availabilityStatus: u.profile?.availabilityStatus || null,
        religiousLevel: u.profile?.religiousLevel || null,
        mainImage: u.images[0]?.url || null,
      })),
      totalCount: users.length,
    });
  } catch (error) {
    console.error('[mobile/matchmaker/candidates/search] Error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}