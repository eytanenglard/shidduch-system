// src/lib/engagement/notificationService.ts
import { User } from '@prisma/client';
import { EmailAdapter, RecipientInfo, NotificationContent } from './adapters/email.adapter';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

class NotificationServiceImpl {
  private emailAdapter: EmailAdapter;
  private whatsappAdapter: WhatsAppAdapter;

  constructor() {
    this.emailAdapter = new EmailAdapter();
    this.whatsappAdapter = new WhatsAppAdapter();
  }

  private loadEmailTemplate(templateName: string, context: any): NotificationContent {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'engagement', 'templates', 'email', `${templateName}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = Handlebars.compile(source);
    const htmlBody = template({
      ...context,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    });

    // We can generate a plain text version here if needed, or just use a subject.
    return { subject: '', body: '', htmlBody };
  }

  async sendWelcome(user: User): Promise<void> {
    const recipient: RecipientInfo = { name: user.firstName, email: user.email, phone: user.phone };
    const context = { firstName: user.firstName };

    // Send Email
    const emailContent = this.loadEmailTemplate('welcome', context);
    emailContent.subject = `ברוך הבא ל-NeshamaTech, ${user.firstName}! המסע שלך מתחיל`;
    await this.emailAdapter.send(recipient, emailContent);

    // Send WhatsApp
    const templateSid = process.env.TWILIO_TEMPLATE_WELCOME_SID;
    if (templateSid) {
      await this.whatsappAdapter.send(recipient, templateSid, { '1': user.firstName });
    }
  }

  async sendProfileNudge(user: User, missingItems: string[]): Promise<void> {
    const recipient: RecipientInfo = { name: user.firstName, email: user.email, phone: user.phone };
    const context = { firstName: user.firstName, missingItems };
    
    const emailContent = this.loadEmailTemplate('profileNudge', context);
    emailContent.subject = `${user.firstName}, טיפ קטן מהשדכנים שיעשה הבדל גדול`;
    await this.emailAdapter.send(recipient, emailContent);
    
    const templateSid = process.env.TWILIO_TEMPLATE_NUDGE_SID;
    if (templateSid) {
      await this.whatsappAdapter.send(recipient, templateSid, { '1': user.firstName, '2': missingItems.slice(0, 2).join(', ') });
    }
  }

  async sendAiInsight(user: User, personalitySummary: string): Promise<void> {
    const recipient: RecipientInfo = { name: user.firstName, email: user.email, phone: user.phone };
    const context = { firstName: user.firstName, personalitySummary };

    const emailContent = this.loadEmailTemplate('aiInsight', context);
    emailContent.subject = `גילינו משהו מעניין על האישיות שלך, ${user.firstName}`;
    await this.emailAdapter.send(recipient, emailContent);

    const templateSid = process.env.TWILIO_TEMPLATE_AI_INSIGHT_SID;
    if (templateSid) {
      await this.whatsappAdapter.send(recipient, templateSid, { '1': user.firstName, '2': personalitySummary.substring(0, 200) + '...' });
    }
  }
}

export const notificationService = new NotificationServiceImpl();

