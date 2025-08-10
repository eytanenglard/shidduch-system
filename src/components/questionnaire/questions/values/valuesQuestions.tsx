// src/components/questionnaire/questions/values/valuesQuestions.tsx
import { Question } from '../../types/types';
import {
  Heart,
  Scale,
  Brain,
  BookOpen,
  Users,
  Home,
  Briefcase,
  Target,
  PiggyBank,
  HandHeart,
  TrendingUp,
  Leaf,
  Sparkles,
  ShieldCheck,
  Flag,
  HelpCircle,
  Info,
  DollarSign,
  Activity,
  MessageCircle,
} from 'lucide-react';

export const valuesQuestions: Question[] = [
  // --- חלק 1: מצפן ערכי - מה מנחה אותך? ---
  {
    worldId: 'VALUES',
    id: 'values_core_identification_revised',
    category: 'values',
    subcategory: 'core_values',
    question:
      "דמיין/י שיש לך 100% של 'אנרגיה ערכית' לחלק בין הדברים שבאמת מנחים אותך בחיים. כיצד היית מחלק/ת אותה?",
    type: 'budgetAllocation',
    depth: 'BASIC',
    isRequired: true,
    totalPoints: 100,
    categories: [
      { label: 'משפחה וקשרים קרובים', icon: <Heart /> },
      { label: 'יושרה, אמינות וכנות', icon: <ShieldCheck /> },
      { label: 'רוחניות, אמונה ומסורת', icon: <BookOpen /> },
      { label: 'צמיחה אישית והתפתחות', icon: <TrendingUp /> },
      { label: 'נתינה ותרומה לחברה', icon: <HandHeart /> },
      { label: 'קריירה והגשמה מקצועית', icon: <Briefcase /> },
      { label: 'ביטחון ויציבות כלכלית', icon: <PiggyBank /> },
      { label: 'יצירתיות וביטוי עצמי', icon: <Sparkles /> },
    ],
    metadata: {
      estimatedTime: 3,
      helpText:
        'זו הזדמנות להראות מה באמת נמצא בראש סדר העדיפויות שלך. התמקד/י במה שהכי חשוב לך.',
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_core_elaboration_revised',
    category: 'values',
    subcategory: 'core_values',
    question:
      "כעת, בחר/י את הערך ה'צפוני' ביותר במצפן הפנימי שלך - זה שמכוון את ההחלטות החשובות באמת - וספר/י לנו על צומת דרכים אחד בחיים שבו הלכת לפיו.",
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 70,
    maxLength: 600,
    placeholder:
      "לדוגמה: 'הערך הכי חשוב לי הוא יושרה. פעם, בעבודה, נתקלתי במצב X ובחרתי לעשות Y כי זה היה הדבר הנכון, למרות המחיר...'",
    metadata: {
      estimatedTime: 3,
      helpText:
        "סיפור קונקרטי שווה אלף תיאורים. זה עוזר לנו להבין איך הערכים שלך נראים 'בשטח'.",
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_quiet_heroes', // שאלה חדשה
    category: 'values',
    subcategory: 'core_values',
    question:
      'מי הם האנשים (מהמעגלים הקרובים או הרחוקים) שמהווים עבורך השראה או מודל לחיקוי, ובמשפט - מדוע?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'זה יכול להיות סבא, דמות היסטורית, רב, או כל אדם אחר. מה בתכונותיו או במעשיו מעורר בך הערכה?',
    metadata: {
      estimatedTime: 2,
      helpText:
        'אומרים לנו מי הגיבורים שלך, ונגיד לך מי אתה. התשובה כאן חושפת את השאיפות העמוקות שלך.',
    },
  },

  // --- חלק 2: ערכים בפעולה - דילמות וסדרי עדיפויות ---
  {
    worldId: 'VALUES',
    id: 'values_two_job_offers', // שאלה חדשה
    category: 'values',
    subcategory: 'life_priorities',
    question:
      'קיבלת שתי הצעות עבודה: (א) משרה יוקרתית עם שכר גבוה מאוד, אך תובענית עם שעות ארוכות. (ב) משרה עם משמעות שאת/ה אוהב/ה, איזון מצוין בין עבודה לחיים, אך עם שכר נמוך ב-30%. איזו הצעה סביר יותר שתקבל/י, ומדוע?',
    type: 'scenario',
    depth: 'EXPERT',
    isRequired: true,
    options: [
      {
        value: 'הצעה א - יוקרה ושכר',
        text: "הצעה א': שכר גבוה ויוקרה",
        description:
          'ביטחון כלכלי והזדמנות להתקדמות מהירה הם בעדיפות עליונה כרגע.',
      },
      {
        value: 'הצעה ב - משמעות ואיזון',
        text: "הצעה ב': משמעות ואיזון",
        description:
          'איכות חיים, סיפוק אישי וזמן פנוי חשובים לי יותר מהיבט כלכלי נטו.',
      },
    ],
    metadata: {
      estimatedTime: 2,
      helpText:
        'אין פה תשובה נכונה. זו שאלה על סדרי עדיפויות, והיא עוזרת לנו להבין מה באמת מניע אותך.',
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_life_priorities_allocation_revised',
    category: 'values',
    subcategory: 'life_priorities',
    question:
      'בשלב זה של חייך, כיצד מתחלקת תשומת הלב שלך (זמן, אנרגיה, מחשבה) בין התחומים השונים? חלק/י 100 נקודות:',
    type: 'budgetAllocation',
    depth: 'ADVANCED',
    isRequired: true,
    totalPoints: 100,
    categories: [
      {
        label: 'זוגיות (חיפוש או קשר קיים)',
        icon: <Heart />,
      },
      {
        label: 'משפחה (הורים, אחים)',
        icon: <Home />,
      },
      {
        label: 'קריירה ופרנסה',
        icon: <Briefcase />,
      },
      {
        label: 'רוחניות ולימוד',
        icon: <BookOpen />,
      },
      {
        label: 'חברים וקהילה',
        icon: <Users />,
      },
      {
        label: 'פנאי, תחביבים וטיפוח עצמי',
        icon: <Sparkles />,
      },
    ],
    metadata: {
      estimatedTime: 4,
      helpText:
        'זוהי "תמונת מצב" של חייך כיום. הכנות כאן תעזור לנו להבין איפה את/ה נמצא/ת במסע שלך.',
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_feeling_of_home', // שאלה חדשה
    category: 'values',
    subcategory: 'community_social',
    question: "מעבר לארבעה קירות, מהם שלושת הדברים שהופכים מקום ל'בית' עבורך?",
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 30,
    maxLength: 300,
    placeholder:
      'לדוגמה: ריח של בישולים, ספרים אהובים, תחושת ביטחון, אנשים שאוהבים אותי, סדר וניקיון...',
    metadata: {
      estimatedTime: 2,
      helpText:
        'התשובה כאן מלמדת על הצרכים הרגשיים והפיזיים שלך לסביבה תומכת ומצמיחה.',
    },
  },

  // --- חלק 3: גישה חומרית ורוחנית ---
  {
    worldId: 'VALUES',
    id: 'values_definition_of_rich_life', // שאלה חדשה
    category: 'values',
    subcategory: 'material_intellectual',
    question: "מהי ההגדרה שלך ל'חיים עשירים', שאינה קשורה בהכרח לכסף?",
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'האם זה עושר של חוויות? של קשרים? של ידע? של זמן פנוי? של שקט נפשי?',
    metadata: {
      estimatedTime: 2,
      helpText:
        'השאלה הזו פותחת צוהר לשאיפות העמוקות ביותר שלך, מעבר להיבט החומרי.',
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_attitude_towards_money_revised',
    category: 'values',
    subcategory: 'material_intellectual',
    question: 'מהי "מערכת היחסים" שלך עם כסף?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <PiggyBank />,
        text: 'כלי לביטחון - חשוב לי לחסוך ולתכנן לעתיד.',
        value: 'כלי לביטחון',
      },
      {
        icon: <Sparkles />,
        text: 'אמצעי לחוויות - אני אוהב/ת להשקיע בטיולים, בילויים וצמיחה.',
        value: 'אמצעי לחוויות',
      },
      {
        icon: <Scale />,
        text: 'איזון - אני מנהל/ת אותו באחריות, אבל יודע/ת גם להנות ממנו.',
        value: 'איזון ואחריות',
      },
      {
        icon: <Leaf />,
        text: 'פשטות - אני לא צריך/ה הרבה כדי להיות מאושר/ת.',
        value: 'פשטות והסתפקות',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'VALUES',
    id: 'values_lost_wallet', // שאלה חדשה
    category: 'values',
    subcategory: 'core_values',
    question:
      'מצאת ברחוב ארנק ובו סכום כסף גדול ותעודה מזהה. אין איש בסביבה. מהם הצעדים המדויקים שתעשה/י?',
    type: 'openText',
    depth: 'BASIC',
    isRequired: true,
    minLength: 30,
    maxLength: 300,
    placeholder: 'תאר/י את תהליך המחשבה והפעולות שלך, שלב אחר שלב.',
    metadata: {
      estimatedTime: 2,
      helpText:
        "השאלה בוחנת יושרה, תושייה ואחריות בפעולה. אין תשובה אחת 'נכונה', התהליך הוא שחשוב.",
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_giving_tzedaka_importance_revised',
    category: 'values',
    subcategory: 'material_intellectual',
    question:
      'עד כמה נתינה וחסד (בכסף, בזמן או במעשים) הם חלק פעיל ומרכזי בחיים שלך?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: 'פחות מרכזי', max: 'מרכזי מאוד' },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'VALUES',
    id: 'values_education_pursuit_revised',
    category: 'values',
    subcategory: 'material_intellectual',
    question:
      'מהי גישתך להתפתחות אינטלקטואלית וללמידה מתמדת, גם לאחר סיום ההשכלה הפורמלית?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <BookOpen />,
        text: 'זה חלק מהותי ממני - אני תמיד קורא/ת, לומד/ת ומתפתח/ת.',
        value: 'למידה היא דרך חיים',
      },
      {
        icon: <Target />,
        text: 'אני לומד/ת ומתפתח/ת בעיקר בתחומים שקשורים לקריירה ולמטרות שלי.',
        value: 'למידה ממוקדת מטרה',
      },
      {
        icon: <Sparkles />,
        text: 'אני אוהב/ת ללמוד, אבל מעדיפ/ה דרכים חוויתיות כמו סדנאות ופודקאסטים.',
        value: 'למידה חווייתית',
      },
      {
        icon: <Scale />,
        text: 'אני מעריך/ה ידע, אבל כרגע פחות פנוי/ה ללמידה פעילה.',
        value: 'מעריך אך פחות פעיל',
      },
    ],
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 4: ערכים במערכות יחסים וחברה ---
  {
    worldId: 'VALUES',
    id: 'values_parents_tradition_conflict', // שאלה חדשה
    category: 'values',
    subcategory: 'challenges_conflicts',
    question:
      'דמיין/י מצב שבו דרך חיים או החלטה שחשובה לך (למשל, מקום מגורים, סגנון חינוך) אינה תואמת את הציפיות של הוריך, שאת/ה מאוד מכבד/ת. כיצד תנווט/י את הסיטואציה?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder:
      'כיצד תאזן/י בין כיבוד הורים לבין בניית דרך עצמאית עם בן/בת הזוג? מה יהיו השיקולים המרכזיים שלך?',
    metadata: {
      estimatedTime: 3,
      helpText:
        'זו דילמה שרבים מתמודדים איתה. התשובה שלך מלמדת על בגרות, אסרטיביות ויכולת ניהול קונפליקטים.',
    },
  },
  {
    worldId: 'VALUES',
    id: 'values_social_political_stance_importance_partner_revised',
    category: 'values',
    subcategory: 'community_social',
    question:
      'בזוגיות, עד כמה חשוב לך ששיחות סביב שולחן השבת על אקטואליה ונושאים חברתיים יהיו בהסכמה כללית, לעומת שיח פתוח ומאתגר גם אם יש חילוקי דעות?',
    type: 'scale',
    depth: 'ADVANCED',
    isRequired: false,
    min: 1,
    max: 10,
    labels: {
      min: 'שיח פתוח זה העיקר',
      max: 'הסכמה בסיסית היא חובה',
    },
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'VALUES',
    id: 'values_dealing_with_disagreement_partner_revised',
    category: 'values',
    subcategory: 'challenges_conflicts',
    question:
      'כשמתעורר חוסר הסכמה עמוק עם אדם קרוב בנושא ערכי, מהי הגישה הנכונה בעיניך?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: true,
    options: [
      {
        icon: <MessageCircle />,
        text: 'לנהל שיחה מכבדת כדי להבין, גם אם לא נסכים.',
        value: 'שיחה והבנה',
      },
      {
        icon: <Brain />,
        text: 'לנסות למצוא את שורש חוסר ההסכמה והבסיס המשותף.',
        value: 'מציאת בסיס משותף',
      },
      {
        icon: <Scale />,
        text: 'לחפש פשרה מעשית שמאפשרת להמשיך הלאה.',
        value: 'חיפוש פשרה',
      },
      {
        icon: <Heart />,
        text: 'להסכים לא להסכים, ולתת לקשר להיות מעל חילוקי הדעות.',
        value: 'להסכים לא להסכים',
      },
    ],
    metadata: {
      estimatedTime: 1,
    },
  },

  // --- חלק 5: סיכום ערכי ---
  {
    worldId: 'VALUES',
    id: 'values_non_negotiable_for_partner_revised',
    category: 'values',
    subcategory: 'summary_future',
    question:
      'לסיום, מהם 1-2 הערכים שבהם *חייבת* להיות התאמה בינך לבין בן/בת הזוג, ואין בהם מקום לפשרה מבחינתך?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 30,
    maxLength: 300,
    placeholder:
      'נסה/י למקד את הדברים הקריטיים ביותר עבורך, אלה שהם הבסיס לכל קשר בריא בעיניך.',
    metadata: {
      estimatedTime: 2,
      helpText:
        'זהו אחד הנתונים החשובים ביותר עבורנו. זה עוזר לנו למקד את החיפוש במה שבאמת לא ניתן למשא ומתן עבורך.',
    },
  },
];
