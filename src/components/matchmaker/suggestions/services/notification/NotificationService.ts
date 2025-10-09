// src/components/matchmaker/suggestions/services/notification/NotificationService.ts

import { MatchSuggestionStatus } from '@prisma/client';
import { SuggestionWithParties } from '../suggestions/StatusTransitionService';
import { EmailDictionary } from '@/types/dictionary'; // ייבוא הטיפוס המאוחד

// --- הגדרות טיפוסים פנימיות של השירות ---

export type RecipientInfo = {
  email: string;
  phone?: string;
  name: string;
};

export type NotificationContent = {
  subject: string;
  body: string;
  htmlBody?: string;
};

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationOptions = {
  channels: NotificationChannel[];
  notifyParties?: ('first' | 'second' | 'matchmaker')[];
  customMessage?: string;
};

export interface NotificationAdapter {
  canSendTo(recipient: RecipientInfo): boolean;
  send(recipient: RecipientInfo, content: NotificationContent): Promise<boolean>;
  getChannelType(): NotificationChannel;
}

// --- שירות ההודעות המלא והמשוכתב ---

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
    console.log(`Registered ${adapter.getChannelType()} adapter`);
  }

  public async sendNotification(
    recipient: RecipientInfo,
    content: NotificationContent,
    options: Pick<NotificationOptions, 'channels'>
  ): Promise<Record<NotificationChannel, boolean>> {
    const results: Record<NotificationChannel, boolean> = {} as any;

    for (const channel of options.channels) {
      const adapter = this.adapters.get(channel);
      if (adapter && adapter.canSendTo(recipient)) {
        try {
          console.log(`Sending ${channel} notification to ${recipient.name}`);
          results[channel] = await adapter.send(recipient, content);
          console.log(`${channel} notification sent successfully: ${results[channel]}`);
        } catch (error) {
          console.error(`Error sending notification via ${channel}:`, error);
          results[channel] = false;
        }
      } else {
        if (!adapter) console.warn(`No adapter registered for channel: ${channel}`);
        if (adapter && !adapter.canSendTo(recipient)) console.warn(`Cannot send to recipient via ${channel}: missing required info`);
        results[channel] = false;
      }
    }
    return results;
  }

  public async handleSuggestionStatusChange(
    suggestion: SuggestionWithParties,
    dictionary: EmailDictionary,
    options: Partial<NotificationOptions> = {}
  ): Promise<void> {
    console.log(`Processing notifications for suggestion ${suggestion.id} with status ${suggestion.status}`);
    
    // אנו עובדים עם תת-המילון של ההתראות
    const notificationDict = dictionary.notifications; 
    
    const contentGenerator = options.customMessage 
      ? this.getCustomMessageContent(options.customMessage, suggestion.id, notificationDict)
      : this.getSuggestionContentFromDict(suggestion, notificationDict);

    if (!contentGenerator) {
      console.log(`No template found for status ${suggestion.status} - skipping notification`);
      return;
    }
  
    const recipientsWithChannels = this.getRecipientsForSuggestion(suggestion);
  
    for (const { recipient, preferredChannels, partyType } of recipientsWithChannels) {
      if (options.notifyParties && !options.notifyParties.includes(partyType)) {
        console.log(`Skipping recipient ${recipient.name} (${partyType}) - not in notifyParties`, options.notifyParties);
        continue;
      }
      
      const personalizedContent = contentGenerator(partyType);
      
      const channelsToUse = options.channels || preferredChannels || ['email'];
      
      await this.sendNotification(
        recipient,
        personalizedContent,
        { channels: channelsToUse }
      );
    }
    console.log(`Finished processing notifications for suggestion ${suggestion.id}`);
  }

  private getSuggestionContentFromDict(
    suggestion: SuggestionWithParties,
    dictionary: EmailDictionary['notifications']
  ): ((partyType: 'first' | 'second' | 'matchmaker') => NotificationContent) | null {
      
    const status = suggestion.status;
    const template = dictionary.suggestionStatusChange[status];

    if (!template) {
      return null;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/suggestions/${suggestion.id}/review`;
    const dashboardUrl = `${baseUrl}/dashboard/suggestions/${suggestion.id}`;

    return (partyType: 'first' | 'second' | 'matchmaker'): NotificationContent => {
      let partyName = '';
      if(partyType === 'first') partyName = suggestion.firstParty.firstName;
      if(partyType === 'second') partyName = suggestion.secondParty.firstName;
      
      const replacements: Record<string, string> = {
        '{{partyName}}': partyName,
        '{{matchmakerName}}': suggestion.matchmaker.firstName,
        '{{reviewUrl}}': reviewUrl,
        '{{dashboardUrl}}': dashboardUrl,
      };

      const replacePlaceholders = (text: string) => text.replace(/{{partyName}}|{{matchmakerName}}|{{reviewUrl}}|{{dashboardUrl}}/g, (match) => replacements[match]);

      return {
        subject: replacePlaceholders(template.subject),
        body: replacePlaceholders(template.body),
        htmlBody: replacePlaceholders(template.htmlBody),
      };
    };
  }
  
  private getCustomMessageContent(
    customMessage: string,
    suggestionId: string,
    dictionary: EmailDictionary['notifications']
  ): (partyType: 'first' | 'second' | 'matchmaker') => NotificationContent {
    const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/suggestions/${suggestionId}/review`;
    return () => ({
        subject: dictionary.customMessage.subject,
        body: `${customMessage}\n\nלצפייה בפרטי ההצעה: ${reviewUrl}`,
        htmlBody: `<div dir="rtl"><p>${customMessage}</p><p>לצפייה בפרטי ההצעה: <a href="${reviewUrl}">לחץ כאן</a></p></div>`
    });
  }

  private getRecipientsForSuggestion(suggestion: SuggestionWithParties): Array<{
    recipient: RecipientInfo;
    preferredChannels: NotificationChannel[];
    partyType: 'first' | 'second' | 'matchmaker';
  }> {
    const recipients: Array<{ recipient: RecipientInfo; preferredChannels: NotificationChannel[]; partyType: 'first' | 'second' | 'matchmaker'}> = [];
    const { firstParty, secondParty, matchmaker } = suggestion;

    const party1 = {
      recipient: { email: firstParty.email, phone: firstParty.phone || undefined, name: `${firstParty.firstName} ${firstParty.lastName}`},
      preferredChannels: ['email', 'whatsapp'] as NotificationChannel[],
      partyType: 'first' as const,
    };
    const party2 = {
      recipient: { email: secondParty.email, phone: secondParty.phone || undefined, name: `${secondParty.firstName} ${secondParty.lastName}`},
      preferredChannels: ['email', 'whatsapp'] as NotificationChannel[],
      partyType: 'second' as const,
    };
    const mk = {
      recipient: { email: matchmaker.email, phone: matchmaker.phone || undefined, name: `${matchmaker.firstName} ${matchmaker.lastName}`},
      preferredChannels: ['email', 'whatsapp'] as NotificationChannel[],
      partyType: 'matchmaker' as const,
    };
    
    switch (suggestion.status) {
      case MatchSuggestionStatus.PENDING_FIRST_PARTY:
        recipients.push(party1);
        break;
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
      case MatchSuggestionStatus.THINKING_AFTER_DATE:
      case MatchSuggestionStatus.DATING:
      case MatchSuggestionStatus.EXPIRED:
        recipients.push(mk);
        break;
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        recipients.push(party2);
        break;
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
      case MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK:
        recipients.push(party1, party2);
        break;
      case MatchSuggestionStatus.ENGAGED:
      case MatchSuggestionStatus.MARRIED:
        recipients.push(party1, party2, mk);
        break;
      default:
        console.log(`No specific recipient rule for status ${suggestion.status}, defaulting to matchmaker.`);
        recipients.push(mk);
        break;
    }
    return recipients;
  }
}

export const notificationService = NotificationService.getInstance();