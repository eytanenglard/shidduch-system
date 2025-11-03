"use strict";
// src/lib/services/availabilityService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const client_1 = require("@prisma/client");
const emailService_1 = require("../../lib/email/emailService");
class AvailabilityService {
    static async sendAvailabilityInquiry({ matchmakerId, firstPartyId, note, locale, // Destructurar el nuevo parámetro 'locale'.
     }) {
        try {
            console.log('Starting availability inquiry process', {
                matchmakerId,
                firstPartyId,
                note,
                locale,
            });
            // Comprobar si existe una consulta activa.
            const existingInquiry = await prisma_1.default.availabilityInquiry.findFirst({
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
            const inquiry = await prisma_1.default.availabilityInquiry.create({
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
                    await emailService_1.emailService.sendAvailabilityCheck({
                        locale, // Pasar el 'locale' recibido.
                        email: inquiry.firstParty.email,
                        recipientName: `${inquiry.firstParty.firstName} ${inquiry.firstParty.lastName}`,
                        matchmakerName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
                        inquiryId: inquiry.id,
                    });
                    // ============================= FIN DE LA MODIFICACIÓN ==============================
                    console.log('Email sent successfully');
                }
                catch (emailError) {
                    console.error('Failed to send email:', emailError);
                    // Continuar aunque el correo electrónico falle; queremos que la consulta se guarde.
                }
            }
            else {
                console.warn('No email found for first party');
            }
            return inquiry;
        }
        catch (error) {
            console.error('Error in sendAvailabilityInquiry:', error);
            throw error;
        }
    }
    static async updateInquiryResponse({ inquiryId, userId, isAvailable, note, locale, // Destructurar el nuevo parámetro 'locale'.
     }) {
        try {
            console.log('Starting to update inquiry response:', {
                inquiryId,
                userId,
                isAvailable,
                note,
                locale
            });
            // Comprobar si la consulta existe.
            const inquiry = await prisma_1.default.availabilityInquiry.findUnique({
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
            const result = await prisma_1.default.$transaction(async (tx) => {
                // Actualizar el perfil del usuario.
                const updatedProfile = await tx.profile.update({
                    where: { userId },
                    data: {
                        availabilityStatus: isAvailable
                            ? client_1.AvailabilityStatus.AVAILABLE
                            : client_1.AvailabilityStatus.UNAVAILABLE,
                        availabilityNote: note,
                        availabilityUpdatedAt: new Date(),
                    },
                });
                console.log('Profile updated:', updatedProfile);
                // Actualizar la consulta.
                const updatedInquiry = await tx.availabilityInquiry.update({
                    where: { id: inquiryId },
                    data: Object.assign(Object.assign({}, (isFirstParty
                        ? { firstPartyResponse: isAvailable }
                        : { secondPartyResponse: isAvailable })), { updatedAt: new Date() }),
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
                    await emailService_1.emailService.sendSuggestionNotification({
                        locale, // Pasar el 'locale' recibido.
                        email: inquiry.matchmaker.email,
                        recipientName: `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`,
                        matchmakerName: 'המערכת',
                        suggestionDetails: {
                            additionalInfo: `${isFirstParty ? 'הצד הראשון' : 'הצד השני'} ${isAvailable ? 'זמין' : 'אינו זמין'} ${note ? `(הערה: ${note})` : ''}`,
                        },
                    });
                    // ============================= FIN DE LA MODIFICACIÓN ==============================
                }
                return updatedInquiry;
            });
            return result;
        }
        catch (error) {
            console.error('Error in updateInquiryResponse:', error);
            throw error;
        }
    }
    static async getInquiryById(inquiryId) {
        console.log('Fetching inquiry by ID:', inquiryId);
        try {
            const inquiry = await prisma_1.default.availabilityInquiry.findUnique({
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
        }
        catch (error) {
            console.error('Error in getInquiryById:', error);
            throw error;
        }
    }
    static async getAvailabilityStats(matchmakerId) {
        var _a, _b, _c, _d;
        console.log('Calculating availability stats for matchmaker:', matchmakerId);
        try {
            const stats = await prisma_1.default.profile.groupBy({
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
            const result = {
                available: ((_a = stats.find((s) => s.availabilityStatus === client_1.AvailabilityStatus.AVAILABLE)) === null || _a === void 0 ? void 0 : _a._count) || 0,
                unavailable: ((_b = stats.find((s) => s.availabilityStatus === client_1.AvailabilityStatus.UNAVAILABLE)) === null || _b === void 0 ? void 0 : _b._count) || 0,
                dating: ((_c = stats.find((s) => s.availabilityStatus === client_1.AvailabilityStatus.DATING)) === null || _c === void 0 ? void 0 : _c._count) || 0,
                pending: ((_d = stats.find((s) => s.availabilityStatus === null)) === null || _d === void 0 ? void 0 : _d._count) || 0,
            };
            console.log('Processed stats:', result);
            return result;
        }
        catch (error) {
            console.error('Error in getAvailabilityStats:', error);
            throw error;
        }
    }
    static async getAllInquiries(userId, { status = 'pending', orderBy = 'createdAt', limit } = {}) {
        try {
            // Construir la cláusula 'where' basada en el estado.
            const where = Object.assign(Object.assign(Object.assign({ OR: [
                    { matchmakerId: userId },
                    { firstPartyId: userId },
                    { secondPartyId: userId },
                ] }, (status === 'pending' && {
                expiresAt: { gt: new Date() },
                OR: [
                    { firstPartyResponse: null },
                    { secondPartyResponse: null },
                ],
            })), (status === 'completed' && {
                firstPartyResponse: { not: null },
                secondPartyResponse: { not: null },
            })), (status === 'expired' && {
                expiresAt: { lt: new Date() },
            }));
            const validOrderBy = orderBy || 'createdAt';
            const inquiries = await prisma_1.default.availabilityInquiry.findMany(Object.assign({ where, include: {
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
                }, orderBy: {
                    [validOrderBy]: 'desc',
                } }, (limit ? { take: limit } : {})));
            return inquiries;
        }
        catch (error) {
            console.error('Error in getAllInquiries:', error);
            throw error;
        }
    }
}
exports.AvailabilityService = AvailabilityService;
