// src/lib/services/availabilityService.ts
import prisma from '@/lib/prisma';
import { AvailabilityStatus, Prisma } from '@prisma/client';
import { emailService } from '@/lib/email/emailService';

interface SendInquiryParams {
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId?: string;
  note?: string;
}

interface UpdateInquiryResponse {
  inquiryId: string;
  userId: string;
  isAvailable: boolean;
  note?: string;
}

interface GetInquiriesOptions {
  status?: 'pending' | 'completed' | 'expired';
  orderBy?: 'createdAt' | 'updatedAt';
  limit?: number;
}

interface AvailabilityStats {
  available: number;
  unavailable: number;
  dating: number;
  pending: number;
}

export class AvailabilityService {
  static async sendAvailabilityInquiry({
    matchmakerId,
    firstPartyId,
    note
  }: SendInquiryParams) {
    try {
      console.log('Starting availability inquiry process', {
        matchmakerId,
        firstPartyId,
        note
      });

      // Check for existing active inquiry
      const existingInquiry = await prisma.availabilityInquiry.findFirst({
        where: {
          firstPartyId,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (existingInquiry) {
        console.log('Found existing active inquiry:', existingInquiry);
        throw new Error('קיימת כבר בקשת זמינות פעילה');
      }

      // Create new inquiry
      console.log('Creating new inquiry...');
      const inquiry = await prisma.availabilityInquiry.create({
        data: {
          matchmakerId,
          firstPartyId,
          secondPartyId: firstPartyId,
          note,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        include: {
          firstParty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
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
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
                }
              }
            }
          },
          matchmaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      console.log('Successfully created inquiry:', inquiry);

      // Send email notification
      if (inquiry.firstParty.email) {
        console.log('Attempting to send email to:', inquiry.firstParty.email);
        
        try {
          await emailService.sendAvailabilityCheck({
            email: inquiry.firstParty.email,
            recipientName: `${inquiry.firstParty.firstName} ${inquiry.firstParty.lastName}`,
            matchmakerName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
            inquiryId: inquiry.id
          });
          console.log('Email sent successfully');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Continue even if email fails - we want the inquiry to be saved
        }
      } else {
        console.warn('No email found for first party');
      }

      return inquiry;

    } catch (error) {
      console.error('Error in sendAvailabilityInquiry:', error);
      throw error;
    }
  }

  static async updateInquiryResponse({
    inquiryId,
    userId,
    isAvailable,
    note
  }: UpdateInquiryResponse) {
    try {
      console.log('Starting to update inquiry response:', {
        inquiryId,
        userId,
        isAvailable,
        note
      });

      // Check if inquiry exists
      const inquiry = await prisma.availabilityInquiry.findUnique({
        where: { id: inquiryId },
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
              email: true
            }
          }
        }
      });

      if (!inquiry) {
        console.log('Inquiry not found:', inquiryId);
        throw new Error('בקשת הזמינות לא נמצאה');
      }

      console.log('Found inquiry:', inquiry);

      if (inquiry.expiresAt < new Date()) {
        console.log('Inquiry expired:', inquiry.expiresAt);
        throw new Error('תוקף הבקשה פג');
      }

      const isFirstParty = inquiry.firstPartyId === userId;
      const isSecondParty = inquiry.secondPartyId === userId;

      if (!isFirstParty && !isSecondParty) {
        console.log('Unauthorized response attempt. User:', userId);
        throw new Error('אין הרשאה לעדכן בקשה זו');
      }

      // Update both inquiry and profile in a transaction
      console.log('Updating inquiry and profile...');
      const result = await prisma.$transaction(async (tx) => {
        // Update user's profile
        const updatedProfile = await tx.profile.update({
          where: { userId },
          data: {
            availabilityStatus: isAvailable ? AvailabilityStatus.AVAILABLE : AvailabilityStatus.UNAVAILABLE,
            availabilityNote: note,
            availabilityUpdatedAt: new Date()
          }
        });
        console.log('Profile updated:', updatedProfile);

        // Update the inquiry
        const updatedInquiry = await tx.availabilityInquiry.update({
          where: { id: inquiryId },
          data: {
            ...(isFirstParty ? { firstPartyResponse: isAvailable } : { secondPartyResponse: isAvailable }),
            updatedAt: new Date()
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
                email: true
              }
            }
          }
        });
        console.log('Inquiry updated:', updatedInquiry);

        // Send notification to matchmaker
        if (inquiry.matchmaker.email) {
          await emailService.sendSuggestionNotification({
            email: inquiry.matchmaker.email,
            recipientName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
            matchmakerName: "המערכת",
            suggestionDetails: {
              additionalInfo: `${isFirstParty ? 'הצד הראשון' : 'הצד השני'} ${isAvailable ? 'זמין' : 'אינו זמין'} ${note ? `(הערה: ${note})` : ''}`
            }
          });
        }

        return updatedInquiry;
      });

      return result;

    } catch (error) {
      console.error('Error in updateInquiryResponse:', error);
      throw error;
    }
  }

  static async getInquiryById(inquiryId: string) {
    console.log('Fetching inquiry by ID:', inquiryId);
    try {
      const inquiry = await prisma.availabilityInquiry.findUnique({
        where: { id: inquiryId },
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
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
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
                }
              }
            }
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!inquiry) {
        console.log('No inquiry found with ID:', inquiryId);
        throw new Error('הבקשה לא נמצאה');
      }

      console.log('Found inquiry:', inquiry);
      return inquiry;

    } catch (error) {
      console.error('Error in getInquiryById:', error);
      throw error;
    }
  }

  static async getAvailabilityStats(matchmakerId: string): Promise<AvailabilityStats> {
    console.log('Calculating availability stats for matchmaker:', matchmakerId);
    try {
      const stats = await prisma.profile.groupBy({
        by: ['availabilityStatus'],
        where: {
          user: {
            OR: [
              { firstPartyInquiries: { some: { matchmakerId } } },
              { secondPartyInquiries: { some: { matchmakerId } } }
            ]
          }
        },
        _count: true
      });

      console.log('Raw stats:', stats);

      const result = {
        available: stats.find(s => s.availabilityStatus === AvailabilityStatus.AVAILABLE)?._count || 0,
        unavailable: stats.find(s => s.availabilityStatus === AvailabilityStatus.UNAVAILABLE)?._count || 0,
        dating: stats.find(s => s.availabilityStatus === AvailabilityStatus.DATING)?._count || 0,
        pending: stats.find(s => s.availabilityStatus === null)?._count || 0
      };

      console.log('Processed stats:', result);
      return result;

    } catch (error) {
      console.error('Error in getAvailabilityStats:', error);
      throw error;
    }
  }

  static async getAllInquiries(
    userId: string,
    { status = 'pending', orderBy = 'createdAt', limit }: GetInquiriesOptions = {}
  ) {
    try {
      // Build the where clause based on status
      const where: Prisma.AvailabilityInquiryWhereInput = {
        OR: [
          { matchmakerId: userId },
          { firstPartyId: userId },
          { secondPartyId: userId }
        ],
        ...(status === 'pending' && {
          expiresAt: { gt: new Date() },
          OR: [
            { firstPartyResponse: null },
            { secondPartyResponse: null }
          ]
        }),
        ...(status === 'completed' && {
          firstPartyResponse: { not: null },
          secondPartyResponse: { not: null }
        }),
        ...(status === 'expired' && {
          expiresAt: { lt: new Date() }
        })
      };

      const validOrderBy = orderBy || 'createdAt';

      const inquiries = await prisma.availabilityInquiry.findMany({
        where,
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
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
                  availabilityStatus: true,
                  availabilityNote: true,
                  availabilityUpdatedAt: true
                }
              }
            }
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          [validOrderBy]: 'desc'
        },
        ...(limit ? { take: limit } : {})
      });

      return inquiries;

    } catch (error) {
      console.error('Error in getAllInquiries:', error);
      throw error;
    }
  }
}