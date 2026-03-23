// Mapping of 5-Worlds question IDs that overlap with Soul Fingerprint questions.
// When a user has completed Soul Fingerprint, these questions are skipped
// in the 5-Worlds questionnaire to avoid asking the same thing twice.

export const SOUL_FINGERPRINT_OVERLAP: Record<string, string> = {
  // Personality world
  personality_smoking_status: 's5_smoking',
  personality_humor_type: 's3_humor',
  personality_sleep_flexibility: 's3_sleep_flexibility',
  personality_plan_change_reaction: 's3_plan_change_reaction',
  personality_life_pace: 's3_life_tempo',

  // Relationship world
  relationship_love_languages: 's7_love_language',
  relationship_physical_intimacy_importance: 's7_physical_intimacy',
  relationship_argument_style: 's7_argument_style',
  relationship_silent_treatment_view: 's7_silent_treatment',
  relationship_expressing_needs: 's7_expressing_needs',
  relationship_daily_togetherness_vs_autonomy_revised: 's7_closeness',
  relationship_core_meaning_revised: 's7_relationship_meaning',
  relationship_screen_time_approach: 's5_screen_time',

  // Partner world
  partner_smoking_preference: 'p_smoking',

  // Values world
  values_attitude_towards_money_revised: 's4_money_attitude',
  values_health_lifestyle_importance: 's5_fitness',
};

// Set of 5-Worlds question IDs that should be skipped when Soul Fingerprint is completed
export const OVERLAPPING_QUESTION_IDS = new Set(Object.keys(SOUL_FINGERPRINT_OVERLAP));
