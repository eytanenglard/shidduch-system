// src/components/questionnaire/questions/religion/religionQuestions.tsx
import { Question } from "../../types/types";
import {
  BookOpen, // לימוד תורה, השקפה
  Users, // קהילה, חברה
  Home, // בית, משפחה
  Star, // כללי, ערכים, חשיבות
  Target, // מטרה, הלכה
  Scale, // איזון, גישה
  Clock, // זמן, תדירות
  Heart, // רגש, רוחניות
  Scroll, // מגילה, מסורת
  Building, // בניין, מוסד (קהילה/חינוך)
  ShieldCheck, // ביטחון, הקפדה
  MapPin, // מיקום, קהילה ספציפית
  Sparkles, // רוחניות, חוויה
  MessageCircle, // שיח, דיון
  Flag, // מדינה, ציונות
  UsersRound, // חברים, מעגל חברתי
  GraduationCap, // חינוך
  HandHeart, // תמיכה, נתינה (בהקשר דתי)
  Coffee, // פנאי (בהקשר של שבת)
  CheckCheck, // אישור, הסכמה
  Info, // מידע, הבהרה
  Lightbulb, // רעיון, פתיחות
} from "lucide-react";

export const religionQuestions: Question[] = [
  // --- 1. זהות והשקפה דתית ---
  {
    worldId: "RELIGION",
    id: "religious_identity", // שילוב של religiousIdentity ו-religiousWorldview
    category: "identity_belief",
    subcategory: "self_definition",
    question: "איך היית מגדיר/ה את עצמך מבחינה דתית-רוחנית?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Scroll />, text: "חרדי/ת", value: "charedi" },
      {
        icon: <BookOpen />,
        text: "דתי/ה לאומי/ת - תורני/ת",
        value: "dati_leumi_torani",
      },
      {
        icon: <Star />,
        text: "דתי/ה לאומי/ת - ליברלי/ת",
        value: "dati_leumi_liberal",
      },
      { icon: <Heart />, text: "מסורתי/ת", value: "masorti" },
      {
        icon: <Sparkles />,
        text: "רוחני/ת (לא בהכרח דתי/ה פורמלי)",
        value: "spiritual_not_formal",
      },
      {
        icon: <Users />,
        text: "חילוני/ת עם זיקה למסורת",
        value: "secular_traditional",
      },
      { icon: <Info />, text: "אחר/ת", value: "other" }, // ללא אייקון ספציפי
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religious_worldview_details",
    category: "identity_belief",
    subcategory: "self_definition",
    question:
      "בהמשך להגדרה שבחרת, תאר/י בכמה משפטים מה המשמעות של זהות זו עבורך וכיצד היא באה לידי ביטוי בחייך.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב להבנה מעמיקה
    minLength: 50,
    maxLength: 600,
    placeholder: "פרט/י על תפיסת עולמך, אמונותיך והחיבור האישי שלך...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELIGION",
    id: "halacha_role", // שינוי מ-halachaImportance
    category: "identity_belief",
    subcategory: "halacha_view",
    question:
      "מה מקומה וחשיבותה של ההלכה בחיי היומיום שלך? (1=פחות מרכזי, 10=מרכזי מאוד)",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "halacha_approach",
    category: "identity_belief",
    subcategory: "halacha_view",
    question: "איזו גישה הלכתית הכי מאפיינת אותך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <ShieldCheck />,
        text: "הקפדה על קלה כבחמורה",
        value: "strict",
      },
      {
        icon: <Target />,
        text: "הקפדה על עיקרי ההלכה",
        value: "mainstream",
      },
      {
        icon: <Scale />,
        text: "גישה מקלה וגמישה יותר",
        value: "lenient_flexible",
      },
      {
        icon: <Lightbulb />,
        text: "חיפוש אחר רוח ההלכה והמשמעות",
        value: "spirit_meaning",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "faith_certainty", // שאלה חדשה
    category: "identity_belief",
    subcategory: "belief_faith",
    question:
      "על סולם של 1 (הרבה שאלות וספקות) עד 10 (אמונה שלמה וברורה), היכן היית ממקם/ת את עצמך מבחינת וודאות באמונה?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "god_connection", // שאלה חדשה
    category: "identity_belief",
    subcategory: "belief_faith",
    question: "איך היית מתאר/ת את הקשר האישי שלך עם אלוקים?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "תאר/י את התחושות, המחשבות והחוויות שלך בנושא...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELIGION",
    id: "rabbi_role", // שאלה חדשה
    category: "identity_belief",
    subcategory: "guidance",
    question: "מה חשיבותו של רב/נית או דמות רוחנית מנחה בחייך?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, // לא חשוב
    max: 10, // חשוב מאוד
    metadata: { estimatedTime: 1 },
  },

  // --- 2. שמירת מצוות (פרקטיקה) ---
  {
    worldId: "RELIGION",
    id: "minyan_frequency", // שינוי מ-minyanImportance
    category: "practice",
    subcategory: "prayer_learning",
    question: "מהי תדירות ההשתתפות שלך בתפילה במניין?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Clock />, text: "3 תפילות ביום", value: "daily_3" },
      { icon: <Clock />, text: "פעם-פעמיים ביום", value: "daily_1_2" },
      { icon: <Star />, text: "בעיקר בשבתות וחגים", value: "shabbat_holidays" },
      { icon: <Users />, text: "לעיתים רחוקות", value: "rarely" },
      { icon: <Info />, text: "לא רלוונטי לי כרגע", value: "not_applicable" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "torah_learning_regularity", // שינוי מ-dailyLearning
    category: "practice",
    subcategory: "prayer_learning",
    question: "באיזו תדירות ופורמט את/ה עוסק/ת בלימוד תורה באופן קבוע?",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Clock />,
        text: "לימוד יומי קבוע (דף יומי, הלכה וכו')",
        value: "daily",
      },
      { icon: <Star />, text: "שיעור שבועי קבוע", value: "weekly_class" },
      {
        icon: <BookOpen />,
        text: "לימוד עצמי/חברותא (ללא קביעות)",
        value: "self_study",
      },
      {
        icon: <UsersRound />,
        text: "לימוד בחגים/אירועים מיוחדים",
        value: "special_occasions",
      },
      {
        icon: <Info />,
        text: "כרגע פחות עוסק/ת בלימוד קבוע",
        value: "not_regularly",
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "shabbat_observance_level", // שינוי מ-idealShabbat ו-shabbatRestrictions
    category: "practice",
    subcategory: "shabbat_holidays",
    question: "איזו רמה של שמירת שבת מאפיינת אותך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <ShieldCheck />,
        text: "הקפדה מלאה על כל ההלכות",
        value: "full_observance",
      },
      {
        icon: <Target />,
        text: "שמירה על עיקרי ההלכות",
        value: "main_observance",
      },
      { icon: <Scale />, text: "שמירה חלקית/גמישה", value: "partial_flexible" },
      {
        icon: <Coffee />,
        text: "שמירה בעיקר על האווירה",
        value: "atmosphere_focused",
      },
      { icon: <Info />, text: "אינני שומר/ת שבת", value: "not_observant" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "shabbat_atmosphere_preference",
    category: "practice",
    subcategory: "shabbat_holidays",
    question: "איזו אווירה את/ה מעדיף/ה לשבתות וחגים?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Home />, text: "שקט ורגוע בבית", value: "quiet_home" },
      { icon: <Users />, text: "אירוח וחברה", value: "social_hosting" },
      { icon: <BookOpen />, text: "לימוד ותפילה", value: "learning_prayer" },
      { icon: <Sparkles />, text: "שילוב של הכל", value: "mix_everything" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "kashrut_observance_level", // שינוי מ-kashrutLevel
    category: "practice",
    subcategory: "kashrut",
    question: "מהי רמת ההקפדה שלך על כשרות בבית ומחוצה לו?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <ShieldCheck />,
        text: "מהדרין בלבד (בבית ובחוץ)",
        value: "mehadrin_strict",
      },
      {
        icon: <Target />,
        text: "כשרות רגילה (רבנות)",
        value: "regular_kosher",
      },
      {
        icon: <Scale />,
        text: "כשרות בסיסית (מוצרים כשרים, הפרדה)",
        value: "basic_kosher",
      },
      {
        icon: <Home />,
        text: "שומר/ת כשרות בעיקר בבית",
        value: "kosher_at_home",
      },
      {
        icon: <Info />,
        text: "אינני מקפיד/ה על כשרות",
        value: "not_observant",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "modesty_practice", // שינוי מ-modestyView
    category: "practice",
    subcategory: "modesty",
    question: "כיצד באה לידי ביטוי תפיסת הצניעות שלך בלבוש ובהתנהגות?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "תאר/י את רמת ההקפדה שלך והשיקולים המנחים אותך...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELIGION",
    id: "gender_separation_practice", // שינוי מ-genderSeparation
    category: "practice",
    subcategory: "modesty",
    question:
      "כיצד את/ה נוהג/ת בפועל בנושא הפרדה בין גברים לנשים (באירועים, בקהילה, במרחב הציבורי)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "תאר/י את ההתנהלות שלך במצבים שונים...",
    metadata: { estimatedTime: 3 },
  },

  // --- 3. קהילה וחברה ---
  {
    worldId: "RELIGION",
    id: "community_type_preference", // שאלה חדשה
    category: "community_social",
    subcategory: "community_involvement",
    question:
      "לאיזה סוג קהילה דתית/רוחנית את/ה מרגיש/ה שייכות או היית רוצה להשתייך?",
    type: "multiSelectWithOther",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Building />, text: "קהילה ליטאית", value: "litvish" },
      {
        icon: <Sparkles />,
        text: "קהילה חסידית (ציין/י איזו אם רלוונטי)",
        value: "chasidish",
      },
      { icon: <MapPin />, text: "קהילה ספרדית", value: "sephardi" },
      { icon: <BookOpen />, text: "קהילה דתית-לאומית", value: "dati_leumi" },
      { icon: <Scale />, text: "קהילה מעורבת", value: "mixed" },
      { icon: <Heart />, text: "קהילה מסורתית", value: "masorti_community" },
      {
        icon: <Users />,
        text: "קהילה צעירה/סטודנטיאלית",
        value: "young_student",
      },
      { icon: <Info />, text: "קהילה אינטרנטית/וירטואלית", value: "online" },
      {
        icon: <Info />,
        text: "אינני מרגיש/ה צורך בקהילה ספציפית",
        value: "no_specific_community",
      },
    ],
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "community_involvement_level", // שינוי מ-communityRole
    category: "community_social",
    subcategory: "community_involvement",
    question: "מהי רמת המעורבות הרצויה שלך בחיים הקהילתיים?",
    type: "scale",
    depth: "BASIC",
    isRequired: false,
    min: 1, // מעורבות נמוכה
    max: 10, // מעורבות גבוהה
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "attitude_towards_other_streams", // שאלה חדשה
    category: "community_social",
    subcategory: "social_view",
    question: "מה יחסך לאנשים מזרמים דתיים אחרים או לרמות דתיות שונות משלך?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <Heart />, text: "פתוח/ה ומקבל/ת", value: "open_accepting" },
      {
        icon: <MessageCircle />,
        text: "מוכן/ה לדיאלוג ולמידה",
        value: "dialogue_learning",
      },
      {
        icon: <Scale />,
        text: "מכבד/ת אך שומר/ת על דרכי",
        value: "respectful_distinct",
      },
      {
        icon: <UsersRound />,
        text: "מעדיפ/ה חברה דומה לשלי",
        value: "prefer_similar",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "zionism_view", // שאלה חדשה
    category: "community_social",
    subcategory: "social_view",
    question: "מהי עמדתך כלפי הציונות ומדינת ישראל?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: false, // חשוב לדעת, אך לא חובה קריטי לכולם
    options: [
      {
        icon: <Flag />,
        text: "ציוני/ת דתי/ת (תמיכה פעילה)",
        value: "religious_zionist",
      },
      {
        icon: <CheckCheck />,
        text: "מזדהה עם המדינה ותומכ/ת בה",
        value: "supportive_state",
      },
      {
        icon: <Scale />,
        text: "יחס מורכב / אמביוולנטי",
        value: "complex_ambivalent",
      },
      {
        icon: <Info />,
        text: "א-ציוני/ת / אנטי-ציוני/ת",
        value: "non_anti_zionist",
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- 4. משפחה וחינוך דתי ---
  {
    worldId: "RELIGION",
    id: "partner_religious_level_match", // שאלה חדשה
    category: "family_education",
    subcategory: "partner_expectations",
    question: "עד כמה חשוב לך שבן/בת הזוג יהיו באותה רמה דתית כמוך?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, // לא חשוב
    max: 10, // חשוב מאוד
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "partner_religious_growth", // שאלה חדשה
    category: "family_education",
    subcategory: "partner_expectations",
    question:
      "האם חשוב לך שבן/בת הזוג יהיו פתוחים לצמיחה והתפתחות רוחנית/דתית?",
    type: "singleChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { value: "very_important", text: "כן, חשוב לי מאוד שנתפתח יחד" },
      { value: "somewhat_important", text: "כן, חשוב שתהיה פתיחות לכך" },
      { value: "not_crucial", text: "פחות קריטי, חשוב לי המצב הנוכחי" },
      { value: "prefer_stability", text: "מעדיפ/ה יציבות ברמה הדתית" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "children_education_type", // שאלה חדשה
    category: "family_education",
    subcategory: "children_education",
    question:
      "איזה סוג מוסד חינוכי (זרם, דגשים) היית רוצה עבור ילדיך העתידיים?",
    type: "multiSelectWithOther",
    depth: "ADVANCED",
    isRequired: false, // לא כולם הורים/חושבים על זה
    options: [
      {
        icon: <GraduationCap />,
        text: 'חינוך ממלכתי-דתי (ממ"ד)',
        value: "mamad",
      },
      { icon: <BookOpen />, text: "חינוך תורני-לאומי", value: "torani_leumi" },
      {
        icon: <Scroll />,
        text: "חינוך חרדי (חיידר, ישיבה קטנה, סמינר)",
        value: "charedi",
      },
      {
        icon: <Building />,
        text: "חינוך עצמאי / מוכר שאינו רשמי",
        value: "independent",
      },
      {
        icon: <Scale />,
        text: "חינוך משלב / דמוקרטי-דתי",
        value: "integrative_democratic",
      },
      {
        icon: <Home />,
        text: "חינוך ביתי עם דגש דתי",
        value: "homeschooling_religious",
      },
    ],
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "home_religious_atmosphere", // שאלה חדשה
    category: "family_education",
    subcategory: "home_environment",
    question: "איזו אווירה דתית/רוחנית היית רוצה ליצור בביתך המשותף?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder:
      "תאר/י את האווירה הרצויה - דגש על הלכה, רוחניות, מסורת, פתיחות...",
    metadata: { estimatedTime: 3 },
  },

  // --- 5. רוחניות וצמיחה ---
  {
    worldId: "RELIGION",
    id: "spiritual_experiences", // שינוי מ-spiritualMoment
    category: "spirituality_growth",
    subcategory: "personal_experience",
    question: "שתף/י בחוויה רוחנית משמעותית שעברת ומה למדת ממנה.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 600,
    placeholder: "ספר/י על רגע של התעלות, התחברות, הבנה רוחנית...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELIGION",
    id: "religious_challenges", // שאלה חדשה
    category: "spirituality_growth",
    subcategory: "growth_development",
    question: "מהם האתגרים הגדולים ביותר שלך בחיים הדתיים/רוחניים?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder:
      "לדוגמה: קשיים באמונה, התמודדות עם מצוות, שילוב עם העולם המודרני...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELIGION",
    id: "religious_growth_areas", // שאלה חדשה
    category: "spirituality_growth",
    subcategory: "growth_development",
    question: "באילו תחומים דתיים/רוחניים היית רוצה להתפתח או להעמיק?",
    type: "multiSelectWithOther",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      {
        icon: <BookOpen />,
        text: "לימוד תורה (גמרא, הלכה, מחשבה)",
        value: "torah_study",
      },
      { icon: <Heart />, text: "תפילה וכוונה", value: "prayer_intention" },
      {
        icon: <ShieldCheck />,
        text: "הקפדה על מצוות",
        value: "mitzvot_observance",
      },
      { icon: <HandHeart />, text: "מידות ודרך ארץ", value: "middot_ethics" },
      {
        icon: <Sparkles />,
        text: "חיבור רוחני וחוויה",
        value: "spiritual_connection",
      },
      {
        icon: <Users />,
        text: "מעורבות קהילתית",
        value: "community_involvement",
      },
    ],
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
];

// ייצא את המערך המאוחד
export default religionQuestions;
