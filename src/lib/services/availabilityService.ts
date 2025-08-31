// src/lib/services/availabilityService.ts

import prisma from '@/lib/prisma';
import { AvailabilityStatus, Prisma } from '@prisma/client';
import { emailService } from '@/lib/email/emailService';

// ============================ INICIO DE LA MODIFICACIÓN ============================
// Se ha añadido 'locale' a las interfaces para que se pueda pasar a los servicios de correo electrónico.
interface SendInquiryParams {
  matchmakerId: string;
  firstPartyId: string;
  note?: string;
  locale: 'he' | 'en'; // El 'locale' es ahora obligatorio.
}

interface UpdateInquiryResponse {
  inquiryId: string;
  userId: string;
  isAvailable: boolean;
  note?: string;
  locale: 'he' | 'en'; // El 'locale' es ahora obligatorio.
}
// ============================= FIN DE LA MODIFICACIÓN ==============================

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
    note,
    locale, // Destructurar el nuevo parámetro 'locale'.
  }: SendInquiryParams) {
    try {
      console.log('Starting availability inquiry process', {
        matchmakerId,
        firstPartyId,
        note,
        locale,
      });

      // Comprobar si existe una consulta activa.
      const existingInquiry = await prisma.availabilityInquiry.findFirst({
        where: {
          firstPartyId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInquiry) {
        console.log('Found existing active inquiry:', existingInquiry);
        throw new Error('קיימת כבר בקשת זמינות פעילה');
      }

      // Crear una nueva consulta.
      console.log('Creating new inquiry...');
      const inquiry = await prisma.availabilityInquiry.create({
        data: {
          matchmakerId,
          firstPartyId,
          secondPartyId: firstPartyId,
          note,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
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
                  availabilityUpdatedAt: true,
                },
              },
            },
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
                  availabilityUpdatedAt: true,
                },
              },
            },
          },
          matchmaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      console.log('Successfully created inquiry:', inquiry);

      // Enviar notificación por correo electrónico.
      if (inquiry.firstParty.email) {
        console.log('Attempting to send email to:', inquiry.firstParty.email);
        
        try {
          // ============================ INICIO DE LA MODIFICACIÓN ============================
          // Pasar el 'locale' al servicio de correo electrónico.
          await emailService.sendAvailabilityCheck({
            locale, // Pasar el 'locale' recibido.
            email: inquiry.firstParty.email,
            recipientName: `${inquiry.firstParty.firstName} ${inquiry.firstParty.lastName}`,
            matchmakerName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
            inquiryId: inquiry.id,
          });
          // ============================= FIN DE LA MODIFICACIÓN ==============================
          console.log('Email sent successfully');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Continuar aunque el correo electrónico falle; queremos que la consulta se guarde.
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
    note,
    locale, // Destructurar el nuevo parámetro 'locale'.
  }: UpdateInquiryResponse) {
    try {
      console.log('Starting to update inquiry response:', {
        inquiryId,
        userId,
        isAvailable,
        note,
        locale
      });

      // Comprobar si la consulta existe.
      const inquiry = await prisma.availabilityInquiry.findUnique({
        where: { id: inquiryId },
        include: {
          firstParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: true,
            },
          },
          secondParty: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profile: true,
            },
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
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

      // Actualizar tanto la consulta como el perfil en una transacción.
      console.log('Updating inquiry and profile...');
      const result = await prisma.$transaction(async (tx) => {
        // Actualizar el perfil del usuario.
        const updatedProfile = await tx.profile.update({
          where: { userId },
          data: {
            availabilityStatus: isAvailable
              ? AvailabilityStatus.AVAILABLE
              : AvailabilityStatus.UNAVAILABLE,
            availabilityNote: note,
            availabilityUpdatedAt: new Date(),
          },
        });
        console.log('Profile updated:', updatedProfile);

        // Actualizar la consulta.
        const updatedInquiry = await tx.availabilityInquiry.update({
          where: { id: inquiryId },
          data: {
            ...(isFirstParty
              ? { firstPartyResponse: isAvailable }
              : { secondPartyResponse: isAvailable }),
            updatedAt: new Date(),
          },
          include: {
            firstParty: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profile: true,
              },
            },
            secondParty: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profile: true,
              },
            },
            matchmaker: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
        console.log('Inquiry updated:', updatedInquiry);

        // Enviar notificación al matchmaker.
        if (inquiry.matchmaker.email) {
          // ============================ INICIO DE LA MODIFICACIÓN ============================
          // Pasar el 'locale' al servicio de correo electrónico.
          await emailService.sendSuggestionNotification({
            locale, // Pasar el 'locale' recibido.
            email: inquiry.matchmaker.email,
            recipientName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
            matchmakerName: 'המערכת',
            suggestionDetails: {
              additionalInfo: `${
                isFirstParty ? 'הצד הראשון' : 'הצד השני'
              } ${isAvailable ? 'זמין' : 'אינו זמין'} ${
                note ? `(הערה: ${note})` : ''
              }`,
            },
          });
          // ============================= FIN DE LA MODIFICACIÓN ==============================
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
                  availabilityUpdatedAt: true,
                },
              },
            },
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
                  availabilityUpdatedAt: true,
                },
              },
            },
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
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

  static async getAvailabilityStats(
    matchmakerId: string
  ): Promise<AvailabilityStats> {
    console.log('Calculating availability stats for matchmaker:', matchmakerId);
    try {
      const stats = await prisma.profile.groupBy({
        by: ['availabilityStatus'],
        where: {
          user: {
            OR: [
              { firstPartyInquiries: { some: { matchmakerId } } },
              { secondPartyInquiries: { some: { matchmakerId } } },
            ],
          },
        },
        _count: true,
      });

      console.log('Raw stats:', stats);

      const result: AvailabilityStats = {
        available:
          stats.find((s) => s.availabilityStatus === AvailabilityStatus.AVAILABLE)
            ?._count || 0,
        unavailable:
          stats.find(
            (s) => s.availabilityStatus === AvailabilityStatus.UNAVAILABLE
          )?._count || 0,
        dating:
          stats.find((s) => s.availabilityStatus === AvailabilityStatus.DATING)
            ?._count || 0,
        pending: stats.find((s) => s.availabilityStatus === null)?._count || 0,
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
      // Construir la cláusula 'where' basada en el estado.
      const where: Prisma.AvailabilityInquiryWhereInput = {
        OR: [
          { matchmakerId: userId },
          { firstPartyId: userId },
          { secondPartyId: userId },
        ],
        ...(status === 'pending' && {
          expiresAt: { gt: new Date() },
          OR: [
            { firstPartyResponse: null },
            { secondPartyResponse: null },
          ],
        }),
        ...(status === 'completed' && {
          firstPartyResponse: { not: null },
          secondPartyResponse: { not: null },
        }),
        ...(status === 'expired' && {
          expiresAt: { lt: new Date() },
        }),
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
                  availabilityUpdatedAt: true,
                },
              },
            },
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
                  availabilityUpdatedAt: true,
                },
              },
            },
          },
          matchmaker: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [validOrderBy]: 'desc',
        },
        ...(limit ? { take: limit } : {}),
      });

      return inquiries;
    } catch (error) {
      console.error('Error in getAllInquiries:', error);
      throw error;
    }
  }
}