// src/components/questionnaire/questions/relationship/relationshipQuestions.tsx
import { Question } from '../../types/types';
import {
  Briefcase,
  BookOpen,
  Target,
  Heart,
  Users,
  Home,
  MessageCircle,
  Scale,
  Brain,
  Moon,
  Sparkles,
  HandHeart,
  ShieldCheck,
  Link,
  Map,
  Clock,
  Award,
  Baby,
  Coffee,
  Bed,
  Smile,
  Gift,
  Info,
  HelpCircle,
} from 'lucide-react';

export const relationshipQuestions: Question[] = [
  // --- חלק 1: יסודות השותפות - מהי זוגיות עבורך? ---
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_core_meaning_revised',
    category: 'relationship',
    subcategory: 'core_expectations',
    question:
      'מהי בעיניך התמצית, הלב הפועם, של שותפות זוגית בריאה ומספקת? (בחר/י עד 2 אפשרויות עיקריות)',
    type: 'multiSelect',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Heart />,
        text: 'חיבור רגשי עמוק, אינטימיות והבנה הדדית',
        value: 'חיבור רגשי עמוק',
      },
      {
        icon: <Users />,
        text: 'חברות אמת, שותפות איתנה ותמיכה בלתי מסויגת',
        value: 'חברות ותמיכה',
      },
      {
        icon: <Link />,
        text: 'מחויבות, נאמנות וביטחון מוחלט בקשר',
        value: 'מחויבות וביטחון',
      },
      {
        icon: <Sparkles />,
        text: 'צמיחה משותפת, למידה והתפתחות אישית וזוגית',
        value: 'צמיחה משותפת',
      },
      {
        icon: <Home />,
        text: 'בניית בית ומשפחה על בסיס ערכים משותפים',
        value: 'בניית בית ומשפחה',
      },
    ],
    minSelections: 1,
    maxSelections: 2,
    metadata: {
      estimatedTime: 1,
      helpText: 'נסה/י לחשוב מה הכי חיוני לך כדי להרגיש "בבית" בתוך הזוגיות.',
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_key_feelings_from_partner_revised', // שם וניסוח חדש
    category: 'relationship',
    subcategory: 'core_expectations',
    question:
      'כדי ששותפות זוגית תצליח, שני הצדדים צריכים להרגיש דברים מסוימים. מהם שלושת הדברים שהכי חשוב לך להרגיש מבן/בת הזוג שלך בקשר?',
    type: 'multiSelectWithOther',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <HandHeart />,
        text: 'שאני מובן/ת ושיש לי תמיכה רגשית',
        value: 'תמיכה והבנה',
      },
      {
        icon: <Award />,
        text: 'שאני מוערך/ת ומקבל/ת כבוד',
        value: 'הערכה וכבוד',
      },
      {
        icon: <ShieldCheck />,
        text: 'ביטחון מוחלט שאני יכול/ה לסמוך עליו/ה',
        value: 'ביטחון ואמון',
      },
      {
        icon: <Sparkles />,
        text: 'שאני נחשק/ת ושיש בינינו משיכה',
        value: 'משיכה ותשוקה',
      },
      {
        icon: <Smile />,
        text: 'שיש בינינו קלילות, הומור וכיף',
        value: 'קלילות וכיף',
      },
      {
        icon: <Brain />,
        text: 'שיש לי פרטנר אינטלקטואלי לשיחה ולצמיחה',
        value: 'שותפות אינטלקטואלית',
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: {
      estimatedTime: 1,
      helpText:
        "השאלה היא לא על 'ציפיות' אלא על הצרכים הרגשיים הבסיסיים שלך בקשר.",
    },
  },

  // --- חלק 2: תקשורת, קונפליקטים ותיקון ---
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_communication_ideal_revised',
    category: 'relationship',
    subcategory: 'communication_intimacy',
    question: 'איך נראית שיחה טובה ובונה בעיניך בזוגיות?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <MessageCircle />,
        text: 'פתוחה וישירה - מדברים על הכל בכנות ובכבוד.',
        value: 'פתיחות וישירות',
      },
      {
        icon: <Heart />,
        text: 'רגישה ואמפתית - הדגש הוא על הקשבה לרגשות שמאחורי המילים.',
        value: 'רגישות ואמפתיה',
      },
      {
        icon: <Brain />,
        text: 'ממוקדת פתרון - מנתחים את הבעיה ומגיעים לפתרון מעשי.',
        value: 'התמקדות בפתרון',
      },
      {
        icon: <Scale />,
        text: 'מאוזנת - יודעת לשלב בין הקשבה רגשית למציאת פתרון.',
        value: 'איזון',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_handling_partner_disappointment_revised',
    category: 'relationship',
    subcategory: 'communication_intimacy',
    question:
      'דמיין/י מצב של אי-הבנה או אכזבה בקשר קרוב ומשמעותי (זוגיות, חברות טובה). מהי הנטייה הראשונית והטבעית ביותר שלך?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: true,
    options: [
      {
        icon: <Moon />,
        text: 'להתרחק ולהתכנס בעצמי כדי לעכל.',
        value: 'התרחקות ועיבוד',
      },
      {
        icon: <MessageCircle />,
        text: 'לרצות לדבר על זה מיד כדי לפתור.',
        value: 'שיחה מיידית',
      },
      {
        icon: <ShieldCheck />,
        text: 'להעמיד פנים שהכל בסדר ולשמור בפנים.',
        value: 'הדחקה',
      },
      {
        icon: <Brain />,
        text: 'לנתח את המצב בצורה הגיונית לפני שאגיב.',
        value: 'ניתוח הגיוני',
      },
      {
        icon: <HelpCircle />,
        text: 'לא חוויתי זוגיות משמעותית / לא בטוח/ה.',
        value: 'לא בטוח/ה',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'הכנות שלך כאן חשובה. היא תעזור לנו להבין את סגנון ההתמודדות שלך.',
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_meaningful_apology', // שאלה חדשה
    category: 'relationship',
    subcategory: 'communication_intimacy',
    question: 'כדי שתרגיש/י שהתנצלות היא אמיתית וכנה, מה הכי חשוב לך שיקרה?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <Heart />,
        text: 'שיביע/תביע חרטה והבנה של איך הרגשתי.',
        value: 'הבעת חרטה והבנה',
      },
      {
        icon: <ShieldCheck />,
        text: 'שיקח/תיקח אחריות מלאה על המעשה.',
        value: 'לקיחת אחריות',
      },
      {
        icon: <Target />,
        text: 'שיציע/תציע דרך לתקן או למנוע זאת בעתיד.',
        value: 'הצעה לתיקון',
      },
      {
        icon: <MessageCircle />,
        text: "עצם אמירת המילה 'סליחה' בכנות מספיקה לי.",
        value: 'אמירת סליחה',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        "היכולת לתקן קרע היא מפתח לזוגיות ארוכת טווח. מהו 'מפתח התיקון' שלך?",
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_silent_treatment_view', // שאלה חדשה
    category: 'relationship',
    subcategory: 'communication_intimacy',
    question:
      "על סולם של 1 (לגיטימי ולפעמים נחוץ) עד 10 (הרסני ולא מקובל בשום מצב), מה דעתך על שימוש ב'שתיקה כעונש' (Silent Treatment) במהלך ריב?",
    type: 'scale',
    depth: 'ADVANCED',
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: 'לגיטימי', max: 'הרסני' },
    metadata: {
      estimatedTime: 1,
      helpText:
        "חשוב להבדיל בין 'פסק זמן' כדי להירגע לבין 'שתיקה' שנועדה להעניש. השאלה מתייחסת לאפשרות השנייה.",
    },
  },

  // --- חלק 3: שותפות ביומיום ---
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_partner_bad_day', // שאלה חדשה
    category: 'relationship',
    subcategory: 'daily_life_partnership',
    question:
      'בן/בת הזוג שלך חוזר/ת הביתה אחרי יום נוראי, מתוסכל/ת ועצבני/ת. מה תהיה התגובה הטבעית שלך?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <Heart />,
        text: 'להקשיב - פשוט להיות שם, להציע חיבוק ולתת לו/ה לפרוק.',
        value: 'הקשבה והכלה',
      },
      {
        icon: <Brain />,
        text: 'לפתור - לנסות להבין מה קרה ולחשוב יחד על פתרונות.',
        value: 'ניתוח ופתרון',
      },
      {
        icon: <Home />,
        text: "לתת מרחב - להגיד 'אני פה אם תצטרך/כי' ולתת לו/ה שקט.",
        value: 'מתן מרחב',
      },
      {
        icon: <Sparkles />,
        text: 'להסיח את הדעת - להציע משהו כיפי שישנה את האווירה.',
        value: 'הסחת דעת',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        "השאלה בודקת את 'שפת התמיכה' שלך בפועל. אין פה תשובה נכונה, רק סגנונות שונים.",
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_household_philosophy', // שאלה חדשה
    category: 'relationship',
    subcategory: 'daily_life_partnership',
    question:
      "בניית בית משותף היא עבודת צוות. מהי בעיניך ה'נוסחה' הטובה ביותר לחלוקת האחריות על ניהול הבית (מטלות, קניות, בירוקרטיה)?",
    type: 'openText',
    depth: 'BASIC',
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'לדוגמה: חלוקה שווה 50/50, לפי מי שטוב יותר בכל דבר, לפי זמן פנוי, מיקור חוץ, או גישה אחרת?',
    metadata: {
      estimatedTime: 2,
      helpText:
        'התשובה כאן מלמדת על תפיסת השותפות שלך, מעבר לשאלה מי שוטף כלים.',
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_daily_togetherness_vs_autonomy_revised',
    category: 'relationship',
    subcategory: 'daily_life_partnership',
    question:
      'באיזון שבין "אנחנו" לבין "אני" ו"את/ה" בתוך הזוגיות, לאן את/ה נוטה באופן טבעי?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: true,
    min: 1,
    max: 10,
    labels: {
      min: 'חשובה לי עצמאות ומרחב אישי',
      max: 'חשוב לי לעשות הכל ביחד',
      middle: 'איזון גמיש',
    },
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 4: צמיחה, חזון וחגיגות ---
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_role_in_growth', // שאלה חדשה
    category: 'relationship',
    subcategory: 'growth_challenges',
    question:
      'על סולם של 1 עד 10, עד כמה חשוב לך שבן/בת הזוג יאתגרו אותך להיות אדם טוב יותר, לעומת שיקבלו אותך בדיוק כמו שאת/ה?',
    type: 'scale',
    depth: 'EXPERT',
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: 'קבלה מוחלטת', max: 'אתגור וצמיחה' },
    metadata: {
      estimatedTime: 1,
      helpText:
        "1 = 'אוהב/ת אותי כמו שאני'. 10 = 'עוזר/ת לי להיות הגרסה הכי טובה של עצמי'. איזו גישה מדברת אליך יותר?",
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_celebrating_success', // שאלה חדשה
    category: 'relationship',
    subcategory: 'daily_life_partnership',
    question:
      'בן/בת הזוג שלך מקבל/ת קידום משמעותי בעבודה. מהי הדרך האידיאלית עבורך לחגוג את ההצלחה שלו/ה?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 30,
    maxLength: 300,
    placeholder:
      'לדוגמה: ארוחה רומנטית, מסיבת הפתעה, שיחת עומק על המשמעות, מתנה סמלית...',
    metadata: {
      estimatedTime: 2,
      helpText:
        "היכולת לשמוח בהצלחת האחר היא מדד לבריאות הקשר. מהי 'שפת החגיגה' שלך?",
    },
  },
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_family_vision_children_revised',
    category: 'relationship',
    subcategory: 'family_future_vision',
    question:
      'במבט קדימה, מה מקומה של ההורות בחזון האישי שלך לחיים מלאים ומספקים?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Baby />,
        text: 'זהו חלק מרכזי וחשוב בחלום שלי על משפחה',
        value: 'הורות היא חלק מרכזי',
      },
      {
        icon: <Home />,
        text: 'אני רואה את עצמי הורה בעתיד, כשזה ירגיש נכון',
        value: 'רואה את עצמי הורה בעתיד',
      },
      {
        icon: <Scale />,
        text: 'פתוח/ה לזה, אבל זה לא תנאי הכרחי לאושר שלי',
        value: 'פתוח/ה אך לא הכרחי',
      },
      {
        icon: <Heart />,
        text: 'מעדיפ/ה להתמקד בזוגיות, והורות פחות רלוונטית לי',
        value: 'הורות פחות רלוונטית',
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 5: סיכום ומיקוד ---
  {
    worldId: 'RELATIONSHIP',
    id: 'relationship_deal_breaker_summary_final_revised',
    category: 'relationship',
    subcategory: 'growth_challenges',
    question:
      'לסיום עולם זה, מהו הדבר האחד שבלעדיו קשר זוגי פשוט לא יכול לעבוד עבורך, ומהו הדבר האחד שאת/ה הכי שואפ/ת אליו בזוגיות?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: true,
    minLength: 50,
    maxLength: 400,
    placeholder: "ה'דיל ברייקר' שלי הוא... והשאיפה הגדולה ביותר שלי היא...",
    metadata: {
      estimatedTime: 2,
      helpText:
        'נסה/י לזקק את הכל לשני דברים: הגבול התחתון והשאיפה העליונה. זה ממקד מאוד.',
    },
  },
];
