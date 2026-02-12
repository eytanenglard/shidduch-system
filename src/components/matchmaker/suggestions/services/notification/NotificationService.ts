// src/components/matchmaker/suggestions/services/notification/NotificationService.ts

import { MatchSuggestionStatus } from '@prisma/client';
import { SuggestionWithParties } from '../suggestions/StatusTransitionService';
import { EmailDictionary } from '@/types/dictionary'; // ייבוא הטיפוס המאוחד

export type LanguagePreferences = {
  firstParty: 'he' | 'en';
  secondParty: 'he' | 'en';
  matchmaker: 'he' | 'en';
};

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

  /**
   * פונקציה ראשית: טיפול בשינוי סטטוס של הצעת שידוך.
   * מזהה אוטומטית אם מדובר בהצעה חדשה (PENDING_FIRST/SECOND_PARTY)
   * ושולחת "הזמנה אישית" במקום הודעה טכנית יבשה.
   */
  public async handleSuggestionStatusChange(
    suggestion: SuggestionWithParties,
    dictionaries: { he: EmailDictionary; en: EmailDictionary },
    options: Partial<NotificationOptions> = {},
    languagePrefs: LanguagePreferences = { firstParty: 'he', secondParty: 'he', matchmaker: 'he' }
  ): Promise<void> {
    console.log(`Processing notifications for suggestion ${suggestion.id}, status: ${suggestion.status}`);
    
    // קבלת הנמענים לפי הסטטוס הנוכחי
    const recipientsWithChannels = this.getRecipientsForSuggestion(suggestion);
  
    for (const { recipient, preferredChannels, partyType } of recipientsWithChannels) {
      // דילוג אם הנמען לא ברשימת התפוצה
      if (options.notifyParties && !options.notifyParties.includes(partyType)) {
        continue;
      }

      // 1. בחירת השפה עבור הנמען הספציפי
      let targetLocale: 'he' | 'en' = 'he';
      if (partyType === 'first') targetLocale = languagePrefs.firstParty;
      if (partyType === 'second') targetLocale = languagePrefs.secondParty;
      if (partyType === 'matchmaker') targetLocale = languagePrefs.matchmaker;

      // 2. שליפת המילון המתאים
      const fullDictionary = dictionaries[targetLocale];
      const notificationsDictionary = fullDictionary.notifications;

      // 3. הכרעה: איזה סוג תוכן לייצר
      //    ← זה השינוי המרכזי: לסטטוסים של הצעה חדשה למועמד, נשלח "הזמנה אישית"
      const isNewSuggestionForCandidate = 
        (suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY || 
         suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) &&
        partyType !== 'matchmaker';

      let contentGenerator: ((partyType: 'first' | 'second' | 'matchmaker') => NotificationContent) | null;

      if (isNewSuggestionForCandidate) {
        // ====== מוד "הזמנה אישית" – סקרנות ללא פרטים ======
        console.log(`  📨 Using INVITATION mode for ${partyType} party (${recipient.name}) in ${targetLocale}`);
        contentGenerator = this.buildSuggestionInvitationContent(
          suggestion,
          fullDictionary,
           targetLocale,
          partyType as 'first' | 'second'
        );
      } else if (options.customMessage) {
        // ====== הודעה מותאמת אישית מהשדכן ======
        contentGenerator = this.getCustomMessageContent(
          options.customMessage,
          suggestion.id,
          notificationsDictionary
        );
      } else {
        // ====== מוד רגיל – לסטטוסים אחרים (אישור, דחייה, וכו') ======
        contentGenerator = this.getSuggestionContentFromDict(
          suggestion,
          notificationsDictionary
        );
      }

      if (!contentGenerator) {
        console.log(`No template found for status ${suggestion.status} in ${targetLocale} - skipping`);
        continue;
      }
      
      const personalizedContent = contentGenerator(partyType);
      
      // 4. הוספת סימון כיווניות (RTL/LTR) ל-HTML בהתאם לשפה
      if (personalizedContent.htmlBody && targetLocale === 'he') {
         personalizedContent.htmlBody = `<div dir="rtl" style="text-align: right;">${personalizedContent.htmlBody}</div>`;
      } else if (personalizedContent.htmlBody && targetLocale === 'en') {
         personalizedContent.htmlBody = `<div dir="ltr" style="text-align: left;">${personalizedContent.htmlBody}</div>`;
      }

      const channelsToUse = options.channels || preferredChannels || ['email'];
      
      // 5. שליחה בפועל
      await this.sendNotification(
        recipient,
        personalizedContent,
        { channels: channelsToUse }
      );
    }
  }

  // ============================================================================
  // NEW: בניית תוכן "הזמנה אישית" – ללא פרטים, עם סקרנות ורגש
  // ============================================================================

  /**
   * יוצרת תוכן "הזמנה אישית" עבור מועמד שמקבל הצעת שידוך חדשה.
   * במקום לחשוף פרטים (שם, גיל, עיסוק) – יוצרת סקרנות ומושכת לאפליקציה.
   * ההערה האישית של השדכן (firstPartyNotes / secondPartyNotes) היא ה-game changer.
   */
  private buildSuggestionInvitationContent(
    suggestion: SuggestionWithParties,
    dictionary: EmailDictionary,
    locale: 'he' | 'en', 
    partyType: 'first' | 'second'
  ): (pt: 'first' | 'second' | 'matchmaker') => NotificationContent {
    
    // שליפת סעיף ההזמנה מהמילון
    const dict = dictionary.suggestionInvitation;
    if (!dict) {
      console.warn('suggestionInvitation dictionary section not found, falling back to regular notification');
      return this.getSuggestionContentFromDict(suggestion, dictionary.notifications)!;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/matches`;

    // שליפת ההערה האישית של השדכן לצד הרלוונטי
    const matchmakerNote = partyType === 'first' 
      ? suggestion.firstPartyNotes 
      : suggestion.secondPartyNotes;

    // שם הנמען
    const partyName = partyType === 'first' 
      ? suggestion.firstParty.firstName 
      : suggestion.secondParty.firstName;

    // שם מלא של השדכן
    const matchmakerFullName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;

    // חישוב דדליין אם קיים
    let deadlineText: string | undefined;
    if (suggestion.decisionDeadline) {
      const deadline = new Date(suggestion.decisionDeadline);
const localeString = locale === 'he' ? 'he-IL' : 'en-US';
      const formatted = deadline.toLocaleDateString(localeString, { 
        day: 'numeric', 
        month: 'long' 
      });
      deadlineText = `${dict.deadlinePrefix} ${formatted}`;
    }

    // ברכה אישית
const isHebrew = locale === 'he';
    const greeting = isHebrew ? `שלום ${partyName},` : `Hello ${partyName},`;

    return (): NotificationContent => {
      // ============================================
      // Subject – כותרת המייל (סקרנית, לא חושפת פרטים)
      // ============================================
      const subject = dict.subject;

      // ============================================
      // Body – טקסט פשוט עבור WhatsApp / SMS (טיזר קצר וסקרני)
      // ============================================
      const whatsappLines: string[] = [
        `${greeting}`,
        '',
      ];

      if (matchmakerNote) {
        // אם יש הערה אישית מהשדכן – זה הדבר הכי חשוב
        whatsappLines.push(`✍️ ${dict.personalNoteLabel}:`);
        whatsappLines.push(`"${matchmakerNote.length > 120 ? matchmakerNote.substring(0, 120) + '...' : matchmakerNote}"`);
        whatsappLines.push('');
      }

      whatsappLines.push(`🎁 ${dict.mysteryTitle}`);
      whatsappLines.push('');
      whatsappLines.push(`👉 ${dict.ctaButton}: ${reviewUrl}`);

      if (deadlineText) {
        whatsappLines.push('');
        whatsappLines.push(`⏳ ${deadlineText}`);
      }

      whatsappLines.push('');
      whatsappLines.push(`${dict.signatureText}`);
      whatsappLines.push(`${matchmakerFullName}, ${dict.signatureRole}`);

      const body = whatsappLines.join('\n');

      // ============================================
      // HTML Body – מייל עשיר ויוקרתי (ההזמנה המלאה)
      // ============================================
      const htmlBody = `
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); color: #ffffff; padding: 45px 35px; text-align: center; position: relative; overflow: hidden; border-radius: 20px 20px 0 0;">
          <div style="position: relative; z-index: 1;">
            <span style="font-size: 36px; display: block; margin-bottom: 15px;">💌</span>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fbbf24; letter-spacing: -0.5px;">${dict.title}</h1>
            <p style="margin-top: 12px; font-size: 16px; color: #cbd5e1; font-weight: 400;">${dict.subtitle}</p>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 40px 35px; font-size: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: ${isHebrew ? 'rtl' : 'ltr'}; text-align: ${isHebrew ? 'right' : 'left'};">

          <p style="font-size: 22px; color: #1e293b; margin-bottom: 20px; font-weight: 600;">${greeting}</p>

          <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">${dict.intro}</p>

          ${matchmakerNote ? `
          <!-- הערה אישית מהשדכן – הקטע הכי חשוב -->
          <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-${isHebrew ? 'right' : 'left'}: 5px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; position: relative;">
            <span style="position: absolute; top: -14px; ${isHebrew ? 'right' : 'left'}: 20px; font-size: 26px; background: #fffbeb; padding: 0 8px; border-radius: 50%;">✍️</span>
            <p style="color: #92400e; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">${dict.personalNoteLabel}</p>
            <p style="color: #78350f; font-size: 16px; line-height: 1.8; font-style: italic; margin: 0;">"${matchmakerNote}"</p>
          </div>
          ` : ''}

          <!-- כרטיס הסקרנות -->
          <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #bae6fd; border-radius: 16px; padding: 35px 30px; margin: 30px 0; text-align: center;">
            <div style="font-size: 52px; margin-bottom: 18px;">🎁</div>
            <p style="font-size: 20px; color: #0c4a6e; font-weight: 700; margin: 0 0 10px 0;">${dict.mysteryTitle}</p>
            <p style="font-size: 15px; color: #0369a1; line-height: 1.6; margin: 0;">${dict.mysteryText}</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0 20px;">
            <a href="${reviewUrl}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b !important; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 18px; letter-spacing: 0.5px; box-shadow: 0 8px 25px rgba(245, 158, 11, 0.35);">
              ${dict.ctaButton}
            </a>
            <p style="margin-top: 14px; font-size: 13px; color: #9ca3af;">${dict.ctaHint}</p>
          </div>

          ${deadlineText ? `
          <!-- דדליין עדין -->
          <div style="text-align: center; margin: 20px 0; padding: 12px 20px; background: #fef2f2; border-radius: 10px; font-size: 13px; color: #991b1b;">
            ⏳ ${deadlineText}
          </div>
          ` : ''}

          <!-- חתימה -->
          <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px;">
            <p style="margin: 0 0 4px 0;">${dict.signatureText}</p>
            <p style="color: #1e293b; font-weight: 700; font-size: 17px; margin: 4px 0;">${matchmakerFullName}</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">${dict.signatureRole}</p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} NeshamaTech</p>
        </div>
      `;

      return { subject, body, htmlBody };
    };
  }

  // ============================================================================
  // EXISTING: תוכן רגיל לפי סטטוס (ללא שינוי)
  // ============================================================================

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
    const reviewUrl = `${baseUrl}/matches`;
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
    const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/matches`;
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