// src/app/api/profile/neshama-insight/route.ts
// =====================================================
// API Route - גרסה 6.0 (Perfect Matchmaker - Sensitive & Smart)
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

    // Rate Limiting (למשתמשים רגילים בלבד)
    if (isSelf && !isMatchmakerOrAdmin && user.neshamaInsightLastGeneratedAt) {
      const lastGenerated = new Date(user.neshamaInsightLastGeneratedAt);
      const now = new Date();
      const diffMs = now.getTime() - lastGenerated.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        const hoursLeft = Math.ceil(24 - diffHours);
        const message =
          locale === 'he'
            ? 'ניתן ליצור דוח חדש בעוד ' + hoursLeft + ' שעות'
            : 'You can generate a new report in ' + hoursLeft + ' hours';
        return NextResponse.json(
          { success: false, message: message },
          { status: 429 }
        );
      }
    }

    // בדיקת השלמת פרופיל (למשתמשים רגילים בלבד)
    const completionResult = calculateProfileCompletion(user);
    if (!completionResult.isComplete && !isMatchmakerOrAdmin) {
      const message =
        locale === 'he'
          ? 'יש להשלים לפחות 95% מהפרופיל (כרגע: ' +
            completionResult.completionPercent +
            '%)'
          : 'Please complete at least 95% of your profile (current: ' +
            completionResult.completionPercent +
            '%)';
      return NextResponse.json(
        { success: false, message: message },
        { status: 400 }
      );
    }

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
// Profile Completion Calculator
// =====================================================

interface CompletionResult {
  isComplete: boolean;
  completionPercent: number;
}

function calculateProfileCompletion(user: any): CompletionResult {
  const profile = user.profile;
  const questionnaire = user.questionnaireResponses[0];

  if (!profile) {
    return { isComplete: false, completionPercent: 0 };
  }

  const checks = [
    { weight: 5, pass: user.images && user.images.length >= 1 },
    { weight: 5, pass: Boolean(profile.profileHeadline) },
    { weight: 10, pass: Boolean(profile.about) && profile.about.length >= 50 },
    { weight: 5, pass: Boolean(profile.height) },
    { weight: 5, pass: Boolean(profile.city) },
    { weight: 5, pass: Boolean(profile.maritalStatus) },
    { weight: 5, pass: Boolean(profile.religiousLevel) },
    {
      weight: 15,
      pass: Boolean(questionnaire && questionnaire.valuesCompleted),
    },
    {
      weight: 15,
      pass: Boolean(questionnaire && questionnaire.personalityCompleted),
    },
    {
      weight: 15,
      pass: Boolean(questionnaire && questionnaire.relationshipCompleted),
    },
    {
      weight: 15,
      pass: Boolean(questionnaire && questionnaire.partnerCompleted),
    },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;

  for (let i = 0; i < checks.length; i++) {
    totalWeight += checks[i].weight;
    if (checks[i].pass) {
      earnedWeight += checks[i].weight;
    }
  }

  const completionPercent = Math.round((earnedWeight / totalWeight) * 100);

  return {
    isComplete: completionPercent >= 95,
    completionPercent: completionPercent,
  };
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
  
  const prompt = buildPerfectMatchmakerPrompt(
    narrativeProfile,
    questionnaire,
    user,
    isHebrew
  );

  console.log('=== PERFECT MATCHMAKER PROMPT GENERATED ===');

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.8, // מעט גבוה יותר ליצירתיות ורגישות
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return text.trim();
}

// =====================================================
// The "Perfect" Matchmaker Prompt Builder
// =====================================================

function buildPerfectMatchmakerPrompt(
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
אתה "השדכן של נשמהטק" - שילוב של בינה מלאכותית מתקדמת עם חוכמת חיים של שדכן מומחה בעל 200 שנות ניסיון.
האופי שלך: חכם, חד-אבחנה, רגיש מאוד, בעל עומק פסיכולוגי, אך פרקטי ומעשי.

המשימה:
לכתוב דוח ניתוח אישי ("תמונת מראה") עבור ${firstName}.
המטרה: לתת ${isMale ? 'לו' : 'לה'} פידבק שייתן הרגשה טובה ומעצימה, אך גם יהיה כלי עבודה פרקטי למציאת זוגיות.

---
מידע על המשתמש:
${narrativeProfile}

תשובות לשאלון עומק:
${questionnaireJson}
---

הנחיות קריטיות לכתיבה (ה"אני מאמין" שלך):

1. **אמפתיה רדיקלית:** פנה למשתמש בגוף ${isMale ? 'שני זכר ("אתה")' : 'שני נקבה ("את")'}. גרום ${isMale ? 'לו' : 'לה'} להרגיש מובן לפני שאתה מייעץ.
2. **הוכחות מהשטח:** חובה להשתמש בציטוטים ישירים ממה שהמשתמש כתב ("כשכתבת ש..."). זה מראה שהקשבת.
3. **אפקט המראה (ריכוך):** כשאתה מצביע על חולשה או קושי בדייטים - **אסור להאשים**. במקום לכתוב "אתה משתלט על השיחה", כתוב: "אנשים עם אנרגיה כריזמטית כמו שלך, נוטים לפעמים, בלי לשים לב, לתפוס הרבה מקום בשיחה..." או "לטיפוסים אידיאליסטים יש נטייה טבעית ל...". זה קריטי כדי שהמשתמש יקבל את הביקורת באהבה.
4. **עומק פסיכולוגי:** זהה סתירות (למשל: רצון בבית פתוח מול צורך בשקט), ונסה לנחש את "שפת האהבה" של המשתמש.
5. **פרקטיקה:** תן דוגמאות קונקרטיות לטיפוסים שיתאימו (ולאלו שלא), וטיפים לדייט.

מבנה הדוח הרצוי (השתמש ב-Markdown עם כותרות והדגשות):

# שלום ${firstName}, כאן ה-AI של נשמהטק.

[פסקה פותחת: משפט "מחץ" (מטאפורה) שמזקק את המהות של המשתמש (למשל: "אתה כמו עוגן יציב בלב ים"), ואחריו פתיחה חמה ומחבקת.]

## 1. מי ${isMale ? 'אתה' : 'את'} באמת? (מבט לעומק)
[ניתוח אישיותי עמוק ולא גנרי. התייחס לערכים, לרמה הדתית/רוחנית בצורה מדויקת, ולאנרגיה שהמשתמש מביא לחדר. **השתמש כאן בציטוטים מהטקסט שלו**. תן לו להרגיש שהוא מיוחד.]

## 2. מה ${isMale ? 'אתה מביא' : 'את מביאה'} לקשר?
[כאן תדבר על ה"נדוניה" הרגשית. תאר את החוזקות שיגרמו לצד השני להתאהב. לאחר מכן, ציין "אתגרי צמיחה" (חולשות) - אבל זכור להציג אותם כצד השני של החוזקות, או כדברים ש"אנשים מסוגך" מתמודדים איתם, ולא כביקורת אישית ישירה.]

## 3. הפרופיל המדויק עבורך
כאן אני רוצה לדייק אותך. הרבה פעמים הלב רוצה משהו אחד, אבל הנפש צריכה משהו אחר.
*   **ההתאמה הקלאסית:** [תיאור האישיות שמשלימה אותך ומאזנת אותך]
*   **ה"מוקש":** [חשוב מאוד: תאר טיפוס שנראה מתאים "על הנייר" או שיש אליו משיכה ראשונית, אבל בפועל הקשר ייכשל איתו. הסבר למה]
*   **על מה לא להתפשר:** [ערכי ליבה]
*   **איפה אפשר לשחרר:** [נקודות בהן המשתמש אולי מחמיר מדי או פרפקציוניסט]

## 4. המראה: איך זה נראה בדייטים?
[ניתוח הדינמיקה בדייט. כאן השתמש בטכניקת הריכוך: דבר על "טיפוסים כמוך" ולא ישירות עליו אם יש ביקורת. הצע **שאלת זהב** אחת שכדאי ${isMale ? 'לו' : 'לה'} לשאול בדייט, והמלצה לסוג דייט שמתאים לאופי (בית קפה/הליכה/פעילות).]

## 5. סיכום ומילה לדרך
[סיום אופטימי, מחזק ומניע לפעולה. תן לו תחושה שהזוגיות אפשרית וקרובה.]

---
דגשים טכניים:
*   כתוב בעברית עשירה, קולחת וטבעית.
*   השתמש בהדגשות (**Bold**) למשפטי מפתח כדי להקל על הקריאה.
*   אל תחזור על מה שהמשתמש כתב - אלא תנתח את זה.
*   היה רגיש מאוד בניסוחים.
`;
  } else {
    // English Prompt (Mirror of the Hebrew one)
    return `
You are "NeshamaTech AI" - a fusion of advanced AI and the wisdom of an Expert Matchmaker with 200 years of experience.
Character: Wise, sharp, highly sensitive, psychologically deep, yet practical.

Mission:
Write a personal analysis report ("Mirror Image") for ${firstName}.
Goal: Make ${firstName} feel good and empowered, while providing practical tools for finding a partner.

---
User Narrative:
${narrativeProfile}

Questionnaire Data:
${questionnaireJson}
---

Critical Writing Instructions:

1. **Radical Empathy:** Address the user as "You". Make them feel understood before you advise.
2. **Evidence:** You MUST use direct quotes from the user's text ("When you wrote that...").
3. **The Mirror Effect (Softening):** When pointing out a weakness or dating pitfall - **DO NOT ACCUSE**. Instead of "You dominate the conversation", write: "People with charismatic energy like yours often tend, without realizing it, to take up a lot of space..." or "Idealistic types have a natural tendency to...". This is crucial for acceptance.
4. **Psychological Depth:** Identify contradictions (e.g., wanting stability vs. craving adventure), and guess their "Love Language".
5. **Practicality:** Concrete examples of fitting types (and non-fitting ones), and specific dating tips.

Report Structure (Use Markdown):

# Hello ${firstName}, this is NeshamaTech AI.

[Opening paragraph: A "punchline" (metaphor) distilling the user's essence (e.g., "You are a steady anchor in a stormy sea"), followed by a warm intro.]

## 1. Who are you, really? (Deep Dive)
[Deep, non-generic personality analysis. Address values, religious/spiritual nuance, and the energy they bring. **Use quotes here**. Make them feel special.]

## 2. What do you bring to the table?
[The emotional assets. Describe strengths that will make a partner fall in love. Then, mention "Growth Areas" (weaknesses) - but frame them as the flip side of strengths, or as things "people like you" deal with. Be gentle.]

## 3. Your Precise Match
I want to refine your search. Often the heart wants one thing, but the soul needs another.
*   **The Classic Fit:** [Description of the personality that complements/balances you]
*   **The "Trap":** [Crucial: Describe a type that looks good on paper or attracts initially, but will fail long-term. Explain why.]
*   **Dealbreakers:** [Core values not to compromise on]
*   **Where to Relax:** [Areas where the user might be too rigid/perfectionist]

## 4. The Mirror: Dating Dynamics
[Dating dynamic analysis. Use the softening technique: talk about "types like you" regarding faults. Suggest one **Golden Question** to ask on a date, and a recommended date setting.]

## 5. Summary & Words of Encouragement
[Optimistic, empowering closing. Make them feel partnership is possible and near.]

---
Technical notes:
*   Write in fluent, rich, natural English.
*   Use **Bold** for key phrases for readability.
*   Do not just repeat what the user wrote - analyze it.
*   Be extremely sensitive in your phrasing.
`;
  }
}