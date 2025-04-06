// src/app/components/matchmaker/suggestions/services/notification/adapters/WhatsAppAdapter.ts

import { NotificationAdapter, NotificationChannel, RecipientInfo, NotificationContent } from '../NotificationService';
import twilio from 'twilio';

export class WhatsAppAdapter implements NotificationAdapter {
  private static instance: WhatsAppAdapter;
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  private constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+12244810276';

    if (!accountSid || !authToken) {
      console.error('Missing Twilio configuration. WhatsApp notifications will not be available.');
      // We don't throw an error here to allow the system to continue working without WhatsApp
    } else {
      try {
        this.client = twilio(accountSid, authToken);
        console.log('WhatsApp adapter initialized with from number:', this.fromNumber);
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
        this.client = null;
      }
    }
  }

  public static getInstance(): WhatsAppAdapter {
    if (!WhatsAppAdapter.instance) {
      WhatsAppAdapter.instance = new WhatsAppAdapter();
    }
    return WhatsAppAdapter.instance;
  }

  public getChannelType(): NotificationChannel {
    return 'whatsapp';
  }

  public canSendTo(recipient: RecipientInfo): boolean {
    return (
      !!recipient.phone && 
      recipient.phone.length > 8 && 
      this.client !== null && 
      this.fromNumber !== ''
    );
  }

  private formatPhoneNumber(phone: string): string {
    // Clean everything except digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add international prefix for Israeli numbers if needed
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1);
    }
    
    // Remove any plus prefix (we'll add it in the "whatsapp:" format)
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  }
  
  public async send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean> {
    console.log('WhatsApp adapter - attempting to send message', {
      recipientPhone: recipient.phone,
      fromNumber: this.fromNumber,
      hasClient: !!this.client
    });
    
    if (!this.client) {
      console.error('WhatsApp client not initialized');
      return false;
    }
  
    if (!recipient.phone) {
      console.error('Recipient phone number is missing');
      return false;
    }
  
    try {
      // Ensure phone number is in the correct format
      const toNumber = this.formatPhoneNumber(recipient.phone);
      
      // The fromNumber must be formatted exactly like this for WhatsApp
      const fromWhatsApp = `whatsapp:${this.fromNumber.startsWith('+') ? this.fromNumber : '+' + this.fromNumber}`;
      
      console.log(`Sending WhatsApp template message from: ${fromWhatsApp} to: whatsapp:${toNumber}`);
      
      // Using type assertion instead of MediaParams
      const message = await this.client.messages.create({
        from: fromWhatsApp,
        to: `whatsapp:${toNumber}`,
        // Use the approved template
        templateId: 'match_suggestion_notification',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: recipient.name },                      // {{1}} - Name
              { type: 'text', text: content.subject || 'שדכן המערכת' },    // {{2}} - Matchmaker name
              { type: 'text', text: content.body.split('\n').pop() || '' } // {{3}} - Link
            ]
          }
        ]
      } as any); // Use type assertion to avoid TypeScript errors
  
      console.log('WhatsApp template message sent successfully:', {
        messageId: message.sid,
        status: message.status,
        to: toNumber
      });
  
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        recipient: recipient.phone,
        subject: content.subject
      });
      return false;
    }
  }
}

export const whatsAppAdapter = WhatsAppAdapter.getInstance();