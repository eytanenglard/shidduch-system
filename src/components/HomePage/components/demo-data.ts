// src/components/HomePage/components/demo-data.ts

// ============================================================================
// קובץ זה נבנה מחדש כדי לשקף את השאלות המעודכנות והמעמיקות מהשאלון.
// התשובות של נועה ודניאל הורחבו בכל חמשת העולמות כדי ליצור פרופילים
// עשירים, אותנטיים וקוהרנטיים, המדגימים את יכולות האיפיון של המערכת.
// נוספו פרטי רקע, מסלולי לימוד ושירות, וניואנסים אישיים בהשראת דוגמאות.
// ============================================================================

import type {
  ExtendedMatchSuggestion,
  PartyInfo,
} from '@/app/components/suggestions/types';
import type {
  QuestionnaireResponse as QuestionnaireResponseType,
  UserProfile,
  UserImage,
  FormattedAnswer,
} from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import {
  ReligiousJourney,
  ServiceType,
  Gender,
  AvailabilityStatus,
  KippahType,
  HeadCoveringType,
} from '@prisma/client';

// ============================================================================
// --- תשובות שאלון מעודכנות: נועה (הבחורה) ---
// ============================================================================
const noaQuestionnaireResponse: QuestionnaireResponseType = {
  id: 'qr-demo-noa-updated',
  userId: 'demo-profile-noa',
  personalityAnswers: {
    personality_self_portrayal_revised:
      "אני אדם אופטימי וחיובי, שמאמין שאפשר למצוא את הטוב בכל מצב. אני מאוד יצירתית, מה שבא לידי ביטוי בעבודה ובתחביבים שלי, ויש לי יכולת הקשבה טובה - חברים אומרים שאני 'מכילה'. חשוב לי מאוד לנהל שיחות עומק, אבל אני גם אוהבת לצחוק וליהנות מהדברים הפשוטים.",
    personality_childhood_nickname:
      "נוקי. זה קיצור של נועה-מתוקי שאבא שלי המציא. זה נשאר איתי עד היום במשפחה הקרובה וזה תמיד מזכיר לי את הבית החם שגדלתי בו.",
    personality_core_trait_selection_revised: {
      'אמפתי/ת ורגיש/ה': 30,
      'אופטימי/ת ושמח/ה': 25,
      'יצירתי/ת ומקור/ית': 20,
      'ישר/ה ואמין/ה': 15,
      'נדיב/ה ומתחשב/ת': 10,
    },
    personality_social_battery_recharge: 'intimate_gathering',
    personality_biological_clock: 7,
    personality_good_vs_perfect_day:
      "יום 'מושלם' זה משהו גדול, אבל יום 'ממש טוב' נבנה מהרבה דברים קטנים: שיחת טלפון טובה עם אמא, פריצת דרך יצירתית בעבודה על עיצוב שעבדתי עליו קשה, טיול ספונטני לים בשקיעה, ולסיים את היום עם שיחה טובה וכוס תה. זו תחושה של סיפוק ושלווה.",
    personality_vacation_compass: {
      'בטן-גב, רוגע ושלווה': 30,
      'עיר תוססת, תרבות ובילויים': 25,
      'זמן איכות זוגי ורומנטי': 25,
      'טיולים, טבע והרפתקאות': 20,
    },
    personality_daily_structure_revised: 'איזון',
    personality_plan_change_reaction: 7,
    personality_stress_management_revised: [
      'שיחה ופריקה',
      'עיסוק ביצירה',
      'יציאה לטבע',
    ],
    personality_unproductive_day_feeling: 'חמלה עצמית',
    personality_failure_lesson:
      "מכישלון בפרויקט גדול בעבודה למדתי שהערך שלי לא תלוי בהצלחה חיצונית, ושחשוב לבקש עזרה. זה לימד אותי המון על חמלה עצמית ועבודת צוות.",
    personality_social_situation_revised: 'מצטרף/ת בעדינות',
    personality_friend_in_crisis: 'תמיכה רגשית',
    personality_humor_type: ['הומור מצבים (סיטקום)', 'הומור עצמי'],
    personality_communication_style_revised: {
      'הקשבה אמפתית': 40,
      'פתיחות ושיתוף רגשי': 30,
      'הומור וקלילות': 20,
      'דיבור ישיר וברור': 10,
    },
    personality_primary_motivation_revised: 'יצירת קשרים',
    personality_strengths_and_weaknesses_revised:
      'שתי תכונות שאני אוהבת בעצמי הן האופטימיות שלי והיכולת להקשיב באמת. אני מאמינה שאלו כלים שעוזרים לי ולקשרים שלי. התכונה שהייתי רוצה לשפר היא אסרטיביות - לפעמים אני נוטה לרצות אחרים על חשבון הצרכים שלי, ואני לומדת לשים לעצמי גבולות בריאים יותר.',
  },
  valuesAnswers: {
    values_core_identification_revised: {
      'משפחה וקשרים קרובים': 35,
      'צמיחה אישית והתפתחות': 20,
      'יצירתיות וביטוי עצמי': 15,
      'רוחניות, אמונה ומסורת': 15,
      'נתינה ותרומה לחברה': 10,
      'קריירה והגשמה מקצועית': 5,
    },
    values_core_elaboration_revised:
      "הערך הכי חשוב לי הוא כבוד הדדי. בצומת דרכים מקצועי שהיה לי, יכולתי לקחת פרויקט גדול על חשבון קולגה, אבל בחרתי לשתף פעולה. למרות שהרווחתי פחות 'קרדיט' אישי, בנינו יחד משהו טוב יותר ושמרנו על מערכת יחסים בריאה. זו הייתה הוכחה לעצמי שהדרך חשובה לי לא פחות מהתוצאה.",
    values_childhood_home_atmosphere: "חם, יצירתי ומלא שיחות.",
    values_quiet_heroes:
      "סבתא שלי. היא אישה שקטה וחכמה, שתמיד יודעת להגיד את המילה הנכונה ולתת תחושה שהכל יהיה בסדר. היא ההשראה שלי לטוב לב וצניעות.",
    values_two_job_offers: 'הצעה ב - משמעות ואיזון',
    values_life_priorities_allocation_revised: {
      'זוגיות (חיפוש או קשר קיים)': 30,
      'משפחה (הורים, אחים)': 20,
      'פנאי, תחביבים וטיפוח עצמי': 20,
      'קריירה ופרנסה': 15,
      'חברים וקהילה': 10,
      'רוחניות ולימוד': 5,
    },
    values_health_lifestyle_importance: 7,
    values_feeling_of_home:
      "תחושת ביטחון, ריח של עוגה בתנור, והידיעה שיש עם מי לדבר בכנות בסוף היום.",
    values_definition_of_rich_life:
      "חיים עשירים הם חיים שמלאים בקשרים עמוקים, חוויות שמרחיבות את הלב, ויצירה שנותנת ביטוי לנשמה. זה עושר של זמן ושל משמעות, לא של חפצים.",
    values_attitude_towards_money_revised: 'איזון ואחריות',
    values_lost_wallet:
      'הדבר הראשון שאעשה זה לפתוח את הארנק כדי לחפש תעודה מזהה. מיד לאחר מכן אחפש את האדם בפייסבוק או בכל דרך אפשרית כדי ליצור קשר ולהחזיר לו את האבדה. אם לא אמצא, אקח את הארנק לתחנת המשטרה הקרובה.',
    values_giving_tzedaka_importance_revised: 8,
    values_education_pursuit_revised: 'למידה היא דרך חיים',
    values_social_political_stance_importance_partner_revised: 4,
    values_dealing_with_disagreement_partner_revised: 'שיחה והבנה',
    values_non_negotiable_for_partner_revised:
      'הדיל ברייקר שלי הוא חוסר כנות וחוסר יכולת לקחת אחריות. השאיפה הגדולה ביותר שלי היא למצוא שותף אמיתי לחיים, שנוכל לצמוח יחד מתוך כבוד, חברות ואהבה.',
  },
  relationshipAnswers: {
    relationship_core_meaning_revised: ['חיבור רגשי עמוק', 'חברות ותמיכה'],
    relationship_key_feelings_from_partner_revised: [
      'תמיכה והבנה',
      'הערכה וכבוד',
      'קלילות וכיף',
    ],
    relationship_love_languages: ['מילים מחזקות', 'זמן איכות'],
    relationship_communication_ideal_revised: 'רגישות ואמפתיה',
    relationship_handling_partner_disappointment_revised: 'שיחה מיידית',
    relationship_repair_mechanism: 'שיחת עיבוד',
    relationship_meaningful_apology: 'הבעת חרטה והבנה',
    relationship_silent_treatment_view: 9,
    relationship_partner_bad_day: 'הקשבה והכלה',
    relationship_household_philosophy:
      "אני מאמינה בשותפות מלאה וגמישה, כמו שראיתי בבית הורי, שם אבא איש כספים ואמא אמנית, וכל אחד מביא את החוזקות שלו. לא 'תפקידים' קבועים, אלא צוות שפועל יחד לפי נקודות החוזק והזמן הפנוי. הכל בתקשורת פתוחה.",
    relationship_daily_togetherness_vs_autonomy_revised: 7,
    relationship_role_in_growth: 8,
    relationship_celebrating_success:
      'הכי חשוב לי זה לחגוג ביחד, אולי בארוחה טובה ואינטימית, ופשוט לדבר על זה. לשמוע אותו מספר על הדרך, על האתגרים ועל תחושת הסיפוק. לחגוג את ההצלחה שלו כאילו היא שלי.',
    relationship_family_vision_children_revised: 'הורות היא חלק מרכזי',
    relationship_deal_breaker_summary_final_revised:
      'הדבר שבלעדיו קשר לא יכול לעבוד עבורי הוא תקשורת פתוחה וכנה. השאיפה הכי גדולה שלי היא לבנות בית שמלא בצחוק, כבוד הדדי, וצמיחה משותפת.',
  },
  partnerAnswers: {
    partner_initial_impression_priorities_revised: [
      'חיוך ואנרגיה',
      'כימיה בשיחה',
      'שנינות ועומק',
    ],
    partner_appearance_importance_scale_revised: 6,
    partner_intelligence_types: {
      'רגשית (אמפתיה, מודעות)': 40,
      'יצירתית (הומור, מקוריות)': 30,
      'חוכמת חיים ("שכל ישר")': 20,
      'אנליטית (היגיון, ניתוח)': 10,
      'רוחנית/תורנית (עומק בלימוד)': 0,
    },
    partner_core_character_traits_essential_revised: {
      'חום, אמפתיה וטוב לב': 30,
      'תקשורת טובה והקשבה': 25,
      'אופטימיות ושמחת חיים': 20,
      'יושרה, אמינות וכנות': 15,
      'בגרות, יציבות ואחריות': 10,
    },
    partner_completion_trait:
      "אני אדם שחושב הרבה ולפעמים מהסס. הייתי שמחה למצוא מישהו קצת יותר החלטי ועם ביטחון, כזה שיעזור לי לפעמים לקפוץ למים ויאזן את הנטייה שלי לחשוב יותר מדי.",
    partner_lifestyle_pace_preference_revised: 'מאוזן',
    partner_financial_habits_scale: 6,
    partner_career_ambition_preference_revised: 'איזון עבודה-חיים',
    partner_deal_breakers_open_text_revised:
      'הקו האדום המוחלט שלי הוא ציניות מתנשאת וחוסר כבוד בסיסי לאנשים (למשל, איך שהוא מדבר למלצר). אני לא יכולה להיות עם מישהו שלא יודע לכבד כל אדם באשר הוא.',
    partner_red_flag_vs_quirk:
      "דגל אדום זה חוסר היכולת שלו להתנצל או לקחת אחריות. מוזרות חביבה זה שהוא חייב לשתות את הקפה של הבוקר בדיוק באותה שעה, מאותו ספל.",
    partner_in_laws_conflict: 'גישור ופשרה',
    partner_must_have_quality_final_revised:
      'התכונה האחת שעליה הכל עומד היא טוב לב. אדם עם לב טוב הוא אדם שיודע לתת, לקבל, לסלוח ולהיות שותף אמיתי. כל השאר נבנה על היסוד הזה.',
  },
  religionAnswers: {
    religion_core_feeling_of_faith: 'משמעות ושייכות',
    religion_my_personal_prayer:
      "התפילה 'מודה אני'. היא מזכירה לי להתחיל כל יום מחדש בהודיה, בפשטות, בלי ציניות. זה רגע קטן של אמונה טהורה שמכוון לי את כל היום.",
    religion_rabbinic_guidance_role_revised: 5,
    religion_shabbat_experience: 'זמן משפחה',
    religion_daily_spiritual_connection: ['התבוננות בטבע', 'עשיית חסד'],
    religion_kashrut_observance_details_revised:
      'אני סומכת על כשרות רבנות, ובחוץ אוכלת במסעדות עם תעודת כשרות. אצל חברים, אם אני יודעת שהמטבח כשר, ארגיש בנוח לאכול.',
    religion_modesty_personal_approach_revised:
      'הצניעות שלי באה לידי ביטוי בעיקר בבחירת לבוש מכבד (לובשת גם מכנסיים וגם חצאיות) ובדיבור נקי. אני לא שומרת נגיעה, אבל מאמינה ביצירת קשר ראשוני שמבוסס על היכרות עם האישיות לפני הפיזיות. הגישה שלי היא "פנימיות שמשתקפת בחיצוניות".',
    religion_secular_culture_scenario: 'סינון ובדיקה',
    religion_general_culture_consumption: 7,
    religion_doubts_and_struggles:
      "כשיש לי שאלות באמונה, אני בדרך כלל פונה פנימה. אני מנסה לקרוא על הנושא, לחשוב עליו, ולדבר עם חברות קרובות. אני מאמינה שספקות הם חלק בריא מאמונה חושבת ולא משהו שצריך לפחד ממנו.",
    religion_partner_ideal_religious_profile_revised:
      'מחפשת מישהו מהעולם הדתי-לאומי, פתוח ומכיל. חשוב לי שיהיה מחובר למסורת ולרוחניות, אבל לא בצורה נוקשה. מישהו שיש לו יראת שמיים, אבל גם חי את העולם המודרני ומוצא את האיזון הנכון.',
    religion_flexibility_religious_differences_partner_revised: 8,
    religion_gender_roles_philosophy: {
      'שותפות שוויונית מלאה': 50,
      'חלוקה גמישה לפי כישרון ורצון': 50,
    },
    religion_children_education_religious_vision_revised:
      'החזון שלי הוא להקים בית שבו ילדים גדלים עם ערכים של נתינה, אהבת התורה וארץ ישראל. חשוב לי שהחינוך יהיה דתי-לאומי פתוח ומאפשר שאלת שאלות, כזה שמצמיח אנשים חושבים, עם יראת שמיים פנימית ועמוקה.',
  },
  valuesCompleted: true,
  personalityCompleted: true,
  relationshipCompleted: true,
  partnerCompleted: true,
  religionCompleted: true,
  worldsCompleted: [
    'VALUES',
    'RELATIONSHIP',
    'PARTNER',
    'PERSONALITY',
    'RELIGION',
  ],
  completed: true,
  startedAt: new Date(),
  completedAt: new Date(),
  lastSaved: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  formattedAnswers: {
    personality: [
      {
        questionId: 'personality_strengths_and_weaknesses_revised',
        question: 'ספר/י על שתי תכונות חזקות ואחת לשיפור.',
        answer: 'שתי תכונות שאני אוהבת בעצמי הן האופטימיות והיכולת להקשיב...',
        displayText:
          'שתי תכונות שאני אוהבת בעצמי הן האופטימיות שלי והיכולת להקשיב באמת. אני מאמינה שאלו כלים שעוזרים לי ולקשרים שלי. התכונה שהייתי רוצה לשפר היא אסרטיביות - לפעמים אני נוטה לרצות אחרים על חשבון הצרכים שלי, ואני לומדת לשים לעצמי גבולות בריאים יותר.',
        isVisible: false,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    values: [
      {
        questionId: 'values_core_elaboration_revised',
        question:
          'בחר/י את הערך ה"צפוני" ביותר במצפן הפנימי שלך וספר/י על צומת דרכים שבו הלכת לפיו.',
        answer: "הערך הכי חשוב לי הוא כבוד הדדי. בצומת דרכים מקצועי...",
        displayText:
          "הערך הכי חשוב לי הוא כבוד הדדי. בצומת דרכים מקצועי שהיה לי, יכולתי לקחת פרויקט גדול על חשבון קולגה, אבל בחרתי לשתף פעולה. למרות שהרווחתי פחות 'קרדיט' אישי, בנינו יחד משהו טוב יותר ושמרנו על מערכת יחסים בריאה. זו הייתה הוכחה לעצמי שהדרך חשובה לי לא פחות מהתוצאה.",
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    relationship: [
      {
        questionId: 'relationship_household_philosophy',
        question: 'מהי הנוסחה לחלוקת אחריות בניהול הבית?',
        answer: "אני מאמינה בשותפות מלאה וגמישה...",
        displayText:
          "אני מאמינה בשותפות מלאה וגמישה, כמו שראיתי בבית הורי, שם אבא איש כספים ואמא אמנית, וכל אחד מביא את החוזקות שלו. לא 'תפקידים' קבועים, אלא צוות שפועל יחד לפי נקודות החוזק והזמן הפנוי. הכל בתקשורת פתוחה.",
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    partner: [
      {
        questionId: 'partner_deal_breakers_open_text_revised',
        question: "מהו ה'קו האדום' האחד או שניים, שלא תוכל/י לחיות איתו/איתה?",
        answer: 'הקו האדום המוחלט שלי הוא ציניות מתנשאת...',
        displayText:
          'הקו האדום המוחלט שלי הוא ציניות מתנשאת וחוסר כבוד בסיסי לאנשים (למשל, איך שהוא מדבר למלצר). אני לא יכולה להיות עם מישהו שלא יודע לכבד כל אדם באשר הוא.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    religion: [
      {
        questionId: 'religion_my_personal_prayer',
        question: 'מהו קטע התפילה או ההגות שהכי מדבר אליך?',
        answer: "התפילה 'מודה אני'...",
        displayText:
          "התפילה 'מודה אני'. היא מזכירה לי להתחיל כל יום מחדש בהודיה, בפשטות, בלי ציניות. זה רגע קטן של אמונה טהורה שמכוון לי את כל היום.",
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
  },
};

// ============================================================================
// --- פרופיל מלא מעודכן: נועה ---
// ============================================================================
const noaProfile: PartyInfo = {
  id: 'demo-profile-noa',
  email: 'noa.demo@example.com',
  firstName: 'נועה',
  lastName: 'ישראלי',
  isProfileComplete: true,
  images: [
    {
      id: 'img1',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967771/IMG-20250731-WA0077_ekb71p.jpg',
      isMain: true,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
    {
      id: 'img2',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967772/IMG-20250731-WA0078_l5mhu1.jpg',
      isMain: false,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
    {
      id: 'img3',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967770/IMG-20250731-WA0076_wy6uhe.jpg',
      isMain: false,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
  ],
  profile: {
    id: 'profile-noa-demo',
    userId: 'demo-profile-noa',
    gender: Gender.FEMALE,
    birthDate: new Date('1996-05-15T00:00:00.000Z'),
    birthDateIsApproximate: false,
    nativeLanguage: 'עברית',
    additionalLanguages: ['אנגלית'],
    height: 168,
    maritalStatus: 'single',
    occupation: 'מעצבת UX/UI בכירה',
    education: 'תואר ראשון בתקשורת חזותית, בצלאל; בוגרת מדרשת לינדנבאום',
    educationLevel: 'academic_ba',
    city: 'תל אביב',
    origin: 'מעורב (אשכנזי-מזרחי)',
    religiousLevel: 'dati_leumi_liberal',
    religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE,
    shomerNegiah: false,
    serviceType: ServiceType.NATIONAL_SERVICE_TWO_YEARS,
    serviceDetails: 'שירות לאומי משמעותי של שנתיים בעמותת "כנפיים של קרמבו" עם ילדים בעלי צרכים מיוחדים.',
    manualEntryText: null,
    headCovering: null,
    kippahType: null,
    hasChildrenFromPrevious: false,
    profileCharacterTraits: ['optimistic', 'creative', 'empathetic'],
    profileHobbies: ['travel', 'reading', 'art_crafts'],
    aliyaCountry: null,
    aliyaYear: null,
    about:
      'אופטימית וחובבת שיחות עומק על כוס קפה. מוצאת יופי בדברים הקטנים של החיים, בין אם זה טיול בטבע או פלייליסט טוב. אחרי כמה ניסיונות שלא צלחו, אני יודעת היום טוב יותר מה נכון לי, ומחפשת שותף לדרך, לבנות יחד בית שמלא בצחוק, כבוד הדדי וצמיחה משותפת.',
    profileHeadline: 'מעצבת את החיים בחיוך, מחפשת שותף להרפתקה.',
    humorStory: 'פעם ניסיתי להכין חלות לשבת ויצאו לי בייגלה בצורת ענן. מאז אני מבינה שהשאיפה לשלמות היא המתכון הטוב ביותר לצחוק.',
    inspiringCoupleStory: 'סבא וסבתא שלי. הם היו שונים כמו יום ולילה, אבל תמיד ידעו להקשיב ולצחוק יחד, גם אחרי 60 שנה. הם לימדו אותי שאהבה היא לא למצוא מישהו מושלם, אלא ללמוד לאהוב את חוסר המושלמות.',
    influentialRabbi: 'הרבנית ימימה מזרחי, שהכניסה לחיי עומק נשי, חשיבה חיובית וחיבור למקורות בצורה נגישה ומעצימה.',
    parentStatus: 'נשואים באושר',
    fatherOccupation: 'יועץ פיננסי',
    motherOccupation: 'אמנית ובעלת סטודיו לקרמיקה',
    siblings: 2,
    position: 2,
    hasMedicalInfo: false,
    medicalInfoDetails: null,
    medicalInfoDisclosureTiming: null,
    isMedicalInfoVisible: false,
    preferredAgeMin: 28,
    preferredAgeMax: 35,
    preferredHeightMin: 175,
    preferredHeightMax: 190,
    preferredReligiousLevels: ['dati_leumi_liberal', 'masorti_strong'],
    preferredLocations: ['תל אביב', 'רמת גן', 'גבעתיים'],
    preferredEducation: ['אקדמית'],
    preferredOccupations: ['עצמאי/ת', 'עובד/ת'],
    contactPreference: 'both',
    preferredHasChildrenFromPrevious: false,
    preferredMaritalStatuses: ['single'],
    preferredShomerNegiah: 'flexible',
    preferredPartnerHasChildren: 'no_preferred',
    preferredOrigins: ['no_preference'],
    preferredServiceTypes: [ServiceType.MILITARY_OFFICER, ServiceType.NATIONAL_SERVICE_TWO_YEARS],
    preferredHeadCoverings: [],
    preferredKippahTypes: [KippahType.KNITTED_SMALL, KippahType.KNITTED_LARGE],
    preferredCharacterTraits: ['humorous', 'driven', 'honest'],
    preferredHobbies: ['travel', 'music_playing_instrument', 'reading'],
    preferredAliyaStatus: 'no_preference',
    preferredReligiousJourneys: [ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE],
    isProfileVisible: true,
    preferredMatchmakerGender: null,
    matchingNotes:
      'מחפשת מישהו עם ראש פתוח, שאוהב ללמוד ולהתפתח. חשוב לי מאוד חוש הומור טוב ויכולת לנהל שיחות עמוקות. פחות מתחברת לציניות וחשוב לי שיהיה אופטימי וחיובי.',
    verifiedBy: null,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    availabilityNote: null,
    availabilityUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActive: null,
    hasViewedProfilePreview: false,
  },
  questionnaireResponses: [noaQuestionnaireResponse],
};



// ============================================================================
// --- הצעה מלאה מעודכנת: הצעה של נועה לבחור ---
// ============================================================================
export const demoSuggestionDataFemale: ExtendedMatchSuggestion = {
  id: 'demo-suggestion-homepage-female',
  matchmakerId: 'matchmaker-demo',
  firstPartyId: 'visitor-user-id',
  secondPartyId: 'demo-profile-noa',
  status: 'PENDING_FIRST_PARTY',
  priority: 'HIGH',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActivity: new Date(),
  category: 'ACTIVE',
  matchingReason:
    'מה שהדהד לי במיוחד בחיבור ביניכם הוא השילוב הנדיר של עומק וקלילות. שניכם מחפשים "שותף לדרך" עם "ראש פתוח", ומדברים על בית שמבוסס על "כבוד וצמיחה". אני מאמין שהיציבות והשאיפה למשמעות שלך, יחד עם היצירתיות, האופטימיות והאמפתיה של נועה (שעשתה שירות עם ילדים מיוחדים), יוצרים בסיס מדהים לקשר אמיתי.',
  firstPartyNotes:
    'זו הצעה שאני מתרגשת במיוחד להציג לך. נועה היא בחורה איכותית, עם עומק ורגישות שנדיר למצוא. אני חושבת שהיא בדיוק מה שחיפשת.',
  secondPartyNotes: null,
  internalNotes: null,
  followUpNotes: null,
  responseDeadline: null,
  decisionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  lastStatusChange: new Date(),
  previousStatus: 'DRAFT',
  firstPartySent: new Date(),
  firstPartyResponded: null,
  secondPartySent: null,
  secondPartyResponded: null,
  firstMeetingScheduled: null,
  closedAt: null,
  matchmaker: { firstName: 'דינה', lastName: 'אנגלרד' },
  firstParty: {
    id: 'visitor-user-id',
    email: 'visitor@example.com',
    firstName: 'המשתמש',
    lastName: 'שלנו',
    isProfileComplete: true,
    profile: null,
    images: [],
  },
  secondParty: noaProfile,
  statusHistory: [
    {
      id: 'h1f',
      suggestionId: 'demo-suggestion-homepage-female',
      status: 'DRAFT',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      notes: 'השדכנית יצרה טיוטת הצעה',
    },
    {
      id: 'h2f',
      suggestionId: 'demo-suggestion-homepage-female',
      status: 'PENDING_FIRST_PARTY',
      createdAt: new Date(),
      notes: 'ההצעה נשלחה אליך לבדיקה ראשונית.',
    },
  ],
};

// ============================================================================
// --- תשובות שאלון מעודכנות: דניאל (הבחור) ---
// ============================================================================
const danielQuestionnaireResponse: QuestionnaireResponseType = {
  id: 'qr-demo-daniel-updated',
  userId: 'demo-profile-daniel',
  personalityAnswers: {
    personality_self_portrayal_revised:
      "אני אדם של עשייה, אוהב אתגרים ומטרות. חשובה לי מאוד האמינות, ואני תמיד משתדל לעמוד במילה שלי. יש לי צד אנליטי חזק, שקיבלתי מהלימודים בישיבת הגוש ובהנדסה, אבל אני מאזן את זה עם צד יצירתי - אני אוהב לנגן בגיטרה ומתחבר מאוד לעולם החסידות. אני מחפש צמיחה מתמדת, גם בקריירה וגם בחיים האישיים.",
    personality_childhood_nickname:
      "לא היה לי כינוי מיוחד, תמיד קראו לי דניאל. אני חושב שזה כי תמיד הייתי ילד די רציני כזה, ממוקד במטרות שלו.",
    personality_core_trait_selection_revised: {
      'ישר/ה ואמין/ה': 30,
      'שאפתנ/ית ובעל/ת מוטיבציה': 25,
      'אינטליגנט/ית וסקרנ/ית': 20,
      'אחראי/ת ומאורגנ/ת': 15,
      'יציב/ה וקרקע/ית': 10,
    },
    personality_social_battery_recharge: 'intimate_gathering',
    personality_biological_clock: 3,
    personality_good_vs_perfect_day:
      "יום טוב באמת הוא יום שבו הצלחתי להתקדם משמעותית במטרה שהצבתי לעצמי - בין אם זה בעבודה, בלימודים או בפרויקט אישי. אם הצלחתי גם לשלב בזה אימון טוב ושיחה מעניינת עם חבר, זה כבר יום מצוין.",
    personality_vacation_compass: {
      'טיולים, טבע והרפתקאות': 40,
      'העשרה, למידה ורוחניות': 25,
      'זמן איכות זוגי ורומנטי': 25,
      'עיר תוססת, תרבות ובילויים': 10,
    },
    personality_daily_structure_revised: 'משימתיות',
    personality_plan_change_reaction: 3,
    personality_stress_management_revised: [
      'תנועה וספורט',
      'שיחה ופריקה',
      'התנתקות עם מדיה',
    ],
    personality_unproductive_day_feeling: 'ביקורת ופעולה',
    personality_failure_lesson:
      "נכשלתי במבחן חשוב בתואר הראשון. זה לימד אותי על החשיבות של התמדה, על היכולת לקום אחרי נפילה, ובעיקר שכישלון הוא לא סוף העולם אלא הזדמנות ללמוד ולהשתפר.",
    personality_social_situation_revised: 'יוזם/ת ומתחבר/ת',
    personality_friend_in_crisis: 'פתרון בעיות',
    personality_humor_type: ['ציני ושנון', 'משחקי מילים'],
    personality_communication_style_revised: {
      'דיבור ישיר וברור': 35,
      'היגיון ועובדות': 30,
      'הקשבה אמפתית': 20,
      'פתיחות ושיתוף רגשי': 15,
    },
    personality_primary_motivation_revised: 'השגת מטרות',
    personality_strengths_and_weaknesses_revised:
      'שתי תכונות חזקות שלי הן שאפתנות ואמינות. אני מציב לעצמי מטרות גבוהות ועובד קשה כדי להשיג אותן, ואני מאמין שאפשר לסמוך על המילה שלי. התחום שאני עובד עליו הוא פתיחות רגשית. בגלל הצד האנליטי שלי, לפעמים לוקח לי זמן לעבד ולשתף ברגשות, ואני משתדל להיות יותר פתוח ונגיש רגשית.',
  },
  valuesAnswers: {
    values_core_identification_revised: {
      'יושרה, אמינות וכנות': 30,
      'משפחה וקשרים קרובים': 25,
      'צמיחה אישית והתפתחות': 20,
      'קריירה והגשמה מקצועית': 15,
      'רוחניות, אמונה ומסורת': 10,
    },
    values_core_elaboration_revised:
      "הערך המרכזי שלי הוא אחריות. כששירתי כקצין בהנדסה קרבית, הייתי צריך לקבל החלטה מבצעית מורכבת תחת לחץ. בחרתי בדרך הפעולה הבטוחה יותר, למרות שהיא הייתה פחות 'זוהרת'. זו הייתה החלטה שהתבססה על אחריות לחיי החיילים שלי, והיא חיזקה אצלי את ההבנה שיושרה ואחריות הן מעל הכל.",
    values_childhood_home_atmosphere: "תומך, אינטלקטואלי ומכוון מטרה.",
    values_quiet_heroes:
      "הרב זקס זצ\"ל. היכולת שלו לגשר בין עולמות, להציג מחשבה יהודית עמוקה ורלוונטית, ולהיות איש רוח ומעשה ברמה הגבוהה ביותר היא השראה עצומה עבורי.",
    values_two_job_offers: 'הצעה א - יוקרה ושכר',
    values_life_priorities_allocation_revised: {
      'קריירה ופרנסה': 30,
      'זוגיות (חיפוש או קשר קיים)': 25,
      'רוחניות ולימוד': 20,
      'משפחה (הורים, אחים)': 15,
      'חברים וקהילה': 10,
    },
    values_health_lifestyle_importance: 8,
    values_feeling_of_home:
      "סדר וארגון, ספרייה טובה, והרגשה של שותפות ויציבות. מקום שאפשר לחזור אליו בסוף יום עמוס ולהרגיש שקט.",
    values_definition_of_rich_life:
      "חיים עשירים הם חיים של משמעות. לקום בבוקר עם מטרה, לבנות משפחה לתפארת, לתרום מהידע והיכולות שלי לחברה, ולהמשיך ללמוד ולהתפתח כל הזמן. העושר הוא בהספק ובהשפעה.",
    values_attitude_towards_money_revised: 'כלי לביטחון',
    values_lost_wallet:
      'אני מיד מנסה לאתר את הבעלים. אם יש תעודה מזהה, אחפש ברשתות החברתיות או אנסה להתקשר אם יש מספר טלפון. אם אין, אשאל אנשים בסביבה אם ראו משהו. אם כל זה לא עובד, אקח את הארנק למשטרה. כסף לא שלי זה לא שלי.',
    values_giving_tzedaka_importance_revised: 7,
    values_education_pursuit_revised: 'למידה היא דרך חיים',
    values_social_political_stance_importance_partner_revised: 7,
    values_dealing_with_disagreement_partner_revised: 'מציאת בסיס משותף',
    values_non_negotiable_for_partner_revised:
      'הערך שאין עליו פשרה הוא יושרה. אני חייב לדעת שאני יכול לסמוך על בת הזוג שלי במאה אחוז. הערך שאני הכי שואף אליו הוא שותפות אמת - הידיעה שאנחנו צוות מול כל מה שהחיים מביאים.',
  },
  relationshipAnswers: {
    relationship_core_meaning_revised: ['חברות ותמיכה', 'צמיחה משותפת'],
    relationship_key_feelings_from_partner_revised: [
      'הערכה וכבוד',
      'ביטחון ואמון',
      'שותפות אינטלקטואלית',
    ],
    relationship_love_languages: ['זמן איכות', 'עזרה מעשית'],
    relationship_communication_ideal_revised: 'התמקדות בפתרון',
    relationship_handling_partner_disappointment_revised: 'ניתוח הגיוני',
    relationship_repair_mechanism: 'פסק זמן',
    relationship_meaningful_apology: 'לקיחת אחריות',
    relationship_silent_treatment_view: 8,
    relationship_partner_bad_day: 'ניתוח ופתרון',
    relationship_household_philosophy:
      'אני מאמין בחלוקה לפי חוזקות ויעילות, תוך שקיפות ותיאום. אם צד אחד טוב יותר בבישול והשני בניהול כספים, הגיוני שכל אחד יוביל בתחומו, אבל שניהם צריכים להיות מעורבים ולתמוך. המטרה היא שהבית יתפקד בצורה הכי טובה כצוות.',
    relationship_daily_togetherness_vs_autonomy_revised: 6,
    relationship_role_in_growth: 7,
    relationship_celebrating_success:
      "אני אוהב לחגוג הצלחות. הייתי מציע לצאת למסעדה טובה, אולי אפילו לתכנן סופ\"ש קצר. חשוב לי להראות לה שאני גאה בה ושמח בהצלחתה, ולתת לה את מלוא תשומת הלב.",
    relationship_family_vision_children_revised: 'הורות היא חלק מרכזי',
    relationship_deal_breaker_summary_final_revised:
      'הדיל ברייקר המוחלט הוא חוסר יושרה. השאיפה הגדולה ביותר היא שותפות אמיתית. הידיעה שיש לי מישהי לצידי, שאנחנו צוות מול כל אתגר, ושדואגים תמיד אחד לשנייה.',
  },
  partnerAnswers: {
    partner_initial_impression_priorities_revised: [
      'כימיה בשיחה',
      'שנינות ועומק',
      'תחושת ביטחון',
    ],
    partner_appearance_importance_scale_revised: 7,
    partner_intelligence_types: {
      'אנליטית (היגיון, ניתוח)': 35,
      'חוכמת חיים ("שכל ישר")': 30,
      'רגשית (אמפתיה, מודעות)': 20,
      'רוחנית/תורנית (עומק בלימוד)': 10,
      'יצירתית (הומור, מקוריות)': 5,
    },
    partner_core_character_traits_essential_revised: {
      'יושרה, אמינות וכנות': 30,
      'בגרות, יציבות ואחריות': 25,
      'שאפתנות ומוטיבציה לצמיחה': 20,
      'אופטימיות ושמחת חיים': 15,
      'תקשורת טובה והקשבה': 10,
    },
    partner_completion_trait:
      'כאדם שרגיל לתכנן ולפעול בצורה מאוד מובנית, הייתי שמח למצוא מישהי עם יותר ספונטניות וזרימה, כזו שתעזור לי לפעמים לצאת מהקופסה ולהכניס קצת הרפתקנות לחיים.',
    partner_lifestyle_pace_preference_revised: 'מאוזן',
    partner_financial_habits_scale: 3,
    partner_career_ambition_preference_revised: 'שאפתנות ומיקוד',
    partner_deal_breakers_open_text_revised:
      'קו אדום עבורי הוא חוסר שאיפה להתפתח ולהשתפר. אני לא מחפש מישהי מושלמת, אבל חשוב לי שתהיה לה מוטיבציה פנימית לצמוח, ללמוד ולהיות גרסה טובה יותר של עצמה. פסיביות וחוסר רצון להתמודד עם אתגרים זה משהו שקשה לי מאוד להתחבר אליו.',
    partner_red_flag_vs_quirk:
      "דגל אדום זה חוסר כבוד לזמן של אחרים. מוזרות חביבה זה שהיא חייבת לראות את כל הפרקים של סדרה ברצף בלי הפסקה.",
    partner_in_laws_conflict: 'נאמנות לזוגיות',
    partner_must_have_quality_final_revised:
      "התכונה האחת היא שותפות. אני מחפש מישהי שתהיה 'הצוות' שלי. הידיעה שאנחנו משחקים באותה קבוצה, עם מטרה משותפת, תומכים ומגבים אחד את השנייה, זה הבסיס להכל מבחינתי.",
  },
  religionAnswers: {
    religion_core_feeling_of_faith: 'אתגר וצמיחה',
    religion_my_personal_prayer:
      "קטע של הרב זקס שמדבר על 'אמונה כשיחה מתמשכת'. זה מתחבר לי לתפיסה שהאמונה היא לא משהו סטטי, אלא מסע דינמי של שאלה, חיפוש ותשובה, וזה מרתק אותי.",
    religion_rabbinic_guidance_role_revised: 8,
    religion_shabbat_experience: 'התעלות רוחנית',
    religion_daily_spiritual_connection: ['לימוד תורה', 'התבודדות ותפילה אישית'],
    religion_kashrut_observance_details_revised:
      'אני מקפיד על כשרות מהדרין. מחוץ לבית אני אוכל רק במקומות עם תעודת כשרות למהדרין. אני לא אוכל בבתים של אחרים אלא אם אני בטוח ברמת הכשרות שלהם.',
    religion_modesty_personal_approach_revised:
      'אני שומר נגיעה וזה עיקרון חשוב עבורי. מבחינת צניעות כללית, אני מאמין שהיא צריכה לבוא לידי ביטוי בדיבור מכבד, בהתנהגות ובלבוש, אבל הגישה שלי היא לא של הקפדה על פרטים קטנים אלא על המהות הכללית של כבוד הדדי.',
    religion_secular_culture_scenario: 'סינון ובדיקה',
    religion_general_culture_consumption: 5,
    religion_doubts_and_struggles:
      "אני רואה בשאלות וספקות הזדמנות להעמיק. כשאלה עולים, אני פונה ללימוד - חוזר למקורות, קורא מאמרים, ומדבר על זה עם הרב שלי או עם חברים מהישיבה. אני לא חושש מהשאלה, אלא מהישארות ללא חיפוש תשובה.",
    religion_partner_ideal_religious_profile_revised:
      'מחפש בחורה דתייה-לאומית, שחשוב לה לבנות בית של תורה וערכים, אבל עם ראש פתוח על הכתפיים. מישהי שיודעת לשלב בין קודש לחול, שיש לה שאיפות אישיות ומקצועיות, ושהיא שותפה אמיתית לדרך.',
    religion_flexibility_religious_differences_partner_revised: 7,
    religion_gender_roles_philosophy: {
      'חלוקה גמישה לפי כישרון ורצון': 60,
      'חלוקה מסורתית מוגדרת': 30,
      'שותפות שוויונית מלאה': 10,
    },
    religion_children_education_religious_vision_revised:
      'החזון שלי הוא להקים בית שבו ילדים גדלים עם יראת שמיים טבעית, אהבת תורה וחיבור עמוק לארץ ישראל. חשוב לי שהחינוך יהיה פתוח ומאפשר שאלת שאלות, כזה שמצמיח אנשים חושבים ומאמינים.',
  },
  valuesCompleted: true,
  personalityCompleted: true,
  relationshipCompleted: true,
  partnerCompleted: true,
  religionCompleted: true,
  worldsCompleted: [
    'VALUES',
    'PERSONALITY',
    'PARTNER',
    'RELATIONSHIP',
    'RELIGION',
  ],
  completed: true,
  startedAt: new Date(),
  completedAt: new Date(),
  lastSaved: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  formattedAnswers: {
    values: [
      {
        questionId: 'values_core_elaboration_revised',
        question:
          'ספר/י על צומת דרכים אחד בחיים שבו הלכת לפי הערך הכי חשוב לך.',
        answer: "הערך המרכזי שלי הוא אחריות. כששירתי כקצין...",
        displayText:
          "הערך המרכזי שלי הוא אחריות. כששירתי כקצין בהנדסה קרבית, הייתי צריך לקבל החלטה מבצעית מורכבת תחת לחץ. בחרתי בדרך הפעולה הבטוחה יותר, למרות שהיא הייתה פחות 'זוהרת'. זו הייתה החלטה שהתבססה על אחריות לחיי החיילים שלי, והיא חיזקה אצלי את ההבנה שיושרה ואחריות הן מעל הכל.",
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    personality: [
      {
        questionId: 'personality_strengths_and_weaknesses_revised',
        question: 'ספר/י על שתי תכונות חזקות ואחת לשיפור.',
        answer: 'שתי תכונות חזקות שלי הן שאפתנות ואמינות...',
        displayText:
          'שתי תכונות חזקות שלי הן שאפתנות ואמינות. אני מציב לעצמי מטרות גבוהות ועובד קשה כדי להשיג אותן, ואני מאמין שאפשר לסמוך על המילה שלי. התחום שאני עובד עליו הוא פתיחות רגשית. בגלל הצד האנליטי שלי, לפעמים לוקח לי זמן לעבד ולשתף ברגשות, ואני משתדל להיות יותר פתוח ונגיש רגשית.',
        isVisible: false,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    relationship: [
      {
        questionId: 'relationship_key_feelings_from_partner_revised',
        question: 'מהם שלושת הדברים שהכי חשוב לך להרגיש מבן/בת הזוג?',
        answer: 'הערכה וכבוד, ביטחון ואמון, שותפות אינטלקטואלית',
        displayText:
          'הדברים שהכי חשוב לי להרגיש הם: הערכה וכבוד, ביטחון ואמון, ושיש לי שותפה אינטלקטואלית לשיחה ולצמיחה.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    partner: [
      {
        questionId: 'partner_completion_trait',
        question: 'איזו תכונה שפחות חזקה אצלך, היית שמח/ה למצוא אצל בת הזוג?',
        answer: 'כאדם שרגיל לתכנן ולפעול בצורה מאוד מובנית...',
        displayText:
          'כאדם שרגיל לתכנן ולפעול בצורה מאוד מובנית, הייתי שמח למצוא מישהי עם יותר ספונטניות וזרימה, כזו שתעזור לי לפעמים לצאת מהקופסה ולהכניס קצת הרפתקנות לחיים.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    religion: [
      {
        questionId: 'religion_children_education_religious_vision_revised',
        question: 'מהו החזון שלך לאווירה הרוחנית ולחינוך הילדים בבית?',
        answer: 'החזון שלי הוא להקים בית שבו ילדים גדלים עם יראת שמיים טבעית...',
        displayText:
          'החזון שלי הוא להקים בית שבו ילדים גדלים עם יראת שמיים טבעית, אהבת תורה וחיבור עמוק לארץ ישראל. חשוב לי שהחינוך יהיה פתוח ומאפשר שאלת שאלות, כזה שמצמיח אנשים חושבים ומאמינים.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
  },
};

// ============================================================================
// --- פרופיל מלא מעודכן: דניאל ---
// ============================================================================
const danielProfile: PartyInfo = {
  id: 'demo-profile-daniel',
  email: 'daniel.demo@example.com',
  firstName: 'דניאל',
  lastName: 'כהן',
  isProfileComplete: true,
  images: [
    {
      id: 'img1m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0059_mqskdw.jpg',
      isMain: true,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img2m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0060_ia8nka.jpg',
      isMain: false,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img3m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0061_aug5ix.jpg',
      isMain: false,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img4m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967650/IMG-20250731-WA0062_i9ylyk.jpg',
      isMain: false,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
  ],
  profile: {
    id: 'profile-daniel-demo',
    userId: 'demo-profile-daniel',
    gender: Gender.MALE,
    birthDate: new Date('1994-08-20T00:00:00.000Z'),
    birthDateIsApproximate: false,
    nativeLanguage: 'עברית',
    additionalLanguages: ['אנגלית'],
    height: 182,
    maritalStatus: 'single',
    occupation: 'מהנדס תוכנה וסטודנט לתואר שני',
    education: 'בוגר ישיבת הר עציון; תואר ראשון בהנדסת תוכנה, הטכניון',
    educationLevel: 'academic_student',
    city: 'ירושלים',
    origin: 'אנגלו-סקסי',
    religiousLevel: 'dati_leumi_torani',
    religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE,
    shomerNegiah: true,
    serviceType: ServiceType.MILITARY_OFFICER,
    serviceDetails: 'שירות משמעותי כקצין בהנדסה קרבית, מ"מ וסמ"פ.',
    manualEntryText: null,
    headCovering: null,
    kippahType: KippahType.KNITTED_SMALL,
    hasChildrenFromPrevious: false,
    profileCharacterTraits: ['driven', 'honest', 'family_oriented'],
    profileHobbies: ['travel', 'music_playing_instrument', 'learning_courses'],
    aliyaCountry: 'ארה"ב',
    aliyaYear: 2004,
    about:
      'בחור של אנשים ושל עשייה. אוהב את השילוב בין עולם ההייטק הדינמי לבין קביעת עיתים לתורה. מאמין שצמיחה אמיתית קורית מחוץ לאזור הנוחות, ובשעות הפנאי אוהב לטייל בארץ, לנגן בגיטרה ולבלות זמן איכות עם חברים. מחפש שותפה לחיים, לבנות ביחד בית עם יראת שמיים, פתיחות מחשבתית והרבה שמחה.',
    profileHeadline: 'מהנדס ביום, לומד תורה בערב. מחפש שותפה לבנות עולם.',
    humorStory: 'בטיול האחרון שלי בנפאל ניווטתי עם המפה הפוך במשך שעתיים עד שהבנתי למה השמש זורחת מהכיוון הלא נכון. למדתי שגם כשהולכים לאיבוד, העיקר הוא ליהנות מהנוף.',
    inspiringCoupleStory: 'ההורים שלי. הם עלו לארץ מארה"ב מתוך אידיאל, בנו הכל מאפס ותמיד שמו את המשפחה והערכים במרכז. הם מראים לי כל יום מהי שותפות אמת, תמיכה וצחוק גם מול אתגרים.',
    influentialRabbi: 'הרב זקס זצ"ל, שהראה לי איך אפשר לשלב עולם אינטלקטואלי רחב עם אמונה עמוקה ורלוונטית לעולם המודרני.',
    parentStatus: 'נשואים',
    fatherOccupation: 'מהנדס תוכנה',
    motherOccupation: 'רופאת משפחה',
    siblings: 3,
    position: 2,
    hasMedicalInfo: false,
    medicalInfoDetails: null,
    medicalInfoDisclosureTiming: null,
    isMedicalInfoVisible: false,
    preferredAgeMin: 26,
    preferredAgeMax: 32,
    preferredHeightMin: 160,
    preferredHeightMax: 175,
    preferredReligiousLevels: ['dati_leumi_torani', 'dati_leumi_standard'],
    preferredLocations: ['ירושלים והסביבה', 'גוש עציון', 'מודיעין והסביבה'],
    preferredEducation: ['אקדמית', 'תורנית'],
    preferredOccupations: ['עובד/ת', 'סטודנט/ית'],
    contactPreference: 'matchmaker',
    preferredHasChildrenFromPrevious: false,
    preferredMaritalStatuses: ['single'],
    preferredShomerNegiah: 'yes',
    preferredPartnerHasChildren: 'no_preferred',
    preferredOrigins: ['no_preference'],
    preferredServiceTypes: [ServiceType.NATIONAL_SERVICE_TWO_YEARS, ServiceType.MILITARY_SUPPORT],
    preferredHeadCoverings: [HeadCoveringType.PARTIAL_COVERAGE, HeadCoveringType.FULL_COVERAGE, HeadCoveringType.SCARF_ONLY_SOMETIMES],
    preferredKippahTypes: [],
    preferredCharacterTraits: ['optimistic', 'empathetic', 'easy_going'],
    preferredHobbies: ['travel', 'reading', 'cooking_baking'],
    preferredAliyaStatus: 'no_preference',
    preferredReligiousJourneys: [ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE, ReligiousJourney.BORN_SECULAR],
    isProfileVisible: true,
    preferredMatchmakerGender: null,
    matchingNotes:
      'מחפש בחורה עם עומק, שמחה ורצון לבנות בית של תורה וערכים. מישהי שהיא גם חברה טובה, שאפשר לנהל איתה שיחות נפש וגם לצחוק איתה על הכל. חשוב לי שתהיה לה שאיפה להתפתח, גם אישית וגם רוחנית, ושנצעד יחד בדרך משותפת.',
    verifiedBy: null,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    availabilityNote: null,
    availabilityUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActive: null,
    hasViewedProfilePreview: false,
  },
  questionnaireResponses: [danielQuestionnaireResponse],
};


// ============================================================================
// --- הצעה מלאה מעודכנת: הצעה של דניאל לבחורה ---
// ============================================================================
export const demoSuggestionDataMale: ExtendedMatchSuggestion = {
  id: 'demo-suggestion-homepage-male',
  matchmakerId: 'matchmaker-demo-2',
  firstPartyId: 'visitor-user-id',
  secondPartyId: 'demo-profile-daniel',
  status: 'PENDING_FIRST_PARTY',
  priority: 'HIGH',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActivity: new Date(),
  category: 'ACTIVE',
  matchingReason:
    'מה שהדהד לי במיוחד בחיבור ביניכם הוא השילוב הנדיר של עומק וקלילות. שניכם מחפשים "שותף לדרך" עם "ראש פתוח", ומדברים על בית שמבוסס על "כבוד וצמיחה". אני מאמין שהיציבות והאחריות של דניאל, שניכרות מהשירות שלו כקצין, יחד עם היצירתיות והאופטימיות שלך, יוצרים בסיס מדהים לקשר אמיתי.',
  firstPartyNotes:
    'דניאל הוא בחור רציני, ערכי ועם לב זהב. הוא משלב בצורה מרשימה בין עולם התורה (בוגר הגוש) לעולם המעשה (מהנדס בוגר טכניון), ומחפש שותפה אמיתית לחיים. אני חושב שיש לכם הרבה על מה לדבר.',
  secondPartyNotes: null,
  internalNotes: null,
  followUpNotes: null,
  responseDeadline: null,
  decisionDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  lastStatusChange: new Date(),
  previousStatus: 'DRAFT',
  firstPartySent: new Date(),
  firstPartyResponded: null,
  secondPartySent: null,
  secondPartyResponded: null,
  firstMeetingScheduled: null,
  closedAt: null,
  matchmaker: { firstName: 'איתן', lastName: 'אנגלרד' },
  firstParty: {
    id: 'visitor-user-id',
    email: 'visitor@example.com',
    firstName: 'המשתמשת',
    lastName: 'שלנו',
    isProfileComplete: true,
    profile: null,
    images: [],
  },
  secondParty: danielProfile,
  statusHistory: [
    {
      id: 'h1m',
      suggestionId: 'demo-suggestion-homepage-male',
      status: 'DRAFT',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      notes: 'השדכן יצר טיוטת הצעה',
    },
    {
      id: 'h2m',
      suggestionId: 'demo-suggestion-homepage-male',
      status: 'PENDING_FIRST_PARTY',
      createdAt: new Date(),
      notes: 'ההצעה נשלחה אליך לבדיקה ראשונית.',
    },
  ],
};

// ============================================================================
// --- ניתוחי AI מעודכנים ---
// ============================================================================

/**
 * ניתוח AI מעודכן עבור ההצעה של דניאל (מה שבחורה רואה)
 */
export const demoAiAnalysisForDaniel: AiSuggestionAnalysisResult = {
  overallScore: 91,
  matchTitle: 'שותפות של יציבות ויצירתיות',
  matchSummary:
    'החיבור בין דניאל לנועה מציג פוטנציאל גבוה במיוחד, המבוסס על איזון מרתק בין ערכי ליבה משותפים לבין אישיות משלימה. השילוב בין האופי המעשי, האחראי והשאפתני של דניאל לבין העומק הרגשי, האופטימיות והיצירתיות של נועה יוצר בסיס איתן לשותפות ארוכת טווח, שבה כל אחד יכול להעניק לשני בדיוק את מה שחסר לו.',
  compatibilityPoints: [
    {
      area: 'ערכי יסוד דומים',
      explanation:
        'שניהם רואים ביושרה, כבוד ומשפחה ערכים עליונים. ההגדרה של שניהם ל"שותפות" כערך החשוב ביותר בזוגיות היא נקודת חיבור נדירה וחזקה.',
    },
    {
      area: 'איזון בין קריירה לחיים',
      explanation:
        "דניאל מונע מהשגת מטרות, ונועה מיצירת קשרים - שילוב מצוין שיכול לתמוך זה בזו. שניהם גם מבינים את החשיבות של איזון, כפי שעולה מתשובותיהם על 'קצב החיים' ו'ניהול הבית'.",
    },
    {
      area: 'סגנון תקשורת משלים',
      explanation:
        "הנטייה של דניאל לפתרון בעיות יכולה להשלים את הנטייה של נועה לתקשורת רגשית. שניהם מחפשים 'שיחות עומק', מה שמעיד על פוטנציאל לתקשורת פתוחה וכנה.",
    },
  ],
  pointsToConsider: [
    {
      area: 'שמירת נגיעה',
      explanation:
        'דניאל שומר נגיעה ונועה לא. זוהי נקודה מהותית הדורשת שיחה פתוחה ומכבדת כדי להבין את הציפיות והגישות של כל אחד, ולראות אם ניתן לגשר על הפער.',
    },
    {
      area: 'קצב חיים ומיקום',
      explanation:
        'החיים בירושלים (דניאל) שונים מהקצב התל אביבי (נועה). זה יכול להוות נקודה למחשבה לגבי התאמת סגנון החיים והעדפות בילוי, אך גם הזדמנות להעשיר זה את עולמה של זו.',
    },
  ],
  suggestedConversationStarters: [
    "שניכם דיברתם על 'שותפות' כתכונה הכי חשובה. איך הייתם מתארים את היום המושלם שלכם כ'צוות'?",
    "איך הייתם מתארים את האיזון האידיאלי בין 'אני', 'את/ה' ו'אנחנו' בזוגיות?",
    'ספרו על חוויה מעצבת שתרמה למי שאתם היום.',
  ],
};

/**
 * ניתוח AI מעודכן עבור ההצעה של נועה (מה שבחור רואה)
 */
export const demoAiAnalysisForNoa: AiSuggestionAnalysisResult = {
  overallScore: 91,
  matchTitle: 'חיבור בין אופטימיות לאחריות',
  matchSummary:
    'ההתאמה בין נועה לדניאל מבטיחה מאוד ומתבססת על חיבור עמוק ברמת הערכים והאישיות. היצירתיות, הרגישות והאופטימיות של נועה משלימות באופן הרמוני את היציבות, האחריות והנחישות של דניאל, ויוצרות פוטנציאל לזוגיות מאוזנת, תומכת ומלאת תוכן, שבה כל אחד יכול להיות הגרסה הטובה ביותר של עצמו.',
  compatibilityPoints: [
    {
      area: 'ראיית עולם ערכית דומה',
      explanation:
        'שניהם רואים בזוגיות שותפות מלאה ובבית מרכז של צמיחה, כבוד ואהבה. ישנה תפיסה דומה לגבי מהות הקשר, חשיבות המשפחה וניהול בית משותף.',
    },
    {
      area: 'פתיחות ורצון לצמוח',
      explanation:
        'נועה מחפשת "שותף לדרך", ודניאל מדבר על "לצעוד יחד". ישנה נכונות הדדית למסע משותף של גדילה, מה שמבטיח יכולת להתמודד עם אתגרים.',
    },
    {
      area: 'אינטליגנציה רגשית משלימה',
      explanation:
        'הדגש של נועה על "שיחות עומק" והיכולת של דניאל לשלב בין עולם אנליטי לרגשי (נגינה, טבע) מעידים על פוטנציאל גבוה להבנה רגשית הדדית.',
    },
  ],
  pointsToConsider: [
    {
      area: 'שמירת נגיעה',
      explanation:
        'דניאל שומר נגיעה ונועה לא. זוהי נקודה מהותית הדורשת שיחה פתוחה ומכבדת כדי להבין את הציפיות והגישות של כל אחד.',
    },
    {
      area: 'גישה לכסף',
      explanation:
        "דניאל רואה בכסף 'כלי לביטחון', בעוד נועה רואה בו 'איזון ואחריות'. הגישות קרובות אך לא זהות, וידרשו תיאום ציפיות ותקשורת פתוחה.",
    },
  ],
  suggestedConversationStarters: [
    'מהו הערך שהכי חשוב לך להנחיל בבית שתקים/י, ומדוע?',
    "מהי בעיניכם 'חלוקת תפקידים' אידיאלית בזוגיות מודרנית?",
    'איך הייתם מתארים את השבת המושלמת שלכם?',
  ],
};