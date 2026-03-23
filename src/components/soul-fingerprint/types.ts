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

  // Additional personality tags - new
  const sleepFlex = answers['s3_sleep_flexibility'] as string;
  if (sleepFlex) result.personalityTags.push(`sleep_${sleepFlex}`);
  const planChange = answers['s3_plan_change_reaction'] as number;
  if (planChange !== null && planChange !== undefined) {
    if (planChange <= 30) result.personalityTags.push('plan_rigid');
    else if (planChange >= 70) result.personalityTags.push('plan_flexible');
    else result.personalityTags.push('plan_moderate');
  }

  // Additional lifestyle tags - new
  const screenTime = answers['s5_screen_time'] as string;
  if (screenTime) result.lifestyleTags.push(`screen_${screenTime}`);
  const riskAttitude = answers['s5_risk_attitude'] as string;
  if (riskAttitude) result.lifestyleTags.push(`risk_${riskAttitude}`);

  // Additional family tags - new
  const extFamily = answers['s6_extended_family'] as string;
  if (extFamily) result.familyVisionTags.push(`ext_family_${extFamily}`);
  const inLaws = answers['s6_in_laws_conflict'] as string;
  if (inLaws) result.familyVisionTags.push(`in_laws_${inLaws}`);

  // Additional relationship tags - new
  const expressingNeeds = answers['s7_expressing_needs'] as string;
  if (expressingNeeds) result.relationshipTags.push(`needs_${expressingNeeds}`);
  const argumentStyle = answers['s7_argument_style'] as string;
  if (argumentStyle) result.relationshipTags.push(`argument_${argumentStyle}`);
  const silentTreatment = answers['s7_silent_treatment'] as number;
  if (silentTreatment !== null && silentTreatment !== undefined) {
    if (silentTreatment <= 30) result.relationshipTags.push('silence_never_ok');
    else if (silentTreatment >= 70) result.relationshipTags.push('silence_sometimes_ok');
    else result.relationshipTags.push('silence_moderate');
  }
  const physIntimacy = answers['s7_physical_intimacy'] as number;
  if (physIntimacy !== null && physIntimacy !== undefined) {
    if (physIntimacy <= 30) result.relationshipTags.push('intimacy_less_important');
    else if (physIntimacy >= 70) result.relationshipTags.push('intimacy_very_important');
    else result.relationshipTags.push('intimacy_moderate');
  }
  const communityRole = answers['s7_community_role'] as string;
  if (communityRole) result.relationshipTags.push(`community_${communityRole}`);

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

  // New: Miluim tags (identity)
  const miluimStatus = answers['s1_miluim_status'] as string;
  if (miluimStatus) result.sectorTags.push(`miluim_${miluimStatus}`);
  const miluimAttitude = answers['s1_miluim_attitude_f'] as string;
  if (miluimAttitude) result.sectorTags.push(`miluim_attitude_${miluimAttitude}`);

  // New: Meaning source (personality)
  const meaningSource = answers['s3_meaning_source'] as string[];
  if (meaningSource) result.personalityTags.push(...meaningSource.map(m => `meaning_${m}`));

  // New: Dress code tags (lifestyle)
  const dressCodeF = answers['s5_dress_code_f'] as string;
  if (dressCodeF) result.lifestyleTags.push(`dress_${dressCodeF}`);
  const dressCodeM = answers['s5_dress_code_m'] as string;
  if (dressCodeM) result.lifestyleTags.push(`dress_${dressCodeM}`);

  // New: Tech relationship (lifestyle)
  const techRel = answers['s5_tech_relationship'] as string;
  if (techRel) result.lifestyleTags.push(`tech_${techRel}`);

  // New: Urban identity (lifestyle)
  const urbanId = answers['s5_urban_identity'] as string;
  if (urbanId) result.lifestyleTags.push(`urban_${urbanId}`);

  // New: Vacation style (lifestyle)
  const vacationStyle = answers['s5_vacation_style'] as string;
  if (vacationStyle) result.lifestyleTags.push(`vacation_${vacationStyle}`);

  // New: English comfort (lifestyle/diaspora)
  const englishComfort = answers['s5_english_comfort'] as string;
  if (englishComfort) result.lifestyleTags.push(`english_${englishComfort}`);

  // New: Political identity (lifestyle)
  const politicalId = answers['s5_political_identity'] as string;
  if (politicalId) result.lifestyleTags.push(`political_${politicalId}`);

  // New: Parents involvement in dating (family)
  const parentsInvolvement = answers['s6_parents_involvement_dating'] as string;
  if (parentsInvolvement) result.familyVisionTags.push(`parents_dating_${parentsInvolvement}`);

  // New: Emotional needs (relationship)
  const emotionalNeeds = answers['s7_emotional_needs'] as string[];
  if (emotionalNeeds) result.relationshipTags.push(...emotionalNeeds.map(n => `need_${n}`));

  // New: Couple dynamic (relationship)
  const coupleDynamic = answers['s7_couple_dynamic'] as string;
  if (coupleDynamic) result.relationshipTags.push(`dynamic_${coupleDynamic}`);

  // New: Flexibility scale (relationship)
  const flexScale = answers['s7_flexibility_scale'] as number;
  if (flexScale !== null && flexScale !== undefined) {
    if (flexScale <= 30) result.relationshipTags.push('flexibility_rigid');
    else if (flexScale >= 70) result.relationshipTags.push('flexibility_high');
    else result.relationshipTags.push('flexibility_moderate');
  }

  // New batch 2: Religious direction (sector)
  const relDirection = answers['s1_religious_direction'] as string;
  if (relDirection) result.sectorTags.push(`direction_${relDirection}`);

  // New batch 2: Davening practice (sector)
  const davening = answers['s1_davening_practice'] as string;
  if (davening) result.sectorTags.push(`davening_${davening}`);

  // Datlash tags
  const datlashOrigin = answers['s1_datlash_origin'] as string;
  if (datlashOrigin) result.sectorTags.push(`datlash_from_${datlashOrigin}`);
  const datlashCurrent = answers['s1_datlash_current'] as string;
  if (datlashCurrent) result.sectorTags.push(`datlash_now_${datlashCurrent}`);
  const datlashRel = answers['s1_datlash_relationship_religion'] as string;
  if (datlashRel) result.sectorTags.push(`datlash_rel_${datlashRel}`);

  // Divorce tags
  const divorceContext = answers['s6_divorce_context'] as string;
  if (divorceContext && divorceContext !== 'prefer_not_say') result.familyVisionTags.push(`divorce_${divorceContext}`);
  const divorceCustody = answers['s6_divorce_custody'] as string;
  if (divorceCustody && divorceCustody !== 'prefer_not_say') result.familyVisionTags.push(`custody_${divorceCustody}`);
  const divorceReadiness = answers['s6_divorce_readiness'] as string;
  if (divorceReadiness) result.familyVisionTags.push(`readiness_${divorceReadiness}`);

  // Widowed time tag
  const widowedTime = answers['s6_widowed_time'] as string;
  if (widowedTime && widowedTime !== 'prefer_not_say') result.familyVisionTags.push(`widowed_${widowedTime}`);

  // New batch 2: Attachment style (personality)
  const attachment = answers['s3_attachment_style'] as string;
  if (attachment) result.personalityTags.push(`attachment_${attachment}`);

  // New batch 2: Patience level (personality)
  const patience = answers['s3_patience_level'] as number;
  if (patience !== null && patience !== undefined) {
    if (patience <= 30) result.personalityTags.push('patience_low');
    else if (patience >= 70) result.personalityTags.push('patience_high');
    else result.personalityTags.push('patience_moderate');
  }

  // New batch 2: Ideal evening (lifestyle)
  const idealEvening = answers['s3_ideal_evening'] as string;
  if (idealEvening) result.lifestyleTags.push(`evening_${idealEvening}`);

  // New batch 2: Self awareness (personality)
  const selfAware = answers['s3_self_awareness'] as string;
  if (selfAware) result.personalityTags.push(`selfaware_${selfAware}`);

  // New batch 2: Curiosity level (personality)
  const curiosity = answers['s3_curiosity_level'] as string;
  if (curiosity) result.personalityTags.push(`curiosity_${curiosity}`);

  // New batch 2: Friends describe (personality)
  const friendsDescribe = answers['s3_friends_describe'] as string;
  if (friendsDescribe) result.personalityTags.push('has_friends_description');

  // New batch 2: Shabbat experience (lifestyle)
  const shabbat = answers['s5_shabbat_experience'] as string;
  if (shabbat) result.lifestyleTags.push(`shabbat_${shabbat}`);

  // New batch 2: Social media usage (lifestyle)
  const socialMedia = answers['s5_social_media_usage'] as string;
  if (socialMedia) result.lifestyleTags.push(`social_media_${socialMedia}`);

  // New batch 2: Alcohol attitude (lifestyle)
  const alcohol = answers['s5_alcohol_attitude'] as string;
  if (alcohol) result.lifestyleTags.push(`alcohol_${alcohol}`);

  // New batch 2: Marriage timeline (family)
  const timeline = answers['s6_marriage_timeline'] as string;
  if (timeline) result.familyVisionTags.push(`timeline_${timeline}`);

  // New batch 2: Financial planning (family)
  const finPlan = answers['s6_financial_planning'] as string;
  if (finPlan) result.familyVisionTags.push(`fin_plan_${finPlan}`);

  // New batch 2: Relationship readiness (relationship)
  const readiness = answers['s7_relationship_readiness'] as string;
  if (readiness) result.relationshipTags.push(`readiness_${readiness}`);

  // New batch 2: Growth attitude (relationship)
  const growth = answers['s7_growth_attitude'] as string;
  if (growth) result.relationshipTags.push(`growth_${growth}`);

  // New batch 2: Jealousy comfort (relationship)
  const jealousy = answers['s7_jealousy_comfort'] as string;
  if (jealousy) result.relationshipTags.push(`jealousy_${jealousy}`);

  // New batch 2: What scares you (relationship)
  const scares = answers['s7_what_scares_you'] as string;
  if (scares) result.relationshipTags.push('has_fear_description');

  // New batch 2: Past learning (relationship)
  const pastLearn = answers['s7_past_learning'] as string;
  if (pastLearn) result.relationshipTags.push('has_past_reflection');

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

  const sensPref = collectPartnerTags(answers, 'p_sensitivity');
  if (!sensPref.isDoesntMatter) result.personalityTags.push(...sensPref.tags);

  const changePref = collectPartnerTags(answers, 'p_change_approach');
  if (!changePref.isDoesntMatter) result.personalityTags.push(...changePref.tags);

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

  const fitPref = collectPartnerTags(answers, 'p_fitness');
  if (!fitPref.isDoesntMatter) result.lifestyleTags.push(...fitPref.tags);

  const dressPref = collectPartnerTags(answers, 'p_dress_style');
  if (!dressPref.isDoesntMatter) result.lifestyleTags.push(...dressPref.tags);

  const abroadPref = collectPartnerTags(answers, 'p_open_abroad');
  if (!abroadPref.isDoesntMatter) result.lifestyleTags.push(...abroadPref.tags);

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

  // Partner: expressing needs preference
  const exprNeedsPref = collectPartnerTags(answers, 'p_expressing_needs');
  if (!exprNeedsPref.isDoesntMatter) result.relationshipTags.push(...exprNeedsPref.tags.map(t => `needs_${t}`));

  // Partner: argument style preference
  const argStylePref = collectPartnerTags(answers, 'p_argument_style');
  if (!argStylePref.isDoesntMatter) result.relationshipTags.push(...argStylePref.tags.map(t => `argument_${t}`));

  // Partner: romantic past comfort
  const pastComfortPref = collectPartnerTags(answers, 's7_romantic_past_comfort');
  if (!pastComfortPref.isDoesntMatter) result.relationshipTags.push(...pastComfortPref.tags.map(t => `past_${t}`));

  const openPartText = answers['s7_open_partner'] as string;
  if (openPartText) result.relationshipTags.push('has_open_description');

  // New: Financial expectation from partner (career)
  const finExpPref = collectPartnerTags(answers, 's4_financial_expectation');
  if (!finExpPref.isDoesntMatter) result.careerTags.push(...finExpPref.tags.map(t => `fin_expect_${t}`));

  // New: Urban identity partner preference (lifestyle)
  const urbanPref = collectPartnerTags(answers, 'p_urban_identity');
  if (!urbanPref.isDoesntMatter) result.lifestyleTags.push(...urbanPref.tags.map(t => `urban_${t}`));

  // New: Deal breakers (relationship)
  const dealBreakers = answers['s7_deal_breakers'] as string[];
  if (dealBreakers) result.relationshipTags.push(...dealBreakers.map(d => `dealbreaker_${d}`));

  // New batch 2: Partner religious direction preference (sector)
  const relDirPref = collectPartnerTags(answers, 'p_religious_direction');
  if (relDirPref.isDoesntMatter) result.doesntMatterCategories.push('sector');
  else result.sectorTags.push(...relDirPref.tags.map(t => `direction_${t}`));

  // New batch 2: Partner attachment style preference (personality)
  const attachPref = collectPartnerTags(answers, 'p_attachment_style');
  if (!attachPref.isDoesntMatter) result.personalityTags.push(...attachPref.tags.map(t => `attachment_${t}`));

  // New batch 2: Partner curiosity preference (personality)
  const curPref = collectPartnerTags(answers, 'p_curiosity_level');
  if (!curPref.isDoesntMatter) result.personalityTags.push(...curPref.tags.map(t => `curiosity_${t}`));

  // New batch 2: Partner shabbat preference (lifestyle)
  const shabPref = collectPartnerTags(answers, 'p_shabbat_experience');
  if (!shabPref.isDoesntMatter) result.lifestyleTags.push(...shabPref.tags.map(t => `shabbat_${t}`));

  // New batch 2: Partner social media preference (lifestyle)
  const smPref = collectPartnerTags(answers, 'p_social_media');
  if (!smPref.isDoesntMatter) result.lifestyleTags.push(...smPref.tags.map(t => `social_media_${t}`));

  // New batch 2: Partner alcohol preference (lifestyle)
  const alcPref = collectPartnerTags(answers, 'p_alcohol');
  if (!alcPref.isDoesntMatter) result.lifestyleTags.push(...alcPref.tags.map(t => `alcohol_${t}`));

  // New batch 2: Partner financial planning preference (family)
  const finPlanPref = collectPartnerTags(answers, 'p_financial_planning');
  if (!finPlanPref.isDoesntMatter) result.familyVisionTags.push(...finPlanPref.tags.map(t => `fin_plan_${t}`));

  // New batch 2: Partner growth attitude preference (relationship)
  const growthPref = collectPartnerTags(answers, 'p_growth_attitude');
  if (!growthPref.isDoesntMatter) result.relationshipTags.push(...growthPref.tags.map(t => `growth_${t}`));

  // Partner: davening practice preference (sector)
  const davPref = collectPartnerTags(answers, 'p_davening_practice');
  if (!davPref.isDoesntMatter) result.sectorTags.push(...davPref.tags.map(t => `davening_${t}`));

  // Partner: datlash partner preference (sector)
  const datlashPartnerPref = collectPartnerTags(answers, 'p_datlash_partner');
  if (!datlashPartnerPref.isDoesntMatter) result.sectorTags.push(...datlashPartnerPref.tags.map(t => `datlash_partner_${t}`));

  // Partner: meaning source preference (personality)
  const meanPref = collectPartnerTags(answers, 'p_meaning_source');
  if (!meanPref.isDoesntMatter) result.personalityTags.push(...meanPref.tags.map(t => `meaning_${t}`));

  // Partner: ideal evening preference (lifestyle — matches self tag category)
  const evePref = collectPartnerTags(answers, 'p_ideal_evening');
  if (!evePref.isDoesntMatter) result.lifestyleTags.push(...evePref.tags.map(t => `evening_${t}`));

  // Partner: dress code preference - female partner (lifestyle)
  const dressFPref = collectPartnerTags(answers, 'p_dress_code_f');
  if (!dressFPref.isDoesntMatter) result.lifestyleTags.push(...dressFPref.tags.map(t => `dress_${t}`));

  // Partner: dress code preference - male partner (lifestyle)
  const dressMPref = collectPartnerTags(answers, 'p_dress_code_m');
  if (!dressMPref.isDoesntMatter) result.lifestyleTags.push(...dressMPref.tags.map(t => `dress_${t}`));

  // Partner: tech relationship preference (lifestyle)
  const techPref = collectPartnerTags(answers, 'p_tech_relationship');
  if (!techPref.isDoesntMatter) result.lifestyleTags.push(...techPref.tags.map(t => `tech_${t}`));

  // Partner: vacation style preference (lifestyle)
  const vacPref = collectPartnerTags(answers, 'p_vacation_style');
  if (!vacPref.isDoesntMatter) result.lifestyleTags.push(...vacPref.tags.map(t => `vacation_${t}`));

  // Partner: English comfort preference (lifestyle)
  const engPref = collectPartnerTags(answers, 'p_english_comfort');
  if (!engPref.isDoesntMatter) result.lifestyleTags.push(...engPref.tags.map(t => `english_${t}`));

  // Partner: political identity preference (lifestyle)
  const polPref = collectPartnerTags(answers, 'p_political_identity');
  if (!polPref.isDoesntMatter) result.lifestyleTags.push(...polPref.tags.map(t => `political_${t}`));

  // Partner: marriage timeline preference (family)
  const timePref = collectPartnerTags(answers, 'p_marriage_timeline');
  if (!timePref.isDoesntMatter) result.familyVisionTags.push(...timePref.tags.map(t => `timeline_${t}`));

  // Partner: parents involvement preference (family)
  const parInvPref = collectPartnerTags(answers, 'p_parents_involvement');
  if (!parInvPref.isDoesntMatter) result.familyVisionTags.push(...parInvPref.tags.map(t => `parents_dating_${t}`));

  // Partner: couple dynamic preference (relationship)
  const dynPref = collectPartnerTags(answers, 'p_couple_dynamic');
  if (!dynPref.isDoesntMatter) result.relationshipTags.push(...dynPref.tags.map(t => `dynamic_${t}`));

  // Partner: emotional needs preference (relationship)
  const emotPref = collectPartnerTags(answers, 'p_emotional_needs');
  if (!emotPref.isDoesntMatter) result.relationshipTags.push(...emotPref.tags.map(t => `need_${t}`));

  // Partner: jealousy comfort preference (relationship)
  const jealPref = collectPartnerTags(answers, 'p_jealousy_comfort');
  if (!jealPref.isDoesntMatter) result.relationshipTags.push(...jealPref.tags.map(t => `jealousy_${t}`));

  return result;
}
