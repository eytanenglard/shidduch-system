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
  HandHeart,     // אמפתיה, תמיכה, נתינה (מהפרטנר)
  Lightbulb,     // פתיחות מחשבתית, יצירתיות (בפרטנר)
  Briefcase,     // קריירה, עיסוק (של הפרטנר)
  PiggyBank,     // גישה לכסף (של הפרטנר)
  Info,
  Sparkles,
  MessageCircle,
  TrendingUp,
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
      { icon: <Eye />, text: "מראה חיצוני כללי וטיפוח", value: "appearance_grooming" },
      { icon: <Smile />, text: "חיוך, נעימות וחמימות אישית", value: "smile_warmth" },
      { icon: <MessageCircle />, text: "יכולת שיחה, זרימה וכימיה ראשונית", value: "conversation_chemistry" },
      { icon: <Brain />, text: "ניצוץ של חוכמה, שנינות או סקרנות", value: "spark_intelligence_wit" },
      { icon: <Activity />, text: "אנרגיה כללית, חיוניות ונוכחות", value: "energy_presence" },
      { icon: <ShieldCheck />, text: "תחושת ביטחון ואמינות שהוא/היא משדר/ת", value: "sense_of_security_trust" },
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
    type: "multiSelectWithOther", // מאפשר גם "אחר"
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <ShieldCheck />, text: "יושרה, אמינות וכנות", value: "integrity_honesty_trustworthiness" },
      { icon: <Heart />, text: "חום, אמפתיה וטוב לב", value: "warmth_empathy_kindness" },
      { icon: <Smile />, text: "אופטימיות, שמחת חיים וחוש הומור", value: "optimism_joy_humor" },
      { icon: <Brain />, text: "אינטליגנציה, סקרנות ופתיחות ללמוד", value: "intelligence_curiosity_openness_to_learn" },
      { icon: <Target />, text: "אחריות, בגרות ויציבות רגשית", value: "responsibility_maturity_emotional_stability" },
      { icon: <Star />, text: "שאפתנות, מוטיבציה ורצון להתפתח", value: "ambition_motivation_drive" },
      { icon: <Scale />, text: "יכולת פשרה, גמישות וסבלנות", value: "compromise_flexibility_patience" },
      { icon: <HandHeart />, text: "תקשורת טובה ויכולת הקשבה", value: "good_communication_listening_skills" },
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
      { icon: <Activity />, text: "דינמי, פעיל ומלא עניין", value: "dynamic_active_eventful" },
      { icon: <Home />, text: "רגוע, ביתי ושליו, עם שגרה יציבה", value: "calm_homey_stable_routine" },
      { icon: <Scale />, text: "מאוזן - יודע/ת לשלב בין פעילות למנוחה, בין שגרה לספונטניות", value: "balanced_activity_rest_routine_spontaneity" },
      { icon: <Sparkles />, text: "הרפתקני, אוהב/ת שינויים, טיולים וחוויות חדשות", value: "adventurous_loves_change_travel" },
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
    min: 1, // לא מאוד חשוב, אפשר שונים
    max: 10, // חשוב מאוד שיהיו משותפים
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
      { icon: <Users />, text: "מאוד חברותי/ת, עם מעגל חברים רחב ואוהב/ת לארח/להתארח", value: "very_social_large_circle_hosts" },
      { icon: <Coffee />, text: "חברותי/ת אך מעדיפ/ה מפגשים קטנים ואינטימיים", value: "social_prefers_small_intimate_gatherings" },
      { icon: <Home />, text: "מעדיפ/ה חיי חברה מצומצמים, עם דגש על זמן איכות זוגי/משפחתי", value: "prefers_limited_social_life_family_focus" },
      { icon: <Scale />, text: "מאוזנ/ת - נהנה/ית גם מחברה וגם מזמן שקט יותר", value: "balanced_enjoys_social_and_quiet" },
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
    type: "multiSelect", // מאפשר בחירת טווח או מספר אופציות
    depth: "BASIC",
    isRequired: true,
    options: [ // הוספתי אופציות מגוונות יותר
      { icon: <Scroll />, text: "חרדי/ת (כל הזרמים)", value: "charedi_any" },
      { icon: <BookOpen />, text: "דתי/ה לאומי/ת - תורני/ת מאוד (חרד\"ל)", value: "dati_leumi_very_torani" },
      { icon: <BookOpen />, text: "דתי/ה לאומי/ת - תורני/ת / ישיבתי/ת", value: "dati_leumi_torani_yeshivish" },
      { icon: <Sparkles />, text: "דתי/ה לאומי/ת - מרכז / ליברלי", value: "dati_leumi_centrist_liberal" },
      { icon: <Heart />, text: "מסורתי/ת מאוד (שומר/ת שבת וכשרות בקפידה)", value: "masorti_very_observant" },
      { icon: <Heart />, text: "מסורתי/ת (שומר/ת חלק מהמצוות, חיבור למסורת)", value: "masorti_observant_traditional_connection" },
      { icon: <Users />, text: "חילוני/ת עם זיקה חזקה למסורת וערכים יהודיים", value: "secular_strong_jewish_values_tradition" },
      { icon: <Lightbulb />, text: "פתוח/ה גם למי שאינו/ה מוגדר/ת דתית אך עם ערכים דומים", value: "open_to_non_defined_similar_values" },
    ],
    minSelections: 1,
    maxSelections: 3, // מאפשר גמישות מסוימת בטווח
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
      { icon: <TrendingUp />, text: "כן, מאוד חשוב לי שיהיה רצון משותף להתפתח יחד", value: "very_important_mutual_growth" },
      { icon: <Lightbulb />, text: "כן, חשובה לי פתיחות לכך, גם אם הקצב שונה", value: "important_openness_different_pace" },
      { icon: <Scale />, text: "פחות קריטי, כל עוד יש הבנה וכבוד הדדי למקום של כל אחד", value: "less_critical_mutual_respect" },
      { icon: <Target />, text: "מעדיפ/ה מישהו/י שכבר נמצא/ת במקום דומה לשלי מבחינה רוחנית/דתית", value: "prefer_similar_current_level" },
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
      { icon: <Star />, text: "שאפתנ/ית מאוד, עם מטרות קריירה ברורות ורצון להתקדם", value: "very_ambitious_career_driven" },
      { icon: <Briefcase />, text: "בעל/ת קריירה יציבה ומספקת, אך לא בהכרח בראש סדר העדיפויות", value: "stable_fulfilling_career_not_top_priority" },
      { icon: <Scale />, text: "מחפש/ת איזון בין עבודה לחיים אישיים/משפחתיים", value: "work_life_balance_seeker" },
      { icon: <Heart />, text: "העיסוק פחות קריטי, כל עוד הוא/היא מאושר/ת ומסופק/ת", value: "occupation_less_critical_happiness_matters" },
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
      { icon: <PiggyBank />, text: "חסכנ/ית, מחושב/ת ומתכננ/ת לטווח ארוך", value: "frugal_planner_long_term" },
      { icon: <Scale />, text: "מאוזנ/ת - יודע/ת להנות מהכסף אך גם לנהל אותו באחריות", value: "balanced_enjoys_responsibly" },
      { icon: <Sparkles />, text: "נדיב/ה, אוהב/ת לחיות טוב ולהוציא על חוויות והנאות", value: "generous_enjoys_life_experiences" },
      { icon: <Info />, text: "פחות משנה לי הגישה, כל עוד יש הסכמה על ניהול משותף", value: "approach_less_important_than_joint_management" },
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
    min: 1, // פחות משפחתי/ת, יותר עצמאי/ת
    max: 10, // מאוד משפחתי/ת, קשר הדוק
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
    depth: "ADVANCED", // שאלה רגישה
    isRequired: true, // קריטי לסינון
    options: [
      { icon: <Heart />, text: "פתוח/ה לחלוטין ומקבל/ת באהבה", value: "fully_open_accepting" },
      { icon: <Scale />, text: "פתוח/ה לשקול, תלוי בנסיבות (גיל הילדים, טיב הקשר וכו')", value: "open_to_consider_depends_on_circumstances" },
      { icon: <Home />, text: "מעדיפ/ה להתחיל 'דף חדש' ללא ילדים קיימים, אך לא שולל/ת לחלוטין", value: "prefer_fresh_start_not_completely_ruling_out" },
      { icon: <Info />, text: "לא מעוניינ/ת בקשר עם בן/בת זוג שיש לו/לה ילדים", value: "not_interested_partner_with_children" },
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
    min: 1, // לא חשוב כלל
    max: 10, // חשוב מאוד
    labels: { min: "לא חשוב כלל", max: "חשוב מאוד" },
    metadata: { estimatedTime: 1, helpText: "אם יש העדפה ספציפית, תוכל/י לציין זאת בהמשך או בשיחה עם השדכן." },
  },

  // --- חלק 6: תכונות "אדומות" (Deal Breakers) והכרחיות (Must-Haves) ---
  {
    worldId: "PARTNER",
    id: "partner_deal_breakers_open_text",
    category: "partner",
    subcategory: "non_negotiables",
    question: "האם ישנן תכונות אופי, התנהגויות או הרגלים מסוימים שמהווים 'קו אדום' (Deal Breaker) מוחלט עבורך אצל בן/בת זוג? אם כן, פרט/י 1-2 דוגמאות עיקריות.",
    type: "openText",
    depth: "EXPERT", // שאלה קריטית
    isRequired: false, // לעודד כנות, אך לא להכריח
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
    depth: "EXPERT", // שאלה מסכמת ומזקקת
    isRequired: true,
    minLength: 10, // מילה או שתיים לפחות
    maxLength: 150,
    placeholder: "נסה/י לחשוב על הדבר האחד והיחיד שהוא הבסיס להכל עבורך...",
    metadata: { estimatedTime: 1 },
  },
];

// export default partnerQuestions; // כבר לא צריך אם מייבאים ישירות את המערך