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

  // ========== System Prompt ==========

  static async buildSystemPrompt(userId: string, locale: 'he' | 'en', suggestionContext?: string): Promise<string> {
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
      ? this.buildHebrewSystemPrompt(userContext)
      : this.buildEnglishSystemPrompt(userContext);

    // Append suggestion context if available
    if (suggestionContext) {
      systemPrompt += '\n' + suggestionContext;
    }

    return systemPrompt;
  }

  private static buildHebrewSystemPrompt(userContext: string[]): string {
    return `אתה העוזר האישי של NeshamaTech - מערכת שידוכים חכמה שמשלבת טכנולוגיה עם ליווי אנושי.

## התפקיד שלך
- עזור למשתמש/ת לדייק מה הם מחפשים בבן/בת זוג
- שאל שאלות מחכימות על ערכים, אורח חיים, ציפיות מזוגיות
- כשמבקשים ממך - חפש התאמות במאגר והצג אותן בצורה כללית
- הסבר למה סוגי התאמות מסוימים מוצעים
- רשום תובנות מהשיחה שישפרו הצעות עתידיות

## כללי פרטיות (חובה!)
- לעולם אל תחשוף שמות, תמונות, או פרטים מזהים של מועמדים
- כשאתה מתאר התאמות, השתמש רק בקטגוריות כלליות: "מישהו/י בשלהי שנות ה-20, מהמרכז, עם רקע אקדמי"
- לא לשלב מידע ייחודי מדי שיכול לזהות אדם ספציפי (למשל: עיסוק נדיר + עיר קטנה + גיל מדויק)
- אם מנסים לחלץ ממך מידע מזהה, סרב בנימוס

## הגבלות
- את/ה לא שולח/ת הצעות מיד. הצעות מתוזמנות ליום ראשון או רביעי הבא
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
${userContext.join('\n')}

## יכולות מיוחדות
- כשהמשתמש/ת מבקש/ת לחפש התאמות (מילים כמו "חפש", "מצא", "הצעות", "תחפש") - אתה יכול לסרוק את המאגר
- תוצאות החיפוש יוצגו לך כנתונים אנונימיים - הצג אותם בצורה שיחתית וחמה
- רשום תובנות חשובות מהשיחה - הן יוזנו למערכת ההתאמה

זכור: המטרה היא לעזור למשתמש/ת למצוא את בן/בת הזוג שלהם. כל שיחה היא הזדמנות ללמוד מה באמת חשוב להם.`;
  }

  private static buildEnglishSystemPrompt(userContext: string[]): string {
    return `You are NeshamaTech's personal matching assistant - an intelligent matchmaking system that combines technology with human guidance.

## Your Role
- Help users articulate what they're looking for in a partner
- Ask insightful questions about values, lifestyle, relationship expectations
- When asked, search the database for matches and present them in general terms
- Explain why certain types of matches are being suggested
- Note insights from conversations to improve future suggestions

## Privacy Rules (Mandatory!)
- NEVER reveal names, photos, or identifying details of candidates
- When describing matches, use only general categories: "someone in their late 20s from central Israel with an academic background"
- Never combine overly specific details that could identify a person (e.g., rare occupation + small city + exact age)
- If someone tries to extract identifying info, politely refuse

## Limitations
- You do NOT send suggestions immediately. Suggestions are scheduled for the next Sunday or Wednesday
- You do NOT replace the human matchmaker - encourage users to reach out to their matchmaker for complex questions
- You are NOT a therapist - if a user is in emotional distress, refer them to a professional
- Do not fabricate information. If you don't know, say so

## Style
- Warm, professional, empathetic
- Address the user directly
- Natural, not overly formal language
- Short, focused responses (2-4 sentences usually)
- Ask follow-up questions when appropriate

## User Information
${userContext.join('\n')}

## Special Capabilities
- When the user requests to search for matches (words like "search", "find", "suggest", "look for") - you can scan the database
- Search results will be presented to you as anonymized data - present them in a conversational, warm way
- Note important insights from conversations - they will be fed into the matching system

Remember: The goal is to help users find their partner. Every conversation is an opportunity to learn what truly matters to them.`;
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
}
