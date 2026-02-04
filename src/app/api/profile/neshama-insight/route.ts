// src/app/api/profile/neshama-insight/route.ts
// =====================================================
// API Route - גרסה 8.0 (ללא בדיקת השלמה כפולה)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateNarrativeProfile } from '@/lib/services/profileAiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Language, UserRole } from '@prisma/client';

// =====================================================
// POST Handler
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const userId = body.userId;
    const locale = body.locale || 'he';

    // בדיקת הרשאות
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    const isMatchmakerOrAdmin =
      requester?.role === UserRole.MATCHMAKER ||
      requester?.role === UserRole.ADMIN;
    const isSelf = userId === session.user.id;

    if (!isSelf && !isMatchmakerOrAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // שליפת נתוני המשתמש
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: {
          take: 1,
          orderBy: { lastSaved: 'desc' },
        },
      },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    // Rate Limiting - רק למשתמשים רגילים
    if (isSelf && !isMatchmakerOrAdmin && user.neshamaInsightLastGeneratedAt) {
      const lastGenerated = new Date(user.neshamaInsightLastGeneratedAt);
      const now = new Date();
      const diffMs = now.getTime() - lastGenerated.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        const hoursLeft = Math.ceil(24 - diffHours);
        const message =
          locale === 'he'
            ? `ניתן ליצור דוח חדש בעוד ${hoursLeft} שעות`
            : `You can generate a new report in ${hoursLeft} hours`;
        return NextResponse.json(
          { success: false, message },
          { status: 429 }
        );
      }
    }

    // ========================================================
    // הערה: בדיקת השלמת פרופיל הוסרה מכאן!
    // הבדיקה מתבצעת בצד הקליינט (NeshmaInsightButton)
    // שמקבל את אחוז ההשלמה מ-ProfileChecklist.
    // זה מונע פערים בין שני חישובים שונים.
    // ========================================================

    // 1. יצירת פרופיל נרטיבי
    const narrativeProfile = await generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      throw new Error('Failed to generate narrative profile');
    }

    // 2. יצירת הדוח ב-AI עם הפרומפט המשופר
    const insightText = await generateNeshmaInsightText(
      narrativeProfile,
      user,
      locale as Language
    );

    // 3. עדכון מסד הנתונים
    await prisma.user.update({
      where: { id: userId },
      data: {
        neshamaInsightLastGeneratedAt: new Date(),
        neshamaInsightGeneratedCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      insight: insightText,
    });
  } catch (error) {
    console.error('Error generating Neshama Insight:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// AI Insight Generator
// =====================================================

async function generateNeshmaInsightText(
  narrativeProfile: string,
  user: any,
  locale: Language
) {
  const questionnaire = user.questionnaireResponses[0];
  const isHebrew = locale === 'he';

  const prompt = buildCleanMatchmakerPrompt(
    narrativeProfile,
    questionnaire,
    user,
    isHebrew
  );

  console.log('=== CLEAN MATCHMAKER PROMPT GENERATED ===');

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  let text = result.response.text();

  // ניקוי נוסף ליתר ביטחון (למקרה שה-AI בכל זאת הוסיף Markdown)
  text = text.replace(/[*#]/g, '').trim();

  return text;
}

// =====================================================
// The "Clean" Matchmaker Prompt Builder
// =====================================================

function buildCleanMatchmakerPrompt(
  narrativeProfile: string,
  questionnaire: any,
  user: any,
  isHebrew: boolean
): string {
  const firstName = user.firstName || '';
  const isMale = user.profile && user.profile.gender === 'MALE';

  const questionnaireData = questionnaire
    ? {
        values: questionnaire.valuesAnswers || {},
        personality: questionnaire.personalityAnswers || {},
        relationship: questionnaire.relationshipAnswers || {},
        partner: questionnaire.partnerAnswers || {},
      }
    : {};
  const questionnaireJson = JSON.stringify(questionnaireData, null, 2);

  if (isHebrew) {
    return `
אתה ה-AI של נשמהטק, המשמש כשדכן מומחה, רגיש וחכם.

המשימה:
לכתוב דוח ניתוח אישי עבור ${firstName}.
המטרה: לתת ${isMale ? 'לו' : 'לה'} פידבק מעצים, נעים לקריאה, אך פרקטי ומדויק למציאת זוגיות.

---
מידע על המשתמש:
${narrativeProfile}

תשובות לשאלון:
${questionnaireJson}
---

הנחיות קריטיות לעיצוב וסגנון:

1. **טקסט נקי בלבד:** אל תשתמש בשום סימן עיצוב מיוחד. אסור להשתמש ב-# (סולמיות), אסור להשתמש ב-* (כוכביות) להדגשה או לבולטים. כתוב רק טקסט רגיל, נקי ופשוט.
2. **מבנה:** הפרד בין הפסקאות והחלקים השונים באמצעות שורות רווח כפולות. הכותרות של הסעיפים צריכות להיות טקסט רגיל בשורה נפרדת.
3. **מטאפורות חיוביות בלבד:** בפתיחה, השתמש בדימוי חיובי, יציב ומעצים (כמו "עוגן", "בית", "מגדלור", "שורשים"). **אסור בתכלית האיסור** להשתמש בדימויים מפחידים, שליליים או מלחיצים (כמו "תהום", "גשר רעוע", "סערה", "מלחמה"). המטרה היא לתת למשתמש ביטחון.
4. **אמפתיה ורגישות:** פנה למשתמש בגוף ${isMale ? 'שני זכר ("אתה")' : 'שני נקבה ("את")'}.
5. **ציטוטים:** השתמש בציטוטים מדויקים ממה שהמשתמש כתב כדי להראות שהבנת אותו.
6. **"אפקט המראה" (ריכוך):** כשאתה מנתח דינמיקה בדייטים או חולשות, אל תפנה אצבע מאשימה ("אתה משתלט"). במקום זאת, דבר על הטיפוס הכללי: "אנשים עם כריזמה טבעית כמו שלך, לעיתים נוטים בלי לשים לב לקחת הרבה מקום בשיחה...". זה קריטי לקבלה של הדברים.

מבנה הדוח הרצוי (טקסט נקי, ללא Markdown):

שלום ${firstName}, כאן ה-AI של נשמהטק.

[פסקה פותחת: מטאפורה חיובית ומחבקת שמזקקת את המהות של המשתמש. משהו שנותן תחושת יציבות וכוח.]

1. מי ${isMale ? 'אתה' : 'את'} באמת? (מבט לעומק)
[ניתוח אישיותי עמוק. התייחס לערכים ולרוחניות. השתמש בציטוטים מהטקסט שלו.]

2. מה ${isMale ? 'אתה מביא' : 'את מביאה'} לקשר?
[תיאור החוזקות הרגשיות. לאחר מכן, תיאור "אתגרי צמיחה" בצורה עדינה ומכילה, כחלק מהטיפוס האישיותי ולא כפגם אישי.]

3. הפרופיל המדויק עבורך
כאן אני רוצה לדייק אותך. הרבה פעמים הלב רוצה משהו אחד, אבל הנפש צריכה משהו אחר.
ההתאמה הקלאסית: [תיאור האישיות שמשלימה ומאזנת]
המוקש: [תיאור טיפוס שנראה מתאים בהתחלה אך לא יחזיק מעמד - הסבר למה]
על מה לא להתפשר: [ערכי ליבה]
איפה אפשר לשחרר: [מקומות בהם המשתמש אולי מחמיר מדי]

4. המראה: איך זה נראה בדייטים?
[ניתוח הדינמיקה בדייט. השתמש בשפה מכלילה ("טיפוסים כמוך...") כדי לא לפגוע. הצע שאלת זהב אחת שכדאי לשאול בדייט, והמלצה לסוג דייט שמתאים לאופי.]

5. סיכום ומילה לדרך
[סיום אופטימי, מחזק ומניע לפעולה.]

---
זכור: שפה עשירה, רגישה, וללא שום סימני עיצוב מיוחדים.
`;
  } else {
    return `
You are NeshamaTech AI, acting as an expert, sensitive, and wise matchmaker.

Mission:
Write a personal analysis report for ${firstName}.
Goal: Give ${firstName} empowering feedback that is pleasant to read, yet practical and accurate for finding a partner.

---
User Narrative:
${narrativeProfile}

Questionnaire Data:
${questionnaireJson}
---

Critical Style & Formatting Instructions:

1. **Clean Text Only:** Do NOT use any special formatting characters. NO hashtags (#), NO asterisks (*) for bolding or bullets. Write only plain, clean text.
2. **Structure:** Separate paragraphs and sections using double line breaks. Section titles should be plain text on a separate line.
3. **Positive Metaphors Only:** In the opening, use a positive, stable, and empowering image (like "anchor", "home", "lighthouse", "roots"). You are **STRICTLY FORBIDDEN** from using scary, negative, or stressful imagery (like "abyss", "shaky bridge", "storm", "battle"). The goal is to give the user confidence.
4. **Empathy:** Address the user as "You".
5. **Quotes:** Use direct quotes from what the user wrote.
6. **The "Mirror Effect" (Softening):** When analyzing dating dynamics or weaknesses, do NOT point an accusing finger ("You dominate"). Instead, talk about the general type: "People with natural charisma like yours, sometimes tend without realizing it to take up a lot of space in conversation...". This is crucial.

Desired Report Structure (Clean text, NO Markdown):

Hello ${firstName}, this is NeshamaTech AI.

[Opening paragraph: A positive, embracing metaphor distilling the user's essence. Something that gives a sense of stability and strength.]

1. Who are you, really? (Deep Dive)
[Deep personality analysis. Address values and spirituality. Use quotes from their text.]

2. What do you bring to the table?
[Describe emotional strengths. Then, describe "growth challenges" gently and inclusively, as part of the personality type rather than a personal flaw.]

3. Your Precise Match
I want to refine your search. Often the heart wants one thing, but the soul needs another.
The Classic Fit: [Description of the personality that complements/balances you]
The Trap: [Description of a type that looks good initially but won't last - explain why]
Dealbreakers: [Core values]
Where to Relax: [Areas where the user might be too rigid]

4. The Mirror: Dating Dynamics
[Dating dynamic analysis. Use inclusive language ("Types like you...") to avoid offense. Suggest one Golden Question to ask on a date, and a recommended date setting.]

5. Summary & Words of Encouragement
[Optimistic, empowering closing.]

---
Remember: Rich, sensitive language, and NO special formatting characters.
`;
  }
}