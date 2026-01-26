// src/app/api/matchmaker/candidates/route.ts
import { updateUserAiProfile } from '@/lib/services/profileAiService';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole, MatchSuggestionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

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

export async function GET() {
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

    // Step 1: Fetch all candidates
   // חפש את השורה סביב 13 בתוך prisma.user.findMany
const users = await prisma.user.findMany({
  where: {
    status: { notIn: ['BLOCKED', 'INACTIVE'] },
    role: 'CANDIDATE',
    profile: { isNot: null },
  },
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
    cloudinaryPublicId: true // <--- הוסף שורה זו
  },
  orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
},
    // שינוי כאן: מ-profile: true למבנה include
    profile: {
      include: {
        testimonials: {
          where: { status: 'APPROVED' } // ברשימה הכללית נרצה אולי רק מאושרות
        }
      }
    },
  },
});

    // ================== 🚨 START SERVER DEBUG: LINOY 🚨 ==================
    const targetEmail = 'linoyreznik032@gmail.com';
    const foundUser = users.find(u => u.email === targetEmail);

    console.log('\n-----------------------------------------------------');
    console.log(`🔍 [API DEBUG] Checking for user: ${targetEmail}`);
    
    if (foundUser) {
        console.log('✅ SUCCESS: User exists in the API response list.');
        console.log('   User Data:', JSON.stringify({
            id: foundUser.id,
            status: foundUser.status,
            role: 'CANDIDATE (verified by query)',
            hasProfile: !!foundUser.profile,
            gender: foundUser.profile?.gender,
            birthDate: foundUser.profile?.birthDate
        }, null, 2));
    } else {
        console.log('❌ FAILURE: User is MISSING from the main list.');
        console.log('   Running direct DB check to investigate why...');

        // בדיקה ישירה מול הדאטה בייס ללא פילטרים
        const directCheck = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { profile: true }
        });

        if (!directCheck) {
            console.log('   💀 FATAL: User does not exist in the Database at all.');
        } else {
            console.log('   🧐 DIAGNOSIS - Why was she filtered out?');
            console.log(`   1. Email: ${directCheck.email}`);
            
            // בדיקת סטטוס
            const statusOk = !['BLOCKED', 'INACTIVE'].includes(directCheck.status);
            console.log(`   2. Status: ${directCheck.status} [${statusOk ? 'OK' : 'FAIL - Blocked or Inactive'}]`);
            
            // בדיקת תפקיד
            const roleOk = directCheck.role === 'CANDIDATE';
            console.log(`   3. Role: ${directCheck.role} [${roleOk ? 'OK' : 'FAIL - Must be CANDIDATE'}]`);
            
            // בדיקת פרופיל
            const profileExists = !!directCheck.profile;
            console.log(`   4. Profile Exists: ${profileExists} [${profileExists ? 'OK' : 'FAIL - Profile is null'}]`);

            if (profileExists) {
                console.log('      Profile Details:', JSON.stringify(directCheck.profile, null, 2));
            }
        }
    }
    console.log('-----------------------------------------------------\n');
    // ================== 🚨 END SERVER DEBUG 🚨 ==================


    if (users.length === 0) {
      return new NextResponse(
        JSON.stringify({ success: true, clients: [], count: 0 }),
        { status: 200 }
      );
    }

    // Step 2: Collect all user IDs
    const userIds = users.map((user) => user.id);

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
// Step 5: Map suggestion info back to users in memory (no more DB queries)
    const usersWithSuggestionInfo = users.map((user) => {
      const suggestionInfo = suggestionStatusMap.get(user.id) || null;
      const profile = user.profile;

      return {
        ...user,
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
              // --- הוספה: הזרקת פרטי המשתמש לתוך הפרופיל עבור ProfileCard ---
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone, // <--- הנה הטלפון שהיה חסר בקומפוננטה
              }
              // -----------------------------------------------------------
            }
          : null,
      };
    });
  const profilesNeedingUpdate = usersWithSuggestionInfo.filter(
      (user) => user.profile?.needsAiProfileUpdate
    );

    if (profilesNeedingUpdate.length > 0) {
      const profileIdsToUpdate = profilesNeedingUpdate.map(u => u.profile!.id);
      // console.log(`[Proactive AI Update] Found ${profileIdsToUpdate.length} profiles needing AI update. Triggering in background.`);

      // First, immediately reset the flags in the DB to prevent duplicate jobs
      prisma.profile.updateMany({
        where: { id: { in: profileIdsToUpdate } },
        data: { needsAiProfileUpdate: false }
      }).then(() => {
        // console.log(`[Proactive AI Update] Flags for ${profileIdsToUpdate.length} profiles reset.`);
        // Then, run the actual AI updates without awaiting them
        profilesNeedingUpdate.forEach(user => {
          updateUserAiProfile(user.id).catch(err => {
            console.error(`[Proactive AI Update - BG] Failed for user ${user.id}:`, err);
            // Optional: Re-flag the profile on failure
            // prisma.profile.update({ where: { id: user.profile!.id }, data: { needsAiProfileUpdate: true } });
          });
        });
      }).catch(err => {
        console.error("[Proactive AI Update] Failed to reset flags:", err);
      });
    }
    return new NextResponse(
      JSON.stringify({
        success: true,
        clients: usersWithSuggestionInfo,
        count: usersWithSuggestionInfo.length,
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