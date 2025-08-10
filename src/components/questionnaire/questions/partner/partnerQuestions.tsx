// src/components/questionnaire/questions/partner/partnerQuestions.tsx
import { Question } from '../../types/types';
import {
  Heart,
  Brain,
  Smile,
  ShieldCheck,
  Star,
  Users,
  Home,
  Target,
  Scale,
  BookOpen,
  Scroll,
  Activity,
  Coffee,
  Eye,
  Car,
  Flag,
  Globe,
  HandHeart,
  Lightbulb,
  Briefcase,
  PiggyBank,
  Info,
  Sparkles,
  Palette,
  MessageCircle,
  TrendingUp,
  Building2,
  Mountain,
  TreePine,
  MapPin,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export const partnerQuestions: Question[] = [
  // --- חלק 1: המפגש הראשוני - משיכה וכימיה ---
  {
    worldId: 'PARTNER',
    id: 'partner_initial_impression_priorities_revised',
    category: 'partner',
    subcategory: 'first_impression_basics',
    question:
      "בדייט ראשון, אחרי חמש הדקות הראשונות, מהם ה'סימנים' שיגרמו לך לחשוב בלב 'וואו, יש פה משהו מעניין'? (בחר/י עד 3)",
    type: 'multiSelect',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Eye />,
        text: 'מראה חיצוני מטופח וסגנון אישי',
        value: 'מראה וסגנון',
      },
      {
        icon: <Smile />,
        text: 'חיוך חם, אנרגיה נעימה ונינוחות',
        value: 'חיוך ואנרגיה',
      },
      {
        icon: <MessageCircle />,
        text: 'שיחה קולחת, כימיה ותחומי עניין משותפים',
        value: 'כימיה בשיחה',
      },
      {
        icon: <Brain />,
        text: 'שנינות, חוש הומור או עומק מחשבה',
        value: 'שנינות ועומק',
      },
      {
        icon: <ShieldCheck />,
        text: 'תחושת ביטחון, בגרות ורצינות שהוא/היא משדר/ת',
        value: 'תחושת ביטחון',
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_appearance_importance_scale_revised',
    category: 'partner',
    subcategory: 'first_impression_basics',
    question:
      'בכנות, עד כמה למראה חיצוני יש תפקיד ביצירת "הקליק" הראשוני עבורך?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: 'האופי הוא העיקר', max: 'קריטי למשיכה' },
    metadata: {
      estimatedTime: 1,
      helpText: 'משיכה היא דבר חשוב. כנות כאן תסייע לנו למקד את החיפוש עבורך.',
    },
  },

  // --- חלק 2: לב האישיות - תכונות וערכים ---
  {
    worldId: 'PARTNER',
    id: 'partner_intelligence_types', // שאלה חדשה
    category: 'partner',
    subcategory: 'first_impression_basics',
    question:
      "כשאת/ה חושב/ת על 'אינטליגנציה' אצל בן/בת זוג, מה הכי חשוב לך? חלק/י 100 נקודות בין הסוגים הבאים:",
    type: 'budgetAllocation',
    depth: 'ADVANCED',
    isRequired: false,
    totalPoints: 100,
    categories: [
      { label: 'רגשית (אמפתיה, מודעות)', icon: <Heart /> },
      { label: 'אנליטית (היגיון, ניתוח)', icon: <Brain /> },
      { label: 'חוכמת חיים ("שכל ישר")', icon: <Sparkles /> },
      { label: 'יצירתית (הומור, מקוריות)', icon: <Lightbulb /> },
      { label: 'רוחנית/תורנית (עומק בלימוד)', icon: <BookOpen /> },
    ],
    metadata: {
      estimatedTime: 3,
      helpText:
        "השאלה הזו עוזרת לנו להבין איזה סוג של 'חכמה' את/ה הכי מעריך/ה.",
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_core_character_traits_essential_revised',
    category: 'partner',
    subcategory: 'first_impression_basics',
    question:
      "מהן 'אבני היסוד' של האישיות שאת/ה מחפש/ת? חלק/י 100 'נקודות התאמה' בין תכונות האופי החיוניות לך ביותר.",
    type: 'budgetAllocation',
    depth: 'BASIC',
    isRequired: true,
    totalPoints: 100,
    categories: [
      { label: 'יושרה, אמינות וכנות', icon: <ShieldCheck /> },
      { label: 'חום, אמפתיה וטוב לב', icon: <Heart /> },
      { label: 'אופטימיות ושמחת חיים', icon: <Smile /> },
      { label: 'בגרות, יציבות ואחריות', icon: <Target /> },
      { label: 'שאפתנות ומוטיבציה לצמיחה', icon: <Star /> },
      { label: 'תקשורת טובה והקשבה', icon: <HandHeart /> },
    ],
    metadata: {
      estimatedTime: 3,
      helpText: 'התמקד/י בתכונות שהן הבסיס ההכרחי עבורך לקשר בריא ומאושר.',
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_completion_trait', // שאלה חדשה
    category: 'partner',
    subcategory: 'first_impression_basics',
    question:
      'איזו תכונה או יכולת שפחות חזקה אצלך, היית הכי שמח/ה למצוא אצל בן/בת הזוג כדי שתשלימו זה את זו?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 20,
    maxLength: 300,
    placeholder:
      "לדוגמה: 'אני פחות ספונטני, אז הייתי שמח למישהי שתכניס קצת הרפתקנות לחיים', או 'אני מאוד רגשנית והייתי רוצה מישהו יותר קרקעי'...",
    metadata: {
      estimatedTime: 2,
      helpText:
        'השאלה הזו מעידה על מודעות עצמית ועל חיפוש שותפות של השלמה, לא של שיבוט.',
    },
  },

  // --- חלק 3: סגנון חיים ויומיום ---
  {
    worldId: 'PARTNER',
    id: 'partner_lifestyle_pace_preference_revised',
    category: 'partner',
    subcategory: 'lifestyle_social',
    question: 'איזה "קצב פנימי" היית רוצה שיהיה לבן/בת הזוג שלך ביומיום?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Activity />,
        text: 'דינמי ופעיל, אוהב/ת עשייה והספקים.',
        value: 'דינמי ופעיל',
      },
      {
        icon: <Home />,
        text: 'רגוע ושליו, מעריך/ה שגרה ורוגע.',
        value: 'רגוע ושליו',
      },
      {
        icon: <Scale />,
        text: 'מאוזן, יודע/ת לשלב בין עשייה למנוחה.',
        value: 'מאוזן',
      },
      {
        icon: <Sparkles />,
        text: 'הרפתקני וספונטני, אוהב/ת שינויים וחוויות.',
        value: 'הרפתקני וספונטני',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_financial_habits_scale', // שאלה חדשה
    category: 'partner',
    subcategory: 'career_finance_education',
    question:
      'על סולם של 1 (מאוד חסכן וזהיר) עד 10 (מאוד נהנה מהחיים ונדיב), איזה סגנון של התנהלות כלכלית אישית היית מעדיף/ה לראות אצל בן/בת הזוג?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: 'חסכן וזהיר', max: 'נהנה ונדיב' },
    metadata: {
      estimatedTime: 1,
      helpText: 'השאלה לא בודקת כמה כסף יש, אלא את הגישה וההתנהלות היומיומית.',
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_career_ambition_preference_revised',
    category: 'partner',
    subcategory: 'career_finance_education',
    question: 'מהי גישתך האידיאלית לקריירה ושאיפות מקצועיות של בן/בת הזוג?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <Star />,
        text: 'חשוב לי שיהיה/תהיה שאפתן/ית עם מטרות ברורות.',
        value: 'שאפתנות ומיקוד',
      },
      {
        icon: <Scale />,
        text: 'הכי חשוב לי שיהיה איזון בריא בין עבודה לחיים אישיים.',
        value: 'איזון עבודה-חיים',
      },
      {
        icon: <Heart />,
        text: 'העיסוק פחות קריטי, כל עוד הוא/היא מאושר/ת ומסופק/ת.',
        value: 'סיפוק אישי',
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 4: הגדרת הגבולות - מה לא ומה כן ---
  {
    worldId: 'PARTNER',
    id: 'partner_deal_breakers_open_text_revised',
    category: 'partner',
    subcategory: 'non_negotiables',
    question:
      "בזוגיות חשוב לדעת על מה אפשר להתפשר ועל מה לא. מהו ה'קו האדום' האחד או שניים, שאת/ה יודע/ת בוודאות שלא תוכל/י לחיות איתו/איתה בשלום לאורך זמן?",
    type: 'openText',
    depth: 'EXPERT',
    isRequired: true,
    minLength: 30,
    maxLength: 300,
    placeholder:
      'לדוגמה: חוסר כנות, קמצנות, חוסר כבוד, התמכרות, פער רוחני גדול...',
    metadata: {
      estimatedTime: 2,
      helpText:
        'הצבת גבולות היא מעשה של בגרות. הכנות כאן חוסכת עוגמת נפש רבה לשני הצדדים.',
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_red_flag_vs_quirk', // שאלה חדשה
    category: 'partner',
    subcategory: 'non_negotiables',
    question:
      "מה ההבדל בעיניך בין 'דגל אדום' שמסמן בעיה אמיתית, לבין 'מוזרות חביבה' (Quirk) שאפשר לחיות איתה באהבה? תן/י דוגמה קצרה.",
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder:
      "לדוגמה: 'דגל אדום זה חוסר כבוד למלצר. מוזרות חביבה זה שהוא חייב לסדר את הספרים לפי צבעים'.",
    metadata: {
      estimatedTime: 2,
      helpText:
        'השאלה הזו בודקת בגרות, גמישות מחשבתית ויכולת להכיל מורכבות אנושית.',
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_in_laws_conflict', // שאלה חדשה
    category: 'partner',
    subcategory: 'family_background',
    question:
      'דמיין/י שאת/ה חולק/ת על דעתם של ההורים של בן/בת הזוג בנושא מהותי. כיצד היית מצפה שבן/בת הזוג ינהג/ו?',
    type: 'iconChoice',
    depth: 'EXPERT',
    isRequired: false,
    options: [
      {
        icon: <ShieldCheck />,
        text: 'שיתמוך/תתמוך בעמדתי באופן מלא, גם מולם.',
        value: 'נאמנות לזוגיות',
      },
      {
        icon: <Scale />,
        text: 'שינסה/תנסה לגשר ולמצוא פשרה שמכבדת את כולם.',
        value: 'גישור ופשרה',
      },
      {
        icon: <Users />,
        text: 'שיגן/תגן עליי בשיחה פרטית, אך ישמור על כבוד הוריו/ה בפומבי.',
        value: 'דיפלומטיה',
      },
      {
        icon: <Home />,
        text: 'שיסביר/תסביר לי את עמדתם ויצפה/תצפה שאכבד אותה.',
        value: 'נאמנות למשפחת המוצא',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'השאלה נוגעת באחד ממוקדי הקונפליקט המרכזיים בזוגיות: הגבולות בין הזוג למשפחות המוצא.',
    },
  },
  {
    worldId: 'PARTNER',
    id: 'partner_must_have_quality_final_revised',
    category: 'partner',
    subcategory: 'non_negotiables',
    question:
      "אם היית צריך/ה לבחור את 'אבן הראשה' – התכונה האחת שעליה כל בניין הזוגיות שלכם יעמוד – מה היא הייתה?",
    type: 'openText',
    depth: 'EXPERT',
    isRequired: true,
    minLength: 10,
    maxLength: 150,
    placeholder: 'נסה/י לחשוב על הדבר האחד והיחיד שהוא הבסיס להכל עבורך...',
    metadata: {
      estimatedTime: 1,
      helpText:
        'זו שאלת המיקוד החשובה ביותר. היא עוזרת לנו להבין מה נמצא בגרעין החיפוש שלך.',
    },
  },
];
