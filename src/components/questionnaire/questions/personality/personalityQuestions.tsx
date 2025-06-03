// src/components/questionnaire/questions/personality/personalityQuestions.ts
import { Question } from "../../types/types";
import {
  Sun, // אנרגיה, אופטימיות, בוקר
  Moon, // מופנמות, רוגע, לילה
  Users, // חברתיות, קהל
  Brain, // חשיבה, אינטליגנציה, למידה
  Heart, // רגשות, אמפתיה, אהבה
  Target, // מיקוד, מטרות, ארגון
  Compass, // כיוון, החלטות
  Cloud, // גמישות, זרימה, שינוי
  Leaf, // טבע, רוגע, צמיחה
  Home, // בית, נוחות
  Watch, // זמן, שגרה
  Scale,
  Coffee, // פנאי, חברים, שיחה
  MessageCircle, // תקשורת, דיבור
  HandHeart, // נתינה, תמיכה
  Lightbulb, // רעיונות, יצירתיות
  Sparkles, // השראה, ייחודיות, קסם
  Star, // שאיפות, ערכים (גם)
  Smile, // הומור, קלילות
  ShieldCheck, // ביטחון, ערכים (גם)
  BookOpen, // למידה, תחומי עניין
  Palette, // יצירתיות, אמנות
  Headphones, // תחביבים (מוזיקה)
  Mountain, // הרפתקאות, טבע
  Bed, // מנוחה, סוף יום
  Utensils, // אוכל, העדפות
  Activity, // ספורט, תנועה
  Edit, // כתיבה, ביטוי עצמי
  HelpCircle, // שאלה, סקרנות
  Anchor, // יציבות, עוגן
  Feather, // קלילות, רגישות
} from "lucide-react";

export const personalityQuestions: Question[] = [
  // --- חלק 1: תפיסה עצמית וטמפרמנט בסיסי ---
  {
    worldId: "PERSONALITY",
    id: "personality_self_portrayal",
    category: "personality",
    subcategory: "self_perception",
    question:
      "אם היית צריך/ה לתאר את עצמך לחבר/ה טוב/ה שמעולם לא פגש/ה אותך, מהם 3-5 הדברים הראשונים שהיית מדגיש/ה באישיותך?",
    type: "openText",
    depth: "BASIC", // נתחיל עם זה כפתיחה
    isRequired: true,
    minLength: 70,
    maxLength: 500,
    placeholder: "לדוגמה: 'אני אדם אופטימי, אוהב/ת ללמוד דברים חדשים, נאמן/ה לחברים, קצת ביישנ/ית בהתחלה, אבל עם חוש הומור טוב...'",
    metadata: { estimatedTime: 3, helpText: "נסה/י לחשוב על תמצית האישיות שלך כפי שאת/ה רואה אותה." },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_energy_level",
    category: "personality",
    subcategory: "self_perception",
    question: "בדרך כלל, איך היית מתאר/ת את רמת האנרגיה הכללית שלך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Sun />, text: "גבוהה - תמיד בתנועה ופעלתנות", value: "high_energy" },
      { icon: <Activity />, text: "בינונית - אנרגטי/ת כשצריך, יודע/ת גם לנוח", value: "medium_energy" },
      { icon: <Moon />, text: "נמוכה - מעדיף/ה קצב רגוע ושליו", value: "low_energy" },
      { icon: <Cloud />, text: "משתנה - תלוי במצב הרוח וביום", value: "variable_energy" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_introversion_extroversion",
    category: "personality",
    subcategory: "self_perception",
    question: "היכן היית ממקם/ת את עצמך על הספקטרום בין מופנמות למוחצנות?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, // מופנם/ת מאוד
    max: 10, // מוחצן/ת מאוד
    labels: { min: "מופנם/ת מאוד", max: "מוחצן/ת מאוד", middle: "מאוזן/ת" },
    metadata: { estimatedTime: 1, helpText: "1 - נטייה חזקה למופנמות (טוענ/ת אנרגיה לבד), 10 - נטייה חזקה למוחצנות (טוענ/ת אנרגיה בחברה)." },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_core_trait_selection",
    category: "personality",
    subcategory: "self_perception",
    question: "אילו מהתכונות הבאות הכי מאפיינות אותך? (בחר/י 3-5 תכונות מרכזיות)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Heart />, text: "אמפתי/ת ורגיש/ה", value: "empathetic" },
      { icon: <ShieldCheck />, text: "ישר/ה ואמין/ה", value: "honest" },
      { icon: <Sun />, text: "אופטימי/ת ושמח/ה", value: "optimistic" },
      { icon: <Smile />, text: "בעל/ת חוש הומור", value: "humorous" },
      { icon: <Brain />, text: "אינטליגנט/ית וסקרנ/ית", value: "intelligent" },
      { icon: <Star />, text: "שאפתנ/ית ובעל/ת מוטיבציה", value: "ambitious" },
      { icon: <Feather />, text: "קליל/ה וזורמ/ת", value: "easygoing" },
      { icon: <Target />, text: "אחראי/ת ומאורגנ/ת", value: "responsible" },
      { icon: <Lightbulb />, text: "יצירתי/ת ומקור/ית", value: "creative" },
      { icon: <Anchor />, text: "יציב/ה וקרקע/ית", value: "stable" },
      { icon: <Compass />, text: "החלטי/ת ובעל/ת ביטחון", value: "decisive" },
      { icon: <HandHeart />, text: "נדיב/ה ומתחשב/ת", value: "generous" },
    ],
    minSelections: 3,
    maxSelections: 5,
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 2: סגנון חיים והעדפות יומיומיות ---
  {
    worldId: "PERSONALITY",
    id: "personality_daily_structure",
    category: "personality",
    subcategory: "lifestyle",
    question: "איך נראית השגרה היומית האידיאלית שלך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Watch />, text: "מתוכננת ומסודרת עם לו\"ז קבוע", value: "structured_routine" },
      { icon: <Cloud />, text: "גמישה וספונטנית, משתנה מיום ליום", value: "flexible_spontaneous" },
      { icon: <Target />, text: "ממוקדת משימות ויעדים ברורים", value: "task_oriented" },
      { icon: <Scale />, text: "שילוב של תכנון וגמישות", value: "balanced_structure" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_preferred_environment",
    category: "personality",
    subcategory: "lifestyle",
    question: "באיזה סוג סביבה את/ה מרגיש/ה הכי פרודוקטיבי/ת ונינוח/ה?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Home />, text: "שקטה וביתית, עם מינימום הסחות דעת", value: "quiet_home" },
      { icon: <Coffee />, text: "דינמית ותוססת, כמו בית קפה או משרד פתוח", value: "dynamic_cafe" },
      { icon: <Leaf />, text: "בטבע או בסביבה ירוקה", value: "nature_outdoors" },
      { icon: <Users />, text: "בסביבה חברתית, עם אנשים סביבי", value: "social_collaborative" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_weekend_style",
    category: "personality",
    subcategory: "lifestyle",
    question: "איך את/ה הכי אוהב/ת לבלות סוף שבוע טיפוסי?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <Bed />, text: "מנוחה והטענת מצברים בבית", value: "rest_recharge" },
      { icon: <Mountain />, text: "טיולים והרפתקאות בטבע", value: "nature_adventure" },
      { icon: <Users />, text: "מפגשים חברתיים ובילויים", value: "social_outings" },
      { icon: <Palette />, text: "תרבות, אמנות והופעות", value: "culture_art" },
      { icon: <BookOpen />, text: "למידה, קריאה והתפתחות אישית", value: "learning_development" },
      { icon: <Utensils />, text: "בישול, אירוח ואוכל טוב", value: "cooking_hosting" },
      { icon: <Activity />, text: "ספורט ופעילות גופנית", value: "sports_activity" },
      { icon: <Sparkles />, text: "זמן איכות ספונטני, מה שבא", value: "spontaneous_quality_time" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_ideal_vacation",
    category: "personality",
    subcategory: "lifestyle",
    question: "תאר/י את חופשת החלומות שלך. מה הופך אותה למושלמת עבורך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder: "לדוגמה: יעד, סוג הפעילויות, קצב, חברה, אווירה...",
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 3: אינטראקציות חברתיות ותקשורת ---
  {
    worldId: "PERSONALITY",
    id: "personality_social_preference",
    category: "personality",
    subcategory: "social_communication",
    question: "בסיטואציות חברתיות, את/ה בדרך כלל...",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Users />, text: "במרכז העניינים, יוזמ/ת שיחה ופעילות", value: "center_of_attention" },
      { icon: <MessageCircle />, text: "מקשיב/ה ומתבוננ/ת יותר, תורמ/ת כשמתאים", value: "observer_listener" },
      { icon: <Coffee />, text: "נהנה/ית משיחות עומק בקבוצות קטנות", value: "small_group_deep_talks" },
      { icon: <Sparkles />, text: "משתלב/ת לפי האווירה והאנשים", value: "adapts_to_vibe" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_communication_style",
    category: "personality",
    subcategory: "social_communication",
    question: "איך היית מתאר/ת את סגנון התקשורת העיקרי שלך?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <Target />, text: "ישיר/ה, ענייני/ת ולעניין", value: "direct_to_the_point" },
      { icon: <HandHeart />, text: "אמפתי/ת, רגיש/ה ומתחשב/ת ברגשות האחר", value: "empathetic_considerate" },
      { icon: <Brain />, text: "לוגי/ת, אנליטי/ת ומבוסס/ת עובדות", value: "logical_analytical" },
      { icon: <Lightbulb />, text: "יצירתי/ת, אסוציאטיבי/ת ומלא/ת רעיונות", value: "creative_associative" },
      { icon: <Smile />, text: "הומוריסטי/ת, קליל/ה ומשתמש/ת בסיפורים", value: "humorous_storyteller" },
      { icon: <MessageCircle />, text: "פתוח/ה, משתפ/ת ומעודד/ת פתיחות", value: "open_sharing" },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_handling_new_people",
    category: "personality",
    subcategory: "social_communication",
    question: "כשאת/ה פוגש/ת אנשים חדשים, איך את/ה בדרך כלל מרגיש/ה ומתנהג/ת?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder: "לדוגמה: האם את/ה פתוח/ה ויוזמ/ת, או יותר מסויג/ת? האם קל לך ליצור קשר ראשוני? מה עוזר לך להרגיש בנוח?",
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 4: התמודדות רגשית וקבלת החלטות ---
  {
    worldId: "PERSONALITY",
    id: "personality_stress_management",
    category: "personality",
    subcategory: "emotional_coping",
    question: "מהן הדרכים העיקריות שלך להתמודד עם לחץ ומתח? (בחר/י עד 3)",
    type: "multiSelectWithOther",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Activity />, text: "פעילות גופנית (ספורט, הליכה)", value: "exercise" },
      { icon: <Headphones />, text: "מוזיקה או פודקאסטים", value: "music_podcasts" },
      { icon: <Edit />, text: "כתיבה, יומן, ביטוי עצמי", value: "writing_expression" },
      { icon: <Users />, text: "שיחה עם חבר/ה קרוב/ה או בן/בת משפחה", value: "talking_support" },
      { icon: <Bed />, text: "זמן לבד, מנוחה ושקט", value: "alone_time_rest" },
      { icon: <Leaf />, text: "בילוי בטבע", value: "nature" },
      { icon: <Palette />, text: "עיסוק בתחביב יצירתי", value: "creative_hobby" },
      { icon: <MessageCircle />, text: "עיבוד וניתוח של המצב", value: "processing_analyzing" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_decision_making_style",
    category: "personality",
    subcategory: "emotional_coping",
    question: "כשאת/ה צריך/ה לקבל החלטה חשובה, מהי הגישה הטיפוסית שלך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Brain />, text: "איסוף מידע וניתוח לוגי מעמיק", value: "logical_analysis" },
      { icon: <Heart />, text: "הליכה עם תחושת הבטן והאינטואיציה", value: "intuition_gut_feeling" },
      { icon: <Users />, text: "התייעצות עם אנשים קרובים וקבלת חוות דעת", value: "consulting_others" },
      { icon: <Compass />, text: "שילוב של לוגיקה ואינטואיציה, תוך לקיחת סיכונים מחושבים", value: "balanced_approach" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_emotional_expression",
    category: "personality",
    subcategory: "emotional_coping",
    question: "באיזו מידה את/ה נוטה לבטא את רגשותיך (שמחה, עצב, כעס וכו') כלפי חוץ?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1, // מאוד מאופק/ת
    max: 10, // מאוד אקספרסיבי/ת
    labels: { min: "מאוד מאופק/ת", max: "מאוד פתוח/ה וגלוי/ה" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_handling_criticism",
    category: "personality",
    subcategory: "emotional_coping",
    question: "איך את/ה בדרך כלל מגיב/ה לביקורת (בונה או פחות בונה)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder: "האם את/ה לוקח/ת ללב? מנסה ללמוד? מתגוננ/ת? זקוק/ה לזמן עיבוד?",
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 5: צמיחה, ערכים ושאיפות (נגיעות קלות, העיקר בעולם הערכים) ---
  {
    worldId: "PERSONALITY",
    id: "personality_primary_motivation",
    category: "personality",
    subcategory: "growth_aspirations",
    question: "מהו הדבר המרכזי שמניע אותך ונותן לך מוטיבציה בחיים?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <Star />, text: "הגשמה עצמית והשגת מטרות", value: "self_actualization" },
      { icon: <Heart />, text: "יצירת קשרים משמעותיים ואהבה", value: "meaningful_connections" },
      { icon: <HandHeart />, text: "תרומה לאחרים והשפעה חיובית", value: "contributing_to_others" },
      { icon: <BookOpen />, text: "למידה, סקרנות והבנת העולם", value: "learning_understanding" },
      { icon: <Sparkles />, text: "יצירה, ביטוי עצמי והשארת חותם", value: "creation_expression" },
      { icon: <ShieldCheck />, text: "ביטחון, יציבות ושקט נפשי", value: "security_stability" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_strengths_and_weaknesses",
    category: "personality",
    subcategory: "growth_aspirations",
    question: "מהן לדעתך שלוש החוזקות המשמעותיות ביותר שלך, ותחום אחד שהיית רוצה לשפר או להתפתח בו?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב למודעות עצמית
    minLength: 70,
    maxLength: 600,
    placeholder: "חוזקות: (לדוגמה: סבלנות, יצירתיות, יכולת הקשבה). תחום לשיפור: (לדוגמה: דחיינות, ביטחון עצמי בדיבור מול קהל).",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_proud_moment",
    category: "personality",
    subcategory: "growth_aspirations",
    question: "ספר/י על הישג או רגע בחיים שאת/ה גאה בו במיוחד, ומה הוא מלמד עליך.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "זה יכול להיות הישג אישי, מקצועי, התגברות על קושי, עזרה למישהו וכו'.",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_humor_style",
    category: "personality",
    subcategory: "self_perception", // חזרה לתפיסה עצמית, אבל כסיום קליל
    question: "איזה סוג הומור הכי מאפיין אותך או מצחיק אותך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Smile />, text: "שנון ומשחקי מילים", value: "witty_puns" },
      { icon: <Feather />, text: "ציני וסרקסטי (בטוב טעם)", value: "sarcastic_tasteful" },
      { icon: <Lightbulb />, text: "אירוני וחכם", value: "ironic_clever" },
      { icon: <Cloud />, text: "סיטואציוני וקליל", value: "situational_light" },
      { icon: <Heart />, text: "הומור עצמי", value: "self_deprecating" },
      { icon: <HelpCircle />, text: "לא בטוח/ה / הכל מצחיק אותי", value: "not_sure_everything" },
    ],
    metadata: { estimatedTime: 1 },
  },
];