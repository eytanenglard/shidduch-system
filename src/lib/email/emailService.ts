// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import { emailTemplates } from './templates/emailTemplates'; // ודא שהקובץ הזה קיים ומיצא את התבניות

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
  verificationCode: string; // שונה מ-verificationLink
  firstName?: string;
  expiresIn?: string; // לדוגמה: "שעה אחת", "10 דקות"
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

// New type for password reset OTP email
interface PasswordResetOtpEmailParams {
  email: string;
  otp: string;
  firstName?: string;
  expiresIn?: string; // e.g., "15 דקות"
}

// New type for password changed confirmation
interface PasswordChangedConfirmationParams {
    email: string;
    firstName?: string;
}


class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  
  private constructor() {
    // Configure the transporter according to your email provider
    // Ensure environment variables are set for sensitive data
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // Default to gmail if not specified
      auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_USER, // Your email user
        pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS, // Your email password or app password
      },
      tls: {
        // Do not fail on invalid certs for development, but ensure it's true for production
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

      // Add common context variables if they are not already present
      const fullContext = {
        ...context,
        supportEmail: context.supportEmail || process.env.SUPPORT_EMAIL || 'support@example.com',
        companyName: process.env.COMPANY_NAME || 'Matchpoint Shidduch System',
        currentYear: new Date().getFullYear(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      };
      
      const html = emailTemplates[templateName](fullContext);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Matchpoint Shidduch System'} <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Priority': '1', // For Outlook
          'X-MSMAIL-Priority': 'High' // For Outlook
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId, 'to:', to, 'subject:', subject);
      
    } catch (error) {
      console.error('Error sending email to:', to, 'Subject:', subject, 'Template:', templateName, 'Error:', error);
      // Depending on the criticality, you might re-throw or handle it.
      // For now, re-throwing to make it clear that sending failed.
      throw new Error(`Failed to send email to ${to} using template ${templateName}`);
    }
  }

  async sendWelcomeEmail({
    email,
    firstName,
    requiresVerification = false,
    matchmakerAssigned = false,
    matchmakerName = '',
    dashboardUrl, // למשל '/dashboard'
    supportEmail,
    unsubscribeUrl,
    privacyNote = true
  }: WelcomeEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'ברוכים הבאים למערכת השידוכים Matchpoint',
      templateName: 'welcome', // Ensure 'welcome' template exists
      context: {
        firstName,
        requiresVerification,
        matchmakerAssigned,
        matchmakerName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${dashboardUrl}`,
        supportEmail: supportEmail || process.env.SUPPORT_EMAIL || 'support@example.com',
        unsubscribeUrl,
        privacyNote,
      }
    });
  }

  async sendVerificationEmail({
    email,
    verificationCode,
    firstName,
    expiresIn = 'שעה אחת'
  }: VerificationEmailParams): Promise<void> {
    console.log(`Sending account verification email with OTP ${verificationCode} to ${email}`);
    await this.sendEmail({
      to: email,
      subject: 'קוד לאימות כתובת האימייל שלך - Matchpoint',
      templateName: 'email-otp-verification', // Ensure this template exists and uses 'verificationCode'
      context: {
        firstName,
        verificationCode, // Pass the code to the template
        expiresIn,
      }
    });
  }

  async sendInvitation({
    email,
    invitationLink, // This is the token itself from the Invitation model
    matchmakerName,
    expiresIn = '7 ימים'
  }: InvitationEmailParams): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullInvitationLink = `${baseUrl}/auth/accept-invitation?token=${invitationLink}`;
    
    await this.sendEmail({
      to: email,
      subject: `הזמנה להצטרף ל-Matchpoint מ${matchmakerName}`,
      templateName: 'invitation', // Ensure 'invitation' template exists
      context: {
        matchmakerName,
        invitationLink: fullInvitationLink,
        expiresIn,
      }
    });
  }

  async sendContactDetailsEmail({
    email,
    recipientName,
    otherPartyName,
    otherPartyContact,
    matchmakerName,
    supportEmail
  }: ContactDetailsEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `פרטי קשר להצעת שידוך מ${matchmakerName} - Matchpoint`,
      templateName: 'share-contact-details', // Ensure 'share-contact-details' template exists
      context: {
        recipientName,
        otherPartyName,
        otherPartyContact,
        matchmakerName,
        supportEmail: supportEmail || process.env.SUPPORT_EMAIL || 'support@example.com',
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
      subject: `הצעת שידוך חדשה ממתינה לך מ${matchmakerName} - Matchpoint`,
      templateName: 'suggestion', // Ensure 'suggestion' template exists
      context: {
        recipientName,
        matchmakerName,
        suggestionDetails,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/suggestions`,
      }
    });
  }

  // Existing method for link-based password reset (if you still use it elsewhere)
  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const fullResetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`; // This implies the old page took a long token
    
    await this.sendEmail({
      to: email,
      subject: 'איפוס סיסמה - Matchpoint (קישור)', // Differentiate if needed
      templateName: 'password-reset', // Ensure 'password-reset' (link-based) template exists
      context: {
        resetLink: fullResetLink,
        expiresIn: 'שעה אחת', // Or however long your link token is valid
      }
    });
  }

  // New method for sending OTP for password reset
  async sendPasswordResetOtpEmail({
    email,
    otp,
    firstName,
    expiresIn = '15 דקות' // Default expiry for OTP
  }: PasswordResetOtpEmailParams): Promise<void> {
    console.log(`Sending password reset OTP ${otp} to ${email}`);
    await this.sendEmail({
      to: email,
      subject: 'קוד לאיפוס סיסמה במערכת Matchpoint',
      templateName: 'password-reset-otp', // Ensure 'password-reset-otp' template exists
      context: {
        firstName,
        otp,
        expiresIn,
      }
    });
  }

  // New method for confirming password change
  async sendPasswordChangedConfirmationEmail({
      email,
      firstName,
  }: PasswordChangedConfirmationParams): Promise<void> {
      console.log(`Sending password changed confirmation to ${email}`);
      await this.sendEmail({
          to: email,
          subject: 'הסיסמה שלך במערכת Matchpoint שונתה בהצלחה',
          templateName: 'password-changed-confirmation', // Ensure 'password-changed-confirmation' template exists
          context: {
              firstName,
              loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/signin`,
          }
      });
  }

  async sendAvailabilityCheck({
    email,
    recipientName,
    matchmakerName,
    inquiryId,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }: AvailabilityCheckEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `בקשת בדיקת זמינות לשידוך מ${matchmakerName} - Matchpoint`,
      templateName: 'availability-check', // Ensure 'availability-check' template exists
      context: {
        recipientName,
        matchmakerName,
        inquiryId,
        baseUrl,
        // Example links if your template supports them directly
        // approveLink: `${baseUrl}/api/inquiries/${inquiryId}/respond?available=true`,
        // declineLink: `${baseUrl}/api/inquiries/${inquiryId}/respond?available=false`,
      }
    });
  }

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
  AvailabilityCheckEmailParams,
  PasswordResetOtpEmailParams, // Export new type
  PasswordChangedConfirmationParams, // Export new type
};