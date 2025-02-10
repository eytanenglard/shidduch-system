// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';

// הגדרת טיפוסים
interface EmailConfig {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;

}

interface AvailabilityCheckEmailParams {
  email: string;
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
}
interface WelcomeEmailParams {
  email: string;
  firstName: string;
  requiresVerification?: boolean;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  dashboardUrl: string;
  supportEmail: string;
  unsubscribeUrl?: string;
  privacyNote?: boolean;
}

interface VerificationEmailParams {
  email: string;
  verificationLink: string;
  firstName?: string;
  expiresIn?: string;
}

interface InvitationEmailParams {
  email: string;
  invitationLink: string;
  matchmakerName: string;
  expiresIn?: string;
}

interface SuggestionEmailParams {
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
  email: string;
  recipientName: string;
  otherPartyName: string;
  otherPartyContact: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  matchmakerName: string;
  supportEmail?: string;
}
// טיפוס להקשר של התבנית
interface TemplateContext {
  [key: string]: unknown;
}
interface AvailabilityCheckEmailParams {
  email: string;
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
  baseUrl?: string;
}


class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, Handlebars.TemplateDelegate<TemplateContext>>;

  constructor() {
    // יצירת טרנספורטר nodemailer
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // אתחול מטמון התבניות
    this.templateCache = new Map();

    // הגדרת הלפרים של Handlebars
    Handlebars.registerHelper('formatDate', function(this: unknown, date: Date) {
      return new Date(date).toLocaleDateString('he-IL');
    });

    Handlebars.registerHelper('ifeq', function(
      this: unknown,
      a: unknown,
      b: unknown,
      options: Handlebars.HelperOptions
    ) {
      return (a === b) ? options.fn(this) : options.inverse(this);
    });
  }

  private async loadTemplate(templateName: string): Promise<Handlebars.TemplateDelegate<TemplateContext>> {
    const cached = this.templateCache.get(templateName);
    if (cached) {
      return cached;
    }

    try {
      const templatePath = path.join(process.cwd(), 'src/lib/email/templates', `${templateName}.hbs`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile<TemplateContext>(templateContent);
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }
 
  async sendAvailabilityCheck({
    email,
    recipientName,
    matchmakerName,
    inquiryId,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  }: AvailabilityCheckEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'בקשת בדיקת זמינות לשידוך',
      template: 'availability-check',
      context: {
        recipientName,
        matchmakerName,
        inquiryId,
        baseUrl
      }
    });
  }
  async sendEmail({ to, subject, template, context }: EmailConfig): Promise<void> {
    try {
      const compiledTemplate = await this.loadTemplate(template);
      const html = compiledTemplate(context);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Priority': '1',
          'X-MSMAIL-Priority': 'High'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail({
    email,
    firstName,
    requiresVerification = false,
    matchmakerAssigned = false,
    matchmakerName = '',
    dashboardUrl,
    supportEmail,
    unsubscribeUrl,
    privacyNote = true
  }: WelcomeEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'ברוכים הבאים למערכת השידוכים',
      template: 'welcome',
      context: {
        firstName,
        requiresVerification,
        matchmakerAssigned,
        matchmakerName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${dashboardUrl}`,
        supportEmail: supportEmail || process.env.SUPPORT_EMAIL,
        unsubscribeUrl,
        privacyNote,
        currentYear: new Date().getFullYear()
      }
    });
  }

  async sendVerificationEmail({
    email,
    verificationLink,
    firstName,
    expiresIn = '24 שעות'
  }: VerificationEmailParams): Promise<void> {
    // Construct the full verification URL
    const fullVerificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${verificationLink}`;

    await this.sendEmail({
      to: email,
      subject: 'אימות כתובת האימייל שלך',
      template: 'email-verification',
      context: {
        firstName,
        verificationLink: fullVerificationLink,
        expiresIn,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  async sendInvitation({
    email,
    invitationLink,
    matchmakerName,
    expiresIn = '7 ימים'
}: InvitationEmailParams): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await this.sendEmail({
        to: email,
        subject: 'הזמנה להצטרף למערכת השידוכים',
        template: 'invitation',
        context: {
            matchmakerName,
            baseUrl,
            token: invitationLink, // שולחים רק את הטוקן עצמו
            expiresIn
        }
    });
}
async sendContactDetailsEmail({
  email,
  recipientName,
  otherPartyName,
  otherPartyContact,
  matchmakerName,
  supportEmail = process.env.SUPPORT_EMAIL
}: ContactDetailsEmailParams): Promise<void> {
  await this.sendEmail({
    to: email,
    subject: 'פרטי קשר להצעת השידוך',
    template: 'share-contact-details',
    context: {
      recipientName,
      otherPartyName,
      otherPartyContact,
      matchmakerName,
      supportEmail
    }
  });
}

  async sendSuggestionNotification({
    email,
    recipientName,
    matchmakerName,
    suggestionDetails
  }: SuggestionEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'הצעת שידוך חדשה ממתינה לך',
      template: 'suggestion',
      context: {
        recipientName,
        matchmakerName,
        suggestionDetails,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<void> {
    const fullResetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetLink}`;
    
    await this.sendEmail({
      to: email,
      subject: 'איפוס סיסמה',
      template: 'password-reset',
      context: {
        resetLink: fullResetLink,
        expiresIn: '1 שעה',
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection error:', error);
      return false;
    }
  }
}

// יצוא singleton instance
export const emailService = new EmailService();

// טיפוסי ייצוא
export type {
  EmailConfig,
  WelcomeEmailParams,
  VerificationEmailParams,
  InvitationEmailParams,
  SuggestionEmailParams,
  TemplateContext,
  ContactDetailsEmailParams 
};