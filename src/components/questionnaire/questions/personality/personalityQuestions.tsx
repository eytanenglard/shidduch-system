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
      { icon: <Sun />, text: "גבוהה - תמיד בתנועה ופעלתנות", value: "גבוהה - תמיד בתנועה ופעלתנות" },
      { icon: <Activity />, text: "בינונית - אנרגטי/ת כשצריך, יודע/ת גם לנוח", value: "בינונית - אנרגטי/ת כשצריך, יודע/ת גם לנוח" },
      { icon: <Moon />, text: "נמוכה - מעדיף/ה קצב רגוע ושליו", value: "נמוכה - מעדיף/ה קצב רגוע ושליו" },
      { icon: <Cloud />, text: "משתנה - תלוי במצב הרוח וביום", value: "משתנה - תלוי במצב הרוח וביום" },
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
      { icon: <Heart />, text: "אמפתי/ת ורגיש/ה", value: "אמפתי/ת ורגיש/ה" },
      { icon: <ShieldCheck />, text: "ישר/ה ואמין/ה", value: "ישר/ה ואמין/ה" },
      { icon: <Sun />, text: "אופטימי/ת ושמח/ה", value: "אופטימי/ת ושמח/ה" },
      { icon: <Smile />, text: "בעל/ת חוש הומור", value: "בעל/ת חוש הומור" },
      { icon: <Brain />, text: "אינטליגנט/ית וסקרנ/ית", value: "אינטליגנט/ית וסקרנ/ית" },
      { icon: <Star />, text: "שאפתנ/ית ובעל/ת מוטיבציה", value: "שאפתנ/ית ובעל/ת מוטיבציה" },
      { icon: <Feather />, text: "קליל/ה וזורמ/ת", value: "קליל/ה וזורמ/ת" },
      { icon: <Target />, text: "אחראי/ת ומאורגנ/ת", value: "אחראי/ת ומאורגנ/ת" },
      { icon: <Lightbulb />, text: "יצירתי/ת ומקור/ית", value: "יצירתי/ת ומקור/ית" },
      { icon: <Anchor />, text: "יציב/ה וקרקע/ית", value: "יציב/ה וקרקע/ית" },
      { icon: <Compass />, text: "החלטי/ת ובעל/ת ביטחון", value: "החלטי/ת ובעל/ת ביטחון" },
      { icon: <HandHeart />, text: "נדיב/ה ומתחשב/ת", value: "נדיב/ה ומתחשב/ת" },
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
      { icon: <Watch />, text: "מתוכננת ומסודרת עם לו\"ז קבוע", value: "מתוכננת ומסודרת עם לו\"ז קבוע" },
      { icon: <Cloud />, text: "גמישה וספונטנית, משתנה מיום ליום", value: "גמישה וספונטנית, משתנה מיום ליום" },
      { icon: <Target />, text: "ממוקדת משימות ויעדים ברורים", value: "ממוקדת משימות ויעדים ברורים" },
      { icon: <Scale />, text: "שילוב של תכנון וגמישות", value: "שילוב של תכנון וגמישות" },
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
      { icon: <Home />, text: "שקטה וביתית, עם מינימום הסחות דעת", value: "שקטה וביתית, עם מינימום הסחות דעת" },
      { icon: <Coffee />, text: "דינמית ותוססת, כמו בית קפה או משרד פתוח", value: "דינמית ותוססת, כמו בית קפה או משרד פתוח" },
      { icon: <Leaf />, text: "בטבע או בסביבה ירוקה", value: "בטבע או בסביבה ירוקה" },
      { icon: <Users />, text: "בסביבה חברתית, עם אנשים סביבי", value: "בסביבה חברתית, עם אנשים סביבי" },
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
      { icon: <Bed />, text: "מנוחה והטענת מצברים בבית", value: "מנוחה והטענת מצברים בבית" },
      { icon: <Mountain />, text: "טיולים והרפתקאות בטבע", value: "טיולים והרפתקאות בטבע" },
      { icon: <Users />, text: "מפגשים חברתיים ובילויים", value: "מפגשים חברתיים ובילויים" },
      { icon: <Palette />, text: "תרבות, אמנות והופעות", value: "תרבות, אמנות והופעות" },
      { icon: <BookOpen />, text: "למידה, קריאה והתפתחות אישית", value: "למידה, קריאה והתפתחות אישית" },
      { icon: <Utensils />, text: "בישול, אירוח ואוכל טוב", value: "בישול, אירוח ואוכל טוב" },
      { icon: <Activity />, text: "ספורט ופעילות גופנית", value: "ספורט ופעילות גופנית" },
      { icon: <Sparkles />, text: "זמן איכות ספונטני, מה שבא", value: "זמן איכות ספונטני, מה שבא" },
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
      { icon: <Users />, text: "במרכז העניינים, יוזמ/ת שיחה ופעילות", value: "במרכז העניינים, יוזמ/ת שיחה ופעילות" },
      { icon: <MessageCircle />, text: "מקשיב/ה ומתבוננ/ת יותר, תורמ/ת כשמתאים", value: "מקשיב/ה ומתבוננ/ת יותר, תורמ/ת כשמתאים" },
      { icon: <Coffee />, text: "נהנה/ית משיחות עומק בקבוצות קטנות", value: "נהנה/ית משיחות עומק בקבוצות קטנות" },
      { icon: <Sparkles />, text: "משתלב/ת לפי האווירה והאנשים", value: "משתלב/ת לפי האווירה והאנשים" },
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
      { icon: <Target />, text: "ישיר/ה, ענייני/ת ולעניין", value: "ישיר/ה, ענייני/ת ולעניין" },
      { icon: <HandHeart />, text: "אמפתי/ת, רגיש/ה ומתחשב/ת ברגשות האחר", value: "אמפתי/ת, רגיש/ה ומתחשב/ת ברגשות האחר" },
      { icon: <Brain />, text: "לוגי/ת, אנליטי/ת ומבוסס/ת עובדות", value: "לוגי/ת, אנליטי/ת ומבוסס/ת עובדות" },
      { icon: <Lightbulb />, text: "יצירתי/ת, אסוציאטיבי/ת ומלא/ת רעיונות", value: "יצירתי/ת, אסוציאטיבי/ת ומלא/ת רעיונות" },
      { icon: <Smile />, text: "הומוריסטי/ת, קליל/ה ומשתמש/ת בסיפורים", value: "הומוריסטי/ת, קליל/ה ומשתמש/ת בסיפורים" },
      { icon: <MessageCircle />, text: "פתוח/ה, משתפ/ת ומעודד/ת פתיחות", value: "פתוח/ה, משתפ/ת ומעודד/ת פתיחות" },
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
      { icon: <Activity />, text: "פעילות גופנית (ספורט, הליכה)", value: "פעילות גופנית (ספורט, הליכה)" },
      { icon: <Headphones />, text: "מוזיקה או פודקאסטים", value: "מוזיקה או פודקאסטים" },
      { icon: <Edit />, text: "כתיבה, יומן, ביטוי עצמי", value: "כתיבה, יומן, ביטוי עצמי" },
      { icon: <Users />, text: "שיחה עם חבר/ה קרוב/ה או בן/בת משפחה", value: "שיחה עם חבר/ה קרוב/ה או בן/בת משפחה" },
      { icon: <Bed />, text: "זמן לבד, מנוחה ושקט", value: "זמן לבד, מנוחה ושקט" },
      { icon: <Leaf />, text: "בילוי בטבע", value: "בילוי בטבע" },
      { icon: <Palette />, text: "עיסוק בתחביב יצירתי", value: "עיסוק בתחביב יצירתי" },
      { icon: <MessageCircle />, text: "עיבוד וניתוח של המצב", value: "עיבוד וניתוח של המצב" },
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
      { icon: <Brain />, text: "איסוף מידע וניתוח לוגי מעמיק", value: "איסוף מידע וניתוח לוגי מעמיק" },
      { icon: <Heart />, text: "הליכה עם תחושת הבטן והאינטואיציה", value: "הליכה עם תחושת הבטן והאינטואיציה" },
      { icon: <Users />, text: "התייעצות עם אנשים קרובים וקבלת חוות דעת", value: "התייעצות עם אנשים קרובים וקבלת חוות דעת" },
      { icon: <Compass />, text: "שילוב של לוגיקה ואינטואיציה, תוך לקיחת סיכונים מחושבים", value: "שילוב של לוגיקה ואינטואיציה, תוך לקיחת סיכונים מחושבים" },
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
      { icon: <Star />, text: "הגשמה עצמית והשגת מטרות", value: "הגשמה עצמית והשגת מטרות" },
      { icon: <Heart />, text: "יצירת קשרים משמעותיים ואהבה", value: "יצירת קשרים משמעותיים ואהבה" },
      { icon: <HandHeart />, text: "תרומה לאחרים והשפעה חיובית", value: "תרומה לאחרים והשפעה חיובית" },
      { icon: <BookOpen />, text: "למידה, סקרנות והבנת העולם", value: "למידה, סקרנות והבנת העולם" },
      { icon: <Sparkles />, text: "יצירה, ביטוי עצמי והשארת חותם", value: "יצירה, ביטוי עצמי והשארת חותם" },
      { icon: <ShieldCheck />, text: "ביטחון, יציבות ושקט נפשי", value: "ביטחון, יציבות ושקט נפשי" },
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
      { icon: <Smile />, text: "שנון ומשחקי מילים", value: "שנון ומשחקי מילים" },
      { icon: <Feather />, text: "ציני וסרקסטי (בטוב טעם)", value: "ציני וסרקסטי (בטוב טעם)" },
      { icon: <Lightbulb />, text: "אירוני וחכם", value: "אירוני וחכם" },
      { icon: <Cloud />, text: "סיטואציוני וקליל", value: "סיטואציוני וקליל" },
      { icon: <Heart />, text: "הומור עצמי", value: "הומור עצמי" },
      { icon: <HelpCircle />, text: "לא בטוח/ה / הכל מצחיק אותי", value: "לא בטוח/ה / הכל מצחיק אותי" },
    ],
    metadata: { estimatedTime: 1 },
  },
];
