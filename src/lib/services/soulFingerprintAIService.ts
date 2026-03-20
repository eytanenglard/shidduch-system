// src/lib/services/soulFingerprintAIService.ts
// AI enrichment for Soul Fingerprint — analyzes open text answers to derive additional tags

import prisma from '@/lib/prisma';

const VALID_AI_TAGS = [
  // Personality nuances
  'optimistic', 'pessimistic', 'perfectionist', 'flexible', 'stubborn',
  'independent', 'dependent', 'ambitious', 'content', 'sensitive',
  'resilient', 'patient', 'impatient', 'curious', 'traditional_minded',
  'open_minded', 'romantic', 'pragmatic_partner', 'idealist', 'realist',
  // Social/emotional
  'emotionally_available', 'guarded', 'vulnerable', 'confident',
  'self_aware', 'people_pleaser', 'boundary_setter', 'conflict_resolver',
  // Lifestyle nuances
  'minimalist', 'luxurious', 'health_conscious', 'intellectual',
  'nature_lover', 'city_person', 'homebody', 'social_butterfly',
  'early_riser', 'night_owl_confirmed', 'workaholic', 'work_life_balanced',
  // Relationship nuances
  'needs_space', 'needs_closeness', 'communicator', 'action_oriented',
  'quality_time_focused', 'gift_giver', 'acts_of_love', 'verbal_affection',
  // Values
  'family_first', 'career_driven', 'community_focused', 'spiritually_seeking',
  'growth_oriented', 'stability_oriented', 'adventure_seeking', 'peace_seeking',
];

async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Enrich a user's soul fingerprint with AI-derived tags
 * Analyzes open text answers + existing tags to generate 5-10 additional personality insights
 */
export async function enrichSoulFingerprintWithAI(userId: string): Promise<string[]> {
  const profileTags = await prisma.profileTags.findUnique({
    where: { userId },
    select: {
      id: true,
      sectionAnswers: true,
      sectorTags: true,
      backgroundTags: true,
      personalityTags: true,
      careerTags: true,
      lifestyleTags: true,
      familyVisionTags: true,
      relationshipTags: true,
    },
  });

  if (!profileTags || !profileTags.sectionAnswers) {
    console.log(`[SFEnrichment] No profile tags found for user ${userId}`);
    return [];
  }

  const answers = profileTags.sectionAnswers as Record<string, unknown>;

  // Extract open text answers
  const openCharacter = (answers['s3_open_character'] as string) || '';
  const openPartner = (answers['s7_open_partner'] as string) || '';

  if (!openCharacter && !openPartner) {
    console.log(`[SFEnrichment] No open text answers for user ${userId}`);
    return [];
  }

  // Build context from existing tags
  const existingTags = [
    ...profileTags.personalityTags,
    ...profileTags.lifestyleTags,
    ...profileTags.relationshipTags,
    ...profileTags.sectorTags,
  ].join(', ');

  const prompt = `You are an expert matchmaking psychologist. Analyze the following open-text responses from a user's soul fingerprint questionnaire and derive 5-10 personality/lifestyle tags that are NOT already captured in their existing tags.

EXISTING TAGS: ${existingTags}

USER'S SELF-DESCRIPTION:
"${openCharacter}"

USER'S DESCRIPTION OF IDEAL PARTNER:
"${openPartner}"

VALID TAGS TO CHOOSE FROM (only use these exact values):
${VALID_AI_TAGS.join(', ')}

Instructions:
- Only output tags from the valid list above
- Do NOT repeat tags already in the existing tags
- Focus on personality nuances, emotional patterns, and relationship dynamics
- Output ONLY a JSON array of strings, nothing else
- Example output: ["optimistic","communicator","family_first","growth_oriented","emotionally_available"]`;

  try {
    const response = await generateText(prompt);

    // Parse JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.warn(`[SFEnrichment] Could not parse AI response for user ${userId}`);
      return [];
    }

    const aiTags = JSON.parse(jsonMatch[0]) as string[];

    // Validate: only keep tags from the valid list
    const validatedTags = aiTags.filter(
      (tag) =>
        VALID_AI_TAGS.includes(tag) &&
        !profileTags.personalityTags.includes(tag) &&
        !profileTags.lifestyleTags.includes(tag)
    );

    // Limit to 10 tags max
    const finalTags = validatedTags.slice(0, 10);

    if (finalTags.length > 0) {
      await prisma.profileTags.update({
        where: { id: profileTags.id },
        data: {
          aiDerivedTags: finalTags,
          source: 'HYBRID',
        },
      });

      console.log(
        `[SFEnrichment] Added ${finalTags.length} AI tags for user ${userId}: ${finalTags.join(', ')}`
      );
    }

    return finalTags;
  } catch (err) {
    console.error(`[SFEnrichment] AI enrichment failed for user ${userId}:`, err);
    return [];
  }
}

/**
 * Batch enrich profiles that have open text but no AI tags yet
 * Intended for daily cron job
 */
export async function batchEnrichSoulFingerprints(limit = 50): Promise<number> {
  const profiles = await prisma.profileTags.findMany({
    where: {
      completedAt: { not: null },
      aiDerivedTags: { isEmpty: true },
      source: 'SELF_REPORTED',
    },
    select: { userId: true },
    take: limit,
  });

  let enriched = 0;
  for (const profile of profiles) {
    try {
      const tags = await enrichSoulFingerprintWithAI(profile.userId);
      if (tags.length > 0) enriched++;
    } catch (err) {
      console.error(`[SFBatchEnrich] Failed for user ${profile.userId}:`, err);
    }
  }

  console.log(`[SFBatchEnrich] Enriched ${enriched}/${profiles.length} profiles`);
  return enriched;
}
