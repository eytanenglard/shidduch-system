// src/lib/services/aiChatService.ts
// =============================================================================
// NeshamaTech - AI Chat Bot Service
// Manages conversations, AI responses, match search, and preference extraction
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { AutoSuggestionFeedbackService } from './autoSuggestionFeedbackService';
import type { PotentialMatchStatus, MatchSuggestionStatus } from '@prisma/client';

// =============================================================================
// CONSTANTS
// =============================================================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_CONVERSATION_HISTORY = 30;
const MIN_AI_SCORE_FOR_SEARCH = 70;
const MAX_SEARCH_RESULTS = 10;
const PREFERENCE_EXTRACTION_INTERVAL = 5; // Extract every N user messages
const SUMMARY_MESSAGE_THRESHOLD = 3; // Generate summary after N user messages

const SEARCH_INTENT_KEYWORDS_HE = ['חפש', 'מצא', 'הצעות', 'תחפשי', 'תמצאי', 'תחפש', 'תמצא', 'חיפוש', 'סריקה'];
const SEARCH_INTENT_KEYWORDS_EN = ['search', 'find', 'match', 'suggest', 'look for', 'scan'];
const ESCALATION_KEYWORDS_HE = ['שדכנית', 'שדכן', 'אנושי', 'אדם אמיתי', 'תעביר', 'תעבירי', 'לדבר עם'];
const ESCALATION_KEYWORDS_EN = ['matchmaker', 'human', 'escalate', 'transfer', 'real person', 'talk to'];

const APPROVE_INTENT_KEYWORDS_HE = ['מאשר', 'מאשרת', 'מעוניין', 'מעוניינת', 'אני בעד', 'מתאים לי', 'רוצה להתקדם', 'בואו נתקדם', 'אישור', 'מסכים', 'מסכימה'];
const APPROVE_INTENT_KEYWORDS_EN = ['approve', 'accept', 'interested', 'i agree', 'go ahead', 'move forward', 'yes please', "let's proceed"];
const DECLINE_INTENT_KEYWORDS_HE = ['דוחה', 'לא מתאים', 'לא מעוניין', 'לא מעוניינת', 'לא בשבילי', 'לוותר', 'לסרב', 'דחייה', 'לא רוצה'];
const DECLINE_INTENT_KEYWORDS_EN = ['decline', 'reject', 'not interested', 'pass', 'no thanks', 'not for me', "don't want"];

const CLOSED_STATUSES: MatchSuggestionStatus[] = [
  'MARRIED', 'CLOSED', 'EXPIRED', 'CANCELLED',
  'FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED',
  'MATCH_DECLINED', 'ENDED_AFTER_FIRST_DATE',
];

// =============================================================================
// TYPES
// =============================================================================

export interface AnonymizedMatch {
  id: string;
  ageRange: string;
  generalArea: string;
  religiousLevel: string;
  educationLevel: string;
  careerField: string;
  personalityTraits: string[];
  matchScore: number;
  matchReason: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAction {
  type: 'approve' | 'decline';
  label: { he: string; en: string };
  status: MatchSuggestionStatus;
  variant: 'positive' | 'negative';
}

// =============================================================================
// SERVICE
// =============================================================================

export class AiChatService {

  // ========== Conversation Management ==========

  static async getOrCreateConversation(userId: string, suggestionId?: string) {
    // If suggestion-specific, look for existing conversation for that suggestion
    if (suggestionId) {
      let conversation = await prisma.aiChatConversation.findFirst({
        where: { userId, suggestionId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        conversation = await prisma.aiChatConversation.create({
          data: { userId, suggestionId },
        });
      }

      return conversation;
    }

    // General conversation (no specific suggestion)
    let conversation = await prisma.aiChatConversation.findFirst({
      where: { userId, suggestionId: null, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.aiChatConversation.create({
        data: { userId },
      });
    }

    return conversation;
  }

  static async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.aiChatMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: (metadata ?? undefined) as any,
      },
    });
  }

  // ========== Conversation History ==========

  static async getConversationHistory(
    conversationId: string,
    limit = 50,
    before?: string,
  ) {
    return prisma.aiChatMessage.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  static async buildConversationHistory(
    conversationId: string,
    limit = MAX_CONVERSATION_HISTORY,
  ): Promise<ConversationMessage[]> {
    const messages = await prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });

    return messages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  // ========== Suggestion Context ==========

  static async getSuggestionContext(suggestionId: string, userId: string, locale: 'he' | 'en'): Promise<string | null> {
    const isHebrew = locale === 'he';

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        matchingReason: true,
        structuredRationale: true,
        isAutoSuggestion: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
        createdAt: true,
        matchmaker: {
          select: { firstName: true, lastName: true },
        },
        firstParty: {
          select: {
            firstName: true,
            profile: {
              select: {
                gender: true, birthDate: true, city: true,
                religiousLevel: true, occupation: true, education: true,
                about: true,
              },
            },
          },
        },
        secondParty: {
          select: {
            firstName: true,
            profile: {
              select: {
                gender: true, birthDate: true, city: true,
                religiousLevel: true, occupation: true, education: true,
                about: true,
              },
            },
          },
        },
      },
    });

    if (!suggestion) return null;

    const isFirstParty = suggestion.firstPartyId === userId;
    const otherParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
    const otherProfile = otherParty?.profile;

    if (!otherProfile) return null;

    const otherAge = otherProfile.birthDate
      ? Math.floor((Date.now() - new Date(otherProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;
    const otherName = otherParty.firstName;

    const parts: string[] = [];
    parts.push(isHebrew ? `\n## הקשר: הצעה ספציפית` : `\n## Context: Specific Suggestion`);
    parts.push(isHebrew ? `השיחה הזו היא על הצעת שידוך ספציפית.` : `This conversation is about a specific match suggestion.`);
    parts.push(isHebrew ? `שם הצד השני: ${otherName}` : `Other party name: ${otherName}`);
    if (otherAge) parts.push(isHebrew ? `גיל: ${otherAge}` : `Age: ${otherAge}`);
    if (otherProfile.city) parts.push(isHebrew ? `עיר: ${otherProfile.city}` : `City: ${otherProfile.city}`);
    if (otherProfile.religiousLevel) parts.push(isHebrew ? `רמה דתית: ${otherProfile.religiousLevel}` : `Religious level: ${otherProfile.religiousLevel}`);
    if (otherProfile.occupation) parts.push(isHebrew ? `מקצוע: ${otherProfile.occupation}` : `Occupation: ${otherProfile.occupation}`);
    if (otherProfile.education) parts.push(isHebrew ? `השכלה: ${otherProfile.education}` : `Education: ${otherProfile.education}`);
    if (otherProfile.about) parts.push(isHebrew ? `על עצמם: ${otherProfile.about.slice(0, 200)}` : `About: ${otherProfile.about.slice(0, 200)}`);
    if (suggestion.matchingReason) parts.push(isHebrew ? `סיבת ההתאמה: ${suggestion.matchingReason}` : `Matching reason: ${suggestion.matchingReason}`);
    parts.push(isHebrew ? `השדכן/ית: ${matchmakerName}` : `Matchmaker: ${matchmakerName}`);
    parts.push(isHebrew ? `סטטוס: ${suggestion.status}` : `Status: ${suggestion.status}`);
    parts.push(isHebrew ? `סוג: ${suggestion.isAutoSuggestion ? 'הצעה אוטומטית' : 'הצעה של שדכנית'}` : `Type: ${suggestion.isAutoSuggestion ? 'Auto suggestion' : 'Matchmaker suggestion'}`);

    parts.push('');
    parts.push(isHebrew
      ? `## הנחיות להקשר של הצעה
- עזור למשתמש/ת לחשוב על ההצעה הזו. ענה על שאלות כמו "מה המשותף בינינו?", "למה הציעו לי אותו/ה?"
- אם המשתמש/ת מתלבט/ת, עזור להם להבין מה מושך אותם ומה מטריד
- אל תלחץ לכיוון מסוים. הנחה בעדינות
- אם מבקשים העברה לשדכנית, הסבר שאתה יכול להעביר את השיחה`
      : `## Suggestion context guidelines
- Help the user think about this specific suggestion. Answer questions like "What do we have in common?", "Why was this suggested?"
- If the user is hesitating, help them understand what attracts them and what concerns them
- Don't push in any direction. Guide gently
- If they ask to talk to a matchmaker, explain you can transfer the conversation`);

    return parts.join('\n');
  }

  // ========== Deep Profile Context (for user-facing AI summary) ==========

  static async buildDeepProfileContext(
    suggestionId: string,
    userId: string,
    locale: 'he' | 'en',
  ): Promise<string | null> {
    const isHe = locale === 'he';

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        firstPartyId: true,
        secondPartyId: true,
        matchingReason: true,
        isAutoSuggestion: true,
        matchmaker: { select: { firstName: true, lastName: true } },
      },
    });
    if (!suggestion) return null;

    const isFirstParty = suggestion.firstPartyId === userId;
    const targetUserId = isFirstParty ? suggestion.secondPartyId : suggestion.firstPartyId;

    const [targetUser, targetTags, targetMetrics, targetQuestionnaire] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          firstName: true,
          lastName: true,
          profile: {
            select: {
              gender: true,
              birthDate: true,
              height: true,
              city: true,
              maritalStatus: true,
              parentStatus: true,
              hasChildrenFromPrevious: true,
              religiousLevel: true,
              religiousJourney: true,
              shomerNegiah: true,
              kippahType: true,
              headCovering: true,
              smokingStatus: true,
              occupation: true,
              education: true,
              educationLevel: true,
              about: true,
              profileHeadline: true,
              profileCharacterTraits: true,
              profileHobbies: true,
              inspiringCoupleStory: true,
              matchingNotes: true,
              preferredAgeMin: true,
              preferredAgeMax: true,
              preferredHeightMin: true,
              preferredHeightMax: true,
              preferredReligiousLevels: true,
              preferredLocations: true,
              aiProfileSummary: true,
              testimonials: {
                select: { content: true, authorName: true, relationship: true },
              },
            },
          },
        },
      }),
      prisma.profileTags.findUnique({
        where: { userId: targetUserId },
        select: {
          sectorTags: true,
          backgroundTags: true,
          personalityTags: true,
          careerTags: true,
          lifestyleTags: true,
          familyVisionTags: true,
          relationshipTags: true,
          diasporaTags: true,
          aiDerivedTags: true,
          partnerTags: true,
          sectionAnswers: true,
        },
      }),
      prisma.profileMetrics.findUnique({
        where: { profileId: targetUserId },
        select: {
          socialEnergy: true,
          careerOrientation: true,
          religiousStrictness: true,
          emotionalExpression: true,
          familyInvolvement: true,
          aiPersonalitySummary: true,
          aiSeekingSummary: true,
        },
      }),
      prisma.questionnaireResponse.findFirst({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        select: {
          valuesAnswers: true,
          personalityAnswers: true,
          relationshipAnswers: true,
          partnerAnswers: true,
          religionAnswers: true,
        },
      }),
    ]);

    if (!targetUser?.profile) return null;

    const p = targetUser.profile;
    const age = p.birthDate
      ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // --- Build comprehensive context ---
    const sections: string[] = [];

    sections.push(isHe
      ? `\n## בקשה: סיכום מעמיק של פרופיל המוצע/ת\nהמשתמש/ת ביקש/ה סיכום מקיף ומעמיק על ${targetUser.firstName}. יש ליצור סיכום כנה, אמיתי ומבוסס נתונים.`
      : `\n## Request: Deep Profile Summary\nThe user requested a comprehensive, in-depth summary of ${targetUser.firstName}. Generate an honest, data-driven summary.`
    );

    // Basic info
    const basicLines: string[] = [];
    basicLines.push(`${isHe ? 'שם' : 'Name'}: ${targetUser.firstName}`);
    if (age) basicLines.push(`${isHe ? 'גיל' : 'Age'}: ${age}`);
    basicLines.push(`${isHe ? 'מגדר' : 'Gender'}: ${p.gender === 'MALE' ? (isHe ? 'גבר' : 'Male') : (isHe ? 'אישה' : 'Female')}`);
    if (p.city) basicLines.push(`${isHe ? 'עיר' : 'City'}: ${p.city}`);
    if (p.height) basicLines.push(`${isHe ? 'גובה' : 'Height'}: ${p.height} cm`);
    if (p.maritalStatus) basicLines.push(`${isHe ? 'מצב משפחתי' : 'Marital status'}: ${p.maritalStatus}`);
    if (p.hasChildrenFromPrevious) basicLines.push(isHe ? 'יש ילדים ממערכת יחסים קודמת' : 'Has children from previous relationship');
    if (p.smokingStatus) basicLines.push(`${isHe ? 'עישון' : 'Smoking'}: ${p.smokingStatus}`);
    sections.push(`### ${isHe ? 'פרטים בסיסיים' : 'Basic Info'}\n${basicLines.join('\n')}`);

    // Religious identity
    const relLines: string[] = [];
    if (p.religiousLevel) relLines.push(`${isHe ? 'רמה דתית' : 'Religious level'}: ${p.religiousLevel}`);
    if (p.religiousJourney) relLines.push(`${isHe ? 'מסע דתי' : 'Religious journey'}: ${p.religiousJourney}`);
    if (p.shomerNegiah !== null) relLines.push(`${isHe ? 'שומר/ת נגיעה' : 'Shomer negiah'}: ${p.shomerNegiah ? (isHe ? 'כן' : 'Yes') : (isHe ? 'לא' : 'No')}`);
    if (p.kippahType) relLines.push(`${isHe ? 'סוג כיפה' : 'Kippah type'}: ${p.kippahType}`);
    if (p.headCovering) relLines.push(`${isHe ? 'כיסוי ראש' : 'Head covering'}: ${p.headCovering}`);
    if (relLines.length > 0) {
      sections.push(`### ${isHe ? 'זהות דתית' : 'Religious Identity'}\n${relLines.join('\n')}`);
    }

    // Professional & Education
    const proLines: string[] = [];
    if (p.occupation) proLines.push(`${isHe ? 'מקצוע' : 'Occupation'}: ${p.occupation}`);
    if (p.education) proLines.push(`${isHe ? 'השכלה' : 'Education'}: ${p.education}`);
    if (p.educationLevel) proLines.push(`${isHe ? 'רמת השכלה' : 'Education level'}: ${p.educationLevel}`);
    if (proLines.length > 0) {
      sections.push(`### ${isHe ? 'מקצוע והשכלה' : 'Professional & Education'}\n${proLines.join('\n')}`);
    }

    // Personal narrative
    if (p.about) sections.push(`### ${isHe ? 'על עצמם (טקסט חופשי)' : 'About (free text)'}\n${p.about}`);
    if (p.profileHeadline) sections.push(`${isHe ? 'כותרת פרופיל' : 'Profile headline'}: ${p.profileHeadline}`);
    if (p.profileCharacterTraits?.length) {
      sections.push(`${isHe ? 'תכונות אופי' : 'Character traits'}: ${p.profileCharacterTraits.join(', ')}`);
    }
    if (p.profileHobbies?.length) {
      sections.push(`${isHe ? 'תחביבים' : 'Hobbies'}: ${p.profileHobbies.join(', ')}`);
    }
    if (p.inspiringCoupleStory) {
      sections.push(`${isHe ? 'סיפור זוגי מעורר השראה' : 'Inspiring couple story'}: ${p.inspiringCoupleStory}`);
    }

    // What they're looking for
    const lookingLines: string[] = [];
    if (p.matchingNotes) lookingLines.push(p.matchingNotes);
    if (p.preferredAgeMin || p.preferredAgeMax) lookingLines.push(`${isHe ? 'טווח גילאים' : 'Age range'}: ${p.preferredAgeMin || '?'}-${p.preferredAgeMax || '?'}`);
    if (p.preferredHeightMin || p.preferredHeightMax) lookingLines.push(`${isHe ? 'טווח גובה' : 'Height range'}: ${p.preferredHeightMin || '?'}-${p.preferredHeightMax || '?'} cm`);
    if (p.preferredReligiousLevels?.length) lookingLines.push(`${isHe ? 'רמות דתיות מועדפות' : 'Preferred religious levels'}: ${p.preferredReligiousLevels.join(', ')}`);
    if (p.preferredLocations?.length) lookingLines.push(`${isHe ? 'מיקומים מועדפים' : 'Preferred locations'}: ${p.preferredLocations.join(', ')}`);
    if (lookingLines.length > 0) {
      sections.push(`### ${isHe ? 'מה מחפש/ת' : 'Looking For'}\n${lookingLines.join('\n')}`);
    }

    // Questionnaire answers (5 worlds)
    if (targetQuestionnaire) {
      const worldNames = isHe
        ? { values: 'ערכים', personality: 'אישיות', relationship: 'זוגיות', partner: 'בן/בת זוג', religion: 'דת ורוחניות' }
        : { values: 'Values', personality: 'Personality', relationship: 'Relationship', partner: 'Partner', religion: 'Religion' };

      const formatAnswers = (answers: unknown): string => {
        if (!answers) return '';
        if (Array.isArray(answers)) {
          return answers
            .filter((a: any) => a?.value !== undefined && a?.value !== null && a?.value !== '')
            .map((a: any) => {
              const val = Array.isArray(a.value) ? a.value.join(', ') : (typeof a.value === 'object' ? JSON.stringify(a.value) : String(a.value));
              return `- [${a.questionId || '?'}]: ${val}`;
            })
            .join('\n');
        }
        return typeof answers === 'object' ? Object.entries(answers as Record<string, any>)
          .map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n') : String(answers);
      };

      const qParts: string[] = [];
      const worldEntries: [string, unknown][] = [
        [worldNames.personality, targetQuestionnaire.personalityAnswers],
        [worldNames.values, targetQuestionnaire.valuesAnswers],
        [worldNames.relationship, targetQuestionnaire.relationshipAnswers],
        [worldNames.partner, targetQuestionnaire.partnerAnswers],
        [worldNames.religion, targetQuestionnaire.religionAnswers],
      ];

      for (const [name, answers] of worldEntries) {
        const formatted = formatAnswers(answers);
        if (formatted) {
          qParts.push(`#### ${isHe ? 'עולם' : 'World'}: ${name}\n${formatted}`);
        }
      }
      if (qParts.length > 0) {
        sections.push(`### ${isHe ? 'שאלון 5 העולמות (טביעת הנשמה)' : 'Five Worlds Questionnaire (Soul Fingerprint)'}\n${qParts.join('\n\n')}`);
      }
    }

    // Soul fingerprint tags
    if (targetTags) {
      const tagLines: string[] = [];
      const tagCategories = isHe
        ? [
            { label: 'מגזר/קהילה', tags: targetTags.sectorTags },
            { label: 'רקע ומוצא', tags: targetTags.backgroundTags },
            { label: 'אישיות', tags: targetTags.personalityTags },
            { label: 'קריירה ושאיפות', tags: targetTags.careerTags },
            { label: 'אורח חיים', tags: targetTags.lifestyleTags },
            { label: 'חזון משפחתי', tags: targetTags.familyVisionTags },
            { label: 'סגנון זוגיות', tags: targetTags.relationshipTags },
            { label: 'תפוצות/גיאוגרפי', tags: targetTags.diasporaTags },
            { label: 'תובנות AI', tags: targetTags.aiDerivedTags },
          ]
        : [
            { label: 'Sector', tags: targetTags.sectorTags },
            { label: 'Background', tags: targetTags.backgroundTags },
            { label: 'Personality', tags: targetTags.personalityTags },
            { label: 'Career', tags: targetTags.careerTags },
            { label: 'Lifestyle', tags: targetTags.lifestyleTags },
            { label: 'Family Vision', tags: targetTags.familyVisionTags },
            { label: 'Relationship', tags: targetTags.relationshipTags },
            { label: 'Diaspora', tags: targetTags.diasporaTags },
            { label: 'AI Insights', tags: targetTags.aiDerivedTags },
          ];

      for (const cat of tagCategories) {
        if (cat.tags?.length) tagLines.push(`- ${cat.label}: ${cat.tags.join(', ')}`);
      }

      if (targetTags.partnerTags && typeof targetTags.partnerTags === 'object') {
        const pt = targetTags.partnerTags as Record<string, unknown>;
        for (const [key, val] of Object.entries(pt)) {
          if (Array.isArray(val) && val.length > 0) {
            tagLines.push(`- ${isHe ? 'העדפות בן/בת זוג' : 'Partner pref'} (${key}): ${val.join(', ')}`);
          }
        }
      }

      if (tagLines.length > 0) {
        sections.push(`### ${isHe ? 'תגיות טביעת הנשמה' : 'Soul Fingerprint Tags'}\n${tagLines.join('\n')}`);
      }
    }

    // Personality metrics
    if (targetMetrics) {
      const mLines: string[] = [];
      if (targetMetrics.socialEnergy !== null) mLines.push(`${isHe ? 'אנרגיה חברתית' : 'Social energy'}: ${targetMetrics.socialEnergy}/10`);
      if (targetMetrics.careerOrientation !== null) mLines.push(`${isHe ? 'אוריינטציה קריירית' : 'Career orientation'}: ${targetMetrics.careerOrientation}/10`);
      if (targetMetrics.religiousStrictness !== null) mLines.push(`${isHe ? 'רמת שמרנות דתית' : 'Religious strictness'}: ${targetMetrics.religiousStrictness}/10`);
      if (targetMetrics.emotionalExpression !== null) mLines.push(`${isHe ? 'ביטוי רגשי' : 'Emotional expression'}: ${targetMetrics.emotionalExpression}/10`);
      if (targetMetrics.familyInvolvement !== null) mLines.push(`${isHe ? 'מעורבות משפחתית' : 'Family involvement'}: ${targetMetrics.familyInvolvement}/10`);
      if (targetMetrics.aiPersonalitySummary) mLines.push(`${isHe ? 'סיכום אישיות' : 'Personality summary'}: ${targetMetrics.aiPersonalitySummary}`);
      if (targetMetrics.aiSeekingSummary) mLines.push(`${isHe ? 'מה מחפש/ת' : 'Seeking summary'}: ${targetMetrics.aiSeekingSummary}`);
      if (mLines.length > 0) {
        sections.push(`### ${isHe ? 'מדדי אישיות' : 'Personality Metrics'}\n${mLines.join('\n')}`);
      }
    }

    // AI profile summary (if exists)
    if (p.aiProfileSummary) {
      let summaryText = '';
      if (typeof p.aiProfileSummary === 'string') {
        summaryText = p.aiProfileSummary;
      } else {
        const obj = p.aiProfileSummary as Record<string, any>;
        if (obj.analysis) summaryText += obj.analysis + '\n';
        if (obj.strengths) summaryText += `${isHe ? 'חוזקות' : 'Strengths'}: ${Array.isArray(obj.strengths) ? obj.strengths.join(', ') : obj.strengths}\n`;
        if (obj.challenges) summaryText += `${isHe ? 'אתגרים' : 'Challenges'}: ${Array.isArray(obj.challenges) ? obj.challenges.join(', ') : obj.challenges}\n`;
        if (obj.needs) summaryText += `${isHe ? 'צרכים בזוגיות' : 'Relationship needs'}: ${obj.needs}\n`;
      }
      if (summaryText) {
        sections.push(`### ${isHe ? 'סיכום AI מקדים' : 'AI Profile Summary'}\n${summaryText}`);
      }
    }

    // Friend testimonials
    if (p.testimonials?.length) {
      const testLines = p.testimonials.map((t) =>
        `"${t.content}" — ${t.authorName}${t.relationship ? ` (${t.relationship})` : ''}`
      );
      sections.push(`### ${isHe ? 'המלצות חברים' : 'Friend Testimonials'}\n${testLines.join('\n')}`);
    }

    // Matching reason
    if (suggestion.matchingReason) {
      sections.push(`### ${isHe ? 'סיבת ההתאמה של השדכנ/ית' : 'Matchmaker Reason'}\n${suggestion.matchingReason}`);
    }

    // --- Summary prompt instructions ---
    sections.push(isHe
      ? `## הנחיות לסיכום הפרופיל
אתה מתבקש ליצור **סיכום פרופיל מקיף, כנה ומעמיק** של ${targetUser.firstName} עבור המשתמש/ת שקיבל/ה את ההצעה.

**עקרונות מנחים:**
1. **כנות מלאה** — אל תייפה ואל תזלזל. תן תמונה אמיתית ומאוזנת
2. **מבוסס נתונים** — כל אמירה חייבת להתבסס על מידע שקיבלת. אל תמציא ואל תשער
3. **5 העולמות** — סקור את האישיות, הערכים, חזון הזוגיות, מה שמחפש/ת, והזהות הדתית-רוחנית
4. **שם מלא** — השתמש בשם ${targetUser.firstName} בטבעיות לאורך הסיכום
5. **טון אישי וחם** — כתוב כאילו אתה חבר טוב שמכיר את האדם ומספר עליו בכנות
6. **נקודות חוזק ואתגרים** — ציין מה בולט לטובה, ואם יש דברים שכדאי לשים לב אליהם
7. **רלוונטיות** — התמקד במה שחשוב לבחירת בן/בת זוג

**מבנה מומלץ:**
- פתיחה: מי ${targetUser.firstName}? (תמונה כללית ב-2-3 משפטים)
- אישיות וסגנון חיים
- ערכים ועולם רוחני
- חזון הזוגיות ומה מחפש/ת בבן/בת זוג
- נקודות שכדאי לשים לב אליהן
- סיכום: מה הסוג של בן אדם שבדרך כלל מתאים ל${targetUser.firstName}

**אסור:**
- לא לחשוף מידע רפואי, הערות פנימיות של שדכנים, או פרטי קשר
- לא להמציא מידע שלא קיים בנתונים
- לא להיות שיפוטי או פוגעני`
      : `## Profile Summary Instructions
Generate a **comprehensive, honest, and deep profile summary** of ${targetUser.firstName} for the user who received this suggestion.

**Guiding principles:**
1. **Full honesty** — don't embellish or dismiss. Give a balanced, real picture
2. **Data-based** — every statement must be based on the data provided. Don't invent or assume
3. **Five Worlds** — cover personality, values, relationship vision, what they seek, and religious/spiritual identity
4. **Use name** — use ${targetUser.firstName}'s name naturally throughout
5. **Warm personal tone** — write as if you're a good friend who knows this person and describes them honestly
6. **Strengths and challenges** — note what stands out positively, and things worth being aware of
7. **Relevance** — focus on what matters for choosing a partner

**Recommended structure:**
- Opening: Who is ${targetUser.firstName}? (general picture in 2-3 sentences)
- Personality and lifestyle
- Values and spiritual world
- Relationship vision and what they seek in a partner
- Things worth noting
- Summary: what type of person typically suits ${targetUser.firstName}

**Forbidden:**
- Do not reveal medical info, internal matchmaker notes, or contact details
- Do not invent information not present in the data
- Do not be judgmental or offensive`
    );

    return sections.join('\n\n');
  }

  // ========== System Prompt ==========

  static async buildSystemPrompt(userId: string, locale: 'he' | 'en', suggestionContext?: string, phase?: string): Promise<string> {
    const isHebrew = locale === 'he';

    // Load user data in parallel
    const [profile, metrics, tags, preferences, recentFeedbacks] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        select: {
          gender: true,
          birthDate: true,
          city: true,
          religiousLevel: true,
          occupation: true,
          education: true,
          educationLevel: true,
          about: true,
          preferredAgeMin: true,
          preferredAgeMax: true,
          preferredReligiousLevels: true,
          preferredLocations: true,
        },
      }),
      prisma.profileMetrics.findUnique({
        where: { profileId: userId },
        select: {
          socialEnergy: true,
          careerOrientation: true,
          religiousStrictness: true,
          emotionalExpression: true,
          familyInvolvement: true,
          aiPersonalitySummary: true,
          aiSeekingSummary: true,
          aiMatchmakerGuidelines: true,
        },
      }),
      prisma.profileTags.findUnique({
        where: { userId },
        select: {
          personalityTags: true,
          careerTags: true,
          lifestyleTags: true,
          familyVisionTags: true,
          relationshipTags: true,
          sectorTags: true,
        },
      }),
      prisma.userMatchingPreferences.findUnique({
        where: { userId },
      }),
      prisma.autoSuggestionFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          decision: true,
          likedTraits: true,
          missingTraits: true,
          likedFreeText: true,
          missingFreeText: true,
        },
      }),
    ]);

    // Calculate age
    const age = profile?.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Build user context
    const userContext: string[] = [];

    if (profile) {
      userContext.push(`Gender: ${profile.gender === 'MALE' ? (isHebrew ? 'גבר' : 'Male') : (isHebrew ? 'אישה' : 'Female')}`);
      if (age) userContext.push(`${isHebrew ? 'גיל' : 'Age'}: ${age}`);
      if (profile.city) userContext.push(`${isHebrew ? 'עיר' : 'City'}: ${profile.city}`);
      if (profile.religiousLevel) userContext.push(`${isHebrew ? 'רמה דתית' : 'Religious level'}: ${profile.religiousLevel}`);
      if (profile.occupation) userContext.push(`${isHebrew ? 'מקצוע' : 'Occupation'}: ${profile.occupation}`);
      if (profile.education) userContext.push(`${isHebrew ? 'השכלה' : 'Education'}: ${profile.education}`);
    }

    // Preferences
    if (profile?.preferredAgeMin || profile?.preferredAgeMax) {
      userContext.push(`${isHebrew ? 'טווח גילאים מועדף' : 'Preferred age range'}: ${profile.preferredAgeMin || '?'}-${profile.preferredAgeMax || '?'}`);
    }
    if (profile?.preferredReligiousLevels?.length) {
      userContext.push(`${isHebrew ? 'רמות דתיות מועדפות' : 'Preferred religious levels'}: ${profile.preferredReligiousLevels.join(', ')}`);
    }

    // Metrics summary
    if (metrics) {
      const metricsLines: string[] = [];
      if (metrics.socialEnergy !== null) metricsLines.push(`socialEnergy: ${metrics.socialEnergy}/10`);
      if (metrics.careerOrientation !== null) metricsLines.push(`careerOrientation: ${metrics.careerOrientation}/10`);
      if (metrics.religiousStrictness !== null) metricsLines.push(`religiousStrictness: ${metrics.religiousStrictness}/10`);
      if (metrics.emotionalExpression !== null) metricsLines.push(`emotionalExpression: ${metrics.emotionalExpression}/10`);
      if (metrics.familyInvolvement !== null) metricsLines.push(`familyInvolvement: ${metrics.familyInvolvement}/10`);
      if (metricsLines.length > 0) {
        userContext.push(`${isHebrew ? 'מדדי אישיות' : 'Personality metrics'}: ${metricsLines.join(', ')}`);
      }
      if (metrics.aiPersonalitySummary) {
        userContext.push(`${isHebrew ? 'סיכום אישיות AI' : 'AI personality summary'}: ${metrics.aiPersonalitySummary}`);
      }
      if (metrics.aiSeekingSummary) {
        userContext.push(`${isHebrew ? 'מה מחפש/ת (AI)' : 'AI seeking summary'}: ${metrics.aiSeekingSummary}`);
      }
    }

    // Tags summary
    if (tags) {
      const tagLines: string[] = [];
      if (tags.personalityTags?.length) tagLines.push(`personality: ${(tags.personalityTags as string[]).join(', ')}`);
      if (tags.careerTags?.length) tagLines.push(`career: ${(tags.careerTags as string[]).join(', ')}`);
      if (tags.lifestyleTags?.length) tagLines.push(`lifestyle: ${(tags.lifestyleTags as string[]).join(', ')}`);
      if (tags.sectorTags?.length) tagLines.push(`sector: ${(tags.sectorTags as string[]).join(', ')}`);
      if (tagLines.length > 0) {
        userContext.push(`${isHebrew ? 'תגיות' : 'Tags'}: ${tagLines.join(' | ')}`);
      }
    }

    // Learned preferences
    if (preferences?.preferenceSummary) {
      userContext.push(`${isHebrew ? 'העדפות נלמדות' : 'Learned preferences'}: ${preferences.preferenceSummary}`);
    }
    if (preferences?.chatDerivedInsights) {
      userContext.push(`${isHebrew ? 'תובנות משיחות קודמות' : 'Previous chat insights'}: ${preferences.chatDerivedInsights}`);
    }

    // Recent feedback summary
    if (recentFeedbacks.length > 0) {
      const approved = recentFeedbacks.filter((f) => f.decision === 'APPROVED').length;
      const declined = recentFeedbacks.filter((f) => f.decision === 'DECLINED').length;
      const interested = recentFeedbacks.filter((f) => f.decision === 'INTERESTED').length;

      const allLiked = recentFeedbacks.flatMap((f) => (f.likedTraits as string[] | null) || []);
      const allMissing = recentFeedbacks.flatMap((f) => (f.missingTraits as string[] | null) || []);

      const feedbackSummary = isHebrew
        ? `פידבק אחרון (${recentFeedbacks.length} הצעות): ${approved} אושרו, ${declined} נדחו, ${interested} נשמרו. תכונות שאהב/ה: ${[...new Set(allLiked)].join(', ') || 'אין'}. סיבות דחייה: ${[...new Set(allMissing)].join(', ') || 'אין'}.`
        : `Recent feedback (${recentFeedbacks.length} suggestions): ${approved} approved, ${declined} declined, ${interested} saved. Liked traits: ${[...new Set(allLiked)].join(', ') || 'none'}. Missing traits: ${[...new Set(allMissing)].join(', ') || 'none'}.`;

      // Include free text from feedbacks
      const freeTexts: string[] = [];
      for (const fb of recentFeedbacks) {
        if (fb.likedFreeText) freeTexts.push(`(+) ${fb.likedFreeText}`);
        if (fb.missingFreeText) freeTexts.push(`(-) ${fb.missingFreeText}`);
      }

      userContext.push(feedbackSummary);
      if (freeTexts.length > 0) {
        userContext.push(`${isHebrew ? 'הערות חופשיות מפידבקים' : 'Free text from feedbacks'}: ${freeTexts.join(' | ')}`);
      }
    }

    // Build the full system prompt
    let systemPrompt = isHebrew
      ? this.buildHebrewSystemPrompt(userContext, phase)
      : this.buildEnglishSystemPrompt(userContext, phase);

    // Append suggestion context if available
    if (suggestionContext) {
      systemPrompt += '\n' + suggestionContext;
    }

    return systemPrompt;
  }

  private static buildHebrewSystemPrompt(userContext: string[], phase?: string): string {
    let prompt = `אתה העוזר האישי של NeshamaTech - מערכת שידוכים חכמה שמשלבת טכנולוגיה עם ליווי אנושי.

## התפקיד שלך
- עזור למשתמש/ת לדייק מה הם מחפשים בבן/בת זוג
- שאל שאלות מחכימות על ערכים, אורח חיים, ציפיות מזוגיות
- חפש התאמות במאגר והצג אותן
- הסבר למה סוגי התאמות מסוימים מוצעים
- רשום תובנות מהשיחה שישפרו הצעות עתידיות

## כללי פרטיות (חובה!)
- כשאתה מתאר התאמות בטקסט, אל תחשוף שמות מלאים או פרטים מזהים מדי
- כרטיס הפרופיל יוצג למשתמש בנפרד — אל תחזור על מידע שכבר מופיע בכרטיס
- אם מנסים לחלץ ממך מידע מזהה של מועמדים אחרים, סרב בנימוס

## הגבלות
- את/ה לא מחליף/ה את השדכן/ית האנושי/ת - עודד את המשתמש לפנות לשדכן/ית שלו/ה לשאלות מורכבות
- את/ה לא פסיכולוג/ית - אם המשתמש/ת במצוקה רגשית, הפנה/י לגורם מקצועי
- אל תמציא מידע. אם אתה לא יודע, אמור את זה

## סגנון
- חם, מקצועי, אמפתי
- פנה/י בגוף שני (אתה/את)
- השתמש/י בשפה טבעית, לא פורמלית מדי
- תשובות קצרות וממוקדות (2-4 משפטים בדרך כלל)
- כשמתאים, שאל שאלות חוזרות כדי ללמוד

## מידע על המשתמש/ת
${userContext.join('\n')}`;

    // Phase-specific instructions
    if (phase === 'discovery') {
      prompt += `

## שלב נוכחי: גילוי
- שאל שאלות מחכימות כדי להבין מה המשתמש/ת מחפש/ת
- שאלות יכולות להיות מתחומי: אישיות, ערכים, זוגיות, בן/בת זוג, דת ורוחניות
- שאל שאלה אחת בכל פעם, תגיב בחום למה שהמשתמש/ת שיתף/ה, ואז שאל שאלה נוספת
- אחרי 2-4 תשובות משמעותיות, הצע באופן יזום: "נראה לי שאני מתחיל/ה להבין מה חשוב לך. רוצה שאחפש לך מישהו/י מעניין/ת במאגר שלנו?"
- אם המשתמש/ת שואל/ת על הצעה קיימת או משתף/ת משהו ספציפי — כבד/י את זה ותגיב/י לנושא שלהם
- אל תמהר/י להציע חיפוש — קודם תבין/י באמת מה חשוב`;
    } else if (phase === 'presenting') {
      prompt += `

## שלב נוכחי: הצגת מועמד/ת
- כרטיס פרופיל מלא יוצג למשתמש/ת — אל תחזור על מידע בסיסי (שם, גיל, עיר) שכבר מופיע בכרטיס
- התמקד/י בסיבות ההתאמה: ערכים משותפים, תחומי עניין, חזון דומה, נקודות חיבור ייחודיות
- הצג/י את ההתאמה בצורה חמה ואישית — לא רשימת נתונים יבשה
- המתן/י לתגובת המשתמש/ת לפני שתמשיך/י
- אם המשתמש/ת שואל/ת שאלות — ענה/י על סמך המידע שיש לך`;
    } else if (phase === 'discussing') {
      prompt += `

## שלב נוכחי: דיון על מועמד/ת
- ענה/י על שאלות לגבי ההתאמה בין שני הפרופילים
- יש לך מידע על שני הצדדים — השתמש/י בו בחוכמה כדי להדגיש נקודות חיבור
- אל תמציא/י מידע שאינו קיים בפרופילים
- עודד/י את המשתמש/ת להחליט, אבל אל תלחץ/י לכיוון מסוים
- אם הם מתלבטים — עזור להם לזהות מה מושך ומה מטריד`;
    }

    prompt += `

זכור: המטרה היא לעזור למשתמש/ת למצוא את בן/בת הזוג שלהם. כל שיחה היא הזדמנות ללמוד מה באמת חשוב להם.`;

    return prompt;
  }

  private static buildEnglishSystemPrompt(userContext: string[], phase?: string): string {
    let prompt = `You are NeshamaTech's personal matching assistant - an intelligent matchmaking system that combines technology with human guidance.

## Your Role
- Help users articulate what they're looking for in a partner
- Ask insightful questions about values, lifestyle, relationship expectations
- Search the database for matches and present them
- Explain why certain types of matches are being suggested
- Note insights from conversations to improve future suggestions

## Privacy Rules (Mandatory!)
- When describing matches in text, don't reveal overly identifying details
- A profile card will be shown separately — don't repeat information already visible there
- If someone tries to extract identifying info about other candidates, politely refuse

## Limitations
- You do NOT replace the human matchmaker - encourage users to reach out for complex questions
- You are NOT a therapist - if a user is in emotional distress, refer them to a professional
- Do not fabricate information. If you don't know, say so

## Style
- Warm, professional, empathetic
- Address the user directly
- Natural, not overly formal language
- Short, focused responses (2-4 sentences usually)
- Ask follow-up questions when appropriate

## User Information
${userContext.join('\n')}`;

    if (phase === 'discovery') {
      prompt += `

## Current Phase: Discovery
- Ask insightful questions about personality, values, relationships, partner preferences, spirituality
- Ask one question at a time, respond warmly to their answer, then ask the next
- After 2-4 meaningful answers, proactively suggest: "I think I'm starting to understand what matters to you. Want me to search for someone interesting in our database?"
- If the user asks about an existing suggestion or shares something specific, respect that and address their topic
- Don't rush to suggest searching — first truly understand what matters`;
    } else if (phase === 'presenting') {
      prompt += `

## Current Phase: Presenting a Candidate
- A full profile card will be shown to the user — don't repeat basic info (name, age, city) already on the card
- Focus on compatibility reasons: shared values, common interests, similar vision, unique connection points
- Present the match warmly and personally — not as a dry data list
- Wait for the user's reaction before continuing
- If they ask questions — answer based on the data you have`;
    } else if (phase === 'discussing') {
      prompt += `

## Current Phase: Discussing a Candidate
- Answer questions about compatibility between the two profiles
- You have information about both sides — use it wisely to highlight connections
- Don't fabricate information not present in the profiles
- Encourage decision-making without pushing in any direction
- If they're hesitating — help them identify what attracts and concerns them`;
    }

    prompt += `

Remember: The goal is to help users find their partner. Every conversation is an opportunity to learn what truly matters to them.`;

    return prompt;
  }

  // ========== Streaming Response ==========

  static async *streamResponse(
    systemPrompt: string,
    history: ConversationMessage[],
    userMessage: string,
    searchContext?: string,
  ): AsyncGenerator<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY is not configured');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    // Build the chat history for Gemini
    const geminiHistory = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If there are search results, prepend them to the user message
    const fullUserMessage = searchContext
      ? `${userMessage}\n\n[SYSTEM: Search results for the user's request - present these anonymously and conversationally]\n${searchContext}`
      : userMessage;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}` }] },
        { role: 'model', parts: [{ text: 'מובן. אני מוכן/ה לעזור. איך אפשר לעזור לך היום?' }] },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessageStream(fullUserMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  // ========== Match Search ==========

  static async searchMatches(userId: string): Promise<AnonymizedMatch[]> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) return [];

    const isMale = profile.gender === 'MALE';

    // Query top potential matches
    const matches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE_FOR_SEARCH },
        ...(isMale
          ? {
              female: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                profile: { isNot: null },
              },
            }
          : {
              male: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                profile: { isNot: null },
              },
            }),
      },
      orderBy: { aiScore: 'desc' },
      take: MAX_SEARCH_RESULTS * 2, // Extra to account for filtering
      select: {
        id: true,
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        shortReasoning: true,
        detailedReasoning: true,
        male: {
          select: {
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                occupation: true,
                education: true,
                educationLevel: true,
                availabilityStatus: true,
              },
            },
          },
        },
        female: {
          select: {
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                occupation: true,
                education: true,
                educationLevel: true,
                availabilityStatus: true,
              },
            },
          },
        },
      },
    });

    // Filter and anonymize
    const results: AnonymizedMatch[] = [];

    for (const match of matches) {
      if (results.length >= MAX_SEARCH_RESULTS) break;

      const otherPartyProfile = isMale ? match.female?.profile : match.male?.profile;
      if (!otherPartyProfile || otherPartyProfile.availabilityStatus !== 'AVAILABLE') continue;

      // Check no existing active suggestion
      const existingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: match.maleUserId, secondPartyId: match.femaleUserId },
            { firstPartyId: match.femaleUserId, secondPartyId: match.maleUserId },
          ],
          status: { notIn: CLOSED_STATUSES },
        },
      });

      if (existingSuggestion) continue;

      results.push(this.anonymizeCandidate(
        match.id,
        otherPartyProfile,
        match.aiScore,
        match.shortReasoning,
      ));
    }

    // Apply feedback reranking
    try {
      const forReranking = results.map((r) => {
        const originalMatch = matches.find((m) => m.id === r.id)!;
        return {
          id: r.id,
          aiScore: r.matchScore,
          maleUserId: originalMatch.maleUserId,
          femaleUserId: originalMatch.femaleUserId,
          shortReasoning: originalMatch.shortReasoning,
          detailedReasoning: originalMatch.detailedReasoning,
        };
      });

      const reranked = await AutoSuggestionFeedbackService.applyFeedbackReranking(forReranking, userId);

      // Update scores based on reranking
      for (const r of results) {
        const rerankedMatch = reranked.find((rr) => rr.id === r.id);
        if (rerankedMatch) r.matchScore = rerankedMatch.aiScore;
      }
      results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (err) {
      console.error('[AiChat] Reranking failed, using original order:', err);
    }

    return results;
  }

  // ========== Anonymization ==========

  static anonymizeCandidate(
    matchId: string,
    profile: {
      gender: string | null;
      birthDate: Date | null;
      city: string | null;
      religiousLevel: string | null;
      occupation: string | null;
      education: string | null;
      educationLevel: string | null;
    },
    aiScore: number,
    shortReasoning: string | null,
  ): AnonymizedMatch {
    // Age range (not exact)
    let ageRange = 'לא ידוע';
    if (profile.birthDate) {
      const age = Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 23) ageRange = 'תחילת שנות ה-20';
      else if (age < 26) ageRange = 'אמצע שנות ה-20';
      else if (age < 30) ageRange = 'שלהי שנות ה-20';
      else if (age < 33) ageRange = 'תחילת שנות ה-30';
      else if (age < 36) ageRange = 'אמצע שנות ה-30';
      else if (age < 40) ageRange = 'שלהי שנות ה-30';
      else ageRange = 'שנות ה-40+';
    }

    // General area (not exact city)
    let generalArea = '';
    if (profile.city) {
      const cityLower = profile.city.toLowerCase();
      if (['תל אביב', 'tel aviv', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 'כפר סבא', 'פתח תקווה', 'חולון', 'בת ים'].some((c) => cityLower.includes(c.toLowerCase()))) {
        generalArea = 'גוש דן / מרכז';
      } else if (['ירושלים', 'jerusalem', 'בית שמש', 'מעלה אדומים', 'מבשרת'].some((c) => cityLower.includes(c.toLowerCase()))) {
        generalArea = 'אזור ירושלים';
      } else if (['חיפה', 'haifa', 'קריות', 'טבריה', 'נצרת', 'עפולה'].some((c) => cityLower.includes(c.toLowerCase()))) {
        generalArea = 'צפון';
      } else if (['באר שבע', 'אשדוד', 'אשקלון', 'אילת'].some((c) => cityLower.includes(c.toLowerCase()))) {
        generalArea = 'דרום';
      } else if (['מודיעין', 'שוהם', 'לוד', 'רמלה'].some((c) => cityLower.includes(c.toLowerCase()))) {
        generalArea = 'מרכז';
      } else {
        generalArea = 'ישראל';
      }
    }

    // Career field (general, not specific workplace)
    let careerField = '';
    if (profile.occupation) {
      const occ = profile.occupation.toLowerCase();
      if (['הייטק', 'מתכנת', 'תוכנה', 'tech', 'software', 'developer', 'engineer'].some((k) => occ.includes(k))) {
        careerField = 'הייטק / טכנולוגיה';
      } else if (['מורה', 'חינוך', 'teach', 'education', 'מחנך'].some((k) => occ.includes(k))) {
        careerField = 'חינוך';
      } else if (['רופא', 'רפואה', 'medical', 'doctor', 'אח', 'אחות'].some((k) => occ.includes(k))) {
        careerField = 'רפואה / בריאות';
      } else if (['עורך דין', 'משפט', 'law', 'lawyer'].some((k) => occ.includes(k))) {
        careerField = 'משפטים';
      } else if (['חשבונ', 'כלכל', 'finance', 'account', 'business'].some((k) => occ.includes(k))) {
        careerField = 'עסקים / פיננסים';
      } else if (['עיצוב', 'design', 'אמנות', 'art'].some((k) => occ.includes(k))) {
        careerField = 'עיצוב / אמנות';
      } else if (['סטודנט', 'student', 'לומד'].some((k) => occ.includes(k))) {
        careerField = 'סטודנט/ית';
      } else {
        careerField = 'תעסוקה אחרת';
      }
    }

    return {
      id: matchId,
      ageRange,
      generalArea,
      religiousLevel: profile.religiousLevel || '',
      educationLevel: profile.educationLevel || profile.education || '',
      careerField,
      personalityTraits: [], // Will be enriched if tags are loaded
      matchScore: Math.round(aiScore),
      matchReason: shortReasoning || '',
    };
  }

  // ========== Format Search Results for AI ==========

  static formatSearchResultsForAI(matches: AnonymizedMatch[]): string {
    if (matches.length === 0) {
      return '[אין תוצאות חיפוש - לא נמצאו התאמות חדשות כרגע]';
    }

    const lines = matches.map((m, i) => {
      const parts = [`התאמה ${i + 1} (ציון: ${m.matchScore}):`];
      if (m.ageRange) parts.push(`גיל: ${m.ageRange}`);
      if (m.generalArea) parts.push(`אזור: ${m.generalArea}`);
      if (m.religiousLevel) parts.push(`רמה דתית: ${m.religiousLevel}`);
      if (m.careerField) parts.push(`תחום: ${m.careerField}`);
      if (m.educationLevel) parts.push(`השכלה: ${m.educationLevel}`);
      if (m.matchReason) parts.push(`סיבת התאמה: ${m.matchReason}`);
      return parts.join(' | ');
    });

    return lines.join('\n');
  }

  // ========== Intent Detection ==========

  static detectSearchIntent(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      SEARCH_INTENT_KEYWORDS_HE.some((kw) => lower.includes(kw)) ||
      SEARCH_INTENT_KEYWORDS_EN.some((kw) => lower.includes(kw))
    );
  }

  // ========== Output Sanitization ==========

  static sanitizeAiResponse(response: string, watchlistNames: string[] = []): string {
    let sanitized = response;

    // Strip phone numbers
    sanitized = sanitized.replace(/\b0\d{1,2}[-.]?\d{7,8}\b/g, '[מספר מוסתר]');
    sanitized = sanitized.replace(/\+?\d{1,3}[-.]?\d{2,3}[-.]?\d{7,8}/g, '[מספר מוסתר]');

    // Strip emails
    sanitized = sanitized.replace(/\S+@\S+\.\S+/g, '[אימייל מוסתר]');

    // Strip watchlist names (if any somehow leaked)
    for (const name of watchlistNames) {
      if (name && name.length > 1) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        sanitized = sanitized.replace(new RegExp(escaped, 'gi'), '[שם מוסתר]');
      }
    }

    return sanitized;
  }

  // ========== Preference Extraction ==========

  static async shouldExtractPreferences(conversationId: string): Promise<boolean> {
    const userMessageCount = await prisma.aiChatMessage.count({
      where: { conversationId, role: 'user' },
    });
    return userMessageCount > 0 && userMessageCount % PREFERENCE_EXTRACTION_INTERVAL === 0;
  }

  static async extractAndSavePreferences(userId: string, conversationId: string): Promise<void> {
    const messages = await prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { role: true, content: true },
    });

    if (messages.length < 3) return;

    const conversationText = messages
      .reverse()
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const extractionPrompt = `Analyze this matchmaking conversation and extract the user's matching preferences.

CONVERSATION:
${conversationText}

Return a JSON object with:
{
  "likedTraits": ["trait1", "trait2"],
  "avoidTraits": ["trait1", "trait2"],
  "freeformInsights": "A concise Hebrew summary of what the user is looking for, what matters to them, and what they want to avoid"
}

Use ONLY these trait values:
Liked traits: religious_match, personality_match, age_appropriate, shared_values, similar_background, attractive_profile, good_career, interesting_person
Avoid traits: age_gap, religious_gap, geographic_gap, not_attracted, no_connection, background_gap, education_gap, gut_feeling

If a trait isn't clearly expressed, don't include it. Return ONLY the JSON, no markdown.`;

    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      });

      const result = await model.generateContent(extractionPrompt);
      const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const extracted = JSON.parse(text);

      if (!extracted || typeof extracted !== 'object') return;

      // Save insights to UserMatchingPreferences
      await prisma.userMatchingPreferences.upsert({
        where: { userId },
        create: {
          userId,
          likedTraitScores: {},
          avoidTraitScores: {},
          chatDerivedInsights: extracted.freeformInsights || null,
          lastChatExtraction: new Date(),
          totalFeedbacks: 0,
        },
        update: {
          chatDerivedInsights: extracted.freeformInsights || null,
          lastChatExtraction: new Date(),
        },
      });

      // Save extracted preferences on the conversation too
      await prisma.aiChatConversation.update({
        where: { id: conversationId },
        data: {
          extractedPreferences: {
            wants: extracted.likedTraits || [],
            avoids: extracted.avoidTraits || [],
            freeformInsights: extracted.freeformInsights || '',
          },
        },
      });

      console.log(`[AiChat] Extracted preferences for user ${userId}:`, extracted);
    } catch (err) {
      console.error(`[AiChat] Preference extraction failed for ${userId}:`, err);
    }
  }

  // ========== Get Watchlist Names (for sanitization) ==========

  static async getWatchlistNames(userId: string): Promise<string[]> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) return [];

    const isMale = profile.gender === 'MALE';

    // Get names of potential matches
    const potentialMatches = await prisma.potentialMatch.findMany({
      where: isMale ? { maleUserId: userId } : { femaleUserId: userId },
      take: 50,
      select: isMale
        ? { female: { select: { firstName: true, lastName: true } } }
        : { male: { select: { firstName: true, lastName: true } } },
    });

    const names: string[] = [];
    for (const match of potentialMatches) {
      const user = isMale ? (match as any).female : (match as any).male;
      if (user?.firstName) names.push(user.firstName);
      if (user?.lastName) names.push(user.lastName);
      if (user?.firstName && user?.lastName) names.push(`${user.firstName} ${user.lastName}`);
    }

    return [...new Set(names)].filter((n) => n.length > 1);
  }

  // ========== Escalation Detection ==========

  static detectEscalationIntent(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      ESCALATION_KEYWORDS_HE.some((kw) => lower.includes(kw)) ||
      ESCALATION_KEYWORDS_EN.some((kw) => lower.includes(kw))
    );
  }

  // ========== Escalate to Matchmaker ==========

  static async escalateToMatchmaker(
    conversationId: string,
    suggestionId: string,
    userId: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    // Get conversation summary for context
    const messages = await prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    if (messages.length === 0) return { success: false };

    // Get the suggestion to find the matchmaker
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: { matchmakerId: true, firstPartyId: true, secondPartyId: true },
    });

    if (!suggestion) return { success: false };

    // Generate a short summary of the AI conversation
    const summary = await this.generateConversationSummary(messages, userId);

    // Create a suggestion message from system to matchmaker
    const msg = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        senderId: userId,
        senderType: 'SYSTEM',
        content: `📋 סיכום שיחת AI (העברה לשדכנית):\n\n${summary}\n\n---\nהמשתמש/ת ביקש/ה לדבר עם שדכנית.`,
        targetUserId: suggestion.matchmakerId,
      },
    });

    return { success: true, messageId: msg.id };
  }

  // ========== Generate Conversation Summary ==========

  static async generateConversationSummary(
    messages: { role: string; content: string }[],
    userId: string,
  ): Promise<string> {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return this.fallbackSummary(messages);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      });

      const result = await model.generateContent(`סכם את שיחת השידוכים הבאה ב-2-3 משפטים בעברית. ציין מה המשתמש/ת מרגיש/ה לגבי ההצעה, מה מטריד ומה מושך. חזור JSON: { "summary": "...", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL|HESITANT", "keyInsights": ["..."] }

שיחה:
${conversationText}

החזר רק JSON, ללא markdown.`);

      const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(text);
      return parsed.summary || this.fallbackSummary(messages);
    } catch {
      return this.fallbackSummary(messages);
    }
  }

  private static fallbackSummary(messages: { role: string; content: string }[]): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) return 'שיחה ללא הודעות משתמש';
    return `המשתמש/ת שלח/ה ${userMessages.length} הודעות. ההודעה האחרונה: "${userMessages[userMessages.length - 1].content.slice(0, 100)}"`;
  }

  // ========== Generate & Save Summary for Matchmaker ==========

  static async generateAndSaveSummary(
    conversationId: string,
    suggestionId: string | null,
    userId: string,
  ): Promise<void> {
    const messages = await prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    if (userMessageCount < SUMMARY_MESSAGE_THRESHOLD) return;

    // Check if we already have a recent summary (avoid duplicate summaries)
    const recentSummary = await prisma.aiChatSummary.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    if (recentSummary && recentSummary.messageCount >= userMessageCount - 1) return;

    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return;

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      });

      const prompt = `סכם את שיחת השידוכים הבאה בצורה שתהיה שימושית לשדכן/ית.
ציין:
1. מה המשתמש/ת מרגיש/ה לגבי ההצעה (אם רלוונטי)
2. מה מושך ומה מטריד אותם
3. נקודות מפתח שהשדכן/ית צריך/ה לדעת
4. האם נוטים לאשר, לדחות, או מתלבטים

החזר JSON:
{
  "summary": "סיכום קצר ב-2-3 משפטים",
  "sentiment": "POSITIVE|NEGATIVE|NEUTRAL|HESITANT",
  "keyInsights": ["תובנה 1", "תובנה 2"]
}

שיחה:
${conversationText}

החזר רק JSON, ללא markdown.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(text);

      await prisma.aiChatSummary.create({
        data: {
          conversationId,
          suggestionId,
          userId,
          summary: parsed.summary || 'לא הצלחנו לייצר סיכום',
          sentiment: parsed.sentiment || 'NEUTRAL',
          keyInsights: parsed.keyInsights || [],
          messageCount: userMessageCount,
        },
      });

      console.log(`[AiChat] Generated summary for conversation ${conversationId}`);
    } catch (err) {
      console.error(`[AiChat] Summary generation failed for ${conversationId}:`, err);
    }
  }

  // ========== Get Proactive Message ==========

  static async getProactiveMessage(
    userId: string,
    suggestionId: string,
    locale: 'he' | 'en',
    trigger: 'pending_reminder' | 'post_decline' | 'post_approve',
  ): Promise<string> {
    const isHebrew = locale === 'he';

    switch (trigger) {
      case 'pending_reminder':
        return isHebrew
          ? 'שמתי לב שעוד לא הגבת להצעה. רוצה שנדבר עליה? אשמח לעזור לך להבין אם זו התאמה טובה.'
          : "I noticed you haven't responded to this suggestion yet. Want to discuss it? I'd love to help you figure out if it's a good match.";
      case 'post_decline':
        return isHebrew
          ? 'תודה על התשובה. רוצה לספר מה חיפשת אחרת? זה יעזור לנו לדייק את ההצעות הבאות שלך.'
          : "Thanks for your response. Want to share what you were looking for differently? It'll help us fine-tune your next suggestions.";
      default:
        return '';
    }
  }

  // ========== Get Summaries for Matchmaker ==========

  static async getSummariesForMatchmaker(
    matchmakerId: string,
    options?: { unreadOnly?: boolean; suggestionId?: string; limit?: number },
  ) {
    return prisma.aiChatSummary.findMany({
      where: {
        ...(options?.unreadOnly ? { isRead: false } : {}),
        ...(options?.suggestionId ? { suggestionId: options.suggestionId } : {}),
        suggestion: {
          matchmakerId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      include: {
        user: { select: { firstName: true, lastName: true } },
        suggestion: {
          select: {
            id: true, status: true,
            firstParty: { select: { firstName: true, lastName: true } },
            secondParty: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  static async markSummaryRead(summaryId: string) {
    return prisma.aiChatSummary.update({
      where: { id: summaryId },
      data: { isRead: true },
    });
  }

  // ========== Quick Reply Suggestions ==========

  static getQuickReplies(
    locale: 'he' | 'en',
    suggestionId: string | null | undefined,
    suggestionStatus: string | null,
    messageCount: number,
  ): string[] {
    const isHebrew = locale === 'he';

    // First message in a suggestion-specific chat
    if (suggestionId && messageCount <= 2) {
      if (suggestionStatus === 'PENDING_FIRST_PARTY' || suggestionStatus === 'PENDING_SECOND_PARTY') {
        return isHebrew
          ? ['ספר/י לי עליו/ה', 'למה אנחנו מתאימים?', 'מה הרקע שלו/ה?']
          : ['Tell me about them', 'Why are we compatible?', "What's their background?"];
      }
    }

    // Suggestion chat with some history
    if (suggestionId && messageCount > 2) {
      if (suggestionStatus === 'PENDING_FIRST_PARTY' || suggestionStatus === 'PENDING_SECOND_PARTY') {
        return isHebrew
          ? ['אני רוצה לאשר', 'יש לי שאלות נוספות', 'העבר לשדכנית']
          : ['I want to approve', 'I have more questions', 'Transfer to matchmaker'];
      }
      if (suggestionStatus === 'CONTACT_DETAILS_SHARED' || suggestionStatus === 'DATING') {
        return isHebrew
          ? ['טיפים לפגישה ראשונה', 'מה לשאול?', 'איך להתכונן?']
          : ['First date tips', 'What to ask?', 'How to prepare?'];
      }
    }

    // General chat (no suggestion)
    if (!suggestionId) {
      if (messageCount <= 2) {
        return isHebrew
          ? ['מה אני מחפש/ת?', 'למה דחיתי הצעות?', 'חפש לי התאמות']
          : ['What am I looking for?', 'Why did I decline suggestions?', 'Find me matches'];
      }
      return isHebrew
        ? ['תעדכן את ההעדפות שלי', 'חפש לי שוב', 'תודה!']
        : ['Update my preferences', 'Search again', 'Thanks!'];
    }

    return [];
  }

  // ========== Chat Action Detection ==========

  static detectActionIntent(message: string): 'approve' | 'decline' | null {
    const lower = message.toLowerCase();
    if (
      APPROVE_INTENT_KEYWORDS_HE.some((kw) => lower.includes(kw)) ||
      APPROVE_INTENT_KEYWORDS_EN.some((kw) => lower.includes(kw))
    ) {
      return 'approve';
    }
    if (
      DECLINE_INTENT_KEYWORDS_HE.some((kw) => lower.includes(kw)) ||
      DECLINE_INTENT_KEYWORDS_EN.some((kw) => lower.includes(kw))
    ) {
      return 'decline';
    }
    return null;
  }

  /**
   * Get available actions for a suggestion based on its status and the user's role
   */
  static async getAvailableActions(
    suggestionId: string,
    userId: string,
  ): Promise<ChatAction[]> {
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: { status: true, firstPartyId: true, secondPartyId: true },
    });

    if (!suggestion) return [];

    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) return [];

    const actions: ChatAction[] = [];

    if (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') {
      actions.push({
        type: 'approve',
        label: { he: 'מעוניין/ת - אשר/י הצעה', en: 'Interested - Approve' },
        status: 'FIRST_PARTY_APPROVED',
        variant: 'positive',
      });
      actions.push({
        type: 'decline',
        label: { he: 'לא מתאים - דחה/י', en: 'Not a match - Decline' },
        status: 'FIRST_PARTY_DECLINED',
        variant: 'negative',
      });
    }

    if (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY') {
      actions.push({
        type: 'approve',
        label: { he: 'מעוניין/ת - אשר/י הצעה', en: 'Interested - Approve' },
        status: 'SECOND_PARTY_APPROVED',
        variant: 'positive',
      });
      actions.push({
        type: 'decline',
        label: { he: 'לא מתאים - דחה/י', en: 'Not a match - Decline' },
        status: 'SECOND_PARTY_DECLINED',
        variant: 'negative',
      });
    }

    return actions;
  }

  // ========== Smart Assistant: Discovery Greeting ==========

  static async generateDiscoveryGreeting(userId: string, locale: 'he' | 'en'): Promise<string> {
    const isHebrew = locale === 'he';

    // Check which questionnaire worlds the user has completed
    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId },
      select: {
        personalityAnswers: true,
        valuesAnswers: true,
        relationshipAnswers: true,
        partnerAnswers: true,
        religionAnswers: true,
      },
    });

    // Count how many answers in each world
    const worldCounts = {
      PERSONALITY: Object.keys((questionnaire?.personalityAnswers as Record<string, unknown>) || {}).length,
      VALUES: Object.keys((questionnaire?.valuesAnswers as Record<string, unknown>) || {}).length,
      RELATIONSHIP: Object.keys((questionnaire?.relationshipAnswers as Record<string, unknown>) || {}).length,
      PARTNER: Object.keys((questionnaire?.partnerAnswers as Record<string, unknown>) || {}).length,
      RELIGION: Object.keys((questionnaire?.religionAnswers as Record<string, unknown>) || {}).length,
    };

    // Pick questions from the world with least answers (most room for discovery)
    const discoveryQuestions = isHebrew ? {
      PERSONALITY: [
        'מה הדבר שהכי חשוב לך באישיות של בן/בת הזוג?',
        'איך היית מתאר/ת את עצמך — יותר מופנם/ת או חברותי/ת?',
        'מה עוזר לך להרגיש רגוע/ה אחרי יום מאתגר?',
        'מה הדבר שהכי מפחיד אותך ביחסים?',
      ],
      VALUES: [
        'מהם שלושת הערכים הכי חשובים לך בחיים?',
        'איך נראה לך הבית שגדלת בו, ומה היית רוצה לשמר או לשנות?',
        'מה חשוב לך יותר — קריירה או משפחה? או שאפשר גם וגם?',
        'מה הדעה שלך על כסף — ביטחון, חוויות, או פשטות?',
      ],
      RELATIONSHIP: [
        'מה המשמעות של זוגיות טובה בשבילך?',
        'איך את/ה מתמודד/ת עם מחלוקות? פותח/ת דיון או צריך/ה זמן?',
        'מה שפת האהבה שלך — מילים, מגע, זמן איכות, מעשים, או מתנות?',
        'מה הדבר הכי חשוב שאת/ה מחפש/ת ביחסים — תמיכה, כיף, צמיחה או ביטחון?',
      ],
      PARTNER: [
        'מה הדבר הראשון שמושך את תשומת הלב שלך במישהו/י חדש/ה?',
        'כמה חשוב לך המראה החיצוני ביחס לתכונות פנימיות?',
        'מה הקווים האדומים שלך — דברים שאתה לא מוכן/ה להתפשר עליהם?',
        'מה היית רוצה שבן/בת הזוג שלך יוסיף/ה לחיים שלך?',
      ],
      RELIGION: [
        'מה המקום של אמונה ורוחניות בחיים שלך?',
        'איך נראית שבת אצלך בבית?',
        'כמה חשוב לך שבן/בת הזוג יהיה/תהיה ברמה דתית דומה?',
        'איך את/ה רואה את החינוך הדתי של ילדים בעתיד?',
      ],
    } : {
      PERSONALITY: [
        "What's the most important personality trait you look for in a partner?",
        'How would you describe yourself — more introverted or outgoing?',
        'What helps you feel calm after a challenging day?',
      ],
      VALUES: [
        'What are your top three values in life?',
        "What's your view on career vs. family balance?",
        'What would you want to keep or change from your childhood home?',
      ],
      RELATIONSHIP: [
        'What does a good relationship mean to you?',
        'How do you handle disagreements — do you talk it out or need time?',
        "What's your love language?",
      ],
      PARTNER: [
        'What first catches your attention when meeting someone new?',
        'What are your absolute deal-breakers?',
        "What would you want a partner to add to your life?",
      ],
      RELIGION: [
        'What role does faith play in your daily life?',
        'How important is it for your partner to share your religious level?',
        'How do you envision raising children religiously?',
      ],
    };

    // Find least-answered world
    const sortedWorlds = Object.entries(worldCounts).sort((a, b) => a[1] - b[1]);
    const targetWorld = sortedWorlds[0][0] as keyof typeof discoveryQuestions;

    // Pick a random question from that world
    const questions = discoveryQuestions[targetWorld];
    const question = questions[Math.floor(Math.random() * questions.length)];

    const greeting = isHebrew
      ? `שלום! 👋 אני העוזר החכם שלך. כל פעם שנדבר, אני לומד יותר על מה שחשוב לך — וזה עוזר לי למצוא לך התאמות טובות יותר.\n\n${question}`
      : `Hi! 👋 I'm your smart assistant. Every time we chat, I learn more about what matters to you — and that helps me find better matches.\n\n${question}`;

    return greeting;
  }

  // ========== Smart Assistant: Get Next Candidate ==========

  static async getNextCandidate(
    userId: string,
    conversationId: string,
  ): Promise<{
    potentialMatchId: string;
    candidateUserId: string;
    aiScore: number;
    shortReasoning: string | null;
    detailedReasoning: string | null;
    candidateCounter?: { shown: number; total: number };
    weeklyUsage?: { used: number; limit: number; remaining: number; resetsAt: string };
    limitReached?: boolean;
  } | null> {
    // Check weekly limit first
    const { WeeklyLimitService } = await import('@/lib/services/weeklyLimitService');
    const weeklyCheck = await WeeklyLimitService.checkAndIncrement(userId);
    if (!weeklyCheck.allowed) {
      // Return a special "limit reached" response instead of null
      return {
        potentialMatchId: '',
        candidateUserId: '',
        aiScore: 0,
        shortReasoning: null,
        detailedReasoning: null,
        limitReached: true,
        weeklyUsage: {
          used: weeklyCheck.used,
          limit: weeklyCheck.limit,
          remaining: weeklyCheck.remaining,
          resetsAt: weeklyCheck.resetsAt,
        },
      };
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) return null;

    const isMale = profile.gender === 'MALE';

    // Get already-presented candidates for this conversation
    const conversation = await prisma.aiChatConversation.findUnique({
      where: { id: conversationId },
      select: { presentedCandidateIds: true },
    });
    const alreadyPresented = (conversation?.presentedCandidateIds as string[]) || [];

    // Query top potential matches
    const matches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE_FOR_SEARCH },
        // Exclude already presented
        ...(alreadyPresented.length > 0
          ? {
              [isMale ? 'femaleUserId' : 'maleUserId']: { notIn: alreadyPresented },
            }
          : {}),
        // Other party must be active and verified
        ...(isMale
          ? {
              female: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                isProfileComplete: true,
                profile: { isNot: null },
              },
            }
          : {
              male: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                isProfileComplete: true,
                profile: { isNot: null },
              },
            }),
      },
      orderBy: { aiScore: 'desc' },
      take: 10,
      select: {
        id: true,
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        shortReasoning: true,
        detailedReasoning: true,
      },
    });

    // Filter: no existing active suggestion between pairs
    for (const match of matches) {
      const candidateUserId = isMale ? match.femaleUserId : match.maleUserId;

      const existingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: match.maleUserId, secondPartyId: match.femaleUserId },
            { firstPartyId: match.femaleUserId, secondPartyId: match.maleUserId },
          ],
          status: { notIn: CLOSED_STATUSES },
        },
      });

      if (existingSuggestion) continue;

      // Check availability
      const candidateProfile = await prisma.profile.findUnique({
        where: { userId: candidateUserId },
        select: { availabilityStatus: true },
      });

      if (candidateProfile?.availabilityStatus !== 'AVAILABLE') continue;

      // Apply feedback reranking for this single match
      try {
        const forReranking = [{
          id: match.id,
          aiScore: match.aiScore,
          maleUserId: match.maleUserId,
          femaleUserId: match.femaleUserId,
          shortReasoning: match.shortReasoning,
          detailedReasoning: match.detailedReasoning,
        }];
        const reranked = await AutoSuggestionFeedbackService.applyFeedbackReranking(forReranking, userId);
        if (reranked[0] && reranked[0].aiScore < MIN_AI_SCORE_FOR_SEARCH) continue;
      } catch {
        // If reranking fails, continue with original score
      }

      // Count total remaining matches for the counter
      const totalCount = await prisma.potentialMatch.count({
        where: {
          ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
          status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
          aiScore: { gte: MIN_AI_SCORE_FOR_SEARCH },
        },
      });

      return {
        potentialMatchId: match.id,
        candidateUserId,
        aiScore: match.aiScore,
        shortReasoning: match.shortReasoning,
        detailedReasoning: match.detailedReasoning,
        candidateCounter: {
          shown: alreadyPresented.length + 1,
          total: totalCount,
        },
        weeklyUsage: {
          used: weeklyCheck.used,
          limit: weeklyCheck.limit,
          remaining: weeklyCheck.remaining,
          resetsAt: weeklyCheck.resetsAt,
        },
      };
    }

    // No candidate found — decrement the weekly count since we didn't actually present anyone
    await prisma.weeklySuggestionUsage.updateMany({
      where: {
        userId,
        weekStart: WeeklyLimitService.getWeekStart(),
      },
      data: { count: { decrement: 1 } },
    });

    return null;
  }

  // ========== Smart Assistant: Get Candidate Profile for Chat ==========

  static async getCandidateProfileForChat(
    candidateUserId: string,
    requestingUserId: string,
  ) {
    // Security: verify the candidate was presented in one of the requesting user's conversations
    const conversation = await prisma.aiChatConversation.findFirst({
      where: {
        userId: requestingUserId,
        status: 'ACTIVE',
        OR: [
          { currentCandidateUserId: candidateUserId },
          // Check if candidateUserId is in presentedCandidateIds (Json array)
          { presentedCandidateIds: { array_contains: candidateUserId } },
        ],
      },
    });

    if (!conversation) return null;

    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isProfileComplete: true,
        profile: true,
      },
    });

    if (!user?.profile) return null;

    const [images, questionnaire] = await Promise.all([
      prisma.userImage.findMany({
        where: { userId: candidateUserId },
        orderBy: { isMain: 'desc' },
      }),
      prisma.questionnaireResponse.findFirst({
        where: { userId: candidateUserId },
      }),
    ]);

    return {
      profile: {
        ...user.profile,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      images,
      questionnaire,
      isProfileComplete: user.isProfileComplete,
    };
  }

  // ========== Smart Assistant: Create Suggestion from Chat ==========

  static async createSuggestionFromChat(
    userId: string,
    candidateUserId: string,
    conversationId: string,
    potentialMatchId: string,
  ) {
    // Determine party order (MALE = maleUser, FEMALE = femaleUser)
    const [userProfile, candidateProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
      prisma.profile.findUnique({ where: { userId: candidateUserId }, select: { gender: true } }),
    ]);

    if (!userProfile || !candidateProfile) {
      throw new Error('Profile not found');
    }

    const isMale = userProfile.gender === 'MALE';
    const firstPartyId = userId;
    const secondPartyId = candidateUserId;

    // Get user's assigned matchmaker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedMatchmakerId: true },
    });

    let matchmakerId = user?.assignedMatchmakerId;

    // Fallback: get from potentialMatch scan
    if (!matchmakerId) {
      const potentialMatch = await prisma.potentialMatch.findUnique({
        where: { id: potentialMatchId },
        select: { scanSessionId: true },
      });
      if (potentialMatch?.scanSessionId) {
        const scanSession = await prisma.scanSession.findUnique({
          where: { id: potentialMatch.scanSessionId },
          select: { matchmakerId: true },
        });
        matchmakerId = scanSession?.matchmakerId || null;
      }
    }

    // Final fallback: first admin user
    if (!matchmakerId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      matchmakerId = admin?.id || userId; // worst case, use the user themselves
    }

    // Get the PotentialMatch reasoning
    const potentialMatch = await prisma.potentialMatch.findUnique({
      where: { id: potentialMatchId },
      select: { aiScore: true, shortReasoning: true },
    });

    // Create the suggestion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const decisionDeadline = new Date();
      decisionDeadline.setDate(decisionDeadline.getDate() + 3);

      const suggestion = await tx.matchSuggestion.create({
        data: {
          matchmakerId: matchmakerId!,
          isAutoSuggestion: true,
          firstPartyId,
          secondPartyId,
          status: 'PENDING_FIRST_PARTY',
          priority: 'MEDIUM',
          matchingReason: potentialMatch?.shortReasoning || `התאמת AI - ציון ${Math.round(potentialMatch?.aiScore || 0)}`,
          firstPartyNotes: 'הצעה שנוצרה מתוך שיחה עם העוזר החכם',
          internalNotes: `הצעה מצ'אט AI | PotentialMatch: ${potentialMatchId} | Score: ${potentialMatch?.aiScore || 0}`,
          decisionDeadline,
          firstPartySent: new Date(),
          lastActivity: new Date(),
          lastStatusChange: new Date(),
        },
      });

      // Create status history
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: suggestion.id,
          status: 'PENDING_FIRST_PARTY',
          notes: 'נוצר מתוך שיחת AI עם העוזר החכם',
        },
      });

      // Update PotentialMatch status
      await tx.potentialMatch.update({
        where: { id: potentialMatchId },
        data: { status: 'SENT' },
      });

      return suggestion;
    });

    // Update the conversation
    await prisma.aiChatConversation.update({
      where: { id: conversationId },
      data: {
        phase: 'discovery',
        currentCandidateUserId: null,
      },
    });

    return result;
  }

  // ========== Smart Assistant: Build Candidate Context for AI ==========

  static async buildCandidateContext(
    candidateUserId: string,
    requestingUserId: string,
    locale: 'he' | 'en',
  ): Promise<string | null> {
    const isHebrew = locale === 'he';

    const [candidateUser, potentialMatch] = await Promise.all([
      prisma.user.findUnique({
        where: { id: candidateUserId },
        select: {
          firstName: true,
          profile: {
            select: {
              gender: true, birthDate: true, city: true,
              religiousLevel: true, occupation: true, education: true,
              about: true, profileHeadline: true,
            },
          },
        },
      }),
      // Get the PotentialMatch between these two users
      prisma.profile.findUnique({
        where: { userId: requestingUserId },
        select: { gender: true },
      }).then(async (p) => {
        if (!p) return null;
        const isMale = p.gender === 'MALE';
        return prisma.potentialMatch.findFirst({
          where: isMale
            ? { maleUserId: requestingUserId, femaleUserId: candidateUserId }
            : { maleUserId: candidateUserId, femaleUserId: requestingUserId },
          select: { aiScore: true, shortReasoning: true, detailedReasoning: true },
        });
      }),
    ]);

    if (!candidateUser?.profile) return null;

    const cp = candidateUser.profile;
    const age = cp.birthDate
      ? Math.floor((Date.now() - new Date(cp.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const parts: string[] = [];
    parts.push(isHebrew ? '\n## הקשר: מועמד/ת מוצג/ת' : '\n## Context: Presented Candidate');
    parts.push(`${isHebrew ? 'שם' : 'Name'}: ${candidateUser.firstName}`);
    if (age) parts.push(`${isHebrew ? 'גיל' : 'Age'}: ${age}`);
    if (cp.city) parts.push(`${isHebrew ? 'עיר' : 'City'}: ${cp.city}`);
    if (cp.religiousLevel) parts.push(`${isHebrew ? 'רמה דתית' : 'Religious level'}: ${cp.religiousLevel}`);
    if (cp.occupation) parts.push(`${isHebrew ? 'מקצוע' : 'Occupation'}: ${cp.occupation}`);
    if (cp.education) parts.push(`${isHebrew ? 'השכלה' : 'Education'}: ${cp.education}`);
    if (cp.about) parts.push(`${isHebrew ? 'על עצמם' : 'About'}: ${cp.about.slice(0, 300)}`);

    if (potentialMatch) {
      if (potentialMatch.aiScore) parts.push(`${isHebrew ? 'ציון התאמה' : 'Match score'}: ${Math.round(potentialMatch.aiScore)}`);
      if (potentialMatch.shortReasoning) parts.push(`${isHebrew ? 'סיבת התאמה' : 'Match reason'}: ${potentialMatch.shortReasoning}`);
      if (potentialMatch.detailedReasoning) parts.push(`${isHebrew ? 'ניתוח מפורט' : 'Detailed analysis'}: ${(potentialMatch.detailedReasoning as string).slice(0, 500)}`);
    }

    return parts.join('\n');
  }

  // ========== Smart Assistant: Update Conversation Phase ==========

  static async updateConversationPhase(
    conversationId: string,
    phase: string,
    candidateUserId?: string | null,
    addToPresentedIds?: string,
  ) {
    const updateData: Record<string, unknown> = { phase };

    if (candidateUserId !== undefined) {
      updateData.currentCandidateUserId = candidateUserId;
    }

    if (addToPresentedIds) {
      const conversation = await prisma.aiChatConversation.findUnique({
        where: { id: conversationId },
        select: { presentedCandidateIds: true },
      });
      const existing = (conversation?.presentedCandidateIds as string[]) || [];
      if (!existing.includes(addToPresentedIds)) {
        updateData.presentedCandidateIds = [...existing, addToPresentedIds];
      }
    }

    return prisma.aiChatConversation.update({
      where: { id: conversationId },
      data: updateData,
    });
  }
}
