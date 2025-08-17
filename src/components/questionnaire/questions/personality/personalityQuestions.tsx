// src/components/questionnaire/questions/personality/personalityQuestions.ts
import { Question } from '../../types/types';
import {
  Sun,
  Moon,
  Users,
  Brain,
  Heart,
  Target,
  Compass,
  Cloud,
  Leaf,
  Home,
  Watch,
  Scale,
  Coffee,
  MessageCircle,
  HandHeart,
  Lightbulb,
  Sparkles,
  Star,
  Smile,
  ShieldCheck,
  BookOpen,
  Palette,
  Headphones,
  Mountain,
  Bed,
  Utensils,
  Activity,
  Edit,
  HelpCircle,
  Anchor,
  Feather,
} from 'lucide-react';

export const personalityQuestions: Question[] = [
  // --- חלק 1: פתיחה והיכרות - מי את/ה במילים שלך ---
  {
    worldId: 'PERSONALITY',
    id: 'personality_self_portrayal_revised',
    category: 'personality',
    subcategory: 'self_perception',
    question:
      'דמיין/י שאנחנו צריכים לתאר אותך לחבר/ה הכי טוב/ה שלך, במילים שלנו. מהם 3-5 הדברים המרכזיים שהכי חשוב לך שנדגיש כדי שיבינו מי את/ה באמת?',
    type: 'openText',
    depth: 'BASIC',
    isRequired: true,
    minLength: 70,
    maxLength: 500,
    placeholder:
      "לדוגמה: 'אני אדם אופטימי, אוהב/ת ללמוד דברים חדשים, נאמן/ה לחברים, קצת ביישנ/ית בהתחלה, אבל עם חוש הומור טוב...'",
    metadata: {
      estimatedTime: 3,
      helpText:
        'זו ההזדמנות שלך לתת לנו את הכותרות החשובות ביותר שמרכיבות את הסיפור שלך.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_childhood_nickname', // שאלה חדשה
    category: 'personality',
    subcategory: 'self_perception',
    question:
      'האם היה לך כינוי חיבה מיוחד בילדותך? אם כן, מה הוא היה ומה הסיפור שמאחוריו?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 0,
    maxLength: 300,
    placeholder:
      'כינוי שהצחיק, שחיזק, או סתם נדבק... (לא חובה לשתף אם לא מרגיש נוח)',
    metadata: {
      estimatedTime: 2,
      helpText:
        'לפעמים, כינויים קטנים מהעבר מספרים סיפור גדול על חום, הומור והדינמיקה המשפחתית שלנו.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_core_trait_selection_revised',
    category: 'personality',
    subcategory: 'self_perception',
    question:
      'דמיין/י את האישיות שלך כעוגה המחולקת ל-100%. כיצד היית מחלק/ת את האחוזים בין התכונות הבאות כדי לתאר בצורה הכי טובה מי את/ה?',
    type: 'budgetAllocation',
    depth: 'BASIC',
    isRequired: true,
    totalPoints: 100,
    categories: [
      { label: 'אמפתי/ת ורגיש/ה', icon: <Heart /> },
      { label: 'ישר/ה ואמין/ה', icon: <ShieldCheck /> },
      { label: 'אופטימי/ת ושמח/ה', icon: <Sun /> },
      { label: 'בעל/ת חוש הומור', icon: <Smile /> },
      { label: 'אינטליגנט/ית וסקרנ/ית', icon: <Brain /> },
      { label: 'שאפתנ/ית ובעל/ת מוטיבציה', icon: <Star /> },
      { label: 'קליל/ה וזורמ/ת', icon: <Feather /> },
      { label: 'אחראי/ת ומאורגנ/ת', icon: <Target /> },
      { label: 'יצירתי/ת ומקור/ית', icon: <Lightbulb /> },
      { label: 'יציב/ה וקרקע/ית', icon: <Anchor /> },
      { label: 'החלטי/ת ובעל/ת ביטחון', icon: <Compass /> },
      { label: 'נדיב/ה ומתחשב/ת', icon: <HandHeart /> },
    ],
    metadata: {
      estimatedTime: 3,
      helpText:
        'אין צורך לחלק לכולם. התמקד/י בתכונות שהן החלקים הגדולים ביותר ב"עוגה" שלך. הסך הכל צריך להיות 100.',
    },
  },

  // --- חלק 2: אנרגיות וסגנון חיים - איך את/ה בעולם ---
  {
    worldId: 'PERSONALITY',
    id: 'personality_social_battery_recharge',
    category: 'personality',
    subcategory: 'lifestyle',
    question:
      "עבר עליך שבוע עמוס ואינטנסיבי. את/ה מרגיש/ה שה'סוללה החברתית' שלך קרובה להתרוקן. הגיע יום חמישי בערב, ויש לך ערב פנוי לחלוטין. איזו מהאפשרויות הבאות הכי קורצת לך ומרגישה כמו 'שקע הטעינה' המושלם עבורך?",
    type: 'scenario',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        value: 'ערב שקט בבית',
        icon: <Moon />,
        text: 'ערב שקט בבית',
        description:
          'להזמין אוכל טעים, לראות סדרה טובה, לקרוא ספר, או פשוט להיות בשקט. אפס אינטראקציות חברתיות.',
      },
      {
        value: 'מפגש אינטימי',
        icon: <Coffee />,
        text: 'מפגש אינטימי',
        description:
          'להתקשר לחבר/ה טוב/ה אחד/ת או שניים ולקבוע מפגש רגוע בבית קפה או בבית. שיחה עמוקה ואיכותית בקבוצה קטנה.',
      },
      {
        value: 'יציאה חברתית אנרגטית',
        icon: <Users />,
        text: 'יציאה חברתית אנרגטית',
        description:
          'לבדוק מה קורה הערב! להתארגן ולצאת לאירוע, בר, או מפגש עם קבוצה גדולה של חברים. להיות מוקף/ת באנשים ואנרגיה.',
      },
      {
        value: 'שילוב גמיש',
        icon: <Scale />,
        text: 'שילוב גמיש',
        description:
          'להתחיל את הערב בבית במנוחה, ואולי מאוחר יותר להצטרף לחברים למשקה קצר אם ארגיש שיש לי כוח. זורם/ת לפי ההרגשה.',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'אין פה תשובה "נכונה". התשובה שלך עוזרת לנו להבין מהם התנאים שבהם את/ה פורח/ת ונטען/ת מחדש, וזה קריטי להתאמה זוגית.',
    },
  },
  // קוד להוספה:
  {
    worldId: 'PERSONALITY',
    id: 'personality_biological_clock',
    category: 'personality',
    subcategory: 'lifestyle',
    question:
      "על סולם של 1 (איש של בוקר) עד 10 (ציפור לילה), מהו ה'שעון הביולוגי' הטבעי שלך?",
    type: 'scale',
    depth: 'BASIC',
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: 'משכים קום', max: 'ער עד מאוחר' },
    metadata: {
      estimatedTime: 1,
      helpText:
        'התאמה בקצב היומי יכולה להשפיע רבות על ההרמוניה בזוגיות. זהו נתון פרקטי שעוזר לנו להבין את סגנון החיים שלך.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_good_vs_perfect_day', // שאלה חדשה
    category: 'personality',
    subcategory: 'lifestyle',
    question:
      "כולנו חולמים על 'יום מושלם'. אבל מה, עבורך, הופך יום רגיל ל'יום ממש טוב'?",
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'זה יכול להיות דבר קטן: שיחה טובה, תחושת סיפוק בעבודה, אימון מוצלח, עזרה למישהו...',
    metadata: {
      estimatedTime: 2,
      helpText: 'התשובה כאן מלמדת המון על מקורות האושר והסיפוק היומיומיים שלך.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_vacation_compass',
    category: 'personality',
    subcategory: 'lifestyle',
    question:
      "הדרך שבה אנחנו אוהבים לנפוש אומרת המון על האישיות שלנו. מהם המרכיבים שהופכים חופשה למושלמת עבורך? חלק/י 100 'נקודות חופשה' כדי לבנות את 'מצפן החופשה' שלך.",
    type: 'budgetAllocation',
    depth: 'ADVANCED',
    isRequired: true,
    totalPoints: 100,
    categories: [
      {
        label: 'בטן-גב, רוגע ושלווה',
        icon: <Bed />,
        description: 'מנוחה מוחלטת, ספר טוב, נוף יפה, בלי לחץ ובלי תוכניות.',
      },
      {
        label: 'טיולים, טבע והרפתקאות',
        icon: <Mountain />,
        description: 'מסלולי הליכה, נופים פראיים, פעילות פיזית ואתגר.',
      },
      {
        label: 'עיר תוססת, תרבות ובילויים',
        icon: <Sparkles />, // שימוש באייקון כללי יותר מעיר
        description: 'מוזיאונים, מסעדות טובות, הופעות, קניות וחיי לילה.',
      },
      {
        label: 'מפגש חברתי ומשפחתי',
        icon: <Users />,
        description: 'חופשה עם חברים או משפחה מורחבת, זמן איכות קבוצתי.',
      },
      {
        label: 'זמן איכות זוגי ורומנטי',
        icon: <Heart />,
        description: 'התמקדות נטו בזוגיות, שיחות עומק, חוויות רומנטיות.',
      },
      {
        label: 'העשרה, למידה ורוחניות',
        icon: <BookOpen />,
        description:
          'סדנאות, סיורים לימודיים, אתרים היסטוריים, מקומות עם משמעות.',
      },
    ],
    metadata: {
      estimatedTime: 3,
      helpText:
        'אין תשובה לא נכונה. חשוב/י מה באמת מטעין אותך ונותן לך כוח. הסך הכל צריך להיות 100.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_daily_structure_revised',
    category: 'personality',
    subcategory: 'lifestyle',
    question: 'באיזו "מערכת הפעלה" הראש שלך עובד הכי טוב ביום-יום?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Watch />,
        text: 'סדר ותכנון - אני אוהב/ת לדעת מה הלו"ז שלי.',
        value: 'סדר ותכנון',
      },
      {
        icon: <Cloud />,
        text: 'גמישות וזרימה - אני הכי טוב/ה כשאני מגיב/ה להתפתחויות.',
        value: 'גמישות וזרימה',
      },
      {
        icon: <Target />,
        text: 'משימתיות - אני מתפקד/ת הכי טוב עם יעדים ברורים להשגה.',
        value: 'משימתיות',
      },
      {
        icon: <Scale />,
        text: 'איזון - שילוב של מסגרת כללית עם מקום לספונטניות.',
        value: 'איזון',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_plan_change_reaction',
    category: 'personality',
    subcategory: 'emotional_coping',
    question:
      'תכננתם בילוי חשוב במשך שבועות, וברגע האחרון הוא מתבטל מסיבה מוצדקת אך מאכזבת. על הסקאלה הבאה, עד כמה הגמישות הפנימית שלך מאפשרת לך "לזרום" עם השינוי?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: false,
    min: 1,
    max: 10,
    labels: {
      min: 'זורם/ת לגמרי',
      max: 'מאוד מתאכזב/ת',
      middle: 'מאוכזב/ת אבל מתגבר/ת',
    },
    // שימוש בשדה חדש שנוסיף ל-types.ts
    scaleDescriptions: {
      min: "1 = 'מבאס, אבל לא נורא. קורה. בוא/י נחשוב על משהו אחר'.",
      max: "10 = 'מאוד קשה לי להסתיר את האכזבה והתסכול, זה משפיע לי על כל הערב'.",
    },
    metadata: {
      estimatedTime: 1,
      helpText:
        'אין פה תשובה נכונה. השאלה בודקת את היכולת שלנו להתמודד עם שינויים ואכזבות קטנות.',
    },
  },

  // --- חלק 3: התמודדות, צמיחה ודיאלוג פנימי ---
  {
    worldId: 'PERSONALITY',
    id: 'personality_learning_process', // שאלה חדשה
    category: 'personality',
    subcategory: 'growth_aspirations',
    question:
      'חשוב/י על הפעם האחרונה שלמדת משהו חדש ומורכב (שפה, כלי נגינה, מיומנות טכנית). מה היה החלק הכי מאתגר עבורך בתהליך, ומה עזר לך להתגבר?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder:
      'הקושי יכול להיות תסכול, חוסר סבלנות או פחד מכישלון. מה הייתה אסטרטגיית ההתמודדות שלך?',
    metadata: {
      estimatedTime: 3,
      helpText:
        'היכולת שלנו ללמוד ולהתמיד היא אינדיקציה מצוינת לאיך נצמח גם בתוך זוגיות.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_stress_management_revised',
    category: 'personality',
    subcategory: 'emotional_coping',
    question:
      "כשאת/ה מרגיש/ה מוצף/פת ולחוץ/ה, לאן את/ה פונה כדי 'לאפס את המערכת'? (בחר/י עד 3 דרכים עיקריות)",
    type: 'multiSelectWithOther',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Activity />,
        text: 'תנועה וספורט (הליכה, ריצה, אימון)',
        value: 'תנועה וספורט',
      },
      {
        icon: <Users />,
        text: 'שיחה ופריקה עם מישהו קרוב',
        value: 'שיחה ופריקה',
      },
      {
        icon: <Bed />,
        text: 'זמן לבד, שקט ומנוחה',
        value: 'זמן לבד ושקט',
      },
      { icon: <Leaf />, text: 'יציאה לטבע', value: 'יציאה לטבע' },
      {
        icon: <Palette />,
        text: 'עיסוק ביצירה או תחביב',
        value: 'עיסוק ביצירה',
      },
      {
        icon: <Brain />,
        text: 'סדר וארגון של המחשבות או הסביבה',
        value: 'סדר וארגון',
      },
      {
        icon: <Headphones />,
        text: 'התנתקות עם מוזיקה, פודקאסט או ספר',
        value: 'התנתקות עם מדיה',
      },
    ],
    minSelections: 1,
    maxSelections: 3,
    metadata: { estimatedTime: 2 },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_unproductive_day_feeling', // שאלה חדשה
    category: 'personality',
    subcategory: 'emotional_coping',
    question:
      'איך את/ה מרגיש/ה עם עצמך בסוף יום שבו לא הספקת את מה שתכננת והיית פחות פרודוקטיבי/ת מהרצוי?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <Heart />,
        text: 'מקבל/ת באהבה, כנראה שהייתי צריך/ה מנוחה.',
        value: 'חמלה עצמית',
      },
      {
        icon: <Target />,
        text: 'מתוסכל/ת, ומיד מתכננ/ת איך להשלים פערים מחר.',
        value: 'ביקורת ופעולה',
      },
      {
        icon: <Brain />,
        text: 'מנתח/ת מה השתבש כדי ללמוד מזה לפעם הבאה.',
        value: 'ניתוח ולמידה',
      },
      {
        icon: <Activity />,
        text: 'מנסה לעשות משהו קטן ומועיל כדי לסיים בתחושה טובה.',
        value: 'תיקון מיידי',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'השאלה הזו בודקת את הדיאלוג הפנימי שלך - האם הוא ביקורתי או חומל? זה חשוב ליכולת להכיל גם את בן/בת הזוג.',
    },
  },
  // קוד להוספה:
  {
    worldId: 'PERSONALITY',
    id: 'personality_failure_lesson',
    category: 'personality',
    subcategory: 'emotional_coping',
    question:
      'חשוב/י על כישלון או אתגר משמעותי שחווית. מה למדת על עצמך מתוך ההתמודדות הזו?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder:
      'התמקד/י בתובנה על עצמך, על החוזקות שגילית או על התחומים שבהם את/ה עוד צריך/ה לצמוח...',
    metadata: {
      estimatedTime: 3,
      helpText:
        'השאלה הזו בוחנת חוסן נפשי, מודעות עצמית ויכולת צמיחה. הכנות שלך כאן היא מתנה עבורנו ועבורך.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_handling_criticism_revised',
    category: 'personality',
    subcategory: 'emotional_coping',
    question:
      'כולנו מקבלים ביקורת לפעמים, בונה יותר ובונה פחות. כשזה קורה לך, מה קורה אצלך בפנים ואיך זה נראה בחוץ?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: false,
    minLength: 50,
    maxLength: 400,
    placeholder:
      'לדוגמה: האם את/ה נפגע/ת אבל מנסה ללמוד? האם עולה בך צורך להתגונן? האם את/ה זקוק/ה לזמן לעבד את הדברים?',
    metadata: { estimatedTime: 2 },
  },

  // --- חלק 4: אינטראקציה חברתית - איך את/ה עם אחרים ---
  {
    worldId: 'PERSONALITY',
    id: 'personality_social_situation_revised', // שם חדש ושילוב שתי שאלות
    category: 'personality',
    subcategory: 'social_communication',
    question:
      'את/ה מגיע/ה לאירוע חברתי (למשל, קידוש, חתונה) שבו את/ה מכיר/ה רק מעט אנשים. מהי הגישה הטבעית שלך?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <Users />,
        text: 'להתחיל שיחה - אני ניגש/ת לאנשים ויוצר/ת קשרים חדשים בקלות.',
        value: 'יוזם/ת ומתחבר/ת',
      },
      {
        icon: <Coffee />,
        text: 'להצטרף לשיחה - אני מאתר/ת קבוצה שנראית נחמדה ומצטרף/ת בעדינות.',
        value: 'מצטרף/ת בעדינות',
      },
      {
        icon: <MessageCircle />,
        text: 'שיחת עומק - אני מעדיף/ה למצוא אדם אחד או שניים לשיחה משמעותית בצד.',
        value: 'מחפש/ת שיחת עומק',
      },
      {
        icon: <Compass />,
        text: 'המתבונן/ת - אני לוקח/ת את הזמן, סורק/ת את המרחב ומחכה להזדמנות הנכונה.',
        value: 'מתבונן/ת וממתין/ה',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_friend_in_crisis', // שאלה חדשה
    category: 'personality',
    subcategory: 'social_communication',
    question:
      'חבר/ה טוב/ה מתקשר/ת אליך באמצע היום, נסער/ת מאוד בגלל משבר אישי. מהי התגובה הראשונה והאינסטינקטיבית שלך?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <Heart />,
        text: 'להקשיב ולהכיל - קודם כל לתת לו/ה לפרוק ולהיות שם רגשית.',
        value: 'תמיכה רגשית',
      },
      {
        icon: <Brain />,
        text: 'לנתח ולפתור - לנסות להבין את הבעיה ולהציע פתרונות מעשיים.',
        value: 'פתרון בעיות',
      },
      {
        icon: <MessageCircle />,
        text: 'לשאול שאלות - לעזור לו/ה לסדר את המחשבות דרך שאלות מנחות.',
        value: 'בירור וניתוח',
      },
      {
        icon: <Sparkles />,
        text: 'להסיח את הדעת - להציע להיפגש או לעשות משהו שישפר את מצב הרוח.',
        value: 'הסחת דעת',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        "השאלה בודקת את 'שפת התמיכה' הטבעית שלך, שהיא קריטית לדינמיקה זוגית.",
    },
  },
  // קוד להוספה:
  {
    worldId: 'PERSONALITY',
    id: 'personality_humor_type',
    category: 'personality',
    subcategory: 'social_communication',
    question: 'איזה סוג של חוש הומור הכי מדבר אליך? (בחר/י עד 2)',
    type: 'multiSelect',
    depth: 'ADVANCED',
    isRequired: false,
    minSelections: 1,
    maxSelections: 2,
    options: [
      { value: 'ציני ושנון', text: 'ציני ושנון' },
      { value: 'משחקי מילים', text: 'משחקי מילים' },
      { value: 'הומור מצבים (סיטקום)', text: 'הומור מצבים (סיטקום)' },
      { value: 'הומור עצמי', text: 'הומור עצמי' },
      { value: 'שטותניקי וקליל ("שטויות")', text: 'שטותניקי וקליל ("שטויות")' },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'התאמה בחוש הומור היא מפתח לכימיה וליכולת לצלוח את אתגרי החיים יחד.',
    },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_communication_style_revised',
    category: 'personality',
    subcategory: 'social_communication',
    question:
      "בשיחה חשובה, מהם ה'כלים' העיקריים שבהם את/ה משתמש/ת? חלק/י 100 נקודות בין הסגנונות הבאים:",
    type: 'budgetAllocation',
    depth: 'ADVANCED',
    isRequired: true,
    totalPoints: 100,
    categories: [
      { label: 'דיבור ישיר וברור', icon: <Target /> },
      { label: 'הקשבה אמפתית', icon: <HandHeart /> },
      { label: 'היגיון ועובדות', icon: <Brain /> },
      { label: 'הומור וקלילות', icon: <Smile /> },
      { label: 'פתיחות ושיתוף רגשי', icon: <Heart /> },
    ],
    metadata: {
      estimatedTime: 3,
      helpText:
        'חשוב/י על הדרך שבה את/ה בדרך כלל מנהל/ת שיחות משמעותיות, עם חברים, משפחה או בעבודה.',
    },
  },

  // --- חלק 5: סיכום ורפלקציה ---
  {
    worldId: 'PERSONALITY',
    id: 'personality_primary_motivation_revised',
    category: 'personality',
    subcategory: 'growth_aspirations',
    question:
      "מהו 'הדלק' הפנימי שלך? מהו הדבר המרכזי שנותן לך מוטיבציה לקום בבוקר?",
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: true,
    options: [
      {
        icon: <Star />,
        text: 'השגת מטרות והגשמה עצמית',
        value: 'השגת מטרות',
      },
      {
        icon: <Heart />,
        text: 'יצירת ובניית קשרים משמעותיים',
        value: 'יצירת קשרים',
      },
      {
        icon: <HandHeart />,
        text: 'השפעה חיובית ונתינה לאחרים',
        value: 'נתינה והשפעה',
      },
      {
        icon: <BookOpen />,
        text: 'סקרנות, למידה והבנת העולם',
        value: 'למידה וסקרנות',
      },
      {
        icon: <Sparkles />,
        text: 'יצירתיות וביטוי אישי',
        value: 'יצירתיות וביטוי',
      },
      {
        icon: <ShieldCheck />,
        text: 'בניית ביטחון, יציבות ושקט נפשי',
        value: 'ביטחון ויציבות',
      },
    ],
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'PERSONALITY',
    id: 'personality_strengths_and_weaknesses_revised',
    category: 'personality',
    subcategory: 'growth_aspirations',
    question:
      'ספר/י לנו על שתי תכונות שאת/ה ממש אוהב/ת בעצמך, ועל תכונה אחת שהיית רוצה לעבוד עליה ולשפר.',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 70,
    maxLength: 600,
    placeholder:
      'תכונות שאת/ה אוהב/ת: (לדוגמה: הנאמנות שלי, חוש ההומור שלי). תחום לשיפור: (לדוגמה: הייתי רוצה להיות פחות ביקורתי/ת כלפי עצמי).',
    metadata: {
      estimatedTime: 3,
      helpText:
        'מודעות עצמית היא אחת התכונות החשובות ביותר לזוגיות מוצלחת. הכנות שלך כאן היא מתנה עבורנו ועבורך.',
    },
  },
];
