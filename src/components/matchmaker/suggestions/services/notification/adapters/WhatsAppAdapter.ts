// lib/WhatsAppAdapter.ts
import {
  NotificationAdapter,
  NotificationChannel,
  RecipientInfo,
  NotificationContent as BaseNotificationContent
} from './NotificationService';
import twilio from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

interface NotificationContent extends BaseNotificationContent {
  _adapterSpecificData?: {
      contentSid?: string;
      contentVariables?: string;
  };
}

interface PotentialTwilioError {
  code?: number | string;
  message?: string;
}

function isPotentialTwilioError(error: unknown): error is PotentialTwilioError {
  return typeof error === 'object' && error !== null && ('code' in error || 'message' in error);
}

const logger = {
  info: (message: string, meta?: Record<string, unknown> | object) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', service: 'WhatsAppAdapter', message, ...(meta || {}) }));
  },
  warn: (message: string, meta?: Record<string, unknown> | object) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', service: 'WhatsAppAdapter', message, ...(meta || {}) }));
  },
  error: (message: string, meta?: Record<string, unknown> | object) => {
    let logMeta = meta || {};
    if (meta instanceof Error) {
        logMeta = { name: meta.name, message: meta.message, stack: meta.stack };
    } else if (isPotentialTwilioError(meta)) {
        logMeta = { code: meta.code, message: meta.message, ...meta };
    }
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', service: 'WhatsAppAdapter', message, ...logMeta }));
  },
};


export class WhatsAppAdapter implements NotificationAdapter {
  private static instance: WhatsAppAdapter;
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  private constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      logger.error('Missing Twilio configuration details', {
          hasSid: !!accountSid,
          hasToken: !!authToken,
          hasWhatsAppNumber: !!this.fromNumber,
          detail: "WhatsApp notifications will be unavailable."
      });
    } else if (!this.fromNumber.startsWith('+')) {
      // --- NEW VALIDATION ---
      logger.error('Invalid TWILIO_WHATSAPP_NUMBER format in .env. It must start with a "+".', {
          providedNumber: this.fromNumber
      });
      this.fromNumber = ''; // Invalidate the number to prevent sending
      // --- END NEW VALIDATION ---
    } else {
      try {
        this.client = twilio(accountSid, authToken);
        logger.info('Twilio client initialized successfully', { fromWhatsAppNumber: this.fromNumber });
      } catch (error: unknown) {
        logger.error('Failed to initialize Twilio client during constructor', { error });
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
    // --- UPDATED VALIDATION ---
    // Using a more robust check for E.164 format
    const hasValidPhone = !!recipient.phone && /^\+[1-9]\d{1,14}$/.test(recipient.phone);
    // --- END UPDATED VALIDATION ---
    const isClientReady = this.client !== null;
    const hasFromNumber = this.fromNumber !== '';
    const canSend = hasValidPhone && isClientReady && hasFromNumber;

    if (!canSend) {
        let reason = 'Unknown';
        if (!hasValidPhone) reason = 'Invalid or missing phone number (must be in E.164 format, e.g., +14155552671)';
        else if (!isClientReady) reason = 'Twilio client not initialized';
        else if (!hasFromNumber) reason = 'Twilio "from" number not configured or invalid';
        logger.warn('Cannot send WhatsApp message due to configuration or recipient data', {
            reason: reason,
            recipientPhone: recipient.phone
        });
    }
    return canSend;
  }

  // --- REMOVED `formatPhoneNumber` method ---
  // This method is no longer needed as we expect a valid E.164 number directly.

  public async send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean> {
    logger.info('Attempting to send WhatsApp message', {
      recipientPhone: recipient.phone,
      fromNumber: this.fromNumber,
      hasClient: !!this.client,
      contentSid: content._adapterSpecificData?.contentSid,
      hasContentVariables: !!content._adapterSpecificData?.contentVariables,
    });

    if (!this.client || !this.fromNumber) {
      logger.error('Pre-send check failed: Twilio client or fromNumber is not configured.');
      return false;
    }
    
    // --- SIMPLIFIED VALIDATION ---
    if (!recipient.phone || !recipient.phone.startsWith('+')) {
      logger.error('Recipient phone number is missing or not in E.164 format.', { phone: recipient.phone });
      return false;
    }
    // --- END SIMPLIFIED VALIDATION ---

    try {
      // --- SIMPLIFIED NUMBER FORMATTING ---
      const fromWhatsAppFormatted = `whatsapp:${this.fromNumber}`;
      const toWhatsAppFormatted = `whatsapp:${recipient.phone}`; // Use the number directly
      // --- END SIMPLIFIED NUMBER FORMATTING ---

      logger.info(`Formatted numbers for sending via Twilio`, { from: fromWhatsAppFormatted, to: toWhatsAppFormatted });

      let messagePayload: MessageListInstanceCreateOptions;
      const adapterData = content._adapterSpecificData;

      if (adapterData?.contentSid && adapterData?.contentVariables) {
         logger.info(`Preparing WhatsApp template message`, { contentSid: adapterData.contentSid });
         messagePayload = {
            from: fromWhatsAppFormatted,
            to: toWhatsAppFormatted,
            contentSid: adapterData.contentSid,
            contentVariables: adapterData.contentVariables,
         };
      } else {
         const bodyText = content.body || content.subject || 'הודעה ממערכת השידוכים';
         logger.warn(`Preparing raw text WhatsApp message (using fallback, might fail)`, { bodyLength: bodyText.length });
         messagePayload = {
            from: fromWhatsAppFormatted,
            to: toWhatsAppFormatted,
            body: bodyText,
         };
      }
      
      logger.info("Sending message payload to Twilio API", { payload: {from: messagePayload.from, to: messagePayload.to, contentSid: messagePayload.contentSid} }); // Log safer data
      const message = await this.client.messages.create(messagePayload);
      
      logger.info('WhatsApp message request processed successfully by Twilio', {
        messageSid: message.sid,
        status: message.status,
        to: toWhatsAppFormatted,
        from: fromWhatsAppFormatted,
        price: message.price,
        priceUnit: message.priceUnit,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      });
      return true;

    } catch (error: unknown) {
      let errorMessage = 'Unknown error occurred while sending WhatsApp message.';
      let errorCode: number | string | undefined;

      if (isPotentialTwilioError(error)) {
          errorCode = error.code;
          errorMessage = error.message || errorMessage;
      } else if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === 'string') {
          errorMessage = error;
      }

      logger.error('Failed to send WhatsApp message via Twilio', {
        errorCode,
        errorMessage,
        recipient: recipient.phone,
        from: this.fromNumber,
        errorDetails: error
      });

      if (errorCode === 63018 || errorCode === 21614) {
           logger.error(`Recipient number appears invalid or not registered on WhatsApp.`, { phone: recipient.phone, errorCode });
      } else if (errorCode === 63016) {
            logger.warn(`Failed to send non-template message outside 24-hour window.`, { phone: recipient.phone, errorCode });
      }

      return false;
    }
  }
}

export const whatsAppAdapter = WhatsAppAdapter.getInstance();