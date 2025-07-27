// src/components/questionnaire/questions/partner/partnerQuestions.tsx
import { Question } from "../../types/types";
import {
  Heart,         // אהבה, רגש, חום, משיכה
  Brain,         // אינטליגנציה, חשיבה, השכלה
  Smile,         // חוש הומור, אופטימיות, נעימות
  ShieldCheck,   // יושרה, אמינות, ביטחון
  Star,          // שאפתנות, איכות, הצלחה
  Users,         // חברתיות, משפחתיות
  Home,          // ביתיות, סגנון חיים, משפחה
  Target,        // מיקוד, אחריות, בגרות
  Scale,         // איזון, פשרה, גישה כלכלית
  BookOpen,      // השכלה, לימוד, רוחניות (בהקשר של פרטנר)
  Scroll,        // רמה דתית, מסורת (בהקשר של פרטנר)
  Activity,      // אנרגטיות, סגנון חיים פעיל
  Coffee,        // בילויים, פנאי
  Eye,           // מראה חיצוני
  Car,
  Flag,
  Globe,
  HandHeart,     // אמפתיה, תמיכה, נתינה (מהפרטנר)
  Lightbulb,     // פתיחות מחשבתית, יצירתיות (בפרטנר)
  Briefcase,     // קריירה, עיסוק (של הפרטנר)
  PiggyBank,     // גישה לכסף (של הפרטנר)
  Info,
  Sparkles,
  Palette,
  MessageCircle,
  TrendingUp,
  Building2,     // עיר גדולה
  Mountain,      // יישוב קהילתי
  TreePine,      // מושב/קיבוץ
  MapPin,        // מיקום גיאוגרפי
  DollarSign,    // היבט כלכלי
} from "lucide-react";

export const partnerQuestions: Question[] = [
  // --- חלק 1: רושם ראשוני, מראה ותכונות בסיסיות ---
  {
    worldId: "PARTNER",
    id: "partner_initial_impression_priorities",
    category: "partner",
    subcategory: "first_impression_basics",
    question: "מהם הדברים החשובים לך ביותר ברושם ראשוני ובמפגש ראשון עם בן/בת זוג פוטנציאלי/ת? (בחר/י עד 3)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Eye />, text: "מראה חיצוני כללי וטיפוח", value: "מראה חיצוני כללי וטיפוח" },
      { icon: <Smile />, text: "חיוך, נעימות וחמימות אישית", value: "חיוך, נעימות וחמימות אישית" },
      { icon: <MessageCircle />, text: "יכולת שיחה, זרימה וכימיה ראשונית", value: "יכולת שיחה, זרימה וכימיה ראשונית" },
      { icon: <Brain />, text: "ניצוץ של חוכמה, שנינות או סקרנות", value: "ניצוץ של חוכמה, שנינות או סקרנות" },
      { icon: <Activity />, text: "אנרגיה כללית, חיוניות ונוכחות", value: "אנרגיה כללית, חיוניות ונוכחות" },
      { icon: <ShieldCheck />, text: "תחושת ביטחון ואמינות שהוא/היא משדר/ת", value: "תחושת ביטחון ואמינות שהוא/היא משדר/ת" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_appearance_importance_scale",
    category: "partner",
    subcategory: "first_impression_basics",
    question: "עד כמה מראה חיצוני הוא פקטור משמעותי עבורך בבחירת בן/בת זוג? (1=לא משמעותי, 10=משמעותי מאוד)",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: "לא משמעותי", max: "משמעותי מאוד" },
    metadata: { estimatedTime: 1, helpText: "כנות כאן תסייע לנו למקד את החיפוש." },
  },
  {
    worldId: "PARTNER",
    id: "partner_core_character_traits_essential",
    category: "partner",
    subcategory: "first_impression_basics",
    question: "אילו 3-4 תכונות אופי הן *החיוניות ביותר* עבורך אצל בן/בת זוג לחיים?",
    type: "multiSelectWithOther",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <ShieldCheck />, text: "יושרה, אמינות וכנות", value: "יושרה, אמינות וכנות" },
      { icon: <Heart />, text: "חום, אמפתיה וטוב לב", value: "חום, אמפתיה וטוב לב" },
      { icon: <Smile />, text: "אופטימיות, שמחת חיים וחוש הומור", value: "אופטימיות, שמחת חיים וחוש הומור" },
      { icon: <Brain />, text: "אינטליגנציה, סקרנות ופתיחות ללמוד", value: "אינטליגנציה, סקרנות ופתיחות ללמוד" },
      { icon: <Target />, text: "אחריות, בגרות ויציבות רגשית", value: "אחריות, בגרות ויציבות רגשית" },
      { icon: <Star />, text: "שאפתנות, מוטיבציה ורצון להתפתח", value: "שאפתנות, מוטיבציה ורצון להתפתח" },
      { icon: <Scale />, text: "יכולת פשרה, גמישות וסבלנות", value: "יכולת פשרה, גמישות וסבלנות" },
      { icon: <HandHeart />, text: "תקשורת טובה ויכולת הקשבה", value: "תקשורת טובה ויכולת הקשבה" },
    ],
    minSelections: 3,
    maxSelections: 4,
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 2: העדפות סגנון חיים, תחומי עניין וגישה חברתית ---
  {
    worldId: "PARTNER",
    id: "partner_lifestyle_pace_preference",
    category: "partner",
    subcategory: "lifestyle_social",
    question: "איזה קצב וסגנון חיים כללי היית מעדיפ/ה שיהיה לבן/בת הזוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Activity />, text: "דינמי, פעיל ומלא עניין", value: "דינמי, פעיל ומלא עניין" },
      { icon: <Home />, text: "רגוע, ביתי ושליו, עם שגרה יציבה", value: "רגוע, ביתי ושליו, עם שגרה יציבה" },
      { icon: <Scale />, text: "מאוזן - יודע/ת לשלב בין פעילות למנוחה, בין שגרה לספונטניות", value: "מאוזן - יודע/ת לשלב בין פעילות למנוחה, בין שגרה לספונטניות" },
      { icon: <Sparkles />, text: "הרפתקני, אוהב/ת שינויים, טיולים וחוויות חדשות", value: "הרפתקני, אוהב/ת שינויים, טיולים וחוויות חדשות" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_shared_leisure_importance",
    category: "partner",
    subcategory: "lifestyle_social",
    question: "עד כמה חשוב לך שלבן/בת הזוג יהיו תחומי עניין או תחביבים דומים לשלך, או שיהיה רצון לפתח תחומי עניין משותפים?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1, 
    max: 10, 
    labels: { min: "פחות קריטי", max: "חשוב מאוד" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_social_style_preference",
    category: "partner",
    subcategory: "lifestyle_social",
    question: "בנוגע לחיי חברה, איזו גישה היית מעדיפ/ה אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Users />, text: "מאוד חברותי/ת, עם מעגל חברים רחב ואוהב/ת לארח/להתארח", value: "מאוד חברותי/ת, עם מעגל חברים רחב ואוהב/ת לארח/להתארח" },
      { icon: <Coffee />, text: "חברותי/ת אך מעדיפ/ה מפגשים קטנים ואינטימיים", value: "חברותי/ת אך מעדיפ/ה מפגשים קטנים ואינטימיים" },
      { icon: <Home />, text: "מעדיפ/ה חיי חברה מצומצמים, עם דגש על זמן איכות זוגי/משפחתי", value: "מעדיפ/ה חיי חברה מצומצמים, עם דגש על זמן איכות זוגי/משפחתי" },
      { icon: <Scale />, text: "מאוזנ/ת - נהנה/ית גם מחברה וגם מזמן שקט יותר", value: "מאוזנ/ת - נהנה/ית גם מחברה וגם מזמן שקט יותר" },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 3: ערכים, אמונות ורוחניות (בהקשר של פרטנר) ---
  {
    worldId: "PARTNER",
    id: "partner_values_alignment_importance",
    category: "partner",
    subcategory: "values_beliefs_spirituality",
    question: "עד כמה חשובה לך התאמה בערכי ליבה, השקפת עולם כללית ואמונות יסוד עם בן/בת הזוג? (1=לא קריטי, 10=קריטי ביותר)",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: "לא קריטי", max: "קריטי ביותר" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_religious_observance_preference_range",
    category: "partner",
    subcategory: "values_beliefs_spirituality",
    question: "באיזו רמה של שמירת מצוות והשקפה דתית היית רוצה שבן/בת הזוג יהיו? (ניתן לבחור טווח אם יש גמישות)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Scroll />, text: "חרדי/ת (כל הזרמים)", value: "חרדי/ת (כל הזרמים)" },
      { icon: <BookOpen />, text: "דתי/ה לאומי/ת - תורני/ת מאוד (חרד\"ל)", value: "דתי/ה לאומי/ת - תורני/ת מאוד (חרד\"ל)" },
      { icon: <BookOpen />, text: "דתי/ה לאומי/ת - תורני/ת / ישיבתי/ת", value: "דתי/ה לאומי/ת - תורני/ת / ישיבתי/ת" },
      { icon: <Sparkles />, text: "דתי/ה לאומי/ת - מרכז / ליברלי", value: "דתי/ה לאומי/ת - מרכז / ליברלי" },
      { icon: <Heart />, text: "מסורתי/ת מאוד (שומר/ת שבת וכשרות בקפידה)", value: "מסורתי/ת מאוד (שומר/ת שבת וכשרות בקפידה)" },
      { icon: <Heart />, text: "מסורתי/ת (שומר/ת חלק מהמצוות, חיבור למסורת)", value: "מסורתי/ת (שומר/ת חלק מהמצוות, חיבור למסורת)" },
      { icon: <Users />, text: "חילוני/ת עם זיקה חזקה למסורת וערכים יהודיים", value: "חילוני/ת עם זיקה חזקה למסורת וערכים יהודיים" },
      { icon: <Lightbulb />, text: "פתוח/ה גם למי שאינו/ה מוגדר/ת דתית אך עם ערכים דומים", value: "פתוח/ה גם למי שאינו/ה מוגדר/ת דתית אך עם ערכים דומים" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1, helpText: "חשוב להיות כן/ה. זהו אחד הפרמטרים החשובים ביותר להתאמה." },
  },
  {
    worldId: "PARTNER",
    id: "partner_spiritual_growth_openness",
    category: "partner",
    subcategory: "values_beliefs_spirituality",
    question: "האם חשוב לך שבן/בת הזוג יהיו פתוחים לצמיחה והתפתחות רוחנית או דתית, גם אם אתם מתחילים ממקומות שונים?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <TrendingUp />, text: "כן, מאוד חשוב לי שיהיה רצון משותף להתפתח יחד", value: "כן, מאוד חשוב לי שיהיה רצון משותף להתפתח יחד" },
      { icon: <Lightbulb />, text: "כן, חשובה לי פתיחות לכך, גם אם הקצב שונה", value: "כן, חשובה לי פתיחות לכך, גם אם הקצב שונה" },
      { icon: <Scale />, text: "פחות קריטי, כל עוד יש הבנה וכבוד הדדי למקום של כל אחד", value: "פחות קריטי, כל עוד יש הבנה וכבוד הדדי למקום של כל אחד" },
      { icon: <Target />, text: "מעדיפ/ה מישהו/י שכבר נמצא/ת במקום דומה לשלי מבחינה רוחנית/דתית", value: "מעדיפ/ה מישהו/י שכבר נמצא/ת במקום דומה לשלי מבחינה רוחנית/דתית" },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 4: קריירה, השכלה וגישה כלכלית (של הפרטנר) ---
  {
    worldId: "PARTNER",
    id: "partner_education_level_importance",
    category: "partner",
    subcategory: "career_finance_education",
    question: "עד כמה חשובה לך רמת ההשכלה הפורמלית של בן/בת הזוג? (1=לא חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "BASIC",
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: "לא חשוב", max: "חשוב מאוד" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_career_ambition_preference",
    category: "partner",
    subcategory: "career_finance_education",
    question: "איזו גישה לקריירה ושאיפות מקצועיות היית מעדיפ/ה אצל בן/בת זוג?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <Star />, text: "שאפתנ/ית מאוד, עם מטרות קריירה ברורות ורצון להתקדם", value: "שאפתנ/ית מאוד, עם מטרות קריירה ברורות ורצון להתקדם" },
      { icon: <Briefcase />, text: "בעל/ת קריירה יציבה ומספקת, אך לא בהכרח בראש סדר העדיפויות", value: "בעל/ת קריירה יציבה ומספקת, אך לא בהכרח בראש סדר העדיפויות" },
      { icon: <Scale />, text: "מחפש/ת איזון בין עבודה לחיים אישיים/משפחתיים", value: "מחפש/ת איזון בין עבודה לחיים אישיים/משפחתיים" },
      { icon: <Heart />, text: "העיסוק פחות קריטי, כל עוד הוא/היא מאושר/ת ומסופק/ת", value: "העיסוק פחות קריטי, כל עוד הוא/היא מאושר/ת ומסופק/ת" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_financial_outlook_preference",
    category: "partner",
    subcategory: "career_finance_education",
    question: "איזו גישה כלכלית היית רוצה שתהיה לבן/בת הזוג?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <PiggyBank />, text: "חסכנ/ית, מחושב/ת ומתכננ/ת לטווח ארוך", value: "חסכנ/ית, מחושב/ת ומתכננ/ת לטווח ארוך" },
      { icon: <Scale />, text: "מאוזנ/ת - יודע/ת להנות מהכסף אך גם לנהל אותו באחריות", value: "מאוזנ/ת - יודע/ת להנות מהכסף אך גם לנהל אותו באחריות" },
      { icon: <Sparkles />, text: "נדיב/ה, אוהב/ת לחיות טוב ולהוציא על חוויות והנאות", value: "נדיב/ה, אוהב/ת לחיות טוב ולהוציא על חוויות והנאות" },
      { icon: <Info />, text: "פחות משנה לי הגישה, כל עוד יש הסכמה על ניהול משותף", value: "פחות משנה לי הגישה, כל עוד יש הסכמה על ניהול משותף" },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 5: משפחה, ילדים ורקע אישי (של הפרטנר) ---
  {
    worldId: "PARTNER",
    id: "partner_family_orientation_preference",
    category: "partner",
    subcategory: "family_background",
    question: "איזו מידת 'משפחתיות' (קשר למשפחת המוצא, רצון להקים משפחה) היית רוצה לראות אצל בן/בת הזוג?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, 
    max: 10,
    labels: { min: "עצמאי/ת יותר", max: "מאוד משפחתי/ת" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_children_from_previous_relationship_stance",
    category: "partner",
    subcategory: "family_background",
    question: "מהי גישתך לקשר עם בן/בת זוג שכבר יש לו/לה ילדים ממערכת יחסים קודמת?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <Heart />, text: "פתוח/ה לחלוטין ומקבל/ת באהבה", value: "פתוח/ה לחלוטין ומקבל/ת באהבה" },
      { icon: <Scale />, text: "פתוח/ה לשקול, תלוי בנסיבות (גיל הילדים, טיב הקשר וכו')", value: "פתוח/ה לשקול, תלוי בנסיבות (גיל הילדים, טיב הקשר וכו')" },
      { icon: <Home />, text: "מעדיפ/ה להתחיל 'דף חדש' ללא ילדים קיימים, אך לא שולל/ת לחלוטין", value: "מעדיפ/ה להתחיל 'דף חדש' ללא ילדים קיימים, אך לא שולל/ת לחלוטין" },
      { icon: <Info />, text: "לא מעוניינ/ת בקשר עם בן/בת זוג שיש לו/לה ילדים", value: "לא מעוניינ/ת בקשר עם בן/בת זוג שיש לו/לה ילדים" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_origin_ethnicity_importance",
    category: "partner",
    subcategory: "family_background",
    question: "עד כמה חשוב לך שבן/בת הזוג יהיו מרקע עדתי/מוצא דומה לשלך, או מרקע ספציפי אחר?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1, 
    max: 10, 
    labels: { min: "לא חשוב כלל", max: "חשוב מאוד" },
    metadata: { estimatedTime: 1, helpText: "אם יש העדפה ספציפית, תוכל/י לציין זאת בהמשך או בשיחה עם השדכן." },
  },

  // --- START: NEW LOCATION & COMMUNITY QUESTIONS ---
{
  worldId: "VALUES", // עבר לעולם הערכים כי הוא משקף ערכים עמוקים יותר מסגנון חיים בלבד
  id: "values_living_style_and_community_vision", // ID חדש וברור יותר
  category: "values",
  subcategory: "community_social",
  question: "איזה סגנון חיים, מגורים וקהילה מתאימים לחזון שלך עבור הבית העתידי? (בחר/י עד 4 אפשרויות שמשקפות אותך)",
  type: "multiSelect",
  depth: "ADVANCED", // שודרג ל-ADVANCED כי הוא דורש חשיבה מעמיקה
  isRequired: true,
  minSelections: 1,
  maxSelections: 4, // הורחב ל-4 כדי לאפשר יותר גמישות
  options: [
    { 
      icon: <Building2 />, 
      text: "חיים עירוניים קלאסיים", 
      value: "חיים עירוניים קלאסיים", 
      description: "עיר גדולה או שכונה פרברית. הדגש הוא על נגישות, שירותים ואנונימיות יחסית." 
    },
    { 
      icon: <Users />, 
      text: "קהילה דתית מגובשת בעיר", 
      value: "קהילה דתית מגובשת בעיר", 
      description: "ליהנות מיתרונות העיר, אך עם חיי קהילה חמים, בית כנסת פעיל ומעורבות חברתית."
    },
    { 
      icon: <Sparkles />, 
      text: "גרעין תורני / חיים של שליחות", 
      value: "גרעין תורני / חיים של שליחות", 
      description: "חיים עם אידיאל, במטרה לחזק את הזהות היהודית בסביבה הטרוגנית."
    },
    { 
      icon: <Mountain />, 
      text: "יישוב קהילתי (דתי/מעורב)", 
      value: "יישוב קהילתי (דתי/מעורב)", 
      description: "קהילה חזקה, מרחבים פתוחים, חינוך משותף ותחושת שייכות עמוקה." 
    },
    { 
      icon: <Car />, // אייקון חדש
      text: "יישוב קרוב למרכז/לעיר גדולה", 
      value: "יישוב קרוב למרכז/לעיר גדולה", 
      description: "השילוב המושלם: איכות חיים של יישוב, במרחק נסיעה קצר ממרכזי תעסוקה ובילוי."
    },
    {
      icon: <BookOpen />,
      text: "עיר או שכונה חרדית",
      value: "עיר או שכונה חרדית",
      description: "סביבה הומוגנית עם מוסדות תורה וחינוך, ושמירה קהילתית על צביון החיים."
    },
    { 
      icon: <TreePine />, 
      text: "מושב, קיבוץ או חיים כפריים", 
      value: "מושב, קיבוץ או חיים כפריים", 
      description: "חיבור חזק לטבע ולאדמה, מרחב אישי גדול, אווירה פסטורלית ושקטה." 
    },
    {
      icon: <Palette />, // אייקון חדש
      text: "יישוב אומנותי / רוחני",
      value: "יישוב אומנותי / רוחני",
      description: "קהילה עם דגש על יצירתיות, ביטוי אישי, פשטות וחיבור פנימי (כמו צפת, פרדס חנה)."
    },
    {
      icon: <Flag />,
      text: "התיישבות אידיאולוגית (יו\"ש, גולן, נגב, גליל)",
      value: "התיישבות אידיאולוגית",
      description: "חיים מתוך אידיאל ציוני, חיבור לשורשים, אהבת הארץ והתמודדות עם אתגרים."
    },
    { 
      icon: <Heart />, 
      text: "השיקול המרכזי: קרבה למשפחה", 
      value: "השיקול המרכזי: קרבה למשפחה", 
      description: "הגמישות שלי לגבי מיקום תלויה בעיקר בקרבה למשפחות המוצא שלנו."
    },
    { 
      icon: <Briefcase />, 
      text: "השיקול המרכזי: קרבה לתעסוקה", 
      value: "השיקול המרכזי: קרבה לתעסוקה", 
      description: "חשוב לי לגור במקום עם אפשרויות תעסוקה רחבות בתחומי העיסוק שלנו."
    },
    {
      icon: <PiggyBank />, // אייקון חדש
      text: "השיקול המרכזי: עלויות מחיה נמוכות",
      value: "השיקול המרכזי: עלויות מחיה נמוכות",
      description: "העדיפות היא למצוא מקום המאפשר איכות חיים כלכלית גבוהה, גם במחיר של ריחוק מהמרכז."
    },
    { 
      icon: <Globe />, // אייקון חדש
      text: "פתוח/ה למגורים בקהילה יהודית בחו\"ל", 
      value: "פתוח/ה למגורים בקהילה יהודית בחו\"ל", 
      description: "עבור האדם הנכון, ובנסיבות המתאימות, אני רואה אפשרות בחיים מחוץ לישראל."
    },
    {
      icon: <Scale />,
      text: "מאוד גמיש/ה - ההחלטה תהיה משותפת",
      value: "מאוד גמיש/ה - ההחלטה תהיה משותפת",
      description: "אין לי העדפה חזקה. מאמינ/ה שנמצא את המקום הנכון עבורנו ביחד."
    }
  ],
  metadata: { 
    estimatedTime: 3, 
    helpText: "הבחירות כאן מספרות סיפור שלם על סדרי העדיפויות שלך. בחר/י את האפשרויות שהכי מדברות אל ליבך." 
  },
},
  {
    worldId: "PARTNER",
    id: "partner_community_character_preference",
    category: "partner",
    subcategory: "location_community",
    question: "מהם המאפיינים החשובים לך ביותר באופי הקהילה והסביבה הדתית שבה תגורו? (בחר/י עד 3)",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <BookOpen />, text: "קהילה תורנית חזקה עם דמות רבנית משמעותית", value: "קהילה תורנית חזקה" },
      { icon: <Scale />, text: "קהילה מעורבת עם מגוון רמות דתיות", value: "קהילה מעורבת" },
      { icon: <Users />, text: "קהילה צעירה ודינמית עם הרבה משפחות צעירות", value: "קהילה צעירה ודינמית" },
      { icon: <Sparkles />, text: "קהילה פתוחה וליברלית מבחינה דתית וחברתית", value: "קהילה פתוחה וליברלית" },
      { icon: <Heart />, text: "קהילה חמה, תומכת ומגובשת חברתית", value: "קהילה חמה ותומכת" },
      { icon: <ShieldCheck />, text: "קהילה שקטה ומבוססת עם דגש על פרטיות", value: "קהילה שקטה ומבוססת" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1, helpText: "האופי של הקהילה משפיע ישירות על חיי החברה, חינוך הילדים והאווירה בבית." },
  },
  {
    worldId: "PARTNER",
    id: "partner_geographical_economic_preference",
    category: "partner",
    subcategory: "location_community",
    question: "בהיבט הגיאוגרפי והכלכלי, אילו שיקולים הכי חשובים לך? (בחר/י עד 2)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <MapPin />, text: "מרכז הארץ - קרבה לתעסוקה, תרבות ומשפחה", value: "מרכז הארץ" },
      { icon: <TrendingUp />, text: "פריפריה - איכות חיים, קהילתיות ועלויות מחיה נוחות יותר", value: "פריפריה" },
      { icon: <DollarSign />, text: "מגורים ביישוב בעל עלות מחיה סבירה הם עדיפות עליונה", value: "עלות מחיה סבירה" },
      { icon: <Briefcase />, text: "קרבה למרכזי תעסוקה רלוונטיים עבורי ועבור בן/בת הזוג", value: "קרבה למרכזי תעסוקה" },
      { icon: <Home />, text: "קרבה למשפחת המוצא שלי או של בן/בת הזוג", value: "קרבה למשפחה" },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PARTNER",
    id: "partner_relocation_flexibility",
    category: "partner",
    subcategory: "location_community",
    question: "עד כמה את/ה פתוח/ה וגמיש/ה לגבי מעבר למקום מגורים חדש, גם אם הוא שונה מההעדפות הראשוניות שלך, עבור האדם הנכון?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: true,
    min: 1, 
    max: 10,
    labels: { min: "מאוד מקובע/ת", max: "גמיש/ה לחלוטין", middle: "פתוח/ה לדיון" },
    metadata: { estimatedTime: 1, helpText: "גמישות היא מפתח במציאת שידוך. כנות כאן תעזור לנו מאוד!" },
  },
  // --- END: NEW LOCATION & COMMUNITY QUESTIONS ---


  // --- חלק 6: תכונות "אדומות" (Deal Breakers) והכרחיות (Must-Haves) ---
  {
    worldId: "PARTNER",
    id: "partner_deal_breakers_open_text",
    category: "partner",
    subcategory: "non_negotiables",
    question: "האם ישנן תכונות אופי, התנהגויות או הרגלים מסוימים שמהווים 'קו אדום' (Deal Breaker) מוחלט עבורך אצל בן/בת זוג? אם כן, פרט/י 1-2 דוגמאות עיקריות.",
    type: "openText",
    depth: "EXPERT", 
    isRequired: false,
    minLength: 0,
    maxLength: 300,
    placeholder: "לדוגמה: חוסר כנות, קמצנות קיצונית, חוסר כבוד, התמכרות כלשהי...",
    metadata: { estimatedTime: 1, helpText: "אלו הדברים שלעולם לא תוכל/י לקבל או לחיות איתם בשלום." },
  },
  {
    worldId: "PARTNER",
    id: "partner_must_have_quality_final",
    category: "partner",
    subcategory: "non_negotiables",
    question: "לסיום עולם זה, מהי התכונה או האיכות *האחת* החשובה ביותר שחייבת להיות לבן/בת הזוג שלך כדי שתוכל/י לראות עתיד משותף?",
    type: "openText",
    depth: "EXPERT",
    isRequired: true,
    minLength: 10,
    maxLength: 150,
    placeholder: "נסה/י לחשוב על הדבר האחד והיחיד שהוא הבסיס להכל עבורך...",
    metadata: { estimatedTime: 1 },
  },
];