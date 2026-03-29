// =============================================================================
// src/app/api/mobile/matchmaker/candidates/route.ts
// =============================================================================
// Matchmaker Candidates API — Paginated & Filterable for Mobile
// Supports: server-side pagination, filtering, sorting, search,
//           advanced filters, tags, notes, smart segments
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

    // Basic filters
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

    // Advanced filters
    const bodyType = params.get('bodyType') || null;
    const appearanceTone = params.get('appearanceTone') || null;
    const ethnicBackground = params.get('ethnicBackground') || null;
    const languagesParam = params.get('languages') || null;
    const educationLevel = params.get('educationLevel') || null;
    const smokingStatus = params.get('smokingStatus') || null;
    const headCovering = params.get('headCovering') || null;
    const kippahType = params.get('kippahType') || null;
    const readinessLevel = params.get('readinessLevel') || null;
    const profileCompletenessMin = params.get('profileCompletenessMin') ? parseFloat(params.get('profileCompletenessMin')!) : null;
    const lastActiveDays = params.get('lastActiveDays') ? parseInt(params.get('lastActiveDays')!) : null;
    const hasChildrenFromPrevious = params.get('hasChildrenFromPrevious');
    const hasNoSuggestions = params.get('hasNoSuggestions');
    const customTags = params.get('customTags') || null;
    const advancedSearchQuery = params.get('advancedSearchQuery')?.trim() || null;
    const searchInAbout = params.get('searchInAbout') === 'true';
    const searchInPartnerPrefs = params.get('searchInPartnerPrefs') === 'true';
    const searchInMatchmakerNotes = params.get('searchInMatchmakerNotes') === 'true';

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
        const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
        profileDateFilters.gte = minBirthDate;
      }
      if (ageMin) {
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

    // ── Advanced filters ──

    // Body type
    if (bodyType) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        bodyType: bodyType as any,
      };
    }

    // Appearance tone
    if (appearanceTone) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        appearanceTone: appearanceTone as any,
      };
    }

    // Ethnic background (on ProfileMetrics)
    if (ethnicBackground) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        metrics: { ethnicBackground: ethnicBackground as any },
      };
    }

    // Education level
    if (educationLevel) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        educationLevel,
      };
    }

    // Smoking status
    if (smokingStatus) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        smokingStatus,
      };
    }

    // Head covering
    if (headCovering) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        headCovering: headCovering as any,
      };
    }

    // Kippah type
    if (kippahType) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        kippahType: kippahType as any,
      };
    }

    // Readiness level
    if (readinessLevel) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        readinessLevel: readinessLevel as any,
      };
    }

    // Profile completeness minimum
    if (profileCompletenessMin != null) {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        profileCompletenessScore: { gte: profileCompletenessMin },
      };
    }

    // Last active within N days
    if (lastActiveDays != null) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - lastActiveDays);
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        lastActive: { gte: cutoff },
      };
    }

    // Has children from previous
    if (hasChildrenFromPrevious === 'true') {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        hasChildrenFromPrevious: true,
      };
    } else if (hasChildrenFromPrevious === 'false') {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        hasChildrenFromPrevious: false,
      };
    }

    // Has no suggestions
    if (hasNoSuggestions === 'true') {
      where.profile = {
        ...((where.profile as Prisma.ProfileWhereInput) || {}),
        suggestionsReceived: 0,
      };
    }

    // Languages filter (comma-separated)
    if (languagesParam) {
      const langs = languagesParam.split(',').filter(Boolean);
      if (langs.length > 0) {
        // Match if nativeLanguage is one of the specified OR additionalLanguages overlap
        where.profile = {
          ...((where.profile as Prisma.ProfileWhereInput) || {}),
          OR: [
            { nativeLanguage: { in: langs, mode: 'insensitive' } },
            { additionalLanguages: { hasSome: langs } },
          ],
        };
      }
    }

    // Custom tags filter (comma-separated tag IDs)
    if (customTags) {
      const tagIds = customTags.split(',').filter(Boolean);
      if (tagIds.length > 0) {
        where.candidateCustomTags = {
          some: {
            tagId: { in: tagIds },
          },
        };
      }
    }

    // Advanced search query (search in about, partner prefs, matchmaker notes)
    if (advancedSearchQuery) {
      const advSearchOr: Prisma.UserWhereInput[] = [];
      if (searchInAbout) {
        advSearchOr.push({
          profile: { about: { contains: advancedSearchQuery, mode: 'insensitive' } },
        });
      }
      if (searchInPartnerPrefs) {
        advSearchOr.push({
          profile: { matchingNotes: { contains: advancedSearchQuery, mode: 'insensitive' } },
        });
      }
      if (searchInMatchmakerNotes) {
        advSearchOr.push({
          profile: { internalMatchmakerNotes: { contains: advancedSearchQuery, mode: 'insensitive' } },
        });
      }
      // If no specific fields, search in all three
      if (advSearchOr.length === 0) {
        advSearchOr.push(
          { profile: { about: { contains: advancedSearchQuery, mode: 'insensitive' } } },
          { profile: { matchingNotes: { contains: advancedSearchQuery, mode: 'insensitive' } } },
          { profile: { internalMatchmakerNotes: { contains: advancedSearchQuery, mode: 'insensitive' } } },
        );
      }
      // Append as AND condition
      if (!where.AND) where.AND = [];
      (where.AND as Prisma.UserWhereInput[]).push({ OR: advSearchOr });
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
            take: 5,
          },
          // Tags for this matchmaker
          candidateCustomTags: {
            where: { tag: { matchmakerId: auth.userId } },
            select: {
              tag: {
                select: { id: true, name: true, color: true },
              },
            },
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
              // Appearance
              bodyType: true,
              appearanceTone: true,
              smokingStatus: true,
              headCovering: true,
              kippahType: true,
              nativeLanguage: true,
              additionalLanguages: true,
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
              // Preferences
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
              // Deal-breakers from metrics
              metrics: {
                select: {
                  ethnicBackground: true,
                  dealBreakersHard: true,
                  dealBreakersSoft: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // ── Batch queries for enrichment data ──
    const userIds = users.map((u) => u.id);

    const [activeSuggestions, notesCounts, recentSuggestionsData] = await Promise.all([
      // Suggestion status mapping
      userIds.length > 0
        ? prisma.matchSuggestion.findMany({
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
        : Promise.resolve([]),

      // Notes count per candidate (for this matchmaker)
      userIds.length > 0
        ? prisma.matchmakerNote.groupBy({
            by: ['userId'],
            where: {
              matchmakerId: auth.userId,
              userId: { in: userIds },
            },
            _count: { id: true },
          })
        : Promise.resolve([]),

      // Recent suggestions per candidate (last 5 per user)
      userIds.length > 0
        ? prisma.matchSuggestion.findMany({
            where: {
              OR: [
                { firstPartyId: { in: userIds } },
                { secondPartyId: { in: userIds } },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: userIds.length * 5, // rough upper bound
            select: {
              id: true,
              status: true,
              createdAt: true,
              firstPartyId: true,
              secondPartyId: true,
              firstParty: { select: { firstName: true, lastName: true } },
              secondParty: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    // Build suggestion status map
    const suggestionMap = new Map<string, {
      status: 'BLOCKED' | 'PENDING';
      suggestionId: string;
      withCandidateName: string;
      suggestionStatus: string;
    }>();

    for (const s of activeSuggestions) {
      const isBlocking = BLOCKING_SUGGESTION_STATUSES.includes(s.status);
      const statusType = isBlocking ? 'BLOCKED' : 'PENDING';

      if (!suggestionMap.has(s.firstPartyId) || (isBlocking && suggestionMap.get(s.firstPartyId)?.status !== 'BLOCKED')) {
        suggestionMap.set(s.firstPartyId, {
          status: statusType,
          suggestionId: s.id,
          withCandidateName: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          suggestionStatus: s.status,
        });
      }

      if (!suggestionMap.has(s.secondPartyId) || (isBlocking && suggestionMap.get(s.secondPartyId)?.status !== 'BLOCKED')) {
        suggestionMap.set(s.secondPartyId, {
          status: statusType,
          suggestionId: s.id,
          withCandidateName: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          suggestionStatus: s.status,
        });
      }
    }

    // Build notes count map
    const notesCountMap = new Map<string, number>();
    for (const nc of notesCounts) {
      notesCountMap.set(nc.userId, nc._count.id);
    }

    // Build recent suggestions map (max 5 per user)
    const recentSuggestionsMap = new Map<string, Array<{
      id: string;
      status: string;
      createdAt: string;
      partnerName: string;
      role: 'first' | 'second';
    }>>();

    for (const s of recentSuggestionsData) {
      // For first party
      if (!recentSuggestionsMap.has(s.firstPartyId)) {
        recentSuggestionsMap.set(s.firstPartyId, []);
      }
      const firstList = recentSuggestionsMap.get(s.firstPartyId)!;
      if (firstList.length < 5) {
        firstList.push({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          partnerName: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          role: 'first',
        });
      }

      // For second party
      if (!recentSuggestionsMap.has(s.secondPartyId)) {
        recentSuggestionsMap.set(s.secondPartyId, []);
      }
      const secondList = recentSuggestionsMap.get(s.secondPartyId)!;
      if (secondList.length < 5) {
        secondList.push({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          partnerName: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          role: 'second',
        });
      }
    }

    // ── Format response ──
    const candidates = users.map((u) => {
      const profile = u.profile!;
      const birthDate = new Date(profile.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Combine languages
      const languages: string[] = [];
      if (profile.nativeLanguage) languages.push(profile.nativeLanguage);
      if (profile.additionalLanguages) languages.push(...profile.additionalLanguages);

      // Parse deal-breakers from metrics JSON
      const metrics = profile.metrics;
      let dealBreakersHard: string[] = [];
      let dealBreakersSoft: string[] = [];
      if (metrics) {
        try {
          dealBreakersHard = Array.isArray(metrics.dealBreakersHard) ? metrics.dealBreakersHard as string[] : JSON.parse(String(metrics.dealBreakersHard || '[]'));
          dealBreakersSoft = Array.isArray(metrics.dealBreakersSoft) ? metrics.dealBreakersSoft as string[] : JSON.parse(String(metrics.dealBreakersSoft || '[]'));
        } catch { /* ignore parse errors */ }
      }

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
        // Images
        mainImage: u.images.find((i) => i.isMain)?.url || u.images[0]?.url || null,
        imagesCount: u.images.length,
        images: u.images,
        // Profile core
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
        // Appearance
        bodyType: profile.bodyType,
        appearanceTone: profile.appearanceTone,
        ethnicBackground: metrics?.ethnicBackground || null,
        languages,
        smokingStatus: profile.smokingStatus,
        headCovering: profile.headCovering,
        kippahType: profile.kippahType,
        // Status
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
        aiScore: null as number | null,
        aiScoreDate: null as string | null,
        // Soul fingerprint (null = not computed here; frontend handles)
        soulFingerprintStatus: null as string | null,
        // Matchmaker info
        matchingNotes: profile.matchingNotes,
        internalNotes: profile.internalMatchmakerNotes,
        matchmakerImpression: profile.matchmakerImpression,
        redFlags: profile.redFlags,
        greenFlags: profile.greenFlags,
        readinessLevel: profile.readinessLevel,
        // Tags (this matchmaker's tags assigned to this candidate)
        tags: u.candidateCustomTags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
        })),
        notesCount: notesCountMap.get(u.id) || 0,
        // Deal-breakers
        dealBreakersHard,
        dealBreakersSoft,
        // Engagement stats
        suggestionsReceived: profile.suggestionsReceived,
        suggestionsAccepted: profile.suggestionsAccepted,
        suggestionsDeclined: profile.suggestionsDeclined,
        avgResponseTime: profile.averageResponseTimeHours,
        testimonialsCount: profile.testimonials.length,
        recentSuggestions: recentSuggestionsMap.get(u.id) || [],
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

    // ── Smart Segment Counts (on first page or explicit request) ──
    let segmentCounts: {
      newThisWeek: number;
      waitingForSuggestion: number;
      incompleteProfile: number;
      activeToday: number;
    } | undefined = undefined;

    if (page === 1 || params.get('includeFilterOptions') === 'true') {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const baseWhere: Prisma.UserWhereInput = {
        status: { notIn: ['BLOCKED', 'INACTIVE'] },
        role: 'CANDIDATE',
        profile: { isNot: null },
      };

      const [newThisWeek, waitingForSuggestion, incompleteProfile, activeToday] = await Promise.all([
        prisma.user.count({
          where: { ...baseWhere, createdAt: { gte: oneWeekAgo } },
        }),
        prisma.user.count({
          where: {
            status: { notIn: ['BLOCKED', 'INACTIVE'] },
            role: 'CANDIDATE',
            isProfileComplete: true,
            profile: {
              availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
              suggestionsReceived: 0,
            },
          },
        }),
        prisma.user.count({
          where: { ...baseWhere, isProfileComplete: false },
        }),
        prisma.user.count({
          where: {
            status: { notIn: ['BLOCKED', 'INACTIVE'] },
            role: 'CANDIDATE',
            profile: { lastActive: { gte: oneDayAgo } },
          },
        }),
      ]);

      segmentCounts = { newThisWeek, waitingForSuggestion, incompleteProfile, activeToday };
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
      segmentCounts,
    });
  } catch (error) {
    console.error('[Mobile Candidates API] Error:', error);
    return corsError(request, 'Failed to fetch candidates', 500);
  }
}
