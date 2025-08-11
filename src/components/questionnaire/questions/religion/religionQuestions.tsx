// src/components/questionnaire/questions/religion/religionQuestions.tsx
import { Question } from '../../types/types';
import {
  Scroll,
  BookOpen,
  Users,
  Home,
  Target,
  Scale,
  Heart,
  Sparkles,
  ShieldCheck,
  Flag,
  X,
  HandHeart,
  Lightbulb,
  Info,
  PocketKnife,
  Bed,
  Smile,
  Brain,
} from 'lucide-react';

export const religionQuestions: Question[] = [
  // --- חלק 1: זהות, אמונה והשקפה ---
{
    worldId: 'RELIGION',
    id: 'religion_core_feeling_of_faith', // ID חדש וייחודי
    category: 'religion',
    subcategory: 'identity_belief',
    question: 'מהי התחושה המרכזית שהאמונה והמסורת מעניקות לך בחייך?',
    type: 'iconChoice',
    depth: 'BASIC',
    isRequired: true,
    options: [
      {
        icon: <ShieldCheck />,
        text: 'ביטחון, יציבות וסדר בעולם',
        value: 'ביטחון ויציבות',
        description: 'המסורת נותנת לי עוגן, מסגרת ברורה ושקט נפשי.'
      },
      {
        icon: <Target />,
        text: 'משמעות, שייכות ומטרה',
        value: 'משמעות ושייכות',
        description: 'האמונה מחברת אותי לסיפור גדול יותר ונותנת כיוון לחיי.'
      },
      {
        icon: <Sparkles />,
        text: 'שמחה, הודיה והתרוממות רוח',
        value: 'שמחה והודיה',
        description: 'היהדות ממלאת את חיי באור, בחגיגיות ובהתלהבות.'
      },
      {
        icon: <Brain />,
        text: 'אתגר, צמיחה ולמידה מתמדת',
        value: 'אתגר וצמיחה',
        description: 'העיסוק ביהדות מאתגר אותי אינטלקטואלית ומוסרית ודוחף אותי להשתפר.'
      }
    ],
    metadata: {
      estimatedTime: 1,
      helpText: 'נסה/י לבחור את התחושה הדומיננטית ביותר. זוהי פתיחה מצוינת להבין את החיבור האישי שלך.'
    }
},
  {
    worldId: 'RELIGION',
    id: 'religion_my_personal_prayer', // שאלה חדשה
    category: 'religion',
    subcategory: 'personal_reflection',
    question:
      'אם היית צריך/ה לבחור תפילה, פרק תהילים או קטע הגות יהודי שמדבר אליך במיוחד, מה הוא היה, ובמשפט - למה?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 30,
    maxLength: 300,
    placeholder:
      "שתפ/י משהו שנוגע לליבך ומבטא את החיבור האישי שלך. למשל: 'מודה אני', 'אשת חיל', 'שמע ישראל'...",
    metadata: {
      estimatedTime: 2,
      helpText: 'התשובה כאן נותנת לנו הצצה יפהפיה לעולמך הרוחני הפנימי.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_rabbinic_guidance_role_revised',
    category: 'religion',
    subcategory: 'identity_belief',
    question:
      'מה מקומה של הדרכה רוחנית (רב, רבנית, יועץ/ת) בחייך כשאת/ה מתמודד/ת עם החלטות משמעותיות?',
    type: 'scale',
    depth: 'BASIC',
    isRequired: false,
    min: 1,
    max: 10,
    // --- שינוי כאן: הוספת תוויות ברורות יותר ---
    labels: {
      min: 'מחליט/ה בעצמי',
      max: 'תמיד מתייעץ/ת',
      middle: 'לפעמים, בנושאים כבדים',
    },
    metadata: {
      estimatedTime: 1,
      // --- שינוי כאן: הוספת טקסט עזרה כדי להבהיר את הסקאלה ---
      helpText:
        "1 = 'אני סומך/ת בעיקר על שיקול הדעת שלי'. 10 = 'התייעצות עם דמות רוחנית היא חלק בלתי נפרד מתהליך קבלת ההחלטות שלי'.",
    },
  },

  // --- חלק 2: הלכה למעשה - היומיום הדתי ---
  {
    worldId: 'RELIGION',
    id: 'religion_shabbat_experience', // שאלה חדשה
    category: 'religion',
    subcategory: 'practical_observance',
    question: 'מהי המהות או החוויה המרכזית שאת/ה מחפש/ת ומקבל/ת מהשבת?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: true,
    options: [
      { icon: <Home />, text: 'זמן למשפחה, לביחד ולשיח.', value: 'זמן משפחה' },
      {
        icon: <BookOpen />,
        text: 'זמן להתעלות רוחנית, תפילה ולימוד.',
        value: 'התעלות רוחנית',
      },
      {
        icon: <Bed />,
        text: 'זמן למנוחה פיזית ונפשית מהשבוע.',
        value: 'מנוחה והטענה',
      },
      {
        icon: <Users />,
        text: 'זמן לקהילה, לחברים ולאירוח.',
        value: 'חברה וקהילה',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        "שני אנשים יכולים לשמור שבת באותה רמה, אך לחוות אותה אחרת לגמרי. מהי 'חווית השבת' שלך?",
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_daily_spiritual_connection',
    category: 'religion',
    subcategory: 'practical_observance',
    question: 'כיצד את/ה מתחבר/ת לקב"ה ביומיום, מעבר לתפילות הפורמליות?',
    type: 'multiSelect',
    depth: 'ADVANCED',
    isRequired: false,
    minSelections: 1,
    maxSelections: 3,
    options: [
      { value: 'לימוד תורה', text: 'דרך לימוד תורה (גמרא, הלכה, מחשבה)' },
      { value: 'התבודדות ותפילה אישית', text: 'התבודדות ותפילה אישית' },
      { value: 'התבוננות בטבע', text: 'התבוננות בטבע ובהודיה על הבריאה' },
      { value: 'עשיית חסד', text: 'דרך עשיית חסד ונתינה' },
      { value: 'שירה וניגון', text: 'דרך שירה וניגון' },
    ],
    metadata: {
      estimatedTime: 1,
      helpText:
        'שאלה זו מבדילה בין קיום מצוות טכני לבין חיים רוחניים פנימיים ופעילים.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_kashrut_observance_details_revised',
    category: 'religion',
    subcategory: 'practical_observance',
    question:
      "כשרות היא עולם ומלואו. כדי שנבין את ה'סטנדרט' שלך, ספר/י לנו על שני דברים: סוג ההכשר שאת/ה סומך/ת עליו, ואיך את/ה נוהג/ת באכילה מחוץ לבית.",
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder:
      "לדוגמה: 'מקפיד/ה על בד\"צ מסוים, ובחוץ אוכל/ת רק במסעדות עם אותו הכשר', או 'סומך/ת על רבנות, וגמיש/ה יותר אצל חברים'.",
    metadata: { estimatedTime: 1 },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_modesty_personal_approach_revised',
    category: 'religion',
    subcategory: 'practical_observance',
    question:
      'צניעות היא מידה פנימית וחיצונית. כיצד היא באה לידי ביטוי בעולם שלך (לבוש, דיבור, התנהגות)?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder:
      "זו הזדמנות להסביר את הגישה האישית שלך מעבר להגדרות טכניות. למשל: סוג כיסוי ראש, סגנון לבוש, שמירת נגיעה וכו'.",
    metadata: { estimatedTime: 1 },
  },

  // --- חלק 3: קהילה, חברה וגבולות ---
  {
    worldId: 'RELIGION',
    id: 'religion_secular_culture_scenario', // שאלה חדשה
    category: 'religion',
    subcategory: 'community_influence',
    question:
      'חברים טובים מציעים ללכת יחד לסרט או הצגה שזכו לביקורות מעולות, אך תכניהם אינם תואמים לחלוטין את השקפת עולמך. מה סביר שתעשה/י?',
    type: 'iconChoice',
    depth: 'ADVANCED',
    isRequired: false,
    options: [
      {
        icon: <X />,
        text: 'אוותר בנימוס, זה קו אדום עבורי.',
        value: 'הימנעות',
      },
      {
        icon: <Info />,
        text: "אבדוק ביקורות וחוות דעת כדי להחליט אם זה 'עובר'.",
        value: 'סינון ובדיקה',
      },
      {
        icon: <Users />,
        text: 'אלך כדי להיות חלק מהחוויה החברתית.',
        value: 'הכלה חברתית',
      },
      {
        icon: <Smile />,
        text: 'אציע בכיף חלופה אחרת שמתאימה יותר לכולם.',
        value: 'הצעת חלופה',
      },
    ],
    metadata: {
      estimatedTime: 1,
      helpText: 'השאלה בוחנת את הגבולות והגמישות שלך במפגש עם התרבות הכללית.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_general_culture_consumption',
    category: 'religion',
    subcategory: 'community_influence',
    question:
      'מהי גישתך לצריכת תרבות כללית (סרטים, סדרות, מוזיקה) שאינה מגיעה מהעולם הדתי?',
    type: 'scale',
    depth: 'ADVANCED',
    isRequired: false,
    min: 1,
    max: 10,
    labels: { min: 'נמנע/ת כמעט לחלוטין', max: 'צורך/ת בחופשיות' },
    metadata: {
      estimatedTime: 1,
      helpText:
        'זוהי שאלה פרקטית המגדירה את מידת הפתיחות או השמרנות בחיי היומיום, ויכולה למנוע חיכוכים רבים.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_doubts_and_struggles', // שאלה חדשה
    category: 'religion',
    subcategory: 'identity_belief',
    question:
      'כיצד את/ה מתמודד/ת עם שאלות, ספקות או אתגרים באמונה, אם וכאשר הם עולים?',
    type: 'openText',
    depth: 'EXPERT',
    isRequired: false,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'למשל: האם את/ה מדחיק/ה, מתייעץ/ת עם רב/חברים, לומד/ת את הנושא לעומק, או מוצא/ת כוח באתגר?',
    metadata: {
      estimatedTime: 2,
      helpText:
        'אמונה בוגרת כוללת גם התמודדות עם שאלות. הכנות שלך כאן מלמדת על עומק ויושרה.',
    },
  },

  // --- חלק 4: חזון לבית יהודי ---
  {
    worldId: 'RELIGION',
    id: 'religion_partner_ideal_religious_profile_revised',
    category: 'religion',
    subcategory: 'relationship_family',
    question:
      "כדי לבנות בית על בסיס רוחני משותף, מהי 'נקודת המוצא' הדתית-רוחנית שהיית רוצה למצוא אצל בן/בת הזוג, שממנה תוכלו לצמוח יחד?",
    type: 'openText',
    depth: 'BASIC',
    isRequired: true,
    minLength: 40,
    maxLength: 400,
    placeholder:
      'נסה/י להיות כמה שיותר ספציפי/ת. מהם הדברים החשובים לך ביותר בהקשר זה? (רמה, השקפה, הקפדה)',
    metadata: {
      estimatedTime: 2,
      helpText:
        "הניסוח 'נקודת מוצא' מדגיש שזוגיות היא מסע. אנחנו מחפשים התאמה לנקודת ההתחלה של המסע המשותף.",
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_flexibility_religious_differences_partner_revised',
    category: 'religion',
    subcategory: 'relationship_family',
    question:
      'באיזו מידה את/ה פתוח/ה לגמישות ופשרה אם יתגלו פערים מסוימים בגישה ההלכתית או בהשקפה הדתית בינך לבין בן/בת הזוג?',
    type: 'scale',
    depth: 'ADVANCED',
    isRequired: true,
    min: 1,
    max: 10,
    labels: { min: 'מאוד מקובע/ת', max: 'מאוד גמיש/ה' },
    metadata: {
      estimatedTime: 1,
      helpText: 'חשוב/י על תחומים שבהם יש לך יותר או פחות מקום לגמישות.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_gender_roles_philosophy', // שאלה חדשה
    category: 'religion',
    subcategory: 'relationship_family',
    question:
      'בבניית בית יהודי, כיצד היית רואה את חלוקת האחריות בין גבר לאישה בתחומים השונים? חלק/י 100 נקודות בין הגישות:',
    type: 'budgetAllocation',
    depth: 'EXPERT',
    isRequired: false,
    totalPoints: 100,
    categories: [
      { label: 'חלוקה מסורתית מוגדרת', icon: <Scroll /> },
      { label: 'שותפות שוויונית מלאה', icon: <Scale /> },
      { label: 'חלוקה גמישה לפי כישרון ורצון', icon: <Sparkles /> },
    ],
    metadata: {
      estimatedTime: 2,
      helpText:
        'זו דרך מתוחכמת לשאול על נושא מורכב. אין פה תשובה נכונה, רק התאמה של השקפות עולם.',
    },
  },
  {
    worldId: 'RELIGION',
    id: 'religion_children_education_religious_vision_revised',
    category: 'religion',
    subcategory: 'relationship_family',
    question: 'מהו החזון שלך לאווירה הרוחנית ולחינוך הילדים בבית שתקים/י?',
    type: 'openText',
    depth: 'ADVANCED',
    isRequired: true,
    minLength: 50,
    maxLength: 500,
    placeholder:
      'לדוגמה: סוג מוסדות החינוך (ממ"ד, תורני, חרדי), אווירה בבית (פתוחה, שמרנית), דגש על ערכים ספציפיים.',
    metadata: { estimatedTime: 2 },
  },
];
