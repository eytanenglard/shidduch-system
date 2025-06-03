// src/components/questionnaire/questions/religion/religionQuestions.tsx
import { Question } from "../../types/types";
import {
  Scroll,        // תעודה, זהות דתית, מסורת, לימוד (גם)
  BookOpen,      // לימוד תורה, השקפה, ספרים
  Users,         // קהילה, חברה, מניין
  Home,          // בית, אווירה דתית, משפחה
  Target,        // הלכה, קיום מצוות, מיקוד
  Scale,         // איזון, גישה להלכה, פלורליזם
  Heart,         // אמונה, רגש דתי, חיבור רוחני
  Sparkles,      // רוחניות, חוויה, התעלות
  ShieldCheck,   // הקפדה, כשרות, צניעות
  Flag,          // מדינה, ציונות
  HandHeart,     // חסד, נתינה (בהקשר דתי, מידות)
  Lightbulb,     // פתיחות מחשבתית, רעיונות חדשים
  Info,
  PocketKnife,   // צבא/שירות לאומי (בהקשר דתי)
} from "lucide-react";

export const religionQuestions: Question[] = [
  // --- חלק 1: זהות, אמונה והשקפה דתית ---
  {
    worldId: "RELIGION",
    id: "religion_self_definition_primary",
    category: "religion",
    subcategory: "identity_belief",
    question: "איזו הגדרה על הרצף הדתי-רוחני הכי משקפת את מי שאת/ה היום?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <Scroll />, text: "חרדי/ת (למשל: ליטאי, חסידי, ספרדי)", value: "charedi_various_streams" },
      { icon: <BookOpen />, text: "דתי/ה לאומי/ת - תורני/ת (למשל: חרד\"ל, ישיבתי)", value: "dati_leumi_torani_yeshivish" },
      { icon: <Sparkles />, text: "דתי/ה לאומי/ת - מרכז / פתוח/ה (למשל: דתי-לייט, ליברלי)", value: "dati_leumi_centrist_liberal" },
      { icon: <Heart />, text: "מסורתי/ת (למשל: שומר/ת מסורת, מחובר/ת לבית הכנסת)", value: "masorti_traditional_connected" },
      { icon: <Users />, text: "חילוני/ת עם זיקה למסורת וליהדות", value: "secular_with_tradition_connection" },
      { icon: <Lightbulb />, text: "רוחני/ת בדרכי (לאו דווקא במסגרת זרם מוגדר)", value: "spiritual_my_own_way" },
      { icon: <Info />, text: "אחר/ת או בתהליך גיבוש (ניתן לפרט בשאלה הבאה)", value: "other_or_forming_identity" },
    ],
    metadata: { estimatedTime: 1, helpText: "בחר/י את התיאור שהכי קרוב לליבך ולדרך חייך." },
  },
  {
    worldId: "RELIGION",
    id: "religion_identity_elaboration_personal",
    category: "religion",
    subcategory: "identity_belief",
    question: "בהמשך להגדרתך, ספר/י בקצרה מה המשמעות המעשית של זהותך הדתית/רוחנית עבורך בחיי היומיום.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder: "לדוגמה: אילו מנהגים חשובים לך? איך זה משפיע על קבלת החלטות? מה מקור ההשראה שלך?",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_faith_core_principles",
    category: "religion",
    subcategory: "identity_belief",
    question: "מהם עקרונות האמונה המרכזיים שמנחים אותך? (בחר/י 1-3)",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { icon: <Heart />, text: "אמונה בקב\"ה ובבחירת עם ישראל", value: "belief_in_god_chosen_people" },
      { icon: <Scroll />, text: "תורה מן השמיים ומחויבות להלכה", value: "torah_from_heaven_halacha_commitment" },
      { icon: <Sparkles />, text: "חיפוש מתמיד אחר משמעות וחיבור רוחני", value: "seeking_meaning_spiritual_connection" },
      { icon: <HandHeart />, text: "תיקון עולם, צדק חברתי וחסד", value: "tikkun_olam_social_justice_kindness" },
      { icon: <Flag />, text: "גאולת ישראל וקיבוץ גלויות בארץ ישראל", value: "redemption_israel_ingathering_exiles" },
      { icon: <Users />, text: "ערבות הדדית ואחדות עם ישראל", value: "mutual_responsibility_jewish_unity" },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_rabbinic_guidance_role",
    category: "religion",
    subcategory: "identity_belief",
    question: "מהי החשיבות של דמות רבנית או הנהגה רוחנית אישית עבורך? (1=לא משמעותי, 10=משמעותי מאוד)",
    type: "scale",
    depth: "BASIC",
    isRequired: false, // לא לכולם יש דמות ספציפית
    min: 1,
    max: 10,
    labels: { min: "לא משמעותי", max: "משמעותי מאוד" },
    metadata: { estimatedTime: 1, helpText: "האם את/ה נוהג/ת להתייעץ בשאלות הלכה, הנהגה או החלטות אישיות?" },
  },

  // --- חלק 2: שמירת מצוות והלכה מעשית ---
  {
    worldId: "RELIGION",
    id: "religion_shabbat_observance_level_practical",
    category: "religion",
    subcategory: "practical_observance",
    question: "איזו רמה של שמירת שבת מאפיינת את ביתך ואת התנהלותך האישית?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <ShieldCheck />, text: "הקפדה מלאה על כל ההלכות ודקדוקיהן", value: "full_strict_observance_shabbat" },
      { icon: <Target />, text: "שמירה על עיקרי ההלכות (ללא חשמל, בישול, נסיעה)", value: "main_halachic_observance_shabbat" },
      { icon: <Scale />, text: "שמירה על אווירת השבת (קידוש, סעודות, תפילה) עם גמישות מסוימת בהלכות", value: "shabbat_atmosphere_some_flexibility" },
      { icon: <Home />, text: "שמירת שבת בעיקר בבית ובמשפחה, פחות במרחב הציבורי", value: "shabbat_mainly_at_home_family" },
      { icon: <Info />, text: "אינני שומר/ת שבת באופן הלכתי", value: "not_halachically_observant_shabbat" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_kashrut_observance_details",
    category: "religion",
    subcategory: "practical_observance",
    question: "פרט/י את רמת הקפדתך על כשרות: סוג הכשר, הקפדה על כלים, אכילה בחוץ, בישולי גויים וכו'.",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder: "לדוגמה: 'מקפיד/ה על מהדרין, כלים נפרדים, אוכל/ת רק בחוץ עם תעודה מהודרת, לא אוכל/ת בישולי גויים'.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_daily_prayer_practice",
    category: "religion",
    subcategory: "practical_observance",
    question: "כיצד נראית שגרת התפילה היומית שלך (שחרית, מנחה, ערבית, במניין/ביחידות)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 0,
    maxLength: 300,
    placeholder: "לדוגמה: '3 תפילות במניין קבוע', 'שחרית וערבית ביחידות, מנחה במניין בעבודה', 'מתפלל/ת כשמתאפשר'.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_modesty_personal_approach",
    category: "religion",
    subcategory: "practical_observance",
    question: "מהי גישתך האישית לצניעות (לבוש, דיבור, התנהגות בין המינים) וכיצד היא מתבטאת?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // נושא חשוב להתאמה
    minLength: 40,
    maxLength: 400,
    placeholder: "לדוגמה: כיסוי ראש (סוג), לבוש (אורך שרוול/חצאית), שמירת נגיעה, סגנון דיבור.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_family_purity_observance",
    category: "religion",
    subcategory: "practical_observance",
    question: "מהי גישתך ורמת הקפדתך על הלכות טהרת המשפחה?",
    type: "iconChoice", // ניתן גם להפוך ל-openText לרגישות
    depth: "ADVANCED",
    isRequired: true, // קריטי לזוגיות דתית
    options: [
      { icon: <ShieldCheck />, text: "הקפדה מלאה על כל ההלכות והחומרות המקובלות", value: "full_observance_chumrot_family_purity" },
      { icon: <Target />, text: "הקפדה על עיקרי ההלכות כפי שמקובל בקהילתי", value: "main_observance_community_standard_family_purity" },
      { icon: <Scale />, text: "שואפ/ת לשמור, עם רצון ללמוד ולהתחזק בנושא", value: "aspire_to_observe_learn_family_purity" },
      { icon: <Info />, text: "הנושא אינו רלוונטי לי / דורש דיון מעמיק יותר", value: "not_relevant_or_requires_discussion_family_purity" },
    ],
    metadata: { estimatedTime: 1, helpText: "זו שאלה רגישה וחשובה. אנא ענה/י בכנות." },
  },

  // --- חלק 3: קהילה, חברה והשפעות חיצוניות ---
  {
    worldId: "RELIGION",
    id: "religion_community_involvement_nature",
    category: "religion",
    subcategory: "community_influence",
    question: "באיזו מידה וכיצד את/ה מעורב/ת בקהילה הדתית שלך (שיעורים, אירועים, תפקידים, התנדבות)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 0,
    maxLength: 400,
    placeholder: "ספר/י על הפעילויות והקשרים שלך במסגרת הקהילה.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_social_circle_religious_diversity",
    category: "religion",
    subcategory: "community_influence",
    question: "עד כמה המעגל החברתי הקרוב שלך מגוון מבחינה דתית?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Users />, text: "רובו ככולו מורכב מאנשים ברמה דתית דומה לשלי", value: "mostly_similar_religious_level_social_circle" },
      { icon: <Scale />, text: "יש לי חברים ממגוון רמות דתיות והשקפות", value: "diverse_religious_levels_social_circle" },
      { icon: <Home />, text: "המעגל החברתי שלי מצומצם יחסית ופחות מוגדר דתית", value: "small_less_religiously_defined_social_circle" },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_attitude_towards_secular_world_engagement",
    category: "religion",
    subcategory: "community_influence",
    question: "מהי גישתך לשילוב והתמודדות עם העולם החילוני והתרבות הכללית (לימודים, עבודה, מדיה, בילויים)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 40,
    maxLength: 400,
    placeholder: "לדוגמה: חיים בתוך 'בועה' מוגנת, שילוב תוך סינון, פתיחות מלאה, השפעה הדדית...",
    metadata: { estimatedTime: 1 },
  },
 {
    worldId: "RELIGION",
    id: "religion_state_and_army_service_view",
    category: "religion",
    subcategory: "community_influence",
    question: "מהי עמדתך לגבי שירות בצבא/שירות לאומי, והיחס הכללי למדינת ישראל ומוסדותיה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 0,
    maxLength: 400,
    placeholder: "לדוגמה: חשיבות השירות, סוג השירות המועדף, יחס למדינה כ'אתחלתא דגאולה', וכו'.",
    // --- התיקון כאן ---
    icon: <PocketKnife />, // האייקון מוגדר ברמת השאלה
    metadata: { estimatedTime: 1 }, // metadata מכיל רק את המאפיינים המותרים לו
    // --- סוף התיקון ---
  },

  // --- חלק 4: התאמה דתית בזוגיות וחינוך ילדים ---
  {
    worldId: "RELIGION",
    id: "religion_partner_ideal_religious_profile",
    category: "religion",
    subcategory: "relationship_family",
    question: "תאר/י את הפרופיל הדתי-רוחני האידיאלי של בן/בת הזוג שאת/ה מחפש/ת (רמת דתיות, השקפה, הקפדה על מצוות).",
    type: "openText",
    depth: "BASIC", // קריטי לשדכן
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder: "נסה/י להיות כמה שיותר ספציפי/ת. מהם הדברים החשובים לך ביותר בהקשר זה?",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_flexibility_religious_differences_partner",
    category: "religion",
    subcategory: "relationship_family",
    question: "עד כמה את/ה גמיש/ה ומוכנ/ה לפשרות אם יהיו פערים מסוימים ברמה הדתית או בגישה ההלכתית בינך לבין בן/בת הזוג?",
    type: "scale",
    depth: "ADVANCED",
    isRequired: true,
    min: 1, // כלל לא גמיש/ה
    max: 10, // מאוד גמיש/ה ומוכנ/ה לפשרות
    labels: { min: "כלל לא גמיש/ה", max: "מאוד גמיש/ה" },
    metadata: { estimatedTime: 1, helpText: "חשוב/י על תחומים שבהם תוכל/י להתגמש יותר או פחות." },
  },
  {
    worldId: "RELIGION",
    id: "religion_children_education_religious_vision",
    category: "religion",
    subcategory: "relationship_family",
    question: "איזה סוג של בית וחינוך דתי/תורני היית רוצה להעניק לילדיך, ומהן הציפיות שלך מבן/בת הזוג בהקשר זה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב למי שרואה ילדים בעתיד
    minLength: 50,
    maxLength: 500,
    placeholder: "לדוגמה: סוג מוסדות חינוך, אווירה דתית בבית, דגש על ערכים ספציפיים, מעורבות הורית בלימוד.",
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "RELIGION",
    id: "religion_joint_spiritual_growth_expectations",
    category: "religion",
    subcategory: "relationship_family",
    question: "מהן ציפיותיך מבן/בת הזוג בנוגע לצמיחה רוחנית והתפתחות דתית משותפת (למשל, לימוד משותף, שיח רוחני, קיום מצוות יחד)?",
    type: "openText",
    depth: "EXPERT",
    isRequired: false,
    minLength: 0,
    maxLength: 400,
    placeholder: "האם חשוב לך להתפתח יחד? האם יש פעילויות ספציפיות שהיית רוצה לעשות כזוג?",
    metadata: { estimatedTime: 1 },
  },
  // --- חלק 5: סיכום ומבט אישי ---
  {
    worldId: "RELIGION",
    id: "religion_most_meaningful_mitzvah_or_practice",
    category: "religion",
    subcategory: "personal_reflection",
    question: "מהי המצווה או המנהג הדתי/רוחני שהכי משמעותי עבורך באופן אישי, ומדוע?",
    type: "openText",
    depth: "EXPERT",
    isRequired: false,
    minLength: 30,
    maxLength: 300,
    placeholder: "שתפ/י משהו שנוגע לליבך ומבטא את החיבור האישי שלך.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "RELIGION",
    id: "religion_final_thoughts_or_clarifications",
    category: "religion",
    subcategory: "personal_reflection",
    question: "האם יש משהו נוסף שחשוב לך להבהיר או להוסיף לגבי עולמך הדתי, אמונותיך, או ציפיותיך הדתיות מבן/בת זוג, שלא נשאלת עליו?",
    type: "openText",
    depth: "EXPERT",
    isRequired: false,
    minLength: 0,
    maxLength: 400,
    placeholder: "זה המקום להוסיף כל פרט או הבהרה שמרגישים לך חשובים.",
    metadata: { estimatedTime: 1 },
  },
];

// export default religionQuestions; // כבר לא צריך אם מייבאים ישירות את המערך