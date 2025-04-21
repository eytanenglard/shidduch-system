// src/components/questionnaire/questions/personality/personalityQuestions.ts
import { Question } from "../../types/types";
import {
  Sun,
  Moon,
  Cloud,
  Compass,
  Leaf,
  Target,
  Heart,
  Star,
  Users,
  Book,
  Coffee,
  Music,
  Bike,
  PenTool,
  Globe,
  Watch,
  MessageCircle,
  HandHeart,
  Lightbulb,
  Brain,
  Home,
  Edit,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Scale,
  Award,
  CheckCheck,
  Smile,
} from "lucide-react";

export const personalityQuestions: Question[] = [
  // --- תפיסה עצמית בסיסית ---
  {
    worldId: "PERSONALITY",
    id: "personality_description_revised", // שינוי ID מהקודם personality_description
    category: "personality",
    subcategory: "self_perception",
    question:
      "ספר/י על עצמך בכמה משפטים. מהם הדברים המרכזיים שחשוב לך שאנשים ידעו עליך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "מה מאפיין אותך? מה חשוב לך? במה את/ה גאה? נשמח לשמוע...",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "PERSONALITY",
    id: "personality_type",
    category: "personality",
    subcategory: "self_perception",
    question: "איך היית מגדיר/ה את האישיות שלך בצורה הכי מדוייקת?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Sun />,
        text: "אנרגטי/ת ופתוח/ה",
        value: "energetic",
        description: "אוהב/ת להיות במרכז העניינים ולהכיר אנשים חדשים",
      },
      {
        icon: <Moon />,
        text: "שקט/ה ומופנם/ת",
        value: "quiet",
        description: "מעדיף/ה מפגשים אינטימיים ושקט",
      },
      {
        icon: <Cloud />,
        text: "זורם/ת ומסתגל/ת",
        value: "adaptable",
        description: "גמיש/ה ומסתגל/ת בקלות למצבים חדשים",
      },
      {
        icon: <Compass />,
        text: "מוכוון/ת מטרה",
        value: "focused",
        description: "ממוקד/ת במטרות וביעדים",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "optimism_level", // שאלה חדשה
    category: "personality",
    subcategory: "self_perception",
    question:
      "על סולם של 1 (פסימיסט/ית) עד 10 (אופטימיסט/ית), איך היית מגדיר/ה את הגישה הכללית שלך לחיים?",
    type: "scale",
    depth: "BASIC",
    isRequired: false, // ניתן להפוך לחובה אם רוצים
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },

  // --- סגנון חיים והרגלים ---
  {
    worldId: "PERSONALITY",
    id: "daily_routine",
    category: "personality",
    subcategory: "lifestyle",
    question: "איך את/ה מעדיף/ה לנהל את היום-יום?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Watch />,
        text: "שגרה מתוכננת",
        value: "structured",
        description: "לוח זמנים קבוע ומאורגן",
      },
      {
        icon: <Cloud />,
        text: "זרימה גמישה",
        value: "flexible",
        description: "התאמה לפי הצורך והמצב",
      },
      {
        icon: <Target />,
        text: "מוכוון משימות",
        value: "task_oriented",
        description: "התקדמות לפי יעדים",
      },
      {
        icon: <Sun />,
        text: "ספונטני ומשתנה",
        value: "spontaneous",
        description: "כל יום שונה ומפתיע",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "home_environment",
    category: "personality",
    subcategory: "lifestyle",
    question: "איך את/ה אוהב/ת את סביבת המגורים שלך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Leaf />,
        text: "טבעי ומרגיע",
        value: "natural",
        description: "צמחים, אור טבעי ואווירה רגועה",
      },
      {
        icon: <Target />,
        text: "מינימליסטי ומסודר",
        value: "minimal",
        description: "נקי, מאורגן ופונקציונלי",
      },
      {
        icon: <Heart />,
        text: "חמים וביתי",
        value: "cozy",
        description: "נעים, מזמין ונוח",
      },
      {
        icon: <Star />,
        text: "מודרני ועיצובי",
        value: "modern",
        description: "סטייל עכשווי ואלמנטים עיצוביים",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "organization_approach",
    category: "personality",
    subcategory: "lifestyle",
    question: "איך את/ה מתייחס/ת לארגון וסדר?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      {
        icon: <Target />,
        text: "מסודר/ת ומאורגן/ת",
        value: "organized",
        description: "הכל במקום ומתוכנן",
      },
      {
        icon: <Cloud />,
        text: "גמיש/ה ומסתגל/ת",
        value: "flexible",
        description: "סדר עם גמישות",
      },
      {
        icon: <Star />,
        text: "יצירתי/ת ומשתנה",
        value: "creative",
        description: "סדר בתוך הכאוס",
      },
      {
        icon: <Heart />,
        text: "זורם/ת עם מה שיש",
        value: "flow",
        description: "פחות מתעסק/ת בארגון",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "free_time_activities",
    category: "personality",
    subcategory: "lifestyle",
    question: "מה את/ה הכי אוהב/ת לעשות בזמן הפנוי? (בחר/י עד 3)",
    type: "multiSelectWithOther", // נשאר עם אפשרות לאחר
    depth: "BASIC",
    isRequired: false, // לא חובה קריטי
    options: [
      { icon: <Book />, text: "קריאה ולמידה", value: "reading" },
      { icon: <Bike />, text: "ספורט ופעילות גופנית", value: "sports" },
      { icon: <PenTool />, text: "יצירה ואומנות", value: "art" },
      { icon: <Music />, text: "מוזיקה ובידור", value: "music" },
      { icon: <Leaf />, text: "טבע וגינון", value: "nature" }, // שינוי אייקון
      { icon: <Globe />, text: "טיולים ונסיעות", value: "travel" },
      { icon: <Users />, text: "בילוי חברתי", value: "social_activities" }, // הפרדה מ'סביבה חברתית'
      { icon: <Home />, text: "זמן רגוע בבית", value: "home_relax" }, // אפשרות נוספת
      // האפשרות 'אחר' מטופלת אוטומטית על ידי הקומפוננטה multiSelectWithOther
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: "PERSONALITY",
    id: "perfect_morning_detail",
    category: "personality",
    subcategory: "lifestyle",
    question:
      "תאר/י את הבוקר המושלם שלך - משעת הקימה ועד הצהריים. מה כולל בוקר כזה ולמה דווקא הפעילויות האלו משמחות אותך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "תאר/י את סדר היום, הפעילויות והתחושות שעולות בך...",
    metadata: { estimatedTime: 3 },
  },

  // --- אינטראקציות חברתיות ותקשורת ---
  {
    worldId: "PERSONALITY",
    id: "social_settings",
    category: "personality",
    subcategory: "social_communication",
    question: "באיזו סביבה חברתית את/ה מרגיש/ה הכי בנוח?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Users />,
        text: "אירועים גדולים ותוססים",
        value: "large_events",
        description: "מסיבות, חתונות, התקהלויות גדולות",
      },
      {
        icon: <Coffee />,
        text: "מפגשים קטנים ואינטימיים",
        value: "small_gatherings",
        description: "שיחה עם חברים קרובים, קבוצה קטנה",
      },
      {
        icon: <Home />,
        text: "אחד על אחד",
        value: "one_on_one",
        description: "שיחה עמוקה עם אדם אחד",
      },
      {
        icon: <Book />,
        text: "מעדיף/ה להיות לבד",
        value: "alone_preference",
        description: "טעינת מצברים בשקט ובפרטיות",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "communication_style_personal", // שינוי ID וניסוח
    category: "personality",
    subcategory: "social_communication",
    question: "איזה סגנון תקשורת מאפיין אותך הכי טוב?",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      { icon: <MessageCircle />, text: "ישיר/ה וענייני/ת", value: "direct" },
      { icon: <HandHeart />, text: "רגיש/ה ומתחשב/ת", value: "sensitive" },
      { icon: <Lightbulb />, text: "יצירתי/ת ובעל/ת דמיון", value: "creative" },
      { icon: <Brain />, text: "שקול/ה ואנליטי/ת", value: "analytical" },
      { icon: <Smile />, text: "הומוריסטי/ת וקליל/ה", value: "humorous" },
      { icon: <Book />, text: "נוטה להקשיב יותר מלדבר", value: "listener" },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "expressing_love_language_personal", // שאלה חדשה
    category: "personality",
    subcategory: "social_communication",
    question:
      "איך את/ה בדרך כלל מביע/ה אהבה וחיבה לאנשים הקרובים אליך? (בחר/י 1-2 דרכים עיקריות)",
    type: "multiSelect",
    depth: "ADVANCED",
    isRequired: true, // חשוב להבנת האישיות
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
      helpText:
        "חשוב/י איך את/ה נוטה *להראות* אכפתיות, לא רק איך את/ה אוהב/ת לקבל.",
    },
  },
  {
    worldId: "PERSONALITY",
    id: "dinner_with_historical_figures",
    category: "personality",
    subcategory: "social_communication", // קשור גם לתחומי עניין
    question:
      "אם היית יכול/ה לארח לארוחת ערב שלושה אנשים מכל התקופות (חיים או היסטוריים), את מי היית מזמין/ה ומה היית רוצה ללמוד מהם?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 100,
    maxLength: 1000,
    placeholder: "ספר/י על האורחים שבחרת ומה היית רוצה לשוחח איתם...",
    metadata: { estimatedTime: 4 },
  },

  // --- נוף רגשי והתמודדות ---
  {
    worldId: "PERSONALITY",
    id: "stress_relief",
    category: "personality",
    subcategory: "emotional_landscape",
    question: "מה עוזר לך להירגע ולהתמודד במצבי לחץ?",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true, // חשוב להבנת דרכי התמודדות
    options: [
      { icon: <Music />, text: "מוזיקה או אומנות", value: "arts" },
      { icon: <Users />, text: "שיחה עם חברים/משפחה", value: "social_support" },
      { icon: <Bike />, text: "פעילות גופנית", value: "exercise" },
      {
        icon: <Book />,
        text: "זמן שקט לבד (קריאה, מדיטציה)",
        value: "alone_time",
      },
      { icon: <Leaf />, text: "בילוי בטבע", value: "nature_relief" }, // אפשרות נוספת
      { icon: <Edit />, text: "כתיבה או יצירה", value: "writing_creating" }, // אפשרות נוספת
      {
        icon: <Coffee />,
        text: "פינוק קטן (אוכל, שתיה)",
        value: "small_treats",
      }, // אפשרות נוספת
    ],
    minSelections: 1,
    maxSelections: 3, // אפשר יותר אפשרויות כאן
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "risk_taking", // שאלה חדשה
    category: "personality",
    subcategory: "emotional_landscape",
    question:
      "על סולם של 1 (שונא/ת סיכונים) עד 10 (אוהב/ת סיכונים והרפתקאות), איפה היית ממקם/ת את עצמך?",
    type: "scale",
    depth: "BASIC",
    isRequired: false,
    min: 1,
    max: 10,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "change_adaptation", // שאלה חדשה
    category: "personality",
    subcategory: "emotional_landscape",
    question: "איך את/ה בדרך כלל מגיב/ה לשינויים גדולים ובלתי צפויים בחיים?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      { icon: <Star />, text: "מתרגש/ת מההזדמנות החדשה", value: "excited" },
      {
        icon: <Cloud />,
        text: "מסתגל/ת בהדרגה ובזהירות",
        value: "adapt_gradually",
      },
      {
        icon: <AlertTriangle />,
        text: "מרגיש/ה לחץ ודאגה בהתחלה",
        value: "stressed_initially",
      },
      {
        icon: <Compass />,
        text: "מקבל/ת ברוגע ומתכנן/ת את הצעדים הבאים",
        value: "calm_planner",
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: "PERSONALITY",
    id: "happiness_definition",
    category: "personality",
    subcategory: "emotional_landscape",
    question: "מה משמעותו של אושר עבורך? מתי את/ה מרגיש/ה הכי מאושר/ת?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "שתף/י את תפיסתך לגבי משמעות האושר ומה גורם לך להרגיש כך...",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "PERSONALITY",
    id: "conflict_resolution_personal", // שינוי ID מהקודם conflict_resolution
    category: "personality",
    subcategory: "emotional_landscape", // קשור גם לתקשורת
    question:
      "איך את/ה בדרך כלל מתמודד/ת עם מחלוקות או קונפליקטים במערכות יחסים (עם חברים, משפחה, עמיתים)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder:
      "תאר/י את הגישה שלך: האם את/ה ישיר/ה? נמנע/ת? מנסה לגשר? מחפש/ת פתרון?...",
    metadata: { estimatedTime: 4 },
  },

  // --- צמיחה, ערכים ושאיפות ---
  {
    worldId: "PERSONALITY",
    id: "life_values",
    category: "personality",
    subcategory: "growth_aspirations",
    question:
      "מהם שלושת הערכים החשובים ביותר בחייך ואיך הם באים לידי ביטוי ביומיום?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "תאר/י את הערכים שמנחים אותך והדוגמאות מחייך...",
    metadata: { estimatedTime: 5 },
  },
  {
    worldId: "PERSONALITY",
    id: "strengths_description", // שאלה חדשה
    category: "personality",
    subcategory: "growth_aspirations",
    question: "מהן לדעתך 3 החוזקות הבולטות ביותר שלך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false, // יכול להיות קשה לחלק
    minLength: 30,
    maxLength: 400,
    placeholder:
      "לדוגמה: אמפתיה, יכולת ארגון, יצירתיות, אופטימיות, חוש הומור...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PERSONALITY",
    id: "growth_areas_optional", // שאלה חדשה
    category: "personality",
    subcategory: "growth_aspirations",
    question: "(אופציונלי) באילו תחומים היית רוצה להתפתח או להשתפר?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 0, // לא חובה
    maxLength: 400,
    placeholder:
      "לדוגמה: להיות סבלני/ת יותר, לשפר ביטחון עצמי, ללמוד משהו חדש...",
    metadata: { estimatedTime: 3 },
  },
  {
    worldId: "PERSONALITY",
    id: "relationship_lessons",
    category: "personality",
    subcategory: "growth_aspirations",
    question:
      "מה למדת על עצמך ממערכות היחסים המשמעותיות בחייך (לאו דווקא זוגיות)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב לצמיחה
    minLength: 100,
    maxLength: 800,
    placeholder: "שתף/י תובנות ולקחים ממערכות יחסים עם חברים, משפחה, קולגות...",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "PERSONALITY",
    id: "life_challenges",
    category: "personality",
    subcategory: "growth_aspirations",
    question: "מהו האתגר המשמעותי ביותר שהתגברת עליו ומה למדת ממנו על עצמך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב להבנת עמידות
    minLength: 100,
    maxLength: 1000,
    placeholder: "שתף/י את סיפור ההתמודדות, מה עזר לך ומה גילית על כוחותיך...",
    metadata: { estimatedTime: 5 },
  },
  {
    worldId: "PERSONALITY",
    id: "life_mission",
    category: "personality",
    subcategory: "growth_aspirations",
    question:
      "מהי השליחות או המטרה שאת/ה מרגיש/ה שיש לך בחיים כיום (גם אם זה לא משהו גרנדיוזי)?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 50, // הקטנת מינימום
    maxLength: 800,
    placeholder:
      "מה מניע אותך? מה נותן לך משמעות? מה היית רוצה להשיג או לתרום?...",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "PERSONALITY",
    id: "future_self",
    category: "personality",
    subcategory: "growth_aspirations",
    question:
      "איך את/ה רואה את עצמך בעוד עשר שנים? מה השתנה ומה נשאר דומה מבחינת אישיות, עיסוקים וסגנון חיים?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 100,
    maxLength: 800,
    placeholder:
      "תאר/י את החזון העתידי שלך - לא רק מה תעשה/י, אלא מי תהיה/י...",
    metadata: { estimatedTime: 4 },
  },
  {
    worldId: "PERSONALITY",
    id: "family_traditions",
    category: "personality",
    subcategory: "growth_aspirations", // קשור גם לערכים וזהות
    question: "אילו מסורות משפחתיות (או חברתיות) חשובות לך במיוחד ולמה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true, // חשוב להבנת הזהות
    minLength: 50, // אפשר גם קצר
    maxLength: 800,
    placeholder:
      "ספר/י על מסורות שעוברות במשפחה, טקסים אישיים, מנהגים שאימצת...",
    metadata: { estimatedTime: 3 },
  },
];

// אין צורך לייצא ברירת מחדל
