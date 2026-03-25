// src/lib/email/emailService.ts
// ============================================================
// NeshamaTech Email Service
// Uses Resend for email delivery
// UPDATED: Added sendReportNotification for Apple Guideline 1.2
// ============================================================

import { Resend } from 'resend';
import { emailTemplates, TemplateContextMap } from './templates/emailTemplates';
import { getDictionary } from '@/lib/dictionaries';
import { EmailDictionary } from '@/types/dictionary';
import { Locale } from '../../../i18n-config';
import prisma from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

interface ProfileSummaryUpdateEmailParams {
  locale: Locale;
  email: string;
  firstName: string;
  matchmakerName?: string;
}

interface TemplateContext {
  supportEmail: string;
  companyName: string;
  currentYear: string;
  baseUrl: string;

  locale?: Locale;
  dict?: EmailDictionary[keyof EmailDictionary];
  sharedDict?: EmailDictionary['shared'];
  name?: string;
  firstName?: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  dashboardUrl?: string;
  setupToken?: string;
  setupLink?: string;
  expiresIn?: string;
  verificationCode?: string;
  invitationLink?: string;
  recipientName?: string;
  otherPartyName?: string;
  otherPartyContact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  suggestionDetails?: {
    age?: number;
    city?: string;
    occupation?: string;
    additionalInfo?: string | null;
  };
  otp?: string;
  loginUrl?: string;
  inquiryId?: string;

  feedbackType?: string;
  userIdentifier?: string;
  content?: string;
  pageUrl?: string;
  screenshotUrl?: string;
  feedbackId?: string;

  matchmakerNote?: string;
  reviewUrl?: string;
  deadlineText?: string;
  greeting?: string;

  optOutFirstPartyUrl?: string;
  optOutFirstPartyText?: string;
  unsubscribeUrl?: string;
  unsubscribeText?: string;
}

interface EmailConfig {
  to: string;
  subject: string;
  templateName: keyof TemplateContextMap;
  context: Omit<TemplateContext, 'supportEmail' | 'companyName' | 'currentYear' | 'baseUrl'>;
  headers?: Record<string, string>;
}

interface AccountSetupEmailParams {
  locale: Locale;
  email: string;
  firstName: string;
  matchmakerName: string;
  setupToken: string;
  expiresIn: string;
}

interface WelcomeEmailParams {
  locale: Locale;
  email: string;
  firstName: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  dashboardUrl: string;
}

interface VerificationEmailParams {
  locale: Locale;
  email: string;
  verificationCode: string;
  firstName?: string;
  expiresIn?: string;
}

interface InvitationEmailParams {
  locale: Locale;
  email: string;
  invitationLink: string;
  matchmakerName: string;
  expiresIn?: string;
}

interface SuggestionEmailParams {
  locale: Locale;
  email: string;
  recipientName: string;
  matchmakerName: string;
  suggestionDetails?: {
    age?: number;
    city?: string;
    occupation?: string;
    additionalInfo?: string | null;
  };
  optOutFirstPartyUrl?: string;
  unsubscribeUrl?: string;
}

interface ContactDetailsEmailParams {
  locale: Locale;
  email: string;
  recipientName: string;
  otherPartyName: string;
  otherPartyContact: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  matchmakerName: string;
}

interface AvailabilityCheckEmailParams {
  locale: Locale;
  email: string;
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
}

interface PasswordResetOtpEmailParams {
  locale: Locale;
  email: string;
  otp: string;
  firstName?: string;
  expiresIn?: string;
}

interface PasswordChangedConfirmationParams {
  locale: Locale;
  email: string;
  firstName?: string;
}

interface SuggestionInvitationEmailParams {
  locale: Locale;
  email: string;
  recipientName: string;
  matchmakerName: string;
  matchmakerNote?: string;
  reviewUrl: string;
  deadlineText?: string;
}

// ═══════════════════════════════════════════════════════════════
// NEW: Report/Block Notification (Apple Guideline 1.2)
// ═══════════════════════════════════════════════════════════════

interface ReportNotificationEmailParams {
  locale: Locale;
  toEmail: string;
  toName: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reason: string;
  details?: string;
  reportType: "REPORT" | "BLOCK";
  suggestionId: string;
  reportId: string;
}

// ═══════════════════════════════════════════════════════════════
// Email Service Class
// ═══════════════════════════════════════════════════════════════

class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  private fromEmail: string;

  private constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.error('⚠️ RESEND_API_KEY is not defined in environment variables');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@neshamatech.com';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Helper function to resolve user's preferred language from database
   */
  private async resolveLocale(email: string, defaultLocale: Locale): Promise<Locale> {
    try {
      if (!email) return defaultLocale;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { language: true }
      });

      if (user && user.language) {
        return user.language as Locale;
      }
    } catch (error) {
      console.warn(`Could not resolve locale from DB for ${email}, using default.`, error);
    }

    return defaultLocale;
  }

  // ═══════════════════════════════════════════════════════════════
  // Core Send Email Method
  // ═══════════════════════════════════════════════════════════════

  async sendEmail({ to, subject, templateName, context, headers }: EmailConfig): Promise<void> {
    try {
      const templateFunction = emailTemplates[templateName];
      if (!templateFunction) {
        console.error(`תבנית אימייל "${templateName}" לא נמצאה.`);
        throw new Error(`Template ${templateName} not found`);
      }

      const fullContext: TemplateContext = {
        ...context,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@neshamatech.com',
        companyName: process.env.COMPANY_NAME || 'NeshamaTech',
        currentYear: new Date().getFullYear().toString(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      };

      const html = templateFunction(fullContext as any);

      const fromName = process.env.EMAIL_FROM_NAME || 'NeshamaTech';

      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
        ...(headers && { headers }),
      });

      if (error) {
        console.error('שגיאה בשליחת אימייל (Resend):', error);
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log('✅ אימייל נשלח בהצלחה:', data?.id, 'אל:', to, 'נושא:', subject, 'שפה:', context.locale);

    } catch (error) {
      console.error('שגיאה בשליחת אימייל אל:', to, 'נושא:', subject, 'תבנית:', templateName, 'שגיאה:', error);
      throw new Error(`Failed to send email to ${to} using template ${templateName}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Send Raw Email (for custom HTML)
  // ═══════════════════════════════════════════════════════════════

  async sendRawEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'NeshamaTech';

      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('שגיאה בשליחת אימייל גולמי (Resend):', error);
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log('✅ אימייל גולמי נשלח בהצלחה:', data?.id, 'אל:', to, 'נושא:', subject);

    } catch (error) {
      console.error('שגיאה בשליחת אימייל גולמי אל:', to, 'נושא:', subject, 'שגיאה:', error);
      throw new Error(`Failed to send raw email to ${to}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Welcome Email
  // ═══════════════════════════════════════════════════════════════

  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    const subject = emailDict.welcome.subject.replace('{{firstName}}', params.firstName);

    await this.sendEmail({
      to: params.email,
      subject: subject,
      templateName: 'welcome',
      context: {
        locale,
        dict: emailDict.welcome,
        sharedDict: emailDict.shared,
        name: params.firstName,
        firstName: params.firstName,
        matchmakerAssigned: params.matchmakerAssigned,
        matchmakerName: params.matchmakerName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${params.dashboardUrl}`,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Account Setup Email
  // ═══════════════════════════════════════════════════════════════

  async sendAccountSetupEmail(params: AccountSetupEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;
    const setupLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/setup-account?token=${params.setupToken}`;

    const subject = emailDict.accountSetup.subject.replace('{{matchmakerName}}', params.matchmakerName);

    await this.sendEmail({
      to: params.email,
      subject: subject,
      templateName: 'accountSetup',
      context: {
        locale,
        dict: emailDict.accountSetup,
        sharedDict: emailDict.shared,
        name: params.firstName,
        firstName: params.firstName,
        matchmakerName: params.matchmakerName,
        setupLink,
        expiresIn: params.expiresIn,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Profile Summary Update Email
  // ═══════════════════════════════════════════════════════════════

  async sendProfileSummaryUpdateEmail(params: ProfileSummaryUpdateEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.profileSummaryUpdate.subject,
      templateName: 'profileSummaryUpdate',
      context: {
        locale,
        dict: emailDict.profileSummaryUpdate,
        sharedDict: emailDict.shared,
        name: params.firstName,
        firstName: params.firstName,
        matchmakerName: params.matchmakerName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Verification Email (OTP)
  // ═══════════════════════════════════════════════════════════════

  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    console.log('[sendVerificationEmail] Sending OTP email:', {
      locale,
      subject: emailDict.emailOtpVerification.subject
    });

    await this.sendEmail({
      to: params.email,
      subject: emailDict.emailOtpVerification.subject,
      templateName: 'emailOtpVerification',
      context: {
        locale,
        dict: emailDict.emailOtpVerification,
        sharedDict: emailDict.shared,
        name: params.firstName || params.email,
        firstName: params.firstName,
        verificationCode: params.verificationCode,
        expiresIn: params.expiresIn,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Invitation Email
  // ═══════════════════════════════════════════════════════════════

  async sendInvitation(params: InvitationEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullInvitationLink = `${baseUrl}/auth/accept-invitation?token=${params.invitationLink}`;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.invitation.subject.replace('{{matchmakerName}}', params.matchmakerName),
      templateName: 'invitation',
      context: {
        locale,
        dict: emailDict.invitation,
        sharedDict: emailDict.shared,
        name: params.email,
        matchmakerName: params.matchmakerName,
        invitationLink: fullInvitationLink,
        expiresIn: params.expiresIn,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Contact Details Email
  // ═══════════════════════════════════════════════════════════════

  async sendContactDetailsEmail(params: ContactDetailsEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.shareContactDetails.subject,
      templateName: 'shareContactDetails',
      context: {
        locale,
        dict: emailDict.shareContactDetails,
        sharedDict: emailDict.shared,
        name: params.recipientName,
        recipientName: params.recipientName,
        otherPartyName: params.otherPartyName,
        otherPartyContact: params.otherPartyContact,
        matchmakerName: params.matchmakerName,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Suggestion Notification Email
  // ═══════════════════════════════════════════════════════════════

  async sendSuggestionNotification(params: SuggestionEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;
    const isHebrew = locale === 'he';

    await this.sendEmail({
      to: params.email,
      subject: emailDict.suggestion.subject,
      templateName: 'suggestion',
      context: {
        locale,
        dict: emailDict.suggestion,
        sharedDict: emailDict.shared,
        name: params.recipientName,
        recipientName: params.recipientName,
        matchmakerName: params.matchmakerName,
        suggestionDetails: params.suggestionDetails,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/suggestions`,
        optOutFirstPartyUrl: params.optOutFirstPartyUrl,
        optOutFirstPartyText: isHebrew
          ? 'לא מעוניין/ת להיות צד ראשון בהצעות'
          : 'I don\'t want to be first party in suggestions',
        unsubscribeUrl: params.unsubscribeUrl,
        unsubscribeText: isHebrew
          ? 'הסרה מרשימת תפוצה'
          : 'Unsubscribe from emails',
      },
      headers: params.unsubscribeUrl ? {
        'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      } : undefined,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Suggestion Invitation Email (Personal Invitation)
  // ═══════════════════════════════════════════════════════════════

  async sendSuggestionInvitation(params: SuggestionInvitationEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    if (!emailDict.suggestionInvitation) {
      console.warn('suggestionInvitation dictionary section not found, falling back to regular suggestion notification');
      return this.sendSuggestionNotification({
        locale: params.locale,
        email: params.email,
        recipientName: params.recipientName,
        matchmakerName: params.matchmakerName,
      });
    }

    const isHebrew = locale === 'he';
    const greeting = isHebrew
      ? `שלום ${params.recipientName},`
      : `Hello ${params.recipientName},`;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.suggestionInvitation.subject,
      templateName: 'suggestionInvitation',
      context: {
        locale,
        dict: emailDict.suggestionInvitation,
        sharedDict: emailDict.shared,
        name: params.recipientName,
        recipientName: params.recipientName,
        matchmakerName: params.matchmakerName,
        matchmakerNote: params.matchmakerNote,
        reviewUrl: params.reviewUrl,
        deadlineText: params.deadlineText,
        greeting,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Password Reset OTP Email
  // ═══════════════════════════════════════════════════════════════

  async sendPasswordResetOtpEmail(params: PasswordResetOtpEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.passwordResetOtp.subject,
      templateName: 'passwordResetOtp',
      context: {
        locale,
        dict: emailDict.passwordResetOtp,
        sharedDict: emailDict.shared,
        name: params.firstName || params.email,
        firstName: params.firstName,
        otp: params.otp,
        expiresIn: params.expiresIn,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Password Changed Confirmation Email
  // ═══════════════════════════════════════════════════════════════

  async sendPasswordChangedConfirmationEmail(params: PasswordChangedConfirmationParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.passwordChangedConfirmation.subject,
      templateName: 'passwordChangedConfirmation',
      context: {
        locale,
        dict: emailDict.passwordChangedConfirmation,
        sharedDict: emailDict.shared,
        name: params.firstName || params.email,
        firstName: params.firstName,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/signin`,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Availability Check Email
  // ═══════════════════════════════════════════════════════════════

  async sendAvailabilityCheck(params: AvailabilityCheckEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.availabilityCheck.subject,
      templateName: 'availabilityCheck',
      context: {
        locale,
        dict: emailDict.availabilityCheck,
        sharedDict: emailDict.shared,
        name: params.recipientName,
        recipientName: params.recipientName,
        matchmakerName: params.matchmakerName,
        inquiryId: params.inquiryId,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Report/Block Notification Email (Apple Guideline 1.2)
  // Sends notification to matchmaker + admin when user reports/blocks
  // ═══════════════════════════════════════════════════════════════

  async sendReportNotification(params: ReportNotificationEmailParams): Promise<void> {
    const isHebrew = params.locale === "he";

    const subject = isHebrew
      ? `🚨 ${params.reportType === "BLOCK" ? "חסימה" : "דיווח"} חדש - נדרשת בדיקה תוך 24 שעות`
      : `🚨 New ${params.reportType === "BLOCK" ? "Block" : "Report"} - Review Required Within 24 Hours`;

    const reasonLabels: Record<string, { he: string; en: string }> = {
      INAPPROPRIATE_CONTENT: { he: "תוכן לא הולם", en: "Inappropriate Content" },
      FAKE_PROFILE: { he: "חשד לפרופיל מזויף", en: "Suspected Fake Profile" },
      HARASSMENT: { he: "הטרדה", en: "Harassment" },
      OFFENSIVE_PHOTOS: { he: "תמונות פוגעניות", en: "Offensive Photos" },
      MISLEADING_INFO: { he: "מידע מטעה", en: "Misleading Information" },
      OTHER: { he: "אחר", en: "Other" },
    };

    const reasonText =
      reasonLabels[params.reason]?.[isHebrew ? "he" : "en"] || params.reason;

    const html = `
      <!DOCTYPE html>
      <html dir="${isHebrew ? "rtl" : "ltr"}" lang="${params.locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #DC2626, #F97316);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 24px;
          }
          .section {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
            border: 1px solid #e5e7eb;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .value {
            color: #111827;
            font-size: 15px;
            font-weight: 500;
          }
          .value-secondary {
            color: #6b7280;
            font-size: 13px;
            margin-top: 2px;
          }
          .type-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
          }
          .type-block {
            background: #FEE2E2;
            color: #DC2626;
          }
          .type-report {
            background: #FEF3C7;
            color: #D97706;
          }
          .warning {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 16px;
            border-radius: 12px;
            margin-top: 20px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .warning-icon {
            font-size: 20px;
            flex-shrink: 0;
          }
          .warning-text {
            color: #92400E;
            font-size: 14px;
            line-height: 1.5;
          }
          .button-container {
            text-align: center;
            margin-top: 24px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #14B8A6, #0D9488);
            color: white !important;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
          }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
          }
          .footer p {
            margin: 4px 0;
          }
          .details-section {
            background: #fff;
            border: 1px solid #e5e7eb;
          }
          .details-text {
            color: #374151;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ${
              params.reportType === "BLOCK"
                ? isHebrew
                  ? "חסימה חדשה"
                  : "New Block"
                : isHebrew
                  ? "דיווח חדש"
                  : "New Report"
            }</h1>
            <p>${isHebrew ? "נדרשת בדיקה תוך 24 שעות" : "Review required within 24 hours"}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="label">${isHebrew ? "סוג" : "Type"}</div>
              <span class="type-badge ${params.reportType === "BLOCK" ? "type-block" : "type-report"}">
                ${
                  params.reportType === "BLOCK"
                    ? isHebrew
                      ? "🚫 חסימה + דיווח אוטומטי"
                      : "🚫 Block + Auto-Report"
                    : isHebrew
                      ? "🚩 דיווח"
                      : "🚩 Report"
                }
              </span>
            </div>

            <div class="section">
              <div class="label">${isHebrew ? "מי דיווח" : "Reporter"}</div>
              <div class="value">${params.reporterName}</div>
              <div class="value-secondary">${params.reporterEmail}</div>
            </div>

            <div class="section">
              <div class="label">${isHebrew ? "על מי דווח" : "Reported User"}</div>
              <div class="value">${params.reportedUserName}</div>
              <div class="value-secondary">${params.reportedUserEmail}</div>
            </div>

            <div class="section">
              <div class="label">${isHebrew ? "סיבה" : "Reason"}</div>
              <div class="value">${reasonText}</div>
            </div>

            ${
              params.details
                ? `
            <div class="section details-section">
              <div class="label">${isHebrew ? "פרטים נוספים" : "Additional Details"}</div>
              <div class="details-text">${params.details}</div>
            </div>
            `
                : ""
            }

            <div class="warning">
              <span class="warning-icon">⚠️</span>
              <div class="warning-text">
                <strong>${isHebrew ? "תזכורת חשובה:" : "Important Reminder:"}</strong><br>
                ${
                  isHebrew
                    ? "על פי מדיניות Apple (Guideline 1.2), יש לבדוק דיווחים ולפעול תוך 24 שעות. אי עמידה בדרישה זו עלולה לסכן את האפליקציה."
                    : "Per Apple Guideline 1.2, reports must be reviewed and acted upon within 24 hours. Failure to comply may jeopardize the app."
                }
              </div>
            </div>

            <div class="button-container">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/reports/${params.reportId}" class="button">
                ${isHebrew ? "צפה בדיווח בדשבורד" : "View Report in Dashboard"}
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>Report ID:</strong> ${params.reportId}</p>
            <p><strong>Suggestion ID:</strong> ${params.suggestionId}</p>
            <p>${new Date().toLocaleString(isHebrew ? "he-IL" : "en-US")}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendRawEmail({
      to: params.toEmail,
      subject,
      html,
    });

    console.log(`📧 [Report Notification] Email sent to ${params.toEmail} for ${params.reportType}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // Verify Connection
  // ═══════════════════════════════════════════════════════════════

  async verifyConnection(): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error('⚠️ RESEND_API_KEY is not defined');
        return false;
      }
      console.log("✅ Resend API Key מוגדר - שירות האימייל מוכן.");
      return true;
    } catch (error) {
      console.error('שגיאה בהגדרת שירות האימייל:', error);
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export const emailService = EmailService.getInstance();

export type {
  EmailConfig,
  WelcomeEmailParams,
  VerificationEmailParams,
  InvitationEmailParams,
  SuggestionEmailParams,
  ContactDetailsEmailParams,
  AvailabilityCheckEmailParams,
  PasswordResetOtpEmailParams,
  PasswordChangedConfirmationParams,
  AccountSetupEmailParams,
  ProfileSummaryUpdateEmailParams,
  SuggestionInvitationEmailParams,
  ReportNotificationEmailParams,
};