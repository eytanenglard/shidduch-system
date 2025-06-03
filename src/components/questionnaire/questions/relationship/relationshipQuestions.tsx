// src/components/questionnaire/questions/relationship/relationshipQuestions.tsx
import { Question } from "../../types/types";
import {
  Briefcase,
  BookOpen,
  Heart,         // אהבה, חיבור רגשי, אינטימיות
  Users,         // שותפות, חברות, משפחה מורחבת
  Home,          // בית, משפחה גרעינית, יציבות
  MessageCircle, // תקשורת, דיאלוג
  Scale,         // איזון, פשרה, חלוקת תפקידים, כספים
  Brain,         // הבנה, פתרון בעיות, אינטלקט
  Sparkles,      // קסם, כיף, רומנטיקה
  HandHeart,     // תמיכה, שפות אהבה, אמפתיה
  ShieldCheck,   // ביטחון, אמון, גבולות
  Link,          // מחויבות, חיבור
  Map,           // מרחב אישי, עצמאות (גם כדרך)
  Clock,         // זמן איכות, קצב התפתחות
  Award,         // הערכה, כבוד
  Baby,          // ילדים, הורות
  Coffee,        // בילויים, פנאי משותף
  Bed,           // אינטימיות (יכול להיות גם רגשית)
  Gift,          // מתנות (שפת אהבה)
  Info,
} from "lucide-react";

export const relationshipQuestions: Question[] = [
  // --- חלק 1: מהות הקשר וציפיות מרכזיות ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_core_meaning",
    category: "relationship",
    subcategory: "core_expectations",
    question: "מהי בעיניך התמצית של קשר זוגי בריא ומספק? (בחר/י עד 2 אפשרויות עיקריות)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Heart />, text: "חיבור רגשי עמוק, אינטימיות והבנה הדדית", value: "deep_emotional_connection" },
      { icon: <Users />, text: "שותפות איתנה, חברות אמת ותמיכה הדדית", value: "strong_partnership_friendship" },
      { icon: <Link />, text: "מחויבות, נאמנות וביטחון בקשר לטווח ארוך", value: "commitment_loyalty_security" },
      { icon: <Sparkles />, text: "צמיחה אישית וזוגית, למידה והתפתחות משותפת", value: "mutual_growth_development" },
      { icon: <Home />, text: "בניית בית ומשפחה המבוססים על ערכים משותפים", value: "building_family_shared_values" },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1, helpText: "נסה/י לחשוב על מה הכי חיוני לך כדי להרגיש סיפוק בזוגיות." },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_key_expectations_from_partner",
    category: "relationship",
    subcategory: "core_expectations",
    question: "מהן שלוש הציפיות החשובות ביותר שלך מבן/בת הזוג בתוך הקשר?",
    type: "multiSelectWithOther",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <HandHeart />, text: "שיתוף רגשי, הקשבה ותמיכה ברגעים קשים", value: "emotional_support" },
      { icon: <MessageCircle />, text: "תקשורת פתוחה, כנה ומכבדת", value: "open_communication" },
      { icon: <Award />, text: "הערכה, כבוד הדדי ופרגון", value: "respect_appreciation" },
      { icon: <ShieldCheck />, text: "אמינות, יושרה ונאמנות", value: "trustworthiness_loyalty" },
      { icon: <Scale />, text: "נכונות לפשרה והבנת צרכים הדדיים", value: "compromise_mutual_understanding" },
      { icon: <Sparkles />, text: "יכולת להנות יחד, חוש הומור וקלילות", value: "shared_fun_humor" },
      { icon: <Users />, text: "שותפות פעילה בניהול החיים המשותפים", value: "active_partnership_life_management" },
    ],
    minSelections: 1, // לפחות אחת
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_romantic_gestures_importance",
    category: "relationship",
    subcategory: "core_expectations",
    question: "עד כמה חשובות לך מחוות רומנטיות והפתעות קטנות בזוגיות? (1=פחות חשוב, 10=חשוב מאוד)",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: "פחות חשוב לי", max: "חשוב לי מאוד" },
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 2: תקשורת, אינטימיות ופתרון קונפליקטים ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_communication_ideal",
    category: "relationship",
    subcategory: "communication_intimacy",
    question: "איך נראית תקשורת זוגית אידיאלית בעיניך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <MessageCircle />, text: "פתוחה וישירה - אומרים הכל, גם דברים קשים, בכבוד", value: "open_direct" },
      { icon: <Heart />, text: "רגישה ואמפתית - דגש על הקשבה והבנת רגשות", value: "sensitive_empathetic" },
      { icon: <Brain />, text: "עניינית וממוקדת פתרונות - פחות דיבורים, יותר מעשים", value: "practical_solution_focused" },
      { icon: <Scale />, text: "מאוזנת - שילוב של פתיחות, רגישות ומעשיות", value: "balanced_communication" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_expressing_needs_comfort",
    category: "relationship",
    subcategory: "communication_intimacy",
    question: "באיזו מידה את/ה מרגיש/ה בנוח לבטא צרכים, רצונות ורגשות (גם פגיעים) בפני בן/בת זוג?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false,
    min: 1, // לא בנוח כלל
    max: 10, // מאוד בנוח
    labels: { min: "לא נוח לי", max: "מאוד נוח לי" },
    metadata: { estimatedTime: 1, helpText: "כנות ופתיחות הן מפתח. עד כמה זה טבעי לך?" },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_conflict_resolution_style",
    category: "relationship",
    subcategory: "communication_intimacy",
    question: "כשמתעוררת מחלוקת או אי הסכמה בזוגיות, מהי הדרך המועדפת עליך להתמודד?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <MessageCircle />, text: "לדבר על זה מיד ובגלוי כדי לפתור", value: "discuss_immediately" },
      { icon: <Clock />, text: "לקחת פסק זמן קצר להירגע ולחשוב, ואז לדבר", value: "short_break_then_discuss" },
      { icon: <Heart />, text: "לנסות להבין את הצד השני ולהגיע לפשרה", value: "understand_compromise" },
      { icon: <Brain />, text: "לנתח את המצב בצורה לוגית ולמצוא פתרון מעשי", value: "logical_analysis_solution" },
      { icon: <Users />, text: "להתייעץ עם מישהו ניטרלי אם לא מסתדרים לבד", value: "seek_neutral_advice" },
      { icon: <Info />, text: "מעדיפ/ה להימנע מוויכוחים ככל האפשר", value: "avoid_conflict" },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_intimacy_meaning",
    category: "relationship",
    subcategory: "communication_intimacy",
    question: "מהי אינטימיות עבורך בזוגיות, וכיצד היא באה לידי ביטוי (מעבר לפיזיות)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 50,
    maxLength: 500,
    placeholder: "לדוגמה: שיתוף סודות, חולשות, חלומות, תחושת ביטחון, צחוק משותף, הבנה ללא מילים...",
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_love_languages_give_receive",
    category: "relationship",
    subcategory: "communication_intimacy",
    question: "בחר/י עד שתי 'שפות אהבה' עיקריות שדרכן את/ה נוטה *להביע* אהבה, ועד שתיים שדרכן את/ה הכי אוהב/ת *לקבל* אהבה:",
    type: "multiSelect", // נצטרך אולי לחשוב על ממשק טוב יותר לשאלה זו, או לפצל
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { icon: <Award />, text: "מילים מאשרות (מחמאות, עידוד)", value: "words_of_affirmation" },
      { icon: <Clock />, text: "זמן איכות (תשומת לב מלאה, בילוי משותף)", value: "quality_time" },
      { icon: <Gift />, text: "קבלת מתנות (סמליות או משמעותיות)", value: "receiving_gifts" },
      { icon: <HandHeart />, text: "מעשי שירות (עזרה, הקלה במטלות)", value: "acts_of_service" },
      { icon: <Bed />, text: "מגע פיזי (חיבוק, קרבה, אינטימיות)", value: "physical_touch" },
    ],
    minSelections: 1, // לכל הפחות דרך אחת להביע ואחת לקבל
    maxSelections: 4, // מקסימום 2 להבעה + 2 לקבלה
    metadata: { estimatedTime: 2, helpText: "זו שאלה כפולה. סמן/י מה מאפיין אותך גם בנתינה וגם בקבלה. אפשר לבחור אותה אופציה פעמיים אם היא דומיננטית בשני הכיוונים, או להתמקד ב-1-2 לכל כיוון." },
  },

  // --- חלק 3: חיי יומיום, שותפות ומרחב אישי ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_daily_togetherness_vs_autonomy",
    category: "relationship",
    subcategory: "daily_life_partnership",
    question: "באיזון שבין זמן משותף לזמן אישי/עצמאי בזוגיות, מהי ההעדפה שלך?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1, // דגש על עצמאות ומרחב אישי
    max: 10, // דגש על זמן משותף וביחדנס
    labels: { min: "הרבה מרחב אישי", max: "הרבה זמן ביחד", middle: "איזון גמיש" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_shared_activities_preference",
    category: "relationship",
    subcategory: "daily_life_partnership",
    question: "אילו סוגי פעילויות חשוב לך במיוחד לחלוק עם בן/בת הזוג? (בחר/י עד 3)",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Coffee />, text: "בילויים ופנאי (מסעדות, סרטים, טיולים)", value: "leisure_outings" },
      { icon: <Home />, text: "מטלות הבית וניהול משק הבית", value: "household_chores" },
      { icon: <BookOpen />, text: "תחומי עניין משותפים, תחביבים ולמידה", value: "shared_hobbies_learning" },
      { icon: <Users />, text: "מפגשים עם חברים ומשפחה", value: "social_family_gatherings" },
      { icon: <Heart />, text: "חוויות רוחניות או דתיות משותפות", value: "spiritual_religious_experiences" },
      { icon: <Briefcase />, text: "תמיכה הדדית בקריירה וביעדים אישיים", value: "career_personal_goals_support" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_financial_management_preference",
    category: "relationship",
    subcategory: "daily_life_partnership",
    question: "מהי הגישה המועדפת עליך לניהול כספים משותף בזוגיות?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Link />, text: "שקיפות מלאה וחשבון משותף לכל", value: "full_transparency_joint_account" },
      { icon: <Scale />, text: "הפרדה מסוימת עם קופה משותפת להוצאות הבית", value: "separate_with_joint_for_household" },
      { icon: <Users />, text: "כל אחד מנהל את כספו, ומתחלקים בהוצאות גדולות", value: "individual_management_share_large_expenses" },
      { icon: <Info />, text: "פחות קריטי לי איך, כל עוד יש הסכמה ותקשורת פתוחה", value: "method_less_important_than_agreement" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_division_of_labor_home",
    category: "relationship",
    subcategory: "daily_life_partnership",
    question: "כיצד היית רוצה שתתבצע חלוקת התפקידים ומטלות הבית בזוגיות?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder: "לדוגמה: חלוקה שוויונית, לפי חוזקות, לפי זמן פנוי, מיקור חוץ של חלק מהמטלות, או גישה אחרת?",
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 4: חזון משפחתי ועתיד משותף ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_family_vision_children",
    category: "relationship",
    subcategory: "family_future_vision",
    question: "מהי שאיפתך לגבי הקמת משפחה והבאת ילדים לעולם (אם רלוונטי)?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Baby />, text: "מאוד רוצה ילדים, רצוי בקרוב יחסית", value: "want_children_soon" },
      { icon: <Home />, text: "רוצה ילדים בעתיד, אך ללא לחץ של זמן", value: "want_children_future_no_rush" },
      { icon: <Scale />, text: "פתוח/ה לאפשרות של ילדים, אך זה לא בראש סדר העדיפויות", value: "open_to_children_not_priority" },
      { icon: <Heart />, text: "מעדיפ/ה זוגיות ללא ילדים, או שזה פחות רלוונטי לי", value: "prefer_no_children_or_not_relevant" },
      { icon: <Info />, text: "יש לי כבר ילדים ואני פתוח/ה לעוד / לא מעוניינ/ת בעוד", value: "already_have_children_open_or_not" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_parenting_style_alignment_importance",
    category: "relationship",
    subcategory: "family_future_vision",
    question: "עד כמה חשובה לך התאמה בגישות ובערכים המרכזיים הנוגעים לחינוך ילדים? (1=פחות חשוב, 10=קריטי)",
    type: "scale",
    depth: "ADVANCED",
    isRequired: false, // יכול להיות לא רלוונטי לכולם בשלב זה
    min: 1,
    max: 10,
    labels: { min: "פחות חשוב", max: "קריטי מאוד" },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_extended_family_involvement",
    category: "relationship",
    subcategory: "family_future_vision",
    question: "איזו רמת מעורבות וקשר היית רוצה שתהיה למשפחות המוצא של שניכם בחיי הזוגיות והמשפחה שתקימו?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Users />, text: "מעורבות גבוהה וקשר הדוק, כחלק אינטגרלי", value: "high_involvement_integral" },
      { icon: <Home />, text: "קשר חם, תומך ומכבד, תוך שמירה על גבולות ברורים", value: "warm_supportive_with_boundaries" },
      { icon: <Map />, text: "קשר מכבד אך מצומצם יחסית, עם דגש על עצמאות הזוג", value: "respectful_limited_autonomy_focus" },
      { icon: <Info />, text: "גמיש/ה, תלוי באופי הקשרים ובדינמיקה שתווצר", value: "flexible_depends_on_dynamics" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_long_term_dreams_together",
    category: "relationship",
    subcategory: "family_future_vision",
    question: "מהם החלומות או השאיפות המשותפות הגדולות ביותר שהיית רוצה להגשים יחד עם בן/בת הזוג שלך בטווח הארוך (למשל, בעוד 10-20 שנה)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 600,
    placeholder: "לדוגמה: הקמת פרויקט משותף, טיול גדול, השגת יעד רוחני, השפעה חברתית, חיים במקום מסוים...",
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 5: אתגרים, צמיחה וסיום ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_handling_life_challenges_together",
    category: "relationship",
    subcategory: "growth_challenges",
    question: "כיצד את/ה רואה את ההתמודדות המשותפת שלכם כזוג עם אתגרי החיים הבלתי צפויים (קשיים כלכליים, בריאותיים, משפחתיים וכו')?",
    type: "openText",
    depth: "EXPERT",
    isRequired: false,
    minLength: 70,
    maxLength: 500,
    placeholder: "מהם מקורות הכוח שלכם כזוג? איך תתמכו זה בזו? מה חשוב לך שיקרה במצבים כאלה?",
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_deal_breaker_summary_final",
    category: "relationship",
    subcategory: "growth_challenges",
    question: "לסיום עולם זה, מהו הדבר האחד שבלעדיו קשר זוגי פשוט לא יכול לעבוד עבורך, ומהו הדבר האחד שאת/ה הכי שואפ/ת אליו בזוגיות?",
    type: "openText",
    depth: "EXPERT", // שאלה מסכמת חשובה
    isRequired: true,
    minLength: 50, // תשובה קצרה וממוקדת
    maxLength: 400,
    placeholder: "ה'דיל ברייקר' שלי הוא... והשאיפה הגדולה ביותר שלי היא...",
    metadata: { estimatedTime: 2 },
  },
];

// export default relationshipQuestions; // כבר לא צריך אם מייבאים ישירות את המערך