// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import { emailTemplates } from './templates/emailTemplates';

// Types
interface EmailConfig {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, unknown>;
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

interface AvailabilityCheckEmailParams {
  email: string;
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
  baseUrl?: string;
}

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  
  private constructor() {
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
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({ to, subject, templateName, context }: EmailConfig): Promise<void> {
    try {
      if (!emailTemplates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
      }

      const html = emailTemplates[templateName](context);

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
      templateName: 'welcome',
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
    const fullVerificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${verificationLink}`;

    await this.sendEmail({
      to: email,
      subject: 'אימות כתובת האימייל שלך',
      templateName: 'email-verification',
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
      templateName: 'invitation',
      context: {
        matchmakerName,
        baseUrl,
        token: invitationLink,
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
      templateName: 'share-contact-details',
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
      templateName: 'suggestion',
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
      templateName: 'password-reset',
      context: {
        resetLink: fullResetLink,
        expiresIn: '1 שעה',
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
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
      templateName: 'availability-check',
      context: {
        recipientName,
        matchmakerName,
        inquiryId,
        baseUrl
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

// Export singleton instance
export const emailService = EmailService.getInstance();

// Export types
export type {
  EmailConfig,
  WelcomeEmailParams,
  VerificationEmailParams,
  InvitationEmailParams,
  SuggestionEmailParams,
  ContactDetailsEmailParams,
  AvailabilityCheckEmailParams
};