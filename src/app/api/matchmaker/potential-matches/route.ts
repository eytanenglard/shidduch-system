// =============================================================================
// src/app/api/matchmaker/potential-matches/route.ts
// API לשליפת התאמות פוטנציאליות שנמצאו בסריקה הלילית
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, PotentialMatchStatus } from "@prisma/client";
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
    const searchTerm = searchParams.get('search');

    // 3. בניית Where clause
    const where: any = {
      aiScore: {
        gte: minScore,
        lte: maxScore,
      }
    };

    // סינון לפי סטטוס
    if (status !== 'all') {
      if (status === 'with_warnings' || status === 'no_warnings') {
        // יטופל אחרי השליפה
      } else {
        where.status = status.toUpperCase() as PotentialMatchStatus;
      }
    }

    // 4. בניית Order By
    let orderBy: any = {};
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

      return {
        id: match.id,
        
        male: {
          id: match.male.id,
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

        aiScore: match.aiScore,
        firstPassScore: match.firstPassScore,
        scoreBreakdown: match.scoreBreakdown,
        shortReasoning: match.shortReasoning,
        detailedReasoning: match.detailedReasoning,
        backgroundCompatibility: match.backgroundCompatibility,
        backgroundMultiplier: match.backgroundMultiplier,

        status: match.status,
        scannedAt: match.scannedAt,
        reviewedAt: match.reviewedAt,
        suggestionId: match.suggestionId,

        maleActiveSuggestion,
        femaleActiveSuggestion,
        hasActiveWarning,
      };
    });

    // 8. סינון נוסף לפי אזהרות (אם נדרש)
    let filteredMatches = processedMatches;
    if (hasWarning === 'true') {
      filteredMatches = processedMatches.filter(m => m.hasActiveWarning);
    } else if (hasWarning === 'false') {
      filteredMatches = processedMatches.filter(m => !m.hasActiveWarning);
    }

    // סינון לפי רמה דתית
    if (religiousLevel) {
      filteredMatches = filteredMatches.filter(m => 
        m.male.religiousLevel === religiousLevel || 
        m.female.religiousLevel === religiousLevel
      );
    }

    // סינון לפי עיר
    if (city) {
      filteredMatches = filteredMatches.filter(m =>
        m.male.city === city || m.female.city === city
      );
    }

    // סינון לפי טקסט חופשי
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredMatches = filteredMatches.filter(m =>
        m.male.firstName.toLowerCase().includes(term) ||
        m.male.lastName.toLowerCase().includes(term) ||
        m.female.firstName.toLowerCase().includes(term) ||
        m.female.lastName.toLowerCase().includes(term) ||
        m.shortReasoning?.toLowerCase().includes(term)
      );
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
    withWarnings: 0, // יחושב בנפרד
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