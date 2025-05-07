// lib/WhatsAppAdapter.ts
import {
  NotificationAdapter,
  NotificationChannel,
  RecipientInfo,
  NotificationContent as BaseNotificationContent
} from '../NotificationService'; // Assuming NotificationService.ts exists in the same directory
import twilio from 'twilio';
// Import the specific type for message creation options if available
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

// --- Define an extended NotificationContent interface ---
// This adds the optional adapter-specific data structure
interface NotificationContent extends BaseNotificationContent {
  _adapterSpecificData?: {
      contentSid?: string;
      contentVariables?: string; // Should be a JSON string
      // Add other potential adapter-specific fields here
  };
}
// --- End Interface Extension ---

// --- Type Guard for Twilio-like Errors ---
interface PotentialTwilioError {
  code?: number | string;
  message?: string;
  // Add other potential properties like 'status', 'moreInfo', etc. if needed
}

/**
* Type guard to check if an unknown error object might be a Twilio API error
* by checking for the presence of 'code' or 'message' properties.
* @param error The unknown value caught in a catch block.
* @returns True if the error object has properties common to Twilio errors, false otherwise.
*/
function isPotentialTwilioError(error: unknown): error is PotentialTwilioError {
  // Check if it's a non-null object and has either 'code' or 'message' property
  return typeof error === 'object' && error !== null && ('code' in error || 'message' in error);
}
// --- End Type Guard ---

// --- Helper: Logger (optional but recommended) ---
// Using Record<string, unknown> or object instead of any
const logger = {
info: (message: string, meta?: Record<string, unknown> | object) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', service: 'WhatsAppAdapter', message, ...(meta || {}) }));
},
warn: (message: string, meta?: Record<string, unknown> | object) => {
  console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', service: 'WhatsAppAdapter', message, ...(meta || {}) }));
},
error: (message: string, meta?: Record<string, unknown> | object) => {
  let logMeta = meta || {};
  // If the meta object itself is an Error, extract relevant info
  if (meta instanceof Error) {
      logMeta = { name: meta.name, message: meta.message, stack: meta.stack };
  } else if (isPotentialTwilioError(meta)) {
      // If it's potentially a Twilio error passed directly
      logMeta = { code: meta.code, message: meta.message, ...meta };
  }
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', service: 'WhatsAppAdapter', message, ...logMeta }));
},
};
// --- End Logger ---


export class WhatsAppAdapter implements NotificationAdapter {
// Singleton instance
private static instance: WhatsAppAdapter;
// Twilio client instance (typed)
private client: twilio.Twilio | null = null;
// Configured Twilio WhatsApp sender number
private fromNumber: string = '';

/**
 * Private constructor to enforce singleton pattern.
 * Initializes the Twilio client using environment variables.
 */
private constructor() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || ''; // Get number from env

  // Validate configuration
  if (!accountSid || !authToken || !this.fromNumber) {
    logger.error('Missing Twilio configuration details', {
        hasSid: !!accountSid,
        hasToken: !!authToken,
        hasWhatsAppNumber: !!this.fromNumber,
        detail: "WhatsApp notifications will be unavailable."
    });
    // Do not throw, allow graceful degradation if possible
  } else {
    try {
      // Initialize Twilio client
      this.client = twilio(accountSid, authToken);
      logger.info('Twilio client initialized successfully', { fromWhatsAppNumber: this.fromNumber });
    } catch (error: unknown) { // Catch as unknown
      logger.error('Failed to initialize Twilio client during constructor', { error });
      this.client = null; // Ensure client is null on initialization failure
    }
  }
}

/**
 * Gets the singleton instance of the WhatsAppAdapter.
 * @returns The WhatsAppAdapter instance.
 */
public static getInstance(): WhatsAppAdapter {
  if (!WhatsAppAdapter.instance) {
    WhatsAppAdapter.instance = new WhatsAppAdapter();
  }
  return WhatsAppAdapter.instance;
}

/**
 * Returns the channel type handled by this adapter.
 * @returns The notification channel type ('whatsapp').
 */
public getChannelType(): NotificationChannel {
  return 'whatsapp';
}

/**
 * Checks if this adapter is capable of sending a notification to the given recipient.
 * Requires a valid phone number, an initialized Twilio client, and a configured 'from' number.
 * @param recipient Information about the recipient.
 * @returns True if the adapter can send, false otherwise.
 */
public canSendTo(recipient: RecipientInfo): boolean {
  const hasValidPhone = !!recipient.phone && recipient.phone.length > 8; // Basic validation
  const isClientReady = this.client !== null;
  const hasFromNumber = this.fromNumber !== '';
  const canSend = hasValidPhone && isClientReady && hasFromNumber;

  if (!canSend) {
      let reason = 'Unknown';
      if (!hasValidPhone) reason = 'Invalid or missing phone number';
      else if (!isClientReady) reason = 'Twilio client not initialized';
      else if (!hasFromNumber) reason = 'Twilio "from" number not configured';
      logger.warn('Cannot send WhatsApp message due to configuration or recipient data', {
          reason: reason,
          recipientPhone: recipient.phone // Log phone for debugging
      });
  }
  return canSend;
}

/**
 * Formats a phone number into E.164 standard without the leading '+'.
 * Required for Twilio's `to` parameter when prefixed with `whatsapp:`.
 * Handles Israeli numbers starting with '0'.
 * Example: 0501234567 -> 972501234567
 * @param phone The phone number string to format.
 * @returns The formatted phone number string.
 */
private formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Prepend country code for Israeli numbers if '0' prefix exists
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  // Remove leading '+' if present (it's added later in the `whatsapp:` prefix)
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Sends a notification via WhatsApp using the Twilio API.
 * Prefers using template messages if configured via `_adapterSpecificData`.
 * Falls back to raw text messages otherwise (less reliable for business-initiated messages).
 * @param recipient Information about the recipient.
 * @param content The notification content, potentially including adapter-specific data.
 * @returns A promise that resolves to true if the message was successfully queued by Twilio, false otherwise.
 */
public async send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean> {
  logger.info('Attempting to send WhatsApp message', {
    recipientPhone: recipient.phone,
    fromNumber: this.fromNumber,
    hasClient: !!this.client,
    contentSid: content._adapterSpecificData?.contentSid,
    hasContentVariables: !!content._adapterSpecificData?.contentVariables,
  });

  // --- Pre-send Checks ---
  if (!this.client) {
    logger.error('Twilio client not initialized. Cannot send WhatsApp message.');
    return false;
  }
  if (!recipient.phone) {
    logger.error('Recipient phone number is missing. Cannot send WhatsApp message.');
    return false;
  }
  if (!this.fromNumber) {
      logger.error('Twilio "from" WhatsApp number is not configured. Cannot send message.');
      return false;
  }
  // --- End Pre-send Checks ---


  try {
    // --- Format Numbers ---
    const toNumberE164 = this.formatPhoneNumber(recipient.phone);
    // Ensure 'from' number has '+' prefix for the whatsapp: schema
    const fromWhatsAppFormatted = `whatsapp:${this.fromNumber.startsWith('+') ? this.fromNumber : '+' + this.fromNumber}`;
    // Ensure 'to' number has '+' prefix for the whatsapp: schema
    const toWhatsAppFormatted = `whatsapp:+${toNumberE164}`;

    logger.info(`Formatted numbers for sending via Twilio`, { from: fromWhatsAppFormatted, to: toWhatsAppFormatted });
    // --- End Format Numbers ---


    // --- Prepare Message Payload ---
    let messagePayload: MessageListInstanceCreateOptions;
    const adapterData = content._adapterSpecificData;

    if (adapterData?.contentSid && adapterData?.contentVariables) {
       // **Use Template Messaging**
       logger.info(`Preparing WhatsApp template message`, { contentSid: adapterData.contentSid });
       messagePayload = {
          from: fromWhatsAppFormatted,
          to: toWhatsAppFormatted,
          contentSid: adapterData.contentSid, // The approved template SID
          contentVariables: adapterData.contentVariables, // JSON string of variables {"1": "value1", "2": "value2"}
          // Optional: Specify Messaging Service SID if using one
          // messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
       };
    } else {
       // **Use Raw Text Messaging (Fallback)**
       // Note: This might fail if outside the 24-hour customer service window
       // or if WhatsApp/Twilio policies require templates for this type of message.
       const bodyText = content.body || content.subject || 'הודעה ממערכת השידוכים'; // Determine fallback content
       logger.warn(`Preparing raw text WhatsApp message (using fallback, might fail)`, { bodyLength: bodyText.length });
       messagePayload = {
          from: fromWhatsAppFormatted,
          to: toWhatsAppFormatted,
          body: bodyText, // The actual text message content
          // Optional: Specify Messaging Service SID if using one
          // messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
       };
    }
    // --- End Prepare Message Payload ---


    // --- Send Message via Twilio API ---
    logger.info("Sending message payload to Twilio API", { payload: messagePayload }); // Be cautious logging full payload in production if sensitive
    const message = await this.client.messages.create(messagePayload);
    // --- End Send Message ---


    // --- Log Success ---
    // The message status here is typically 'queued' or 'sending'. Delivery confirmation is asynchronous.
    logger.info('WhatsApp message request processed successfully by Twilio', {
      messageSid: message.sid,
      status: message.status,
      to: toWhatsAppFormatted,
      from: fromWhatsAppFormatted,
      price: message.price, // Log cost if available
      priceUnit: message.priceUnit,
      errorCode: message.errorCode, // Log if Twilio detected an error immediately
      errorMessage: message.errorMessage,
    });
    // We return true because Twilio accepted the request. Delivery is not guaranteed at this point.
    return true;
    // --- End Log Success ---

  } catch (error: unknown) { // Catch error as unknown
    // --- Handle Errors ---
    let errorMessage = 'Unknown error occurred while sending WhatsApp message.';
    let errorCode: number | string | undefined;

    // Use the type guard to safely access potential error properties
    if (isPotentialTwilioError(error)) {
        errorCode = error.code;
        errorMessage = error.message || errorMessage;
    } else if (error instanceof Error) {
        // Standard JavaScript Error
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        // Simple string error
        errorMessage = error;
    }

    // Log detailed error information
    logger.error('Failed to send WhatsApp message via Twilio', {
      errorCode,
      errorMessage,
      recipient: `whatsapp:+${this.formatPhoneNumber(recipient.phone)}`, // Log formatted number for debugging
      from: `whatsapp:${this.fromNumber.startsWith('+') ? this.fromNumber : '+' + this.fromNumber}`,
      // Pass the original error object for full details in structured logs
      errorDetails: error
    });

    // Specific handling/logging for common, informative errors
    if (errorCode === 63018 || errorCode === 21614) { // Common codes for non-WhatsApp/incapable numbers
         logger.error(`Recipient number appears invalid or not registered on WhatsApp.`, { phone: recipient.phone, errorCode });
         // Consider adding logic here: maybe mark the user's number as invalid? Notify admin?
    } else if (errorCode === 63016) { // Common code for failing outside the 24-hour window without a template
          logger.warn(`Failed to send non-template message outside 24-hour window.`, { phone: recipient.phone, errorCode });
    }

    return false; // Indicate that sending failed
    // --- End Handle Errors ---
  }
}
}

// Export the singleton instance for use in other parts of the application
export const whatsAppAdapter = WhatsAppAdapter.getInstance();