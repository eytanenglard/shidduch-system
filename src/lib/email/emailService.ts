// src/lib/email/emailService.ts

import nodemailer from 'nodemailer';
import { emailTemplates } from './templates/emailTemplates'; // ודא שהקובץ הזה קיים ושיש בו טמפלייט בשם email-otp-verification

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

// שנה את VerificationEmailParams
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

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  
  private constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // או כל ספק אחר
      auth: {
        user: process.env.GMAIL_USER, // או המשתמש של הספק שלך
        pass: process.env.GMAIL_APP_PASSWORD, // או הסיסמה של הספק שלך
      },
      tls: {
        rejectUnauthorized: false // שקול להסיר בסביבת פרודקשן אם יש לך אישור תקין
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
        console.error(`Email template ${templateName} not found.`);
        throw new Error(`Template ${templateName} not found`);
      }

      const html = emailTemplates[templateName](context);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'מערכת שידוכים'} <${process.env.GMAIL_USER}>`,
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
      console.log('Email sent successfully:', info.messageId, 'to:', to);
      
    } catch (error) {
      console.error('Error sending email to:', to, 'Error:', error);
      // אל תזרוק שגיאה אם אתה רוצה שהאפליקציה תמשיך גם אם שליחת המייל נכשלה,
      // אלא אם כן זה קריטי. כאן אנחנו זורקים שגיאה.
      throw new Error(`Failed to send email to ${to}`);
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
      subject: 'ברוכים הבאים למערכת השידוכים',
      templateName: 'welcome', // ודא שיש טמפלייט כזה
      context: {
        firstName,
        requiresVerification,
        matchmakerAssigned,
        matchmakerName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${dashboardUrl}`,
        supportEmail: supportEmail || process.env.SUPPORT_EMAIL || 'support@example.com',
        unsubscribeUrl, // אם יש
        privacyNote,
        currentYear: new Date().getFullYear()
      }
    });
  }

  // עדכון sendVerificationEmail
  async sendVerificationEmail({
    email,
    verificationCode, // קבל את הקוד
    firstName,
    expiresIn = 'שעה אחת' // ברירת מחדל לתוקף קצר יותר עבור OTP
  }: VerificationEmailParams): Promise<void> {
    // ודא שיש לך טמפלייט שנקרא 'email-otp-verification' בקובץ emailTemplates.ts
    // הטמפלייט הזה צריך לקבל ולהציג את verificationCode
    // לדוגמה, בתוך הטמפלייט: <p>קוד האימות שלך הוא: <strong>{{verificationCode}}</strong></p>
    
    console.log(`Sending verification email with OTP ${verificationCode} to ${email}`);
    await this.sendEmail({
      to: email,
      subject: 'קוד לאימות כתובת האימייל שלך', // עדכן נושא
      templateName: 'email-otp-verification', // השתמש בשם טמפלייט מתאים
      context: {
        firstName,
        verificationCode, // העבר את הקוד לטמפלייט
        expiresIn,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      }
    });
  }

  async sendInvitation({
    email,
    invitationLink, // זהו הטוקן עצמו מהמודל Invitation
    matchmakerName,
    expiresIn = '7 ימים'
  }: InvitationEmailParams): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullInvitationLink = `${baseUrl}/auth/accept-invitation?token=${invitationLink}`;
    
    await this.sendEmail({
      to: email,
      subject: 'הזמנה להצטרף למערכת השידוכים',
      templateName: 'invitation', // ודא שיש טמפלייט כזה
      context: {
        matchmakerName,
        invitationLink: fullInvitationLink, // שלח את הלינק המלא
        expiresIn,
        // baseUrl, // אולי לא נדרש אם הלינק כבר מלא
        // token: invitationLink, // אולי לא נדרש אם הלינק כבר מלא
      }
    });
  }

  async sendContactDetailsEmail({
    email,
    recipientName,
    otherPartyName,
    otherPartyContact,
    matchmakerName,
    supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com'
  }: ContactDetailsEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'פרטי קשר להצעת השידוך',
      templateName: 'share-contact-details', // ודא שיש טמפלייט כזה
      context: {
        recipientName,
        otherPartyName,
        otherPartyContact, // אובייקט עם phone, email, whatsapp
        matchmakerName,
        supportEmail
      }
    });
  }

  async sendSuggestionNotification({
    email,
    recipientName,
    matchmakerName,
    suggestionDetails // אובייקט עם פרטי ההצעה
  }: SuggestionEmailParams): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'הצעת שידוך חדשה ממתינה לך',
      templateName: 'suggestion', // ודא שיש טמפלייט כזה
      context: {
        recipientName,
        matchmakerName,
        suggestionDetails,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/suggestions`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      }
    });
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const fullResetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to: email,
      subject: 'איפוס סיסמה',
      templateName: 'password-reset', // ודא שיש טמפלייט כזה
      context: {
        resetLink: fullResetLink,
        expiresIn: 'שעה אחת', // או כמה שהוגדר לטוקן איפוס סיסמה
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      }
    });
  }

  async sendAvailabilityCheck({
    email,
    recipientName,
    matchmakerName,
    inquiryId, // המזהה של הבקשה, כדי לבנות לינקים לתשובה
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }: AvailabilityCheckEmailParams): Promise<void> {
    // לדוגמה, לינקים לתשובה יכולים להיות:
    // `${baseUrl}/api/inquiries/${inquiryId}/respond?available=true`
    // `${baseUrl}/api/inquiries/${inquiryId}/respond?available=false`
    await this.sendEmail({
      to: email,
      subject: 'בקשת בדיקת זמינות לשידוך',
      templateName: 'availability-check', // ודא שיש טמפלייט כזה
      context: {
        recipientName,
        matchmakerName,
        inquiryId,
        baseUrl,
        // אפשר להוסיף כאן לינקים מוכנים לתשובה אם רוצים
        // approveLink: `${baseUrl}/inquiry/respond/${inquiryId}?response=yes`,
        // declineLink: `${baseUrl}/inquiry/respond/${inquiryId}?response=no`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
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
  VerificationEmailParams, // ייצא את המבנה המעודכן
  InvitationEmailParams,
  SuggestionEmailParams,
  ContactDetailsEmailParams,
  AvailabilityCheckEmailParams
};