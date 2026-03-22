// ============================================================
// NeshamaTech - AI Tag Generation Service
// src/lib/services/aiTagGenerationService.ts
//
// Generates Soul Fingerprint tags for users who haven't filled
// the questionnaire, using AI inference from available profile data.
// Called during "user preparation" phase only.
// ============================================================

import prisma from '@/lib/prisma';
import type { PartnerTagPreferences } from '@/components/soul-fingerprint/types';

// ═══════════════════════════════════════════════════════════════
// VALID TAG VALUES — extracted from questions.ts
// ═══════════════════════════════════════════════════════════════

const VALID_SECTOR_TAGS = [
  // anchor_sector values
  'charedi_litvish', 'charedi_hasidic', 'charedi_sephardi', 'charedi_modern',
  'hardal', 'dati_leumi_torani', 'dati_leumi_classic', 'dati_leumi_modern',
  'dati_lite', 'datlash', 'chozer_bteshuva',
  'masorti_strong', 'masorti_medium', 'masorti_light',
  'hiloni_jewish', 'hiloni_cultural', 'hiloni',
  'in_process', 'diaspora',
  // hasidic sub-values
  'hasidic_ger', 'hasidic_belz', 'hasidic_vizhnitz', 'hasidic_chabad', 'hasidic_breslov',
  'hasidic_satmar', 'hasidic_skvere', 'hasidic_boyan', 'hasidic_karlin', 'hasidic_slonim',
  // charedi work
  'full_kollel', 'kollel_part', 'works_learns', 'works_only', 'studying_yeshiva',
  // army/service
  'combat_full', 'non_combat', 'hesder', 'kav', 'national_service',
  // zionism
  'strong_zionist', 'classic_zionist', 'pragmatic_zionist',
  // shomer negiah
  'negiah_fully_shomer', 'negiah_mostly_shomer', 'negiah_not_shomer_open', 'negiah_not_shomer_prefer',
  // masorti practices
  'shabbat', 'kashrut', 'holidays', 'yom_kippur', 'prayer', 'jewish_education',
  // bt path
  'bt_gradual', 'bt_encounter', 'bt_study', 'bt_life_event', 'bt_community',
];

const VALID_BACKGROUND_TAGS = [
  // ethnic
  'ashkenazi', 'sephardi_moroccan', 'sephardi_iraqi', 'sephardi_tunisian',
  'sephardi_libyan', 'sephardi_yemenite', 'sephardi_persian', 'sephardi_turkish',
  'ethiopian', 'russian_ukrainian', 'american', 'french', 'argentinian', 'mixed',
  // origin
  'sabra', 'sabra_parents_olim', 'oleh_veteran', 'oleh_mid', 'oleh_new', 'abroad_planning',
  // family atmosphere
  'warm_vibrant', 'quiet_intimate', 'liberal_open', 'conservative_traditional',
  'disciplined_values', 'chaotic_free',
  // parents status
  'parents_married_happy', 'parents_married_complex', 'parents_divorced',
  'parents_one_passed', 'parents_both_passed',
  // family relationship
  'rel_parents_very_close', 'rel_parents_close', 'rel_parents_medium',
  'rel_parents_complex', 'rel_parents_distant',
  // family size
  'only_child', 'small_family', 'medium_family', 'big_family_origin',
  // family extended
  'family_ext_very_close', 'family_ext_close', 'family_ext_medium',
  'family_ext_distant', 'family_ext_disconnected',
];

const VALID_PERSONALITY_TAGS = [
  // character primary
  'humorous', 'serious_deep', 'practical', 'dreamer', 'leader',
  'supporter', 'creative', 'analytical', 'empathetic', 'adventurous',
  // life tempo
  'fast_full', 'medium', 'slow_intentional',
  // spontaneity
  'very_planned', 'planned_flexible', 'spontaneous',
  // conflict
  'direct', 'time_then_talk', 'avoidant', 'consensus',
  // social role
  'center', 'active_member', 'side_supporter', 'one_on_one',
  // humor styles
  'humor_ironic_cynical', 'humor_light_playful', 'humor_absurd',
  'humor_wordplay', 'humor_self_deprecating', 'humor_dry', 'humor_storytelling',
  // energy source
  'energy_deep_conversations', 'energy_big_groups', 'energy_quiet_solitude',
  'energy_physical_movement', 'energy_art_creation', 'energy_learning_reading',
  'energy_projects_doing', 'energy_helping_others', 'energy_music', 'energy_nature',
  // energy type (derived from slider)
  'introverted', 'extroverted', 'ambivert',
  // sensitivity
  'very_sensitive', 'balanced_sensitivity', 'thick_skinned',
  // change approach
  'embraces_change', 'cautious_change', 'stability_seeker',
];

const VALID_CAREER_TAGS = [
  // field
  'tech_hi_tech', 'medicine_health', 'law', 'education_teaching',
  'business_finance', 'art_design', 'construction_real_estate',
  'science_research', 'media_communication', 'culinary',
  'security_military', 'religious_career', 'therapy_wellness',
  'social_welfare', 'entrepreneurship', 'academia',
  // education level
  'high_school', 'vocational_cert', 'bachelor', 'master', 'phd',
  'yeshiva_only', 'yeshiva_plus', 'studying_now',
  // work status
  'employed_full', 'employed_part', 'self_employed', 'entrepreneur',
  'student_only', 'student_working', 'kollel', 'seeking',
  // ambition
  'career_center', 'professional_good', 'balance', 'livelihood_only',
  // financial style
  'saver', 'investor', 'entrepreneur_risk', 'experiential', 'simple', 'generous',
  // life priority
  'priority_career', 'priority_family', 'priority_growth', 'priority_faith', 'priority_adventure',
  // money attitude
  'money_important', 'money_tool', 'money_secondary', 'money_spiritual',
  // partner career
  'ambitious_career', 'stable_income', 'not_important', 'balance_family', 'whatever_happy',
];

const VALID_LIFESTYLE_TAGS = [
  // hobbies
  'reading', 'music_listening', 'music_playing', 'running_fitness',
  'yoga_meditation', 'team_sports', 'cooking_baking', 'art_drawing',
  'creative_writing', 'gardening_nature', 'gaming', 'tech_programming',
  'theater_movies', 'travel', 'animals', 'photography', 'torah_study',
  'volunteering', 'dance', 'wine_food', 'hiking', 'crafts_diy',
  // kashrut
  'mehadrin', 'regular_kosher', 'kosher_home_not_out', 'not_kosher_jewish',
  'vegetarian', 'vegan',
  // location
  'loc_tel_aviv_gush_dan', 'loc_jerusalem', 'loc_bnei_brak',
  'loc_haifa_north', 'loc_beer_sheva_south', 'loc_modiin_shfela',
  'loc_settlements_wb', 'loc_community_yishuv', 'loc_moshav_village',
  'loc_abroad', 'loc_flexible',
  // rhythm
  'very_early', 'early', 'late_morning', 'night_owl',
  // travel style
  'travel_backpacking_asia', 'travel_europe_culture', 'travel_israel_nature',
  'travel_luxury_hotels', 'travel_adventure_extreme',
  // fitness
  'very_active', 'moderately_active', 'not_active', 'health_focused',
  // smoking
  'non_smoker', 'social_smoker', 'regular_smoker', 'quit_smoking',
  // dress style
  'formal_dress', 'casual_dress', 'sporty_dress', 'creative_dress', 'modest_dress',
  // open abroad
  'open_abroad', 'israel_only', 'considering_abroad',
  // pets
  'pets_loves_has', 'pets_likes_ok', 'pets_prefer_without', 'pets_allergic',
  // politics
  'politics_left', 'politics_center_left', 'politics_center',
  'politics_center_right', 'politics_right', 'politics_far_right',
  'politics_religious_right', 'politics_charedi_parties', 'politics_not_engaged',
  // travel frequency
  'travel_loves_frequent', 'travel_occasionally', 'travel_not_interested',
  // diet
  'vegetarian_diet', 'vegan_diet', 'gluten_free', 'no_restrictions',
];

const VALID_FAMILY_TAGS = [
  // children count
  'one_two', 'three_four', 'five_six', 'as_many_as', 'not_sure', 'dont_want', 'have_enough',
  // home roles
  'full_sharing', 'traditional', 'flexible', 'both_work_help', 'she_works_too',
  // parenting style
  'very_involved', 'supportive', 'educating', 'free_developing',
  // home atmosphere
  'open_guests', 'private_family', 'religious_structure', 'liberal', 'quiet_order', 'lively_noisy',
  // education system
  'edu_state', 'edu_state_religious', 'edu_charedi', 'edu_alternative', 'edu_international',
  // partner children
  'partner_children_open_yes', 'partner_children_open_depends',
  'partner_children_prefer_without', 'partner_children_not_ok',
  // blended family
  'blended_full_parent', 'blended_supportive_role', 'blended_respectful_distance',
  'blended_figure_out_together',
];

const VALID_RELATIONSHIP_TAGS = [
  // relationship meaning
  'partnership_build', 'love_emotion', 'best_friendship',
  'home_stability', 'growth_together', 'mutual_respect', 'support_each_other',
  // love language
  'quality_time', 'words_affirmation', 'acts_of_service', 'physical_touch', 'gifts',
  // closeness
  'very_close', 'balanced', 'independent',
  // relationship model
  'equal_partnership', 'traditional_roles', 'she_leads', 'romantic_expressive', 'pragmatic_stable',
  // meeting pace
  'pace_fast', 'pace_medium', 'pace_slow',
];

const VALID_CATEGORIES = [
  'sector', 'background', 'personality', 'career', 'lifestyle', 'family', 'relationship',
] as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface TagWithConfidence {
  tag: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AITagGenerationResult {
  selfTags: {
    sectorTags: TagWithConfidence[];
    backgroundTags: TagWithConfidence[];
    personalityTags: TagWithConfidence[];
    careerTags: TagWithConfidence[];
    lifestyleTags: TagWithConfidence[];
    familyVisionTags: TagWithConfidence[];
    relationshipTags: TagWithConfidence[];
  };
  partnerTags: {
    sectorTags: TagWithConfidence[];
    backgroundTags: TagWithConfidence[];
    personalityTags: TagWithConfidence[];
    careerTags: TagWithConfidence[];
    lifestyleTags: TagWithConfidence[];
    familyVisionTags: TagWithConfidence[];
    relationshipTags: TagWithConfidence[];
    doesntMatterCategories: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// GEMINI API CALL
// ═══════════════════════════════════════════════════════════════

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing Gemini API key');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
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
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Soul Fingerprint tags from existing profile data using AI.
 * Called during user preparation phase for users without a Soul Fingerprint.
 *
 * @returns true if tags were generated, false if skipped
 */
export async function generateTagsFromProfileData(
  userId: string,
  profileId: string
): Promise<boolean> {
  console.log(`[AITagGen] Starting tag generation for user ${userId}`);

  // 1. Check if ProfileTags already exist
  const existingTags = await prisma.profileTags.findUnique({
    where: { profileId },
    select: { id: true, completedAt: true, source: true },
  });

  if (existingTags?.completedAt) {
    console.log(`[AITagGen] User ${userId} already has completed ProfileTags, skipping`);
    return false;
  }

  // 2. Load all available data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!user || !user.profile) {
    console.log(`[AITagGen] User ${userId} has no profile, skipping`);
    return false;
  }

  const profile = user.profile;
  const questionnaire = user.questionnaireResponses?.[0];

  // Load profile metrics if available
  const profileMetrics = await prisma.profileMetrics.findUnique({
    where: { profileId },
    select: {
      aiPersonalitySummary: true,
      aiSeekingSummary: true,
      aiBackgroundSummary: true,
      aiMatchmakerGuidelines: true,
      inferredReligiousLevel: true,
      inferredCity: true,
      inferredAge: true,
    },
  });

  // 3. Build the prompt
  const prompt = buildTagGenerationPrompt(user, profile, questionnaire, profileMetrics);

  // 4. Call AI
  try {
    const rawResponse = await callGemini(prompt);
    const parsed = JSON.parse(rawResponse) as AITagGenerationResult;

    // 5. Validate and filter tags (only MEDIUM/HIGH confidence)
    const validatedSelfTags = validateAndFilterTags(parsed.selfTags);
    const validatedPartnerTags = validateAndFilterPartnerTags(parsed.partnerTags);

    // 6. Save to DB
    await prisma.profileTags.upsert({
      where: { profileId },
      create: {
        profileId,
        userId,
        sectorTags: validatedSelfTags.sectorTags,
        backgroundTags: validatedSelfTags.backgroundTags,
        personalityTags: validatedSelfTags.personalityTags,
        careerTags: validatedSelfTags.careerTags,
        lifestyleTags: validatedSelfTags.lifestyleTags,
        familyVisionTags: validatedSelfTags.familyVisionTags,
        relationshipTags: validatedSelfTags.relationshipTags,
        diasporaTags: [],
        partnerTags: validatedPartnerTags as any,
        aiDerivedTags: [],
        source: 'AI_INFERRED',
        completedAt: new Date(),
        version: 1,
      },
      update: {
        sectorTags: validatedSelfTags.sectorTags,
        backgroundTags: validatedSelfTags.backgroundTags,
        personalityTags: validatedSelfTags.personalityTags,
        careerTags: validatedSelfTags.careerTags,
        lifestyleTags: validatedSelfTags.lifestyleTags,
        familyVisionTags: validatedSelfTags.familyVisionTags,
        relationshipTags: validatedSelfTags.relationshipTags,
        partnerTags: validatedPartnerTags as any,
        source: existingTags ? 'HYBRID' : 'AI_INFERRED',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const totalSelfTags = Object.values(validatedSelfTags).reduce(
      (sum, tags) => sum + tags.length, 0
    );
    console.log(
      `[AITagGen] Generated ${totalSelfTags} self tags + partner tags for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error(`[AITagGen] Failed for user ${userId}:`, error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

function buildTagGenerationPrompt(
  user: any,
  profile: any,
  questionnaire: any,
  metrics: any
): string {
  // Collect all available data
  const profileData: string[] = [];

  if (profile.religiousLevel) profileData.push(`Religious Level: ${profile.religiousLevel}`);
  if (profile.religiousJourney) profileData.push(`Religious Journey: ${profile.religiousJourney}`);
  if (profile.city) profileData.push(`City: ${profile.city}`);
  if (profile.occupation) profileData.push(`Occupation: ${profile.occupation}`);
  if (profile.education) profileData.push(`Education: ${profile.education}`);
  if (profile.educationLevel) profileData.push(`Education Level: ${profile.educationLevel}`);
  if (profile.about) profileData.push(`About (self-description): ${profile.about}`);
  if (profile.origin) profileData.push(`Origin: ${profile.origin}`);
  if (profile.nativeLanguage) profileData.push(`Native Language: ${profile.nativeLanguage}`);
  if (profile.additionalLanguages?.length) profileData.push(`Additional Languages: ${profile.additionalLanguages.join(', ')}`);
  if (profile.aliyaCountry) profileData.push(`Aliya Country: ${profile.aliyaCountry}`);
  if (profile.aliyaYear) profileData.push(`Aliya Year: ${profile.aliyaYear}`);
  if (profile.maritalStatus) profileData.push(`Marital Status: ${profile.maritalStatus}`);
  if (profile.hasChildrenFromPrevious) profileData.push(`Has Children: yes`);
  if (profile.parentStatus) profileData.push(`Parent Status: ${profile.parentStatus}`);
  if (profile.height) profileData.push(`Height: ${profile.height}cm`);
  if (profile.smokingStatus) profileData.push(`Smoking: ${profile.smokingStatus}`);
  if (profile.shomerNegiah !== null) profileData.push(`Shomer Negiah: ${profile.shomerNegiah}`);
  if (profile.headCovering) profileData.push(`Head Covering: ${profile.headCovering}`);
  if (profile.kippahType) profileData.push(`Kippah Type: ${profile.kippahType}`);
  if (profile.matchingNotes) profileData.push(`Matchmaker Notes: ${profile.matchingNotes}`);
  if (profile.internalMatchmakerNotes) profileData.push(`Internal Matchmaker Notes: ${profile.internalMatchmakerNotes}`);
  if (profile.gender) profileData.push(`Gender: ${profile.gender}`);

  // Preference data
  if (profile.preferredAgeMin) profileData.push(`Preferred Age Min: ${profile.preferredAgeMin}`);
  if (profile.preferredAgeMax) profileData.push(`Preferred Age Max: ${profile.preferredAgeMax}`);
  if (profile.preferredReligiousLevels?.length) profileData.push(`Preferred Religious Levels: ${profile.preferredReligiousLevels.join(', ')}`);
  if (profile.preferredSmokingStatus) profileData.push(`Preferred Smoking: ${profile.preferredSmokingStatus}`);

  // Questionnaire data
  let questionnaireText = '';
  if (questionnaire) {
    const sections = [
      { name: 'Personality', data: questionnaire.personalityAnswers },
      { name: 'Values', data: questionnaire.valuesAnswers },
      { name: 'Relationship', data: questionnaire.relationshipAnswers },
      { name: 'Partner', data: questionnaire.partnerAnswers },
      { name: 'Religion', data: questionnaire.religionAnswers },
    ];
    for (const section of sections) {
      if (section.data) {
        try {
          const parsed = typeof section.data === 'string' ? JSON.parse(section.data) : section.data;
          questionnaireText += `\n${section.name} Answers: ${JSON.stringify(parsed)}`;
        } catch { /* skip */ }
      }
    }
  }

  // AI summaries
  let aiSummaries = '';
  if (metrics) {
    if (metrics.aiPersonalitySummary) aiSummaries += `\nAI Personality Summary: ${metrics.aiPersonalitySummary}`;
    if (metrics.aiSeekingSummary) aiSummaries += `\nAI Seeking Summary: ${metrics.aiSeekingSummary}`;
    if (metrics.aiBackgroundSummary) aiSummaries += `\nAI Background Summary: ${metrics.aiBackgroundSummary}`;
    if (metrics.aiMatchmakerGuidelines) aiSummaries += `\nAI Matchmaker Guidelines: ${metrics.aiMatchmakerGuidelines}`;
  }

  const aiProfileSummary = profile.aiProfileSummary;
  if (aiProfileSummary) {
    try {
      const parsed = typeof aiProfileSummary === 'string' ? JSON.parse(aiProfileSummary) : aiProfileSummary;
      if (parsed.personalitySummary) aiSummaries += `\nProfile AI Personality: ${parsed.personalitySummary}`;
      if (parsed.lookingForSummary) aiSummaries += `\nProfile AI Looking For: ${parsed.lookingForSummary}`;
    } catch { /* skip */ }
  }

  return `You are an expert Jewish matchmaker (shadchan). Based on the user data below, generate Soul Fingerprint tags that describe who this person IS (self tags) and what they are LOOKING FOR in a partner (partner tags).

IMPORTANT RULES:
1. Only use tags from the VALID VALUES lists below - do NOT invent new tags
2. For each tag, specify confidence: HIGH (very certain from data), MEDIUM (reasonably inferred), or LOW (uncertain guess)
3. If you have no data to infer a category, output an empty array for that category
4. For partner tags: if there's no data to infer preferences, add the category to "doesntMatterCategories"
5. Be conservative - it's better to output fewer HIGH/MEDIUM tags than many LOW ones

═══ USER DATA ═══
${profileData.join('\n')}
${questionnaireText ? `\n═══ QUESTIONNAIRE ANSWERS ═══${questionnaireText}` : ''}
${aiSummaries ? `\n═══ AI SUMMARIES ═══${aiSummaries}` : ''}

═══ VALID TAG VALUES ═══

SECTOR TAGS (religious identity, practices):
${VALID_SECTOR_TAGS.join(', ')}

BACKGROUND TAGS (ethnic origin, family):
${VALID_BACKGROUND_TAGS.join(', ')}

PERSONALITY TAGS (character, social style):
${VALID_PERSONALITY_TAGS.join(', ')}

CAREER TAGS (work, education, finances):
${VALID_CAREER_TAGS.join(', ')}

LIFESTYLE TAGS (hobbies, location, daily life):
${VALID_LIFESTYLE_TAGS.join(', ')}

FAMILY VISION TAGS (children, home, parenting):
${VALID_FAMILY_TAGS.join(', ')}

RELATIONSHIP TAGS (love style, closeness, model):
${VALID_RELATIONSHIP_TAGS.join(', ')}

═══ OUTPUT FORMAT ═══
Return a JSON object with this EXACT structure:
{
  "selfTags": {
    "sectorTags": [{"tag": "value", "confidence": "HIGH"}],
    "backgroundTags": [{"tag": "value", "confidence": "MEDIUM"}],
    "personalityTags": [...],
    "careerTags": [...],
    "lifestyleTags": [...],
    "familyVisionTags": [...],
    "relationshipTags": [...]
  },
  "partnerTags": {
    "sectorTags": [{"tag": "value", "confidence": "HIGH"}],
    "backgroundTags": [...],
    "personalityTags": [...],
    "careerTags": [...],
    "lifestyleTags": [...],
    "familyVisionTags": [...],
    "relationshipTags": [...],
    "doesntMatterCategories": ["category1", "category2"]
  }
}`;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

const VALID_TAG_MAP: Record<string, string[]> = {
  sectorTags: VALID_SECTOR_TAGS,
  backgroundTags: VALID_BACKGROUND_TAGS,
  personalityTags: VALID_PERSONALITY_TAGS,
  careerTags: VALID_CAREER_TAGS,
  lifestyleTags: VALID_LIFESTYLE_TAGS,
  familyVisionTags: VALID_FAMILY_TAGS,
  relationshipTags: VALID_RELATIONSHIP_TAGS,
};

function filterTagsByConfidence(
  tags: TagWithConfidence[] | undefined,
  validValues: string[]
): string[] {
  if (!tags || !Array.isArray(tags)) return [];

  return tags
    .filter(t => {
      const conf = t.confidence?.toUpperCase();
      return (conf === 'HIGH' || conf === 'MEDIUM') && validValues.includes(t.tag);
    })
    .map(t => t.tag);
}

function validateAndFilterTags(
  selfTags: AITagGenerationResult['selfTags']
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [key, validValues] of Object.entries(VALID_TAG_MAP)) {
    const raw = selfTags?.[key as keyof typeof selfTags];
    result[key] = filterTagsByConfidence(raw, validValues);
  }

  return result;
}

function validateAndFilterPartnerTags(
  partnerTags: AITagGenerationResult['partnerTags']
): PartnerTagPreferences {
  const result: PartnerTagPreferences = {
    sectorTags: [],
    backgroundTags: [],
    personalityTags: [],
    careerTags: [],
    lifestyleTags: [],
    familyVisionTags: [],
    relationshipTags: [],
    doesntMatterCategories: [],
  };

  if (!partnerTags) return result;

  for (const [key, validValues] of Object.entries(VALID_TAG_MAP)) {
    const raw = partnerTags[key as keyof typeof partnerTags];
    if (Array.isArray(raw)) {
      (result as any)[key] = filterTagsByConfidence(
        raw as TagWithConfidence[],
        validValues
      );
    }
  }

  // Validate doesntMatterCategories
  if (Array.isArray(partnerTags.doesntMatterCategories)) {
    result.doesntMatterCategories = partnerTags.doesntMatterCategories.filter(
      (c: string) => VALID_CATEGORIES.includes(c as any)
    );
  }

  return result;
}
