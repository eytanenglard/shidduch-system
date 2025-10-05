// src/lib/engagement/adapters/whatsapp.adapter.ts
import twilio from 'twilio';
import { RecipientInfo } from './email.adapter';

export class WhatsAppAdapter {
  private client: twilio.Twilio | null;
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      this.client = null;
      console.warn('[WhatsAppAdapter] Twilio is not configured.');
    }
  }

  public canSend(recipient: RecipientInfo): boolean {
    return !!(this.client && recipient.phone && recipient.phone.startsWith('+'));
  }

  public async send(recipient: RecipientInfo, templateSid: string, contentVariables: Record<string, string>): Promise<boolean> {
    if (!this.canSend(recipient) || !recipient.phone) return false;

    try {
      await this.client!.messages.create({
        contentSid: templateSid,
        contentVariables: JSON.stringify(contentVariables),
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${recipient.phone}`,
      });
      console.log(`[WhatsAppAdapter] Message sent to ${recipient.phone}`);
      return true;
    } catch (error: any) {
      console.error(`[WhatsAppAdapter] Failed to send message to ${recipient.phone}:`, error.message);
      return false;
    }
  }
}