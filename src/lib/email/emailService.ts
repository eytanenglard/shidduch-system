// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import { emailTemplates } from './templates/emailTemplates';
// =================  הוספות נדרשות =================
import { getDictionary } from '@/lib/dictionaries';
import { EmailDictionary } from '@/types/dictionary';
// ================= סוף הוספות =================

// Types
interface EmailConfig {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, unknown>;
}

// ================= שינוי: הוספת locale לכל הטיפוסים =================
interface AccountSetupEmailParams {
    locale: 'he' | 'en';
    email: string;
    firstName: string;
    matchmakerName: string;
    setupToken: string;
    expiresIn: string;
}
interface WelcomeEmailParams {
  locale: 'he' | 'en';
  email: string;
  firstName: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  dashboardUrl: string;
}

interface VerificationEmailParams {
  locale: 'he' | 'en';
  email: string;
  verificationCode: string;
  firstName?: string;
  expiresIn?: string;
}

interface InvitationEmailParams {
  locale: 'he' | 'en';
  email: string;
  invitationLink: string;
  matchmakerName: string;
  expiresIn?: string;
}

interface SuggestionEmailParams {
  locale: 'he' | 'en';
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
  locale: 'he' | 'en';
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
  locale: 'he' | 'en';
  email: string;
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
}

interface PasswordResetOtpEmailParams {
  locale: 'he' | 'en';
  email: string;
  otp: string;
  firstName?: string;
  expiresIn?: string;
}

interface PasswordChangedConfirmationParams {
    locale: 'he' | 'en';
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
      if (!emailTemplates[templateName]) {
        console.error(`Email template "${templateName}" not found.`);
        throw new Error(`Template ${templateName} not found`);
      }

      const fullContext = {
        ...context,
        supportEmail: context.supportEmail || process.env.SUPPORT_EMAIL || 'support@example.com',
        companyName: process.env.COMPANY_NAME || 'NeshamaTech',
        currentYear: new Date().getFullYear().toString(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      };
      
      const html = emailTemplates[templateName](fullContext as any); // Use 'as any' to bypass strict context type checks here

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
      console.log('Email sent successfully:', info.messageId, 'to:', to, 'subject:', subject);
      
    } catch (error) {
      console.error('Error sending email to:', to, 'Subject:', subject, 'Template:', templateName, 'Error:', error);
      throw new Error(`Failed to send email to ${to} using template ${templateName}`);
    }
  }

  // ============================ עדכון כל הפונקציות הבאות ============================

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
        dict: emailDict.welcome,
        sharedDict: emailDict.shared,
        name: firstName, // 'name' for the shared greeting
        firstName, // keep 'firstName' for specific template use if any
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
        dict: emailDict.emailOtpVerification,
        sharedDict: emailDict.shared,
        name: firstName,
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
        dict: emailDict.invitation,
        sharedDict: emailDict.shared,
        name: email, // Fallback name
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
        dict: emailDict.passwordResetOtp,
        sharedDict: emailDict.shared,
        name: firstName,
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
              dict: emailDict.passwordChangedConfirmation,
              sharedDict: emailDict.shared,
              name: firstName,
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
        dict: emailDict.availabilityCheck,
        sharedDict: emailDict.shared,
        name: recipientName,
        recipientName,
        matchmakerName,
        inquiryId,
      }
    });
  }
  
  // ... (verifyConnection ופונקציות אחרות נשארות ללא שינוי)
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connection verified successfully.");
      return true;
    } catch (error) {
      console.error('Email service connection error:', error);
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