// src/app/api/profile/neshama-insight/route.ts
// =====================================================
// API Route - v9.0 — Structured JSON output
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateNarrativeProfile } from '@/lib/services/profileAiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Language, UserRole } from '@prisma/client';
import { isValidInsightReport, type NeshamaInsightReport } from '@/types/neshamaInsight';

// =====================================================
// GET Handler — Load saved report
// =====================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;

    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isPrivileged =
      requester?.role === UserRole.MATCHMAKER || requester?.role === UserRole.ADMIN;
    const isSelf = userId === session.user.id;

    if (!isSelf && !isPrivileged) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        neshamaInsightData: true,
        neshamaInsightLastGeneratedAt: true,
        neshamaInsightGeneratedCount: true,
      },
    });

    if (!user?.neshamaInsightData) {
      return NextResponse.json({ success: true, report: null });
    }

    return NextResponse.json({
      success: true,
      report: user.neshamaInsightData,
      lastGeneratedAt: user.neshamaInsightLastGeneratedAt,
    });
  } catch (error) {
    console.error('Error loading Neshama Insight:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST Handler — Generate new report
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const userId = body.userId;
    const locale = body.locale || 'he';

    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    const isPrivileged =
      requester?.role === UserRole.MATCHMAKER || requester?.role === UserRole.ADMIN;
    const isSelf = userId === session.user.id;

    if (!isSelf && !isPrivileged) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    // Rate Limiting — once per 7 days for regular users
    if (isSelf && !isPrivileged && user.neshamaInsightLastGeneratedAt) {
      const diffMs = Date.now() - new Date(user.neshamaInsightLastGeneratedAt).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const COOLDOWN_HOURS = 168; // 7 days

      if (diffHours < COOLDOWN_HOURS) {
        const daysLeft = Math.ceil((COOLDOWN_HOURS - diffHours) / 24);
        const message =
          locale === 'he'
            ? `ניתן ליצור דוח חדש בעוד ${daysLeft} ${daysLeft === 1 ? 'יום' : 'ימים'}`
            : `You can generate a new report in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
        return NextResponse.json({ success: false, message }, { status: 429 });
      }
    }

    // 1. Generate narrative profile (includes all data: profile, questionnaire, soul fingerprint)
    const narrativeProfile = await generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      throw new Error('Failed to generate narrative profile');
    }

    // 2. Generate structured report via AI
    const report = await generateStructuredInsight(
      narrativeProfile,
      user,
      locale as Language
    );

    // 3. Save to DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        neshamaInsightLastGeneratedAt: new Date(),
        neshamaInsightGeneratedCount: { increment: 1 },
        neshamaInsightData: report as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error generating Neshama Insight:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// AI Structured Report Generator
// =====================================================

async function generateStructuredInsight(
  narrativeProfile: string,
  user: any,
  locale: Language
): Promise<NeshamaInsightReport> {
  const isHebrew = locale === 'he';
  const prompt = buildStructuredPrompt(narrativeProfile, user, isHebrew);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 12288,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON response
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('AI returned invalid JSON');
    }
  }

  // Validate structure
  if (!isValidInsightReport(parsed)) {
    console.error('AI returned invalid report structure:', JSON.stringify(parsed).slice(0, 500));
    // Build a fallback from whatever we got
    const fallback = parsed as Record<string, any>;
    return {
      tldr: fallback.tldr || '',
      opening: fallback.opening || '',
      soulMap: fallback.soulMap || '',
      strengths: fallback.strengths || '',
      growthChallenges: fallback.growthChallenges || '',
      classicFit: fallback.classicFit || '',
      trap: fallback.trap || '',
      dealbreakers: fallback.dealbreakers || '',
      whereToRelax: fallback.whereToRelax || '',
      datingDynamics: fallback.datingDynamics || '',
      goldenQuestions: Array.isArray(fallback.goldenQuestions) ? fallback.goldenQuestions : [],
      recommendedDate: fallback.recommendedDate || '',
      actionSteps: Array.isArray(fallback.actionSteps) ? fallback.actionSteps : [],
      closingWords: fallback.closingWords || '',
      profileTips: fallback.profileTips || undefined,
    };
  }

  return parsed;
}

// =====================================================
// Structured Prompt Builder
// =====================================================

function buildStructuredPrompt(
  narrativeProfile: string,
  user: any,
  isHebrew: boolean
): string {
  const firstName = user.firstName || '';
  const isMale = user.profile?.gender === 'MALE';
  const genderPronoun = isMale ? 'אתה' : 'את';
  const genderSuffix = isMale ? '' : 'ה';

  if (isHebrew) {
    return `אתה ה-AI של נשמהטק — שדכן מומחה, רגיש, חכם ומדויק.

המשימה: לכתוב דוח ניתוח אישי מובנה עבור ${firstName}.
המטרה: פידבק מעצים, פרקטי ומדויק למציאת זוגיות. לא שטחי, לא כללי — ספציפי ל${firstName}.

═══════════════════════════════════════
מידע מלא על ${firstName}:
═══════════════════════════════════════
${narrativeProfile}
═══════════════════════════════════════

הנחיות סגנון קריטיות:

1. פנה בגוף ${isMale ? 'שני זכר ("אתה")' : 'שני נקבה ("את")'} לאורך כל הדוח.
2. כתוב בעברית עשירה, חיה ורגישה. כל פסקה צריכה להיות משמעותית — לא מילות מילוי.
3. מטאפורות חיוביות בלבד: עוגן, בית, מגדלור, שורשים, גן, אור.
   אסור בהחלט: תהום, סערה, מלחמה, גשר רעוע, חושך.
4. השתמש בציטוטים ישירים ממה ש${firstName} כתב${isMale ? '' : 'ה'} — זה יוצר חיבור.
5. "אפקט המראה": כשאתה מנתח חולשות, אל תפנה אצבע. דבר על הטיפוס: "אנשים עם עוצמה כזו נוטים לפעמים..." ולא "${genderPronoun} עוש${isMale ? 'ה' : 'ה'} ככה".
6. שלב תובנות מטביעת הנשמה (Soul Fingerprint) — התגיות, הערכים, סגנון הזוגיות.
7. כל שדה טקסטואלי חייב להיות פסקה עשירה ומפורטת (5-10 משפטים לפחות). אל תקצר!
8. goldenQuestions — 3 שאלות ספציפיות שמתאימות לאישיות של ${firstName}, לא שאלות גנריות.
9. actionSteps — 3 צעדים קונקרטיים ומעשיים שאפשר ליישם החודש.
10. profileTips — בנוסף לדוח האישי, נתח את שלמות הפרופיל ותן המלצות לשיפור. בדוק: תמונות, תיאור אישי, שאלון מפת הנשמה, העדפות, כותרת פרופיל, סיפור אישי, תחביבים ותכונות.

החזר JSON בדיוק במבנה הזה (כל הערכים בעברית):

{
  "tldr": "תמצית ב-2-3 משפטים בלבד: מי ${genderPronoun}, מה ${genderPronoun} מחפש${genderSuffix}, ומה ייחודי ב${isMale ? 'ך' : 'ך'}. קצר, חד ומדויק.",
  "opening": "פסקה פותחת עם מטאפורה חיובית שמזקקת את המהות של ${firstName}. תחושת חיבוק, יציבות וכוח. פתח ב: שלום ${firstName}, כאן ה-AI של נשמהטק.",
  "soulMap": "ניתוח אישיותי עמוק: מי ${genderPronoun} באמת מתחת לשכבות. התייחס לערכים, לרוחניות, לתכונות מטביעת הנשמה, לסגנון ההתקשרות. שלב ציטוטים ישירים. הראה ש${genderPronoun} מובן${genderSuffix}.",
  "strengths": "מה ${genderPronoun} מביא${genderSuffix} לקשר — החוזקות הרגשיות, מה שמישהו לצד${isMale ? 'ך' : 'ך'} ירגיש. תאר איך זה מתבטא ביומיום.",
  "growthChallenges": "אתגרי צמיחה — בצורה עדינה ומכילה. כחלק מהטיפוס האישיותי, לא כפגם. השתמש באפקט המראה: 'טיפוסים עם האנרגיה הזו נוטים...'",
  "classicFit": "דיוקן בן/בת הזוג שמשלימ${isMale ? 'ה' : ''} — לא רשימת תכונות יבשה אלא תיאור חי: איך ${isMale ? 'היא' : 'הוא'} נראית, מרגיש${isMale ? 'ה' : ''}, פועל${isMale ? 'ת' : ''}. מבוסס על תגיות טביעת הנשמה, סגנון זוגיות וחזון משפחתי.",
  "trap": "הטיפוס שנראה מתאים בהתחלה אך לא יחזיק מעמד — הסבר למה. מה מושך בהתחלה ומה נשבר אחרי שלושה חודשים.",
  "dealbreakers": "ערכי ליבה שאסור להתפשר עליהם — מגזר, רוחניות, ערכים שמגדירים את הזהות. הסבר למה אלה קריטיים עבור ${firstName} ספציפית.",
  "whereToRelax": "מקומות שבהם ${firstName} אולי מחמיר${genderSuffix} מדי ואפשר לשחרר — השווה בין מה שביקש${genderSuffix} לבין מה שעולה מהפרופיל. תן דוגמאות.",
  "datingDynamics": "איך הדייטים של ${firstName} כנראה נראים — הדינמיקה, מה קורה, מה עובד ומה פחות. השתמש בשפה מכלילה. הצע סוג דייט ראשון שמתאים.",
  "goldenQuestions": ["שאלה ספציפית 1 לדייט שחושפת תאימות עמוקה", "שאלה ספציפית 2 שבודקת ערכים", "שאלה ספציפית 3 שפותחת שיחה אמיתית"],
  "recommendedDate": "סוג הדייט שהכי מתאים לאופי של ${firstName} — איפה, מה לעשות, ולמה דווקא זה יביא את הצד הטוב ${isMale ? 'שלו' : 'שלה'} החוצה.",
  "actionSteps": ["צעד קונקרטי 1 ליישום החודש", "צעד קונקרטי 2", "צעד קונקרטי 3"],
  "closingWords": "סיום אופטימי ומעצים — משפט שנשאר בראש, מחזק ומניע לפעולה. אישי ל${firstName}.",
  "profileTips": {
    "personalitySummary": "סיכום אישיות קצר ב-2-3 משפטים — מי ${genderPronoun} כבן/בת אדם",
    "lookingForSummary": "סיכום מה ${genderPronoun} מחפש${genderSuffix} בבן/בת זוג ב-2-3 משפטים",
    "completenessReport": [
      {"area": "שם התחום", "status": "COMPLETE או PARTIAL או MISSING", "feedback": "משפט ספציפי — מה חסר או מה אפשר לשפר"}
    ],
    "actionableTips": [
      {"area": "שם התחום", "tip": "טיפ קונקרטי ומעשי לשיפור הפרופיל — ספציפי ל${firstName}"}
    ]
  }
}`;
  }

  // English prompt
  return `You are NeshamaTech AI — an expert, sensitive, wise, and precise matchmaker.

Mission: Write a structured personal analysis report for ${firstName}.
Goal: Empowering, practical, and precise feedback for finding a partner. Not generic — specific to ${firstName}.

═══════════════════════════════════════
Full data on ${firstName}:
═══════════════════════════════════════
${narrativeProfile}
═══════════════════════════════════════

Critical style guidelines:

1. Address ${firstName} as "you" throughout.
2. Write in rich, vivid, sensitive language. Every paragraph must be meaningful — no filler.
3. Positive metaphors only: anchor, home, lighthouse, roots, garden, light.
   Strictly forbidden: abyss, storm, battle, shaky bridge, darkness.
4. Use direct quotes from what ${firstName} wrote — this creates connection.
5. "Mirror Effect": When analyzing weaknesses, don't point fingers. Speak about the type: "People with this kind of energy tend to..." not "You do this."
6. Weave in Soul Fingerprint insights — tags, values, relationship style.
7. Every text field must be a rich, detailed paragraph (5-10 sentences minimum). Do not shorten!
8. goldenQuestions — 3 specific questions tailored to ${firstName}'s personality, not generic ones.
9. actionSteps — 3 concrete, actionable steps that can be implemented this month.
10. profileTips — In addition to the personal report, analyze profile completeness and provide improvement tips. Check: photos, personal description, Soul Map questionnaire, preferences, profile headline, personal story, hobbies and traits.

Return JSON in exactly this structure (all values in English):

{
  "tldr": "2-3 sentence summary: who you are, what you seek, and what's unique about you. Short, sharp, precise.",
  "opening": "Opening paragraph with a positive metaphor distilling ${firstName}'s essence. Warmth, stability, strength. Start with: Hello ${firstName}, this is NeshamaTech AI.",
  "soulMap": "Deep personality analysis: who you really are beneath the layers. Address values, spirituality, Soul Fingerprint traits, attachment style. Include direct quotes. Show you understand.",
  "strengths": "What you bring to a relationship — emotional strengths, what someone beside you will feel. Describe how it shows up day-to-day.",
  "growthChallenges": "Growth challenges — gently and inclusively. As part of the personality type, not a flaw. Use the Mirror Effect: 'Types with this energy tend to...'",
  "classicFit": "Portrait of the complementing partner — not a dry trait list but a vivid description: how they look, feel, act. Based on Soul Fingerprint tags, relationship style, family vision.",
  "trap": "The type that looks good initially but won't last — explain why. What attracts at first and what breaks after three months.",
  "dealbreakers": "Core values that must not be compromised — sector, spirituality, identity-defining values. Explain why these are critical for ${firstName} specifically.",
  "whereToRelax": "Areas where ${firstName} might be too rigid and could loosen up — compare stated preferences vs. what the profile reveals. Give examples.",
  "datingDynamics": "How ${firstName}'s dates probably look — the dynamics, what works and what doesn't. Use inclusive language. Suggest an ideal first date type.",
  "goldenQuestions": ["Specific question 1 for a date that reveals deep compatibility", "Specific question 2 testing values", "Specific question 3 opening real conversation"],
  "recommendedDate": "The date type that best suits ${firstName}'s personality — where, what to do, and why this brings out the best side.",
  "actionSteps": ["Concrete step 1 to implement this month", "Concrete step 2", "Concrete step 3"],
  "closingWords": "Optimistic, empowering closing — a memorable sentence that strengthens and motivates. Personal to ${firstName}.",
  "profileTips": {
    "personalitySummary": "Short 2-3 sentence personality summary — who ${firstName} is as a person",
    "lookingForSummary": "Short 2-3 sentence summary of what ${firstName} is looking for in a partner",
    "completenessReport": [
      {"area": "Area name", "status": "COMPLETE or PARTIAL or MISSING", "feedback": "Specific sentence — what's missing or what can be improved"}
    ],
    "actionableTips": [
      {"area": "Area name", "tip": "Concrete, actionable tip for improving the profile — specific to ${firstName}"}
    ]
  }
}`;
}
