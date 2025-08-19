// src/app/components/matchmaker/suggestions/services/notification/adapters/EmailAdapter.ts

import { NotificationAdapter, NotificationChannel, RecipientInfo, NotificationContent } from '../NotificationService';
import nodemailer from 'nodemailer';

export class EmailAdapter implements NotificationAdapter {
  private static instance: EmailAdapter;
  private transporter: nodemailer.Transporter;

  private constructor() {
    // Configure the transporter exactly like in EmailService
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || '',
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify email configuration on initialization
    this.verifyEmailConfig();
  }

  private async verifyEmailConfig(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Email configuration verified successfully');
    } catch (error) {
      console.error('Email configuration verification failed:', error);
      // Don't throw, to allow the system to continue even if verification fails
    }
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
      const result = await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME || 'מערכת השידוכים'} <${process.env.GMAIL_USER || ''}>`,
        to: recipient.email,
        subject: content.subject,
        text: content.body,
        html: content.htmlBody || content.body.replace(/\n/g, '<br>'),
      });

      console.log('Email sent successfully:', {
        messageId: result.messageId,
        response: result.response,
        to: recipient.email,
        subject: content.subject
      });

      return true;
    } catch (error) {
      console.error('Detailed error sending email:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        recipient: recipient.email,
        subject: content.subject
      });
      return false;
    }
  }
}

export const emailAdapter = EmailAdapter.getInstance();