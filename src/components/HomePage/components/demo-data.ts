// src/components/HomePage/components/demo-data.ts

// ============================================================================
// קובץ זה עודכן כדי להוסיף תשובות שאלון עשירות יותר עבור נועה ודניאל.
// הוספתי תשובות מכל חמשת העולמות כדי ליצור פרופילים מלאים וקוהרנטיים יותר.
// ============================================================================

import type {
  ExtendedMatchSuggestion,
  PartyInfo,
} from '@/app/components/suggestions/types';
import type {
  QuestionnaireResponse as QuestionnaireResponseType,
  UserProfile,
  UserImage,
  FormattedAnswer, // ייבוא הטיפוס הנכון
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

// --- תשובות שאלון לדמו #1: נועה (הבחורה) ---
const noaQuestionnaireResponse: QuestionnaireResponseType = {
  id: 'qr-demo-noa',
  userId: 'demo-profile-noa',
  valuesAnswers: {
    values_core_elaboration:
      'הערך הכי חשוב לי הוא משפחה, וזה מתבטא בכך שאני משקיעה זמן רב בקשר עם ההורים והאחים שלי, ורואה את הבית העתידי שלי כמקום חם ומכיל שמהווה מרכז לעולם שלנו.',
    values_attitude_towards_money: 'איזון בין נוחות חומרית לערכים אחרים',
    values_giving_tzedaka_importance: 8,
    values_career_family_balance_approach: 'relationship_first',
  },
  personalityAnswers: {
    personality_self_portrayal:
      'אני אדם מאוד ויזואלי ויצירתי, מה שמתחבר לעיסוק שלי. מעבר לזה, אני חברה טובה שיודעת להקשיב, וחשוב לי מאוד לנהל שיחות עומק. אני אופטימית מטבעי, ומאמינה שתמיד אפשר למצוא את הטוב בכל מצב.',
    personality_energy_level: 'בינונית - אנרגטי/ת כשצריך, יודע/ת גם לנוח',
    personality_introversion_extroversion: 6,
    personality_primary_motivation: 'יצירת קשרים משמעותיים ואהבה',
  },
  relationshipAnswers: {
    relationship_core_meaning: [
      'חיבור רגשי עמוק, אינטימיות והבנה הדדית',
      'שותפות איתנה, חברות אמת ותמיכה הדדית',
    ],
    relationship_intimacy_meaning:
      'אינטימיות עבורי היא היכולת להיות חשופה לחלוטין בפני מישהו, לשתף בחלומות ובפחדים, ולדעת שיש מישהו בעולם שמכיר אותי באמת ומקבל אותי כמו שאני.',
    relationship_communication_ideal: 'רגישה ואמפתית - דגש על הקשבה והבנת רגשות',
    relationship_daily_togetherness_vs_autonomy: 7,
  },
  partnerAnswers: {
    partner_must_have_quality_final:
      'התכונה החשובה ביותר היא טוב לב. אדם עם לב טוב הוא אדם שיודע לתת, לקבל, לסלוח ולהיות שותף אמיתי. כל השאר נבנה על היסוד הזה.',
    partner_lifestyle_pace_preference: 'מאוזן - יודע/ת לשלב בין פעילות למנוחה, בין שגרה לספונטניות',
    partner_appearance_importance_scale: 7,
    partner_core_character_traits_essential: {
      'חום, אמפתיה וטוב לב': 30,
      'יושרה, אמינות וכנות': 20,
      'תקשורת טובה והקשבה': 20,
      'אופטימיות ושמחת חיים': 15,
      'אינטליגנציה וסקרנות': 15,
    },
  },
  religionAnswers: {
    religion_self_definition_primary: "דתי/ה לאומי/ת - מרכז / פתוח/ה (למשל: דתי-לייט, ליברלי)",
    religion_shabbat_observance_level_practical: "שמירה על אווירת השבת (קידוש, סעודות, תפילה) עם גמישות מסוימת בהלכות",
    religion_partner_ideal_religious_profile: "מחפשת מישהו מהעולם הדתי-לאומי, פתוח ומכיל. חשוב לי שיהיה מחובר למסורת ולרוחניות, אבל לא בצורה נוקשה. מישהו שיש לו יראת שמיים, אבל גם חי את העולם המודרני ומוצא את האיזון הנכון.",
    religion_children_education_religious_vision: "הייתי רוצה להעניק לילדינו חינוך דתי-לאומי פתוח ומכיל, ששם דגש על מידות טובות, אהבת התורה והארץ, וחיבור לעם ישראל. חשוב לי שהם יגדלו להיות אנשים חושבים, עם יראת שמיים פנימית ועמוקה."
  },
  valuesCompleted: true,
  personalityCompleted: true,
  relationshipCompleted: true,
  partnerCompleted: true,
  religionCompleted: true,
  worldsCompleted: ['VALUES', 'RELATIONSHIP', 'PARTNER', 'PERSONALITY', 'RELIGION'],
  completed: true,
  startedAt: new Date(),
  completedAt: new Date(),
  lastSaved: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  formattedAnswers: {
    values: [
      {
        questionId: 'values_core_elaboration',
        question: 'מהו הערך החשוב ביותר עבורך בזוגיות, וכיצד הוא בא לידי ביטוי בחייך?',
        answer: 'הערך הכי חשוב לי הוא משפחה...',
        displayText: 'הערך הכי חשוב לי הוא משפחה, וזה מתבטא בכך שאני משקיעה זמן רב בקשר עם ההורים והאחים שלי, ורואה את הבית העתידי שלי כמקום חם ומכיל שמהווה מרכז לעולם שלנו.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
       {
        questionId: 'values_career_family_balance_approach',
        question: 'בהתייחס לאיזון בין קריירה לזוגיות/משפחה, איזו גישה הכי מתארת אותך כרגע?',
        answer: 'relationship_first',
        displayText: 'הגעתי לשלב שבו בניית זוגיות ומשפחה היא המטרה המרכזית. הקריירה חשובה, אך היא תומכת במטרה זו.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    personality: [
      {
        questionId: 'personality_self_portrayal',
        question: 'איך היית מתארת את עצמך בכמה מילים?',
        answer: 'אני אדם ויזואלי ויצירתי...',
        displayText: 'אני אדם מאוד ויזואלי ויצירתי, מה שמתחבר לעיסוק שלי. מעבר לזה, אני חברה טובה שיודעת להקשיב, וחשוב לי מאוד לנהל שיחות עומק. אני אופטימית מטבעי, ומאמינה שתמיד אפשר למצוא את הטוב בכל מצב.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    relationship: [
      {
        questionId: 'relationship_intimacy_meaning',
        question: 'מהי אינטימיות עבורך בזוגיות?',
        answer: 'אינטימיות עבורי היא היכולת להיות חשופה לחלוטין...',
        displayText: 'אינטימיות עבורי היא היכולת להיות חשופה לחלוטין בפני מישהו, לשתף בחלומות ובפחדים, ולדעת שיש מישהו בעולם שמכיר אותי באמת ומקבל אותי כמו שאני.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    partner: [
        {
        questionId: 'partner_must_have_quality_final',
        question: 'מהי התכונה האחת החשובה ביותר שחייבת להיות לבן הזוג שלך?',
        answer: 'התכונה החשובה ביותר היא טוב לב...',
        displayText: 'התכונה החשובה ביותר היא טוב לב. אדם עם לב טוב הוא אדם שיודע לתת, לקבל, לסלוח ולהיות שותף אמיתי. כל השאר נבנה על היסוד הזה.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    religion: [
        {
        questionId: 'religion_partner_ideal_religious_profile',
        question: 'תארי את הפרופיל הדתי-רוחני האידיאלי של בן הזוג שאת מחפשת.',
        answer: 'מחפשת מישהו מהעולם הדתי-לאומי, פתוח ומכיל...',
        displayText: 'מחפשת מישהו מהעולם הדתי-לאומי, פתוח ומכיל. חשוב לי שיהיה מחובר למסורת ולרוחניות, אבל לא בצורה נוקשה. מישהו שיש לו יראת שמיים, אבל גם חי את העולם המודרני ומוצא את האיזון הנכון.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ]
  },
};

// --- פרופיל מלא לדמו #1: נועה (הבחורה) ---
const noaProfile: PartyInfo = {
  id: 'demo-profile-noa',
  email: 'noa.demo@example.com',
  firstName: 'נועה',
  lastName: 'ישראלי',
  isProfileComplete: true,
  images: [
    {
      id: 'img1',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
      isMain: true,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
    {
      id: 'img2',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
      isMain: false,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
    {
      id: 'img3',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
      isMain: false,
      userId: 'demo-profile-noa',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'dina4_gr0ako',
    },
    {
      id: 'img4',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
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
    height: 168,
    city: 'תל אביב',
    occupation: 'מעצבת UX/UI בכירה',
    education: 'תואר ראשון בתקשורת חזותית, בצלאל',
    educationLevel: 'academic_ba',
    religiousLevel: 'דתי לאומי תורני',
    shomerNegiah: false,
    about:
      'אופטימית וחובבת שיחות עומק על כוס קפה. מוצאת יופי בדברים הקטנים של החיים, בין אם זה טיול בטבע או פלייליסט טוב. מחפשת שותף לדרך, לבנות יחד בית שמלא בצחוק, כבוד הדדי וצמיחה משותפת.',
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
    serviceDetails: null,
    headCovering: null,
    kippahType: null,
    aliyaCountry: null,
    aliyaYear: null,
    siblings: 4,
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
  },
  questionnaireResponses: [noaQuestionnaireResponse],
};

// --- הצעה מלאה לדמו #1: נועה ---
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
    'זיהיתי חיבור מיוחד בין האופטימיות והאהבה שלכם לשיחות עומק. שניכם מחפשים קשר המבוסס על כבוד, צמיחה משותפת ובית מלא בצחוק. אני מאמין שהערכים הדתיים הליברליים שלכם והשאיפות המקצועיות יכולים להשתלב בצורה הרמונית וליצור בסיס איתן לקשר משמעותי.',
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

// --- תשובות שאלון לדמו #2: דניאל (הבחור) ---
const danielQuestionnaireResponse: QuestionnaireResponseType = {
  id: 'qr-demo-daniel',
  userId: 'demo-profile-daniel',
  valuesAnswers: {
    values_life_priorities_allocation: {
      'זוגיות וחיפוש זוגיות': 30,
      משפחה: 20,
      'קריירה ופרנסה': 25,
      'רוחניות, דת ולימוד תורה': 15,
      'חברים, קהילה והתנדבות': 5,
      'פנאי ותחביבים': 5,
    },
    values_attitude_towards_money: 'אחריות כלכלית, חיסכון ותכנון לטווח ארוך',
    values_community_role: 'מעורב/ת ומשתתפ/ת קבוע/ה בפעילויות',
    values_education_pursuit: 'למידה מתמדת היא דרך חיים והכרח',
  },
  personalityAnswers: {
    personality_self_portrayal:
      'אני אדם של עשייה, אוהב אתגרים ומטרות. חשובה לי מאוד האמינות, ואני תמיד משתדל לעמוד במילה שלי. יש לי צד אנליטי חזק, אבל גם מאוד אוהב לנגן ולבלות בטבע כדי להתאזן.',
    personality_introversion_extroversion: 7,
    personality_stress_management: [
      'פעילות גופנית (ספורט, הליכה)',
      'שיחה עם חבר/ה קרוב/ה או בן/בת משפחה',
      'מוזיקה או פודקאסטים'
    ],
    personality_decision_making_style: 'שילוב של לוגיקה ואינטואיציה, תוך לקיחת סיכונים מחושבים',
  },
  relationshipAnswers: {
    relationship_key_expectations_from_partner: [
        'תקשורת פתוחה, כנה ומכבדת', 
        'שותפות פעילה בניהול החיים המשותפים', 
        'אמינות, יושרה ונאמנות'
    ],
    relationship_daily_togetherness_vs_autonomy: 7,
    relationship_financial_management_preference: 'שקיפות מלאה וחשבון משותף לכל',
    relationship_conflict_resolution_style: {
      'דיבור מיידי וגלוי': 30,
      'פסק זמן ואז שיחה': 20,
      'ניתוח לוגי של הבעיה': 30,
      'התמקדות בהבנה ופשרה': 20,
    },
  },
  partnerAnswers: {
    partner_core_character_traits_essential: {
      'יושרה, אמינות וכנות': 30,
      'חום, אמפתיה וטוב לב': 20,
      'אינטליגנציה וסקרנות': 20,
      'אופטימיות ושמחת חיים': 15,
      'תקשורת טובה והקשבה': 15,
    },
    partner_must_have_quality_final:
      'התכונה הכי חשובה לי היא שותפות. הידיעה שיש לי מישהי לצידי, שאנחנו צוות מול כל מה שהחיים מביאים, ושאנחנו תמיד דואגים אחד לשנייה.',
    partner_religious_observance_preference_range: [
        'דתי/ה לאומי/ת - תורני/ת / ישיבתי/ת',
        'דתי/ה לאומי/ת - מרכז / ליברלי'
    ],
    partner_social_style_preference: 'חברותי/ת אך מעדיפ/ה מפגשים קטנים ואינטימיים',
  },
  religionAnswers: {
    religion_shabbat_observance_level_practical: 'שמירה על עיקרי ההלכות (ללא חשמל, בישול, נסיעה)',
    religion_faith_core_principles: ['תורה מן השמיים ומחויבות להלכה', 'גאולת ישראל וקיבוץ גלויות בארץ ישראל'],
    religion_social_circle_religious_diversity: 'יש לי חברים ממגוון רמות דתיות והשקפות',
    religion_flexibility_religious_differences_partner: 8,
  },
  valuesCompleted: true,
  personalityCompleted: true,
  relationshipCompleted: true,
  partnerCompleted: true,
  religionCompleted: true,
  worldsCompleted: ['VALUES', 'PERSONALITY', 'PARTNER', 'RELATIONSHIP', 'RELIGION'],
  completed: true,
  startedAt: new Date(),
  completedAt: new Date(),
  lastSaved: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  formattedAnswers: {
    values: [
       {
        questionId: 'values_attitude_towards_money',
        question: 'מהי גישתך הכללית לכסף ורמת חיים?',
        answer: 'אחריות כלכלית, חיסכון ותכנון לטווח ארוך',
        displayText: 'אחריות כלכלית, חיסכון ותכנון לטווח ארוך',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    personality: [
      {
        questionId: 'personality_self_portrayal',
        question: 'איך היית מתאר את עצמך בכמה מילים?',
        answer: 'אני אדם של עשייה, אוהב אתגרים ומטרות...',
        displayText:
          'אני אדם של עשייה, אוהב אתגרים ומטרות. חשובה לי מאוד האמינות, ואני תמיד משתדל לעמוד במילה שלי. יש לי צד אנליטי חזק, אבל גם מאוד אוהב לנגן ולבלות בטבע כדי להתאזן.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    relationship: [
      {
        questionId: 'relationship_financial_management_preference',
        question: 'מהי הגישה המועדפת עליך לניהול כספים משותף בזוגיות?',
        answer: 'שקיפות מלאה וחשבון משותף לכל',
        displayText: 'שקיפות מלאה וחשבון משותף לכל',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
    partner: [
      {
        questionId: 'partner_must_have_quality_final',
        question: 'מהי התכונה הכי חשובה שאתה מחפש בשותפה לחיים?',
        answer: 'התכונה הכי חשובה לי היא שותפות...',
        displayText:
          'התכונה הכי חשובה לי היא שותפות. הידיעה שיש לי מישהי לצידי, שאנחנו צוות מול כל מה שהחיים מביאים, ושאנחנו תמיד דואגים אחד לשנייה.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ],
     religion: [
        {
        questionId: 'religion_faith_core_principles',
        question: 'מהם עקרונות האמונה המרכזיים שמנחים אותך?',
        answer: 'תורה מן השמיים ומחויבות להלכה, גאולת ישראל וקיבוץ גלויות',
        displayText: 'עקרונות האמונה המרכזיים שמנחים אותי הם תורה מן השמיים, מחויבות להלכה, וגאולת ישראל וקיבוץ גלויות בארץ ישראל.',
        isVisible: true,
        answeredAt: new Date(),
      } as FormattedAnswer,
    ]
  },
};

// --- פרופיל מלא לדמו #2: דניאל (הבחור) ---
const danielProfile: PartyInfo = {
  id: 'demo-profile-daniel',
  email: 'daniel.demo@example.com',
  firstName: 'דניאל',
  lastName: 'כהן',
  isProfileComplete: true,
  images: [
    {
      id: 'img1m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
      isMain: true,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img2m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
      isMain: false,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img3m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
      isMain: false,
      userId: 'demo-profile-daniel',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: 'eitan_h9ylkc',
    },
    {
      id: 'img4m',
      url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
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
    education: 'תואר ראשון בהנדסת תוכנה, הטכניון',
    educationLevel: 'academic_student',
    religiousLevel: 'דתי לאומי-ליברלי',
    shomerNegiah: true,
    about:
      'בחור של אנשים ושל עשייה. אוהב את השילוב בין עולם ההייטק הדינמי לבין קביעת עיתים לתורה. מאמין שצריך לחיות חיים מלאים עם משמעות, גם בעבודה וגם מחוצה לה. בשעות הפנאי אוהב לטייל בארץ, לנגן בגיטרה ולבלות זמן איכות עם חברים. מחפש שותפה לחיים, לבנות ביחד בית עם יראת שמיים, פתיחות מחשבתית והרבה שמחה.',
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
    origin: 'ספרדי',
    serviceType: ServiceType.MILITARY_INTELLIGENCE_CYBER_TECH,
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
    serviceDetails: 'שירות משמעותי ביחידה 8200',
    headCovering: null,
    kippahType: KippahType.KNITTED_SMALL,
    aliyaCountry: null,
    aliyaYear: null,
    siblings: 3,
    position: 1,
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
  },
  questionnaireResponses: [danielQuestionnaireResponse],
};

// --- הצעה מלאה לדמו #2: דניאל ---
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
    'החיבור בין הרצון שלך ליציבות ובית חם לבין השאיפות והאמביציה של דניאל נראה לי מבטיח במיוחד. שניכם אנשים של עשייה, עם רגליים על הקרקע אבל ראש בעננים. אני מאמין שהרצון שלו להקים בית תורני מודרני והגישה שלך לחיים יכולים ליצור שלם הגדול מסך חלקיו.',
  firstPartyNotes:
    'דניאל הוא בחור רציני, ערכי ועם לב זהב. הוא משלב בצורה מרשימה בין עולם התורה לעולם המעשה, ומחפש שותפה אמיתית לחיים. אני חושב שיש לכם הרבה על מה לדבר.',
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

// ==========================================================
// הוספת נתוני הדגמה עבור ניתוח AI
// ==========================================================

/**
 * ניתוח AI עבור ההצעה של דניאל (מה שבחורה רואה)
 */
export const demoAiAnalysisForDaniel: AiSuggestionAnalysisResult = {
  overallScore: 88,
  matchTitle: 'שילוב של שאפתנות ויציבות רגשית',
  matchSummary:
    'החיבור בין דניאל לנועה מציג פוטנציאל גבוה ליצירת זוגיות יציבה וצומחת. השילוב בין האופי המעשי והשאפתני של דניאל לבין העומק הרגשי והיצירתיות של נועה יוצר בסיס מעניין לשותפות ארוכת טווח, המבוססת על ערכים משותפים וכבוד הדדי.',
  compatibilityPoints: [
    {
      area: 'ערכים משותפים',
      explanation:
        'שניהם מדגישים את חשיבות המשפחה, הכבוד ההדדי והצמיחה המשותפת כערכי יסוד בזוגיות. זהו בסיס איתן לבניית בית משותף.',
    },
    {
      area: 'איזון בין קריירה לחיים אישיים',
      explanation:
        'דניאל, כמהנדס, ונועה, כמעצבת, מגיעים מתחומים תובעניים אך יצירתיים. נראה שיש הבנה הדדית לצורך באיזון בין שאיפות מקצועיות לבין בניית חיים אישיים עשירים.',
    },
    {
      area: 'סגנון תקשורת',
      explanation:
        'שניהם ציינו את החשיבות של "שיחות עומק". נראה שיש פוטנציאל לתקשורת פתוחה וכנה, המאפשרת פתרון קונפליקטים וצמיחה זוגית.',
    },
  ],
  pointsToConsider: [
    {
      area: 'קצב חיים שונה',
      explanation:
        'החיים בירושלים (דניאל) שונים מהקצב התל אביבי (נועה). זה יכול להוות נקודה למחשבה לגבי התאמת סגנון החיים והעדפות בילוי, אך גם הזדמנות להעשיר זה את עולמה של זו.',
    },
    {
      area: 'רמות דתיות',
      explanation:
        'אף על פי ששניהם במרחב הדתי-ליברלי, ישנם ניואנסים קטנים בהגדרות שידרשו שיחה ופתיחות כדי למצוא את הדרך המשותפת הנכונה עבורם.',
    },
  ],
  suggestedConversationStarters: [
    'מה הדבר הכי חשוב שלמדת על זוגיות מהמשפחה שגדלת בה?',
    'אם הייתם יכולים לתכנן את השבת המושלמת, איך היא הייתה נראית?',
    'איך אתם מאזנים בין השאיפות המקצועיות שלכם לבין הרצון לחיים אישיים ורוחניים מלאים?',
  ],
};

/**
 * ניתוח AI עבור ההצעה של נועה (מה שבחור רואה)
 */
export const demoAiAnalysisForNoa: AiSuggestionAnalysisResult = {
  overallScore: 88,
  matchTitle: 'חיבור בין יצירתיות ועומק ערכי',
  matchSummary:
    'ההתאמה בין נועה לדניאל מבטיחה מאוד, ומתבססת על חיבור עמוק ברמת הערכים והאישיות. היצירתיות והרגישות של נועה משלימות את היציבות והנחישות של דניאל, ויוצרות פוטנציאל לזוגיות מאוזנת, תומכת ומלאת תוכן.',
  compatibilityPoints: [
    {
      area: 'ראיית עולם ערכית',
      explanation:
        'שניהם רואים בזוגיות שותפות מלאה ובבית מרכז של צמיחה, כבוד ואהבה. ישנה תפיסה דומה לגבי מהות הקשר והמטרות המשותפות.',
    },
    {
      area: 'פתיחות ורצון לצמוח',
      explanation:
        'נועה מחפשת "שותף לדרך", ודניאל מדבר על "לצעוד יחד". ישנה נכונות הדדית למסע משותף של גדילה, מה שמבטיח יכולת להתמודד עם אתגרים.',
    },
    {
      area: 'אינטליגנציה רגשית',
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
      area: 'מיקוד בקריירה',
      explanation:
        'שניהם נמצאים בשלבים חשובים בקריירה שלהם. חשוב לוודא שהשאיפות המקצועיות תומכות זו בזו ולא מתנגשות, ושיש תיאום ציפיות לגבי עתיד משותף.',
    },
  ],
  suggestedConversationStarters: [
    'מהו הערך שהכי חשוב לך להנחיל בבית שתקים/י, ומדוע?',
    'ספרו על חוויה מעצבת שתרמה למי שאתם היום.',
    'איך הייתם מתארים את האיזון האידיאלי בין "אני", "את/ה" ו"אנחנו" בזוגיות?',
  ],
};