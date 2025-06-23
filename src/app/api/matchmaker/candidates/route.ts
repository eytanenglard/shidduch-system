// src/app/api/matchmaker/candidates/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus, UserSource } from "@prisma/client";

// Define different types of suggestion statuses for clear logic
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
  'DRAFT', // A draft is also a form of pending that doesn't block
];

// This is the type for the object we will attach to the user
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
        select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!performingUser || !allowedRoles.includes(performingUser.role)) {
        return new NextResponse(
            JSON.stringify({ error: 'Unauthorized - Matchmaker or Admin access required' }),
            { status: 403 }
        );
    }
    
    // Fetch all candidates with their full profile and images
    const users = await prisma.user.findMany({
        where: {
            status: { notIn: ['BLOCKED', 'INACTIVE'] },
            role: 'CANDIDATE',
            profile: { isNot: null }
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            source: true,
            createdAt: true,
            isVerified: true,
            isProfileComplete: true, // Also fetch this field
            images: {
                select: { id: true, url: true, isMain: true },
                orderBy: [{isMain: 'desc'}, {createdAt: 'asc'}]
            },
            profile: true // Fetch the full profile object
        }
    });

    // Enhance each user with information about their current suggestion status
    const usersWithSuggestionInfo = await Promise.all(
      users.map(async (user) => {
        // First, check for a BLOCKING suggestion
        let suggestion = await prisma.matchSuggestion.findFirst({
          where: {
            OR: [{ firstPartyId: user.id }, { secondPartyId: user.id }],
            status: { in: BLOCKING_SUGGESTION_STATUSES },
          },
          include: {
            firstParty: { select: { id: true, firstName: true, lastName: true } },
            secondParty: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        let suggestionType: 'BLOCKED' | 'PENDING' | null = null;
        if (suggestion) {
            suggestionType = 'BLOCKED';
        } else {
            // If no blocking suggestion, check for a PENDING one
            suggestion = await prisma.matchSuggestion.findFirst({
                where: {
                    OR: [{ firstPartyId: user.id }, { secondPartyId: user.id }],
                    status: { in: PENDING_SUGGESTION_STATUSES },
                },
                 include: {
                    firstParty: { select: { id: true, firstName: true, lastName: true } },
                    secondParty: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (suggestion) {
                suggestionType = 'PENDING';
            }
        }
        
        // **THE FIX IS HERE**: Define the variable with the correct type that allows null or the object
        let suggestionInfo: SuggestionStatusInfo | null = null;

        if (suggestion && suggestionType) {
          const otherParty = suggestion.firstPartyId === user.id
            ? suggestion.secondParty
            : suggestion.firstParty;
          
          suggestionInfo = {
            status: suggestionType,
            suggestionId: suggestion.id,
            withCandidateName: `${otherParty.firstName} ${otherParty.lastName}`,
          };
        }
        
        return {
          ...user,
          suggestionStatus: suggestionInfo,
        };
      })
    );
    
    // Format the final list to ensure date consistency for the client
    const formattedUsers = usersWithSuggestionInfo.map(user => {
      // The profile might be null if the select query changes, so we handle it safely
      const profile = user.profile;

      return {
        // Spread all top-level user properties
        ...user,
        // Override profile to format dates to ISO strings for JSON safety
        profile: profile ? {
          ...profile,
          birthDate: profile.birthDate.toISOString(), 
          availabilityUpdatedAt: profile.availabilityUpdatedAt?.toISOString() || null,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
          lastActive: profile.lastActive?.toISOString() || null,
        } : null, // handle case where profile could be null
      };
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        clients: formattedUsers,
        count: formattedUsers.length
      }),
      { status: 200 }
    );

  } catch (error: unknown) {  
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Candidate list fetch error:', errorMessage, error);
    
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: "An error occurred while fetching candidates.",
        details: errorMessage
      }),
      { status: 500 }
    );
  }
}