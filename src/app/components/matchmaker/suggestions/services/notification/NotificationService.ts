// src/app/components/matchmaker/suggestions/services/notification/NotificationService.ts

import { MatchSuggestionStatus } from '@prisma/client';
import { SuggestionWithParties } from '../suggestions/StatusTransitionService';

export type RecipientInfo = {
  email: string;
  phone?: string; // Phone number with international prefix, e.g.: +972501234567
  name: string;
};

export type NotificationContent = {
  subject: string;
  body: string;
  htmlBody?: string; // HTML version for email
};

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationOptions = {
  channels: NotificationChannel[];
  priority?: 'high' | 'normal' | 'low';
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
  metadata?: Record<string, unknown>;
};

export interface NotificationAdapter {
  canSendTo(recipient: RecipientInfo): boolean;
  send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean>;
  getChannelType(): NotificationChannel;
}

export class NotificationService {
  private static instance: NotificationService;
  private adapters: Map<NotificationChannel, NotificationAdapter> = new Map();

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public registerAdapter(adapter: NotificationAdapter): void {
    this.adapters.set(adapter.getChannelType(), adapter);
  }

  public async sendNotification(
    recipient: RecipientInfo,
    content: NotificationContent,
    options: NotificationOptions
  ): Promise<Record<NotificationChannel, boolean>> {
    const results: Record<NotificationChannel, boolean> = {} as Record<NotificationChannel, boolean>;

    for (const channel of options.channels) {
      const adapter = this.adapters.get(channel);
      if (!adapter) {
        console.warn(`No adapter registered for channel: ${channel}`);
        results[channel] = false;
        continue;
      }

      if (!adapter.canSendTo(recipient)) {
        console.warn(`Cannot send to recipient via ${channel}: missing required info`);
        results[channel] = false;
        continue;
      }

      try {
        results[channel] = await adapter.send(recipient, content);
      } catch (error) {
        console.error(`Error sending notification via ${channel}:`, error);
        results[channel] = false;
      }
    }

    return results;
  }

  // Dedicated method for handling suggestion-related notifications
  public async handleSuggestionStatusChange(
    suggestion: SuggestionWithParties,
    options: Partial<NotificationOptions> = {}
  ): Promise<void> {
    const templateContent = this.getSuggestionTemplate(suggestion);
    if (!templateContent) return;

    const recipientsWithChannels = this.getRecipientsForSuggestion(suggestion);

    for (const { recipient, preferredChannels } of recipientsWithChannels) {
      const channelsToUse = options.channels || preferredChannels || ['email'];
      
      await this.sendNotification(
        recipient,
        templateContent,
        { ...options, channels: channelsToUse }
      );
    }
  }

  private getSuggestionTemplate(suggestion: SuggestionWithParties): NotificationContent | null {
    // Template similar to what you have in EmailService
    // but adapted for multi-channel (separating HTML from plain text)
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    switch (suggestion.status) {
      case MatchSuggestionStatus.PENDING_FIRST_PARTY:
        return {
          subject: 'הצעת שידוך חדשה עבורך',
          body: `שלום ${suggestion.firstParty.firstName},\n\n${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.\n\nלצפייה בפרטי ההצעה ומענה: ${baseUrl}/suggestions/${suggestion.id}/review\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.firstParty.firstName},</h2><p>${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.</p><p>לצפייה בפרטי ההצעה ומענה, אנא היכנס/י לקישור הבא:</p><p><a href="${baseUrl}/suggestions/${suggestion.id}/review">לצפייה בהצעה</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };
      
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
        return {
          subject: 'עדכון סטטוס - הצעת שידוך אושרה על ידי הצד הראשון',
          body: `שלום ${suggestion.matchmaker.firstName},\n\n${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את הצעת השידוך.\n\nההצעה תועבר כעת באופן אוטומטי לצד השני.\n\nלצפייה בפרטים נוספים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את הצעת השידוך.</p><p>ההצעה תועבר כעת באופן אוטומטי לצד השני.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים נוספים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        return {
          subject: 'עדכון סטטוס - הצעת שידוך נדחתה',
          body: `שלום ${suggestion.matchmaker.firstName},\n\n${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} דחה/תה את הצעת השידוך.\n\nלצפייה בפרטים נוספים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} דחה/תה את הצעת השידוך.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים נוספים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        return {
          subject: 'הצעת שידוך חדשה עבורך',
          body: `שלום ${suggestion.secondParty.firstName},\n\n${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.\n\nהצד הראשון כבר אישר את ההצעה.\n\nלצפייה בפרטי ההצעה ומענה: ${baseUrl}/suggestions/${suggestion.id}/review\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.secondParty.firstName},</h2><p>${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.</p><p>הצד הראשון כבר אישר את ההצעה.</p><p><a href="${baseUrl}/suggestions/${suggestion.id}/review">לצפייה בפרטי ההצעה ומענה</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
        return {
          subject: 'עדכון סטטוס - הצעת שידוך אושרה על ידי הצד השני',
          body: `שלום ${suggestion.matchmaker.firstName},\n\n${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} אישר/ה את הצעת השידוך.\n\nשני הצדדים אישרו את ההצעה. ניתן כעת לשתף פרטי קשר.\n\nלצפייה בפרטים נוספים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} אישר/ה את הצעת השידוך.</p><p>שני הצדדים אישרו את ההצעה. ניתן כעת לשתף פרטי קשר.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים נוספים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        return {
          subject: 'עדכון סטטוס - הצעת שידוך נדחתה',
          body: `שלום ${suggestion.matchmaker.firstName},\n\n${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} דחה/תה את הצעת השידוך.\n\nלצפייה בפרטים נוספים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} דחה/תה את הצעת השידוך.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים נוספים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };
    
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
        // Prepare contact details with multi-line support
        const firstPartyDetails = this.formatUserDetails(suggestion.firstParty);
        const secondPartyDetails = this.formatUserDetails(suggestion.secondParty);
        
        return {
          subject: 'פרטי קשר להצעת השידוך',
          body: `ברכות! שני הצדדים אישרו את הצעת השידוך.\n\nפרטי הקשר של הצד הראשון:\n${firstPartyDetails}\n\nפרטי הקשר של הצד השני:\n${secondPartyDetails}\n\nאנא צרו קשר בהקדם לתיאום פגישה ראשונה.\n\nבהצלחה!`,
          htmlBody: `<div dir="rtl"><h2>ברכות! שני הצדדים אישרו את הצעת השידוך.</h2><p>פרטי הקשר של הצד הראשון:</p><pre>${firstPartyDetails}</pre><p>פרטי הקשר של הצד השני:</p><pre>${secondPartyDetails}</pre><p>אנא צרו קשר בהקדם לתיאום פגישה ראשונה.</p><p>בהצלחה!</p></div>`
        };
      
      case MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK:
        return {
          subject: 'בקשה למשוב על הפגישה הראשונה',
          body: `שלום,\n\nנשמח לקבל את המשוב שלך על הפגישה הראשונה.\n\nלשליחת המשוב: ${baseUrl}/suggestions/${suggestion.id}/feedback\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום,</h2><p>נשמח לקבל את המשוב שלך על הפגישה הראשונה.</p><p><a href="${baseUrl}/suggestions/${suggestion.id}/feedback">לשליחת המשוב</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.THINKING_AFTER_DATE:
        return {
          subject: 'בקשת זמן למחשבה לאחר הפגישה',
          body: `שלום ${suggestion.matchmaker.firstName},\n\nאחד הצדדים ביקש זמן למחשבה לאחר הפגישה.\n\nלצפייה בפרטים נוספים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>אחד הצדדים ביקש זמן למחשבה לאחר הפגישה.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים נוספים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.DATING:
        return {
          subject: 'עדכון סטטוס - בתהליך היכרות',
          body: `שלום ${suggestion.matchmaker.firstName},\n\nהזוג נמצא בתהליך היכרות.\n\nלצפייה בפרטים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>הזוג נמצא בתהליך היכרות.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.ENGAGED:
        return {
          subject: 'מזל טוב! - אירוסין',
          body: `מזל טוב ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName}!\n\nאנו שמחים לשמוע על האירוסין ומאחלים לכם המון הצלחה בהמשך הדרך.\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>מזל טוב ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName}!</h2><p>אנו שמחים לשמוע על האירוסין ומאחלים לכם המון הצלחה בהמשך הדרך.</p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.MARRIED:
        return {
          subject: 'מזל טוב! - חתונה',
          body: `מזל טוב ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName}!\n\nאנו שמחים לשמוע על החתונה ומאחלים לכם חיים מאושרים יחד.\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>מזל טוב ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName}!</h2><p>אנו שמחים לשמוע על החתונה ומאחלים לכם חיים מאושרים יחד.</p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      case MatchSuggestionStatus.EXPIRED:
        return {
          subject: 'הצעת השידוך פגה',
          body: `שלום ${suggestion.matchmaker.firstName},\n\nהצעת השידוך פגה עקב חוסר מענה במועד.\n\nלצפייה בפרטים: ${baseUrl}/dashboard/suggestions/${suggestion.id}\n\nבברכה,\nצוות המערכת`,
          htmlBody: `<div dir="rtl"><h2>שלום ${suggestion.matchmaker.firstName},</h2><p>הצעת השידוך פגה עקב חוסר מענה במועד.</p><p><a href="${baseUrl}/dashboard/suggestions/${suggestion.id}">לצפייה בפרטים</a></p><p>בברכה,<br>צוות המערכת</p></div>`
        };

      default:
        return null;
    }
  }

  private getRecipientsForSuggestion(suggestion: SuggestionWithParties): Array<{
    recipient: RecipientInfo;
    preferredChannels: NotificationChannel[];
  }> {
    const recipients: Array<{
      recipient: RecipientInfo;
      preferredChannels: NotificationChannel[];
    }> = [];

    // Logic to determine recipients based on suggestion status
    // Similar to what's in getRecipientsByStatus in EmailService
    
    switch (suggestion.status) {
      case MatchSuggestionStatus.DRAFT:
        recipients.push({
          recipient: {
            email: suggestion.matchmaker.email,
            phone: suggestion.matchmaker.phone || undefined,
            name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          },
          preferredChannels: ['email'] // Email only for drafts
        });
        break;
      
      case MatchSuggestionStatus.PENDING_FIRST_PARTY:
        recipients.push({
          recipient: {
            email: suggestion.firstParty.email,
            phone: suggestion.firstParty.phone || undefined,
            name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
          },
          preferredChannels: ['email', 'whatsapp'] // Email and WhatsApp for candidates
        });
        break;
      
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        recipients.push({
          recipient: {
            email: suggestion.matchmaker.email,
            phone: suggestion.matchmaker.phone || undefined,
            name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          },
          preferredChannels: ['email', 'whatsapp'] // Email and WhatsApp for matchmaker
        });
        break;
      
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        recipients.push({
          recipient: {
            email: suggestion.secondParty.email,
            phone: suggestion.secondParty.phone || undefined,
            name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
          },
          preferredChannels: ['email', 'whatsapp'] // Email and WhatsApp for candidates
        });
        break;
      
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        recipients.push({
          recipient: {
            email: suggestion.matchmaker.email,
            phone: suggestion.matchmaker.phone || undefined,
            name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          },
          preferredChannels: ['email', 'whatsapp'] // Email and WhatsApp for matchmaker
        });
        break;
      
      case MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL:
        recipients.push({
          recipient: {
            email: suggestion.matchmaker.email,
            phone: suggestion.matchmaker.phone || undefined,
            name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          },
          preferredChannels: ['email', 'whatsapp'] // Email and WhatsApp for matchmaker
        });
        break;
      
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
        // Send to both parties and matchmaker
        recipients.push(
          {
            recipient: {
              email: suggestion.firstParty.email,
              phone: suggestion.firstParty.phone || undefined,
              name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          },
          {
            recipient: {
              email: suggestion.secondParty.email,
              phone: suggestion.secondParty.phone || undefined,
              name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          },
          {
            recipient: {
              email: suggestion.matchmaker.email,
              phone: suggestion.matchmaker.phone || undefined,
              name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
            },
            preferredChannels: ['email']
          }
        );
        break;
      
      case MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK:
        // Send to both parties
        recipients.push(
          {
            recipient: {
              email: suggestion.firstParty.email,
              phone: suggestion.firstParty.phone || undefined,
              name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          },
          {
            recipient: {
              email: suggestion.secondParty.email,
              phone: suggestion.secondParty.phone || undefined,
              name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          }
        );
        break;
      
      case MatchSuggestionStatus.ENGAGED:
      case MatchSuggestionStatus.MARRIED:
        // Send to both parties and matchmaker
        recipients.push(
          {
            recipient: {
              email: suggestion.firstParty.email,
              phone: suggestion.firstParty.phone || undefined,
              name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          },
          {
            recipient: {
              email: suggestion.secondParty.email,
              phone: suggestion.secondParty.phone || undefined,
              name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          },
          {
            recipient: {
              email: suggestion.matchmaker.email,
              phone: suggestion.matchmaker.phone || undefined,
              name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
            },
            preferredChannels: ['email', 'whatsapp']
          }
        );
        break;

      default:
        // Default: send to matchmaker only
        recipients.push({
          recipient: {
            email: suggestion.matchmaker.email,
            phone: suggestion.matchmaker.phone || undefined,
            name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          },
          preferredChannels: ['email']
        });
        break;
    }

    return recipients;
  }

  // Helper function to format contact details
  private formatUserDetails(user: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone?: string | null 
  }): string {
    const details = [
      `שם: ${user.firstName} ${user.lastName}`,
      `אימייל: ${user.email}`,
    ];

    if (user.phone) {
      details.push(`טלפון: ${user.phone}`);
    }

    return details.join('\n');
  }
}

export const notificationService = NotificationService.getInstance();