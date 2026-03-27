// Known prefixes added by deriveTagsFromAnswers and their source question IDs
export const TAG_PREFIX_TO_QUESTION: [string, string][] = [
  ['rel_parents_', 's2_relationship_parents'],
  ['family_ext_', 's2_family_extended'],
  ['ext_family_', 's6_extended_family'],
  ['in_laws_', 's6_in_laws_conflict'],
  ['direction_', 's1_religious_direction'],
  ['davening_', 's1_davening_practice'],
  ['argument_', 's7_argument_style'],
  ['hasidic_', 'anchor_sector_hasidic'],
  ['parents_', 's2_parents_status'],
  ['politics_', 's5_politics'],
  ['screen_', 's5_screen_time'],
  ['travel_', 's5_travel_style'],
  ['negiah_', 's1_shomer_negiah'],
  ['energy_', 's3_energy_source'],
  ['sleep_', 's3_sleep_flexibility'],
  ['needs_', 's7_expressing_needs'],
  ['humor_', 's3_humor'],
  ['risk_', 's5_risk_attitude'],
  ['pets_', 's5_pets'],
  ['edu_', 's6_education_system'],
  ['loc_', 's5_location'],
  ['bt_', 's1_bt_path'],
];

export const COMPUTED_TAG_TRANSLATIONS_HE: Record<string, string> = {
  introverted: 'מופנם',
  extroverted: 'מוחצן',
  ambivert: 'ביניים',
  plan_rigid: 'מתוכנן',
  plan_flexible: 'גמיש',
  plan_moderate: 'מאוזן',
  silence_never_ok: 'לא בעד שתיקה',
  silence_sometimes_ok: 'שתיקה לפעמים בסדר',
  silence_moderate: 'גישה מאוזנת לשתיקה',
};

export const COMPUTED_TAG_TRANSLATIONS_EN: Record<string, string> = {
  introverted: 'Introverted',
  extroverted: 'Extroverted',
  ambivert: 'Ambivert',
  plan_rigid: 'Structured',
  plan_flexible: 'Flexible',
  plan_moderate: 'Balanced',
  silence_never_ok: 'No silent treatment',
  silence_sometimes_ok: 'Silence sometimes OK',
  silence_moderate: 'Moderate on silence',
};

/**
 * Build a flat map from option values to their translated labels.
 * Walks through dict.options.<questionId>.<value> and collects translations.
 */
export function buildOptionTranslationMap(
  dict: Record<string, unknown>,
  gender: 'MALE' | 'FEMALE' | null
): Record<string, string> {
  const map: Record<string, string> = {};
  const options = (dict as Record<string, Record<string, Record<string, unknown>>>).options;
  if (!options) return map;

  for (const [, questionOptions] of Object.entries(options)) {
    if (typeof questionOptions !== 'object' || !questionOptions) continue;
    for (const [value, label] of Object.entries(questionOptions)) {
      if (value.endsWith('_sub')) continue;
      if (typeof label === 'string') {
        map[value] = label;
      } else if (
        label &&
        typeof label === 'object' &&
        'male' in (label as Record<string, unknown>) &&
        'female' in (label as Record<string, unknown>)
      ) {
        const gendered = label as { male: string; female: string };
        map[value] = gender === 'FEMALE' ? gendered.female : gendered.male;
      }
    }
  }

  return map;
}

/**
 * Create a translateTag function from the option map and computed translations.
 */
export function createTagTranslator(
  optionMap: Record<string, string>,
  computedMap: Record<string, string>
): (tag: string) => string {
  return (tag: string) => {
    // 1. Direct lookup in option map
    if (optionMap[tag]) return optionMap[tag];

    // 2. Check computed tags
    if (computedMap[tag]) return computedMap[tag];

    // 3. Try stripping known prefixes (already sorted longest-first in the constant)
    for (const [prefix] of TAG_PREFIX_TO_QUESTION) {
      if (tag.startsWith(prefix)) {
        const baseValue = tag.slice(prefix.length);
        if (optionMap[baseValue]) return optionMap[baseValue];
      }
    }

    // 4. Fallback: replace underscores with spaces
    return tag.replace(/_/g, ' ');
  };
}
