// src/lib/engagement/adapters/email.adapter.ts
import nodemailer from 'nodemailer';

export interface RecipientInfo {
  email: string;
  phone?: string | null;
  name: string;
}

export interface NotificationContent {
  subject: string;
  body: string; // For text-based channels like SMS or simple emails
  htmlBody?: string; // For rich HTML emails
}

export class EmailAdapter {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  public canSend(recipient: RecipientInfo): boolean {
    return !!recipient.email;
  }

  public async send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean> {
    if (!this.canSend(recipient)) return false;

    try {
      await this.transporter.sendMail({
        from: `NeshamaTech <${process.env.GMAIL_USER}>`,
        to: recipient.email,
        subject: content.subject,
        html: content.htmlBody || `<p>${content.body.replace(/\n/g, '<br>')}</p>`,
      });
      console.log(`[EmailAdapter] Email sent to ${recipient.email}`);
      return true;
    } catch (error) {
      console.error(`[EmailAdapter] Failed to send email to ${recipient.email}:`, error);
      return false;
    }
  }
}