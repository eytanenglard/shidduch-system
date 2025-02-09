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

    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          {
            firstPartyId: session.user.id,
            status: {
              in: [
                "PENDING_FIRST_PARTY",
                "FIRST_PARTY_APPROVED",
                "PENDING_SECOND_PARTY",
                "SECOND_PARTY_APPROVED",
                "CONTACT_DETAILS_SHARED"
              ],
            },
          },
          {
            secondPartyId: session.user.id,
            status: {
              in: [
                "PENDING_SECOND_PARTY",
                "SECOND_PARTY_APPROVED",
                "CONTACT_DETAILS_SHARED"
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      suggestions: activeSuggestions,
    });
    
  } catch (error) {
    console.error("Error fetching active suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}