// src/app/api/profile/neshama-insight/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateNarrativeProfile } from '@/lib/services/profileAiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Language } from '@prisma/client';

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
    const { userId, locale = 'he' } = body;

    // Verify user can only generate insight for themselves
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch user data
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

    // Verify profile is 100% complete
    const isComplete = await verifyProfileCompletion(user);
    if (isComplete) {
      return NextResponse.json(
        {
          success: false,
          message: locale === 'he' 
            ? 'יש להשלים את הפרופיל ל-100% לפני יצירת התובנה' 
            : 'Profile must be 100% complete before generating insight',
        },
        { status: 400 }
      );
    }

    // Generate narrative profile
    const narrativeProfile = await generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      throw new Error('Failed to generate narrative profile');
    }

    // Generate the Neshama Insight using AI
    const insight = await generateNeshmaInsight(
      narrativeProfile,
      user,
      locale as Language
    );

    // Update database to track that insight was generated
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      insight,
    });
  } catch (error) {
    console.error('Error generating Neshama Insight:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function verifyProfileCompletion(user: any): Promise<boolean> {
  const profile = user.profile;
  const questionnaire = user.questionnaireResponses[0];

  if (!profile || !questionnaire) return false;

  // Check basic profile fields
  const basicChecks = [
    user.images?.length >= 1,
    !!profile.profileHeadline,
    !!profile.about && profile.about.length >= 100,
    !!profile.height,
    !!profile.city,
    !!profile.maritalStatus,
    !!profile.religiousLevel,
    !!profile.educationLevel,
    !!profile.occupation,
    !!profile.matchingNotes,
  ];

  // Check questionnaire completion
  const questionnaireChecks = [
    questionnaire.valuesCompleted,
    questionnaire.personalityCompleted,
    questionnaire.relationshipCompleted,
    questionnaire.partnerCompleted,
    questionnaire.religionCompleted,
  ];

  const allChecks = [...basicChecks, ...questionnaireChecks];
  return allChecks.every(Boolean);
}

async function generateNeshmaInsight(
  narrativeProfile: string,
  user: any,
  locale: Language
) {
  const profile = user.profile;
  const questionnaire = user.questionnaireResponses[0];

  const isHebrew = locale === 'he';
  const languageInstruction = isHebrew
    ? 'כתוב את כל התשובות בעברית בלבד.'
    : 'Write all responses in English only.';

  const prompt = `
You are an expert matchmaker and relationship counselor with deep psychological insight. You have been given comprehensive information about a person who has completed their profile on a Jewish matchmaking platform.

${languageInstruction}

YOUR TASK:
Create a deeply personalized "Neshama Insight" (Soul Insight) report that will:
1. Help them understand themselves better
2. Clarify who would be their ideal partner
3. Prepare them for meaningful dating
4. Empower them with confidence
5. Guide their next steps

IMPORTANT TONE GUIDELINES:
- Be warm, empathetic, and encouraging
- Use "you" to speak directly to them
- Be specific and personal (avoid generic statements)
- Balance honesty with sensitivity
- Show that you truly SEE them as an individual
- Be professional yet friendly
- Avoid clichés and empty platitudes

---

PROFILE INFORMATION:
${narrativeProfile}

QUESTIONNAIRE DATA:
${JSON.stringify(questionnaire, null, 2)}

---

Generate a response in the following JSON structure:

{
  "whoYouAre": {
    "summary": "A 2-3 paragraph deep analysis of their personality, values, and character. What makes them unique? What are their core strengths in relationships?",
    "details": [
      "Specific insight about their personality trait #1",
      "Specific insight about their personality trait #2",
      "Specific insight about their values and what drives them",
      "An observation about how they approach life/relationships"
    ]
  },
  "idealPartner": {
    "summary": "A vivid 2-3 paragraph description of the type of partner who would complement them. Not generic qualities, but specific traits that would create harmony with THEIR personality.",
    "details": [
      "Critical quality #1 and WHY it matters for them specifically",
      "Critical quality #2 and WHY it matters for them specifically", 
      "Critical quality #3 and WHY it matters for them specifically",
      "A gentle caution about a potential mismatch to watch for"
    ]
  },
  "firstMeetingTips": {
    "summary": "Personalized advice for their first dates based on their personality type and tendencies.",
    "details": [
      "Tip #1 tailored to their communication style",
      "Tip #2 about managing their specific anxieties or tendencies",
      "Tip #3 about creating authentic connection given their personality",
      "Tip #4 about what to focus on or avoid"
    ]
  },
  "uniquePotential": {
    "summary": "What makes them special as a potential partner. Their unique strengths and what they bring to a relationship.",
    "details": [
      "Unique strength #1 with specific example of how it shows up",
      "Unique strength #2 with specific example",
      "Unique strength #3 with specific example",
      "What a lucky partner will gain by being with them"
    ]
  },
  "nextSteps": {
    "summary": "Transparent explanation of what happens now in the matchmaking process, setting realistic expectations.",
    "details": [
      "What the matchmaking team is doing behind the scenes",
      "Realistic timeline for receiving match suggestions",
      "1-2 specific ways they can optimize their profile further (if any)",
      "How to prepare mentally/emotionally while waiting",
      "A resource or reflection exercise they can do in the meantime"
    ]
  }
}

Remember: This person has invested significant time and emotional energy into completing their profile. They deserve a response that honors that investment with genuine insight, not generic template text. Make them feel SEEN, UNDERSTOOD, and HOPEFUL.

${isHebrew ? 'שוב, חשוב: כתוב הכל בעברית!' : 'Again, important: Write everything in English!'}
`;

  try {
    // Use Google Generative AI directly
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the AI response
    let insightData;
    try {
      // Try to extract JSON from markdown code blocks if present
      let cleanedResponse = text;
      if (text.includes('```json')) {
        cleanedResponse = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      }
      insightData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', text);
      throw new Error('Failed to parse insight data');
    }

    return insightData;
  } catch (error) {
    console.error('Error calling Google AI:', error);
    throw error;
  }
}