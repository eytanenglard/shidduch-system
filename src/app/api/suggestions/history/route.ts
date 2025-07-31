// src/app/api/suggestions/history/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserProfile } from "@/types/next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const historySuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          {
            firstPartyId: session.user.id,
            status: {
              in: [
                "FIRST_PARTY_DECLINED",
                "SECOND_PARTY_DECLINED",
                "MATCH_DECLINED",
                "CLOSED",
                "CANCELLED",
                "ENDED_AFTER_FIRST_DATE" // Added more terminal statuses
              ],
            },
          },
          {
            secondPartyId: session.user.id,
            status: {
              in: [
                "FIRST_PARTY_DECLINED", // A second party might see this status if the process ended
                "SECOND_PARTY_DECLINED",
                "MATCH_DECLINED",
                "CLOSED",
                "CANCELLED",
                "ENDED_AFTER_FIRST_DATE" // Added more terminal statuses
              ],
            },
          },
        ],
      },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        matchmaker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        firstParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isProfileComplete: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                nativeLanguage: true,
                additionalLanguages: true,
                height: true,
                maritalStatus: true,
                occupation: true,
                education: true,
                educationLevel: true,
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                shomerNegiah: true,
                serviceType: true,
                serviceDetails: true,
                headCovering: true,
                kippahType: true,
                hasChildrenFromPrevious: true,
                profileCharacterTraits: true,
                profileHobbies: true,
                aliyaCountry: true,
                aliyaYear: true,
                parentStatus: true,
                siblings: true,
                position: true,
                preferredAgeMin: true,
                preferredAgeMax: true,
                preferredHeightMin: true,
                preferredHeightMax: true,
                preferredReligiousLevels: true,
                preferredLocations: true,
                preferredEducation: true,
                preferredOccupations: true,
                contactPreference: true,
                isProfileVisible: true,
                preferredMatchmakerGender: true,
                matchingNotes: true,
                verifiedBy: true,
                availabilityStatus: true,
                availabilityNote: true,
                availabilityUpdatedAt: true,
                createdAt: true,
                updatedAt: true,
                lastActive: true,
              },
            },
            images: {
              select: {
                id: true,
                url: true,
                isMain: true,
                cloudinaryPublicId: true,
                createdAt: true,
                updatedAt: true,
              },
               orderBy: { isMain: 'desc' },
            },
            // --- START OF CHANGE ---
            questionnaireResponses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            // --- END OF CHANGE ---
          },
        },
        secondParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isProfileComplete: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                nativeLanguage: true,
                additionalLanguages: true,
                height: true,
                maritalStatus: true,
                occupation: true,
                education: true,
                educationLevel: true,
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                shomerNegiah: true,
                serviceType: true,
                serviceDetails: true,
                headCovering: true,
                kippahType: true,
                hasChildrenFromPrevious: true,
                profileCharacterTraits: true,
                profileHobbies: true,
                aliyaCountry: true,
                aliyaYear: true,
                parentStatus: true,
                siblings: true,
                position: true,
                preferredAgeMin: true,
                preferredAgeMax: true,
                preferredHeightMin: true,
                preferredHeightMax: true,
                preferredReligiousLevels: true,
                preferredLocations: true,
                preferredEducation: true,
                preferredOccupations: true,
                contactPreference: true,
                isProfileVisible: true,
                preferredMatchmakerGender: true,
                matchingNotes: true,
                verifiedBy: true,
                availabilityStatus: true,
                availabilityNote: true,
                availabilityUpdatedAt: true,
                createdAt: true,
                updatedAt: true,
                lastActive: true,
              },
            },
            images: {
              select: {
                id: true,
                url: true,
                isMain: true,
                cloudinaryPublicId: true,
                createdAt: true,
                updatedAt: true,
              },
               orderBy: { isMain: 'desc' },
            },
            // --- START OF CHANGE ---
            questionnaireResponses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            // --- END OF CHANGE ---
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    
    // The mapping logic below doesn't need to be changed.
    // The new `questionnaireResponses` field will be passed through automatically.
    const formattedSuggestions = historySuggestions.map(suggestion => {
      const firstPartyProfile = suggestion.firstParty.profile as UserProfile | null;
      const secondPartyProfile = suggestion.secondParty.profile as UserProfile | null;

      return {
        ...suggestion,
        firstParty: {
            ...suggestion.firstParty,
            profile: firstPartyProfile ? {
                ...firstPartyProfile,
                user: {
                    id: suggestion.firstParty.id,
                    firstName: suggestion.firstParty.firstName,
                    lastName: suggestion.firstParty.lastName,
                    email: suggestion.firstParty.email,
                }
            } : null,
        },
        secondParty: {
          ...suggestion.secondParty,
          profile: secondPartyProfile ? {
            ...secondPartyProfile,
            user: {
              id: suggestion.secondParty.id,
              firstName: suggestion.secondParty.firstName,
              lastName: suggestion.secondParty.lastName,
              email: suggestion.secondParty.email,
            }
          } : null,
        }
      };
    });


    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions,
    });

  } catch (error) {
    console.error("Error fetching suggestion history:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}