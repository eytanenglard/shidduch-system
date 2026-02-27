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
          targetLocale,                        // ✅ FIX: מעבירים locale כפרמטר נפרד
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
  // עיצוב מותאם לברנד NeshamaTech (ציאן + אמבר אקסנט)
  // ============================================================================

  /**
   * יוצרת תוכן "הזמנה אישית" עבור מועמד שמקבל הצעת שידוך חדשה.
   * במקום לחשוף פרטים (שם, גיל, עיסוק) – יוצרת סקרנות ומושכת לאפליקציה.
   * ההערה האישית של השדכן (firstPartyNotes / secondPartyNotes) היא ה-game changer.
   */
  private buildSuggestionInvitationContent(
    suggestion: SuggestionWithParties,
    dictionary: EmailDictionary,
    locale: 'he' | 'en',                    // ✅ FIX: locale כפרמטר נפרד (לא dictionary.locale)
    partyType: 'first' | 'second'
  ): (pt: 'first' | 'second' | 'matchmaker') => NotificationContent {
    
    // שליפת סעיף ההזמנה מהמילון
    const dict = dictionary.suggestionInvitation;
    if (!dict) {
      console.warn('suggestionInvitation dictionary section not found, falling back to regular notification');
      return this.getSuggestionContentFromDict(suggestion, dictionary.notifications)!;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@neshamatech.com';
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
      const localeString = locale === 'he' ? 'he-IL' : 'en-US';  // ✅ FIX: משתמש ב-locale parameter
      const formatted = deadline.toLocaleDateString(localeString, { 
        day: 'numeric', 
        month: 'long' 
      });
      deadlineText = `${dict.deadlinePrefix} ${formatted}`;
    }

    // ברכה אישית + כיווניות
    const isHebrew = locale === 'he';  // ✅ FIX: משתמש ב-locale parameter
    const greeting = isHebrew ? `שלום ${partyName},` : `Hello ${partyName},`;
    const direction = isHebrew ? 'rtl' : 'ltr';
    const textAlign = isHebrew ? 'right' : 'left';
    const borderSide = isHebrew ? 'right' : 'left';
    const marginSide = isHebrew ? 'left' : 'right';
    const currentYear = new Date().getFullYear();

    // Shared dictionary (for footer)
    const sharedDict = dictionary.shared;
    const tagline = isHebrew 
      ? 'מחברים לבבות, בונים עתיד משותף'
      : 'Connecting Hearts, Building Shared Futures';
    const contactLabel = isHebrew ? 'צור קשר:' : 'Contact:';
    const rightsText = isHebrew ? 'כל הזכויות שמורות' : 'All rights reserved';
    const privacyText = isHebrew ? 'מדיניות פרטיות' : 'Privacy Policy';
    const termsText = isHebrew ? 'תנאי שימוש' : 'Terms of Service';

    return (): NotificationContent => {
      // ============================================
      // Subject – כותרת המייל
      // ============================================
      const subject = dict.subject;

      // ============================================
      // Body – טקסט פשוט עבור WhatsApp / SMS
      // ============================================
      const whatsappLines: string[] = [
        `${greeting}`,
        '',
      ];

      if (matchmakerNote) {
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
      // HTML Body – עיצוב תואם לברנד NeshamaTech
      // ============================================
      // צבעי ברנד:
      //   Primary: #06b6d4 (ציאן) / #0891b2 (ציאן כהה)
      //   Accent:  #f59e0b (אמבר) / #fbbf24 (זהב) — לקופסאות הייליט
      //   Pink:    #ec4899 — לקודי OTP
      //   Footer gradient: #0891b2 → #f97316 → #fbbf24
      // ============================================
      const htmlBody = `
<!DOCTYPE html>
<html dir="${direction}" lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dict.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; width: 100% !important;">

  <!-- Email Container -->
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #343a40; direction: ${direction}; text-align: ${textAlign};">

    <!-- ========== HEADER — ציאן כמו שאר המיילים ========== -->
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 5px solid #0891b2;">
      <span style="font-size: 36px; display: block; margin-bottom: 12px;">💌</span>
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${dict.title}</h1>
      <p style="margin-top: 10px; font-size: 15px; color: rgba(255,255,255,0.85); font-weight: 400;">${dict.subtitle}</p>
    </div>

    <!-- ========== BODY ========== -->
    <div style="padding: 30px 30px; font-size: 16px; line-height: 1.6;">

      <!-- ברכה -->
      <p style="font-size: 20px; color: #1e293b; margin-bottom: 18px; font-weight: 600;">${greeting}</p>

      <!-- טקסט מבוא -->
      <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">${dict.intro}</p>

      ${matchmakerNote ? `
      <!-- ========== הערה אישית מהשדכן — highlight-box style ========== -->
      <div style="background-color: #fef9e7; border-${borderSide}: 4px solid #f7c75c; border-radius: 5px; padding: 20px; margin: 25px 0; position: relative;">
        <span style="position: absolute; top: -12px; ${borderSide}: 16px; font-size: 22px; background: #fef9e7; padding: 0 6px; border-radius: 50%;">✍️</span>
        <p style="color: #92400e; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">${dict.personalNoteLabel}</p>
        <p style="color: #78350f; font-size: 15px; line-height: 1.8; font-style: italic; margin: 0;">"${matchmakerNote}"</p>
      </div>
      ` : ''}

      <!-- ========== כרטיס הסקרנות — attributes-list style ========== -->
      <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px 25px; margin: 25px 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">🎁</div>
        <p style="font-size: 18px; color: #1e293b; font-weight: 700; margin: 0 0 8px 0;">${dict.mysteryTitle}</p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">${dict.mysteryText}</p>
      </div>

      <!-- ========== CTA Button — ציאן כמו שאר המיילים ========== -->
      <div style="text-align: center; margin: 30px 0 20px;">
        <a href="${reviewUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: white !important; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
          ${dict.ctaButton}
        </a>
        <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">${dict.ctaHint}</p>
      </div>

      ${deadlineText ? `
      <!-- ========== דדליין (עדין) ========== -->
      <div style="text-align: center; margin: 15px 0; padding: 10px 16px; background: #fef2f2; border-radius: 5px; font-size: 13px; color: #991b1b;">
        ⏳ ${deadlineText}
      </div>
      ` : ''}

      <!-- ========== חתימה ========== -->
      <div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px;">
        <p style="margin: 0 0 4px 0;">${dict.signatureText}</p>
        <p style="color: #1e293b; font-weight: 700; font-size: 16px; margin: 4px 0;">${matchmakerFullName}</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">${dict.signatureRole}</p>
      </div>

    </div>

    <!-- ========== FOOTER — זהה לשאר המיילים ========== -->
    <table role="presentation" style="width: 100%; margin-top: 20px; border-top: 2px solid #e5e7eb;">
      <tr>
        <td style="padding: 30px 20px; text-align: center;">
          <!-- Logo -->
          <div style="margin-bottom: 20px;">
            <img 
              src="https://res.cloudinary.com/dmfxoi6g0/image/upload/v1764757309/ChatGPT_Image_Dec_3_2025_12_21_36_PM_qk8mjz.png" 
              alt="NeshamaTech Logo" 
              style="height: 50px; width: auto; display: inline-block;"
            />
          </div>
          
          <!-- Company Name with Gradient -->
          <div style="margin-bottom: 15px;">
            <span style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #0891b2, #f97316, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              NeshamaTech
            </span>
          </div>
          
          <!-- Tagline -->
          <p style="color: #6b7280; font-size: 14px; margin: 10px 0 20px 0; font-style: italic;">
            ${tagline}
          </p>
          
          <!-- Contact -->
          <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px; display: inline-block;">
            <p style="margin: 5px 0; color: #4b5563; font-size: 13px;">
              <strong>${contactLabel}</strong>
            </p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">
              📧 <a href="mailto:${supportEmail}" style="color: #06b6d4; text-decoration: none;">${supportEmail}</a>
            </p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">
              🌐 <a href="${baseUrl}" style="color: #06b6d4; text-decoration: none;">${baseUrl}</a>
            </p>
          </div>
          
          <!-- Copyright -->
          <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 5px 0;">
            © ${currentYear} NeshamaTech. ${rightsText}
          </p>
          
          <!-- Legal -->
          <p style="color: #9ca3af; font-size: 11px; margin: 5px 0;">
            <a href="${baseUrl}/privacy" style="color: #6b7280; text-decoration: none; margin: 0 5px;">${privacyText}</a> | 
            <a href="${baseUrl}/terms" style="color: #6b7280; text-decoration: none; margin: 0 5px;">${termsText}</a>
          </p>
        </td>
      </tr>
    </table>

  </div>

</body>
</html>
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
      case MatchSuggestionStatus.FIRST_PARTY_INTERESTED:  // ← הוסף את זה  
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