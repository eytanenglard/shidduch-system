
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
    personality_daily_structure_revised: 'איזון',
    personality_stress_management_revised: [
      'שיחה ופריקה',
      'עיסוק ביצירה',
      'יציאה לטבע',
    ],
    personality_social_situation_revised: 'מצטרף/ת בעדינות',
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
    values_health_lifestyle_importance: 7,
    values_attitude_towards_money_revised: 'איזון ואחריות',
    values_lost_wallet:
      'הדבר הראשון שאעשה זה לפתוח את הארנק כדי לחפש תעודה מזהה. מיד לאחר מכן אחפש את האדם בפייסבוק או בכל דרך אפשרית כדי ליצור קשר ולהחזיר לו את האבדה. אם לא אמצא, אקח את הארנק לתחנת המשטרה הקרובה.',
    values_education_pursuit_revised: 'למידה היא דרך חיים',
    values_giving_tzedaka_importance_revised: 8,
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
    relationship_handling_partner_disappointment_revised: 'לרצות לדבר על זה מיד כדי לפתור.',
    relationship_household_philosophy:
      "אני מאמינה בשותפות מלאה וגמישה, כמו שראיתי בבית הורי, שם אבא איש כספים ואמא אמנית, וכל אחד מביא את החוזקות שלו. לא 'תפקידים' קבועים, אלא צוות שפועל יחד לפי נקודות החוזק והזמן הפנוי. הכל בתקשורת פתוחה.",
    relationship_daily_togetherness_vs_autonomy_revised: 7,
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
    },
    partner_core_character_traits_essential_revised: {
      'חום, אמפתיה וטוב לב': 30,
      'תקשורת טובה והקשבה': 25,
      'אופטימיות ושמחת חיים': 20,
      'יושרה, אמינות וכנות': 15,
      'שאפתנות ומוטיבציה לצמיחה': 10,
    },
    partner_lifestyle_pace_preference_revised: 'מאוזן',
    partner_deal_breakers_open_text_revised:
      'הקו האדום המוחלט שלי הוא ציניות מתנשאת וחוסר כבוד בסיסי לאנשים (למשל, איך שהוא מדבר למלצר). אני לא יכולה להיות עם מישהו שלא יודע לכבד כל אדם באשר הוא.',
    partner_must_have_quality_final_revised:
      'התכונה האחת שעליה הכל עומד היא טוב לב. אדם עם לב טוב הוא אדם שיודע לתת, לקבל, לסלוח ולהיות שותף אמיתי. כל השאר נבנה על היסוד הזה.',
  },
  religionAnswers: {
    religion_self_definition_primary_revised: 'דתי-פתוח',
    religion_my_personal_prayer:
      "התפילה 'מודה אני'. היא מזכירה לי להתחיל כל יום מחדש בהודיה, בפשטות, בלי ציניות. זה רגע קטן של אמונה טהורה שמכוון לי את כל היום.",
    religion_rabbinic_guidance_role_revised: 5,
    religion_shabbat_experience: 'זמן משפחה',
    religion_kashrut_observance_details_revised:
      'אני סומכת על כשרות רבנות, ובחוץ אוכלת במסעדות עם תעודת כשרות. אצל חברים, אם אני יודעת שהמטבח כשר, ארגיש בנוח לאכול.',
    religion_modesty_personal_approach_revised:
      'הצניעות שלי באה לידי ביטוי בעיקר בבחירת לבוש מכבד (לובשת גם מכנסיים וגם חצאיות) ובדיבור נקי. אני לא שומרת נגיעה, אבל מאמינה ביצירת קשר ראשוני שמבוסס על היכרות עם האישיות לפני הפיזיות. הגישה שלי היא "פנימיות שמשתקפת בחיצוניות".',
    religion_partner_ideal_religious_profile_revised:
      'מחפשת מישהו מהעולם הדתי-לאומי, פתוח ומכיל. חשוב לי שיהיה מחובר למסורת ולרוחניות, אבל לא בצורה נוקשה. מישהו שיש לו יראת שמיים, אבל גם חי את העולם המודרני ומוצא את האיזון הנכון.',
    religion_flexibility_religious_differences_partner_revised: 8,
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
    }
   
  ],
  profile: {
    id: 'profile-noa-demo',
    userId: 'demo-profile-noa',
    gender: Gender.FEMALE,
    birthDate: new Date('1996-05-15T00:00:00.000Z'),
    birthDateIsApproximate: false,
    height: 168,
    city: 'תל אביב',
    occupation: 'מעצבת UX/UI בכירה',
      fatherOccupation: 'יועץ פיננסי',
    motherOccupation: 'אמנית ובעלת סטודיו לקרמיקה',
    education: 'תואר ראשון בתקשורת חזותית, בצלאל; בוגרת מדרשת לינדנבאום',
    educationLevel: 'academic_ba',
    religiousLevel: 'דתי לאומי פתוח',
    shomerNegiah: false,
    about:
      'אופטימית וחובבת שיחות עומק על כוס קפה. מוצאת יופי בדברים הקטנים של החיים, בין אם זה טיול בטבע או פלייליסט טוב. אחרי כמה ניסיונות שלא צלחו, אני יודעת היום טוב יותר מה נכון לי, ומחפשת שותף לדרך, לבנות יחד בית שמלא בצחוק, כבוד הדדי וצמיחה משותפת.',
    maritalStatus: 'רווקה',
    profileCharacterTraits: ['אופטימית', 'יצירתית', 'אמפתית'],
    profileHobbies: ['טיולים', 'קריאה', 'אומנות ויצירה'],
    preferredAgeMin: 28,
    preferredAgeMax: 35,
    preferredReligiousLevels: [
      'דתי/ה לאומי/ת ליברלי/ת',
      'מסורתי/ת (קרוב/ה לדת)',
    ],
    isProfileVisible: true,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    hasViewedProfilePreview: false,
    nativeLanguage: 'עברית',
    additionalLanguages: ['אנגלית'],
    origin: 'מעורב',
    serviceType: ServiceType.NATIONAL_SERVICE_TWO_YEARS,
    parentStatus: 'נשואים',
    preferredLocations: ['מרכז'],
    preferredEducation: ['אקדמית'],
    preferredOccupations: ['הייטק', 'יצירתי'],
    preferredMaritalStatuses: ['רווק/ה'],
    preferredOrigins: ['ללא העדפה מיוחדת'],
    preferredServiceTypes: [],
    preferredHeadCoverings: [],
    preferredKippahTypes: [],
    preferredCharacterTraits: ['בעל חוש הומור', 'שאפתן', 'כן וישר'],
    preferredHobbies: ['טיולים', 'מוזיקה/נגינה'],
    hasChildrenFromPrevious: false,
    matchingNotes:
      'מחפשת מישהו עם ראש פתוח, שאוהב ללמוד ולהתפתח. חשוב לי מאוד חוש הומור טוב ויכולת לנהל שיחות עמוקות. פחות מתחברת לציניות וחשוב לי שיהיה אופטימי וחיובי.',
    contactPreference: 'both',
    religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE,
    manualEntryText: null,
    preferredReligiousJourneys: [ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE],
    serviceDetails: 'שנתיים שירות לאומי משמעותי עם ילדים בחינוך מיוחד.',
    headCovering: null,
    kippahType: null,
    aliyaCountry: null,
    aliyaYear: null,
    siblings: 2,
    position: 2,
    preferredHeightMin: 175,
    preferredHeightMax: 190,
    preferredShomerNegiah: 'גמישה',
    preferredPartnerHasChildren: 'מעדיפה שלא',
    preferredAliyaStatus: 'ללא העדפה',
    preferredHasChildrenFromPrevious: false,
    preferredMatchmakerGender: null,
    verifiedBy: null,
    availabilityNote: null,
    availabilityUpdatedAt: null,
    lastActive: null,
    hasMedicalInfo: false,
  medicalInfoDetails: null,
  medicalInfoDisclosureTiming: null,
  isMedicalInfoVisible: false,
     profileHeadline: null,
    humorStory: null,
    inspiringCoupleStory: null,
    influentialRabbi: null,

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
    personality_core_trait_selection_revised: {
      'ישר/ה ואמין/ה': 30,
      'שאפתנ/ית ובעל/ת מוטיבציה': 25,
      'אינטליגנט/ית וסקרנ/ית': 20,
      'אחראי/ת ומאורגנ/ת': 15,
      'יציב/ה וקרקע/ית': 10,
    },
    personality_social_battery_recharge: 'intimate_gathering',
    personality_biological_clock: 3,
    personality_vacation_compass: {
      'טיולים, טבע והרפתקאות': 40,
      'עיר תוססת, תרבות ובילויים': 30,
      'זמן איכות זוגי ורומנטי': 20,
      'העשרה, למידה ורוחניות': 10,
    },
    personality_daily_structure_revised: 'משימתיות',
    personality_stress_management_revised: [
      'תנועה וספורט',
      'שיחה ופריקה',
      'התנתקות עם מדיה',
    ],
    personality_social_situation_revised: 'יוזם/ת ומתחבר/ת',
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
    values_health_lifestyle_importance: 8,
    values_attitude_towards_money_revised: 'כלי לביטחון',
    values_lost_wallet:
      'אני מיד מנסה לאתר את הבעלים. אם יש תעודה מזהה, אחפש ברשתות החברתיות או אנסה להתקשר אם יש מספר טלפון. אם אין, אשאל אנשים בסביבה אם ראו משהו. אם כל זה לא עובד, אקח את הארנק למשטרה. כסף לא שלי זה לא שלי.',
    values_education_pursuit_revised: 'למידה היא דרך חיים',
    values_giving_tzedaka_importance_revised: 7,
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
    relationship_handling_partner_disappointment_revised: 'לנתח את המצב בצורה הגיונית לפני שאגיב.',
    relationship_household_philosophy:
      'אני מאמין בחלוקה לפי חוזקות ויעילות, תוך שקיפות ותיאום. אם צד אחד טוב יותר בבישול והשני בניהול כספים, הגיוני שכל אחד יוביל בתחומו, אבל שניהם צריכים להיות מעורבים ולתמוך. המטרה היא שהבית יתפקד בצורה הכי טובה כצוות.',
    relationship_daily_togetherness_vs_autonomy_revised: 6,
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
    partner_completion_trait:
      'כאדם שרגיל לתכנן ולפעול בצורה מאוד מובנית, הייתי שמח למצוא מישהי עם יותר ספונטניות וזרימה, כזו שתעזור לי לפעמים לצאת מהקופסה ולהכניס קצת הרפתקנות לחיים.',
    partner_core_character_traits_essential_revised: {
      'יושרה, אמינות וכנות': 30,
      'אינטליגנט/ית וסקרנ/ית': 25,
      'בגרות, יציבות ואחריות': 20,
      'אופטימיות ושמחת חיים': 15,
      'תקשורת טובה והקשבה': 10,
    },
    partner_lifestyle_pace_preference_revised: 'מאוזן',
    partner_deal_breakers_open_text_revised:
      'קו אדום עבורי הוא חוסר שאיפה להתפתח ולהשתפר. אני לא מחפש מישהי מושלמת, אבל חשוב לי שתהיה לה מוטיבציה פנימית לצמוח, ללמוד ולהיות גרסה טובה יותר של עצמה. פסיביות וחוסר רצון להתמודד עם אתגרים זה משהו שקשה לי מאוד להתחבר אליו.',
    partner_must_have_quality_final_revised:
      "התכונה האחת היא שותפות. אני מחפש מישהי שתהיה 'הצוות' שלי. הידיעה שאנחנו משחקים באותה קבוצה, עם מטרה משותפת, תומכים ומגבים אחד את השנייה, זה הבסיס להכל מבחינתי.",
  },
  religionAnswers: {
    religion_self_definition_primary_revised: 'דתי-פתוח',
    religion_my_personal_prayer:
      "קטע של הרב זקס שמדבר על 'אמונה כשיחה מתמשכת'. זה מתחבר לי לתפיסה שהאמונה היא לא משהו סטטי, אלא מסע דינמי של שאלה, חיפוש ותשובה, וזה מרתק אותי.",
    religion_rabbinic_guidance_role_revised: 8,
    religion_shabbat_experience: 'התעלות רוחנית',
    religion_kashrut_observance_details_revised:
      'אני מקפיד על כשרות מהדרין. מחוץ לבית אני אוכל רק במקומות עם תעודת כשרות למהדרין. אני לא אוכל בבתים של אחרים אלא אם אני בטוח ברמת הכשרות שלהם.',
    religion_modesty_personal_approach_revised:
      'אני שומר נגיעה וזה עיקרון חשוב עבורי. מבחינת צניעות כללית, אני מאמין שהיא צריכה לבוא לידי ביטוי בדיבור מכבד, בהתנהגות ובלבוש, אבל הגישה שלי היא לא של הקפדה על פרטים קטנים אלא על המהות הכללית של כבוד הדדי.',
    religion_partner_ideal_religious_profile_revised:
      'מחפש בחורה דתייה-לאומית, שחשוב לה לבנות בית של תורה וערכים, אבל עם ראש פתוח על הכתפיים. מישהי שיודעת לשלב בין קודש לחול, שיש לה שאיפות אישיות ומקצועיות, ושהיא שותפה אמיתית לדרך.',
    religion_flexibility_religious_differences_partner_revised: 7,
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
    height: 182,
    city: 'ירושלים',
    occupation: 'מהנדס תוכנה וסטודנט לתואר שני',
     fatherOccupation: 'מתכנת',
    motherOccupation: 'רופאת משפחה',
    education: 'בוגר ישיבת הר עציון; תואר ראשון בהנדסת תוכנה, הטכניון',
    educationLevel: 'academic_student',
    religiousLevel: 'דתי לאומי פתוח',
    shomerNegiah: true,
    about:
      'בחור של אנשים ושל עשייה. אוהב את השילוב בין עולם ההייטק הדינמי לבין קביעת עיתים לתורה. מאמין שצמיחה אמיתית קורית מחוץ לאזור הנוחות, ובשעות הפנאי אוהב לטייל בארץ, לנגן בגיטרה ולבלות זמן איכות עם חברים. מחפש שותפה לחיים, לבנות ביחד בית עם יראת שמיים, פתיחות מחשבתית והרבה שמחה.',
    maritalStatus: 'רווק',
    profileCharacterTraits: ['שאפתן', 'ישר ואמין', 'משפחתי'],
    profileHobbies: ['טיולים', 'מוזיקה/נגינה', 'למידה/קורסים'],
    preferredAgeMin: 26,
    preferredAgeMax: 32,
    preferredReligiousLevels: [
      'דתי/ה לאומי/ת תורני/ת',
      'דתי/ה לאומי/ת (סטנדרטי)',
    ],
    isProfileVisible: true,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    hasViewedProfilePreview: false,
    nativeLanguage: 'עברית',
    additionalLanguages: ['אנגלית'],
    origin: 'אנגלו-סקסי',
    serviceType: ServiceType.MILITARY_COMBATANT,
    parentStatus: 'נשואים',
    preferredLocations: ['ירושלים', 'מרכז'],
    preferredEducation: ['אקדמית'],
    preferredOccupations: [],
    preferredMaritalStatuses: ['רווק/ה'],
    preferredOrigins: ['ללא העדפה מיוחדת'],
    preferredServiceTypes: [],
    preferredHeadCoverings: [
      HeadCoveringType.FULL_COVERAGE,
      HeadCoveringType.PARTIAL_COVERAGE,
    ],
    preferredKippahTypes: [],
    preferredCharacterTraits: ['אמפתית', 'אופטימית', 'בעלת חוש הומור'],
    preferredHobbies: ['טיולים', 'קריאה', 'בישול/אפיה'],
    hasChildrenFromPrevious: false,
    matchingNotes:
      'מחפש בחורה עם עומק, שמחה ורצון לבנות בית של תורה וערכים. מישהי שהיא גם חברה טובה, שאפשר לנהל איתה שיחות נפש וגם לצחוק איתה על הכל. חשוב לי שתהיה לה שאיפה להתפתח, גם אישית וגם רוחנית, ושנצעד יחד בדרך משותפת.',
    contactPreference: 'matchmaker',
    religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE,
    manualEntryText: null,
    preferredReligiousJourneys: [ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE],
    serviceDetails: 'שירות משמעותי כקצין בהנדסה קרבית.',
    headCovering: null,
    kippahType: KippahType.KNITTED_SMALL,
    aliyaCountry: 'ארה"ב',
    aliyaYear: 2004,
    siblings: 3,
    position: 2,
    preferredHeightMin: 160,
    preferredHeightMax: 175,
    preferredShomerNegiah: 'כן, חשוב לי',
    preferredPartnerHasChildren: 'מעדיפה שלא',
    preferredAliyaStatus: 'ללא העדפה',
    preferredHasChildrenFromPrevious: false,
    preferredMatchmakerGender: null,
    verifiedBy: null,
    availabilityNote: null,
    availabilityUpdatedAt: null,
    lastActive: null,
    hasMedicalInfo: false,
  medicalInfoDetails: null,
  medicalInfoDisclosureTiming: null,
  isMedicalInfoVisible: false,
     profileHeadline: null,
    humorStory: null,
    inspiringCoupleStory: null,
    influentialRabbi: null,

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