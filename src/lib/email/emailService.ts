// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import { emailTemplates, TemplateContextMap } from './templates/emailTemplates';
import { getDictionary } from '@/lib/dictionaries';
import { EmailDictionary } from '@/types/dictionary';
import { Locale } from '../../../i18n-config'; // ודא שהנתיב נכון

// =================  עדכון הממשק הקיים =================
/**
 * ממשק זה מאגד את כל המאפיינים האפשריים שניתן להעביר לכל תבנית אימייל.
 * הוא מחליף את השימוש ב-'any' ומספק בטיחות טיפוסים מלאה.
 * כל המאפיינים הם אופציונליים מכיוון שכל תבנית משתמשת בתת-קבוצה שונה של מאפיינים.
 */
interface TemplateContext {
  // מאפיינים שנוספים אוטומטית בפונקציה sendEmail
  supportEmail: string;
  companyName: string;
  currentYear: string;
  baseUrl: string;

  // מאפיינים דינמיים המגיעים מהקונטקסט של כל סוג אימייל
  locale?: Locale; // אופציונלי, כי אימיילים פנימיים לא צריכים אותו
  dict?: EmailDictionary[keyof EmailDictionary]; // אופציונלי
  sharedDict?: EmailDictionary['shared']; // אופציונלי
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

  // --- הוספת שדות עבור אימייל הפידבק ---
  feedbackType?: string;
  userIdentifier?: string;
  content?: string;
  pageUrl?: string;
  screenshotUrl?: string;
  feedbackId?: string;
}
// =================  סוף עדכון הממשק =================

// הגדרות טיפוסים בסיסיות עם locale
interface EmailConfig {
  to: string;
  subject: string;
  templateName: keyof TemplateContextMap;
  context: Omit<TemplateContext, 'supportEmail' | 'companyName' | 'currentYear' | 'baseUrl'>;
}

// ================= הוספת locale לכל הטיפוסים =================
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
// ================= סוף השינויים בטיפוסים =================


class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  
  private constructor() {
    this.transporter = nodemailer.createTransport({
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

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({ to, subject, templateName, context }: EmailConfig): Promise<void> {
    try {
      const templateFunction = emailTemplates[templateName];
      if (!templateFunction) {
        console.error(`תבנית אימייל "${templateName}" לא נמצאה.`);
        throw new Error(`Template ${templateName} not found`);
      }

      const fullContext: TemplateContext = {
        ...context,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        companyName: process.env.COMPANY_NAME || 'NeshamaTech',
        currentYear: new Date().getFullYear().toString(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      };
      
      const html = templateFunction(fullContext as any); // Use 'as any' here as a bridge, since the function signatures are typed

      const mailOptions: nodemailer.SendMailOptions = {
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
      
    } catch (error) {
      console.error('שגיאה בשליחת אימייל אל:', to, 'נושא:', subject, 'תבנית:', templateName, 'שגיאה:', error);
      throw new Error(`Failed to send email to ${to} using template ${templateName}`);
    }
  }

  // ============================ פונקציות מעודכנות עם locale ============================

  async sendWelcomeEmail({
    locale,
    email,
    firstName,
    matchmakerAssigned = false,
    matchmakerName = '',
    dashboardUrl,
  }: WelcomeEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendAccountSetupEmail({ locale, email, firstName, matchmakerName, setupToken, expiresIn }: AccountSetupEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendVerificationEmail({
    locale,
    email,
    verificationCode,
    firstName,
    expiresIn = '1 hour'
  }: VerificationEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendInvitation({
    locale,
    email,
    invitationLink,
    matchmakerName,
    expiresIn = '7 days'
  }: InvitationEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendContactDetailsEmail({
    locale,
    email,
    recipientName,
    otherPartyName,
    otherPartyContact,
    matchmakerName,
  }: ContactDetailsEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendSuggestionNotification({
    locale,
    email,
    recipientName,
    matchmakerName,
    suggestionDetails
  }: SuggestionEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendPasswordResetOtpEmail({
    locale,
    email,
    otp,
    firstName,
    expiresIn = '15 minutes'
  }: PasswordResetOtpEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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

  async sendPasswordChangedConfirmationEmail({
      locale,
      email,
      firstName,
  }: PasswordChangedConfirmationParams): Promise<void> {
      const dictionary = await getDictionary(locale);
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

  async sendAvailabilityCheck({
    locale,
    email,
    recipientName,
    matchmakerName,
    inquiryId,
  }: AvailabilityCheckEmailParams): Promise<void> {
    const dictionary = await getDictionary(locale);
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
  
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("חיבור שירות האימייל אומת בהצלחה.");
      return true;
    } catch (error) {
      console.error('שגיאה בחיבור לשירות האימייל:', error);
      return false;
    }
  }
}

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
};