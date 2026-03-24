import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const estimateSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']),
  sectorTags: z.array(z.string()).optional().default([]),
  partnerSectorTags: z.array(z.string()).optional().default([]),
});

// Simple in-memory rate limiting for this public endpoint
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 requests per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequestMap.entries()) {
      if (entry.resetAt < now) ipRequestMap.delete(ip);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = estimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { gender, partnerSectorTags } = parsed.data;
    const oppositeGender = gender === 'MALE' ? 'FEMALE' : 'MALE';

    // Build the query — count opposite-gender active, complete, available profiles
    let estimatedMatches: number;

    if (partnerSectorTags.length > 0) {
      // Use raw query for PostgreSQL array overlap operator (&&)
      const result = await prisma.$queryRaw<[{ count: bigint }]>(
        Prisma.sql`
          SELECT COUNT(DISTINCT p.id) as count
          FROM "Profile" p
          JOIN "User" u ON p."userId" = u.id
          LEFT JOIN "ProfileTags" pt ON p.id = pt."profileId"
          WHERE p.gender = ${oppositeGender}::"Gender"
            AND u."isProfileComplete" = true
            AND u."isPhoneVerified" = true
            AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
            AND u.status = 'ACTIVE'::"UserStatus"
            AND pt."sectorTags" && ${partnerSectorTags}::text[]
        `
      );
      estimatedMatches = Number(result[0]?.count ?? 0);
    } else {
      // No sector filter — count all eligible profiles
      estimatedMatches = await prisma.profile.count({
        where: {
          gender: oppositeGender,
          user: {
            isProfileComplete: true,
            isPhoneVerified: true,
            status: 'ACTIVE',
          },
          availabilityStatus: 'AVAILABLE',
        },
      });
    }

    // Apply minimum floor to avoid discouraging visitors
    const displayCount = Math.max(estimatedMatches, 3);

    return NextResponse.json({
      estimatedMatches: displayCount,
    });
  } catch (error) {
    console.error('[HeartMap Estimate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
