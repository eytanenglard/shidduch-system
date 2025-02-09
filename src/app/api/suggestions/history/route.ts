import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
              ],
            },
          },
          {
            secondPartyId: session.user.id,
            status: {
              in: [
                "SECOND_PARTY_DECLINED",
                "MATCH_DECLINED",
                "CLOSED",
                "CANCELLED",
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
                address: true,
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                hobbies: true,
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
                referenceName1: true,
                referencePhone1: true,
                referenceName2: true,
                referencePhone2: true,
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
            },
          },
        },
        secondParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
                address: true,
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                hobbies: true,
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
                referenceName1: true,
                referencePhone1: true,
                referenceName2: true,
                referencePhone2: true,
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
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedSuggestions = historySuggestions.map(suggestion => ({
      ...suggestion,
      secondParty: {
        ...suggestion.secondParty,
        profile: {
          ...suggestion.secondParty.profile,
          user: {
            firstName: suggestion.secondParty.firstName,
            lastName: suggestion.secondParty.lastName,
            email: suggestion.secondParty.email,
          }
        }
      }
    }));

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions,
    });

  } catch (error) {
    console.error("Error fetching suggestion history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}