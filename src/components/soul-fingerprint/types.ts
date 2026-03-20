export type SectorValue =
  | 'charedi_litvish'
  | 'charedi_hasidic'
  | 'charedi_sephardi'
  | 'charedi_modern'
  | 'hardal'
  | 'dati_leumi_torani'
  | 'dati_leumi_classic'
  | 'dati_leumi_modern'
  | 'dati_lite'
  | 'datlash'
  | 'chozer_bteshuva'
  | 'masorti_strong'
  | 'masorti_medium'
  | 'masorti_light'
  | 'hiloni_jewish'
  | 'hiloni_cultural'
  | 'hiloni'
  | 'in_process'
  | 'diaspora'
  | 'other';

export type SectorGroup =
  | 'charedi'
  | 'dati_leumi'
  | 'masorti'
  | 'hiloni'
  | 'chozer_bteshuva'
  | 'diaspora'
  | 'in_process';

export type LifeStageValue =
  | 'first_marriage'
  | 'divorced_no_children'
  | 'divorced_with_children'
  | 'widowed'
  | 'returning';

export type QuestionType =
  | 'singleChoice'
  | 'multiSelect'
  | 'openText'
  | 'slider';

export type SectionId =
  | 'anchor'
  | 'identity'
  | 'background'
  | 'personality'
  | 'career'
  | 'lifestyle'
  | 'family'
  | 'relationship';

export interface SFOption {
  value: string;
  labelKey: string;
  subtitleKey?: string;
  icon?: string;
  color?: string;
  isCustomInput?: boolean;
}

export interface SFCondition {
  sectors?: SectorValue[];
  sectorGroups?: SectorGroup[];
  lifeStages?: LifeStageValue[];
  genders?: ('MALE' | 'FEMALE')[];
  requiredAnswers?: { questionId: string; values: string[] }[];
  excludeAnswers?: { questionId: string; values: string[] }[];
}

export interface SFQuestion {
  id: string;
  type: QuestionType;
  textKey: string;
  subtitleKey?: string;
  placeholderKey?: string;
  category: string;
  forSelf: boolean;
  forPartner: boolean;
  options?: SFOption[];
  conditions?: SFCondition;
  allowCustom?: boolean;
  maxCustomLength?: number;
  maxSelections?: number;
  required?: boolean;
  isOptional?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderLeftKey?: string;
  sliderRightKey?: string;
}

export interface SFSection {
  id: SectionId;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  color: string;
  questions: SFQuestion[];
}

export type SFAnswers = Record<string, string | string[] | number | null>;

export interface SFState {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: SFAnswers;
  sectorGroup: SectorGroup | null;
  sector: SectorValue | null;
  lifeStage: LifeStageValue | null;
  isComplete: boolean;
  showingPartnerQuestions: boolean;
}

export interface SFTagResult {
  sectorTags: string[];
  backgroundTags: string[];
  personalityTags: string[];
  careerTags: string[];
  lifestyleTags: string[];
  familyVisionTags: string[];
  relationshipTags: string[];
  diasporaTags: string[];
}

export function getSectorGroup(sector: SectorValue | null): SectorGroup {
  if (!sector) return 'in_process';
  if (['charedi_litvish', 'charedi_hasidic', 'charedi_sephardi', 'charedi_modern'].includes(sector)) return 'charedi';
  if (['hardal', 'dati_leumi_torani', 'dati_leumi_classic', 'dati_leumi_modern', 'dati_lite', 'datlash'].includes(sector)) return 'dati_leumi';
  if (['masorti_strong', 'masorti_medium', 'masorti_light'].includes(sector)) return 'masorti';
  if (['hiloni_jewish', 'hiloni_cultural', 'hiloni'].includes(sector)) return 'hiloni';
  if (sector === 'chozer_bteshuva') return 'chozer_bteshuva';
  if (sector === 'diaspora') return 'diaspora';
  return 'in_process';
}

export function isQuestionVisible(
  question: SFQuestion,
  answers: SFAnswers,
  sectorGroup: SectorGroup | null,
  sector: SectorValue | null,
  lifeStage: LifeStageValue | null,
  gender: 'MALE' | 'FEMALE' | null
): boolean {
  const cond = question.conditions;
  if (!cond) return true;

  if (cond.sectors && sector && !cond.sectors.includes(sector)) return false;
  if (cond.sectorGroups && sectorGroup && !cond.sectorGroups.includes(sectorGroup)) return false;
  if (cond.lifeStages && lifeStage && !cond.lifeStages.includes(lifeStage)) return false;
  if (cond.genders && gender && !cond.genders.includes(gender)) return false;

  if (cond.requiredAnswers) {
    for (const req of cond.requiredAnswers) {
      const ans = answers[req.questionId];
      if (!ans) return false;
      const ansArr = Array.isArray(ans) ? ans : [ans as string];
      if (!req.values.some(v => ansArr.includes(v))) return false;
    }
  }

  if (cond.excludeAnswers) {
    for (const exc of cond.excludeAnswers) {
      const ans = answers[exc.questionId];
      if (ans) {
        const ansArr = Array.isArray(ans) ? ans : [ans as string];
        if (exc.values.some(v => ansArr.includes(v))) return false;
      }
    }
  }

  return true;
}

export function deriveTagsFromAnswers(answers: SFAnswers): SFTagResult {
  const result: SFTagResult = {
    sectorTags: [],
    backgroundTags: [],
    personalityTags: [],
    careerTags: [],
    lifestyleTags: [],
    familyVisionTags: [],
    relationshipTags: [],
    diasporaTags: [],
  };

  // Sector tags
  const sector = answers['anchor_sector'] as string;
  if (sector) result.sectorTags.push(sector);
  const hasidic = answers['anchor_sector_hasidic'] as string;
  if (hasidic) result.sectorTags.push(`hasidic_${hasidic}`);

  // Identity tags
  const studyWork = answers['s1_charedi_study_work'] as string;
  if (studyWork) result.sectorTags.push(studyWork);
  const armyType = answers['s1_dl_army_type'] as string;
  if (armyType) result.sectorTags.push(armyType);
  const zionism = answers['s1_dl_zionism'] as string;
  if (zionism) result.sectorTags.push(zionism);
  const btPath = answers['s1_bt_path'] as string;
  if (btPath) result.sectorTags.push(`bt_${btPath}`);
  const shomerNegiah = answers['s1_shomer_negiah'] as string;
  if (shomerNegiah) result.sectorTags.push(`negiah_${shomerNegiah}`);

  // Background tags
  const ethnic = answers['s2_ethnic'] as string;
  if (ethnic) result.backgroundTags.push(ethnic);
  const origin = answers['s2_origin'] as string;
  if (origin) result.backgroundTags.push(origin);
  const familyAtm = answers['s2_family_atmosphere'] as string;
  if (familyAtm) result.backgroundTags.push(familyAtm);

  // Personality tags
  const character = answers['s3_character_primary'] as string;
  if (character) result.personalityTags.push(character);
  const tempo = answers['s3_life_tempo'] as string;
  if (tempo) result.personalityTags.push(tempo);
  const spontaneity = answers['s3_spontaneity'] as string;
  if (spontaneity) result.personalityTags.push(spontaneity);
  const conflict = answers['s3_conflict'] as string;
  if (conflict) result.personalityTags.push(conflict);
  const socialRole = answers['s3_social_role'] as string;
  if (socialRole) result.personalityTags.push(socialRole);
  const humor = answers['s3_humor'] as string[];
  if (humor) result.personalityTags.push(...humor.map(h => `humor_${h}`));
  const energySource = answers['s3_energy_source'] as string[];
  if (energySource) result.personalityTags.push(...energySource.map(e => `energy_${e}`));

  // Career tags
  const field = answers['s4_field'] as string[];
  if (field) result.careerTags.push(...field);
  const ambition = answers['s4_ambition'] as string;
  if (ambition) result.careerTags.push(ambition);
  const finStyle = answers['s4_financial_style'] as string;
  if (finStyle) result.careerTags.push(finStyle);
  const education = answers['s4_education_level'] as string;
  if (education) result.careerTags.push(education);

  // Lifestyle tags
  const hobbies = answers['s5_hobbies'] as string[];
  if (hobbies) result.lifestyleTags.push(...hobbies);
  const kashrut = answers['s5_kashrut'] as string;
  if (kashrut) result.lifestyleTags.push(kashrut);
  const travelStyle = answers['s5_travel_style'] as string[];
  if (travelStyle) result.lifestyleTags.push(...travelStyle.map(t => `travel_${t}`));
  const location = answers['s5_location'] as string[];
  if (location) result.lifestyleTags.push(...location.map(l => `loc_${l}`));
  const rhythm = answers['s5_rhythm'] as string;
  if (rhythm) result.lifestyleTags.push(rhythm);

  // Family tags
  const childrenCount = answers['s6_children_count'] as string;
  if (childrenCount) result.familyVisionTags.push(childrenCount);
  const homeRoles = answers['s6_home_roles'] as string;
  if (homeRoles) result.familyVisionTags.push(homeRoles);
  const parentingStyle = answers['s6_parenting_style'] as string;
  if (parentingStyle) result.familyVisionTags.push(parentingStyle);
  const homeAtm = answers['s6_home_atmosphere'] as string[];
  if (homeAtm) result.familyVisionTags.push(...homeAtm);

  // Relationship tags
  const relMeaning = answers['s7_relationship_meaning'] as string[];
  if (relMeaning) result.relationshipTags.push(...relMeaning);
  const loveLanguage = answers['s7_love_language'] as string;
  if (loveLanguage) result.relationshipTags.push(loveLanguage);
  const closeness = answers['s7_closeness'] as string;
  if (closeness) result.relationshipTags.push(closeness);
  const relModel = answers['s7_relationship_model'] as string;
  if (relModel) result.relationshipTags.push(relModel);

  // Diaspora tags
  const diasporaCommunity = answers['s1_diaspora_community'] as string;
  if (diasporaCommunity) result.diasporaTags.push(diasporaCommunity);
  const diasporaEdu = answers['s1_diaspora_education'] as string;
  if (diasporaEdu) result.diasporaTags.push(diasporaEdu);
  const aliyah = answers['s1_diaspora_aliyah'] as string;
  if (aliyah) result.diasporaTags.push(`aliyah_${aliyah}`);

  return result;
}
