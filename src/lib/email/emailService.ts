// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
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
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        companyName: process.env.COMPANY_NAME || 'NeshamaTech',
        currentYear: new Date().getFullYear().toString(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      };
      
      const html = templateFunction(fullContext as any); 

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
      console.log('אימייל נשלח בהצלחה:', info.messageId, 'אל:', to, 'נושא:', subject, 'שפה:', context.locale);
      
    } catch (error) {
      console.error('שגיאה בשליחת אימייל אל:', to, 'נושא:', subject, 'תבנית:', templateName, 'שגיאה:', error);
      throw new Error(`Failed to send email to ${to} using template ${templateName}`);
    }
  }

  // ================= פונקציות שליחה (מעודכנות עם בדיקת DB) =================

  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    // 1. בודקים ב-DB מה השפה המועדפת
    const locale = await this.resolveLocale(params.email, params.locale);
    
    // 2. מושכים מילון לפי השפה שנמצאה
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

    await this.sendEmail({
      to: params.email,
      subject: emailDict.welcome.subject,
      templateName: 'welcome',
      context: {
        locale, // מעבירים את השפה המעודכנת
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
    
    await this.sendEmail({
      to: params.email,
      subject: emailDict.accountSetup.subject,
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
        matchmakerName: params.matchmakerName, // מעביר את הערך (שיכול להיות undefined)
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`,
      }
    });
  }


  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const locale = await this.resolveLocale(params.email, params.locale);
    const dictionary = await getDictionary(locale);
    const emailDict = dictionary.email;

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
    // בהזמנה ייתכן שהמשתמש עוד לא קיים, אבל ננסה לבדוק בכל זאת
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
      console.log('אימייל גולמי נשלח בהצלחה:', info.messageId, 'אל:', to, 'נושא:', subject);
      
    } catch (error) {
      console.error('שגיאה בשליחת אימייל גולמי אל:', to, 'נושא:', subject, 'שגיאה:', error);
      throw new Error(`Failed to send raw email to ${to}`);
    }
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
  ProfileSummaryUpdateEmailParams,
};