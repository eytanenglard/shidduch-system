// src/components/questionnaire/questions/values/valuesQuestions.tsx
import { Question } from "../../types/types";
import {
  Heart,         // ערכים, אהבה, רגש, משפחה
  Scale,         // איזון, צדק, כלכלה, סדרי עדיפויות
  Brain,         // חשיבה, השכלה, אמונות
  BookOpen,      // לימוד, תורה, רוחניות, השכלה
  Users,         // קהילה, חברה, התנדבות
  Home,          // בית, משפחה, סביבה
  Briefcase,     // קריירה, עבודה
  Target,        // מטרות, עקרונות
  PiggyBank,     // כסף, חיסכון, כלכלה
  HandHeart,     // נתינה, חסד, התנדבות
  TrendingUp,    // צמיחה, התפתחות, שאיפות        // הישגים, הצלחה (יכול להתאים גם לערכים)
  Leaf,          // טבע, סביבה, פשטות
  Sparkles,      // רוחניות, השראה (יכול להתאים גם לערכים)
  ShieldCheck,   // ביטחון, יושרה (יכול להתאים גם לערכים)       // מסורת, דת (יכול להתאים גם לערכים)
  Flag,          // מדינה, ציונות
  HelpCircle,    // שאלות נוספות, הבהרה
  Info,          // מידע כללי
  DollarSign,    // כסף, נתינה (יותר ספציפי מ-PiggyBank)        // תכנון, סדר עדיפויות גאוגרפי (פחות רלוונטי פה)
  Activity,      // פעילות, סגנון חיים (יותר רלוונטי לאישיות)
MessageCircle,
} from "lucide-react";

export const valuesQuestions: Question[] = [
  // --- חלק 1: ערכי ליבה וסדרי עדיפויות ---
  {
    worldId: "VALUES",
    id: "values_core_identification",
    category: "values",
    subcategory: "core_values",
    question:
      "מתוך רשימת הערכים הבאה, בחר/י את 3-5 הערכים שהם *הכי קריטיים ובלתי מתפשרים* עבורך בחיים:",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Heart />, text: "משפחה וקשרים קרובים", value: "family_connections" },
      { icon: <ShieldCheck />, text: "יושרה, אמינות וכנות", value: "integrity_honesty" },
      { icon: <BookOpen />, text: "רוחניות, אמונה וחיבור למסורת", value: "spirituality_tradition" },
      { icon: <TrendingUp />, text: "צמיחה אישית, למידה והתפתחות", value: "personal_growth" },
      { icon: <HandHeart />, text: "נתינה, חסד ותרומה לזולת", value: "giving_kindness" },
      { icon: <Briefcase />, text: "הצלחה מקצועית ומימוש עצמי בקריירה", value: "career_achievement" },
      { icon: <PiggyBank />, text: "ביטחון כלכלי ויציבות חומרית", value: "financial_security" },
      { icon: <Scale />, text: "צדק חברתי ושוויון הזדמנויות", value: "social_justice_equality" },
      { icon: <Sparkles />, text: "יצירתיות, ביטוי עצמי ומקוריות", value: "creativity_expression" },
      { icon: <Leaf />, text: "חיבור לטבע ושמירה על הסביבה", value: "nature_environment" },
      { icon: <Activity />, text: "בריאות ואורח חיים פעיל", value: "health_activity" },
      { icon: <Users />, text: "קהילתיות ומעורבות חברתית", value: "community_involvement" },
    ],
    minSelections: 3,
    maxSelections: 5,
    metadata: { estimatedTime: 2, helpText: "נסה/י לחשוב מהם העקרונות שלעולם לא תוכל/י לוותר עליהם." },
  },
  {
    worldId: "VALUES",
    id: "values_core_elaboration",
    category: "values",
    subcategory: "core_values",
    question:
      "בחר/י אחד או שניים מהערכים שסימנת כקריטיים ביותר, והסבר/י בקצרה כיצד הם באים לידי ביטוי בחיי היומיום שלך או בבחירות משמעותיות שעשית.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 70,
    maxLength: 600,
    placeholder: "לדוגמה: אם 'משפחה' הוא ערך עליון, איך זה מתבטא בהחלטות שלך, בזמן שאת/ה מקדיש/ה, או בתמיכה במשפחה?",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "VALUES",
    id: "values_life_priorities_allocation",
    category: "values",
    subcategory: "life_priorities",
    question:
      "אם היית צריך/ה לחלק 100 נקודות המייצגות את סך האנרגיה, הזמן והחשיבות שאת/ה מקדיש/ה בחייך *כיום*, כיצד היית מחלק/ת אותן בין התחומים הבאים?",
    type: "budgetAllocation",
    depth: "ADVANCED",
    isRequired: true,
    totalPoints: 100,
    categories: [
      { label: "זוגיות (אם קיימת) וחיפוש זוגיות", icon: <Heart />, min: 0, max: 100, description: "זמן ומאמץ המושקעים בקשר קיים או בחיפוש פעיל אחר זוגיות." },
      { label: "משפחה (הורים, אחים, ילדים אם יש)", icon: <Home />, min: 0, max: 100, description: "קשרים, תמיכה וזמן המוקדשים למשפחה המורחבת והגרעינית." },
      { label: "קריירה ופרנסה", icon: <Briefcase />, min: 0, max: 100, description: "עבודה, לימודים מקצועיים, פיתוח קריירה והשגת יציבות כלכלית." },
      { label: "רוחניות, דת ולימוד תורה", icon: <BookOpen />, min: 0, max: 100, description: "תפילה, לימוד, קיום מצוות ועיסוק בצד הרוחני של החיים." },
      { label: "חברים, קהילה והתנדבות", icon: <Users />, min: 0, max: 100, description: "קשרים חברתיים, מעורבות קהילתית, פעילויות התנדבות ותרומה לחברה." },
      { label: "פנאי, תחביבים ובריאות אישית", icon: <Sparkles />, min: 0, max: 100, description: "תחביבים, ספורט, תרבות, מנוחה, טיפוח עצמי ורווחה אישית." },
    ],
    metadata: { estimatedTime: 4, helpText: "אין תשובה נכונה או לא נכונה. חשוב/י על מה שבאמת תופס מקום מרכזי בחייך כרגע." },
  },
  {
    worldId: "VALUES",
    id: "values_future_priorities_partner",
    category: "values",
    subcategory: "life_priorities",
    question:
      "ובמבט לעתיד, בזוגיות משמעותית, כיצד היית *רוצה* לחלק את 100 הנקודות האלו בין אותם תחומים, כך שזה ישקף את האיזון האידיאלי עבורך ועבור הקשר?",
    type: "budgetAllocation",
    depth: "ADVANCED",
    isRequired: true,
    totalPoints: 100,
    categories: [ // אותן קטגוריות כמו בשאלה הקודמת, כדי לאפשר השוואה
      { label: "זוגיות (כולל ילדים עתידיים)", icon: <Heart />, min: 0, max: 100, description: "השקעה בקשר הזוגי, בילדים ובבניית התא המשפחתי." },
      { label: "משפחה (הורים, אחים)", icon: <Home />, min: 0, max: 100, description: "שמירה על קשר ותמיכה במשפחות המוצא של שני בני הזוג." },
      { label: "קריירה ופרנסה (של שניכם)", icon: <Briefcase />, min: 0, max: 100, description: "פיתוח קריירה אישי ומשותף, תוך תמיכה הדדית." },
      { label: "רוחניות, דת ולימוד תורה (משותף ואישי)", icon: <BookOpen />, min: 0, max: 100, description: "עיסוק משותף ואישי ברוחניות ובחיבור למסורת." },
      { label: "חברים, קהילה והתנדבות (משותף ואישי)", icon: <Users />, min: 0, max: 100, description: "מעורבות חברתית וקהילתית כזוג וכפרטים." },
      { label: "פנאי, תחביבים ובריאות אישית (משותף ואישי)", icon: <Sparkles />, min: 0, max: 100, description: "שמירה על תחומי עניין אישיים וזמן איכות זוגי." },
    ],
    metadata: { estimatedTime: 4, helpText: "חשוב/י על האיזון שהיית שואפ/ת אליו בחיים זוגיים מלאים ומספקים." },
  },

  // --- חלק 2: גישה לכסף, נתינה והשכלה ---
  {
    worldId: "VALUES",
    id: "values_attitude_towards_money",
    category: "values",
    subcategory: "material_intellectual",
    question: "מהי גישתך הכללית לכסף ורמת חיים?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Leaf />, text: "פשטות והסתפקות במועט הן ערך עליון", value: "simplicity_minimalism" },
      { icon: <Scale />, text: "איזון בין נוחות חומרית לערכים אחרים", value: "balanced_comfort_values" },
      { icon: <TrendingUp />, text: "שאיפה לרווחה כלכלית והצלחה חומרית", value: "financial_success_ambition" },
      { icon: <PiggyBank />, text: "אחריות כלכלית, חיסכון ותכנון לטווח ארוך", value: "financial_responsibility_planning" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_giving_tzedaka_importance",
    category: "values",
    subcategory: "material_intellectual",
    question: "על סולם של 1 (פחות מרכזי) עד 10 (מרכזי מאוד), עד כמה נתינה, צדקה וחסד פעיל תופסים מקום בחייך?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: "פחות מרכזי", max: "מרכזי מאוד" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_how_you_give",
    category: "values",
    subcategory: "material_intellectual",
    question: "כיצד את/ה בדרך כלל מבטא/ת את ערך הנתינה? (בחר/י את הדרכים העיקריות)",
    type: "multiSelectWithOther",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <DollarSign />, text: "תרומות כספיות קבועות/מזדמנות", value: "monetary_donations" },
      { icon: <HandHeart />, text: "התנדבות פעילה בארגונים/קהילה", value: "active_volunteering" },
      { icon: <Users />, text: "עזרה אישית לחברים, משפחה או שכנים", value: "personal_help" },
      { icon: <Briefcase />, text: "שימוש בכישורים מקצועיים למען אחרים (פרו-בונו)", value: "pro_bono_skills" },
      { icon: <Heart />, text: "מעשי חסד קטנים ביומיום", value: "daily_acts_of_kindness" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "VALUES",
    id: "values_education_pursuit",
    category: "values",
    subcategory: "material_intellectual",
    question: "מהי גישתך לרכישת השכלה (תורנית וכללית) ולהתפתחות אינטלקטואלית מתמדת?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <BookOpen />, text: "למידה מתמדת היא דרך חיים והכרח", value: "lifelong_learning_essential" },
      { icon: <Target />, text: "חשוב לרכוש ידע והשכלה רלוונטיים למטרותיי", value: "relevant_education_for_goals" },
      { icon: <Scale />, text: "מעריך/ה השכלה, אך לא בראש סדר העדיפויות", value: "appreciate_not_top_priority" },
      { icon: <Sparkles />, text: "מעדיפ/ה למידה חווייתית והתנסותית על פני פורמלית", value: "experiential_learning_preferred" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_career_vs_family_balance",
    category: "values",
    subcategory: "material_intellectual",
    question: "בנקודת זמן זו בחייך, מהו האיזון הרצוי בעיניך בין השקעה בקריירה לבין השקעה במשפחה/זוגיות?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: true,
    min: 1, // דגש מוחלט על קריירה
    max: 10, // דגש מוחלט על משפחה/זוגיות
    labels: { min: "מיקוד בקריירה", max: "מיקוד במשפחה/זוגיות", middle: "איזון שווה" },
    metadata: { estimatedTime: 1, helpText: "חשוב/י על חלוקת האנרגיה והזמן בין שני התחומים החשובים האלה." },
  },

  // --- חלק 3: ערכים קהילתיים, חברתיים והשקפת עולם ---
  {
    worldId: "VALUES",
    id: "values_community_role",
    category: "values",
    subcategory: "community_social",
    question: "איזה תפקיד או רמת מעורבות היית רוצה שתהיה לך בקהילה שבה תחיה/י?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Target />, text: "פעיל/ה ומוביל/ה, בעל/ת תפקיד מרכזי", value: "leader_active_role" },
      { icon: <Users />, text: "מעורב/ת ומשתתפ/ת קבוע/ה בפעילויות", value: "involved_participant" },
      { icon: <HandHeart />, text: "תורמ/ת ועוזר/ת כשנדרש, מאחורי הקלעים", value: "contributor_helper" },
      { icon: <Home />, text: "חבר/ה שקט/ה בקהילה, פחות מעורב/ת רשמית", value: "quiet_member" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_ideal_community_description",
    category: "values",
    subcategory: "community_social",
    question: "תאר/י בכמה מילים את הקהילה האידיאלית בעיניך. מהם המאפיינים החשובים ביותר שלה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "לדוגמה: חמה ותומכת, מגוונת, אינטלקטואלית, שומרת על צביון מסוים, פעילה חברתית...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "VALUES",
    id: "values_social_political_stance_importance_partner",
    category: "values",
    subcategory: "community_social",
    question: "עד כמה חשוב לך שתהיה התאמה או דמיון בהשקפות הפוליטיות והחברתיות בינך לבין בן/בת הזוג?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1, // כלל לא חשוב
    max: 10, // קריטי מאוד
    labels: { min: "לא משמעותי", max: "חשוב מאוד" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_attitude_state_israel",
    category: "values",
    subcategory: "community_social",
    question: "מהי עמדתך ויחסך למדינת ישראל ולציונות?",
    type: "iconChoice",
    depth: "BASIC", // שאלה בסיסית להבנת הקשר
    isRequired: true,
    options: [
      { icon: <Flag />, text: "ציונות היא ערך מרכזי, הזדהות עמוקה עם המדינה", value: "strong_zionist_identification" },
      { icon: <Heart />, text: "קשר רגשי חזק למדינה ולארץ, גם אם יש ביקורת", value: "emotional_connection_critical_support" },
      { icon: <Scale />, text: "יחס פרגמטי, חי/ה כאן מסיבות שונות", value: "pragmatic_living_here" },
      { icon: <BookOpen />, text: "יחס מורכב יותר, תלוי בהשקפה דתית/פוליטית", value: "complex_ideological" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "VALUES",
    id: "values_religious_pluralism_view",
    category: "values",
    subcategory: "community_social",
    question: "מהי גישתך לפלורליזם דתי ולקבלת זרמים שונים ביהדות ובעולם?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "האם את/ה מאמינ/ה ב'אלו ואלו דברי אלוהים חיים'? מהם הגבולות שלך מבחינת קבלה? איך זה משפיע על קשרים חברתיים?",
    metadata: { estimatedTime: 3 },
  },

  // --- חלק 4: התמודדות עם אתגרים וקונפליקטים ערכיים ---
  {
    worldId: "VALUES",
    id: "values_conflict_between_values",
    category: "values",
    subcategory: "challenges_conflicts",
    question: "תאר/י מצב שבו חווית קונפליקט בין שני ערכים שהיו חשובים לך. כיצד התמודדת ומה למדת מכך?",
    type: "openText",
    depth: "EXPERT", // שאלה רפלקטיבית עמוקה
    isRequired: false,
    minLength: 100,
    maxLength: 700,
    placeholder: "לדוגמה: קונפליקט בין נאמנות לחבר לבין אמירת אמת, או בין קריירה למשפחה. איך הכרעת? מה היו השיקולים?",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "VALUES",
    id: "values_dealing_with_disagreement_partner",
    category: "values",
    subcategory: "challenges_conflicts",
    question: "כיצד היית רוצה להתמודד עם בן/בת הזוג במצבים של חוסר הסכמה עמוק בנושא ערכי או אידיאולוגי?",
    type: "iconChoice",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <MessageCircle />, text: "שיחה פתוחה ומכבדת, גם אם לא מגיעים להסכמה מלאה", value: "open_respectful_dialogue" },
      { icon: <Brain />, text: "ניסיון להבין את נקודת המבט של השני ולמצוא בסיס משותף", value: "understanding_common_ground" },
      { icon: <Scale />, text: "חיפוש פשרה מעשית שמאפשרת חיים משותפים", value: "practical_compromise" },
      { icon: <HelpCircle />, text: "התייעצות עם גורם שלישי (רב, יועץ) במקרה הצורך", value: "third_party_consultation" },
      { icon: <Info />, text: "עבורי, חייבת להיות הסכמה מלאה בנושאים אלו", value: "full_agreement_essential" },
    ],
    metadata: { estimatedTime: 1, helpText: "חשוב/י על מצבים שבהם אין 'תשובה נכונה' אחת, אלא שתי השקפות לגיטימיות." },
  },
  {
    worldId: "VALUES",
    id: "values_flexibility_on_values",
    category: "values",
    subcategory: "challenges_conflicts",
    question: "באילו תחומים ערכיים את/ה מרגיש/ה שיש לך יותר גמישות, ובאילו פחות?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "לדוגמה: 'אני גמיש/ה יותר בנושאי סגנון חיים, אבל פחות גמיש/ה בנושאי חינוך ילדים או יושרה'.",
    metadata: { estimatedTime: 3 },
  },

  // --- חלק 5: סיכום ומבט לעתיד (ערכי) ---
  {
    worldId: "VALUES",
    id: "values_legacy_wish",
    category: "values",
    subcategory: "summary_future",
    question: "אם היית יכול/ה להשאיר 'צוואה ערכית' לדורות הבאים, מהם המסרים המרכזיים שהיית רוצה להעביר?",
    type: "openText",
    depth: "EXPERT",
    isRequired: false,
    minLength: 70,
    maxLength: 600,
    placeholder: "חשוב/י על העקרונות והתובנות החשובים ביותר שלמדת מהחיים ומהערכים שלך.",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "VALUES",
    id: "values_non_negotiable_for_partner",
    category: "values",
    subcategory: "summary_future",
    question: "לסיום עולם זה, מהם 1-2 הערכים שבהם *חייבת* להיות התאמה בינך לבין בן/בת הזוג הפוטנציאלי/ת, ואין בהם מקום לפשרה מבחינתך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב מאוד לשדכן!
    minLength: 30,
    maxLength: 300,
    placeholder: "נסה/י למקד את הדברים הקריטיים ביותר עבורך שאינם ניתנים למשא ומתן.",
    metadata: { estimatedTime: 2 },
  },
];

// export default valuesQuestions; // כבר לא צריך אם מייבאים ישירות את המערך