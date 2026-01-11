// src/lib/email/emailService.ts

import { Resend } from 'resend';
import { emailTemplates, TemplateContextMap } from './templates/emailTemplates';
import { getDictionary } from '@/lib/dictionaries';
import { EmailDictionary } from '@/types/dictionary';
import { Locale } from '../../../i18n-config';
import prisma from '@/lib/prisma';

// =================  ממשקים (ללא שינוי) =================

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
}

interface EmailConfig {
  to: string;
  subject: string;
  templateName: keyof TemplateContextMap;
  context: Omit<TemplateContext, 'supportEmail' | 'companyName' | 'currentYear' | 'baseUrl'>;
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

// ================= מחלקת השירות =================

class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  private fromEmail: string;
  
  private constructor() {
    // בדיקה שה-API Key קיים
    if (!process.env.RESEND_API_KEY) {
      console.error('⚠️ RESEND_API_KEY is not defined in environment variables');
    }
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    
    // כתובת השולח - משתמשים בדומיין המאומת
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@neshamatech.com';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * פונקציית עזר לבדיקת שפת המשתמש מתוך הדאטה-בייס.
   * אם המשתמש קיים ב-DB, נשתמש בשדה language שלו.
   * אחרת, נשתמש ב-locale שהועבר כברירת מחדל.
   */
  private async resolveLocale(email: string, defaultLocale: Locale): Promise<Locale> {
    try {
      if (!email) return defaultLocale;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { language: true }
      });

      if (user && user.language) {
        // המרה מטיפוס ה-Enum של פריזמה לטיפוס Locale שלנו
        return user.language as Locale;
      }
    } catch (error) {
      console.warn(`Could not resolve locale from DB for ${email}, using default.`, error);
    }

    return defaultLocale;
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

  // ================= פונקציות שליחה (ללא שינוי) =================

async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    // --- תיקון: החלפת המשתנה בתוך מחרוזת הכותרת ---
    const subject = emailDict.welcome.subject.replace('{{firstName}}', params.firstName);

    await this.sendEmail({
      to: params.email,
      subject: subject, // שימוש במשתנה המעובד
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

async sendAccountSetupEmail(params: AccountSetupEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;
    const setupLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/setup-account?token=${params.setupToken}`;
    
    // --- תיקון: החלפת שם השדכן בכותרת ---
    const subject = emailDict.accountSetup.subject.replace('{{matchmakerName}}', params.matchmakerName);

    await this.sendEmail({
      to: params.email,
      subject: subject, // שימוש במשתנה המעובד
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


  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    console.log('📧 [sendVerificationEmail] Sending OTP email:', {
      to: params.email,
      code: params.verificationCode,
      firstName: params.firstName,
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

  async sendSuggestionNotification(params: SuggestionEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

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
      }
    });
  }

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

  async verifyConnection(): Promise<boolean> {
    try {
      // Resend לא צריך אימות חיבור כמו SMTP
      // אבל נבדוק שה-API Key קיים
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
};