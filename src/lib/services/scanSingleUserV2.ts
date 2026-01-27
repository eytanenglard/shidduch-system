// ============================================================
// NeshamaTech - Single User Scan Service V2 (FIXED)
// src/lib/services/scanSingleUserV2.ts
// ============================================================

import prisma from "@/lib/prisma";
import { calculatePairCompatibility } from "./compatibilityServiceV2";
import { updateProfileVectorsAndMetrics } from "./dualVectorService";
import { PairCompatibilityResult } from "@/types/profileMetrics";
import { Gender } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ScanOptions {
  useVectors?: boolean;
  useAIDeepAnalysis?: boolean;
  maxCandidates?: number;
  topForAI?: number;
  forceUpdateMetrics?: boolean;
}

export interface ScanResult {
  userId: string;
  profileId: string;
  scanStartedAt: Date;
  scanCompletedAt: Date;
  durationMs: number;
  
  stats: {
    totalCandidates: number;
    passedDealBreakers: number;
    scoredCandidates: number;
    aiAnalyzed: number;
  };
  
  matches: ScoredMatch[];
  errors: string[];
  warnings: string[];
}

export interface ScoredMatch {
  candidateProfileId: string;
  candidateUserId: string;
  candidateName: string;
  candidateAge: number;
  candidateCity?: string;
  
  scoreForUser: number;
  scoreForCandidate: number;
  symmetricScore: number;
  
  metricsScore: number;
  vectorScore?: number;
  softPenalties: number;
  
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  tier: 1 | 2 | 3;
  
  flags: string[];
  failedDealBreakers: string[];
  
  aiAnalysis?: {
    score: number;
    reasoning: string;
    strengths: string[];
    concerns: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCAN FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function scanSingleUserV2(
  userId: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`[ScanV2] Starting scan for user: ${userId}`);

  const {
    useVectors = true,
    useAIDeepAnalysis = true,
    maxCandidates = 100,
    topForAI = 30,
    forceUpdateMetrics = false,
  } = options;

  // ═══ TIER 0: וידוא מוכנות ═══
  console.log(`[ScanV2] Tier 0: Readiness check`);

  const profile = await prisma.profile.findFirst({
    where: { userId },
    include: { user: true },
  });

  if (!profile) {
    throw new Error(`Profile not found for user: ${userId}`);
  }

  const metricsExist = await checkMetricsExist(profile.id);
  const vectorsExist = await checkVectorsExist(profile.id);

  if (!metricsExist || !vectorsExist || forceUpdateMetrics) {
    console.log(`[ScanV2] Updating metrics/vectors for user profile`);
    try {
      await updateProfileVectorsAndMetrics(profile.id);
    } catch (error) {
      warnings.push(`Failed to update user metrics: ${error}`);
    }
  }

  // ═══ TIER 1: Deal Breaker Filter (SQL) ═══
  console.log(`[ScanV2] Tier 1: Deal Breaker Filter`);

  // תיקון: השוואה נכונה עם Gender enum
  const oppositeGender: Gender = profile.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  
   const tier1Candidates = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id as "profileId",
      p."userId",
      u."firstName",
      u."lastName",
      p.gender,
      p."birthDate",
      p.city,
      p."religiousLevel",
      p.height,
      p."nativeLanguage",
      p."additionalLanguages",
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."urbanScore",
      pm."backgroundCategory",
      pm."ethnicBackground",
      pm."appearancePickiness"
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    WHERE p.gender = ${oppositeGender}::"Gender"
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND p.id != ${profile.id}
      AND NOT EXISTS (
        SELECT 1 FROM "PotentialMatch" pm2
        WHERE ((pm2."maleUserId" = ${userId} AND pm2."femaleUserId" = p."userId")
           OR (pm2."femaleUserId" = ${userId} AND pm2."maleUserId" = p."userId"))
          AND pm2.status::text IN ('REJECTED', 'DATED_NO_CONTINUE', 'USER_REJECTED', 'DISMISSED')
      )
    ORDER BY pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;




  console.log(`[ScanV2] Tier 1: Found ${tier1Candidates.length} candidates`);

  if (tier1Candidates.length === 0) {
    return {
      userId,
      profileId: profile.id,
      scanStartedAt: new Date(startTime),
      scanCompletedAt: new Date(),
      durationMs: Date.now() - startTime,
      stats: { totalCandidates: 0, passedDealBreakers: 0, scoredCandidates: 0, aiAnalyzed: 0 },
      matches: [],
      errors,
      warnings,
    };
  }

  // ═══ TIER 2 + 3: Compatibility Calculation ═══
  console.log(`[ScanV2] Tier 2-3: Calculating compatibility`);

  const scoredCandidates: {
    candidate: any;
    compatibility: PairCompatibilityResult;
  }[] = [];

  for (const candidate of tier1Candidates) {
    try {
      const compatibility = await calculatePairCompatibility(profile.id, candidate.profileId);
      
      if (compatibility.breakdownAtoB.dealBreakersPassed && compatibility.breakdownBtoA.dealBreakersPassed) {
        scoredCandidates.push({ candidate, compatibility });
      }
    } catch (error) {
      warnings.push(`Failed to calculate compatibility for ${candidate.profileId}: ${error}`);
    }
  }

  console.log(`[ScanV2] Tier 2-3: ${scoredCandidates.length} passed deal breakers`);

  scoredCandidates.sort((a, b) => b.compatibility.symmetricScore - a.compatibility.symmetricScore);

  // ═══ TIER 4: AI Deep Analysis (אופציונלי) ═══
  let aiResults: Map<string, any> = new Map();

  if (useAIDeepAnalysis && scoredCandidates.length > 0) {
    console.log(`[ScanV2] Tier 4: AI Deep Analysis for top ${topForAI}`);
    
    const topCandidates = scoredCandidates.slice(0, topForAI);
    
    try {
      aiResults = await performAIDeepAnalysis(profile, topCandidates);
      console.log(`[ScanV2] AI analyzed ${aiResults.size} pairs`);
    } catch (error) {
      warnings.push(`AI analysis failed: ${error}`);
    }
  }

  // ═══ BUILD FINAL RESULTS ═══
  console.log(`[ScanV2] Building final results`);

  const matches: ScoredMatch[] = scoredCandidates.map(({ candidate, compatibility }) => {
    const age = candidate.birthDate
      ? Math.floor((Date.now() - new Date(candidate.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : 0;

    const aiAnalysis = aiResults.get(candidate.profileId);
    
    let finalScore = compatibility.symmetricScore;
    if (aiAnalysis?.score) {
      finalScore = Math.round(compatibility.symmetricScore * 0.6 + aiAnalysis.score * 0.4);
    }

    let tier: 1 | 2 | 3;
    if (finalScore >= 85) tier = 1;
    else if (finalScore >= 70) tier = 2;
    else tier = 3;

    return {
      candidateProfileId: candidate.profileId,
      candidateUserId: candidate.userId,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateAge: age,
      candidateCity: candidate.city,
      
      scoreForUser: compatibility.scoreAtoB,
      scoreForCandidate: compatibility.scoreBtoA,
      symmetricScore: finalScore,
      
      metricsScore: compatibility.breakdownAtoB.metricsScore,
      vectorScore: compatibility.breakdownAtoB.vectorScore,
      softPenalties: compatibility.breakdownAtoB.softPenalties,
      
      recommendation: determineRecommendation(finalScore),
      tier,
      
      flags: compatibility.flags,
      failedDealBreakers: [],
      
      aiAnalysis: aiAnalysis ? {
        score: aiAnalysis.score,
        reasoning: aiAnalysis.reasoning,
        strengths: aiAnalysis.strengths || [],
        concerns: aiAnalysis.concerns || [],
      } : undefined,
    };
  });

  matches.sort((a, b) => b.symmetricScore - a.symmetricScore);

  const result: ScanResult = {
    userId,
    profileId: profile.id,
    scanStartedAt: new Date(startTime),
    scanCompletedAt: new Date(),
    durationMs: Date.now() - startTime,
    stats: {
      totalCandidates: tier1Candidates.length,
      passedDealBreakers: scoredCandidates.length,
      scoredCandidates: scoredCandidates.length,
      aiAnalyzed: aiResults.size,
    },
    matches,
    errors,
    warnings,
  };

  console.log(`[ScanV2] Scan completed in ${result.durationMs}ms. Found ${matches.length} matches.`);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function checkMetricsExist(profileId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM profile_metrics WHERE "profileId" = ${profileId} LIMIT 1
  `;
  return result.length > 0;
}

async function checkVectorsExist(profileId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM profile_vectors 
    WHERE "profileId" = ${profileId} 
      AND "selfVector" IS NOT NULL 
      AND "seekingVector" IS NOT NULL 
    LIMIT 1
  `;
  return result.length > 0;
}

function determineRecommendation(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'FAIR';
  return 'POOR';
}

// ═══════════════════════════════════════════════════════════════
// AI DEEP ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function performAIDeepAnalysis(
  userProfile: any,
  candidates: { candidate: any; compatibility: PairCompatibilityResult }[]
): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  const userDetails = await fetchProfileDetailsForAI(userProfile.id);

  const batchSize = 5;
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ candidate, compatibility }) => {
      try {
        const candidateDetails = await fetchProfileDetailsForAI(candidate.profileId);
        
        const analysis = await analyzeMatchWithAI(
          userDetails,
          candidateDetails,
          compatibility
        );
        
        results.set(candidate.profileId, analysis);
      } catch (error) {
        console.error(`[AI] Failed to analyze ${candidate.profileId}:`, error);
      }
    });

    await Promise.all(batchPromises);
    
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}

async function fetchProfileDetailsForAI(profileId: string): Promise<any> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });

  if (!profile) return null;

  const metrics = await prisma.$queryRaw<any[]>`
    SELECT 
      "aiPersonalitySummary",
      "aiSeekingSummary",
      "socialEnergy",
      "religiousStrictness",
      "careerOrientation",
      "urbanScore",
      "appearancePickiness",
      "difficultyFlags"
    FROM profile_metrics 
    WHERE "profileId" = ${profileId}
  `;

  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 0;

  return {
    name: `${profile.user.firstName}`,
    gender: profile.gender,
    age,
    city: profile.city,
    religiousLevel: profile.religiousLevel,
    occupation: profile.occupation,
    about: profile.about,
    matchingNotes: profile.matchingNotes,
    aiPersonalitySummary: metrics[0]?.aiPersonalitySummary,
    aiSeekingSummary: metrics[0]?.aiSeekingSummary,
    metrics: metrics[0] || {},
  };
}

async function analyzeMatchWithAI(
  userDetails: any,
  candidateDetails: any,
  compatibility: PairCompatibilityResult
): Promise<any> {
  const prompt = `אתה שדכן מומחה. נתח את ההתאמה בין שני הפרופילים הבאים.

## פרופיל A (מחפש/ת):
שם: ${userDetails.name}
מגדר: ${userDetails.gender}
גיל: ${userDetails.age}
עיר: ${userDetails.city || 'לא צוין'}
רמה דתית: ${userDetails.religiousLevel || 'לא צוין'}
מקצוע: ${userDetails.occupation || 'לא צוין'}

תיאור עצמי:
${userDetails.about || 'לא זמין'}

סיכום אישיות:
${userDetails.aiPersonalitySummary || 'לא זמין'}

מה מחפש/ת:
${userDetails.aiSeekingSummary || 'לא זמין'}

הערות שידוך:
${userDetails.matchingNotes || 'אין'}

## פרופיל B (מועמד/ת):
שם: ${candidateDetails.name}
מגדר: ${candidateDetails.gender}
גיל: ${candidateDetails.age}
עיר: ${candidateDetails.city || 'לא צוין'}
רמה דתית: ${candidateDetails.religiousLevel || 'לא צוין'}
מקצוע: ${candidateDetails.occupation || 'לא צוין'}

תיאור עצמי:
${candidateDetails.about || 'לא זמין'}

סיכום אישיות:
${candidateDetails.aiPersonalitySummary || 'לא זמין'}

מה מחפש/ת:
${candidateDetails.aiSeekingSummary || 'לא זמין'}

## ציון מדדים מקדים: ${compatibility.symmetricScore}/100
דגלים: ${compatibility.flags.join(', ') || 'אין'}

---

נתח את ההתאמה והחזר JSON בלבד:

{
  "score": <50-100>,
  "reasoning": "<הסבר קצר של 2-3 משפטים למה מתאימים/לא מתאימים>",
  "strengths": ["<נקודת חוזק 1>", "<נקודת חוזק 2>"],
  "concerns": ["<חשש 1>", "<חשש 2>"],
  "suggestedApproach": "<איך להציג את ההצעה>"
}`;

  try {
    const response = await callGeminiAPI(prompt);
    
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[AI] Parse error:', error);
    return {
      score: compatibility.symmetricScore,
      reasoning: 'AI analysis unavailable',
      strengths: [],
      concerns: [],
    };
  }
}

// פונקציה לקריאה ישירה ל-Gemini (לא תלויה ב-aiService)
async function callGeminiAPI(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ═══════════════════════════════════════════════════════════════
// SAVE RESULTS TO DB
// ═══════════════════════════════════════════════════════════════

export async function saveScanResults(result: ScanResult): Promise<void> {
  const userProfile = await prisma.profile.findFirst({
    where: { userId: result.userId },
  });

  if (!userProfile) return;

  for (const match of result.matches) {
    const isMale = userProfile.gender === Gender.MALE;
    const maleUserId = isMale ? result.userId : match.candidateUserId;
    const femaleUserId = isMale ? match.candidateUserId : result.userId;

    // בדיקה אם כבר קיים
    const existing = await prisma.potentialMatch.findFirst({
      where: {
        maleUserId,
        femaleUserId,
      },
    });

    if (existing) {
      // עדכון
      await prisma.potentialMatch.update({
        where: { id: existing.id },
        data: {
          aiScore: match.symmetricScore,
          firstPassScore: match.metricsScore,
          shortReasoning: match.aiAnalysis?.reasoning || null,
          scannedAt: new Date(),
        },
      });
    } else {
      // יצירה חדשה
      await prisma.potentialMatch.create({
        data: {
          maleUserId,
          femaleUserId,
          aiScore: match.symmetricScore,
          firstPassScore: match.metricsScore,
          status: 'PENDING',
          shortReasoning: match.aiAnalysis?.reasoning || null,
        },
      });
    }
  }

  // עדכון lastScannedAt בפרופיל
  await prisma.profile.update({
    where: { id: userProfile.id },
    data: { lastScannedAt: new Date() },
  });

  console.log(`[ScanV2] Saved ${result.matches.length} matches to DB`);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const scanSingleUserServiceV2 = {
  scanSingleUserV2,
  saveScanResults,
};

export default scanSingleUserServiceV2;