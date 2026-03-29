// src/app/api/ai/compare-suggestions/what-if/route.ts
// Interactive "What if" scenarios — user picks a priority, AI re-evaluates

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();
    const { userChoice, originalResult } = body;

    if (!userChoice || !originalResult) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const acceptLang = req.headers.get('accept-language') || '';
    const isHebrew = !acceptLang.startsWith('en');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const prompt = isHebrew
      ? `אתה יועץ שידוכים. המשתמש השווה בין שתי הצעות וקיבל את הניתוח הבא:

סיכום: ${originalResult.comparisonSummary}
הצעה א': ציון ${originalResult.suggestionA?.score}, ${originalResult.suggestionA?.highlight}
הצעה ב': ציון ${originalResult.suggestionB?.score}, ${originalResult.suggestionB?.highlight}
המלצה מקורית: ${originalResult.recommendation}

המשתמש בחר שהדבר הכי חשוב לו הוא: "${userChoice}"

בהתבסס על הבחירה הזו, תן המלצה מעודכנת קצרה (2-3 משפטים) שמתייחסת ישירות לעדיפות שהמשתמש הביע. אל תחזור על המלצה זהה — התאם אותה.

החזר JSON: { "updatedRecommendation": "..." }`
      : `You are a matchmaking advisor. The user compared two suggestions and received this analysis:

Summary: ${originalResult.comparisonSummary}
Suggestion A: score ${originalResult.suggestionA?.score}, ${originalResult.suggestionA?.highlight}
Suggestion B: score ${originalResult.suggestionB?.score}, ${originalResult.suggestionB?.highlight}
Original recommendation: ${originalResult.recommendation}

The user indicated that the most important thing to them is: "${userChoice}"

Based on this choice, provide an updated short recommendation (2-3 sentences) that directly addresses the user's stated priority. Don't repeat the same recommendation — adapt it.

Return JSON: { "updatedRecommendation": "..." }`;

    const result = await model.generateContent(prompt);
    const jsonString = result.response.text();

    if (!jsonString) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const parsed = JSON.parse(jsonString);
    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('[what-if] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
