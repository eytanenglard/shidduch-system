// src/app/api/matchmaker/candidates/check-duplicates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface CandidateCheck {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface DuplicateResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  matchType: 'phone' | 'name';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== UserRole.MATCHMAKER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const candidates: CandidateCheck[] = body.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { error: 'candidates array is required' },
        { status: 400 }
      );
    }

    // Collect all phones for bulk query
    const phones = candidates
      .map((c) => c.phone?.trim())
      .filter((p): p is string => !!p && p.length > 0);

    // Bulk phone lookup
    const phoneMatches =
      phones.length > 0
        ? await prisma.user.findMany({
            where: { phone: { in: phones } },
            select: { id: true, firstName: true, lastName: true, phone: true },
          })
        : [];

    const phoneMap = new Map(
      phoneMatches.map((u) => [u.phone!, u])
    );

    // Per-candidate results
    const results = await Promise.all(
      candidates.map(async (candidate, index) => {
        const duplicates: DuplicateResult[] = [];
        const phone = candidate.phone?.trim();

        // Check phone first (strongest signal)
        if (phone && phoneMap.has(phone)) {
          const match = phoneMap.get(phone)!;
          duplicates.push({
            id: match.id,
            firstName: match.firstName,
            lastName: match.lastName ?? '',
            phone: match.phone,
            matchType: 'phone',
          });
        }

        // If no phone match, check by name
        if (
          duplicates.length === 0 &&
          candidate.firstName?.trim()
        ) {
          const nameMatches = await prisma.user.findMany({
            where: {
              firstName: {
                equals: candidate.firstName.trim(),
                mode: 'insensitive',
              },
              ...(candidate.lastName?.trim()
                ? {
                    lastName: {
                      equals: candidate.lastName.trim(),
                      mode: 'insensitive',
                    },
                  }
                : {}),
            },
            select: { id: true, firstName: true, lastName: true, phone: true },
            take: 3,
          });

          for (const match of nameMatches) {
            duplicates.push({
              id: match.id,
              firstName: match.firstName,
              lastName: match.lastName ?? '',
              phone: match.phone,
              matchType: 'name',
            });
          }
        }

        return { index, duplicates };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
