// src/app/api/profile/neshama-insight/route.ts
// =====================================================
// API Route - גרסה 4.0
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

    // Rate limiting
    if (isSelf && user.neshamaInsightLastGeneratedAt) {
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

    // Profile completion check
    const completionResult = calculateProfileCompletion(user);

    if (!completionResult.isComplete && !isMatchmakerOrAdmin) {
      const message =
        locale === 'he'
          ? 'יש להשלים לפחות 70% מהפרופיל (כרגע: ' + completionResult.completionPercent + '%)'
          : 'Please complete at least 70% of your profile (current: ' + completionResult.completionPercent + '%)';
      return NextResponse.json(
        { success: false, message: message },
        { status: 400 }
      );
    }

    // Generate narrative profile
    const narrativeProfile = await generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      throw new Error('Failed to generate narrative profile');
    }

    // Generate insight
    const insight = await generateNeshmaInsight(
      narrativeProfile,
      user,
      locale as Language
    );

    // Update database
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
      insight: {
        ...insight,
        userName: user.firstName + ' ' + user.lastName,
        generatedAt: new Date().toISOString(),
        profileCompletionPercent: completionResult.completionPercent,
      },
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
    { weight: 12, pass: Boolean(questionnaire && questionnaire.valuesCompleted) },
    { weight: 12, pass: Boolean(questionnaire && questionnaire.personalityCompleted) },
    { weight: 12, pass: Boolean(questionnaire && questionnaire.relationshipCompleted) },
    { weight: 12, pass: Boolean(questionnaire && questionnaire.partnerCompleted) },
    { weight: 12, pass: Boolean(questionnaire && questionnaire.religionCompleted) },
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
    isComplete: completionPercent >= 70,
    completionPercent: completionPercent,
  };
}

// =====================================================
// AI Insight Generator
// =====================================================

async function generateNeshmaInsight(
  narrativeProfile: string,
  user: any,
  locale: Language
) {
  const questionnaire = user.questionnaireResponses[0];
  const isHebrew = locale === 'he';
  const prompt = buildPrompt(narrativeProfile, questionnaire, user, isHebrew);

  console.log('=== PROMPT LENGTH ===', prompt.length);

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text();

      console.log('=== RAW AI RESPONSE ===');
      console.log('Length:', text.length);
      console.log('First 500 chars:', text.substring(0, 500));
      console.log('Last 200 chars:', text.substring(text.length - 200));
      console.log('=== END RAW RESPONSE ===');

      // Check if response is too short
      if (text.length < 500) {
        console.error('Response too short! Full response:', text);
        throw new Error('AI response too short: ' + text.length + ' chars');
      }

      // Clean the response
      text = cleanJsonResponse(text);

      // Parse JSON
      const insightData = safeJsonParse(text);

      if (!insightData) {
        console.error('Failed to parse. Cleaned text:', text.substring(0, 1000));
        throw new Error('Failed to parse JSON after cleanup');
      }

      // Validate structure
      validateInsightStructure(insightData);

      return insightData;
    } catch (error) {
      lastError = error as Error;
      console.error('AI generation attempt ' + (attempt + 1) + ' failed:', error);

      if (attempt < maxRetries) {
        console.log('Retrying in 2 seconds...');
        await sleep(2000);
      }
    }
  }

  throw lastError || new Error('Failed to generate insight after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// =====================================================
// JSON Cleaning and Parsing
// =====================================================

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  if (text.indexOf('```json') !== -1) {
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  }
  if (text.indexOf('```') !== -1) {
    text = text.replace(/```\s*/g, '');
  }

  // Trim whitespace
  text = text.trim();

  // Fix newlines inside strings
  text = fixNewlinesInStrings(text);

  return text;
}

function fixNewlinesInStrings(json: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && (char === '\n' || char === '\r')) {
      result += ' ';
      continue;
    }

    result += char;
  }

  return result;
}

function safeJsonParse(text: string): any {
  // First attempt - direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log('First parse failed:', (e as Error).message);
  }

  // Second attempt - extract JSON object
  try {
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const extracted = text.substring(startIndex, endIndex + 1);
      const fixed = fixNewlinesInStrings(extracted);
      return JSON.parse(fixed);
    }
  } catch (e) {
    console.log('Second parse failed:', (e as Error).message);
  }

  return null;
}

// =====================================================
// Prompt Builder
// =====================================================

function buildPrompt(
  narrativeProfile: string,
  questionnaire: any,
  user: any,
  isHebrew: boolean
): string {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = (firstName + ' ' + lastName).trim();
  const isMale = user.profile && user.profile.gender === 'MALE';

  // Simplified questionnaire data
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
    return buildHebrewPrompt(fullName, firstName, isMale, narrativeProfile, questionnaireJson);
  } else {
    return buildEnglishPrompt(fullName, firstName, narrativeProfile, questionnaireJson);
  }
}

function buildHebrewPrompt(
  fullName: string,
  firstName: string,
  isMale: boolean,
  narrativeProfile: string,
  questionnaireJson: string
): string {
  const lines: string[] = [];

  lines.push('אתה יועץ זוגיות מומחה. צור דוח JSON עבור ' + fullName + '.');
  lines.push('');
  lines.push('הנחיות חשובות:');
  lines.push('- כתוב בעברית בלבד');
  lines.push('- פנה בלשון ' + (isMale ? 'זכר' : 'נקבה'));
  lines.push('- החזר JSON תקין בלבד');
  lines.push('- אין מרכאות כפולות בתוך טקסט');
  lines.push('- אין שורות חדשות בתוך ערכים');
  lines.push('');
  lines.push('מידע על ' + firstName + ':');
  lines.push(narrativeProfile);
  lines.push('');
  lines.push('שאלון:');
  lines.push(questionnaireJson);
  lines.push('');
  lines.push('החזר את ה-JSON הבא (מלא את הערכים):');
  lines.push('');
  lines.push('{');
  lines.push('  "oneLiner": "משפט אחד שמתאר את ' + firstName + '",');
  lines.push('  "whoYouAre": {');
  lines.push('    "summary": "3-4 משפטים על האישיות",');
  lines.push('    "details": ["תובנה 1", "תובנה 2", "תובנה 3", "תובנה 4"]');
  lines.push('  },');
  lines.push('  "keyStrengths": [');
  lines.push('    {"title": "חוזקה 1", "description": "תיאור"},');
  lines.push('    {"title": "חוזקה 2", "description": "תיאור"},');
  lines.push('    {"title": "חוזקה 3", "description": "תיאור"}');
  lines.push('  ],');
  lines.push('  "idealPartner": {');
  lines.push('    "summary": "3-4 משפטים על בן/בת זוג מתאימים",');
  lines.push('    "details": ["נקודה 1", "נקודה 2", "נקודה 3", "נקודה 4"]');
  lines.push('  },');
  lines.push('  "firstMeetingTips": {');
  lines.push('    "summary": "2-3 משפטים על פגישה ראשונה",');
  lines.push('    "details": ["טיפ 1", "טיפ 2", "טיפ 3", "טיפ 4"]');
  lines.push('  },');
  lines.push('  "uniquePotential": {');
  lines.push('    "summary": "2-3 משפטים על הפוטנציאל הייחודי",');
  lines.push('    "details": ["נקודה 1", "נקודה 2", "נקודה 3", "נקודה 4"]');
  lines.push('  },');
  lines.push('  "nextSteps": {');
  lines.push('    "summary": "2-3 משפטים מעודדים",');
  lines.push('    "details": ["צעד 1", "צעד 2", "צעד 3", "צעד 4"]');
  lines.push('  },');
  lines.push('  "threeThingsToRemember": ["דבר 1", "דבר 2", "דבר 3"],');
  lines.push('  "growthAreas": ["אזור 1", "אזור 2"]');
  lines.push('}');
  lines.push('');
  lines.push('חשוב מאוד: החזר JSON תקין בלבד. אין שורות חדשות בתוך הטקסטים.');

  return lines.join('\n');
}

function buildEnglishPrompt(
  fullName: string,
  firstName: string,
  narrativeProfile: string,
  questionnaireJson: string
): string {
  const lines: string[] = [];

  lines.push('You are an expert relationship counselor. Create a JSON report for ' + fullName + '.');
  lines.push('');
  lines.push('Important instructions:');
  lines.push('- Write in English only');
  lines.push('- Return valid JSON only');
  lines.push('- No double quotes inside text values');
  lines.push('- No newlines inside values');
  lines.push('');
  lines.push('Profile info:');
  lines.push(narrativeProfile);
  lines.push('');
  lines.push('Questionnaire:');
  lines.push(questionnaireJson);
  lines.push('');
  lines.push('Return this JSON (fill in the values):');
  lines.push('');
  lines.push('{');
  lines.push('  "oneLiner": "One sentence describing ' + firstName + '",');
  lines.push('  "whoYouAre": {');
  lines.push('    "summary": "3-4 sentences about personality",');
  lines.push('    "details": ["insight 1", "insight 2", "insight 3", "insight 4"]');
  lines.push('  },');
  lines.push('  "keyStrengths": [');
  lines.push('    {"title": "strength 1", "description": "description"},');
  lines.push('    {"title": "strength 2", "description": "description"},');
  lines.push('    {"title": "strength 3", "description": "description"}');
  lines.push('  ],');
  lines.push('  "idealPartner": {');
  lines.push('    "summary": "3-4 sentences about ideal partner",');
  lines.push('    "details": ["point 1", "point 2", "point 3", "point 4"]');
  lines.push('  },');
  lines.push('  "firstMeetingTips": {');
  lines.push('    "summary": "2-3 sentences about first meeting",');
  lines.push('    "details": ["tip 1", "tip 2", "tip 3", "tip 4"]');
  lines.push('  },');
  lines.push('  "uniquePotential": {');
  lines.push('    "summary": "2-3 sentences about unique potential",');
  lines.push('    "details": ["point 1", "point 2", "point 3", "point 4"]');
  lines.push('  },');
  lines.push('  "nextSteps": {');
  lines.push('    "summary": "2-3 encouraging sentences",');
  lines.push('    "details": ["step 1", "step 2", "step 3", "step 4"]');
  lines.push('  },');
  lines.push('  "threeThingsToRemember": ["thing 1", "thing 2", "thing 3"],');
  lines.push('  "growthAreas": ["area 1", "area 2"]');
  lines.push('}');
  lines.push('');
  lines.push('Important: Return valid JSON only. No newlines inside text values.');

  return lines.join('\n');
}

// =====================================================
// Validation
// =====================================================

function validateInsightStructure(data: any): void {
  const requiredSections = [
    'whoYouAre',
    'idealPartner',
    'firstMeetingTips',
    'uniquePotential',
    'nextSteps',
  ];

  for (let i = 0; i < requiredSections.length; i++) {
    const section = requiredSections[i];

    if (!data[section]) {
      throw new Error('Missing required section: ' + section);
    }

    if (!data[section].summary || typeof data[section].summary !== 'string') {
      throw new Error('Invalid summary in section: ' + section);
    }

    if (!Array.isArray(data[section].details)) {
      throw new Error('Invalid details in section: ' + section);
    }
  }
}