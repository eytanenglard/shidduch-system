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

export interface PartnerTagPreferences {
  sectorTags: string[];
  backgroundTags: string[];
  personalityTags: string[];
  careerTags: string[];
  lifestyleTags: string[];
  familyVisionTags: string[];
  relationshipTags: string[];
  doesntMatterCategories: string[];
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

  // Additional background tags
  const parentsStatus = answers['s2_parents_status'] as string;
  if (parentsStatus) result.backgroundTags.push(`parents_${parentsStatus}`);
  const relParents = answers['s2_relationship_parents'] as string;
  if (relParents) result.backgroundTags.push(`rel_parents_${relParents}`);
  const familySize = answers['s2_family_size'] as string;
  if (familySize) result.backgroundTags.push(familySize);
  const familyExtended = answers['s2_family_extended'] as string;
  if (familyExtended) result.backgroundTags.push(`family_ext_${familyExtended}`);

  // Additional personality tags
  const energyType = answers['s3_energy_type'] as number;
  if (energyType !== null && energyType !== undefined) {
    if (energyType <= 30) result.personalityTags.push('introverted');
    else if (energyType >= 70) result.personalityTags.push('extroverted');
    else result.personalityTags.push('ambivert');
  }
  const sensitivity = answers['s3_sensitivity'] as string;
  if (sensitivity) result.personalityTags.push(sensitivity);
  const changeApproach = answers['s3_change_approach'] as string;
  if (changeApproach) result.personalityTags.push(changeApproach);

  // Additional career tags
  const workStatus = answers['s4_work_status'] as string;
  if (workStatus) result.careerTags.push(workStatus);
  const lifePriority = answers['s4_life_priority'] as string;
  if (lifePriority) result.careerTags.push(lifePriority);
  const moneyAttitude = answers['s4_money_attitude'] as string;
  if (moneyAttitude) result.careerTags.push(moneyAttitude);

  // Additional lifestyle tags
  const fitness = answers['s5_fitness'] as string;
  if (fitness) result.lifestyleTags.push(fitness);
  const smoking = answers['s5_smoking'] as string;
  if (smoking) result.lifestyleTags.push(smoking);
  const dressStyle = answers['s5_dress_style'] as string;
  if (dressStyle) result.lifestyleTags.push(dressStyle);
  const openAbroad = answers['s5_open_abroad'] as string;
  if (openAbroad) result.lifestyleTags.push(openAbroad);
  const pets = answers['s5_pets'] as string;
  if (pets) result.lifestyleTags.push(`pets_${pets}`);
  const politics = answers['s5_politics'] as string;
  if (politics) result.lifestyleTags.push(`politics_${politics}`);
  const diet = answers['s5_diet'] as string[];
  if (diet) result.lifestyleTags.push(...diet);
  const travelFreq = answers['s5_travel_frequency'] as string;
  if (travelFreq) result.lifestyleTags.push(`travel_${travelFreq}`);

  // Additional family tags
  const eduSystem = answers['s6_education_system'] as string;
  if (eduSystem) result.familyVisionTags.push(`edu_${eduSystem}`);

  // Additional relationship tags
  const meetingPace = answers['s7_meeting_pace'] as string;
  if (meetingPace) result.relationshipTags.push(`pace_${meetingPace}`);

  // Diaspora tags
  const diasporaCommunity = answers['s1_diaspora_community'] as string;
  if (diasporaCommunity) result.diasporaTags.push(diasporaCommunity);
  const diasporaEdu = answers['s1_diaspora_education'] as string;
  if (diasporaEdu) result.diasporaTags.push(diasporaEdu);
  const aliyah = answers['s1_diaspora_aliyah'] as string;
  if (aliyah) result.diasporaTags.push(`aliyah_${aliyah}`);

  return result;
}

function collectPartnerTags(
  answers: SFAnswers,
  questionId: string,
): { tags: string[]; isDoesntMatter: boolean } {
  const val = answers[questionId];
  if (!val) return { tags: [], isDoesntMatter: false };

  const arr = Array.isArray(val) ? val : [val as string];
  if (arr.includes('doesnt_matter')) return { tags: [], isDoesntMatter: true };
  return { tags: arr, isDoesntMatter: false };
}

export function derivePartnerTagsFromAnswers(answers: SFAnswers): PartnerTagPreferences {
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

  // Sector partner tags
  const sectorPref = collectPartnerTags(answers, 'p_sector_preference');
  if (sectorPref.isDoesntMatter) result.doesntMatterCategories.push('sector');
  else result.sectorTags.push(...sectorPref.tags);

  const zionPref = collectPartnerTags(answers, 'p_zionism_preference');
  if (!zionPref.isDoesntMatter) result.sectorTags.push(...zionPref.tags);

  const masoPref = collectPartnerTags(answers, 'p_masorti_practices');
  if (!masoPref.isDoesntMatter) result.sectorTags.push(...masoPref.tags);

  const hilPref = collectPartnerTags(answers, 'p_hiloni_identity');
  if (!hilPref.isDoesntMatter) result.sectorTags.push(...hilPref.tags);

  const negPref = collectPartnerTags(answers, 's1_shomer_negiah');
  if (!negPref.isDoesntMatter) result.sectorTags.push(...negPref.tags.map(t => `negiah_${t}`));

  // Background partner tags
  const ethPref = collectPartnerTags(answers, 'p_ethnic_preference');
  if (ethPref.isDoesntMatter) result.doesntMatterCategories.push('background');
  else result.backgroundTags.push(...ethPref.tags);

  // Personality partner tags
  const charPref = collectPartnerTags(answers, 'p_character_preferred');
  if (charPref.isDoesntMatter) result.doesntMatterCategories.push('personality');
  else result.personalityTags.push(...charPref.tags);

  const tempoPref = collectPartnerTags(answers, 'p_life_tempo');
  if (!tempoPref.isDoesntMatter) result.personalityTags.push(...tempoPref.tags);

  const spontPref = collectPartnerTags(answers, 'p_spontaneity');
  if (!spontPref.isDoesntMatter) result.personalityTags.push(...spontPref.tags);

  const humPref = collectPartnerTags(answers, 'p_humor');
  if (!humPref.isDoesntMatter) result.personalityTags.push(...humPref.tags.map(h => `humor_${h}`));

  const confPref = collectPartnerTags(answers, 'p_conflict');
  if (!confPref.isDoesntMatter) result.personalityTags.push(...confPref.tags);

  const socPref = collectPartnerTags(answers, 'p_social_role');
  if (!socPref.isDoesntMatter) result.personalityTags.push(...socPref.tags);

  const enSrcPref = collectPartnerTags(answers, 'p_energy_source');
  if (!enSrcPref.isDoesntMatter) result.personalityTags.push(...enSrcPref.tags.map(e => `energy_${e}`));

  // Career partner tags
  const eduPref = collectPartnerTags(answers, 'p_education_level');
  if (eduPref.isDoesntMatter) result.doesntMatterCategories.push('career');
  else result.careerTags.push(...eduPref.tags);

  const fieldPref = collectPartnerTags(answers, 'p_field');
  if (!fieldPref.isDoesntMatter) result.careerTags.push(...fieldPref.tags);

  const ambPref = collectPartnerTags(answers, 'p_ambition');
  if (!ambPref.isDoesntMatter) result.careerTags.push(...ambPref.tags);

  const finPref = collectPartnerTags(answers, 'p_financial_style');
  if (!finPref.isDoesntMatter) result.careerTags.push(...finPref.tags);

  const carPref = collectPartnerTags(answers, 's4_partner_career');
  if (carPref.tags.length > 0) result.careerTags.push(...carPref.tags);

  // Lifestyle partner tags
  const locPref = collectPartnerTags(answers, 'p_location');
  if (locPref.isDoesntMatter) result.doesntMatterCategories.push('lifestyle');
  else result.lifestyleTags.push(...locPref.tags.map(l => `loc_${l}`));

  const rhyPref = collectPartnerTags(answers, 'p_rhythm');
  if (!rhyPref.isDoesntMatter) result.lifestyleTags.push(...rhyPref.tags);

  const kasPref = collectPartnerTags(answers, 'p_kashrut');
  if (!kasPref.isDoesntMatter) result.lifestyleTags.push(...kasPref.tags);

  const hobPref = collectPartnerTags(answers, 'p_shared_hobbies');
  if (!hobPref.isDoesntMatter) result.lifestyleTags.push(...hobPref.tags);

  const travPref = collectPartnerTags(answers, 'p_travel_frequency');
  if (!travPref.isDoesntMatter) result.lifestyleTags.push(...travPref.tags.map(t => `travel_${t}`));

  const petPref = collectPartnerTags(answers, 'p_pets');
  if (!petPref.isDoesntMatter) result.lifestyleTags.push(...petPref.tags.map(p => `pets_${p}`));

  const smokPref = collectPartnerTags(answers, 'p_smoking');
  if (!smokPref.isDoesntMatter) result.lifestyleTags.push(...smokPref.tags);

  // Family partner tags
  const childPref = collectPartnerTags(answers, 'p_children_count');
  if (childPref.isDoesntMatter) result.doesntMatterCategories.push('family');
  else result.familyVisionTags.push(...childPref.tags);

  const rolePref = collectPartnerTags(answers, 'p_home_roles');
  if (!rolePref.isDoesntMatter) result.familyVisionTags.push(...rolePref.tags);

  const parPref = collectPartnerTags(answers, 'p_parenting_style');
  if (!parPref.isDoesntMatter) result.familyVisionTags.push(...parPref.tags);

  const eduSysPref = collectPartnerTags(answers, 'p_education_system');
  if (!eduSysPref.isDoesntMatter) result.familyVisionTags.push(...eduSysPref.tags.map(e => `edu_${e}`));

  const atmPref = collectPartnerTags(answers, 'p_home_atmosphere');
  if (!atmPref.isDoesntMatter) result.familyVisionTags.push(...atmPref.tags);

  const partChildPref = collectPartnerTags(answers, 's6_partner_children');
  if (partChildPref.tags.length > 0) result.familyVisionTags.push(...partChildPref.tags.map(t => `partner_children_${t}`));

  const blendPref = collectPartnerTags(answers, 's6_blended_family');
  if (blendPref.tags.length > 0) result.familyVisionTags.push(...blendPref.tags.map(t => `blended_${t}`));

  // Relationship partner tags
  const relMeanPref = collectPartnerTags(answers, 'p_relationship_meaning');
  if (relMeanPref.isDoesntMatter) result.doesntMatterCategories.push('relationship');
  else result.relationshipTags.push(...relMeanPref.tags);

  const lovePref = collectPartnerTags(answers, 'p_love_language');
  if (!lovePref.isDoesntMatter) result.relationshipTags.push(...lovePref.tags);

  const closePref = collectPartnerTags(answers, 'p_closeness');
  if (!closePref.isDoesntMatter) result.relationshipTags.push(...closePref.tags);

  const relModPref = collectPartnerTags(answers, 'p_relationship_model');
  if (!relModPref.isDoesntMatter) result.relationshipTags.push(...relModPref.tags);

  const openPartText = answers['s7_open_partner'] as string;
  if (openPartText) result.relationshipTags.push('has_open_description');

  return result;
}
