import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // Using 'next-auth' is fine
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserProfile } from "@/types/next-auth"; // Import for potential explicit typing if needed

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
                education: true, // תיאור טקסטואלי
                educationLevel: true, // רמת השכלה מובנית - נוסף
                // address: true, // הוסר מ-UserProfile
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                // hobbies: true, // הוסר (הוחלף ב-profileHobbies)

                // --- שדות חדשים מ-UserProfile ---
                shomerNegiah: true,
                serviceType: true,
                serviceDetails: true,
                headCovering: true, // לנשים
                kippahType: true, // לגברים
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
                education: true, // תיאור טקסטואלי
                educationLevel: true, // רמת השכלה מובנית - נוסף
                // address: true, // הוסר מ-UserProfile
                city: true,
                origin: true,
                religiousLevel: true,
                about: true,
                // hobbies: true, // הוסר (הוחלף ב-profileHobbies)

                // --- שדות חדשים מ-UserProfile ---
                shomerNegiah: true,
                serviceType: true,
                serviceDetails: true,
                headCovering: true, // לנשים
                kippahType: true, // לגברים
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
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc", // Changed from createdAt in previous example, make sure this is intended for history
      },
    });

    // Typing the suggestion before mapping for better intellisense and safety
    // This assumes the structure returned by Prisma matches what's expected by UserProfile
    // and related types.
    const formattedSuggestions = historySuggestions.map(suggestion => {
      // Ensure profile exists before trying to spread it, or handle potential null case
      // Prisma's `include` with `select` guarantees `profile` exists if the relation does,
      // but if `firstParty` or `secondParty` could be null (e.g., if the user was deleted),
      // you'd need to handle that. Here, they are expected to be non-null.
      
      const firstPartyProfile = suggestion.firstParty.profile as UserProfile | null;
      const secondPartyProfile = suggestion.secondParty.profile as UserProfile | null;

      return {
        ...suggestion,
        firstParty: {
            ...suggestion.firstParty,
            profile: firstPartyProfile ? { // Add user sub-object to firstParty.profile if it's part of UserProfile type
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
            user: { // This structure matches the UserProfile.user field
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
