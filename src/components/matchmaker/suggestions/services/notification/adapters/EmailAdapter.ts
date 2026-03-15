// src/components/matchmaker/suggestions/services/notification/adapters/EmailAdapter.ts

import { Resend } from 'resend';
import { NotificationAdapter, NotificationChannel, RecipientInfo, NotificationContent } from '../NotificationService';

export class EmailAdapter implements NotificationAdapter {
  private static instance: EmailAdapter;
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.error('⚠️ RESEND_API_KEY is not defined in environment variables');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@neshamatech.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'NeshamaTech';
  }

  public static getInstance(): EmailAdapter {
    if (!EmailAdapter.instance) {
      EmailAdapter.instance = new EmailAdapter();
    }
    return EmailAdapter.instance;
  }

  public getChannelType(): NotificationChannel {
    return 'email';
  }

  public canSendTo(recipient: RecipientInfo): boolean {
    return !!recipient.email;
  }

  public async send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipient.email],
        subject: content.subject,
        text: content.body,
        html: content.htmlBody || content.body.replace(/\n/g, '<br>'),
      });

      if (error) {
        console.error('Resend error sending email:', {
          error,
          to: recipient.email,
          subject: content.subject,
        });
        return false;
      }

      console.log('Email sent successfully via Resend:', {
        messageId: data?.id,
        to: recipient.email,
        subject: content.subject,
      });

      return true;
    } catch (error) {
      console.error('Detailed error sending email:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        recipient: recipient.email,
        subject: content.subject,
      });
      return false;
    }
  }
}

export const emailAdapter = EmailAdapter.getInstance();