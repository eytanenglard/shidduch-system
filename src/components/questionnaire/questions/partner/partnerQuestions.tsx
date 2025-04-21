// src/components/questionnaire/questions/partner/partnerQuestions.tsx
import { Question } from "../../types/types";
import {
  Heart, // כללי, אהבה, רגש
  Home, // בית, משפחה
  Users, // אנשים, חברה
  Brain, // מוח, אינטליגנציה
  Star, // כוכב, שאיפות, הצלחה, איכות
  Sun, // שמש, אופטימיות, אנרגיה
  Target, // מטרה, מיקוד, יושרה
  MessageCircle, // תקשורת
  Smile, // הומור, נעימות
  HandHeart, // תמיכה, נתינה, אמפתיה
  Globe, // עולם, טיולים, פתיחות
  Music, // מוזיקה, תחביבים
  Book, // ספר, לימוד, רוחניות
  Clock, // זמן, קצב
  Map, // מפה, תכנון, עצמאות
  Church, // בניין דתי (סמל כללי לדת/מסורת)
  Brush, // אמנות, יצירתיות
  Coffee, // פנאי, רוגע
  Laugh, // צחוק, הומור
  Eye, // עין, מראה חיצוני
  Scale, // מאזניים, איזון, כספים
  ShieldCheck, // מגן, ביטחון, יושרה
  Briefcase, // קריירה
  AlertTriangle, // קו אדום
  Baby, // ילדים
  CookingPot, // בית, מטלות
  Link, // קשר, מחויבות
  Award, // הערכה, הישגים
  PiggyBank, // כסף, חסכנות
  Palette, // תרבות, אמנות
  Activity, // פעילות, אנרגיה
  Thermometer, // טמפרמנט
  UsersRound, // חברים, משפחה
} from "lucide-react";

export const partnerQuestions: Question[] = [
  // --- 1. רושם ראשוני ומראה חיצוני ---
  {
    worldId: "PARTNER",
    id: "partner_first_impression", // שינוי מ-initial_attraction
    category: "partner",
    subcategory: "first_impression",
    question: "מה הכי חשוב לך ברושם ראשוני אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Smile />,
        text: "חום ונעימות",
        value: "warmth",
        description: "אישיות מקבלת ומאירת פנים",
      },
      {
        icon: <Brain />,
        text: "אינטליגנציה ושיחה", // חידוד
        value: "intelligence",
        description: "חוכמה, סקרנות ויכולת שיחה מעניינת",
      },
      {
        icon: <Eye />,
        text: "מראה חיצוני",
        value: "appearance",
        description: "משיכה פיזית ראשונית וטיפוח",
      },
      {
        icon: <Sun />,
        text: "אנרגיה וחיוניות", // שינוי מאפשרות קודמת
        value: "energy",
        description: "נוכחות אנרגטית וחיובית",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_appearance_importance", // שאלה חדשה
    category: "partner",
    subcategory: "first_impression",
    question:
      "על סולם של 1 (פחות חשוב) עד 10 (חשוב מאוד), עד כמה מראה חיצוני וטיפוח חשובים לך בבחירת בן/בת זוג?",
    type: "scale",
    depth: "BASIC",
    isRequired: true, // חשוב לשידוך
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },

  // --- 2. תכונות אישיות ואופי ---
  {
    worldId: "PARTNER",
    id: "partner_core_traits", // שאלה חדשה מרכזית
    category: "partner",
    subcategory: "personality_character",
    question:
      "אילו תכונות אופי הן *החיוניות ביותר* עבורך אצל בן/בת זוג? (בחר/י 3)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <HandHeart />, text: "אמפתיה ורגישות", value: "empathy" },
      { icon: <ShieldCheck />, text: "יושרה ואמינות", value: "integrity" },
      { icon: <Smile />, text: "אופטימיות ושמחת חיים", value: "optimism" },
      { icon: <Laugh />, text: "חוש הומור וקלילות", value: "humor" },
      { icon: <Brain />, text: "אינטליגנציה וסקרנות", value: "intelligence" },
      { icon: <Star />, text: "שאפתנות ומוטיבציה", value: "ambition" },
      { icon: <Heart />, text: "חום ופתיחות רגשית", value: "warmth" },
      { icon: <Target />, text: "אחריות ובגרות", value: "responsibility" },
      { icon: <Globe />, text: "פתיחות מחשבתית וגמישות", value: "openness" },
    ],
    minSelections: 3,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "PARTNER",
    id: "partner_temperament", // שאלה חדשה
    category: "partner",
    subcategory: "personality_character",
    question: "איזה סוג טמפרמנט מושך אותך יותר אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Activity />,
        text: "אנרגטי/ת ותוסס/ת",
        value: "energetic",
        description: "פעיל/ה, מלא/ת חיים ויזמ/ת",
      },
      {
        icon: <Thermometer />, // או אייקון אחר לרוגע
        text: "רגוע/ה ושליו/וה",
        value: "calm",
        description: "נינוח/ה, יציב/ה ובעל/ת שלוות נפש",
      },
      {
        icon: <Sun />,
        text: "ספונטני/ת והרפתקן/ית",
        value: "spontaneous",
        description: "זורמ/ת, אוהב/ת שינויים והפתעות",
      },
      {
        icon: <Target />,
        text: "יציב/ה וצפוי/ה", // שינוי ניסוח
        value: "stable",
        description: "עקבי/ת, שקול/ה וניתן לסמוך עליו/ה",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_emotional_expression_desired", // שינוי מ-partner_emotional_expression
    category: "partner",
    subcategory: "personality_character",
    question: "איך היית רוצה שבן/בת הזוג יביעו רגשות?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Heart />,
        text: "פתוח/ה ומביע/ה", // שינוי ניסוח
        value: "expressive",
        description: "משתף/ת רגשות בפתיחות ובחופשיות",
      },
      {
        icon: <HandHeart />,
        text: "מאופק/ת ומכיל/ה", // שינוי ניסוח
        value: "contained",
        description: "יודע/ת להכיל רגשות, פחות מוחצנ/ת",
      },
      {
        icon: <Brain />,
        text: "מילולי/ת ורציונלי/ת", // שינוי ניסוח
        value: "verbal_rational",
        description: "מעדיפ/ה לדבר על רגשות בצורה מובנית",
      },
      {
        icon: <Smile />,
        text: "חיובי/ת ומעודד/ת", // שינוי ניסוח
        value: "positive_encouraging",
        description: "נוטה לראות את הטוב ומשרה אווירה חיובית",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_intelligence_type", // שאלה חדשה
    category: "partner",
    subcategory: "personality_character",
    question: "איזה סוג של 'חכמה' או אינטליגנציה הכי מושך אותך בבן/בת זוג?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      {
        icon: <Brain />,
        text: "אינטליגנציה שכלית (ידע, ניתוח)",
        value: "intellectual",
      },
      {
        icon: <Heart />,
        text: "אינטליגנציה רגשית (אמפתיה, מודעות)",
        value: "emotional",
      },
      {
        icon: <Users />,
        text: "אינטליגנציה חברתית (הבנת אנשים)",
        value: "social",
      },
      {
        icon: <Target />,
        text: "אינטליגנציה מעשית (פתרון בעיות)",
        value: "practical",
      },
      {
        icon: <Brush />,
        text: "אינטליגנציה יצירתית (חשיבה מקורית)",
        value: "creative",
      },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },

  // --- 3. סגנון חיים והרגלים ---
  {
    worldId: "PARTNER",
    id: "partner_lifestyle_preference", // שינוי מ-partner_lifestyle
    category: "partner",
    subcategory: "lifestyle_habits",
    question: "איזה סגנון חיים היית רוצה שלבן/בת הזוג יהיה?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Globe />,
        text: "דינמי והרפתקני",
        value: "adventurous",
        description: "טיולים, חוויות חדשות, שינויים",
      },
      {
        icon: <Home />,
        text: "יציב וביתי", // שינוי ניסוח
        value: "stable_homey",
        description: "שגרה מסודרת, נוחות ביתית, שקט",
      },
      {
        icon: <Music />,
        text: "תרבותי ויצירתי", // שינוי ניסוח
        value: "cultural_creative",
        description: "אמנות, מוזיקה, יצירה, אירועי תרבות",
      },
      {
        icon: <Book />,
        text: "לימודי ואינטלקטואלי", // שינוי ניסוח
        value: "intellectual_learning",
        description: "למידה מתמדת, קריאה, דיונים מעמיקים",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_leisure_activities_shared", // שינוי מ-partner_leisure
    category: "partner",
    subcategory: "lifestyle_habits",
    question: "אילו פעילויות פנאי חשוב לך *לחלוק* עם בן/בת הזוג? (בחר/י עד 3)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true, // חשוב לראות ציפיות משותפות
    options: [
      { icon: <Globe />, text: "טיולים וחוויות טבע", value: "travel_nature" },
      { icon: <Music />, text: "מוזיקה והופעות", value: "music_shows" },
      { icon: <Users />, text: "בילויים חברתיים", value: "social_events" },
      { icon: <Book />, text: "למידה והתפתחות משותפת", value: "learning" },
      { icon: <Palette />, text: "אמנות ותרבות", value: "culture_art" },
      {
        icon: <Home />,
        text: "זמן איכות ביתי ורגוע",
        value: "home_quality_time",
      },
      { icon: <Coffee />, text: "יציאה למסעדות/בתי קפה", value: "dining_out" },
      {
        icon: <Heart />,
        text: "פעילויות רוחניות/דתיות",
        value: "spiritual_activities",
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "PARTNER",
    id: "partner_social_style_preference", // שינוי מ-partner_social_style
    category: "partner",
    subcategory: "lifestyle_habits",
    question: "איזה סגנון חברתי היית מעדיף/ה אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <UsersRound />,
        text: "חברותי/ת ופתוח/ה", // שינוי ניסוח
        value: "extroverted",
        description: "אוהב/ת להיות עם אנשים, קל להתחבר",
      },
      {
        icon: <Home />,
        text: "סלקטיבי/ת ואינטימי/ת", // שינוי ניסוח
        value: "selective_introverted",
        description: "מעדיפ/ה חוג חברים קטן וקרוב",
      },
      {
        icon: <Scale />,
        text: "מאוזנ/ת - גם וגם",
        value: "balanced",
        description: "נהנה/ית גם מחברה וגם מזמן לבד/אינטימי",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_home_management_style", // שינוי מ-partner_home_management
    category: "partner",
    subcategory: "lifestyle_habits",
    question: "איזו גישה של בן/בת הזוג לניהול הבית הכי תתאים לך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <CookingPot />, // או Target
        text: "מאורגנ/ת ומסודר/ת",
        value: "organized",
        description: "מקפיד/ה על סדר, ניקיון ותכנון",
      },
      {
        icon: <Heart />,
        text: "יוצר/ת אווירה נעימה וביתית",
        value: "atmosphere_focused",
        description: "הדגש הוא על הרגשה טובה וחמימות",
      },
      {
        icon: <Coffee />,
        text: "זורמ/ת וגמיש/ה", // שינוי ניסוח
        value: "flexible_relaxed",
        description: "פחות מתעסק/ת בפרטים, יותר נינוח/ה",
      },
      {
        icon: <Users />,
        text: "רואה בבית בסיס לאירוח", // אפשרות חדשה
        value: "hospitality_focused",
        description: "אוהב/ת לארח ולפתוח את הבית",
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- 4. ערכים, אמונות והשקפת עולם ---
  {
    worldId: "PARTNER",
    id: "partner_core_values_match", // שינוי מ-partner_values
    category: "partner",
    subcategory: "values_beliefs",
    question:
      "עד כמה חשוב לך שתהיה התאמה בערכי הליבה בינך לבין בן/בת הזוג? (1=פחות חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_values_expression_observe", // שאלה חדשה (פתוחה)
    category: "partner",
    subcategory: "values_beliefs",
    question:
      "אילו ערכים חשוב לך *לראות* באים לידי ביטוי בהתנהגות היומיומית של בן/בת הזוג? תן/י דוגמה אחת או שתיים.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב להבנת הדברים המוחשיים
    minLength: 50,
    maxLength: 500,
    placeholder: "לדוגמה: לראות אותו/ה עוזר/ת לאחרים, מקפיד/ה על כבוד...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PARTNER",
    id: "partner_religious_level_desired", // שינוי מ-partner_religious_approach
    category: "partner",
    subcategory: "values_beliefs",
    question: "מהי רמת הדתיות או שמירת המסורת הרצויה אצל בן/בת הזוג?",
    type: "singleChoice", // יכול להיות גם scale אם רוצים יותר רזולוציה
    depth: "BASIC",
    isRequired: true,
    options: [
      { value: "charedi", text: "חרדי/ת" },
      { value: "dati_leumi_torani", text: "דתי/ה לאומי/ת תורני/ת" }, // פיצול
      { value: "dati_leumi_liberal", text: "דתי/ה לאומי/ת ליברלי/ת" }, // פיצול
      { value: "masorti_strong", text: "מסורתי/ת (קרוב/ה לדת)" }, // פיצול
      { value: "masorti_light", text: "מסורתי/ת (קשר קל למסורת)" }, // פיצול
      {
        value: "secular_traditional_connection",
        text: "חילוני/ת עם זיקה למסורת",
      }, // פיצול
      { value: "secular", text: "חילוני/ת" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_spiritual_connection", // שאלה חדשה
    category: "partner",
    subcategory: "values_beliefs",
    question:
      "עד כמה חשוב לך שבן/בת הזוג יהיו מחוברים לצד הרוחני של החיים (לאו דווקא דתי פורמלי)? (1=לא חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_political_view_importance", // שאלה חדשה
    category: "partner",
    subcategory: "values_beliefs",
    question:
      "עד כמה חשובה לך התאמה בהשקפות הפוליטיות/חברתיות עם בן/בת הזוג? (1=לא חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },

  // --- 5. ציפיות בתחום המשפחה ויחסים ---
  {
    worldId: "PARTNER",
    id: "partner_family_importance_desired", // שינוי מ-partner_family_approach
    category: "partner",
    subcategory: "family_relationships",
    question:
      "איזו גישה למשפחה (משפחת המוצא והגרעינית) היית רוצה שתהיה לבן/בת הזוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Heart />,
        text: "משפחתי/ת מאוד",
        value: "very_family_oriented",
        description: "קשר הדוק, מעורבות גבוהה, זמן משפחתי רב",
      },
      {
        icon: <Home />,
        text: "מאוזנ/ת - חשיבות למשפחה לצד עצמאות", // שינוי ניסוח
        value: "balanced",
        description: "קשר טוב וחם, אך גם מרחב לזוגיות ולחיים אישיים",
      },
      {
        icon: <Map />,
        text: "עצמאי/ת יחסית", // שינוי ניסוח
        value: "independent",
        description: "קשר מכבד, אך ללא מעורבות יתר ביומיום",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_children_desire_timing", // שאלה חדשה
    category: "partner",
    subcategory: "family_relationships",
    question:
      "מה הציפייה שלך מבן/בת הזוג לגבי רצון והתאמה בגישה להבאת ילדים לעולם (מספר, תזמון)?",
    type: "singleChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { value: "aligned", text: "חשוב לי שתהיה התאמה מלאה ברצונות" },
      { value: "similar", text: "חשוב שתהיה גישה דומה, גמישות בפרטים" },
      { value: "open", text: "פתוח/ה לדון ולהחליט יחד, פחות קריטי בשלב זה" },
      { value: "unsure", text: "עדיין לא בטוח/ה לגבי ילדים" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_children_previous_relationship", // שאלה חדשה
    category: "partner",
    subcategory: "family_relationships",
    question: "מהי גישתך לקשר עם בן/בת זוג שיש לו/לה ילדים ממערכת יחסים קודמת?",
    type: "singleChoice",
    depth: "ADVANCED", // שאלה רגישה
    isRequired: false,
    options: [
      { value: "open_positive", text: "פתוח/ה וחיובי/ת לגמרי" },
      { value: "open_cautious", text: "פתוח/ה אך עם חששות/שאלות" },
      { value: "prefer_not", text: "מעדיפ/ה שלא, אך לא שולל/ת לחלוטין" },
      { value: "not_interested", text: "לא מעוניינ/ת בקשר כזה" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_relationship_with_their_family", // שאלה חדשה
    category: "partner",
    subcategory: "family_relationships",
    question: "איזה סוג קשר היית רוצה שלבן/בת הזוג יהיה עם משפחתם/ן?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      {
        icon: <Heart />,
        text: "קשר קרוב, חם ותומך",
        value: "close_supportive",
      },
      {
        icon: <UsersRound />,
        text: "קשר מכבד עם גבולות ברורים",
        value: "respectful_boundaries",
      },
      {
        icon: <Scale />,
        text: "קשר מאוזן ולא תלותי",
        value: "balanced_independent",
      },
      {
        icon: <Target />,
        text: "פחות קריטי לי, חשוב לי הקשר שלנו",
        value: "less_critical",
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- 6. קריירה וכספים ---
  {
    worldId: "PARTNER",
    id: "partner_career_ambition_level", // שינוי מ-partner_career_attitude
    category: "partner",
    subcategory: "career_finance",
    question: "איזו רמת שאפתנות ומיקוד בקריירה היית רוצה לראות אצל בן/בת הזוג?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, // פחות חשוב
    max: 10, // חשוב מאוד
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_financial_approach", // שאלה חדשה
    category: "partner",
    subcategory: "career_finance",
    question: "איזו גישה כלכלית היית מעדיף/ה אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <PiggyBank />,
        text: "חסכנ/ית ומחושב/ת",
        value: "frugal",
        description: "מתנהל/ת בצורה אחראית, חוסכ/ת לעתיד",
      },
      {
        icon: <Scale />,
        text: "מאוזנ/ת - יודע/ת להנות אך גם לחסוך",
        value: "balanced",
        description: "נהנה/ית מהחיים אך שומר/ת על אחריות כלכלית",
      },
      {
        icon: <Star />,
        text: "נדיב/ה ונהנה/ית מהחיים", // שינוי ניסוח
        value: "generous_enjoyer",
        description: "אוהב/ת להוציא, לבלות ולפנק",
      },
      {
        icon: <Briefcase />,
        text: "מוכוונ/ת להצלחה פיננסית", // שינוי ניסוח
        value: "success_oriented",
        description: "שאפתנ/ית כלכלית, שואפ/ת לרווחה",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_career_support", // שאלה חדשה
    category: "partner",
    subcategory: "career_finance",
    question:
      "עד כמה חשוב לך שבן/בת הזוג יתמכו בשאיפות הקריירה *שלך* ויבינו את דרישותיה? (1=לא חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },

  // --- 7. שאלות עומק וסיכום ---
  {
    worldId: "PARTNER",
    id: "partner_non_negotiables_summary", // שאלה חדשה (פתוחה מסכמת)
    category: "partner",
    subcategory: "summary_depth",
    question:
      "לסיכום, מהם 2-3 הדברים ה*לא מתפשרים* (Deal Breakers) החשובים ביותר עבורך בבחירת בן/בת זוג לחיים?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב מאוד לשדכן
    minLength: 30,
    maxLength: 400,
    placeholder: "נסה/י למקד את הדברים הקריטיים ביותר עבורך...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PARTNER",
    id: "partner_ideal_description", // שאלה קיימת ששופרה מ-depth
    category: "partner",
    subcategory: "summary_depth",
    question:
      "אם היית צריך/ה לתאר בכמה מילים את בן/בת הזוג ה'אידיאלי/ת' עבורך (מעבר לתכונות הספציפיות), מה היית כותב/ת?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "נסה/י לתאר את התחושה, האווירה, או המהות שאת/ה מחפש/ת...",
    metadata: { estimatedTime: 3 },
  },
  // --- שאלות עומק שהיו קיימות והוטמעו או שונו ---
  // חלק מהשאלות הפתוחות הקודמות (כמו emotional_support_style, values_expression, future_challenges וכו')
  // יכולות להיות משולבות בשאלות הקיימות או שהן יותר רלוונטיות לעולם הזוגיות (איך *אתם יחד* תתמודדו).
  // לדוגמה, במקום לשאול "איך היית רוצה שהיא תתמוך", שאלנו "איזו תמיכה אתה צריך".
  // השאלה על "trust_building" הוטמעה חלקית בשאלת היושרה והאמינות.
  // השאלה על "family_relationships" (שלהם עם משפחתם) נוספה למעלה.
  // השאלה על "life_balance" נוגעת יותר לדינמיקה הזוגית.
  // השאלה על "life_philosophy" הוטמעה חלקית בשאלות על ערכים ודת.
];
