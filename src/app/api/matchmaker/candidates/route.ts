// src/app/api/matchmaker/candidates/route.ts
import { updateUserAiProfile } from '@/lib/services/profileAiService';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole, MatchSuggestionStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  'FIRST_PARTY_APPROVED',
  'SECOND_PARTY_APPROVED',
  'AWAITING_MATCHMAKER_APPROVAL',
  'CONTACT_DETAILS_SHARED',
  'AWAITING_FIRST_DATE_FEEDBACK',
  'THINKING_AFTER_DATE',
  'PROCEEDING_TO_SECOND_DATE',
  'MEETING_PENDING',
  'MEETING_SCHEDULED',
  'MATCH_APPROVED',
  'DATING',
];

const PENDING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  'PENDING_FIRST_PARTY',
  'PENDING_SECOND_PARTY',
  'DRAFT',
];

type SuggestionStatusInfo = {
  status: 'BLOCKED' | 'PENDING';
  suggestionId: string;
  withCandidateName: string;
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Splits a comma-separated string into a trimmed, non-empty array.
 */
function parseCommaSeparated(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Converts age range (in years) to a birthDate range for Prisma filtering.
 * ageMin → maxBirthDate (younger = born later)
 * ageMax → minBirthDate (older = born earlier)
 */
function ageToDateRange(
  ageMin: number | null,
  ageMax: number | null
): { minBirthDate?: Date; maxBirthDate?: Date } {
  const now = new Date();
  const result: { minBirthDate?: Date; maxBirthDate?: Date } = {};

  if (ageMax !== null) {
    // Oldest allowed → earliest birthdate
    const minBirthDate = new Date(now);
    minBirthDate.setFullYear(minBirthDate.getFullYear() - ageMax - 1);
    result.minBirthDate = minBirthDate;
  }

  if (ageMin !== null) {
    // Youngest allowed → latest birthdate
    const maxBirthDate = new Date(now);
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - ageMin);
    result.maxBirthDate = maxBirthDate;
  }

  return result;
}

/**
 * Builds a Prisma orderBy clause based on sortBy and sortDirection params.
 */
function buildOrderBy(
  sortBy: string | null,
  sortDirection: string | null
): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
  const direction: 'asc' | 'desc' =
    sortDirection === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'name':
      return [{ firstName: direction }, { lastName: direction }];
    case 'age':
      // birthDate sorting is inverted: ascending birthDate = oldest first
      return {
        profile: {
          birthDate: direction === 'asc' ? 'desc' : 'asc',
        },
      };
    case 'city':
      return { profile: { city: direction } };
    case 'religiousLevel':
      return { profile: { religiousLevel: direction } };
    case 'height':
      return { profile: { height: direction } };
    case 'registrationDate':
      return { createdAt: direction };
    case 'lastActive':
      return { profile: { lastActive: direction } };
    default:
      // Default sort: newest registrations first
      return { createdAt: 'desc' };
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Not logged in' }),
        { status: 401 }
      );
    }

    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!performingUser || !allowedRoles.includes(performingUser.role)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized - Matchmaker or Admin access required',
        }),
        { status: 403 }
      );
    }

    // ─── Parse Query Params ──────────────────────────────────────────────
    const { searchParams } = request.nextUrl;

    const gender = searchParams.get('gender');
    const ageMin = searchParams.get('ageMin')
      ? parseInt(searchParams.get('ageMin')!, 10)
      : null;
    const ageMax = searchParams.get('ageMax')
      ? parseInt(searchParams.get('ageMax')!, 10)
      : null;
    const heightMin = searchParams.get('heightMin')
      ? parseInt(searchParams.get('heightMin')!, 10)
      : null;
    const heightMax = searchParams.get('heightMax')
      ? parseInt(searchParams.get('heightMax')!, 10)
      : null;
    const cities = parseCommaSeparated(searchParams.get('cities'));
    const religiousLevels = parseCommaSeparated(
      searchParams.get('religiousLevel')
    );
    const languages = parseCommaSeparated(searchParams.get('languages'));
    const occupations = parseCommaSeparated(searchParams.get('occupations'));
    const educationLevel = searchParams.get('educationLevel');
    const maritalStatus = searchParams.get('maritalStatus');
    const availabilityStatus = searchParams.get('availabilityStatus');
    const userStatus = searchParams.get('userStatus');
    const source = searchParams.get('source');
    const bodyTypes = parseCommaSeparated(searchParams.get('bodyType'));
    const appearanceTones = parseCommaSeparated(searchParams.get('appearanceTone'));
    const ethnicBackgrounds = parseCommaSeparated(searchParams.get('ethnicBackground'));
    const isVerified = searchParams.get('isVerified');
    const isProfileComplete = searchParams.get('isProfileComplete');
    const lastActiveDays = searchParams.get('lastActiveDays')
      ? parseInt(searchParams.get('lastActiveDays')!, 10)
      : null;
    const searchQuery = searchParams.get('searchQuery');
    const sortBy = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');

    // Pagination
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(
      searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
      10
    );
    const page = Math.max(1, rawPage);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize));

    // ─── Build User-Level WHERE ──────────────────────────────────────────
    const userWhere: Prisma.UserWhereInput = {
      role: 'CANDIDATE',
      profile: { isNot: null },
    };

    // userStatus filter: if not provided, exclude BLOCKED/INACTIVE (original behavior)
    if (userStatus) {
      userWhere.status = userStatus as Prisma.EnumUserStatusFilter;
    } else {
      userWhere.status = { notIn: ['BLOCKED', 'INACTIVE'] };
    }

    if (source) {
      userWhere.source = source as Prisma.EnumUserSourceFilter;
    }

    if (isVerified !== null && isVerified !== undefined && isVerified !== '') {
      userWhere.isVerified = isVerified === 'true';
    }

    if (
      isProfileComplete !== null &&
      isProfileComplete !== undefined &&
      isProfileComplete !== ''
    ) {
      userWhere.isProfileComplete = isProfileComplete === 'true';
    }

    // ─── Build Profile-Level WHERE ───────────────────────────────────────
    const profileWhere: Prisma.ProfileWhereInput = {};

    if (gender) {
      profileWhere.gender = gender as Prisma.EnumGenderFilter;
    }

    // Age → birthDate range
    if (ageMin !== null || ageMax !== null) {
      const { minBirthDate, maxBirthDate } = ageToDateRange(ageMin, ageMax);
      profileWhere.birthDate = {};
      if (minBirthDate) {
        profileWhere.birthDate.gte = minBirthDate;
      }
      if (maxBirthDate) {
        profileWhere.birthDate.lte = maxBirthDate;
      }
    }

    // Height range
    if (heightMin !== null || heightMax !== null) {
      profileWhere.height = {};
      if (heightMin !== null) {
        profileWhere.height.gte = heightMin;
      }
      if (heightMax !== null) {
        profileWhere.height.lte = heightMax;
      }
    }

    // Cities (OR match)
    if (cities.length > 0) {
      profileWhere.city = { in: cities, mode: 'insensitive' };
    }

    // Religious levels with "not_defined" support
    if (religiousLevels.length > 0) {
      const hasNotDefined = religiousLevels.includes('not_defined');
      const definedLevels = religiousLevels.filter((l) => l !== 'not_defined');

      if (hasNotDefined && definedLevels.length > 0) {
        // Match either null/empty OR in the specified levels
        profileWhere.OR = [
          { religiousLevel: null },
          { religiousLevel: '' },
          { religiousLevel: { in: definedLevels } },
        ];
      } else if (hasNotDefined) {
        // Only "not_defined" selected
        profileWhere.OR = [
          { religiousLevel: null },
          { religiousLevel: '' },
        ];
      } else {
        // Only defined levels
        profileWhere.religiousLevel = { in: definedLevels };
      }
    }

    // Languages (match nativeLanguage OR any additionalLanguages)
    if (languages.length > 0) {
      profileWhere.OR = [
        ...(profileWhere.OR || []),
        { nativeLanguage: { in: languages, mode: 'insensitive' } },
        { additionalLanguages: { hasSome: languages } },
      ];
    }

    // Occupations (case-insensitive contains match)
    if (occupations.length > 0) {
      const occupationConditions = occupations.map((occ) => ({
        occupation: { contains: occ, mode: 'insensitive' as const },
      }));
      profileWhere.OR = [
        ...(profileWhere.OR || []),
        ...occupationConditions,
      ];
    }

    if (educationLevel) {
      profileWhere.educationLevel = educationLevel;
    }

    if (maritalStatus) {
      profileWhere.maritalStatus = maritalStatus;
    }

    if (availabilityStatus) {
      profileWhere.availabilityStatus =
        availabilityStatus as Prisma.EnumAvailabilityStatusFilter;
    }

    // Body type filter
    if (bodyTypes.length > 0) {
      profileWhere.bodyType = { in: bodyTypes as any };
    }

    // Appearance tone filter
    if (appearanceTones.length > 0) {
      profileWhere.appearanceTone = { in: appearanceTones as any };
    }

    // Ethnic background filter (origin-based text matching)
    if (ethnicBackgrounds.length > 0) {
      const originMap: Record<string, string> = {
        'ASHKENAZI': 'אשכנזי',
        'SEPHARDI': 'ספרדי',
        'YEMENITE': 'תימני',
        'ETHIOPIAN': 'אתיופי',
        'MIXED': 'מעורב',
        'OTHER': 'אחר',
      };
      const originTerms = ethnicBackgrounds.map((eb) => originMap[eb] || eb);
      profileWhere.OR = [
        ...(profileWhere.OR || []),
        ...originTerms.map((term) => ({
          origin: { contains: term, mode: 'insensitive' as const },
        })),
      ];
    }

    // Last active within N days
    if (lastActiveDays !== null && lastActiveDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - lastActiveDays);
      profileWhere.lastActive = { gte: cutoff };
    }

    // Attach profile conditions to user where
    if (Object.keys(profileWhere).length > 0) {
      // Use `is` to combine the "profile exists" check with field filters
      userWhere.profile = { is: profileWhere };
    }

    // ─── Search Query (multi-word AND across fields) ─────────────────────
    if (searchQuery && searchQuery.trim()) {
      const words = searchQuery
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      // Each word must match at least one field (AND between words)
      const wordConditions: Prisma.UserWhereInput[] = words.map((word) => ({
        OR: [
          { firstName: { contains: word, mode: 'insensitive' } },
          { lastName: { contains: word, mode: 'insensitive' } },
          { email: { contains: word, mode: 'insensitive' } },
          { phone: { contains: word } },
          {
            profile: {
              city: { contains: word, mode: 'insensitive' },
            },
          },
          {
            profile: {
              occupation: { contains: word, mode: 'insensitive' },
            },
          },
        ],
      }));

      userWhere.AND = [
        ...(Array.isArray(userWhere.AND) ? userWhere.AND : []),
        ...wordConditions,
      ];
    }

    // ─── Build OrderBy ───────────────────────────────────────────────────
    const orderBy = buildOrderBy(sortBy, sortDirection);

    // ─── Execute Queries (data + count in parallel) ──────────────────────
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          source: true,
          createdAt: true,
          language: true,
          isVerified: true,
          isProfileComplete: true,
          images: {
            select: {
              id: true,
              url: true,
              isMain: true,
              cloudinaryPublicId: true,
            },
            orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
          },
          profile: {
            include: {
              testimonials: {
                where: { status: 'APPROVED' },
              },
              metrics: {
                select: {
                  dealBreakersHard: true,
                  dealBreakersSoft: true,
                },
              },
            },
          },
          _count: {
            select: { notesAboutUser: true },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: userWhere }),
    ]);

    if (users.length === 0) {
      return new NextResponse(
        JSON.stringify({
          success: true,
          clients: [],
          count: 0,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        }),
        { status: 200 }
      );
    }

    // Step 2: Collect all user IDs
    const userIds = users.map((user) => user.id);

    // Step 2b: Fetch recent suggestion history (last 6 months, for mini history on card)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentSuggestionsRaw = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: { in: userIds } },
          { secondPartyId: { in: userIds } },
        ],
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: userIds.length * 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { firstName: true, lastName: true } },
        secondParty: { select: { firstName: true, lastName: true } },
      },
    });

    // Build per-user recent suggestions map (max 3 per user)
    const recentSuggestionsMap = new Map<string, Array<{
      id: string;
      status: string;
      createdAt: string;
      partnerName: string;
      role: 'first' | 'second';
    }>>();

    for (const s of recentSuggestionsRaw) {
      const firstList = recentSuggestionsMap.get(s.firstPartyId) ?? [];
      if (firstList.length < 3) {
        firstList.push({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          partnerName: `${s.secondParty.firstName} ${s.secondParty.lastName.charAt(0)}.`,
          role: 'first',
        });
        recentSuggestionsMap.set(s.firstPartyId, firstList);
      }

      const secondList = recentSuggestionsMap.get(s.secondPartyId) ?? [];
      if (secondList.length < 3) {
        secondList.push({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          partnerName: `${s.firstParty.firstName} ${s.firstParty.lastName.charAt(0)}.`,
          role: 'second',
        });
        recentSuggestionsMap.set(s.secondPartyId, secondList);
      }
    }

    // Step 3: Fetch all relevant suggestions in a single query
    const allSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: { in: userIds } },
          { secondPartyId: { in: userIds } },
        ],
        status: {
          in: [...BLOCKING_SUGGESTION_STATUSES, ...PENDING_SUGGESTION_STATUSES],
        },
      },
      include: {
        firstParty: { select: { id: true, firstName: true, lastName: true } },
        secondParty: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Step 4: Process suggestions into an efficient lookup map
    const suggestionStatusMap = new Map<string, SuggestionStatusInfo>();

    for (const suggestion of allSuggestions) {
      const isBlocking = BLOCKING_SUGGESTION_STATUSES.includes(
        suggestion.status
      );
      const statusType = isBlocking ? 'BLOCKED' : 'PENDING';

      // Attach info to first party
      if (
        !suggestionStatusMap.has(suggestion.firstPartyId) ||
        (isBlocking &&
          suggestionStatusMap.get(suggestion.firstPartyId)?.status !==
            'BLOCKED')
      ) {
        suggestionStatusMap.set(suggestion.firstPartyId, {
          status: statusType,
          suggestionId: suggestion.id,
          withCandidateName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
        });
      }

      // Attach info to second party
      if (
        !suggestionStatusMap.has(suggestion.secondPartyId) ||
        (isBlocking &&
          suggestionStatusMap.get(suggestion.secondPartyId)?.status !==
            'BLOCKED')
      ) {
        suggestionStatusMap.set(suggestion.secondPartyId, {
          status: statusType,
          suggestionId: suggestion.id,
          withCandidateName: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
        });
      }
    }

    // Step 5: Map suggestion info back to users in memory (no more DB queries)
    const usersWithSuggestionInfo = users.map((user) => {
      const suggestionInfo = suggestionStatusMap.get(user.id) || null;
      const profile = user.profile;

      return {
        ...user,
        notesCount: (user as any)._count?.notesAboutUser ?? 0,
        recentSuggestions: recentSuggestionsMap.get(user.id) ?? [],
        suggestionStatus: suggestionInfo,
        profile: profile
          ? {
              ...profile,
              birthDate: profile.birthDate.toISOString(),
              availabilityUpdatedAt:
                profile.availabilityUpdatedAt?.toISOString() || null,
              createdAt: profile.createdAt.toISOString(),
              updatedAt: profile.updatedAt.toISOString(),
              lastActive: profile.lastActive?.toISOString() || null,
              // Inject user details into profile for ProfileCard
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
              },
            }
          : null,
      };
    });

    // Background AI profile updates
    const profilesNeedingUpdate = usersWithSuggestionInfo.filter(
      (user) => user.profile?.needsAiProfileUpdate
    );

    if (profilesNeedingUpdate.length > 0) {
      const profileIdsToUpdate = profilesNeedingUpdate.map(
        (u) => u.profile!.id
      );

      // First, immediately reset the flags in the DB to prevent duplicate jobs
      prisma.profile
        .updateMany({
          where: { id: { in: profileIdsToUpdate } },
          data: { needsAiProfileUpdate: false },
        })
        .then(() => {
          // Then, run the actual AI updates without awaiting them
          profilesNeedingUpdate.forEach((user) => {
            updateUserAiProfile(user.id).catch((err) => {
              console.error(
                `[Proactive AI Update - BG] Failed for user ${user.id}:`,
                err
              );
            });
          });
        })
        .catch((err) => {
          console.error('[Proactive AI Update] Failed to reset flags:', err);
        });
    }

    const totalPages = Math.ceil(total / pageSize);

    return new NextResponse(
      JSON.stringify({
        success: true,
        clients: usersWithSuggestionInfo,
        count: usersWithSuggestionInfo.length,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Candidate list fetch error:', errorMessage, error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'An error occurred while fetching candidates.',
        details: errorMessage,
      }),
      { status: 500 }
    );
  }
}
