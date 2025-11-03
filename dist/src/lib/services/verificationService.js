"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
// src/lib/services/verificationService.ts
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto"); // For OTP generation
const prisma_1 = __importDefault(require("../../lib/prisma")); // Assuming global prisma instance
const OTP_LENGTH = 6;
const MAX_VERIFICATION_ATTEMPTS = 5; // Example value
class VerificationService {
    static async createVerification(userId, type, target, // e.g., email address or phone number
    expiresInHours, tx // Optional transaction client
    ) {
        const effectivePrisma = tx || prisma_1.default;
        const otp = (0, crypto_1.randomInt)(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH - 1).toString().padStart(OTP_LENGTH, '0');
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
        // Invalidate previous PENDING verifications of the same type for this user/target
        // This is especially important for OTPs to ensure only the latest one is active.
        // For PASSWORD_RESET, this is handled in the API route before calling createVerification.
        // For EMAIL verification during registration, this might also be good practice.
        if (type === client_1.VerificationType.EMAIL || type === client_1.VerificationType.PHONE_WHATSAPP) {
            await effectivePrisma.verification.updateMany({
                where: Object.assign(Object.assign(Object.assign({}, (userId && { userId })), (!userId && { target })), { type: type, status: client_1.VerificationStatus.PENDING }),
                data: {
                    status: client_1.VerificationStatus.EXPIRED, // Or 'CANCELLED'
                },
            });
        }
        const verification = await effectivePrisma.verification.create({
            data: {
                userId,
                type,
                token: otp,
                target: target.toLowerCase(), // Normalize target (e.g. email)
                expiresAt,
                status: client_1.VerificationStatus.PENDING,
                attempts: 0,
            },
            select: { id: true, token: true, expiresAt: true } // Return only necessary fields
        });
        return { otp, verification };
    }
    static async verifyCode(code, type, target // Target (e.g., email for password reset, phone for phone verify)
    ) {
        const normalizedTarget = target === null || target === void 0 ? void 0 : target.toLowerCase();
        const verification = await prisma_1.default.verification.findFirst({
            where: Object.assign(Object.assign({ token: code, type }, (normalizedTarget && { target: normalizedTarget })), { status: client_1.VerificationStatus.PENDING }),
            orderBy: {
                createdAt: 'desc', // Get the most recent one if multiple match (should be rare)
            },
        });
        if (!verification) {
            throw new Error('קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.');
        }
        if (new Date() > verification.expiresAt) {
            await prisma_1.default.verification.update({
                where: { id: verification.id },
                data: { status: client_1.VerificationStatus.EXPIRED },
            });
            throw new Error('תוקף הקוד פג. אנא בקש קוד חדש.');
        }
        if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
            await prisma_1.default.verification.update({
                where: { id: verification.id },
                data: { status: client_1.VerificationStatus.FAILED },
            });
            throw new Error('חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.');
        }
        // If code is correct (Implicitly, as we found it by token)
        // Increment attempts
        await prisma_1.default.verification.update({
            where: { id: verification.id },
            data: Object.assign({ attempts: { increment: 1 } }, (type === client_1.VerificationType.EMAIL && {
                status: client_1.VerificationStatus.COMPLETED,
                completedAt: new Date()
            })),
        });
        if (!verification.userId) {
            // This should not happen if the verification record was created correctly with a userId
            console.error(`VerificationService: userId missing on verification record ${verification.id} for type ${type} and target ${target}`);
            throw new Error('שגיאה פנימית: רשומת האימות אינה משויכת למשתמש.');
        }
        // For EMAIL verification type, update user status as well
        if (type === client_1.VerificationType.EMAIL && verification.userId) {
            const user = await prisma_1.default.user.findUnique({ where: { id: verification.userId } });
            if (user && !user.isVerified) { // Only update if not already verified
                await prisma_1.default.user.update({
                    where: { id: verification.userId },
                    data: Object.assign(Object.assign({ isVerified: true }, (user.status === client_1.UserStatus.PENDING_EMAIL_VERIFICATION && {
                        status: client_1.UserStatus.PENDING_PHONE_VERIFICATION, // Or ACTIVE if phone verification is not mandatory next
                    })), { updatedAt: new Date() }),
                });
            }
        }
        // For PASSWORD_RESET, the calling API (`/api/auth/reset-password`) will handle updating the password
        // and THEN it should explicitly mark the verification record as COMPLETED.
        // This function's role is just to validate the OTP itself.
        return {
            success: true,
            message: 'Code verified.',
            userId: verification.userId, // Return userId
            id: verification.id // Return verification record id
        };
    }
    // New method to explicitly complete a verification, e.g., after password reset
    static async completeVerification(verificationId) {
        await prisma_1.default.verification.update({
            where: { id: verificationId },
            data: {
                status: client_1.VerificationStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
    }
}
exports.VerificationService = VerificationService;
