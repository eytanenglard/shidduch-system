// src/app/api/profile/shidduch-card/route.ts
// API Route — Shidduch Card (כרטיס שידוכים) Generation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateNarrativeProfile } from '@/lib/services/profileAiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Language, UserRole } from '@prisma/client';
import { isValidShidduchCard, type ShidduchCard } from '@/types/shidduchCard';

// =====================================================
// GET Handler — Load saved card
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
        shidduchCardData: true,
        shidduchCardLastGeneratedAt: true,
        shidduchCardGeneratedCount: true,
      },
    });

    if (!user?.shidduchCardData) {
      return NextResponse.json({ success: true, card: null });
    }

    return NextResponse.json({
      success: true,
      card: user.shidduchCardData,
      lastGeneratedAt: user.shidduchCardLastGeneratedAt,
    });
  } catch (error) {
    console.error('Error loading Shidduch Card:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST Handler — Generate new card
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

    // Rate Limiting — once per 3 days for regular users
    if (isSelf && !isPrivileged && user.shidduchCardLastGeneratedAt) {
      const diffMs = Date.now() - new Date(user.shidduchCardLastGeneratedAt).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const COOLDOWN_HOURS = 72; // 3 days

      if (diffHours < COOLDOWN_HOURS) {
        const daysLeft = Math.ceil((COOLDOWN_HOURS - diffHours) / 24);
        const message =
          locale === 'he'
            ? `ניתן ליצור כרטיס חדש בעוד ${daysLeft} ${daysLeft === 1 ? 'יום' : 'ימים'}`
            : `You can generate a new card in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
        return NextResponse.json({ success: false, message }, { status: 429 });
      }
    }

    // 1. Generate narrative profile
    const narrativeProfile = await generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      throw new Error('Failed to generate narrative profile');
    }

    // 2. Build meta info
    const meta = {
      firstName: user.firstName || '',
      age: user.profile.birthDate
        ? Math.floor((Date.now() - new Date(user.profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : 0,
      city: user.profile.city || '',
      religiousLevel: user.profile.religiousLevel || '',
      gender: user.profile.gender as 'MALE' | 'FEMALE',
      height: user.profile.height || undefined,
      occupation: user.profile.occupation || undefined,
      education: user.profile.education || undefined,
      maritalStatus: user.profile.maritalStatus || undefined,
    };

    // 3. Generate card via AI
    const card = await generateShidduchCard(narrativeProfile, user, locale as Language);

    // 4. Save to DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        shidduchCardData: { card, meta } as any,
        shidduchCardLastGeneratedAt: new Date(),
        shidduchCardGeneratedCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, card: { card, meta } });
  } catch (error) {
    console.error('Error generating Shidduch Card:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// AI Card Generator
// =====================================================

async function generateShidduchCard(
  narrativeProfile: string,
  user: any,
  locale: Language
): Promise<ShidduchCard> {
  const isHebrew = locale === 'he';
  const prompt = buildCardPrompt(narrativeProfile, user, isHebrew);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('AI returned invalid JSON');
    }
  }

  if (!isValidShidduchCard(parsed)) {
    console.error('AI returned invalid card structure:', JSON.stringify(parsed).slice(0, 500));
    const fallback = parsed as Record<string, any>;
    return {
      headline: fallback.headline || '',
      aboutMe: fallback.aboutMe || '',
      lookingFor: fallback.lookingFor || '',
      strengthTags: Array.isArray(fallback.strengthTags) ? fallback.strengthTags : [],
      coreTags: Array.isArray(fallback.coreTags) ? fallback.coreTags : [],
      lifestyleSummary: fallback.lifestyleSummary || '',
      closingLine: fallback.closingLine || '',
    };
  }

  return parsed;
}

// =====================================================
// Prompt Builder
// =====================================================

function buildCardPrompt(
  narrativeProfile: string,
  user: any,
  isHebrew: boolean
): string {
  const firstName = user.firstName || '';
  const isMale = user.profile?.gender === 'MALE';
  const genderSuffix = isMale ? '' : 'ה';
  const genderPronoun = isMale ? 'הוא' : 'היא';

  if (isHebrew) {
    return `אתה ה-AI של נשמהטק — שדכן מומחה.

המשימה: לכתוב כרטיס שידוכים מסודר ותמציתי עבור ${firstName}.
הכרטיס מיועד לשימוש של ${firstName} — ${genderPronoun} יוכל${genderSuffix} להעתיק אותו ולשלוח לשדכנים, לחברים שמציעים הצעות, או לפלטפורמות שידוכים אחרות.

═══════════════════════════════════════
מידע מלא על ${firstName}:
═══════════════════════════════════════
${narrativeProfile}
═══════════════════════════════════════

הנחיות קריטיות:

1. כתוב בגוף שלישי (${genderPronoun}...) — הכרטיס מיועד לצד שלישי שיקרא אותו.
2. הטון: חם, אותנטי, לא מתרברב — כזה שאדם ירגיש בנוח לשלוח על עצמו.
3. headline — משפט פתיחה קצר ומושך (עד 15 מילים) שמגדיר את ${firstName}.
4. aboutMe — 3-5 משפטים על האישיות, הערכים והאנרגיה של ${firstName}. ספציפי ולא גנרי. השתמש במידע מהשאלון וטביעת הנשמה.
5. lookingFor — 3-5 משפטים על מה ${firstName} מחפש${genderSuffix} בבן/בת זוג. ספציפי, מבוסס על ההעדפות והתשובות.
6. strengthTags — 4-6 תגיות קצרות שמתארות חוזקות (למשל: "יצירתי", "משפחתי", "שאפתני"). 1-2 מילים כל תגית.
7. coreTags — 3-5 תגיות של ערכים מרכזיים (למשל: "אמונה", "צמיחה", "חברה"). 1-2 מילים כל תגית.
8. lifestyleSummary — משפט אחד-שניים על סגנון החיים (תחביבים, קצב, מה חשוב ביומיום).
9. closingLine — משפט סיום חם שמזמין ליצור קשר. לא מכירתי, אלא כנה ואנושי.
10. אל תמציא מידע שלא קיים — אם משהו לא ברור, אל תכלול אותו.

החזר JSON בדיוק במבנה הזה (כל הערכים בעברית):

{
  "headline": "משפט פתיחה קצר ומושך",
  "aboutMe": "3-5 משפטים על מי ש${firstName} ${genderPronoun}",
  "lookingFor": "3-5 משפטים על מה ${firstName} מחפש${genderSuffix}",
  "strengthTags": ["חוזקה 1", "חוזקה 2", "חוזקה 3", "חוזקה 4"],
  "coreTags": ["ערך 1", "ערך 2", "ערך 3"],
  "lifestyleSummary": "משפט על סגנון החיים",
  "closingLine": "משפט סיום חם ומזמין"
}`;
  }

  // English prompt
  return `You are NeshamaTech AI — an expert matchmaker.

Mission: Write a concise, polished shidduch card for ${firstName}.
The card is for ${firstName} to copy and share with matchmakers, friends who suggest matches, or other matchmaking platforms.

═══════════════════════════════════════
Full data on ${firstName}:
═══════════════════════════════════════
${narrativeProfile}
═══════════════════════════════════════

Critical guidelines:

1. Write in third person (${isMale ? 'He' : 'She'}...) — the card is meant for a third party to read.
2. Tone: warm, authentic, not boastful — something the person would feel comfortable sharing about themselves.
3. headline — A short, compelling opening line (up to 15 words) that defines ${firstName}.
4. aboutMe — 3-5 sentences about personality, values, and energy. Specific, not generic. Use questionnaire and Soul Fingerprint data.
5. lookingFor — 3-5 sentences about what ${firstName} is looking for. Specific, based on preferences and answers.
6. strengthTags — 4-6 short tags describing strengths (e.g. "Creative", "Family-oriented", "Ambitious"). 1-2 words each.
7. coreTags — 3-5 tags of core values (e.g. "Faith", "Growth", "Community"). 1-2 words each.
8. lifestyleSummary — 1-2 sentences about lifestyle (hobbies, pace, daily priorities).
9. closingLine — A warm closing that invites contact. Not salesy, genuine and human.
10. Don't fabricate information that doesn't exist — if something is unclear, leave it out.

Return JSON in exactly this structure (all values in English):

{
  "headline": "Short compelling opening line",
  "aboutMe": "3-5 sentences about who ${firstName} is",
  "lookingFor": "3-5 sentences about what ${firstName} seeks",
  "strengthTags": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
  "coreTags": ["Value 1", "Value 2", "Value 3"],
  "lifestyleSummary": "Sentence about lifestyle",
  "closingLine": "Warm inviting closing"
}`;
}
