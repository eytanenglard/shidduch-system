// src/components/questionnaire/questions/relationship/relationshipQuestions.tsx
import { Question } from "../../types/types";
import {
  Heart, // לב (כללי, אהבה)
  Home, // בית (משפחה, יציבות)
  Users, // אנשים (חברה, שותפות)
  Coffee, // כוס קפה (פנאי, רוגע)
  Sun, // שמש (אנרגיה, אופטימיות)
  Moon, // ירח (רוגע, אינטימיות)
  Target, // מטרה (מיקוד, יעדים)
  MessageCircle, // בועת דיבור (תקשורת)
  Smile, // סמיילי (הומור, קלילות)
  HandHeart, // יד עם לב (תמיכה, חיבה, שפות אהבה)
  Globe, // גלובוס (טיולים, הרפתקאות)
  Music, // תו מוזיקה (תחביבים)
  Book, // ספר (למידה, רוחניות)
  Clock, // שעון (זמן, קצב)
  Star, // כוכב (הגשמה, איכות)
  Map, // מפה (תכנון, עצמאות)
  Baby, // תינוק (ילדים, משפחה)
  Wallet, // ארנק (כספים)
  Church, // בניין דתי (דת, מסורת - ניתן להחליף אם יש סמל מתאים יותר למסורת)
  Scale, // מאזניים (איזון, חלוקה)
  ShieldCheck, // מגן עם וי (ביטחון, גבולות)
  Lightbulb, // נורה (רעיונות, פתרונות)
  Activity, // גרף פעילות (דינמיות)
  AlertTriangle, // משולש אזהרה (קווים אדומים)
  Award, // מדליה (הערכה)
  Briefcase, // תיק עסקים (קריירה)
  CookingPot, // סיר בישול (תפקידים בבית)
  Link, // שרשרת (חיבור, מחויבות)
  CheckCheck, // וי כפול (הסכמה, אישור)
  Brain,
} from "lucide-react";

export const relationshipQuestions: Question[] = [
  // --- 1. ציפיות ומהות הקשר ---
  {
    worldId: "RELATIONSHIP",
    id: "relationship_type_preference", // שינוי שם מ-relationship_type
    category: "relationship",
    subcategory: "expectations",
    question: "מהי הליבה של קשר זוגי משמעותי בעיניך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Heart />,
        text: "חיבור רגשי עמוק",
        value: "emotional_connection",
        description: "הבנה, שיתוף ואינטימיות רגשית",
      },
      {
        icon: <Link />,
        text: "שותפות וחברות אמת",
        value: "partnership_friendship",
        description: "עבודת צוות, תמיכה וחברות קרובה",
      },
      {
        icon: <Home />,
        text: "בניית בית ומשפחה",
        value: "family_building",
        description: "יצירת מסגרת משפחתית יציבה ואוהבת",
      },
      {
        icon: <Star />,
        text: "צמיחה משותפת",
        value: "mutual_growth",
        description: "התפתחות אישית וזוגית לאורך הדרך",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_success_definition", // שאלה חדשה שהייתה ב-depth
    category: "relationship",
    subcategory: "expectations",
    question:
      "מהם שלושת המרכיבים החשובים ביותר עבורך להצלחה ארוכת טווח בזוגיות?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      {
        value: "communication",
        text: "תקשורת פתוחה וכנה",
        icon: <MessageCircle />,
      },
      { value: "trust", text: "אמון וביטחון הדדי", icon: <ShieldCheck /> },
      { value: "respect", text: "כבוד והערכה הדדית", icon: <Award /> },
      { value: "shared_values", text: "ערכים משותפים", icon: <Book /> },
      { value: "intimacy", text: "אינטימיות רגשית ופיזית", icon: <Heart /> },
      { value: "support", text: "תמיכה הדדית", icon: <HandHeart /> },
      { value: "fun", text: "כיף והנאה משותפת", icon: <Smile /> },
      { value: "growth", text: "צמיחה משותפת", icon: <Star /> },
    ],
    minSelections: 3,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_deal_breakers", // שאלה חדשה
    category: "relationship",
    subcategory: "expectations",
    question:
      "האם ישנם 'קווים אדומים' או דברים שאינם מקובלים עליך בשום אופן בזוגיות? אם כן, פרט/י בקצרה (עד 2 דוגמאות).",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false, // לא חובה כדי לא להלחיץ, אבל חשוב לשדכן
    minLength: 0, // לא דורשים מינימום
    maxLength: 300,
    placeholder: "לדוגמה: חוסר כנות, חוסר כבוד, חוסר שאיפה להתפתחות...",
    metadata: {
      estimatedTime: 2,
      helpText: "חשוב על דברים שאינך יכול/ה להתפשר עליהם.",
    },
  },
  {
    worldId: "RELATIONSHIP",
    id: "relationship_expectations_partner", // שאלה קיימת ששופרה מעט
    category: "relationship",
    subcategory: "expectations",
    question: "מהן הציפיות המרכזיות שלך מבן/בת הזוג?",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <HandHeart />, text: "שיתוף ותמיכה רגשית", value: "support" },
      {
        icon: <Users />,
        text: "שותפות מעשית בניהול החיים",
        value: "partnership",
      },
      {
        icon: <MessageCircle />,
        text: "תקשורת פתוחה וכנות",
        value: "communication",
      },
      { icon: <Map />, text: "מרחב אישי וכבוד לעצמאות", value: "independence" },
      { icon: <Smile />, text: "חוש הומור וקלילות", value: "humor" },
      {
        icon: <Brain />,
        text: "עומק אינטלקטואלי ושיחות מעניינות",
        value: "intellect",
      }, // שינוי טקסט
    ],
    minSelections: 2,
    maxSelections: 4,
    metadata: { estimatedTime: 1 },
  },

  // --- 2. תקשורת והתמודדות ---
  {
    worldId: "RELATIONSHIP",
    id: "communication_style_preference", // שינוי שם מ-communication_style
    category: "relationship",
    subcategory: "communication",
    question: "איזה סגנון תקשורת הכי חשוב לך שיהיה בזוגיות?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <MessageCircle />,
        text: "פתוחה וישירה",
        value: "open_direct",
        description: "אומרים הכל, גם מה שלא נעים, בצורה מכבדת",
      },
      {
        icon: <Heart />,
        text: "רגשית ומכילה",
        value: "emotional_empathetic",
        description: "שיתוף רגשות והקשבה אמפתית",
      },
      {
        icon: <Smile />,
        text: "קלילה והומוריסטית",
        value: "light_humorous",
        description: "גישה חיובית, הומור ופחות דרמה",
      },
      {
        icon: <Lightbulb />,
        text: "ממוקדת פתרונות",
        value: "solution_focused",
        description: "מתמקדים בפתרון בעיות ולא בהאשמות",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "conflict_resolution_approach", // שינוי שם מ-conflict_resolution
    category: "relationship",
    subcategory: "communication",
    question: "כשמתעוררת מחלוקת, מהי הדרך המועדפת עליך להתמודדות?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <MessageCircle />,
        text: "לדבר על זה מיד",
        value: "talk_immediately",
        description: "לפתור את העניין כמה שיותר מהר",
      },
      {
        icon: <Clock />,
        text: "לקחת פסק זמן לעיבוד",
        value: "time_to_process",
        description: "לחשוב ולהירגע לפני שמדברים",
      },
      {
        icon: <HandHeart />,
        text: "לחפש פשרה והבנה",
        value: "seek_compromise",
        description: "למצוא פתרון שמתאים לשני הצדדים",
      },
      {
        icon: <Users />,
        text: "לשתף צד שלישי (אם צריך)",
        value: "involve_third_party",
        description: "פתיחות לייעוץ או גישור במקרה הצורך",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "expressing_love_language", // שאלה חדשה
    category: "relationship",
    subcategory: "communication",
    question: "באילו דרכים עיקריות את/ה נוטה להביע אהבה וחיבה?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { value: "words", text: "מילים (מחמאות, עידוד)", icon: <Award /> },
      { value: "acts", text: "מעשים (עזרה, שירות)", icon: <HandHeart /> },
      { value: "gifts", text: "מתנות סמליות", icon: <Star /> },
      { value: "quality_time", text: "זמן איכות משותף", icon: <Coffee /> },
      {
        value: "physical_touch",
        text: "מגע פיזי (חיבוק, יד ביד)",
        icon: <Heart />,
      },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: {
      estimatedTime: 1,
      helpText: "חשוב/י על 'שפות האהבה' - איך את/ה מראה לאחרים שאכפת לך.",
    },
  },
  {
    worldId: "RELATIONSHIP",
    id: "receiving_love_language", // שאלה חדשה
    category: "relationship",
    subcategory: "communication",
    question: "איך את/ה הכי אוהב/ת לקבל אהבה וחיבה?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { value: "words", text: "מילים (מחמאות, עידוד)", icon: <Award /> },
      { value: "acts", text: "מעשים (עזרה, שירות)", icon: <HandHeart /> },
      { value: "gifts", text: "מתנות סמליות", icon: <Star /> },
      { value: "quality_time", text: "זמן איכות משותף", icon: <Coffee /> },
      {
        value: "physical_touch",
        text: "מגע פיזי (חיבוק, יד ביד)",
        icon: <Heart />,
      },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: {
      estimatedTime: 1,
      helpText: "חשוב/י מה גורם לך להרגיש הכי אהוב/ה ומוערכ/ת.",
    },
  },
  {
    worldId: "RELATIONSHIP",
    id: "conflict_handling_deep", // שאלה קיימת ששופרה מ-depth
    category: "relationship",
    subcategory: "communication",
    question:
      "תאר/י גישה בונה בעיניך להתמודדות עם מחלוקות בזוגיות. מה חשוב לך שיקרה (או לא יקרה) בזמן ויכוח?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder:
      "לדוגמה: הקשבה הדדית, הימנעות מהאשמות, התמקדות בפתרון, לקיחת אחריות...",
    metadata: { estimatedTime: 4 },
  },

  // --- 3. חיי היומיום המשותפים ---
  {
    worldId: "RELATIONSHIP",
    id: "daily_routine_preference", // שינוי שם מ-daily_routine
    category: "relationship",
    subcategory: "daily_life",
    question: "איזו אווירה היית רוצה שתאפיין את שגרת היום-יום הזוגית?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Activity />,
        text: "אנרגטית ופעילה",
        value: "active_energetic",
        description: "עשייה משותפת, יוזמות ופעלתנות",
      },
      {
        icon: <Moon />,
        text: "רגועה וביתית",
        value: "calm_homey",
        description: "שלווה, נוחות ופשטות",
      },
      {
        icon: <Coffee />,
        text: "גמישה וספונטנית",
        value: "flexible_spontaneous",
        description: "זרימה עם היום, פחות תכנון קשיח",
      },
      {
        icon: <Clock />,
        text: "מאורגנת ויציבה",
        value: "organized_stable",
        description: "סדר יום ברור, תכנון ויציבות",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "leisure_preference", // שינוי שם מ-leisure_time
    category: "relationship",
    subcategory: "daily_life",
    question: "איזה סוג בילוי פנאי משותף הכי חשוב לך?",
    type: "singleChoice", // שינוי לסוג שאלה
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Home />,
        text: "בילוי ביתי רגוע",
        value: "home_chill",
        description: "סרט, ספר, שיחה נעימה בבית",
      },
      {
        icon: <Globe />,
        text: "יציאות וחוויות בחוץ",
        value: "going_out_experiences",
        description: "מסעדות, טיולים, הופעות, טבע",
      },
      {
        icon: <Users />,
        text: "מפגשים חברתיים",
        value: "social_gatherings",
        description: "אירוח או בילוי עם חברים/משפחה",
      },
      {
        icon: <Book />,
        text: "פעילות משותפת סביב תחביב",
        value: "shared_hobby",
        description: "ספורט, יצירה, למידה משותפת וכו'",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "financial_management_style", // שינוי שם מ-financial_approach
    category: "relationship",
    subcategory: "daily_life",
    question: "מהי הגישה המועדפת עליך לניהול כספים בזוגיות?", // נוסח זהה
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Wallet />,
        text: "חשבון משותף להכל",
        value: "fully_shared",
        description: "שקיפות מלאה, כל ההכנסות וההוצאות משותפות",
      },
      {
        icon: <Scale />,
        text: "הפרדה עם קופה משותפת להוצאות",
        value: "separate_with_joint_expenses",
        description: "חשבונות נפרדים, תקציב משותף להוצאות הבית",
      },
      {
        icon: <Target />,
        text: "הפרדה כמעט מלאה",
        value: "mostly_separate",
        description: "כל אחד מנהל את כספו, מתחלקים בהוצאות גדולות",
      },
      {
        icon: <Lightbulb />,
        text: "פחות קריטי לי, חשוב שיהיה דיון פתוח",
        value: "flexible_open_discussion",
        description: "השיטה פחות חשובה מהתקשורת סביב כסף",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "home_roles_preference", // שאלה חדשה
    category: "relationship",
    subcategory: "daily_life",
    question: "איזו גישה היית רוצה לחלוקת התפקידים והמטלות בבית?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Scale />,
        text: "חלוקה שוויונית ומדויקת",
        value: "equal_division",
        description: "חלוקה ברורה ושווה של כל המטלות",
      },
      {
        icon: <Users />,
        text: "שיתוף פעולה גמיש לפי הצורך",
        value: "flexible_collaboration",
        description: "עושים מה שצריך, בלי לספור בדיוק מי עשה מה",
      },
      {
        icon: <CookingPot />, // או אייקון אחר לתפקידים
        text: "התמחות לפי חוזקות/העדפות",
        value: "specialization",
        description: "כל אחד מתמקד במה שהוא טוב בו או מעדיף",
      },
      {
        icon: <Briefcase />,
        text: "התאמה לפי שעות עבודה/פנאי",
        value: "adjusted_to_work",
        description: "מי שיש לו יותר זמן/פניות עושה יותר",
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- 4. אינטימיות, קרבה ותמיכה ---
  {
    worldId: "RELATIONSHIP",
    id: "emotional_intimacy_importance", // שאלה חדשה (משולבת)
    category: "relationship",
    subcategory: "intimacy_support",
    question:
      "על סולם של 1 (פחות מרכזי) עד 10 (מרכזי מאוד), עד כמה חשובה לך אינטימיות רגשית (שיחות נפש, פתיחות, שיתוף) בזוגיות?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: true,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "physical_intimacy_importance", // שאלה חדשה (משולבת)
    category: "relationship",
    subcategory: "intimacy_support",
    question:
      "על סולם של 1 (פחות מרכזי) עד 10 (מרכזי מאוד), עד כמה חשובה לך אינטימיות פיזית (חיבה, מגע, קשר פיזי) בזוגיות?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: true,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "building_intimacy", // שאלה קיימת ששופרה מ-depth
    category: "relationship",
    subcategory: "intimacy_support",
    question:
      "מה בעיניך בונה ומטפח אינטימיות (רגשית ופיזית) בקשר זוגי לאורך זמן?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 50,
    maxLength: 600,
    placeholder:
      "לדוגמה: זמן איכות, שיחות פתוחות, חוויות משותפות, מחוות קטנות...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "support_style_needed", // שאלה חדשה (משולבת)
    category: "relationship",
    subcategory: "intimacy_support",
    question: "כשאת/ה מתמודד/ת עם קושי, איזה סוג תמיכה הכי עוזר לך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <HandHeart />,
        text: "הקשבה ואמפתיה",
        value: "listening_empathy",
      },
      {
        icon: <Lightbulb />,
        text: "עצות ופתרונות מעשיים",
        value: "advice_solutions",
      },
      {
        icon: <Coffee />,
        text: "הסחת דעת ועידוד",
        value: "distraction_encouragement",
      },
      {
        icon: <Home />,
        text: "מרחב שקט לעיבוד עצמי",
        value: "space_processing",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "personal_space_need", // שינוי שם מ-personal_space
    category: "relationship",
    subcategory: "intimacy_support",
    question:
      "על סולם של 1 (זקוק/ה למעט מאוד) עד 10 (זקוק/ה להרבה), כמה מרחב אישי וזמן לבד חשובים לך בתוך הזוגיות?",
    type: "scale",
    depth: "BASIC",
    isRequired: true,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },

  // --- 5. חזון משפחתי ועתידי ---
  {
    worldId: "RELATIONSHIP",
    id: "family_size_timing", // שינוי שם מ-family_vision
    category: "relationship",
    subcategory: "family_future",
    question: "מהי השאיפה שלך לגבי גודל המשפחה ותזמון הבאת ילדים?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Baby />,
        text: "רוצה משפחה גדולה יחסית ומוקדם",
        value: "large_early",
      },
      {
        icon: <Home />,
        text: "רוצה משפחה קטנה/בינונית, בקצב טבעי",
        value: "small_medium_natural",
      },
      {
        icon: <Clock />,
        text: "רוצה ילדים, אבל לא בלחץ של זמן",
        value: "kids_no_rush",
      },
      {
        icon: <Heart />,
        text: "פתוח/ה למה שיבוא, גמיש/ה בנושא",
        value: "open_flexible",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "parenting_style_vision", // שאלה חדשה
    category: "relationship",
    subcategory: "family_future",
    question: "אילו עקרונות מרכזיים היית רוצה שיובילו את גידול הילדים במשפחתך?",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: false, // אפשר להפוך לחובה אם רלוונטי
    options: [
      { value: "independence", text: "עידוד עצמאות ואחריות", icon: <Star /> },
      { value: "discipline", text: "גבולות ומשמעת ברורה", icon: <Target /> },
      {
        value: "emotional_expression",
        text: "פתיחות רגשית וביטוי עצמי",
        icon: <Heart />,
      },
      { value: "learning_curiosity", text: "סקרנות ולמידה", icon: <Book /> },
      { value: "religious_values", text: "ערכי דת ומסורת", icon: <Church /> },
      {
        value: "creativity",
        text: "יצירתיות וחשיבה מחוץ לקופסה",
        icon: <Lightbulb />,
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "extended_family_relations", // שינוי שם מ-family_boundaries
    category: "relationship",
    subcategory: "family_future",
    question: "איזה סוג קשר היית רוצה לקיים עם המשפחות המורחבות של שניכם?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Users />,
        text: "מעורבות גבוהה וחלק אינטגרלי מהחיים",
        value: "high_involvement_integral",
      },
      {
        icon: <Home />,
        text: "קשר חם ותומך, תוך שמירה על גבולות",
        value: "warm_supportive_boundaries",
      },
      {
        icon: <Map />,
        text: "קשר מכבד אך עצמאי יחסית",
        value: "respectful_independent",
      },
      {
        icon: <Scale />,
        text: "משתנה לפי הנסיבות והצרכים",
        value: "variable_needs_based",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "childhood_influence_deep", // שאלה קיימת מ-depth
    category: "relationship",
    subcategory: "family_future",
    question:
      "איך הבית שבו גדלת השפיע על תפיסת הזוגיות והמשפחה שלך? מה היית רוצה לשחזר ומה היית רוצה ליצור באופן שונה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 1000,
    placeholder:
      "שתף/י תובנות לגבי השפעות הבית, דברים חיוביים ושליליים, ואיך זה מעצב את הרצונות שלך להיום...",
    metadata: { estimatedTime: 5 },
  },
  {
    worldId: "RELATIONSHIP",
    id: "long_term_vision", // שאלה קיימת מ-depth שופרה
    category: "relationship",
    subcategory: "family_future",
    question:
      "איך את/ה מדמיין/ת את חייכם המשותפים בעוד 10-15 שנה? מהם הדברים העיקריים שהיית רוצה להשיג יחד עד אז?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "תאר/י את החזון שלך לעתיד הזוגי והמשפחתי בטווח הבינוני...",
    metadata: { estimatedTime: 4 },
  },
];

// הסרנו את ייצוא ברירת המחדל, מכיוון שהקובץ הזה רק מייצא את המערך
// export default relationshipQuestions;
