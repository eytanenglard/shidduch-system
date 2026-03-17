// =============================================================================
// 📁 src/app/api/mobile/matchmaker/candidates/route.ts
// =============================================================================
// 🎯 Matchmaker Candidates API — Paginated & Filterable for Mobile
// =============================================================================
// Supports: server-side pagination, filtering, sorting, search
// Used by: Mobile CandidatesManager (React Native)
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, Gender, AvailabilityStatus, Prisma, MatchSuggestionStatus } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

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

// =============================================================================
// GET — Paginated Candidates List
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // ── Auth (JWT Bearer Token) ──
    const auth = await verifyMobileToken(request);
    if (!auth) return corsError(request, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(request, 'Insufficient permissions', 403);
    }

    // ── Parse Query Params ──
    const params = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(params.get('pageSize') || String(DEFAULT_PAGE_SIZE))));
    const search = params.get('search')?.trim() || '';
    const gender = params.get('gender') as Gender | null;
    const availabilityStatus = params.get('availabilityStatus') as AvailabilityStatus | null;
    const religiousLevel = params.get('religiousLevel') || null;
    const city = params.get('city') || null;
    const maritalStatus = params.get('maritalStatus') || null;
    const ageMin = params.get('ageMin') ? parseInt(params.get('ageMin')!) : null;
    const ageMax = params.get('ageMax') ? parseInt(params.get('ageMax')!) : null;
    const sortBy = params.get('sortBy') || 'createdAt';
    const sortOrder = (params.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const isProfileComplete = params.get('isProfileComplete');
    const source = params.get('source') || null;

    // ── Build WHERE clause ──
    const where: Prisma.UserWhereInput = {
      status: { notIn: ['BLOCKED', 'INACTIVE'] },
      role: 'CANDIDATE',
      profile: { isNot: null },
    };

    // Search: name, email, phone, city, occupation
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      where.AND = searchTerms.map((term) => ({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
          { lastName: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
          { email: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
          { phone: { contains: term } },
          { profile: { city: { contains: term, mode: 'insensitive' as Prisma.QueryMode } } },
          { profile: { occupation: { contains: term, mode: 'insensitive' as Prisma.QueryMode } } },
        ],
      }));
    }

    // Gender filter
    if (gender && (gender === 'MALE' || gender === 'FEMALE')) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        gender,
      };
    }

    // Availability filter
    if (availabilityStatus) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        availabilityStatus: availabilityStatus as AvailabilityStatus,
      };
    }

    // Religious level filter (supports comma-separated for multi-select)
    if (religiousLevel) {
      const levels = religiousLevel.split(',').filter(Boolean);
      if (levels.length === 1) {
        where.profile = {
          ...((where.profile as Prisma.ProfileWhereInput) || {}),
          religiousLevel: levels[0],
        };
      } else if (levels.length > 1) {
        where.profile = {
          ...((where.profile as Prisma.ProfileWhereInput) || {}),
          religiousLevel: { in: levels },
        };
      }
    }

    // City filter
    if (city) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        city: { contains: city, mode: 'insensitive' },
      };
    }

    // Marital status filter
    if (maritalStatus) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        maritalStatus,
      };
    }

    // Age filter (birthDate calculation)
    if (ageMin || ageMax) {
      const now = new Date();
      const profileDateFilters: Prisma.DateTimeFilter = {};
      
      if (ageMax) {
        // Born after (younger than ageMax)
        const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
        profileDateFilters.gte = minBirthDate;
      }
      if (ageMin) {
        // Born before (older than ageMin)
        const maxBirthDate = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
        profileDateFilters.lte = maxBirthDate;
      }

      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        birthDate: profileDateFilters,
      };
    }

    // Profile complete filter
    if (isProfileComplete === 'true') {
      where.isProfileComplete = true;
    } else if (isProfileComplete === 'false') {
      where.isProfileComplete = false;
    }

    // Source filter
    if (source) {
      where.source = source as any;
    }

    // ── Sorting ──
    type OrderByInput = Prisma.UserOrderByWithRelationInput;
    let orderBy: OrderByInput;

    switch (sortBy) {
      case 'name':
        orderBy = { firstName: sortOrder };
        break;
      case 'age':
        orderBy = { profile: { birthDate: sortOrder === 'asc' ? 'desc' : 'asc' } };
        break;
      case 'lastActive':
        orderBy = { profile: { lastActive: sortOrder } };
        break;
      case 'priority':
        orderBy = { profile: { priorityScore: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    // ── Count + Fetch ──
    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          source: true,
          language: true,
          createdAt: true,
          isVerified: true,
          isProfileComplete: true,
          addedByMatchmakerId: true,
          images: {
            select: {
              id: true,
              url: true,
              isMain: true,
              cloudinaryPublicId: true,
            },
            orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
            take: 5, // limit images per candidate for mobile perf
          },
          profile: {
            select: {
              id: true,
              gender: true,
              birthDate: true,
              height: true,
              maritalStatus: true,
              hasChildrenFromPrevious: true,
              occupation: true,
              education: true,
              educationLevel: true,
              city: true,
              origin: true,
              religiousLevel: true,
              religiousJourney: true,
              about: true,
              availabilityStatus: true,
              availabilityNote: true,
              lastActive: true,
              createdAt: true,
              updatedAt: true,
              priorityScore: true,
              priorityCategory: true,
              profileCompletenessScore: true,
              wantsToBeFirstParty: true,
              // AI data
              aiProfileSummary: true,
              // Matchmaker notes
              matchingNotes: true,
              internalMatchmakerNotes: true,
              matchmakerImpression: true,
              redFlags: true,
              greenFlags: true,
              readinessLevel: true,
              // Engagement
              suggestionsReceived: true,
              suggestionsAccepted: true,
              suggestionsDeclined: true,
              averageResponseTimeHours: true,
              // Preferences (for quick view)
              preferredAgeMin: true,
              preferredAgeMax: true,
              preferredReligiousLevels: true,
              preferredReligiousJourneys: true,
              preferredLocations: true,
              contactPreference: true,
              // Testimonials count
              testimonials: {
                where: { status: 'APPROVED' },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    // ── Suggestion status mapping (batch) ──
    const userIds = users.map((u) => u.id);

    const activeSuggestions = userIds.length > 0
      ? await prisma.matchSuggestion.findMany({
          where: {
            OR: [
              { firstPartyId: { in: userIds } },
              { secondPartyId: { in: userIds } },
            ],
            status: {
              in: [...BLOCKING_SUGGESTION_STATUSES, ...PENDING_SUGGESTION_STATUSES],
            },
          },
          select: {
            id: true,
            status: true,
            firstPartyId: true,
            secondPartyId: true,
            firstParty: { select: { firstName: true, lastName: true } },
            secondParty: { select: { firstName: true, lastName: true } },
          },
        })
      : [];

    // Build suggestion map
    const suggestionMap = new Map<string, {
      status: 'BLOCKED' | 'PENDING';
      suggestionId: string;
      withCandidateName: string;
      suggestionStatus: string;
    }>();

    for (const s of activeSuggestions) {
      const isBlocking = BLOCKING_SUGGESTION_STATUSES.includes(s.status);
      const statusType = isBlocking ? 'BLOCKED' : 'PENDING';

      // First party
      if (!suggestionMap.has(s.firstPartyId) || (isBlocking && suggestionMap.get(s.firstPartyId)?.status !== 'BLOCKED')) {
        suggestionMap.set(s.firstPartyId, {
          status: statusType,
          suggestionId: s.id,
          withCandidateName: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          suggestionStatus: s.status,
        });
      }

      // Second party
      if (!suggestionMap.has(s.secondPartyId) || (isBlocking && suggestionMap.get(s.secondPartyId)?.status !== 'BLOCKED')) {
        suggestionMap.set(s.secondPartyId, {
          status: statusType,
          suggestionId: s.id,
          withCandidateName: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          suggestionStatus: s.status,
        });
      }
    }

    // ── Format response ──
    const candidates = users.map((u) => {
      const profile = u.profile!;
      const birthDate = new Date(profile.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      return {
        id: u.id,
        email: u.email,
        phone: u.phone,
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
        source: u.source,
        language: u.language,
        isVerified: u.isVerified,
        isProfileComplete: u.isProfileComplete,
        createdAt: u.createdAt.toISOString(),
        // Main image for grid view
        mainImage: u.images.find((i) => i.isMain)?.url || u.images[0]?.url || null,
        imagesCount: u.images.length,
        images: u.images,
        // Profile summary
        gender: profile.gender,
        age,
        birthDate: profile.birthDate.toISOString(),
        height: profile.height,
        city: profile.city,
        origin: profile.origin,
        occupation: profile.occupation,
        education: profile.education,
        educationLevel: profile.educationLevel,
        maritalStatus: profile.maritalStatus,
        hasChildrenFromPrevious: profile.hasChildrenFromPrevious,
        religiousLevel: profile.religiousLevel,
        religiousJourney: profile.religiousJourney,
        about: profile.about,
        availabilityStatus: profile.availabilityStatus,
        availabilityNote: profile.availabilityNote,
        lastActive: profile.lastActive?.toISOString() || null,
        // Priority & quality
        priorityScore: profile.priorityScore,
        priorityCategory: profile.priorityCategory,
        profileCompleteness: profile.profileCompletenessScore,
        wantsToBeFirstParty: profile.wantsToBeFirstParty,
        // AI data
        aiSummary: profile.aiProfileSummary,
        // Matchmaker info
        matchingNotes: profile.matchingNotes,
        internalNotes: profile.internalMatchmakerNotes,
        matchmakerImpression: profile.matchmakerImpression,
        redFlags: profile.redFlags,
        greenFlags: profile.greenFlags,
        readinessLevel: profile.readinessLevel,
        // Engagement stats
        suggestionsReceived: profile.suggestionsReceived,
        suggestionsAccepted: profile.suggestionsAccepted,
        suggestionsDeclined: profile.suggestionsDeclined,
        avgResponseTime: profile.averageResponseTimeHours,
        testimonialsCount: profile.testimonials.length,
        // Preferences
        preferredAgeRange: profile.preferredAgeMin && profile.preferredAgeMax
          ? { min: profile.preferredAgeMin, max: profile.preferredAgeMax }
          : null,
        preferredReligiousLevels: profile.preferredReligiousLevels,
        preferredReligiousJourneys: profile.preferredReligiousJourneys,
        preferredLocations: profile.preferredLocations,
        contactPreference: profile.contactPreference,
        // Suggestion status
        suggestionStatus: suggestionMap.get(u.id) || null,
      };
    });

    // ── Aggregated filter options (for UI chips) ──
    // Only compute on first page or when explicitly requested
    let filterOptions: {
      cities: { value: string; count: number }[];
      religiousLevels: { value: string; count: number }[];
      genders: { value: string; count: number }[];
      availabilityStatuses: { value: string; count: number }[];
      maritalStatuses: { value: string; count: number }[];
    } | undefined = undefined;
    if (page === 1 || params.get('includeFilterOptions') === 'true') {
      const [cityCounts, religiousLevelCounts, genderCounts, availabilityCounts, maritalStatusCounts] = await Promise.all([
        prisma.profile.groupBy({
          by: ['city'],
          where: { user: { status: { notIn: ['BLOCKED', 'INACTIVE'] }, role: 'CANDIDATE' }, city: { not: null } },
          _count: { city: true },
          orderBy: { _count: { city: 'desc' } },
          take: 30,
        }),
        prisma.profile.groupBy({
          by: ['religiousLevel'],
          where: { user: { status: { notIn: ['BLOCKED', 'INACTIVE'] }, role: 'CANDIDATE' }, religiousLevel: { not: null } },
          _count: { religiousLevel: true },
          orderBy: { _count: { religiousLevel: 'desc' } },
        }),
        prisma.profile.groupBy({
          by: ['gender'],
          where: { user: { status: { notIn: ['BLOCKED', 'INACTIVE'] }, role: 'CANDIDATE' } },
          _count: { gender: true },
        }),
        prisma.profile.groupBy({
          by: ['availabilityStatus'],
          where: { user: { status: { notIn: ['BLOCKED', 'INACTIVE'] }, role: 'CANDIDATE' } },
          _count: { availabilityStatus: true },
        }),
        prisma.profile.groupBy({
          by: ['maritalStatus'],
          where: { user: { status: { notIn: ['BLOCKED', 'INACTIVE'] }, role: 'CANDIDATE' }, maritalStatus: { not: null } },
          _count: { maritalStatus: true },
          orderBy: { _count: { maritalStatus: 'desc' } },
        }),
      ]);

      filterOptions = {
        cities: cityCounts.map((c) => ({ value: c.city!, count: c._count.city })),
        religiousLevels: religiousLevelCounts.map((r) => ({
          value: r.religiousLevel!,
          count: r._count.religiousLevel,
        })),
        genders: genderCounts.map((g) => ({ value: g.gender, count: g._count.gender })),
        availabilityStatuses: availabilityCounts.map((a) => ({
          value: a.availabilityStatus,
          count: a._count.availabilityStatus,
        })),
        maritalStatuses: maritalStatusCounts.map((m) => ({
          value: m.maritalStatus!,
          count: m._count.maritalStatus,
        })),
      };
    }

    return corsJson(request, {
      success: true,
      candidates,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
      filterOptions,
    });
  } catch (error) {
    console.error('[Mobile Candidates API] Error:', error);
    return corsError(request, 'Failed to fetch candidates', 500);
  }
}