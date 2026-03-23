// =============================================================================
// src/app/api/matchmaker/potential-matches/route.ts
// API לשליפת התאמות פוטנציאליות - כולל תיקון חיפוש שרת
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, PotentialMatchStatus, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// סטטוסים שחוסמים הצעות חדשות
const BLOCKING_SUGGESTION_STATUSES = [
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
  'ENGAGED',
  'MARRIED',
];

// סטטוסים של הצעות ממתינות
const PENDING_SUGGESTION_STATUSES = [
  'PENDING_FIRST_PARTY',
  'PENDING_SECOND_PARTY',
  'DRAFT',
];

// =============================================================================
// GET - שליפת התאמות פוטנציאליות
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. פרסור Query Parameters
    const { searchParams } = new URL(req.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE))));
    
    const status = searchParams.get('status') || 'all';
    const minScore = parseFloat(searchParams.get('minScore') || '0');
    const maxScore = parseFloat(searchParams.get('maxScore') || '100');
    const sortBy = searchParams.get('sortBy') || 'score_desc';
    const hasWarning = searchParams.get('hasWarning'); // 'true', 'false', or null
    const religiousLevel = searchParams.get('religiousLevel');
    const city = searchParams.get('city');
    
    // ✅ קבלת מילת החיפוש מהלקוח
// קוד מתוקן
const searchTerm = searchParams.get('searchTerm');

// 🆕 NEW: Age range parameters
const maleAgeMin = searchParams.get('maleAgeMin');
const maleAgeMax = searchParams.get('maleAgeMax');
const femaleAgeMin = searchParams.get('femaleAgeMin');
const femaleAgeMax = searchParams.get('femaleAgeMax');

// 🆕 NEW: Religious level per gender
const maleReligiousLevel = searchParams.get('maleReligiousLevel');
const femaleReligiousLevel = searchParams.get('femaleReligiousLevel');
const lastScanMethod = searchParams.get('lastScanMethod');

// 🆕 V3: Advanced filters
const scanSessionId = searchParams.get('scanSessionId');
const scannedAfter = searchParams.get('scannedAfter');
const scannedBefore = searchParams.get('scannedBefore');
const availabilityFilter = searchParams.get('availabilityFilter'); // 'available_only', 'all'
const backgroundCompatibility = searchParams.get('backgroundCompatibility'); // 'excellent', 'good', 'possible', 'problematic'
const maxAsymmetryGap = searchParams.get('maxAsymmetryGap'); // e.g. '10'
const minConfidence = searchParams.get('minConfidence'); // e.g. '0.7'
const dataQuality = searchParams.get('dataQuality'); // 'high', 'medium', 'low'
const isExploratoryMatch = searchParams.get('isExploratoryMatch'); // 'true', 'false'
const tier = searchParams.get('tier'); // 'excellent', 'good', 'fair'

    // 3. בניית Where clause
    const where: Prisma.PotentialMatchWhereInput = {
      aiScore: {
        gte: minScore,
        lte: maxScore,
      }
    };

 // ✅ לוגיקה שמחייבת את הופעת כל המילים (AND)
    if (searchTerm) {
      const cleanTerm = searchTerm.trim();
      const parts = cleanTerm.split(/\s+/).filter(p => p.length > 0);

      if (parts.length > 0) {
        where.OR = [
          // בדיקה על הגבר: האם הוא מכיל את *כל* המילים?
          {
            AND: parts.map(part => ({
              OR: [
                { male: { firstName: { contains: part, mode: 'insensitive' } } },
                { male: { lastName: { contains: part, mode: 'insensitive' } } },
                { male: { phone: { contains: part } } }
              ]
            }))
          },
          // בדיקה על האישה: האם היא מכילה את *כל* המילים?
          {
            AND: parts.map(part => ({
              OR: [
                { female: { firstName: { contains: part, mode: 'insensitive' } } },
                { female: { lastName: { contains: part, mode: 'insensitive' } } },
                { female: { phone: { contains: part } } }
              ]
            }))
          },
          // חיפוש חופשי בנימוק (כאן משאירים את הביטוי המלא)
          { shortReasoning: { contains: cleanTerm, mode: 'insensitive' } }
        ];
      }
    }


// סינון לפי סטטוס
    if (status === 'dismissed') {
      // רק אם מבקשים ספציפית לראות דחויות - הצג רק אותן
      where.status = 'DISMISSED';
    } else if (status !== 'all') {
      if (status === 'with_warnings' || status === 'no_warnings') {
        // סינון זה מתבצע אחרי השליפה
        // גם במקרה הזה, לא להציג DISMISSED
        where.status = { not: 'DISMISSED' };
      } else {
        where.status = status.toUpperCase() as PotentialMatchStatus;
      }
    } else {
      // ברירת מחדל (all) - לא להציג DISMISSED
      where.status = { not: 'DISMISSED' };
    }

    // סינון לפי רמה דתית (ברמת ה-DB)
    if (religiousLevel) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { male: { profile: { religiousLevel: religiousLevel } } },
            { female: { profile: { religiousLevel: religiousLevel } } }
          ]
        }
      ] as Prisma.PotentialMatchWhereInput['AND'];
    }

    // סינון לפי עיר (ברמת ה-DB)
    if (city) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { male: { profile: { city: { contains: city, mode: 'insensitive' } } } },
            { female: { profile: { city: { contains: city, mode: 'insensitive' } } } }
          ]
        }
      ] as Prisma.PotentialMatchWhereInput['AND'];
    }

    // 🆕 NEW: סינון לפי טווח גיל גברים
if (maleAgeMin || maleAgeMax) {
  const today = new Date();
  const ageConditions: Prisma.PotentialMatchWhereInput[] = [];
  
  if (maleAgeMax) {
    // גיל מקסימלי = תאריך לידה מינימלי (מי שנולד אחרי התאריך הזה צעיר יותר)
    const minBirthDate = new Date(
      today.getFullYear() - parseInt(maleAgeMax) - 1,
      today.getMonth(),
      today.getDate()
    );
    ageConditions.push({ male: { profile: { birthDate: { gte: minBirthDate } } } });
  }
  
  if (maleAgeMin) {
    // גיל מינימלי = תאריך לידה מקסימלי (מי שנולד לפני התאריך הזה מבוגר יותר)
    const maxBirthDate = new Date(
      today.getFullYear() - parseInt(maleAgeMin),
      today.getMonth(),
      today.getDate()
    );
    ageConditions.push({ male: { profile: { birthDate: { lte: maxBirthDate } } } });
  }
  
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    ...ageConditions
  ] as Prisma.PotentialMatchWhereInput['AND'];
}

// 🆕 NEW: סינון לפי טווח גיל נשים
if (femaleAgeMin || femaleAgeMax) {
  const today = new Date();
  const ageConditions: Prisma.PotentialMatchWhereInput[] = [];
  
  if (femaleAgeMax) {
    const minBirthDate = new Date(
      today.getFullYear() - parseInt(femaleAgeMax) - 1,
      today.getMonth(),
      today.getDate()
    );
    ageConditions.push({ female: { profile: { birthDate: { gte: minBirthDate } } } });
  }
  
  if (femaleAgeMin) {
    const maxBirthDate = new Date(
      today.getFullYear() - parseInt(femaleAgeMin),
      today.getMonth(),
      today.getDate()
    );
    ageConditions.push({ female: { profile: { birthDate: { lte: maxBirthDate } } } });
  }
  
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    ...ageConditions
  ] as Prisma.PotentialMatchWhereInput['AND'];
}

// 🆕 NEW: סינון לפי רמה דתית של גברים
if (maleReligiousLevel) {
  const levels = maleReligiousLevel.split(',').filter(l => l.trim());
  if (levels.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { male: { profile: { religiousLevel: { in: levels } } } }
    ] as Prisma.PotentialMatchWhereInput['AND'];
  }
}

// 🆕 NEW: סינון לפי רמה דתית של נשים
if (femaleReligiousLevel) {
  const levels = femaleReligiousLevel.split(',').filter(l => l.trim());
  if (levels.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { female: { profile: { religiousLevel: { in: levels } } } }
    ] as Prisma.PotentialMatchWhereInput['AND'];
  }
}
if (lastScanMethod) {
  where.lastScanMethod = lastScanMethod;
}

// 🆕 V3: Scan session filter
if (scanSessionId) {
  where.scanSessionId = scanSessionId;
}

// 🆕 V3: Date range filter
if (scannedAfter || scannedBefore) {
  const dateFilter: any = {};
  if (scannedAfter) dateFilter.gte = new Date(scannedAfter);
  if (scannedBefore) dateFilter.lte = new Date(scannedBefore);
  where.scannedAt = dateFilter;
}

// 🆕 V3: Availability filter
if (availabilityFilter === 'available_only') {
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    { male: { profile: { availabilityStatus: 'AVAILABLE' } } },
    { female: { profile: { availabilityStatus: 'AVAILABLE' } } },
  ] as Prisma.PotentialMatchWhereInput['AND'];
}

// 🆕 V3: Background compatibility filter
if (backgroundCompatibility) {
  const levels = backgroundCompatibility.split(',').filter(l => l.trim());
  if (levels.length > 0) {
    where.backgroundCompatibility = { in: levels };
  }
}

// 🆕 V3: Asymmetry gap filter
if (maxAsymmetryGap) {
  const maxGap = parseFloat(maxAsymmetryGap);
  if (!isNaN(maxGap)) {
    where.asymmetryGap = { lte: maxGap };
  }
}

// 🆕 V3: Confidence level filter
if (minConfidence) {
  const minConf = parseFloat(minConfidence);
  if (!isNaN(minConf)) {
    where.confidenceLevel = { gte: minConf };
  }
}

// 🆕 V3: Data quality filter
if (dataQuality) {
  where.dataQuality = dataQuality;
}

// 🆕 V3: Exploratory match filter
if (isExploratoryMatch === 'true') {
  where.isExploratoryMatch = true;
} else if (isExploratoryMatch === 'false') {
  where.isExploratoryMatch = false;
}

// 🆕 V3: Tier quick filter (based on aiScore ranges)
if (tier) {
  switch (tier) {
    case 'excellent':
      where.aiScore = { gte: 85, lte: maxScore };
      break;
    case 'good':
      where.aiScore = { gte: 70, lt: 85 };
      break;
    case 'fair':
      where.aiScore = { gte: minScore, lt: 70 };
      break;
  }
}
    // 4. בניית Order By
    let orderBy: Prisma.PotentialMatchOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'score_desc':
        orderBy = { aiScore: 'desc' };
        break;
      case 'score_asc':
        orderBy = { aiScore: 'asc' };
        break;
      case 'date_desc':
        orderBy = { scannedAt: 'desc' };
        break;
      case 'date_asc':
        orderBy = { scannedAt: 'asc' };
        break;
      case 'asymmetry_desc':
        orderBy = { asymmetryGap: 'desc' };
        break;
      default:
        orderBy = { aiScore: 'desc' };
    }

    // 5. שליפת ההתאמות
    const [matches, totalCount] = await Promise.all([
      prisma.potentialMatch.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          male: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isVerified: true,
              isProfileComplete: true,
              createdAt: true,
              images: {
                where: { isMain: true },
                select: { url: true },
                take: 1,
              },
              profile: {
                select: {
                    id: true,
                  gender: true,
                  birthDate: true,
                  city: true,
                  religiousLevel: true,
                  occupation: true,
                  availabilityStatus: true,
                  lastActive: true,
                }
              }
            }
          },
          female: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isVerified: true,
              isProfileComplete: true,
              createdAt: true,
              images: {
                where: { isMain: true },
                select: { url: true },
                take: 1,
              },
              profile: {
                select: {
                    id: true,
                  gender: true,
                  birthDate: true,
                  city: true,
                  religiousLevel: true,
                  occupation: true,
                  availabilityStatus: true,
                  lastActive: true,
                }
              }
            }
          }
        }
      }),
      prisma.potentialMatch.count({ where })
    ]);

    // 6. שליפת הצעות פעילות עבור כל המועמדים
    const allUserIds = new Set<string>();
    for (const match of matches) {
      allUserIds.add(match.maleUserId);
      allUserIds.add(match.femaleUserId);
    }

    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: { in: Array.from(allUserIds) } },
          { secondPartyId: { in: Array.from(allUserIds) } },
        ],
        status: { in: [...BLOCKING_SUGGESTION_STATUSES, ...PENDING_SUGGESTION_STATUSES] as any }
      },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { firstName: true, lastName: true } },
        secondParty: { select: { firstName: true, lastName: true } },
        createdAt: true,
      }
    });

    // יצירת מפה של הצעות פעילות
    const activeSuggestionMap = new Map<string, {
      suggestionId: string;
      status: string;
      withCandidateName: string;
      withCandidateId: string;
      createdAt: Date;
      isBlocking: boolean;
    }>();

    for (const suggestion of activeSuggestions) {
      const isBlocking = BLOCKING_SUGGESTION_STATUSES.includes(suggestion.status);
      
      // עבור הצד הראשון
      const existingFirst = activeSuggestionMap.get(suggestion.firstPartyId);
      if (!existingFirst || (isBlocking && !existingFirst.isBlocking)) {
        activeSuggestionMap.set(suggestion.firstPartyId, {
          suggestionId: suggestion.id,
          status: suggestion.status,
          withCandidateName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
          withCandidateId: suggestion.secondPartyId,
          createdAt: suggestion.createdAt,
          isBlocking,
        });
      }

      // עבור הצד השני
      const existingSecond = activeSuggestionMap.get(suggestion.secondPartyId);
      if (!existingSecond || (isBlocking && !existingSecond.isBlocking)) {
        activeSuggestionMap.set(suggestion.secondPartyId, {
          suggestionId: suggestion.id,
          status: suggestion.status,
          withCandidateName: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
          withCandidateId: suggestion.firstPartyId,
          createdAt: suggestion.createdAt,
          isBlocking,
        });
      }
    }

    // 6.5 שליפת הצעות קיימות ברמת הזוג (male+female)
    const pairConditions = matches.map(m => ({
      AND: [
        { OR: [{ firstPartyId: m.maleUserId }, { secondPartyId: m.maleUserId }] },
        { OR: [{ firstPartyId: m.femaleUserId }, { secondPartyId: m.femaleUserId }] },
      ]
    }));

    const pairSuggestions = pairConditions.length > 0
      ? await prisma.matchSuggestion.findMany({
          where: { OR: pairConditions as any },
          select: {
            id: true,
            status: true,
            firstPartyId: true,
            secondPartyId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // מפה: "maleId::femaleId" → הצעה קיימת
    const pairSuggestionMap = new Map<string, {
      suggestionId: string;
      status: string;
      createdAt: Date;
    }>();

    for (const s of pairSuggestions) {
      // בדיקה לכל כיוון - ההצעה יכולה להיות בכל סדר
      for (const m of matches) {
        const isMatch =
          (s.firstPartyId === m.maleUserId && s.secondPartyId === m.femaleUserId) ||
          (s.firstPartyId === m.femaleUserId && s.secondPartyId === m.maleUserId);
        if (isMatch) {
          const key = `${m.maleUserId}::${m.femaleUserId}`;
          if (!pairSuggestionMap.has(key)) {
            pairSuggestionMap.set(key, {
              suggestionId: s.id,
              status: s.status,
              createdAt: s.createdAt,
            });
          }
        }
      }
    }

    // 7. עיבוד התוצאות
const processedMatches = matches.map(match => {
  const maleAge = calculateAge(match.male.profile?.birthDate);
  const femaleAge = calculateAge(match.female.profile?.birthDate);

  const maleActiveSuggestion = activeSuggestionMap.get(match.maleUserId) || null;
  const femaleActiveSuggestion = activeSuggestionMap.get(match.femaleUserId) || null;

  const hasActiveWarning = !!(
    (maleActiveSuggestion?.isBlocking) ||
    (femaleActiveSuggestion?.isBlocking)
  );

  // הצעה קיימת ברמת הזוג
  const pairKey = `${match.maleUserId}::${match.femaleUserId}`;
  const existingSuggestionForPair = pairSuggestionMap.get(pairKey) || null;

  return {
    id: match.id,
    
    male: {
      id: match.male.id,
      profileId: match.male.profile?.id || '',
      firstName: match.male.firstName,
      lastName: match.male.lastName,
      age: maleAge,
      phone: match.male.phone, 
      city: match.male.profile?.city || null,
      religiousLevel: match.male.profile?.religiousLevel || null,
      occupation: match.male.profile?.occupation || null,
      mainImage: match.male.images[0]?.url || null,
      isVerified: match.male.isVerified,
      isProfileComplete: match.male.isProfileComplete,
      availabilityStatus: match.male.profile?.availabilityStatus || 'AVAILABLE',
      lastActive: match.male.profile?.lastActive,
      registeredAt: match.male.createdAt,
    },

    female: {
      id: match.female.id,
      profileId: match.female.profile?.id || '', 
      firstName: match.female.firstName,
      lastName: match.female.lastName,
      age: femaleAge,
      phone: match.female.phone,
      city: match.female.profile?.city || null,
      religiousLevel: match.female.profile?.religiousLevel || null,
      occupation: match.female.profile?.occupation || null,
      mainImage: match.female.images[0]?.url || null,
      isVerified: match.female.isVerified,
      isProfileComplete: match.female.isProfileComplete,
      availabilityStatus: match.female.profile?.availabilityStatus || 'AVAILABLE',
      lastActive: match.female.profile?.lastActive,
      registeredAt: match.female.createdAt,
    },

    // ציונים בסיסיים
    aiScore: match.aiScore,
    firstPassScore: match.firstPassScore,
    scoreBreakdown: match.scoreBreakdown,
    
    // נימוקים (shortReasoning only - detailed loaded on demand)
    shortReasoning: match.shortReasoning,
    detailedReasoning: null, // lazy loaded via /api/matchmaker/potential-matches/[id]/reasoning
    
    // רקע
    backgroundCompatibility: match.backgroundCompatibility,
    backgroundMultiplier: match.backgroundMultiplier,

    // ═══════════════════════════════════════════════════════════
    // 🔧 תיקון: הוספת כל השדות החסרים!
    // ═══════════════════════════════════════════════════════════
    
    // Hybrid Method (reasoning lazy loaded)
    hybridScore: match.hybridScore,
    hybridReasoning: null,
    hybridScannedAt: match.hybridScannedAt,
    hybridScoreBreakdown: match.hybridScoreBreakdown,

    // Algorithmic Method (reasoning lazy loaded)
    algorithmicScore: match.algorithmicScore,
    algorithmicReasoning: null,
    algorithmicScannedAt: match.algorithmicScannedAt,
    algorithmicScoreBreakdown: match.algorithmicScoreBreakdown,

    // Vector Method (reasoning lazy loaded)
    vectorScore: match.vectorScore,
    vectorReasoning: null,
    vectorScannedAt: match.vectorScannedAt,

    // Metrics V2 Method (reasoning lazy loaded)
    metricsV2Score: match.metricsV2Score,
    metricsV2Reasoning: null,
    metricsV2ScannedAt: match.metricsV2ScannedAt,
    metricsV2ScoreBreakdown: match.metricsV2ScoreBreakdown,
    
    // השיטה האחרונה שרצה
    lastScanMethod: match.lastScanMethod,
    // ═══════════════════════════════════════════════════════════

    // סטטוס ותאריכים
    status: match.status,
    scannedAt: match.scannedAt,
    reviewedAt: match.reviewedAt,
    suggestionId: match.suggestionId,

    // אזהרות
    maleActiveSuggestion,
    femaleActiveSuggestion,
    hasActiveWarning,

    // הצעה קיימת ברמת הזוג
    existingSuggestionForPair,
  };
});


    // 8. סינון נוסף לפי אזהרות (מבוצע בזיכרון כי זה שדה מחושב)
    // הערה: החיפוש הטקסטואלי כבר בוצע למעלה ב-DB, אז אין צורך לסנן אותו כאן שוב.
    let filteredMatches = processedMatches;
    if (hasWarning === 'true') {
      filteredMatches = processedMatches.filter(m => m.hasActiveWarning);
    } else if (hasWarning === 'false') {
      filteredMatches = processedMatches.filter(m => !m.hasActiveWarning);
    }

    // 9. חישוב סטטיסטיקות
    const stats = await calculateStats();

    // 10. שליפת מידע על הסריקה האחרונה
    const lastScan = await prisma.nightlyScanLog.findFirst({
      where: { status: { in: ['completed', 'partial'] } },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
        totalCandidates: true,
        candidatesScanned: true,
        matchesFound: true,
        newMatches: true,
        durationMs: true,
      }
    });

    // 11. החזרת התוצאות
    return NextResponse.json({
      success: true,
      matches: filteredMatches,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      stats,
      lastScanInfo: lastScan ? {
        id: lastScan.id,
        startedAt: lastScan.startedAt,
        completedAt: lastScan.completedAt,
        status: lastScan.status,
        totalCandidates: lastScan.totalCandidates,
        candidatesScanned: lastScan.candidatesScanned,
        matchesFound: lastScan.matchesFound,
        newMatches: lastScan.newMatches,
        durationMs: lastScan.durationMs,
      } : null,
    });

  } catch (error) {
    console.error('[PotentialMatches] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// =============================================================================
// POST - פעולות על התאמה פוטנציאלית
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. פרסור הבקשה
    const body = await req.json();
    const { matchId, action, reason, suggestionData } = body;

    if (!matchId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: "matchId and action are required" 
      }, { status: 400 });
    }

    // 3. שליפת ההתאמה
    const match = await prisma.potentialMatch.findUnique({
      where: { id: matchId },
      include: {
        male: { select: { id: true, firstName: true, lastName: true } },
        female: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    // 4. ביצוע הפעולה
    switch (action) {
      case 'review': {
        await prisma.potentialMatch.update({
          where: { id: matchId },
          data: {
            status: 'REVIEWED',
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'ההתאמה סומנה כנבדקה',
        });
      }

      case 'save': {
        await prisma.potentialMatch.update({
          where: { id: matchId },
          data: {
            status: 'SHORTLISTED',
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'ההתאמה נשמרה בצד',
        });
      }

      case 'dismiss': {
        await prisma.potentialMatch.update({
          where: { id: matchId },
          data: {
            status: 'DISMISSED',
            dismissedAt: new Date(),
            reviewedBy: session.user.id,
            dismissReason: reason || null,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'ההתאמה נדחתה',
        });
      }

      case 'restore': {
        await prisma.potentialMatch.update({
          where: { id: matchId },
          data: {
            status: 'PENDING',
            dismissedAt: null,
            dismissReason: null,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'ההתאמה שוחזרה',
        });
      }

      case 'create_suggestion': {
        // בדיקה שלא קיימת כבר הצעה
        const existingSuggestion = await prisma.matchSuggestion.findFirst({
          where: {
            OR: [
              { firstPartyId: match.maleUserId, secondPartyId: match.femaleUserId },
              { firstPartyId: match.femaleUserId, secondPartyId: match.maleUserId },
            ],
            status: { notIn: ['FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED', 'CLOSED', 'CANCELLED'] }
          }
        });

        if (existingSuggestion) {
          return NextResponse.json({
            success: false,
            error: 'כבר קיימת הצעה פעילה בין שני המועמדים',
            suggestionId: existingSuggestion.id,
          }, { status: 400 });
        }

        // יצירת הצעה חדשה
        const suggestion = await prisma.matchSuggestion.create({
          data: {
            firstPartyId: match.maleUserId,
            secondPartyId: match.femaleUserId,
            matchmakerId: session.user.id,
            status: 'DRAFT',
            priority: suggestionData?.priority || 'MEDIUM',
            matchingReason: suggestionData?.matchingReason || match.shortReasoning || `התאמת AI - ציון ${match.aiScore}`,
            firstPartyNotes: suggestionData?.firstPartyNotes || '',
            secondPartyNotes: suggestionData?.secondPartyNotes || '',
            internalNotes: `נוצר מהתאמה פוטנציאלית #${match.id}`,
          }
        });

        // עדכון ההתאמה הפוטנציאלית
        await prisma.potentialMatch.update({
          where: { id: matchId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            suggestionId: suggestion.id,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'הצעה נוצרה בהצלחה',
          suggestionId: suggestion.id,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[PotentialMatches] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// =============================================================================
// DELETE - פעולות מרובות (bulk actions)
// =============================================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. פרסור הבקשה
    const body = await req.json();
    const { matchIds, action, reason } = body;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "matchIds array is required" 
      }, { status: 400 });
    }

    // 3. ביצוע פעולה מרובה
    let updateData: any = {};
    
    switch (action) {
      case 'dismiss':
        updateData = {
          status: 'DISMISSED',
          dismissedAt: new Date(),
          reviewedBy: session.user.id,
          dismissReason: reason || 'דחייה מרובה',
        };
        break;
        
      case 'review':
        updateData = {
          status: 'REVIEWED',
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        };
        break;
        
      case 'restore':
        updateData = {
          status: 'PENDING',
          dismissedAt: null,
          dismissReason: null,
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown bulk action: ${action}`,
        }, { status: 400 });
    }

    const result = await prisma.potentialMatch.updateMany({
      where: { id: { in: matchIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      processed: result.count,
      message: `${result.count} התאמות עודכנו בהצלחה`,
    });

  } catch (error) {
    console.error('[PotentialMatches] DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateAge(birthDate: Date | null | undefined): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

async function calculateStats() {
  const [statusCounts, avgScoreResult, scoreTiers] = await Promise.all([
    // ספירה לפי סטטוס
    prisma.potentialMatch.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    
    // ציון ממוצע
    prisma.potentialMatch.aggregate({
      where: { status: { in: ['PENDING', 'REVIEWED'] } },
      _avg: { aiScore: true }
    }),
    
    // התפלגות ציונים
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN "aiScore" >= 85 THEN 'high'
          WHEN "aiScore" >= 70 THEN 'medium'
          ELSE 'low'
        END as tier,
        COUNT(*) as count
      FROM "PotentialMatch"
      WHERE status IN ('PENDING', 'REVIEWED')
      GROUP BY tier
    ` as Promise<Array<{ tier: string; count: bigint }>>
  ]);

  const stats: any = {
    total: 0,
    pending: 0,
    reviewed: 0,
    sent: 0,
    dismissed: 0,
    expired: 0,
    withWarnings: 0, // יחושב בנפרד אם נדרש, אך כאן הוא רק placeholder
    avgScore: Math.round((avgScoreResult._avg.aiScore || 0) * 10) / 10,
    highScore: 0,
    mediumScore: 0,
  };

  for (const item of statusCounts) {
    const status = item.status.toLowerCase();
    if (status in stats) {
      stats[status] = item._count.id;
    }
    stats.total += item._count.id;
  }

  for (const tier of scoreTiers) {
    if (tier.tier === 'high') stats.highScore = Number(tier.count);
    if (tier.tier === 'medium') stats.mediumScore = Number(tier.count);
  }

  return stats;
}