//C:\Users\eytan\Desktop\שידוכים\shidduch-system\src\lib\services\suggestionService.ts
import prisma from '@/lib/prisma';
import { 
  MatchSuggestionStatus, 
  Priority,
  ContactMethod,
  FirstDateFeedbackStatus,
  Prisma
} from '@prisma/client';
import type { CreateSuggestionData } from '@/app/types/suggestions';
import { emailService } from '@/lib/email/emailService';

// Extended type for update data
interface UpdateSuggestionData {
  id: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  responseDeadline?: Date | string;
  decisionDeadline?: Date | string;
  notes?: {
    internal?: string;
    forFirstParty?: string;
    forSecondParty?: string;
  };
  matchingCriteria?: Array<{
    key: string;
    weight: number;
    isRequired: boolean;
    score?: number | null;
    notes?: string | null;
  }>;
  externalReferences?: Array<{
    type: string;
    name: string;
    contactInfo: string;
    relationship: string;
    notes?: string | null;
  }>;
  communications?: {
    firstParty?: {
      method: ContactMethod;
      value: string;
      content?: string;
      isUrgent?: boolean;
      requiresResponse?: boolean;
    };
    secondParty?: {
      method: ContactMethod;
      value: string;
      content?: string;
      isUrgent?: boolean;
      requiresResponse?: boolean;
    };
  };
}

// Type for profile data
interface ProfileData {
  contactPreference?: string | null;
}

// Type for party data
interface PartyData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: ProfileData | null;
}

export class SuggestionService {
  static async createSuggestion(data: CreateSuggestionData) {
    // Delete everything inside the function and replace with:
    const suggestion = await prisma.$transaction(async (tx) => {
      const existingActiveSuggestion = await tx.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: data.firstPartyId },
            { secondPartyId: data.secondPartyId }
          ],
          AND: {
            status: {
              in: [
                'PENDING_FIRST_PARTY',
                'FIRST_PARTY_APPROVED',
                'PENDING_SECOND_PARTY'
              ] as MatchSuggestionStatus[]
            }
          }
        }
      });
  
      if (existingActiveSuggestion) {
        throw new Error('קיימת הצעה פעילה לאחד הצדדים');
      }
  
      const responseDeadline = new Date();
      responseDeadline.setHours(responseDeadline.getHours() + (data.deadlineInHours || 48));
  
      const newSuggestion = await tx.matchSuggestion.create({
        data: {
          matchmakerId: data.matchmakerId,
          firstPartyId: data.firstPartyId,
          secondPartyId: data.secondPartyId,
          status: data.status || MatchSuggestionStatus.DRAFT,
          priority: data.priority || Priority.MEDIUM,
          internalNotes: data.notes?.internal || '',
          firstPartyNotes: data.notes?.forFirstParty || '',
          secondPartyNotes: data.notes?.forSecondParty || '',
          matchingReason: data.notes?.matchingReason || null,
          requiresRabbinicApproval: data.requiresRabbinicApproval || false,
          responseDeadline,
          lastActivity: new Date(),
          statusHistory: {
            create: {
              status: data.status || MatchSuggestionStatus.DRAFT,
              reason: 'Initial creation'
            }
          }
        },
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  contactPreference: true
                }
              }
            }
          },
          secondParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  contactPreference: true
                }
              }
            }
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });
  
      // אם יש communications, יצירת רשומה בטבלת Communications
      if (data.communications?.firstParty) {
        await tx.communication.create({
          data: {
            suggestionId: newSuggestion.id,
            type: 'MESSAGE',
            content: data.communications.firstParty.content || '',
            partyId: data.firstPartyId,  
            metadata: {
              method: data.communications.firstParty.method,
              value: data.communications.firstParty.value,
              isUrgent: data.communications.firstParty.isUrgent || false
            }
          }
        });
      }
  
      if (newSuggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY 
          && newSuggestion.firstParty.email) {
        try {
          await emailService.sendSuggestionNotification({
            email: newSuggestion.firstParty.email,
            recipientName: `${newSuggestion.firstParty.firstName} ${newSuggestion.firstParty.lastName}`,
            matchmakerName: `${newSuggestion.matchmaker.firstName} ${newSuggestion.matchmaker.lastName}`,
            suggestionDetails: {
              additionalInfo: data.notes?.forFirstParty
            }
          });
  
          await tx.matchSuggestion.update({
            where: { id: newSuggestion.id },
            data: { 
              firstPartySent: new Date(),
              lastActivity: new Date()
            }
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }
  
      return newSuggestion;
    });
  
    return suggestion;
  }

  static async approveAndShareContacts(suggestionId: string, matchmakerId: string) {
    const suggestion = await prisma.$transaction(async (tx) => {
      const suggestion = await tx.matchSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          firstParty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  contactPreference: true
                }
              }
            }
          },
          secondParty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  contactPreference: true
                }
              }
            }
          },
          matchmaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      if (suggestion.matchmakerId !== matchmakerId) {
        throw new Error('Unauthorized - only the matchmaker can approve and share contacts');
      }

      const updatedSuggestion = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
          lastActivity: new Date(),
          lastStatusChange: new Date(),
          previousStatus: suggestion.status,
          statusHistory: {
            create: {
              status: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
              reason: 'Matchmaker approved and shared contact details'
            }
          }
        }
      });

      // Send contact details emails with null checks
      if (suggestion.firstParty.email && suggestion.secondParty.profile?.contactPreference) {
        await emailService.sendContactDetailsEmail({
          email: suggestion.firstParty.email,
          recipientName: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
          otherPartyName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
          otherPartyContact: {
            whatsapp: suggestion.secondParty.profile.contactPreference
          },
          matchmakerName: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
        });
      }

      if (suggestion.secondParty.email && suggestion.firstParty.profile?.contactPreference) {
        await emailService.sendContactDetailsEmail({
          email: suggestion.secondParty.email,
          recipientName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
          otherPartyName: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
          otherPartyContact: {
            whatsapp: suggestion.firstParty.profile.contactPreference
          },
          matchmakerName: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
        });
      }

      return updatedSuggestion;
    });

    return suggestion;
  }

  static async updateSuggestionStatus(suggestionId: string, newStatus: MatchSuggestionStatus, note?: string) {
    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.matchSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          secondParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      let targetStatus = newStatus;

      if (newStatus === "FIRST_PARTY_APPROVED") {
        targetStatus = "PENDING_SECOND_PARTY";
        
        // Send email to second party
        if (suggestion.secondParty.email) {
          await emailService.sendSuggestionNotification({
            email: suggestion.secondParty.email,
            recipientName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
            matchmakerName: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`,
            suggestionDetails: { additionalInfo: note }
          });
        }
      }
      
      else if (newStatus === "SECOND_PARTY_APPROVED") {
        targetStatus = "CONTACT_DETAILS_SHARED";
        await this.approveAndShareContacts(suggestionId, suggestion.matchmakerId);
      }

      return await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: targetStatus,
          lastActivity: new Date(),
          lastStatusChange: new Date(),
          statusHistory: {
            create: {
              status: targetStatus,
              reason: `Status updated to ${targetStatus}`,
              notes: note
            }
          }
        }
      });
    });
}


  static async updateFirstDateFeedback(
    suggestionId: string,
    partyId: string,
    feedback: {
      status: FirstDateFeedbackStatus;
      notes?: string;
    }
  ) {
    const suggestion = await prisma.$transaction(async (tx) => {
      const suggestion = await tx.matchSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          meetings: {
            orderBy: { scheduledDate: 'desc' },
            take: 1
          }
        }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      const isFirstParty = suggestion.firstPartyId === partyId;
      const isSecondParty = suggestion.secondPartyId === partyId;

      if (!isFirstParty && !isSecondParty) {
        throw new Error('Unauthorized to provide feedback');
      }

      const lastMeeting = suggestion.meetings[0];
      if (!lastMeeting) {
        throw new Error('No meeting found for this suggestion');
      }

      // עדכון המשוב לפגישה
      await tx.suggestionMeeting.update({
        where: { id: lastMeeting.id },
        data: {
          ...(isFirstParty
            ? { firstPartyFeedbackStatus: feedback.status }
            : { secondPartyFeedbackStatus: feedback.status }),
          feedback: {
            ...(lastMeeting.feedback as any || {}),
            [isFirstParty ? 'firstParty' : 'secondParty']: {
              status: feedback.status,
              notes: feedback.notes,
              submittedAt: new Date()
            }
          }
        }
      });

      // עדכון סטטוס ההצעה בהתאם למשוב
      let newStatus: MatchSuggestionStatus;
      switch (feedback.status) {
        case FirstDateFeedbackStatus.SUCCESS_CONTINUE:
          newStatus = MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE;
          break;
        case FirstDateFeedbackStatus.NEED_TIME_TO_THINK:
          newStatus = MatchSuggestionStatus.THINKING_AFTER_DATE;
          break;
        case FirstDateFeedbackStatus.NOT_INTERESTED:
          newStatus = MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE;
          break;
      }

      const updatedSuggestion = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: newStatus,
          lastActivity: new Date(),
          lastStatusChange: new Date(),
          previousStatus: suggestion.status,
          statusHistory: {
            create: {
              status: newStatus,
              reason: `First date feedback received from ${isFirstParty ? 'first' : 'second'} party`
            }
          }
        },
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: true
            }
          },
          secondParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: true
            }
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          },
          meetings: true,
          statusHistory: true
        }
      });

      return updatedSuggestion;
    });

    return suggestion;
  }

  static async getSuggestion(id: string) {
    return await prisma.matchSuggestion.findUnique({
      where: { id },
      include: {
        firstParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profile: true
          }
        },
        secondParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profile: true
          }
        },
        matchmaker: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            profile: true  // במקום matchmakerProfile
          }
        },
        communications: {
          where: {
            suggestionId: id  // במקום partyId
          }
        },
        statusHistory: true,
        meetings: true
      }
    });
  }

  static async getMatchmakerSuggestions(matchmakerId: string) {
    return await prisma.matchSuggestion.findMany({
      where: {
        matchmakerId,
      },
      include: {
        firstParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profile: true
          }
        },
        secondParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profile: true
          }
        },
        communications: true,
        statusHistory: true,
        matchingCriteria: true,
        externalReferences: true
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });
  }

static async getUserSuggestions(userId: string) {
  return await prisma.matchSuggestion.findMany({
    where: {
      OR: [
        { firstPartyId: userId },
        { secondPartyId: userId }
      ]
    },
    include: {
      firstParty: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profile: {
            select: {
              height: true,
              occupation: true,
              education: true,
              religiousLevel: true,
              city: true,
              maritalStatus: true,
              origin: true,
          
              // הוסף עוד שדות שתרצה להציג
            }
          }
        }
      },
      secondParty: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profile: {
            select: {
              height: true,
              occupation: true,
              education: true,
              religiousLevel: true,
              city: true,
              maritalStatus: true,
              origin: true,
              // הוסף עוד שדות שתרצה להציג
            }
          }
        }
      },
      matchmaker: {
        select: {
          firstName: true,
          lastName: true,
          role: true
        }
      },
      communications: {
        where: {
          partyId: userId
        }
      },
      matchingCriteria: true,
      externalReferences: true,
    }
  });
}
}