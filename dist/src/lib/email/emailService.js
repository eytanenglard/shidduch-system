"use strict";
// src/lib/email/emailService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailTemplates_1 = require("./templates/emailTemplates");
const dictionaries_1 = require("../../lib/dictionaries");
// ================= סוף השינויים בטיפוסים =================
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.GMAIL_USER || process.env.EMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production',
            }
        });
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async sendEmail({ to, subject, templateName, context }) {
        try {
            const templateFunction = emailTemplates_1.emailTemplates[templateName];
            if (!templateFunction) {
                console.error(`תבנית אימייל "${templateName}" לא נמצאה.`);
                throw new Error(`Template ${templateName} not found`);
            }
            const fullContext = Object.assign(Object.assign({}, context), { supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com', companyName: process.env.COMPANY_NAME || 'NeshamaTech', currentYear: new Date().getFullYear().toString(), baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' });
            const html = templateFunction(fullContext); // Use 'as any' here as a bridge, since the function signatures are typed
            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME || 'NeshamaTech'} <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                }
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('אימייל נשלח בהצלחה:', info.messageId, 'אל:', to, 'נושא:', subject);
        }
        catch (error) {
            console.error('שגיאה בשליחת אימייל אל:', to, 'נושא:', subject, 'תבנית:', templateName, 'שגיאה:', error);
            throw new Error(`Failed to send email to ${to} using template ${templateName}`);
        }
    }
    // ============================ פונקציות מעודכנות עם locale ============================
    async sendWelcomeEmail({ locale, email, firstName, matchmakerAssigned = false, matchmakerName = '', dashboardUrl, }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.welcome.subject,
            templateName: 'welcome',
            context: {
                locale,
                dict: emailDict.welcome,
                sharedDict: emailDict.shared,
                name: firstName,
                firstName,
                matchmakerAssigned,
                matchmakerName,
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${dashboardUrl}`,
            }
        });
    }
    async sendAccountSetupEmail({ locale, email, firstName, matchmakerName, setupToken, expiresIn }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        const setupLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/setup-account?token=${setupToken}`;
        await this.sendEmail({
            to: email,
            subject: emailDict.accountSetup.subject,
            templateName: 'accountSetup',
            context: {
                locale,
                dict: emailDict.accountSetup,
                sharedDict: emailDict.shared,
                name: firstName,
                firstName,
                matchmakerName,
                setupLink,
                expiresIn,
            },
        });
    }
    async sendProfileSummaryUpdateEmail({ locale, email, firstName, matchmakerName, }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.profileSummaryUpdate.subject,
            templateName: 'profileSummaryUpdate',
            context: {
                locale,
                dict: emailDict.profileSummaryUpdate,
                sharedDict: emailDict.shared,
                name: firstName,
                firstName,
                matchmakerName,
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`,
            }
        });
    }
    async sendVerificationEmail({ locale, email, verificationCode, firstName, expiresIn = '1 hour' }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.emailOtpVerification.subject,
            templateName: 'emailOtpVerification',
            context: {
                locale,
                dict: emailDict.emailOtpVerification,
                sharedDict: emailDict.shared,
                name: firstName || email,
                firstName,
                verificationCode,
                expiresIn,
            }
        });
    }
    async sendInvitation({ locale, email, invitationLink, matchmakerName, expiresIn = '7 days' }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const fullInvitationLink = `${baseUrl}/auth/accept-invitation?token=${invitationLink}`;
        await this.sendEmail({
            to: email,
            subject: emailDict.invitation.subject.replace('{{matchmakerName}}', matchmakerName),
            templateName: 'invitation',
            context: {
                locale,
                dict: emailDict.invitation,
                sharedDict: emailDict.shared,
                name: email,
                matchmakerName,
                invitationLink: fullInvitationLink,
                expiresIn,
            }
        });
    }
    async sendContactDetailsEmail({ locale, email, recipientName, otherPartyName, otherPartyContact, matchmakerName, }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.shareContactDetails.subject,
            templateName: 'shareContactDetails',
            context: {
                locale,
                dict: emailDict.shareContactDetails,
                sharedDict: emailDict.shared,
                name: recipientName,
                recipientName,
                otherPartyName,
                otherPartyContact,
                matchmakerName,
            }
        });
    }
    async sendSuggestionNotification({ locale, email, recipientName, matchmakerName, suggestionDetails }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.suggestion.subject,
            templateName: 'suggestion',
            context: {
                locale,
                dict: emailDict.suggestion,
                sharedDict: emailDict.shared,
                name: recipientName,
                recipientName,
                matchmakerName,
                suggestionDetails,
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/suggestions`,
            }
        });
    }
    async sendPasswordResetOtpEmail({ locale, email, otp, firstName, expiresIn = '15 minutes' }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.passwordResetOtp.subject,
            templateName: 'passwordResetOtp',
            context: {
                locale,
                dict: emailDict.passwordResetOtp,
                sharedDict: emailDict.shared,
                name: firstName || email,
                firstName,
                otp,
                expiresIn,
            }
        });
    }
    async sendPasswordChangedConfirmationEmail({ locale, email, firstName, }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.passwordChangedConfirmation.subject,
            templateName: 'passwordChangedConfirmation',
            context: {
                locale,
                dict: emailDict.passwordChangedConfirmation,
                sharedDict: emailDict.shared,
                name: firstName || email,
                firstName,
                loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/signin`,
            }
        });
    }
    async sendRawEmail({ to, subject, html }) {
        try {
            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME || 'NeshamaTech'} <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                }
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('אימייל גולמי נשלח בהצלחה:', info.messageId, 'אל:', to, 'נושא:', subject);
        }
        catch (error) {
            console.error('שגיאה בשליחת אימייל גולמי אל:', to, 'נושא:', subject, 'שגיאה:', error);
            throw new Error(`Failed to send raw email to ${to}`);
        }
    }
    async sendAvailabilityCheck({ locale, email, recipientName, matchmakerName, inquiryId, }) {
        const dictionary = await (0, dictionaries_1.getDictionary)(locale);
        const emailDict = dictionary.email;
        await this.sendEmail({
            to: email,
            subject: emailDict.availabilityCheck.subject,
            templateName: 'availabilityCheck',
            context: {
                locale,
                dict: emailDict.availabilityCheck,
                sharedDict: emailDict.shared,
                name: recipientName,
                recipientName,
                matchmakerName,
                inquiryId,
            }
        });
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log("חיבור שירות האימייל אומת בהצלחה.");
            return true;
        }
        catch (error) {
            console.error('שגיאה בחיבור לשירות האימייל:', error);
            return false;
        }
    }
}
exports.emailService = EmailService.getInstance();
