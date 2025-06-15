// File: src/app/api/ai/generate-rationale/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateNarrativeProfile } from "@/lib/services/profileAiService";
import { analyzePairCompatibility } from "@/lib/services/aiService";

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication and Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Body Validation
    const body = await req.json();
    const { userId1, userId2, language } = body;

    if (!userId1 || !userId2) {
      return NextResponse.json({ success: false, error: "Invalid request body. 'userId1' and 'userId2' are required." }, { status: 400 });
    }
    
    // Validate language or set default
    const validLanguages = ['he', 'en'];
    const analysisLanguage = validLanguages.includes(language) ? language : 'he';

    // 3. Generate Narrative Profiles for both users
    // We run them in parallel for efficiency.
    const [profile1Text, profile2Text] = await Promise.all([
        generateNarrativeProfile(userId1),
        generateNarrativeProfile(userId2)
    ]);

    if (!profile1Text) {
        return NextResponse.json({ success: false, error: `Could not generate narrative profile for user ${userId1}.` }, { status: 404 });
    }
    if (!profile2Text) {
        return NextResponse.json({ success: false, error: `Could not generate narrative profile for user ${userId2}.` }, { status: 404 });
    }

    // 4. Call the AI service to get the compatibility analysis
    const analysisResult = await analyzePairCompatibility(profile1Text, profile2Text, analysisLanguage);

    if (!analysisResult) {
        return NextResponse.json({ success: false, error: "Failed to get compatibility analysis from AI service." }, { status: 500 });
    }

    // 5. Return the successful analysis
    return NextResponse.json({ success: true, analysis: analysisResult });

  } catch (error) {
    console.error('Error in /api/ai/generate-rationale:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "Internal server error.", details: errorMessage }, { status: 500 });
  }
}