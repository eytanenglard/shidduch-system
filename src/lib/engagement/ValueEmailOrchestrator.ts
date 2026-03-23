// src/lib/engagement/ValueEmailOrchestrator.ts
//
// 🌟 ארכסטרטור מיילי ערך — שולח תוכן בעל ערך לכל היוזרים כל 3 ימים
//    10 מיילים בסדרה, כל אחד עם תוכן ייחודי ועמוק בנושאי זוגיות ושידוכים

import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import emailService from './emailService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValueEmailTip {
  number: string;
  title: string;
  body: string;
}

interface ValueEmailContent {
  id: string;                 // e.g. 'VALUE_1_TRUST'
  emailNumber: string;        // e.g. '1'
  subject: { he: string; en: string };
  headerEmoji: string;
  headerTitle: { he: string; en: string };
  headerSubtitle: { he: string; en: string };
  introText: { he: string; en: string };
  tips: { he: ValueEmailTip[]; en: ValueEmailTip[] };
  quoteText?: { he: string; en: string };
  quoteSource?: string;
  closingText: { he: string; en: string };
  ctaText: { he: string; en: string };
  ctaNote?: { he: string; en: string };
}

// ─── Email Content Library (10 Emails) ───────────────────────────────────────

const VALUE_EMAILS: ValueEmailContent[] = [
  {
    id: 'VALUE_1_TRUST',
    emailNumber: '1',
    subject: {
      he: '3 עקרונות שכל זוגיות מצליחה בנויה עליהם 💑',
      en: '3 Principles Every Successful Relationship Is Built On 💑',
    },
    headerEmoji: '💑',
    headerTitle: { he: '3 עקרונות לזוגיות מצליחה', en: '3 Principles of a Thriving Relationship' },
    headerSubtitle: { he: 'הבסיס שכל זוג חזק עומד עליו', en: 'The foundation every strong couple stands on' },
    introText: {
      he: 'חוקרים שחקרו אלפי זוגות לאורך עשרות שנים גילו שאין "תסריט אחד" לזוגיות מוצלחת — אבל יש שלושה עמודי תווך שמופיעים שוב ושוב אצל כל הזוגות המאושרים. אלו לא רומנטיקה, כסף, או מראה חיצוני. אלו משהו הרבה יותר עמוק.',
      en: 'Researchers who studied thousands of couples over decades discovered there\'s no single "script" for a successful relationship — but there are three pillars that appear again and again in every happy couple. These aren\'t romance, money, or looks. They\'re something much deeper.',
    },
    tips: {
      he: [
        { number: '1', title: 'אמון — הבסיס שאי אפשר בלעדיו', body: 'אמון אינו נבנה בדייט אחד. הוא נבנה בהתנהגות עקבית לאורך זמן — כשמה שאומרים מתאים למה שעושים. שאל את עצמך: האם אני אדם שמחזיק את מילתו? האם אני אמין ועקבי? זה מה שיבנה אמון בזוגיות שלך.' },
        { number: '2', title: 'תקשורת — לא לדבר בשביל לדבר', body: 'רוב הזוגות "מדברים" אבל מעטים באמת "מתקשרים". תקשורת אמיתית היא היכולת להביע צרכים ורגשות בלי האשמות, ולהקשיב לשני בלי לתכנן את התשובה בזמן שהוא מדבר. תרגלו כבר עכשיו, עוד לפני שמצאתם את השידוך הנכון.' },
        { number: '3', title: 'ערכים משותפים — המצפן המשותף', body: 'לא צריך להסכים על הכל — אבל על הדברים הגדולים חשוב שתהיה הלימה: ילדים, אורח חיים יהודי, יעדים בחיים, גישה לכסף. ערכים משותפים הם מה שמחזיק את הזוג ביחד כשהחיים מביאים אתגרים.' },
      ],
      en: [
        { number: '1', title: 'Trust — The Foundation You Can\'t Do Without', body: 'Trust isn\'t built in one date. It\'s built through consistent behavior over time — when what you say matches what you do. Ask yourself: Am I someone who keeps my word? Am I reliable and consistent? That\'s what will build trust in your relationship.' },
        { number: '2', title: 'Communication — Not Just Talking', body: 'Most couples "talk" but few truly "communicate." Real communication is the ability to express needs and feelings without blame, and to listen to your partner without planning your response while they\'re speaking. Practice this now, even before you find the right match.' },
        { number: '3', title: 'Shared Values — Your Shared Compass', body: 'You don\'t need to agree on everything — but on the big things, alignment is crucial: children, Jewish lifestyle, life goals, approach to finances. Shared values are what hold a couple together when life brings challenges.' },
      ],
    },
    quoteText: {
      he: 'כשאיש ואישה זוכים — שכינה ביניהם',
      en: 'When a man and woman merit it — the Divine Presence dwells between them',
    },
    quoteSource: 'תלמוד בבלי, סוטה יז',
    closingText: {
      he: 'הפרופיל שלך ב-NeshamaTech מאפשר לנו לזהות מי שחולק איתך את הערכים האלה. ככל שהפרופיל שלך מלא יותר — כך ה-AI שלנו יכול לעשות עבודה טובה יותר. 🎯',
      en: 'Your NeshamaTech profile allows us to identify who shares these values with you. The more complete your profile — the better our AI can work for you. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'פחות מ-5 דקות — ומשתלם מאוד', en: 'Less than 5 minutes — and totally worth it' },
  },

  {
    id: 'VALUE_2_SELF_GROWTH',
    emailNumber: '2',
    subject: {
      he: 'לפני שמחפשים — לעבוד על עצמך 🌱',
      en: 'Before You Search — Work on Yourself 🌱',
    },
    headerEmoji: '🌱',
    headerTitle: { he: 'הבסיס המנצח: לפני שמחפשים', en: 'The Winning Foundation: Before You Search' },
    headerSubtitle: { he: 'מה שהצד השני יראה בך — לפני הפגישה הראשונה', en: 'What the other side sees in you — before the first meeting' },
    introText: {
      he: 'יש אמרה ידועה: "אם אתה רוצה אדם מיוחד — תהיה אדם מיוחד." זה לא כלל אצבע — זו מציאות. כשאנחנו עובדים על עצמנו, אנחנו מושכים אנשים שנמצאים באותה רמה. הנה שלושה תחומים שכדאי לחזק לפני ובמהלך חיפוש השידוך.',
      en: 'There\'s a well-known saying: "If you want someone special — be someone special." This isn\'t just a rule of thumb — it\'s reality. When we work on ourselves, we attract people at the same level. Here are three areas worth strengthening before and during the search.',
    },
    tips: {
      he: [
        { number: '1', title: 'הכר את עצמך — מי אתה באמת?', body: 'לפני שאתה מחפש "מה שאתה רוצה בבן/בת הזוג", שאל: מה הכוחות שלי? מה החולשות שלי? מה הצרכים הרגשיים שלי? אנשים שמכירים את עצמם טוב יותר — בוחרים טוב יותר. ולא פחות חשוב: מדברים על עצמם בבהירות.' },
        { number: '2', title: 'עבד על הבריאות הרגשית שלך', body: 'בריאות רגשית לא אומרת שאין לך פחדים או חסמים — אלא שאתה מודע להם ועובד עליהם. פגישות עם מטפל/ת, קריאה, שיחות עם חברים קרובים — כל אלו מחזקים אותך ומכינים אותך לזוגיות בריאה.' },
        { number: '3', title: 'פתח חיים מלאים — לא "חיים בהמתנה"', body: 'הטעות הנפוצה ביותר: לחיות בהמתנה לשידוך. אנשים שחיים חיים מלאים — עם תחביבים, חברויות, קריירה, תרומה לקהילה — הם אנשים שמעניינים. וחשוב לא פחות: הם מאושרים יותר בכל שלב של הדרך.' },
      ],
      en: [
        { number: '1', title: 'Know Yourself — Who Are You Really?', body: 'Before you search for "what you want in a partner," ask: What are my strengths? My weaknesses? My emotional needs? People who know themselves better — choose better. And just as importantly: they speak about themselves with clarity.' },
        { number: '2', title: 'Work on Your Emotional Health', body: 'Emotional health doesn\'t mean having no fears or blocks — it means being aware of them and working on them. Sessions with a therapist, reading, conversations with close friends — all these strengthen you and prepare you for a healthy relationship.' },
        { number: '3', title: 'Build a Full Life — Not a "Waiting Life"', body: 'The most common mistake: living in waiting for a match. People who live full lives — with hobbies, friendships, career, community contribution — are interesting people. And just as importantly: they\'re happier at every stage of the journey.' },
      ],
    },
    quoteText: {
      he: 'אל תחפש אדם שיעשה אותך שלם — תהיה שלם, ותמצא אדם שיצטרף אליך',
      en: 'Don\'t look for someone to complete you — be complete, and find someone to join you',
    },
    closingText: {
      he: 'ב-NeshamaTech, ה-AI שלנו לא רק מתאים — הוא גם מזהה מה בפרופיל שלך יכול להיות חזק יותר. השאלון שלנו מיועד לעזור לך להכיר את עצמך טוב יותר ❤️',
      en: 'At NeshamaTech, our AI doesn\'t just match — it also identifies what in your profile could be stronger. Our questionnaire is designed to help you know yourself better ❤️',
    },
    ctaText: { he: 'למלא את השאלון שלי', en: 'Complete My Questionnaire' },
    ctaNote: { he: 'זה משתלם — גם עבורך וגם עבור ההתאמות שלך', en: 'Worth it — for you and for your matches' },
  },

  {
    id: 'VALUE_3_FIRST_DATE',
    emailNumber: '3',
    subject: {
      he: '5 טיפים לדייט ראשון שיהיה בלתי נשכח ✨',
      en: '5 Tips for an Unforgettable First Date ✨',
    },
    headerEmoji: '✨',
    headerTitle: { he: 'דייט ראשון מנצח', en: 'A Winning First Date' },
    headerSubtitle: { he: 'מהטיפ הראשון שלנו — עד הדייט שלך', en: 'From our first tip — to your date' },
    introText: {
      he: 'הדייט הראשון הוא ה"מבחן הראשון" — לא בשביל לדעת אם תתחתנו, אלא בשביל לבדוק האם כדאי לפגוש שוב. הלחץ שאנחנו לפעמים שמים על פגישות ראשונות הוא גדול מדי. הנה 5 טיפים שיהפכו את הדייט שלך לנעים, טבעי, ומוצלח.',
      en: 'The first date is the "first test" — not to know if you\'ll marry, but to check whether it\'s worth meeting again. The pressure we sometimes put on first meetings is too great. Here are 5 tips to make your date pleasant, natural, and successful.',
    },
    tips: {
      he: [
        { number: '1', title: 'הגע עם סקרנות, לא עם מבחן', body: 'הטעות הנפוצה: להגיע לדייט כאילו יש רשימת "קריטריונים" לסמן. במקום זה, בוא עם שאלה אחת בראש: "מה מעניין אצל האדם הזה?" סקרנות אמיתית מחברת.' },
        { number: '2', title: 'שאל שאלות שפותחות', body: 'שאלות של "כן/לא" סוגרות שיחה. שאלות כמו "מה הכי אהבת בשנה האחרונה?", "מה גרם לך לחייך לאחרונה?", "מה אתה/ת כותב/ת אם היית כותב ספר?" — פותחות עולמות.' },
        { number: '3', title: 'היה נוכח — הכנס את הטלפון', body: 'נוכחות מלאה היא אחד המתנות הגדולות שאפשר לתת. כשאתה עם מישהו — תהיה שם, לא בטלפון, לא בדאגות. אנשים מרגישים כשמקשיבים להם באמת.' },
        { number: '4', title: 'שתף משהו אמיתי', body: 'אין צורך לפתוח עם הכל — אבל שיתוף אחד אמיתי ופגיע יוצר קשר מהיר יותר מכל השיחה הקטנה בעולם. זה לא חולשה — זו אמינות.' },
        { number: '5', title: 'אל תחליט ב-5 דקות הראשונות', body: 'המוח שלנו מקבל החלטות מהירות שלא תמיד נכונות. תן לדייט זמן להתפתח. לפעמים האנשים הכי מדהימים דורשים קצת חימום.' },
      ],
      en: [
        { number: '1', title: 'Arrive with Curiosity, Not a Checklist', body: 'The common mistake: arriving as if there\'s a list of "criteria" to check off. Instead, come with one question in mind: "What\'s interesting about this person?" Real curiosity connects.' },
        { number: '2', title: 'Ask Questions That Open Up', body: '"Yes/No" questions close conversation. Questions like "What did you love most this past year?", "What made you smile recently?", "What would you write if you wrote a book?" — open worlds.' },
        { number: '3', title: 'Be Present — Put Away Your Phone', body: 'Full presence is one of the greatest gifts you can give. When you\'re with someone — be there, not on your phone, not in your worries. People feel when they\'re truly being listened to.' },
        { number: '4', title: 'Share Something Real', body: 'No need to share everything — but one real, vulnerable share creates connection faster than all the small talk in the world. It\'s not weakness — it\'s authenticity.' },
        { number: '5', title: 'Don\'t Decide in the First 5 Minutes', body: 'Our brains make fast decisions that aren\'t always right. Give the date time to develop. Sometimes the most amazing people need a little warming up.' },
      ],
    },
    closingText: {
      he: 'כשההצעה הנכונה תגיע דרך NeshamaTech, תהיה מוכן/ה לדייט הכי טוב שלך 😊',
      en: 'When the right suggestion comes through NeshamaTech, you\'ll be ready for your best date 😊',
    },
    ctaText: { he: 'לראות את ההתאמות שלי', en: 'See My Matches' },
  },

  {
    id: 'VALUE_4_WHAT_MATTERS',
    emailNumber: '4',
    subject: {
      he: 'מה באמת חשוב בבן/בת הזוג? 💎',
      en: 'What Really Matters in a Partner? 💎',
    },
    headerEmoji: '💎',
    headerTitle: { he: 'מה באמת חשוב', en: 'What Really Matters' },
    headerSubtitle: { he: 'מעבר לרשימת הדרישות', en: 'Beyond the wish list' },
    introText: {
      he: 'כשמבקשים מאנשים לכתוב רשימת דרישות מבן/בת הזוג, הם לרוב כותבים: מראה, גובה, לימודים, הכנסה. אבל כשמסתכלים על זוגות שמחים לאורך עשרות שנים — מה שהם אומרים שהחשיב ביותר הוא שונה לגמרי.',
      en: 'When people are asked to write a list of requirements from a partner, they usually write: looks, height, education, income. But when you look at happy couples over decades — what they say mattered most is completely different.',
    },
    tips: {
      he: [
        { number: '1', title: 'מידות — לא תואר', body: 'אדם ישר, אמפתי, ואחראי — שווה יותר מאדם מצליח שחסרות לו מידות טובות. האם הוא/היא מתנהג/ת יפה עם מלצרים? האם הוא/היא מחזיק/ה בהתחייבויות קטנות? אלו הסימנים האמיתיים.' },
        { number: '2', title: 'גמישות וצמיחה', body: 'אחד הגורמים החזקים ביותר לזוגיות מאושרת הוא היכולת לצמוח יחד. שאל: האם האדם הזה פתוח ללמוד? האם הוא/היא מוכן/ה לשנות דעה? אנשים גמישים מתמודדים טוב יותר עם אתגרי החיים המשותפים.' },
        { number: '3', title: 'כימיה — אבל לא כפי שחשבתם', body: 'כימיה אמיתית היא לא רק ״ניצוצות״ בפגישה הראשונה. זה תחושת הנוחות שיש לך להיות עצמך, הכיף שיש לבלות ביחד, העניין שאתה מרגיש בסיפורים שלו/ה. כימיה כזו לפעמים מתפתחת עם הזמן.' },
      ],
      en: [
        { number: '1', title: 'Character — Not a Degree', body: 'A honest, empathetic, responsible person — is worth more than a successful person lacking good character. Does he/she treat waiters kindly? Does he/she keep small commitments? These are the real signs.' },
        { number: '2', title: 'Flexibility and Growth', body: 'One of the strongest factors in a happy relationship is the ability to grow together. Ask: Is this person open to learning? Are they willing to change their mind? Flexible people handle the challenges of shared life better.' },
        { number: '3', title: 'Chemistry — But Not How You Think', body: 'Real chemistry isn\'t just "sparks" at the first meeting. It\'s the comfort you feel being yourself, the fun in spending time together, the interest you feel in their stories. This kind of chemistry sometimes develops over time.' },
      ],
    },
    quoteText: {
      he: 'לא הנאה ולא פחד הם הבסיס לזוגיות — אלא כבוד הדדי',
      en: 'Not pleasure nor fear is the foundation of a relationship — but mutual respect',
    },
    closingText: {
      he: 'ה-AI של NeshamaTech מחשב התאמה על בסיס ערכים, אופי, ואורח חיים — לא רק דמוגרפיה. זו הסיבה שהשאלון שלנו כל כך חשוב 🧠',
      en: 'NeshamaTech\'s AI calculates compatibility based on values, character, and lifestyle — not just demographics. That\'s why our questionnaire is so important 🧠',
    },
    ctaText: { he: 'להשלים את השאלון', en: 'Complete the Questionnaire' },
  },

  {
    id: 'VALUE_5_COMMUNICATION',
    emailNumber: '5',
    subject: {
      he: 'איך לדבר כדי שישמעו אתכם 🗣️',
      en: 'How to Speak So You\'re Heard 🗣️',
    },
    headerEmoji: '🗣️',
    headerTitle: { he: 'תקשורת שמחברת', en: 'Communication That Connects' },
    headerSubtitle: { he: 'כלים פרקטיים שמחזקים כל זוגיות', en: 'Practical tools that strengthen any relationship' },
    introText: {
      he: 'מחקרים מראים שהגורם מספר אחד לגירושים הוא לא בגידה, לא כסף, ולא חילוקי דעות — אלא חוסר תקשורת. אבל הבשורה הטובה: תקשורת היא מיומנות שאפשר ללמוד ולשפר. הנה שלושה כלים שפועלים.',
      en: 'Research shows that the number one cause of divorce isn\'t infidelity, money, or disagreements — but lack of communication. But the good news: communication is a skill that can be learned and improved. Here are three tools that work.',
    },
    tips: {
      he: [
        { number: '1', title: 'דבר על "אני", לא על "אתה"', body: 'במקום: "אתה תמיד מאחר!" — "כשאתה מאחר, אני מרגיש/ה שזמני לא מוערך." ההבדל הוא עצום. "הודעות אני" מביעות רגש בלי תוקפנות ובלי הגנה. הצד השני מסתגר פחות ושומע יותר.' },
        { number: '2', title: 'הקשבה פעילה — לא להמתין לתורך לדבר', body: 'תרגיל: בשיחה הבאה שלך, נסה להרגיש מתי אתה מתחיל לתכנן את תשובתך בזמן שהאחר עדיין מדבר. זה רגע שבו הפסקת להקשיב. הקשבה אמיתית פירושה: לשמוע, לאשר, ורק אז לענות.' },
        { number: '3', title: 'אמר / שמע — לא אותו הדבר', body: 'טעות נפוצה: לחשוב שמה שאמרת הוא מה שהשני שמע. תרגיל פשוט: לאחר הסבר חשוב, שאל "מה הבנת ממה שאמרתי?" — לא בצורה מלחיצה, אלא מתוך רצון לוודא שיש הבנה משותפת.' },
      ],
      en: [
        { number: '1', title: 'Speak About "I", Not "You"', body: 'Instead of: "You\'re always late!" — "When you\'re late, I feel like my time isn\'t valued." The difference is enormous. "I messages" express emotion without aggression and without defense. The other side closes down less and hears more.' },
        { number: '2', title: 'Active Listening — Not Waiting for Your Turn to Speak', body: 'Exercise: In your next conversation, try to notice when you start planning your response while the other person is still speaking. That\'s the moment you stopped listening. Real listening means: hear, acknowledge, then respond.' },
        { number: '3', title: 'Said / Heard — Not the Same Thing', body: 'Common mistake: thinking what you said is what the other person heard. Simple exercise: after an important explanation, ask "What did you understand from what I said?" — not in a pressuring way, but out of a desire to ensure shared understanding.' },
      ],
    },
    closingText: {
      he: 'כשתפגשו את ההתאמה שלכם דרך NeshamaTech — תהיו מצוידים בכלים לבניית תקשורת חזקה מהיום הראשון 💪',
      en: 'When you meet your match through NeshamaTech — you\'ll be equipped with tools to build strong communication from day one 💪',
    },
    ctaText: { he: 'לפרופיל שלי', en: 'My Profile' },
  },

  {
    id: 'VALUE_6_JEWISH_HOME',
    emailNumber: '6',
    subject: {
      he: 'הבית היהודי — ערכים שמחזיקים לנצח 🕯️',
      en: 'The Jewish Home — Values That Last Forever 🕯️',
    },
    headerEmoji: '🕯️',
    headerTitle: { he: 'הבית היהודי', en: 'The Jewish Home' },
    headerSubtitle: { he: 'ערכים עתיקים שרלוונטיים תמיד', en: 'Ancient values that are always relevant' },
    introText: {
      he: 'המסורת היהודית נושאת בתוכה חוכמה עמוקה על בניית בית וזוגיות. ערכים שנצברו על פני אלפי שנים — ועדיין רלוונטיים לחיינו כיום. הנה שלושה מהם שנדמה לי שיגעו בך.',
      en: 'Jewish tradition carries within it deep wisdom about building a home and a relationship. Values accumulated over thousands of years — and still relevant to our lives today. Here are three that I think will resonate with you.',
    },
    tips: {
      he: [
        { number: '1', title: 'שלום בית — לא שלום מדומה', body: 'שלום בית לא אומר להסכים על הכל. זה אומר להחליט יחד שהשלום ביניכם חשוב יותר מ"לנצח" בוויכוח. זה אומר לבחור כל פעם מחדש בקשר — גם ברגעים הקשים. זו בחירה יומיומית.' },
        { number: '2', title: 'חסד — לתת בלי לספור', body: 'חסד בזוגיות הוא ה"מתנות הקטנות" שלא מחכות לאירועים גדולים. כוס קפה שמורה לפני שהשני קם, שאלה "איך היה לך היום" ואז באמת להאזין, הכרת תודה על הדברים הקטנים. חסד יומיומי הוא הדלק של הזוגיות.' },
        { number: '3', title: 'עונג שבת — זמן מוגן לקשר', body: 'השבת נותנת מבנה לזוגיות: זמן ללא הסחות דעת, שולחן משפחתי, שיחות בלי מסכים. הזוגות המאושרים ביותר — בכל הדתות — הם אלו שמאפשרים לעצמם "שבת" כלשהי: זמן מוגן ומוקדש לקשר.' },
      ],
      en: [
        { number: '1', title: 'Shalom Bayit — Not False Peace', body: 'Shalom Bayit doesn\'t mean agreeing on everything. It means deciding together that the peace between you is more important than "winning" an argument. It means choosing the relationship again and again — even in difficult moments. It\'s a daily choice.' },
        { number: '2', title: 'Chesed — Giving Without Counting', body: 'Chesed in a relationship is the "little gifts" that don\'t wait for big occasions. A cup of coffee waiting before the other wakes up, asking "how was your day" and then actually listening, gratitude for small things. Daily chesed is the fuel of a relationship.' },
        { number: '3', title: 'Shabbat — Protected Time for Connection', body: 'Shabbat gives structure to a relationship: time without distractions, a family table, conversations without screens. The happiest couples — across all faiths — are those who allow themselves some form of "Shabbat": protected time dedicated to connection.' },
      ],
    },
    quoteText: {
      he: 'בית שיש בו שלום — יש בו ברכה',
      en: 'A home that has peace — has blessing',
    },
    quoteSource: 'ספר החינוך',
    closingText: {
      he: 'NeshamaTech מחברת אנשים שחולקים ערכים יהודיים ואורח חיים. בפרופיל שלך יש מקום לציין מה חשוב לך — תשתמש בו 🙏',
      en: 'NeshamaTech connects people who share Jewish values and a way of life. Your profile has space to indicate what\'s important to you — use it 🙏',
    },
    ctaText: { he: 'לעדכן את הערכים שלי בפרופיל', en: 'Update My Values in Profile' },
  },

  {
    id: 'VALUE_7_PATIENCE',
    emailNumber: '7',
    subject: {
      he: 'סבלנות בשידוכים — חוכמה עתיקה לעידן מהיר ⏳',
      en: 'Patience in Shidduchim — Ancient Wisdom for a Fast Age ⏳',
    },
    headerEmoji: '⏳',
    headerTitle: { he: 'סבלנות ואמונה בתהליך', en: 'Patience and Faith in the Process' },
    headerSubtitle: { he: 'למה "לאט" זה לא "עצור"', en: 'Why "slow" isn\'t "stopped"' },
    introText: {
      he: 'אנחנו חיים בעידן של מיידיות: הזמנה מגיעה תוך שעות, שיחות נענות תוך שניות, ואפליקציות מבטיחות "match" תוך דקה. ולכן, כשתהליך השידוך לוקח זמן — זה מרגיש כישלון. אבל האמת היא הפוכה.',
      en: 'We live in an age of immediacy: orders arrive within hours, messages are answered within seconds, and apps promise a "match" within minutes. And so, when the matchmaking process takes time — it feels like failure. But the truth is the opposite.',
    },
    tips: {
      he: [
        { number: '1', title: 'לכל דבר יש עיתו', body: 'המסורת היהודית מלמדת שהתזמון אינו בידינו לגמרי. "ארבעים יום לפני יצירת הולד — בת קול יוצאת ואומרת: בת פלוני לפלוני." זה לא אומר לחכות בלי לפעול — אלא לפעול ולסמוך שהתזמון הנכון יגיע.' },
        { number: '2', title: 'כל "לא" מקרב לכן"', body: 'כל הצעה שלא התאימה היא לא כישלון — היא מידע. היא מלמדת אותך משהו על עצמך, על מה שאתה מחפש, ועל מה שחשוב לך. הדרך לשידוך הנכון עוברת לעתים דרך כמה שאינם נכונים.' },
        { number: '3', title: 'איכות > מהירות', body: 'בניגוד לדעה הרווחת, יותר תאריכים ≠ יותר סיכויים. מחקרים מראים שאנשים שנותנים לכל מפגש "הזדמנות אמיתית" — מצליחים יותר מאלו שנעים מהר מהצעה להצעה. האיכות של הנוכחות שלך בתהליך חשובה יותר מהכמות.' },
      ],
      en: [
        { number: '1', title: 'Everything Has Its Time', body: 'Jewish tradition teaches that timing is not entirely in our hands. "Forty days before the creation of a child — a divine voice goes forth and says: the daughter of so-and-so for so-and-so." This doesn\'t mean waiting without acting — but acting and trusting that the right timing will come.' },
        { number: '2', title: 'Every "No" Brings You Closer to "Yes"', body: 'Every suggestion that didn\'t work out is not failure — it\'s information. It teaches you something about yourself, about what you\'re looking for, and about what\'s important to you. The path to the right match sometimes passes through some wrong ones.' },
        { number: '3', title: 'Quality > Speed', body: 'Contrary to popular belief, more dates ≠ more chances. Studies show that people who give each meeting a "real chance" — succeed more than those who move quickly from suggestion to suggestion. The quality of your presence in the process matters more than the quantity.' },
      ],
    },
    quoteText: {
      he: 'מי שמחכה בסבלנות — ידע כשהגיע מה שחיכה לו',
      en: 'One who waits with patience — will know when what they waited for has arrived',
    },
    closingText: {
      he: 'אנחנו ב-NeshamaTech עובדים בשבילך גם כשאתה לא מסתכל — הבינה המלאכותית שלנו סורקת כל יום ומחפשת לך את ההתאמה הנכונה. בינתיים — תמשיך להשלים את הפרופיל 🌟',
      en: 'We at NeshamaTech work for you even when you\'re not looking — our AI scans every day searching for the right match for you. In the meantime — keep completing your profile 🌟',
    },
    ctaText: { he: 'לראות מה חדש', en: 'See What\'s New' },
  },

  {
    id: 'VALUE_8_AUTHENTICITY',
    emailNumber: '8',
    subject: {
      he: 'להיות אמיתי — הכוח הנסתר שמושך 🎭',
      en: 'Being Authentic — The Hidden Power That Attracts 🎭',
    },
    headerEmoji: '🎭',
    headerTitle: { he: 'האמיתי מנצח תמיד', en: 'The Authentic Always Wins' },
    headerSubtitle: { he: 'למה "להיות עצמך" זו אסטרטגיה, לא קלישאה', en: 'Why "being yourself" is a strategy, not a cliché' },
    introText: {
      he: 'אנחנו חיים בעולם של מיתוג עצמי, פילטרים, ופרזנטציה מושלמת. בשידוכים זה אפילו יותר מוחש — כולם שמים את הגרסה הטובה ביותר שלהם קדימה. אבל דווקא שם, האמיתיות הופכת לנשק הכי חזק שלך.',
      en: 'We live in a world of personal branding, filters, and perfect presentation. In shidduchim this is even more palpable — everyone puts their best version forward. But precisely there, authenticity becomes your strongest weapon.',
    },
    tips: {
      he: [
        { number: '1', title: 'אמיתי ≠ חשיפה מלאה', body: 'להיות אמיתי לא אומר לספר הכל בפגישה הראשונה. זה אומר: לא להציג גרסה שאינה אתה, לא להסכים לדברים שלא מתאימים לך, לא להדחיק את מה שאתה מרגיש. אמיתיות היא עקביות בין הפנים לחוץ.' },
        { number: '2', title: 'החולשות שלך הן החיבור שלך', body: 'מחקרים (ב"רנה בראון" ואחרים) מראים שוב ושוב: אנשים מתחברים לאנשים אמיתיים — לא לאנשים מושלמים. חולשה שמדברים עליה ביושר מייצרת חיבור הרבה יותר מחוזקות מוצגות.' },
        { number: '3', title: 'הפרופיל שלך — הביטוי הראשון של האמיתיות שלך', body: 'הפרופיל שלך ב-NeshamaTech הוא ההזדמנות הראשונה שלך להיות אמיתי. פרופיל שמשקף מי אתה באמת — ימשוך אנשים שמתאימים לאמיתי שבך, לא לגרסה המבריקה.' },
      ],
      en: [
        { number: '1', title: 'Authentic ≠ Full Disclosure', body: 'Being authentic doesn\'t mean telling everything on the first meeting. It means: not presenting a version that isn\'t you, not agreeing to things that don\'t fit you, not suppressing what you feel. Authenticity is consistency between inside and outside.' },
        { number: '2', title: 'Your Vulnerabilities Are Your Connection', body: 'Research (Brené Brown and others) shows again and again: people connect to real people — not perfect people. A weakness spoken about honestly creates far more connection than presented strengths.' },
        { number: '3', title: 'Your Profile — The First Expression of Your Authenticity', body: 'Your NeshamaTech profile is your first opportunity to be authentic. A profile that reflects who you really are — will attract people who fit the real you, not the polished version.' },
      ],
    },
    closingText: {
      he: 'ב-NeshamaTech יש לנו שאלון שעוזר לך לבטא מי אתה באמת — לא רק מה אתה מחפש. זה כלי חשוב מאוד. אם עוד לא מילאת אותו — מחכה לך שם ❤️',
      en: 'At NeshamaTech we have a questionnaire that helps you express who you really are — not just what you\'re looking for. It\'s a very important tool. If you haven\'t filled it out yet — it\'s waiting for you there ❤️',
    },
    ctaText: { he: 'למלא את השאלון', en: 'Fill the Questionnaire' },
  },

  {
    id: 'VALUE_9_READINESS',
    emailNumber: '9',
    subject: {
      he: '5 סימנים שאתה/ת מוכן/ה לבנות בית ✅',
      en: '5 Signs You\'re Ready to Build a Home ✅',
    },
    headerEmoji: '✅',
    headerTitle: { he: '5 סימנים לבשלות רגשית', en: '5 Signs of Emotional Readiness' },
    headerSubtitle: { he: 'בשלות לא קשורה לגיל', en: 'Readiness has nothing to do with age' },
    introText: {
      he: 'אחת השאלות שאנשים פחות שואלים את עצמם לפני שידוך — היא לא "האם מצאתי את הנכון/ה?" אלא "האם אני עצמי נכון/ה לזה?" בשלות לנישואים היא לא עניין של גיל — היא עניין של מצב רגשי ונפשי. הנה 5 סימנים שמצביעים עליה.',
      en: 'One of the questions people ask themselves less before a match — is not "Did I find the right one?" but "Am I myself ready for this?" Readiness for marriage is not a matter of age — it\'s a matter of emotional and mental state. Here are 5 signs that point to it.',
    },
    tips: {
      he: [
        { number: '1', title: 'אתה/ת מסוגל/ת לחיות עם "לא מושלם"', body: 'אדם בשל יודע שאין שידוך מושלם — ובוחר לבנות עם מישהו טוב, לא לחכות למישהו מושלם. היכולת לקבל פגמים ולעבוד עימהם היא סימן בשלות חשוב.' },
        { number: '2', title: 'אתה/ת יכול/ה לדחות סיפוק מיידי', body: 'זוגיות דורשת לפעמים לוותר על מה שרצית עכשיו למה שטוב לשניכם בטווח הארוך. היכולת לדחות סיפוק — לפשרה, לסבלנות, לתכנון משותף — היא כוח זוגי.' },
        { number: '3', title: 'אתה/ת לוקח/ת אחריות על הרגשות שלך', body: 'אדם בשל רגשית לא מאשים את הצד השני בכל רגש שלו. הוא/היא יודע/ת לזהות: "זה מה שאני מרגיש, ואני אחראי/ת לרגש הזה." זה שינוי עצום בדינמיקת הזוגיות.' },
        { number: '4', title: 'יש לך מרחב לאחר בחייך', body: 'זוגיות בריאה דורשת שני אנשים עם חיים עצמאיים שרוצים לבנות משהו יחד — לא שניים שמחפשים אחד בשני להשלים חלל. האם יש לך חיים, חברויות, תחביבים, זהות עצמאית?' },
        { number: '5', title: 'אתה/ת יכול/ה לומר "טעיתי"', body: 'אחד הסימנים החזקים לבשלות: היכולת להודות בטעות בלי להתמוטט. בזוגיות זה חיוני. אדם שלא מסוגל לאמר "טעיתי" — יוצר קשיים גדולים בכל מערכת יחסים.' },
      ],
      en: [
        { number: '1', title: 'You Can Live with "Not Perfect"', body: 'A mature person knows there\'s no perfect match — and chooses to build with someone good, not wait for someone perfect. The ability to accept flaws and work with them is an important sign of maturity.' },
        { number: '2', title: 'You Can Delay Immediate Gratification', body: 'A relationship sometimes requires giving up what you wanted now for what\'s good for both of you in the long run. The ability to delay gratification — for compromise, patience, joint planning — is relational strength.' },
        { number: '3', title: 'You Take Responsibility for Your Emotions', body: 'An emotionally mature person doesn\'t blame the other for all their feelings. They know how to identify: "This is what I feel, and I\'m responsible for this feeling." This is an enormous shift in relationship dynamics.' },
        { number: '4', title: 'You Have Space for Another in Your Life', body: 'A healthy relationship requires two people with independent lives who want to build something together — not two people looking to fill a void in each other. Do you have a life, friendships, hobbies, an independent identity?' },
        { number: '5', title: 'You Can Say "I Was Wrong"', body: 'One of the strongest signs of maturity: the ability to admit a mistake without collapsing. In a relationship this is essential. A person who can\'t say "I was wrong" — creates major difficulties in any relationship.' },
      ],
    },
    closingText: {
      he: 'זה לא תמיד קל לענות על השאלות האלה ביושר — אבל זו עבודה שמשתלמת. ב-NeshamaTech, השאלון שלנו עוזר לך לחקור את עצמך ולבנות פרופיל שמשקף את הבשלות שלך 🌟',
      en: 'It\'s not always easy to answer these questions honestly — but it\'s work that pays off. At NeshamaTech, our questionnaire helps you explore yourself and build a profile that reflects your maturity 🌟',
    },
    ctaText: { he: 'לבדוק את הפרופיל שלי', en: 'Check My Profile' },
  },

  {
    id: 'VALUE_10_HOW_AI_HELPS',
    emailNumber: '10',
    subject: {
      he: 'איך ה-AI שלנו מוצא לך את ההתאמה הנכונה 🤖',
      en: 'How Our AI Finds the Right Match for You 🤖',
    },
    headerEmoji: '🤖',
    headerTitle: { he: 'הטכנולוגיה שעובדת בשבילך', en: 'The Technology Working For You' },
    headerSubtitle: { he: 'מה קורה מאחורי הקלעים ב-NeshamaTech', en: 'What happens behind the scenes at NeshamaTech' },
    introText: {
      he: 'רוב פלטפורמות השידוכים מסתמכות על אלגוריתם פשוט: גיל, גובה, ומרחק. NeshamaTech עובדת אחרת. הנה מה שקורה מאחורי הקלעים — ולמה זה עושה הבדל.',
      en: 'Most matchmaking platforms rely on a simple algorithm: age, height, and distance. NeshamaTech works differently. Here\'s what happens behind the scenes — and why it makes a difference.',
    },
    tips: {
      he: [
        { number: '1', title: 'ניתוח 5 עולמות', body: 'השאלון שלנו בוחן 5 "עולמות": אישיות, ערכים, אורח חיים, משפחה, ועתיד. כל תשובה בונה "טביעת אצבע" ייחודית שלך. ה-AI עורך השוואה מעמיקה בין הטביעות האלו — לא רק פרמטרים גסים.' },
        { number: '2', title: 'התאמה וקטורית', body: 'כל פרופיל מומר ל"וקטור" — ייצוג מתמטי של כל מי שאתה. ה-AI מוצא פרופילים שהוקטורים שלהם "קרובים" לשלך — כלומר, אנשים שדומים לך בצורה שאלגוריתם פשוט לא יכול לזהות.' },
        { number: '3', title: 'הגורם האנושי — השדכן', body: 'ה-AI הוא כלי — לא תחליף לשדכן. המערכת שלנו מציגה לשדכנים את ההתאמות הכי חכמות ומדויקות, והם מביאים את ההבנה האנושית שהאלגוריתם לא יכול. זה שילוב של הטוב מכל עולם.' },
      ],
      en: [
        { number: '1', title: '5-Worlds Analysis', body: 'Our questionnaire examines 5 "worlds": personality, values, lifestyle, family, and future. Each answer builds your unique "fingerprint." The AI makes a deep comparison between these fingerprints — not just crude parameters.' },
        { number: '2', title: 'Vector Matching', body: 'Each profile is converted to a "vector" — a mathematical representation of who you are. The AI finds profiles whose vectors are "close" to yours — meaning, people similar to you in a way a simple algorithm cannot identify.' },
        { number: '3', title: 'The Human Factor — The Matchmaker', body: 'The AI is a tool — not a replacement for a matchmaker. Our system presents matchmakers with the smartest and most precise matches, and they bring the human understanding that the algorithm cannot. It\'s the best of both worlds.' },
      ],
    },
    quoteText: {
      he: 'טכנולוגיה בשירות הלב — זו הפילוסופיה של NeshamaTech',
      en: 'Technology in service of the heart — that\'s the philosophy of NeshamaTech',
    },
    closingText: {
      he: 'ככל שהפרופיל שלך שלם יותר — כך ה-AI שלנו יכול לעשות עבודה מדויקת יותר. כל שאלה שאתה עונה עליה מוסיפה דיוק לחיפוש שלך 🎯',
      en: 'The more complete your profile — the more precise our AI can be. Every question you answer adds accuracy to your search 🎯',
    },
    ctaText: { he: 'להשלים את הפרופיל שלי', en: 'Complete My Profile' },
    ctaNote: { he: 'זה ישירות משפיע על ההתאמות שתקבל', en: 'This directly impacts the matches you receive' },
  },

  // ─── Season 2: Research-Backed Deep Dive (Emails 11–20) ───────────────────

  {
    id: 'VALUE_11_ATTACHMENT',
    emailNumber: '11',
    subject: {
      he: 'סגנון ההתקשרות שלך — המפתח הנסתר לזוגיות 🔑',
      en: 'Your Attachment Style — The Hidden Key to Love 🔑',
    },
    headerEmoji: '🔑',
    headerTitle: { he: 'סגנון ההתקשרות שלך', en: 'Your Attachment Style' },
    headerSubtitle: { he: 'המפתח הנסתר שמעצב את כל הזוגיויות שלך', en: 'The hidden key shaping all your relationships' },
    introText: {
      he: 'בשנות ה-60, הפסיכולוג ג\'ון בולבי גילה משהו מהפכני: הדרך שבה התחברנו להורים שלנו בילדות — מעצבת את הדרך שבה אנחנו מתחברים לבני זוג כמבוגרים. מחקרים ענקיים מאז הוכיחו שזה אחד המנבאים החזקים ביותר להצלחה בזוגיות. אז מהו "סגנון ההתקשרות" שלך, ואיך הוא משפיע על חיפוש השידוך?',
      en: 'In the 1960s, psychologist John Bowlby discovered something revolutionary: the way we bonded with our parents as children shapes how we connect with partners as adults. Massive studies since then have proven this is one of the strongest predictors of relationship success. So what\'s your "attachment style," and how does it affect your search?',
    },
    tips: {
      he: [
        { number: '1', title: 'בטוח — הבסיס הבריא', body: 'כ-56% מהאנשים הם בעלי סגנון התקשרות "בטוח": הם מרגישים בנוח עם קרבה, לא חוששים מנטישה, ויודעים לתת מרחב. אם זה אתה — מצוין. אם לא — זה בהחלט ניתן לפיתוח. מחקר מאוניברסיטת אילינוי מראה שמודעות לסגנון שלך כבר משפרת את ההתנהגות הזוגית ב-40%.' },
        { number: '2', title: 'חרד — הפחד מנטישה', body: 'כ-20% מהאנשים נוטים לסגנון "חרד": הם צריכים הרבה וידוא, מפחדים שהצד השני יעזוב, ולפעמים נדבקים מהר מדי. אם זה מוכר לך — זה לא פגם. זו מודעות. תרגול של self-soothing (הרגעה עצמית) ושיח פנימי בריא יכולים לשנות דרמטית את חווית הדייטים שלך.' },
        { number: '3', title: 'נמנע — הפחד מקרבה', body: 'כ-24% מהאנשים נוטים לסגנון "נמנע": הם מרגישים שקרבה מאיימת, מעדיפים עצמאות, ונוטים לברוח כשהדברים נהיים רציניים. הצעד הראשון: לזהות שזה קורה. הצעד השני: לחשוף את זה בפני מישהו שאתה סומך עליו — מטפל, חבר קרוב, או השדכנית שלך.' },
        { number: '4', title: 'אפשר להשתנות — וזה מתחיל במודעות', body: 'החדשות הטובות: סגנון ההתקשרות שלך אינו גזר דין. מחקר שפורסם ב-Journal of Personality and Social Psychology הראה שאנשים שלמדו על סגנון ההתקשרות שלהם ועבדו עליו — שיפרו משמעותית את איכות הזוגיויות שלהם. השאלון שלנו ב-NeshamaTech מסייע לנו לזהות את הצרכים הרגשיים העמוקים שלך ולהתאים לך בן/בת זוג שמשלימ/ה אותך.' },
      ],
      en: [
        { number: '1', title: 'Secure — The Healthy Baseline', body: 'About 56% of people have a "secure" attachment style: they\'re comfortable with closeness, don\'t fear abandonment, and know how to give space. If that\'s you — great. If not — it\'s absolutely developable. Research from the University of Illinois shows that simply being aware of your style already improves relationship behavior by 40%.' },
        { number: '2', title: 'Anxious — The Fear of Abandonment', body: 'About 20% tend toward an "anxious" style: they need lots of reassurance, fear their partner will leave, and sometimes attach too quickly. If this sounds familiar — it\'s not a flaw. It\'s awareness. Practicing self-soothing and healthy inner dialogue can dramatically change your dating experience.' },
        { number: '3', title: 'Avoidant — The Fear of Closeness', body: 'About 24% tend toward an "avoidant" style: closeness feels threatening, they prefer independence, and they tend to flee when things get serious. Step one: recognize when it\'s happening. Step two: share it with someone you trust — a therapist, close friend, or your matchmaker.' },
        { number: '4', title: 'You Can Change — And It Starts with Awareness', body: 'The good news: your attachment style is not a life sentence. Research published in the Journal of Personality and Social Psychology showed that people who learned about their attachment style and worked on it significantly improved their relationship quality. Our NeshamaTech questionnaire helps us identify your deep emotional needs and match you with someone who complements you.' },
      ],
    },
    quoteText: {
      he: 'דע מאין באת — ולאן אתה הולך',
      en: 'Know where you came from — and where you are going',
    },
    quoteSource: 'פרקי אבות ג, א',
    closingText: {
      he: 'הבנת סגנון ההתקשרות שלך היא אחד הצעדים החשובים ביותר שאפשר לעשות לפני זוגיות. ב-NeshamaTech, השאלון שלנו מזהה את הדפוסים האלה ומתאים לך מישהו שיודע לתת לך את מה שאתה באמת צריך. 🎯',
      en: 'Understanding your attachment style is one of the most important steps before a relationship. At NeshamaTech, our questionnaire identifies these patterns and matches you with someone who knows how to give you what you truly need. 🎯',
    },
    ctaText: { he: 'למלא את השאלון', en: 'Take the Questionnaire' },
    ctaNote: { he: 'תגלה את סגנון ההתקשרות שלך — ונתאים לך טוב יותר', en: 'Discover your attachment style — and we\'ll match you better' },
  },

  {
    id: 'VALUE_12_MAGIC_RATIO',
    emailNumber: '12',
    subject: {
      he: 'היחס הקסום: הנוסחה שחוזה הצלחה בזוגיות ⚖️',
      en: 'The Magic Ratio: The Formula That Predicts Relationship Success ⚖️',
    },
    headerEmoji: '⚖️',
    headerTitle: { he: 'יחס 5:1 — הנוסחה הקסומה', en: 'The 5:1 Ratio — The Magic Formula' },
    headerSubtitle: { he: 'המחקר שחזה גירושין בדיוק של 93%', en: 'The research that predicted divorce with 93% accuracy' },
    introText: {
      he: 'ד"ר ג\'ון גוטמן, מגדולי חוקרי הזוגיות בעולם, חקר למעלה מ-3,000 זוגות לאורך 40 שנה במעבדת האהבה שלו באוניברסיטת וושינגטון. הוא גילה שיכול לחזות בדיוק של 93% אם זוג יתגרש — על סמך מדד אחד פשוט: היחס בין אינטראקציות חיוביות לשליליות. הנוסחה? 5 חיוביות על כל שלילית אחת.',
      en: 'Dr. John Gottman, one of the world\'s foremost relationship researchers, studied over 3,000 couples across 40 years in his Love Lab at the University of Washington. He discovered he could predict with 93% accuracy whether a couple would divorce — based on one simple metric: the ratio of positive to negative interactions. The formula? 5 positive for every 1 negative.',
    },
    tips: {
      he: [
        { number: '1', title: 'מה נחשב "חיובי"? יותר פשוט ממה שחשבת', body: 'אינטראקציה חיובית היא לא בהכרח מחמאה גדולה או מתנה. זה יכול להיות: חיוך כשבן/בת הזוג נכנס/ת לחדר, שאלה "איך היה היום שלך?" עם עניין אמיתי, נגיעה קלה בכתף, או פשוט הנהון ראש בזמן שהצד השני מדבר. הדברים הקטנים מצטברים — והם מה שבונה את "חשבון הבנק הרגשי" של הזוגיות.' },
        { number: '2', title: 'למה שלילי אחד שוקל כל כך הרבה?', body: 'המוח האנושי מעבד אירועים שליליים פי 5 חזק יותר מחיוביים — זו תכונה אבולוציונית שנועדה להגן עלינו. לכן ביקורת אחת, גלגול עיניים אחד, או תגובה מזלזלת אחת — דורשים 5 רגעים חיוביים כדי "לאזן" את החשבון. זה לא אומר לא להעיר — אלא לשים לב ליחס.' },
        { number: '3', title: 'תרגול: "סריקת 5:1" יומית', body: 'לפני שנרדמים — שאלו את עצמכם: "האם היום נתתי לפחות 5 רגעים חיוביים על כל ביקורת?" אפשר להתחיל לתרגל את זה כבר עכשיו — עם הורים, חברים, אחים. אנשים שמאמנים את "שריר החיוביות" בחיי היום-יום — נכנסים לזוגיות עם יתרון משמעותי.' },
      ],
      en: [
        { number: '1', title: 'What Counts as "Positive"? Simpler Than You Think', body: 'A positive interaction isn\'t necessarily a big compliment or gift. It can be: a smile when your partner enters the room, asking "how was your day?" with genuine interest, a gentle touch on the shoulder, or simply nodding while they\'re speaking. Small things accumulate — and they build the "emotional bank account" of the relationship.' },
        { number: '2', title: 'Why Does One Negative Weigh So Much?', body: 'The human brain processes negative events 5x more intensely than positive ones — an evolutionary trait designed to protect us. That\'s why one criticism, one eye-roll, or one dismissive response requires 5 positive moments to "balance" the account. This doesn\'t mean never commenting — it means watching the ratio.' },
        { number: '3', title: 'Practice: Daily "5:1 Scan"', body: 'Before falling asleep — ask yourself: "Did I give at least 5 positive moments for every criticism today?" You can start practicing now — with parents, friends, siblings. People who train their "positivity muscle" in daily life enter relationships with a significant advantage.' },
      ],
    },
    quoteText: {
      he: 'זוגות מאושרים לא חיים ללא קונפליקטים — הם חיים עם הרבה יותר רגעים טובים',
      en: 'Happy couples don\'t live without conflicts — they live with many more good moments',
    },
    quoteSource: 'ד"ר ג\'ון גוטמן, The Seven Principles for Making Marriage Work',
    closingText: {
      he: 'היחס 5:1 הוא לא רק מדד אקדמי — זו מיומנות שאפשר ללמוד ולתרגל. ב-NeshamaTech אנחנו מחפשים לך מישהו שהחוזקות שלו משלימות את שלך — אבל הצלחה בזוגיות תלויה גם במה שאתה מביא אליה. 🎯',
      en: 'The 5:1 ratio isn\'t just an academic metric — it\'s a skill you can learn and practice. At NeshamaTech we look for someone whose strengths complement yours — but relationship success also depends on what you bring to it. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'הפרופיל שלך עוזר לנו למצוא את ההתאמה המדויקת', en: 'Your profile helps us find the precise match' },
  },

  {
    id: 'VALUE_13_EMOTIONAL_BIDS',
    emailNumber: '13',
    subject: {
      he: 'הרגעים הקטנים שעושים את ההבדל הגדול 🤲',
      en: 'The Small Moments That Make the Biggest Difference 🤲',
    },
    headerEmoji: '🤲',
    headerTitle: { he: 'פניות רגשיות — Emotional Bids', en: 'Emotional Bids — Turning Toward' },
    headerSubtitle: { he: 'המחקר שגילה מה באמת מחבר זוגות', en: 'The research that revealed what truly connects couples' },
    introText: {
      he: 'ד"ר גוטמן גילה שהזוגיות לא נבנית ברגעים הדרמטיים — לא בחופה, לא בחופשה מפנקת, ולא בשיחה עמוקה בשעות הלילה. היא נבנית ברגעים הקטנים והשקטים: כשבן/בת הזוג אומר/ת "תסתכל על השקיעה הזו" — ואתה עוצר ומסתכל. גוטמן קרא לזה "פניות רגשיות" (Emotional Bids), וגילה שהן המנבא הטוב ביותר לזוגיות מאושרת.',
      en: 'Dr. Gottman discovered that relationships aren\'t built in dramatic moments — not at the wedding, not on fancy vacations, not during late-night deep conversations. They\'re built in small, quiet moments: when your partner says "look at that sunset" — and you stop and look. Gottman called these "Emotional Bids," and found they\'re the best predictor of a happy relationship.',
    },
    tips: {
      he: [
        { number: '1', title: 'מה זו פנייה רגשית?', body: 'פנייה רגשית היא כל ניסיון ליצור חיבור — גדול או קטן. "בוא נראה את הסרט הזה ביחד", "תראה מה קרה לי היום", חיוך חטוף מעבר לחדר, או אפילו אנחה. כל אלה פניות — בקשות שקטות שאומרות "אני רוצה שתהיה כאן, איתי, ברגע הזה".' },
        { number: '2', title: '86% לעומת 33% — המספרים מדברים', body: 'גוטמן גילה שזוגות שנשארו ביחד פנו זה לזה ("turned toward") ב-86% מהפניות הרגשיות. זוגות שהתגרשו — רק ב-33%. תחשוב על זה: הזוגות המאושרים לא היו מושלמים — הם פשוט שמו לב לרגעים הקטנים ולא התעלמו מהם.' },
        { number: '3', title: 'שלוש תגובות אפשריות — רק אחת בונה', body: 'כשמישהו פונה אליך, יש שלוש תגובות: "פנייה לעבר" (תשומת לב ותגובה), "פנייה מעבר" (התעלמות), ו"פנייה נגד" (תגובה עוינת או מזלזלת). הבחירה שלך ברגעים האלה — לא בוויכוחים הגדולים — היא מה שקובע את גורל הזוגיות.' },
        { number: '4', title: 'תרגול: להתחיל עכשיו, עם כולם', body: 'שימו לב היום: כמה פעמים מישהו פנה אליכם — ואתם הסתכלתם בטלפון? כמה פעמים מישהו שיתף משהו — ואתם אמרתם "אהה" בלי להרים עיניים? תרגלו "לפנות לעבר" עם חברים ומשפחה. זה שריר — וככל שמתרגלים אותו יותר, כך הוא חזק יותר כשהזוגיות מגיעה.' },
      ],
      en: [
        { number: '1', title: 'What Is an Emotional Bid?', body: 'An emotional bid is any attempt to create connection — big or small. "Let\'s watch this movie together," "look what happened to me today," a quick smile across the room, or even a sigh. These are all bids — quiet requests that say "I want you here, with me, in this moment."' },
        { number: '2', title: '86% vs. 33% — The Numbers Speak', body: 'Gottman found that couples who stayed together "turned toward" each other in 86% of emotional bids. Divorced couples — only 33%. Think about it: happy couples weren\'t perfect — they simply noticed the small moments and didn\'t ignore them.' },
        { number: '3', title: 'Three Possible Responses — Only One Builds', body: 'When someone bids for your attention, there are three responses: "turning toward" (attention and engagement), "turning away" (ignoring), and "turning against" (hostile or dismissive response). Your choice in these moments — not in big arguments — is what determines the relationship\'s fate.' },
        { number: '4', title: 'Practice: Start Now, With Everyone', body: 'Notice today: how many times did someone reach out to you — and you looked at your phone? How many times did someone share something — and you said "uh huh" without looking up? Practice "turning toward" with friends and family. It\'s a muscle — and the more you exercise it, the stronger it is when your relationship arrives.' },
      ],
    },
    quoteText: {
      he: 'אהבה נבנית לא ברגעים הגדולים — אלא באלפי הרגעים הקטנים שבהם בחרנו להיות קשובים',
      en: 'Love is built not in grand moments — but in thousands of small moments where we chose to pay attention',
    },
    quoteSource: 'ד"ר ג\'ון גוטמן',
    closingText: {
      he: 'הפרופיל שלך ב-NeshamaTech אומר לנו הרבה על מי אתה — אבל מה שיקבע את הצלחת הזוגיות שלך זה מה שתעשה ברגעים הקטנים. התחל לתרגל היום. 🎯',
      en: 'Your NeshamaTech profile tells us a lot about who you are — but what will determine your relationship success is what you do in the small moments. Start practicing today. 🎯',
    },
    ctaText: { he: 'לראות את ההתאמות שלי', en: 'See My Matches' },
    ctaNote: { he: 'אולי מישהו כבר מחכה לפנייה שלך', en: 'Someone might already be waiting for your bid' },
  },

  {
    id: 'VALUE_14_FOUR_HORSEMEN',
    emailNumber: '14',
    subject: {
      he: '4 דפוסים הרסניים שחייבים לזהות — לפני שמאוחר מדי 🛡️',
      en: '4 Destructive Patterns You Must Spot — Before It\'s Too Late 🛡️',
    },
    headerEmoji: '🛡️',
    headerTitle: { he: 'ארבעת הפרשים של הזוגיות', en: 'The Four Horsemen of Relationships' },
    headerSubtitle: { he: 'איך לזהות ולעצור דפוסים הרסניים עוד לפני הזוגיות', en: 'How to spot and stop destructive patterns before the relationship' },
    introText: {
      he: 'גוטמן זיהה ארבעה דפוסי תקשורת שהוא כינה "ארבעת הפרשים" — דפוסים שכשהם מופיעים בזוגיות, חוזים גירושין בדיוק של 93%. החדשות הטובות? אפשר לזהות אותם אצל עצמנו כבר עכשיו — ולתקן לפני שנכנסים לזוגיות.',
      en: 'Gottman identified four communication patterns he called "The Four Horsemen" — patterns that, when present in a relationship, predict divorce with 93% accuracy. The good news? You can spot them in yourself right now — and fix them before entering a relationship.',
    },
    tips: {
      he: [
        { number: '1', title: 'ביקורת — לתקוף את האדם, לא את הבעיה', body: 'ביקורת בריאה היא "הרגשתי שלא שמעת אותי בשיחה". ביקורת הרסנית היא "אתה תמיד מתעלם ממני, אתה אגואיסט". ההבדל? הראשונה מדברת על מצב ספציפי, השנייה תוקפת את האדם. שימו לב: האם גם בשיחות עם חברים ומשפחה אתם נוטים לתקוף את האדם ולא את הבעיה?' },
        { number: '2', title: 'בוז — הרעל הקטלני ביותר', body: 'בוז הוא גלגול עיניים, ציניות, סרקזם, וזלזול. גוטמן קורא לו "המנבא הבודד החזק ביותר של גירושין". למה? כי בוז אומר "אתה מתחתי" — והוא הורס את הכבוד ההדדי שהוא הבסיס של כל זוגיות. אם אתה תופס את עצמך מזלזל באנשים — עצור. זה הרגל שיהרוס כל זוגיות.' },
        { number: '3', title: 'התגוננות — "זה לא אני, זה אתה"', body: 'התגוננות היא תגובה טבעית לביקורת — אבל היא חוסמת כל אפשרות לפתרון. במקום "אולי אתה צודק, בוא ננסה אחרת" — ההתגוננות אומרת "אני לא אשם, אתה התחלת". תרגלו לשאול: "מה החלק שלי בבעיה?" — גם כשקשה.' },
        { number: '4', title: 'הסתגרות — לבנות קירות', body: 'הסתגרות היא כשאחד מהצדדים "מתנתק" — מפסיק להגיב, יוצא מהחדר, או סוגר את עצמו. זה קורה בדרך כלל כשיש הצפה רגשית (emotional flooding). הפתרון: ללמוד לקחת הפסקה מודעת — "אני צריך 20 דקות לנשום, ואז נמשיך" — במקום פשוט להיסגר.' },
      ],
      en: [
        { number: '1', title: 'Criticism — Attacking the Person, Not the Problem', body: 'Healthy critique is "I felt unheard in that conversation." Destructive criticism is "You always ignore me, you\'re so selfish." The difference? The first addresses a specific situation, the second attacks the person. Notice: do you tend to attack the person rather than the problem in conversations with friends and family too?' },
        { number: '2', title: 'Contempt — The Most Lethal Poison', body: 'Contempt is eye-rolling, cynicism, sarcasm, and disdain. Gottman calls it "the single strongest predictor of divorce." Why? Because contempt says "you\'re beneath me" — and it destroys the mutual respect that is the foundation of every relationship. If you catch yourself being contemptuous — stop. It\'s a habit that will destroy any relationship.' },
        { number: '3', title: 'Defensiveness — "It\'s Not Me, It\'s You"', body: 'Defensiveness is a natural response to criticism — but it blocks any possibility of resolution. Instead of "maybe you\'re right, let\'s try differently" — defensiveness says "I\'m not to blame, you started it." Practice asking: "What\'s my part in this problem?" — even when it\'s hard.' },
        { number: '4', title: 'Stonewalling — Building Walls', body: 'Stonewalling is when one side "disconnects" — stops responding, leaves the room, or shuts down. This usually happens during emotional flooding. The solution: learn to take a conscious break — "I need 20 minutes to breathe, then we\'ll continue" — instead of just shutting down.' },
      ],
    },
    quoteText: {
      he: 'הבעיה היא לא שיש קונפליקטים — הבעיה היא איך מתנהגים בתוכם',
      en: 'The problem isn\'t that conflicts exist — the problem is how we behave within them',
    },
    quoteSource: 'ד"ר ג\'ון גוטמן, Why Marriages Succeed or Fail',
    closingText: {
      he: 'היכולת לזהות את "ארבעת הפרשים" אצל עצמך — ולתקן — היא אחת המתנות הגדולות שתביא לזוגיות העתידית שלך. אנחנו ב-NeshamaTech מאמינים שהכנה רגשית חשובה לא פחות מהתאמה טובה. 🎯',
      en: 'The ability to spot the "Four Horsemen" in yourself — and correct them — is one of the greatest gifts you\'ll bring to your future relationship. At NeshamaTech we believe emotional preparation is just as important as a good match. 🎯',
    },
    ctaText: { he: 'להשלים את השאלון שלי', en: 'Complete My Questionnaire' },
    ctaNote: { he: 'השאלון עוזר לנו להבין את סגנון התקשורת שלך', en: 'The questionnaire helps us understand your communication style' },
  },

  {
    id: 'VALUE_15_VULNERABILITY',
    emailNumber: '15',
    subject: {
      he: 'פגיעות כעוצמה — הסוד של זוגות שמצליחים 💪',
      en: 'Vulnerability as Strength — The Secret of Couples Who Thrive 💪',
    },
    headerEmoji: '💪',
    headerTitle: { he: 'פגיעות היא לא חולשה', en: 'Vulnerability Is Not Weakness' },
    headerSubtitle: { he: 'המחקר שהפך את מה שחשבנו על חוזק', en: 'The research that reversed what we thought about strength' },
    introText: {
      he: 'ד"ר ברנה בראון, חוקרת בביה"ס לעבודה סוציאלית באוניברסיטת יוסטון, חקרה למעלה מ-10,000 משתתפים לאורך 12 שנה. המסקנה שלה הפתיעה את כולם: האנשים עם הזוגיויות החזקות ביותר הם לא החזקים ביותר — הם הפגיעים ביותר. לא חלשים — פגיעים. יש הבדל עצום.',
      en: 'Dr. Brené Brown, a researcher at the University of Houston\'s Graduate College of Social Work, studied over 10,000 participants across 12 years. Her conclusion surprised everyone: people with the strongest relationships aren\'t the strongest people — they\'re the most vulnerable. Not weak — vulnerable. There\'s a huge difference.',
    },
    tips: {
      he: [
        { number: '1', title: 'פגיעות = אומץ, לא חולשה', body: 'בראון מגדירה פגיעות כ"אי-ודאות, סיכון, וחשיפה רגשית". להגיד למישהו "אני מפחד שלא אהיה מספיק טוב" — זה לא חולשה, זה אומץ עצום. בדייטים, אנשים שמעזים להיות פגיעים יוצרים חיבור עמוק הרבה יותר מאלה שמציגים גרסה "מושלמת" של עצמם.' },
        { number: '2', title: '"שריון" הוא מה שמרחיק אנשים', body: 'כולנו בונים "שריונות" כדי להגן על עצמנו: הומור מוגזם, שליטה, פרפקציוניזם, ציניות. בדייט, השריון הזה מרגיש בטוח — אבל הוא מונע מהצד השני לראות מי אתה באמת. בראון כותבת: "אנחנו לא יכולים לקבל אהבה אם אנחנו לובשים שריון." תשאל את עצמך: מה ה"שריון" שלי?' },
        { number: '3', title: 'פגיעות מדורגת — לא הכל בבת אחת', body: 'פגיעות חכמה היא לא לספר את כל סיפור החיים בדייט ראשון. היא מדורגת: שיתוף קטן אחד אמיתי → צפייה איך הצד השני מגיב → שיתוף נוסף אם התגובה הייתה בטוחה. זה בונה אמון ופגיעות במקביל — כמו שתי מדרגות שעולות יחד.' },
        { number: '4', title: 'המחקר: פגיעות מושכת יותר מ"מושלם"', body: 'מחקר של פרופ\' אליוט ארונסון (אפקט הפראטפול) הראה שאנשים שנתפסו כ"מוכשרים אבל אנושיים" — קיבלו ציוני חיבה גבוהים יותר מאנשים שנראו "מושלמים". חולשה שנאמרת בכנות יוצרת יותר חיבור מחוזקות שמוצגות. זה עובד גם בדייטים.' },
      ],
      en: [
        { number: '1', title: 'Vulnerability = Courage, Not Weakness', body: 'Brown defines vulnerability as "uncertainty, risk, and emotional exposure." Telling someone "I\'m afraid I won\'t be good enough" isn\'t weakness — it\'s immense courage. In dating, people who dare to be vulnerable create much deeper connections than those who present a "perfect" version of themselves.' },
        { number: '2', title: '"Armor" Is What Pushes People Away', body: 'We all build "armor" to protect ourselves: excessive humor, control, perfectionism, cynicism. On a date, that armor feels safe — but it prevents the other side from seeing who you really are. Brown writes: "We cannot receive love if we\'re wearing armor." Ask yourself: what\'s my armor?' },
        { number: '3', title: 'Graduated Vulnerability — Not Everything at Once', body: 'Smart vulnerability isn\'t sharing your entire life story on a first date. It\'s graduated: one small authentic share → watching how the other side responds → another share if the response felt safe. This builds trust and vulnerability simultaneously — like two stairs climbing together.' },
        { number: '4', title: 'The Research: Vulnerability Attracts More Than "Perfect"', body: 'Prof. Elliot Aronson\'s research (the Pratfall Effect) showed that people perceived as "competent but human" received higher likability scores than people who seemed "perfect." A weakness stated honestly creates more connection than displayed strengths. This works in dating too.' },
      ],
    },
    quoteText: {
      he: 'פגיעות היא מקום הלידה של אהבה, שייכות, שמחה, אומץ, אמפתיה, ויצירתיות',
      en: 'Vulnerability is the birthplace of love, belonging, joy, courage, empathy, and creativity',
    },
    quoteSource: 'ד"ר ברנה בראון, Daring Greatly',
    closingText: {
      he: 'השאלון שלנו ב-NeshamaTech מאפשר לך להביע את עצמך בכנות — בלי לשפוט. ככל שתהיה אמיתי יותר בתשובות — כך נמצא לך מישהו שרואה ואוהב את מי שאתה באמת. 🎯',
      en: 'Our NeshamaTech questionnaire lets you express yourself honestly — without judgment. The more authentic you are in your answers — the better we can find someone who sees and loves who you truly are. 🎯',
    },
    ctaText: { he: 'למלא את השאלון בכנות', en: 'Take the Questionnaire Honestly' },
    ctaNote: { he: 'האמיתיות שלך = ההתאמה שלנו', en: 'Your authenticity = our matching accuracy' },
  },

  {
    id: 'VALUE_16_GROWTH_MINDSET',
    emailNumber: '16',
    subject: {
      he: 'חשיבה צמיחתית באהבה — איך לא לתקוע את הזוגיות 🌿',
      en: 'Growth Mindset in Love — How Not to Get Stuck 🌿',
    },
    headerEmoji: '🌿',
    headerTitle: { he: 'חשיבה צמיחתית באהבה', en: 'Growth Mindset in Love' },
    headerSubtitle: { he: 'המחקר של קרול דווק — מיושם על זוגיות ושידוכים', en: 'Carol Dweck\'s research — applied to relationships and dating' },
    introText: {
      he: 'פרופ\' קרול דווק מאוניברסיטת סטנפורד חקרה עשרות שנים את ההבדל בין "חשיבה קבועה" ל"חשיבה צמיחתית". התגלית שלה שינתה את עולם החינוך — אבל היא רלוונטית לא פחות לזוגיות. אנשים עם "חשיבה קבועה" באהבה מאמינים ש"או שזה עובד או שלא". אנשים עם "חשיבה צמיחתית" מאמינים שזוגיות היא מסע של למידה. נחשו מי מצליח יותר.',
      en: 'Prof. Carol Dweck of Stanford University spent decades studying the difference between "fixed mindset" and "growth mindset." Her discovery changed education — but it\'s equally relevant to relationships. People with a "fixed mindset" in love believe "it either works or it doesn\'t." People with a "growth mindset" believe relationships are a learning journey. Guess who succeeds more.',
    },
    tips: {
      he: [
        { number: '1', title: '"בן/בת הזוג המושלם/ת" — מיתוס מסוכן', body: 'חשיבה קבועה בשידוכים אומרת: "יש מישהו מושלם בשבילי, ואני רק צריך למצוא אותו." חשיבה צמיחתית אומרת: "יש מישהו טוב שאיתו אני יכול לבנות משהו נפלא." מחקר של דווק ושותפתה הראה שאנשים עם חשיבה צמיחתית בזוגיות — מדווחים על שביעות רצון גבוהה יותר ב-40%.' },
        { number: '2', title: 'קונפליקט = הזדמנות, לא כישלון', body: 'אנשים עם חשיבה קבועה רואים מריבה כ"הוכחה שזה לא מתאים". אנשים עם חשיבה צמיחתית רואים מריבה כ"הזדמנות ללמוד איך לתקשר טוב יותר". זה לא רק עניין של גישה — זה משנה התנהגות: מי שרואה בקונפליקט הזדמנות — נשאר ומנסה. מי שרואה כישלון — בורח.' },
        { number: '3', title: '"עוד לא" — שתי המילים החזקות ביותר', body: 'דווק מלמדת להחליף "אני לא מצליח" ב"אני עוד לא מצליח". בשידוכים: לא "אני לא מוצא" אלא "אני עוד לא מצאתי — ובינתיים אני לומד, גדל, ומתכונן טוב יותר". המסע עצמו הופך אותך לבן/בת זוג טוב/ה יותר.' },
      ],
      en: [
        { number: '1', title: '"The Perfect Partner" — A Dangerous Myth', body: 'Fixed mindset in dating says: "There\'s someone perfect for me, I just need to find them." Growth mindset says: "There\'s someone good with whom I can build something wonderful." Research by Dweck and her colleague showed that people with a growth mindset in relationships report 40% higher satisfaction.' },
        { number: '2', title: 'Conflict = Opportunity, Not Failure', body: 'People with a fixed mindset see a fight as "proof it doesn\'t work." People with a growth mindset see a fight as "an opportunity to learn better communication." This isn\'t just attitude — it changes behavior: those who see conflict as opportunity stay and try. Those who see failure — flee.' },
        { number: '3', title: '"Not Yet" — The Two Most Powerful Words', body: 'Dweck teaches replacing "I can\'t" with "I can\'t yet." In dating: not "I can\'t find anyone" but "I haven\'t found them yet — and meanwhile I\'m learning, growing, and preparing better." The journey itself makes you a better partner.' },
      ],
    },
    quoteText: {
      he: 'בזוגיות צמיחתית, הדרך חשובה לא פחות מהיעד',
      en: 'In a growth-oriented relationship, the journey matters as much as the destination',
    },
    quoteSource: 'פרופ\' קרול דווק, Mindset: The New Psychology of Success',
    closingText: {
      he: 'ב-NeshamaTech, אנחנו מחפשים לך לא "מושלם" — אלא מישהו שמוכן לצמוח איתך. השאלון שלנו מזהה גישה צמיחתית ומתאים בין אנשים שמאמינים בבנייה משותפת. 🎯',
      en: 'At NeshamaTech, we\'re not looking for "perfect" for you — but someone ready to grow with you. Our questionnaire identifies growth mindset and matches people who believe in building together. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'הפרופיל שלך משקף את הגישה שלך — בואו נעדכן', en: 'Your profile reflects your approach — let\'s update it' },
  },

  {
    id: 'VALUE_17_LOVE_LANGUAGES',
    emailNumber: '17',
    subject: {
      he: '5 שפות האהבה — למה אתם לא מבינים אחד את השני 💬',
      en: 'The 5 Love Languages — Why You\'re Not Understanding Each Other 💬',
    },
    headerEmoji: '💬',
    headerTitle: { he: '5 שפות האהבה', en: 'The 5 Love Languages' },
    headerSubtitle: { he: 'המחקר שגילה למה "אני אוהב אותך" לא תמיד מספיק', en: 'The research that revealed why "I love you" isn\'t always enough' },
    introText: {
      he: 'ד"ר גארי צ\'פמן, יועץ זוגיות עם למעלה מ-35 שנות ניסיון, גילה שכל אדם "מדבר" אהבה בשפה שונה. הבעיה? רוב האנשים נותנים אהבה בשפה שלהם — לא בשפה של בן/בת הזוג. זה כמו לדבר עברית למי שמבין רק צרפתית — הכוונה טובה, אבל המסר לא מגיע.',
      en: 'Dr. Gary Chapman, a relationship counselor with over 35 years of experience, discovered that every person "speaks" love in a different language. The problem? Most people give love in their own language — not their partner\'s. It\'s like speaking Hebrew to someone who only understands French — the intention is good, but the message doesn\'t arrive.',
    },
    tips: {
      he: [
        { number: '1', title: 'מילים מעודדות — "את נראית נהדר היום"', body: 'אנשים ששפת האהבה שלהם היא מילים מעודדות — זקוקים לשמוע מחמאות, הערכה, ועידוד מילולי. בשבילם, "אני גאה בך" שווה יותר ממתנה יקרה. אם זו השפה שלך — ספר על זה בפרופיל. אם זו השפה של בן/בת הזוג העתידי/ת שלך — תלמד להגיד.' },
        { number: '2', title: 'זמן איכות — "תשב איתי בלי טלפון"', body: 'עבור אנשים ששפתם היא זמן איכות — נוכחות מלאה, ללא הסחות דעת, היא ההוכחה הגדולה ביותר לאהבה. לא מספיק להיות באותו חדר — צריך להיות נוכח באותו רגע. בעידן הסמארטפונים, זו אולי השפה הכי מאתגרת — וגם הכי משמעותית.' },
        { number: '3', title: 'מגע פיזי / מתנות / מעשי שירות', body: 'שלוש שפות נוספות: מגע פיזי (חיבוק, יד על הכתף), מתנות (לא יקרות — מחושבות), ומעשי שירות (לעשות משהו שהצד השני צריך בלי שיבקש). כל אדם מדורג אחרת. הסוד: לגלות מה השפה של הצד השני — ולדבר בה, גם אם היא לא טבעית לך.' },
        { number: '4', title: 'איך לגלות את השפה שלך — עכשיו', body: 'שאל את עצמך: "מה הכי כואב לי כשחסר? מה הכי משמח אותי כשאני מקבל?" אם חסרות לך מילים טובות — כנראה שזו השפה שלך. אם הכי כואב לך שמבטלים תוכניות — זמן איכות הוא השפה שלך. הבנה עצמית מדויקת = הפרופיל שלך יהיה מדויק יותר = ההתאמה תהיה טובה יותר.' },
      ],
      en: [
        { number: '1', title: 'Words of Affirmation — "You Look Great Today"', body: 'People whose love language is words of affirmation need to hear compliments, appreciation, and verbal encouragement. For them, "I\'m proud of you" is worth more than an expensive gift. If this is your language — mention it in your profile. If it\'s your future partner\'s language — learn to say it.' },
        { number: '2', title: 'Quality Time — "Sit With Me, No Phone"', body: 'For people whose language is quality time — full presence, without distractions, is the greatest proof of love. Being in the same room isn\'t enough — you need to be present in the same moment. In the smartphone era, this may be the most challenging language — and the most meaningful.' },
        { number: '3', title: 'Physical Touch / Gifts / Acts of Service', body: 'Three more languages: physical touch (a hug, hand on shoulder), gifts (not expensive — thoughtful), and acts of service (doing something the other needs without being asked). Everyone ranks differently. The secret: discover your partner\'s language — and speak it, even if it\'s not natural to you.' },
        { number: '4', title: 'How to Discover Your Language — Now', body: 'Ask yourself: "What hurts most when it\'s missing? What makes me happiest when I receive it?" If you miss kind words — that\'s probably your language. If canceled plans hurt most — quality time is your language. Accurate self-understanding = more accurate profile = better matching.' },
      ],
    },
    quoteText: {
      he: 'האהבה היא בחירה יומיומית — ללמוד את השפה של מי שאתה אוהב',
      en: 'Love is a daily choice — to learn the language of the one you love',
    },
    quoteSource: 'ד"ר גארי צ\'פמן, The Five Love Languages',
    closingText: {
      he: 'כשאתה מבין את שפת האהבה שלך — אתה מבין מה אתה צריך מבן/בת זוג, ומה אתה יכול לתת. ב-NeshamaTech, השאלון שלנו עוזר לנו לזהות את הצרכים הרגשיים שלך ולהתאים בהתאם. 🎯',
      en: 'When you understand your love language — you understand what you need from a partner, and what you can give. At NeshamaTech, our questionnaire helps us identify your emotional needs and match accordingly. 🎯',
    },
    ctaText: { he: 'למלא את השאלון', en: 'Take the Questionnaire' },
    ctaNote: { he: 'גלה את שפת האהבה שלך — ונמצא את מי שמדבר אותה', en: 'Discover your love language — and we\'ll find who speaks it' },
  },

  {
    id: 'VALUE_18_GRATITUDE',
    emailNumber: '18',
    subject: {
      he: 'כוח ההכרת תודה — איך תודה אחת משנה זוגיות 🙏',
      en: 'The Power of Gratitude — How One "Thank You" Changes Everything 🙏',
    },
    headerEmoji: '🙏',
    headerTitle: { he: 'כוח ההכרת תודה בזוגיות', en: 'The Power of Gratitude in Love' },
    headerSubtitle: { he: 'מחקרים מוכיחים: תודה = זוגיות חזקה יותר', en: 'Research proves: gratitude = stronger relationships' },
    introText: {
      he: 'מחקר שפורסם ב-Journal of Personality and Social Psychology (2010) עקב אחרי זוגות לאורך 9 חודשים וגילה ממצא מפתיע: הגורם הבודד שהשפיע הכי הרבה על שביעות הרצון בזוגיות לא היה תקשורת, לא מין, ולא כסף — אלא הכרת תודה. זוגות שהביעו תודה באופן קבוע דיווחו על שביעות רצון גבוהה ב-25% ועל תחושת מחויבות גבוהה ב-30%.',
      en: 'A study published in the Journal of Personality and Social Psychology (2010) tracked couples over 9 months and found a surprising result: the single factor that most influenced relationship satisfaction wasn\'t communication, sex, or money — it was gratitude. Couples who regularly expressed gratitude reported 25% higher satisfaction and 30% higher commitment.',
    },
    tips: {
      he: [
        { number: '1', title: 'למה תודה עובדת כל כך חזק?', body: 'מחקרים מ-Greater Good Science Center בברקלי מראים שהכרת תודה עושה שלושה דברים בו זמנית: (1) היא גורמת למי שאמרו לו תודה להרגיש מוערך, (2) היא גורמת למי שאמר תודה לשים לב לדברים הטובים, ו-(3) היא יוצרת "ספירלה חיובית" — ככל שמודים יותר, ככה רואים יותר מה יש להודות עליו.' },
        { number: '2', title: 'תודה ספציפית > תודה כללית', body: '"תודה על ארוחת הערב" טוב. "תודה שהכנת את האוכל שאני אוהב, למרות שהיה לך יום קשה — זה ממש חימם לי את הלב" — מצוין. מחקר מאוניברסיטת ג\'ורג\'יה הראה שתודה ספציפית ומפורטת — שמציינת מה בדיוק עשה הצד השני ואיך זה השפיע עליך — חזקה פי 3 מתודה כללית.' },
        { number: '3', title: 'תרגול: "3 דברים טובים" כל ערב', body: 'מרטין סליגמן, אבי הפסיכולוגיה החיובית, פיתח תרגיל פשוט ועוצמתי: כל ערב, כתוב 3 דברים טובים שקרו לך היום ולמה הם קרו. מחקר הראה שאחרי שבוע בלבד — רמות האושר עולות ורמות הדיכאון יורדות, עם השפעה שנמשכת עד 6 חודשים. תרגול שמתאים מצוין גם לשלב הדייטים.' },
      ],
      en: [
        { number: '1', title: 'Why Does Gratitude Work So Powerfully?', body: 'Research from Greater Good Science Center at Berkeley shows gratitude does three things simultaneously: (1) it makes the recipient feel valued, (2) it makes the giver notice the good things, and (3) it creates a "positive spiral" — the more you give thanks, the more you see to be thankful for.' },
        { number: '2', title: 'Specific Gratitude > General Gratitude', body: '"Thanks for dinner" is good. "Thank you for making the food I love, even though you had a hard day — it really warmed my heart" — is excellent. Research from the University of Georgia showed that specific, detailed gratitude — naming exactly what the other person did and how it affected you — is 3x more powerful than general thanks.' },
        { number: '3', title: 'Practice: "3 Good Things" Every Evening', body: 'Martin Seligman, the father of positive psychology, developed a simple yet powerful exercise: every evening, write 3 good things that happened today and why. Research showed that after just one week — happiness levels rise and depression levels drop, with effects lasting up to 6 months. A practice perfectly suited for the dating stage too.' },
      ],
    },
    quoteText: {
      he: 'הלב הרואה את הטוב — מושך טוב אליו',
      en: 'The heart that sees the good — draws good to itself',
    },
    quoteSource: 'עפ"י ספר חובות הלבבות, שער הבטחון',
    closingText: {
      he: 'הכרת תודה היא לא רק "נימוס" — היא כלי מדעי לבניית זוגיות חזקה. התחל לתרגל עכשיו, ותיכנס לזוגיות עם כישורים שרוב האנשים לומדים רק אחרי שנים. 🎯',
      en: 'Gratitude isn\'t just "politeness" — it\'s a scientific tool for building a strong relationship. Start practicing now, and you\'ll enter a relationship with skills most people only learn after years. 🎯',
    },
    ctaText: { he: 'לבדוק את הפרופיל שלי', en: 'Check My Profile' },
    ctaNote: { he: 'פרופיל מעודכן = התאמות טובות יותר', en: 'Updated profile = better matches' },
  },

  {
    id: 'VALUE_19_BREAKING_PATTERNS',
    emailNumber: '19',
    subject: {
      he: 'שבירת דפוסים — למה אתה חוזר על אותן טעויות בדייטים 🔄',
      en: 'Breaking Patterns — Why You Keep Making the Same Dating Mistakes 🔄',
    },
    headerEmoji: '🔄',
    headerTitle: { he: 'שבירת דפוסים חוזרים', en: 'Breaking Recurring Patterns' },
    headerSubtitle: { he: 'הפסיכולוגיה מאחורי "למה תמיד נמשכתי לאותו טיפוס"', en: 'The psychology behind "why I\'m always attracted to the same type"' },
    introText: {
      he: 'אם מצאת את עצמך חוזר/ת על אותם דפוסים בדייטים — נמשך/ת לאותו סוג בן/בת זוג, חווה/ת אותם קונפליקטים, או בורח/ת באותה נקודה — אתה לא לבד. הפסיכולוגיה מסבירה למה זה קורה, ויותר חשוב: איך לשבור את הדפוס.',
      en: 'If you\'ve found yourself repeating the same dating patterns — attracted to the same type, experiencing the same conflicts, or running at the same point — you\'re not alone. Psychology explains why this happens, and more importantly: how to break the pattern.',
    },
    tips: {
      he: [
        { number: '1', title: '"כפייה לחזור" — פרויד צדק (בדבר הזה)', body: 'פרויד זיהה תופעה שנקראת "repetition compulsion" — נטייה לא-מודעת לחזור על מצבים מוכרים, גם כשהם כואבים. אם גדלת עם הורה רגשית לא-זמין — אתה עלול להימשך לבני זוג שגם הם רגשית לא-זמינים. לא כי "אתה אוהב לסבול" — אלא כי המוח שלך מחפש את המוכר, גם כשהמוכר כואב.' },
        { number: '2', title: 'זהה את ה"טריגר" שלך', body: 'כל דפוס חוזר מתחיל ברגע ספציפי — "טריגר". אולי זה הרגע שבן/בת הזוג מראה עניין רציני ואתה מתחיל להתרחק. אולי זה כשמישהו אומר "לא" ואתה נהיה אובססיבי. זהה את הרגע הזה. תכתוב אותו. שתף אותו עם חבר או מטפל. המודעות לטריגר כבר מתחילה לשבור את הדפוס.' },
        { number: '3', title: 'הטכניקה: "עצור-תרגם-בחר"', body: 'כשאתה מזהה את הטריגר: (1) עצור — אל תגיב אוטומטית. (2) תרגם — "מה אני באמת מרגיש עכשיו? פחד? כעס? חוסר ביטחון?" (3) בחר — "האם אני רוצה לעשות את מה שתמיד עשיתי, או לנסות משהו אחר?" הבחירה המודעת — גם אם היא קטנה — משנה את הדפוס לאורך זמן.' },
        { number: '4', title: 'השדכנית כראי חיצוני', body: 'אחד היתרונות של שידוך דרך שדכנית — היא מהווה "ראי חיצוני" שרואה את הדפוסים שאתה לא רואה. "שמתי לב שכל פעם שמישהי מאוד מתעניינת, אתה מאבד עניין" — הערה כזו משדכנית שמכירה אותך שווה זהב. ב-NeshamaTech, גם ה-AI וגם השדכנים עוזרים לזהות את הדפוסים האלה.' },
      ],
      en: [
        { number: '1', title: '"Repetition Compulsion" — Freud Was Right (About This)', body: 'Freud identified a phenomenon called "repetition compulsion" — an unconscious tendency to repeat familiar situations, even when painful. If you grew up with an emotionally unavailable parent — you may be drawn to emotionally unavailable partners. Not because "you like suffering" — but because your brain seeks the familiar, even when familiar hurts.' },
        { number: '2', title: 'Identify Your "Trigger"', body: 'Every recurring pattern starts with a specific moment — a "trigger." Maybe it\'s when a partner shows serious interest and you start pulling away. Maybe it\'s when someone says "no" and you become obsessive. Identify that moment. Write it down. Share it with a friend or therapist. Awareness of the trigger already starts breaking the pattern.' },
        { number: '3', title: 'The Technique: "Stop-Translate-Choose"', body: 'When you identify the trigger: (1) Stop — don\'t react automatically. (2) Translate — "What am I really feeling right now? Fear? Anger? Insecurity?" (3) Choose — "Do I want to do what I\'ve always done, or try something different?" The conscious choice — even a small one — changes the pattern over time.' },
        { number: '4', title: 'The Matchmaker as External Mirror', body: 'One advantage of matchmaker-based dating — they serve as an "external mirror" seeing patterns you can\'t see. "I noticed that every time someone is very interested, you lose interest" — such an observation from a matchmaker who knows you is worth gold. At NeshamaTech, both our AI and matchmakers help identify these patterns.' },
      ],
    },
    quoteText: {
      he: 'שיגעון הוא לעשות את אותו הדבר שוב ושוב ולצפות לתוצאות שונות',
      en: 'Insanity is doing the same thing over and over and expecting different results',
    },
    quoteSource: 'מיוחס לאלברט איינשטיין',
    closingText: {
      he: 'שבירת דפוסים היא לא קלה — אבל היא אפשרית, ושווה כל מאמץ. השאלון והפרופיל שלך ב-NeshamaTech עוזרים לנו ולשדכנים שלנו לזהות את הצרכים האמיתיים שלך — לא את הדפוסים הישנים. 🎯',
      en: 'Breaking patterns isn\'t easy — but it\'s possible, and worth every effort. Your questionnaire and profile at NeshamaTech help us and our matchmakers identify your real needs — not your old patterns. 🎯',
    },
    ctaText: { he: 'למלא את השאלון', en: 'Take the Questionnaire' },
    ctaNote: { he: 'השאלון שלנו מזהה דפוסים — ועוזר לשבור אותם', en: 'Our questionnaire identifies patterns — and helps break them' },
  },

  {
    id: 'VALUE_20_EXPECTATIONS',
    emailNumber: '20',
    subject: {
      he: 'ניהול ציפיות — האיזון בין סטנדרטים לגמישות 🎯',
      en: 'Managing Expectations — Balancing Standards with Flexibility 🎯',
    },
    headerEmoji: '🎯',
    headerTitle: { he: 'ניהול ציפיות בשידוכים', en: 'Managing Expectations in Dating' },
    headerSubtitle: { he: 'מה המחקר אומר על "רשימת הדרישות" שלך', en: 'What research says about your "requirements list"' },
    introText: {
      he: 'פרופ\' אלי פינקל מאוניברסיטת נורת\'ווסטרן, אחד מחוקרי הזוגיות המובילים בעולם, חקר מה קורה כשאנשים ניגשים לשידוכים עם רשימת דרישות ארוכה מול רשימה קצרה. התוצאות? לא מה שציפיתם. הרשימה הארוכה לא הובילה ליותר אושר — היא הובילה ליותר אכזבות, ולהחמצת התאמות מצוינות.',
      en: 'Prof. Eli Finkel of Northwestern University, one of the world\'s leading relationship researchers, studied what happens when people approach dating with a long requirements list versus a short one. The results? Not what you\'d expect. The long list didn\'t lead to more happiness — it led to more disappointments, and to missing excellent matches.',
    },
    tips: {
      he: [
        { number: '1', title: 'הבדל בין "Must Have" ל-"Nice to Have"', body: 'מחקר של פרופ\' פינקל מראה שהדרישות שבאמת חשובות להצלחה בזוגיות הן 3-5 לכל היותר: ערכים דומים, גישה דומה לחיים, מידות טובות, כימיה בסיסית, ומוכנות לבנות. כל השאר — גובה, מקצוע ספציפי, שכונה מסוימת — הם "Nice to Have" שכדאי להיות גמישים לגביהם.' },
        { number: '2', title: '"פרדוקס הבחירה" — יותר אופציות ≠ יותר אושר', body: 'פרופ\' בארי שוורץ מאוניברסיטת סווארתמור הוכיח שכשיש לנו יותר מדי אפשרויות — אנחנו בוחרים פחות טוב ומרוצים פחות. באפליקציות הכרויות עם אלפי פרופילים, אנשים הופכים ל"קונים" שתמיד חושבים "אולי יש משהו יותר טוב". שידוך דרך שדכנית — עם מספר קטן של הצעות איכותיות — מוביל להחלטות טובות יותר.' },
        { number: '3', title: 'מה שאתה חושב שאתה רוצה ≠ מה שבאמת מאשר אותך', body: 'מחקר מפתיע מ-2023 שפורסם ב-PNAS גילה שב-421 מיליון התאמות פוטנציאליות, ההעדפות שאנשים הצהירו עליהן — כמעט לא ניבאו את ההתאמות שבאמת עבדו. אנשים שאמרו "אני רוצה גבוה/ה" — לא בהכרח היו מאושרים יותר עם מישהו גבוה/ה. מה שכן ניבא? דמיון בערכים, אישיות, וגישה לחיים.' },
        { number: '4', title: 'הנוסחה: 3 עקרונות ברזל + פתיחות לכל השאר', body: 'הגדר 3 דברים שהם באמת חיוניים לך — ולא "רשימת קניות". למשל: (1) בן/בת אדם ישר/ה ואמין/ה, (2) מישהו/י שמוכן/ה לצמוח, (3) חולק/ת את הגישה שלי לחיים יהודיים. על כל השאר — תן לעצמך להפתיע. הפתעות הן מקום נפלא לגלות אהבה.' },
      ],
      en: [
        { number: '1', title: 'Distinguish "Must Have" from "Nice to Have"', body: 'Prof. Finkel\'s research shows that requirements truly important for relationship success are 3-5 at most: similar values, similar life approach, good character, basic chemistry, and readiness to build. Everything else — height, specific profession, certain neighborhood — are "Nice to Have" worth being flexible about.' },
        { number: '2', title: '"Paradox of Choice" — More Options ≠ More Happiness', body: 'Prof. Barry Schwartz of Swarthmore College proved that when we have too many options — we choose worse and are less satisfied. On dating apps with thousands of profiles, people become "shoppers" always thinking "maybe there\'s something better." Matchmaker-based dating — with a small number of quality suggestions — leads to better decisions.' },
        { number: '3', title: 'What You Think You Want ≠ What Actually Makes You Happy', body: 'A surprising 2023 study published in PNAS found that across 421 million potential matches, people\'s stated preferences almost didn\'t predict which matches actually worked. People who said "I want tall" weren\'t necessarily happier with someone tall. What did predict? Similarity in values, personality, and approach to life.' },
        { number: '4', title: 'The Formula: 3 Iron Principles + Openness to Everything Else', body: 'Define 3 things that are truly essential to you — not a "shopping list." For example: (1) an honest and reliable person, (2) someone willing to grow, (3) shares my approach to Jewish life. For everything else — let yourself be surprised. Surprises are a wonderful place to discover love.' },
      ],
    },
    quoteText: {
      he: 'החיים הם מה שקורה כשאתה עסוק בלתכנן תוכניות אחרות',
      en: 'Life is what happens when you\'re busy making other plans',
    },
    quoteSource: 'ג\'ון לנון (ולפניו — אלן סונדרס)',
    closingText: {
      he: 'ב-NeshamaTech, ה-AI שלנו לא מתאים לפי "רשימת קניות" — הוא מזהה דמיון עמוק בערכים, אישיות, וגישה לחיים. זה מה שבאמת עובד. 🎯',
      en: 'At NeshamaTech, our AI doesn\'t match by "shopping list" — it identifies deep similarity in values, personality, and life approach. That\'s what actually works. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'פרופיל עדכני = התאמה מדויקת יותר', en: 'Updated profile = more accurate matching' },
  },

  // ─── Season 3: Advanced Research Series (Emails 21–28) ────────────────────

  {
    id: 'VALUE_21_HARVARD_STUDY',
    emailNumber: '21',
    subject: {
      he: 'מחקר הרווארד בן 80 השנה — מה באמת גורם לאושר? 🎓',
      en: 'Harvard\'s 80-Year Study — What Actually Causes Happiness? 🎓',
    },
    headerEmoji: '🎓',
    headerTitle: { he: 'מה שמחקר הרווארד גילה על אהבה ובריאות', en: 'What Harvard\'s Research Revealed About Love and Health' },
    headerSubtitle: { he: '80 שנות מחקר, אלפי משתתפים, מסקנה אחת מפתיעה', en: '80 years of research, thousands of participants, one surprising conclusion' },
    introText: {
      he: 'מחקר פיתוח המבוגרים של הרווארד (Harvard Study of Adult Development) הוא אחד המחקרים הארוכים ביותר בהיסטוריה: 84 שנות מעקב אחרי 268 גברים שהחל ב-1938, והורחב לאחר מכן לאלפי נבדקים נוספים. המסקנה שגרמה לעולם המדע לעצור ולהכיר: לא כסף, לא פרסום, לא קריירה, ולא IQ — אלא איכות הזוגיות שלנו היא המנבא החזק ביותר לאושר וְלבריאות לאורך החיים.',
      en: 'The Harvard Study of Adult Development is one of the longest studies in history: 84 years of follow-up on 268 men starting in 1938, later expanded to thousands more participants. The conclusion that made the scientific world stop and take notice: not money, not fame, not career, not IQ — but the quality of our relationships is the strongest predictor of happiness and health across a lifetime.',
    },
    tips: {
      he: [
        { number: '1', title: 'זוגיות בגיל 50 מנבאת בריאות בגיל 80 — טוב יותר מכולסטרול', body: 'זה לא מטפורה — זה מדע. ד"ר רוברט וולדינגר, מנהל המחקר, גילה שרמת שביעות הרצון מהזוגיות בגיל 50 ניבאה את הבריאות הפיזית בגיל 80 טוב יותר מאשר רמת הכולסטרול. אנשים שהיו מאושרים בזוגיות שלהם בגיל 50 — חיו יותר, חלו פחות, ואף שמרו טוב יותר על הזיכרון.' },
        { number: '2', title: 'בדידות הורגת — ממש', body: 'וולדינגר אמר משהו שהדהים את העולם: "בדידות הורגת. היא עוצמתית כמו עישון או אלכוהוליזם." אנשים בודדים ממירים כאב פיזי בצורה אינטנסיבית יותר, המוח שלהם מתדרדר מוקדם יותר, ורמת הבריאות שלהם נמוכה יותר בכל פרמטר. זוגיות טובה היא ממש "תרופה" ביולוגית.' },
        { number: '3', title: 'לא כמות הקשרים — איכות הקשרים', body: 'המחקר לא גילה שאנשים עם הרבה חברים מאושרים יותר. הוא גילה שאנשים עם קשרים מעמיקים, אמינים, ואינטימיים — מאושרים יותר. אדם אחד שמרגיש שהוא יכול לסמוך עליך לחלוטין שווה יותר מעשרים היכרויות שטחיות. אותו עיקרון תקף לגמרי לשידוך.' },
        { number: '4', title: 'מה שנלמד מ-84 שנים: "הדאגות שלנו לגבי הבריאות ועתידנו הכלכלי מסיחות את תשומת ליבנו מהדבר האחד שחשוב באמת"', body: 'וולדינגר סיכם: "המסר הפשוט שחוזר שוב ושוב בנתונים שלנו הוא זה: קשרים טובים שומרים עלינו מאושרים ובריאים. נקודה." כל שאר "ההצלחות" — קריירה, כסף, הישגים — חשובות פחות ממה שרובנו מאמינים.' },
      ],
      en: [
        { number: '1', title: 'Relationship Satisfaction at 50 Predicts Health at 80 — Better Than Cholesterol', body: 'This isn\'t metaphor — it\'s science. Dr. Robert Waldinger, the study\'s director, found that relationship satisfaction at 50 predicted physical health at 80 better than cholesterol levels. People who were happy in their relationships at 50 — lived longer, got sick less, and even maintained memory better.' },
        { number: '2', title: 'Loneliness Kills — Literally', body: 'Waldinger said something that stunned the world: "Loneliness kills. It\'s as powerful as smoking or alcoholism." Lonely people experience physical pain more intensely, their brains deteriorate earlier, and their health is lower on every parameter. A good relationship is literally a biological "medicine."' },
        { number: '3', title: 'Not the Quantity of Connections — the Quality', body: 'The study didn\'t find that people with many friends are happier. It found that people with deep, reliable, intimate connections are happier. One person you feel you can completely rely on is worth more than twenty superficial acquaintances. The same principle applies fully to matching.' },
        { number: '4', title: 'What 84 Years Teaches: "Our worries about health and financial future distract us from the one thing that truly matters"', body: 'Waldinger summarized: "The simple message that comes through again and again in our data is this: good relationships keep us happier and healthier. Period." All other "successes" — career, money, achievements — matter less than most of us believe.' },
      ],
    },
    quoteText: {
      he: 'האנשים שהיו הכי מרוצים מהקשרים שלהם בגיל 50 — היו הכי בריאים בגיל 80',
      en: 'The people who were most satisfied in their relationships at age 50 were the healthiest at age 80',
    },
    quoteSource: 'ד"ר רוברט וולדינגר, Harvard Study of Adult Development',
    closingText: {
      he: 'מחקר הרווארד מוכיח: ההשקעה הטובה ביותר שאפשר לעשות היא ביחסים אנושיים. ב-NeshamaTech אנחנו עוזרים לך להשקיע בצורה החכמה ביותר — ולמצוא קשר שישמור עליך מאושר ובריא לשנים ארוכות. 🎯',
      en: 'Harvard\'s research proves: the best investment you can make is in human relationships. At NeshamaTech we help you invest in the smartest way — and find a connection that will keep you happy and healthy for many years. 🎯',
    },
    ctaText: { he: 'לראות את ההתאמות שלי', en: 'See My Matches' },
    ctaNote: { he: 'ההשקעה הטובה ביותר שלך מחכה כאן', en: 'Your best investment is waiting here' },
  },

  {
    id: 'VALUE_22_PERPETUAL_PROBLEMS',
    emailNumber: '22',
    subject: {
      he: '69% מהמריבות בזוגיות הן נצחיות — וזה בסדר גמור 🕊️',
      en: '69% of Relationship Conflicts Are Perpetual — And That\'s Completely Fine 🕊️',
    },
    headerEmoji: '🕊️',
    headerTitle: { he: 'הסוד על קונפליקטים שמעטים יודעים', en: 'The Secret About Conflicts That Few Know' },
    headerSubtitle: { he: 'מחקר גוטמן מגלה: הבעיה היא לא הבעיות', en: 'Gottman\'s research reveals: the problem isn\'t the problems' },
    introText: {
      he: 'רוב האנשים מאמינים שזוגיות מוצלחת היא זוגיות ללא קונפליקטים — או לפחות עם מינימום מחלוקות. גוטמן ניפץ את המיתוס הזה לחלוטין. לאחר לשחקרו אלפי זוגות גילה: **69% מהקונפליקטים בזוגיות הם "נצחיים"** — כלומר, הם לא נפתרים לעולם. זוגות מאושרים לא פתרו יותר קונפליקטים — הם למדו לחיות איתם בכבוד ובהומור.',
      en: 'Most people believe that a successful relationship is one without conflicts — or at least with minimal disagreements. Gottman completely shattered this myth. After studying thousands of couples he discovered: **69% of conflicts in relationships are "perpetual"** — meaning they never fully resolve. Happy couples didn\'t solve more conflicts — they learned to live with them with respect and humor.',
    },
    tips: {
      he: [
        { number: '1', title: 'קונפליקטים "נצחיים" vs. "ניתנים לפתרון" — ההבדל חיוני', body: 'קונפליקט ניתן לפתרון הוא על מצב ספציפי: "איפה אנחנו מבלים את החגים?" — ניתן לפתרון. קונפליקט נצחי הוא על הבדל בסיסי באישיות: אחד מסודר, השני ספונטני. אחד חסכן, השני נדיב. אלה לא בעיות לתקן — אלה הבדלים לנהל. המפתח: לא להפוך הבדל בסיסי לקרב קיום.' },
        { number: '2', title: 'זוגות מאושרים מדברים על בעיות נצחיות — אחרת', body: 'גוטמן גילה שזוגות מאושרים ואומללים מדברים על אותן בעיות בדיוק — אבל בצורה שונה לגמרי. זוגות מאושרים: מוסיפים הומור, מביעים הבנה לנקודת המבט של הצד השני, שומרים על כבוד גם כשנחושים. זוגות אומללים: תוקפים, מבזים, מתגוננים — ה"ארבעה פרשים".' },
        { number: '3', title: 'תרגיל: "מפת הבעיות שלנו"', body: 'לפני שמתחתנים — כדאי לשאול: "מה ההבדלים הבסיסיים ביני לבין הצד השני? האם אני יכול לחיות עם ההבדלים האלה בכבוד ובהומור?" לא "האם ההבדלים האלה יעלמו?" — כי הם לא. אלא "האם אני מוכן להחזיק את ההבדלים האלה בידיים טובות?" זו שאלת הבגרות הזוגית.' },
        { number: '4', title: 'המשמעות לשידוכים: "תאימות" לא אומרת "זהות"', body: 'הטעות הנפוצה ביותר בחיפוש שידוך: לחפש מישהו שהכל בו זהה. גוטמן מלמד שזה לא רק בלתי-אפשרי — זה גם לא רצוי. ההבדלים בין בני הזוג יוצרים עניין, צמיחה, ועושר. השאלה היא לא "האם אנחנו זהים?" אלא "האם אנחנו מכבדים את ההבדלים שבינינו?"' },
      ],
      en: [
        { number: '1', title: '"Perpetual" vs. "Solvable" Conflicts — A Crucial Distinction', body: 'A solvable conflict is about a specific situation: "Where do we spend the holidays?" — solvable. A perpetual conflict is about a fundamental personality difference: one is tidy, the other spontaneous. One is frugal, the other generous. These aren\'t problems to fix — they\'re differences to manage. The key: don\'t turn a fundamental difference into an existential battle.' },
        { number: '2', title: 'Happy Couples Talk About Perpetual Problems — Differently', body: 'Gottman found that happy and unhappy couples discuss the exact same problems — but in completely different ways. Happy couples: add humor, express understanding for the other\'s perspective, maintain respect even when determined. Unhappy couples: attack, demean, become defensive — the "Four Horsemen."' },
        { number: '3', title: 'Exercise: "Our Problem Map"', body: 'Before marriage — it\'s worth asking: "What are the fundamental differences between me and the other person? Can I live with these differences with respect and humor?" Not "Will these differences disappear?" — because they won\'t. But "Am I willing to hold these differences with good hands?" That\'s the question of relationship maturity.' },
        { number: '4', title: 'The Implication for Dating: "Compatibility" Doesn\'t Mean "Identical"', body: 'The most common mistake in searching for a match: looking for someone identical in everything. Gottman teaches that this is not only impossible — it\'s not even desirable. The differences between partners create interest, growth, and richness. The question isn\'t "Are we identical?" but "Do we respect the differences between us?"' },
      ],
    },
    quoteText: {
      he: 'כשני אנשים מסכימים על הכל — אחד מהם מיותר',
      en: 'When two people agree on everything — one of them is unnecessary',
    },
    quoteSource: 'וינסטון צ\'רצ\'יל',
    closingText: {
      he: 'ב-NeshamaTech, ה-AI שלנו מחפש לך מישהו שהערכים הגרעיניים שלו דומים לשלך — לא מישהו שהכל בו זהה. ההבדלים הם חלק מהקסם. 🎯',
      en: 'At NeshamaTech, our AI looks for someone whose core values are similar to yours — not someone identical in everything. The differences are part of the magic. 🎯',
    },
    ctaText: { he: 'להשלים את השאלון', en: 'Complete the Questionnaire' },
    ctaNote: { he: 'נגלה מהם הערכים הגרעיניים שלך', en: 'Let\'s discover your core values' },
  },

  {
    id: 'VALUE_23_ATTRACTION_VS_COMPATIBILITY',
    emailNumber: '23',
    subject: {
      he: 'מדעי המוח של אהבה — למה רושם ראשון לא מספיק 🧠',
      en: 'The Neuroscience of Love — Why First Impressions Aren\'t Enough 🧠',
    },
    headerEmoji: '🧠',
    headerTitle: { he: 'משיכה vs. התאמה — שני מערכות שונות לחלוטין', en: 'Attraction vs. Compatibility — Two Completely Different Systems' },
    headerSubtitle: { he: 'מה קורה במוח שלך כשאתה מתאהב — ולמה זה לא מספיק', en: 'What happens in your brain when you fall in love — and why it\'s not enough' },
    introText: {
      he: 'הנוירולוגיה של אהבה גילתה משהו מפתיע: משיכה והתאמה הן שתי מערכות עצביות שונות לחלוטין — עם מנגנונים שונים, תפקידים שונים, ולוחות זמנים שונים. הבלבול ביניהן גרם לאין ספור כישלונות זוגיים. להבין אותן — זה אחד הדברים החשובים ביותר שיכולים לשנות את ההצלחה שלך בשידוכים.',
      en: 'The neurology of love revealed something surprising: attraction and compatibility are two completely different neural systems — with different mechanisms, different functions, and different timelines. Confusing them has caused countless relationship failures. Understanding them — is one of the most important things that can change your success in dating.',
    },
    tips: {
      he: [
        { number: '1', title: 'מערכת הדופמין — "הריגוש" שמתעתע', body: 'כשאתה חווה "ניצוצות" בפגישה ראשונה — זו מערכת הדופמין. היא אחראית על מוטיבציה, ציפייה, ורצון. הבעיה: מערכת הדופמין מופעלת על ידי חדשנות ואי-ודאות — לא על ידי התאמה. לכן לעיתים קרובות אנחנו נמשכים לאנשים שהם "מסתוריים", "מאתגרים", או "לא בטוחים" — ולא בהכרח לאנשים שמתאימים לנו.' },
        { number: '2', title: 'מערכת האוקסיטוצין — "הביטחון" שבונה', body: 'אוקסיטוצין — "הורמון הקשר" — מופרש דרך זמן, מגע, שיחות עמוקות, ואמון שנבנה בהדרגה. זו המערכת שבונה זוגיות ארוכת טווח. הבעיה? היא עובדת לאט. לכן פגישה ראשונה שבה "לא קפץ עליך" עדיין יכולה להוביל לאהבה עמוקה — אם נותנים לה זמן. גוטמן מצא שרוב הזוגות המאושרים ביותר לא חוו "אהבה ממבט ראשון".' },
        { number: '3', title: 'הטעות הגדולה: "לא הרגשתי כימיה"', body: '"לא הרגשתי כימיה בדייט הראשון" — הסיבה הנפוצה ביותר לסיום הצעות שידוך. אבל המחקר מראה שכימיה היא לעיתים קרובות דבר שמתפתח — לא משהו שנוצר בבת אחת. ד"ר הלן פישר (אחת מחוקרות הרומנטיקה הבכירות) מצאה שאנשים רבים מדווחים שהאהבה הגדולה שלהם "לא הייתה אהבה ממבט ראשון".' },
        { number: '4', title: 'מה כן לבדוק בפגישה ראשונה', body: 'אם לא "כימיה", מה כן? (1) האם השיחה זרמה בקלות — אפילו אם לא "לוהטת"? (2) האם הצד השני הקשיב לך באמת? (3) האם הרגשת שהוא/היא אדם טוב ואמין? (4) האם הייתה כבוד הדדי? אלה המדדים שמנבאים הצלחה — לא "ניצוצות" שיכולים להיות אשליה של הדופמין.' },
      ],
      en: [
        { number: '1', title: 'The Dopamine System — The "Excitement" That Deceives', body: 'When you experience "sparks" on a first date — that\'s your dopamine system. It\'s responsible for motivation, anticipation, and desire. The problem: the dopamine system is activated by novelty and uncertainty — not by compatibility. That\'s why we\'re often attracted to people who are "mysterious," "challenging," or "unpredictable" — not necessarily to people who suit us.' },
        { number: '2', title: 'The Oxytocin System — The "Security" That Builds', body: 'Oxytocin — the "bonding hormone" — is released through time, touch, deep conversations, and gradually built trust. This is the system that builds long-term relationships. The problem? It works slowly. So a first date where you didn\'t "feel it" can still lead to deep love — if you give it time. Gottman found that most of the happiest couples didn\'t experience "love at first sight."' },
        { number: '3', title: 'The Big Mistake: "I Didn\'t Feel Chemistry"', body: '"I didn\'t feel chemistry on the first date" — the most common reason for ending match proposals. But research shows that chemistry is often something that develops — not something that appears all at once. Dr. Helen Fisher (one of the leading romance researchers) found that many people report their greatest love "was not love at first sight."' },
        { number: '4', title: 'What to Actually Check on a First Date', body: 'If not "chemistry," then what? (1) Did conversation flow easily — even if not "fiery"? (2) Did the other person actually listen to you? (3) Did you feel they were a good and trustworthy person? (4) Was there mutual respect? These are the indicators that predict success — not "sparks" that can be a dopamine illusion.' },
      ],
    },
    quoteText: {
      he: 'אהבה שמתחילה בעיניים — לא תמיד מגיעה ללב. אהבה שמתחילה בלב — תמיד מגיעה לעיניים',
      en: 'Love that begins in the eyes doesn\'t always reach the heart. Love that begins in the heart always reaches the eyes',
    },
    quoteSource: 'ר\' נחמן מברסלב (עפ"י)',
    closingText: {
      he: 'ב-NeshamaTech, השדכנים שלנו וה-AI מבינים שהתאמה עמוקה חשובה יותר מ"ניצוצות" ראשוניים. לכן אנחנו ממליצים תמיד לתת לפחות 2-3 פגישות לפני הכרעה — הכימיה האמיתית צריכה זמן להתפתח. 🎯',
      en: 'At NeshamaTech, our matchmakers and AI understand that deep compatibility matters more than initial "sparks." That\'s why we always recommend giving at least 2-3 meetings before deciding — real chemistry needs time to develop. 🎯',
    },
    ctaText: { he: 'לראות את ההתאמות שלי', en: 'See My Matches' },
    ctaNote: { he: 'תן לכימיה האמיתית זמן להתפתח', en: 'Give real chemistry time to develop' },
  },

  {
    id: 'VALUE_24_EMOTIONAL_BANK',
    emailNumber: '24',
    subject: {
      he: 'חשבון הבנק הרגשי — האם שלך ביתרה או במינוס? 🏦',
      en: 'The Emotional Bank Account — Are Yours in Credit or Deficit? 🏦',
    },
    headerEmoji: '🏦',
    headerTitle: { he: 'חשבון הבנק הרגשי של הזוגיות שלך', en: 'Your Relationship\'s Emotional Bank Account' },
    headerSubtitle: { he: 'הדרך שגוטמן מסביר איך נבנה — ואיך נהרס — אמון', en: 'The way Gottman explains how trust is built — and how it\'s destroyed' },
    introText: {
      he: 'גוטמן פיתח מטפורה שהפכה לאחת הכלים החינוכיים החשובים ביותר בפסיכולוגיית הזוגיות: "חשבון הבנק הרגשי". כמו חשבון בנק רגיל — יש בו הפקדות ומשיכות. ביחסים בריאים, ישנה יתרת הפקדות קבועה. ביחסים שנכנסים למשבר — החשבון נכנס למינוס, ואז הכל מרגיש כבד ומייסר.',
      en: 'Gottman developed a metaphor that became one of the most important educational tools in relationship psychology: the "Emotional Bank Account." Like a regular bank account — it has deposits and withdrawals. In healthy relationships, there\'s a consistent positive balance. In relationships entering crisis — the account goes into deficit, and then everything feels heavy and painful.',
    },
    tips: {
      he: [
        { number: '1', title: 'הפקדות — מה בונה יתרה', body: 'הפקדות רגשיות הן: להגיד "אני גאה בך" בלי שביקשו, לזכור פרטים קטנים שהצד השני סיפר, לשאול "איך עבר לך הישיבה הקשה?" בסוף היום, להודות על משהו ספציפי, לתת מגע חם ולא רק "תפקודי", לצחוק יחד. ההפקדות לא חייבות להיות גדולות — הן חייבות להיות עקביות.' },
        { number: '2', title: 'משיכות — מה מרוקן את החשבון', body: 'משיכות גדולות: ביקורת, בוז, הסתגרות, ועוינות גלויה. משיכות קטנות אך מצטברות: להתעלם מבקשות קטנות, לבדוק את הטלפון בזמן שיחה, לשכוח דברים חשובים שסופרו, לענות "מה?" בטון קצר. עשר משיכות קטנות יכולות לנקז יתרה שנבנתה על ידי חמישים הפקדות.' },
        { number: '3', title: 'האסימטריה שחייבים להבין', body: 'כלכלה בסיסית של הלב: הפקדות קטנות ומשיכות גדולות. זה אומר שנדרשות הרבה יותר "הפקדות" כדי לבנות יתרה מהר ממה שמשיכה אחת מנקזת. לא צדק — אבל זו המציאות הנוירולוגית. לכן גוטמן מדגיש: "עשה דברים קטנים לעתים קרובות" — לא אירועים גדולים לעתים רחוקות.' },
        { number: '4', title: 'תרגול: "הפקדה ביום" — כבר מהיום', body: 'תרגיל שגוטמן ממליץ: בחר הפקדה קטנה אחת ביום — וטמפלט אותה. "כל בוקר אני שואל את _____ שאלה אמיתית אחת על חייהם." "כל ערב אני מוסר מחמאה אחת ספציפית." "פעם בשבוע אני עושה משהו שהוא/היא אוהב/ת בלי שביקש/ה." תרגל עכשיו — עם הורים, חברים — ותכנס לזוגיות עם הרגל שישנה הכל.' },
      ],
      en: [
        { number: '1', title: 'Deposits — What Builds the Balance', body: 'Emotional deposits are: saying "I\'m proud of you" without being asked, remembering small details the other person shared, asking "How was that difficult meeting?" at the end of the day, thanking for something specific, giving warm (not just functional) touch, laughing together. Deposits don\'t have to be big — they have to be consistent.' },
        { number: '2', title: 'Withdrawals — What Drains the Account', body: 'Large withdrawals: criticism, contempt, stonewalling, and open hostility. Small but cumulative withdrawals: ignoring small requests, checking your phone during conversation, forgetting important things that were shared, answering "what?" in a short tone. Ten small withdrawals can drain a balance built by fifty deposits.' },
        { number: '3', title: 'The Asymmetry You Must Understand', body: 'The basic economics of the heart: small deposits and large withdrawals. This means many more "deposits" are needed to build a balance quickly than one withdrawal drains. Not fair — but this is neurological reality. That\'s why Gottman emphasizes: "Do small things often" — not big events rarely.' },
        { number: '4', title: 'Practice: "One Deposit a Day" — Starting Today', body: 'An exercise Gottman recommends: choose one small deposit per day — and template it. "Every morning I ask _____ one real question about their life." "Every evening I give one specific compliment." "Once a week I do something they love without being asked." Practice now — with parents, friends — and you\'ll enter your relationship with a habit that changes everything.' },
      ],
    },
    quoteText: {
      he: 'עשה דברים קטנים לעתים קרובות — זה הסוד של זוגיות מאושרת',
      en: 'Do small things often — that\'s the secret of a happy relationship',
    },
    quoteSource: 'ד"ר ג\'ון גוטמן',
    closingText: {
      he: 'חשבון הבנק הרגשי שלך עם כל אדם — כולל השדכנית שלך, חברים, ומשפחה — בנוי עכשיו, ברגעים הקטנים. ב-NeshamaTech מאמינים שהכנה לזוגיות מתחילה עוד לפני שמצאנו את ההתאמה. 🎯',
      en: 'Your emotional bank account with every person — including your matchmaker, friends, and family — is being built now, in the small moments. NeshamaTech believes that relationship preparation begins before we find the match. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'פרופיל מעמיק = התאמה מעמיקה', en: 'A deep profile = a deep match' },
  },

  {
    id: 'VALUE_25_HUMAN_VS_ALGORITHM',
    emailNumber: '25',
    subject: {
      he: 'למה אלגוריתם לא יכול למצוא לך אהבה — ומה כן 🤝',
      en: 'Why an Algorithm Can\'t Find You Love — And What Can 🤝',
    },
    headerEmoji: '🤝',
    headerTitle: { he: 'גבולות האלגוריתם — כוח האדם', en: 'The Limits of the Algorithm — The Power of the Human' },
    headerSubtitle: { he: 'מה מחקר ML על 11,000 זוגות גילה על שידוכים', en: 'What an ML study on 11,000 couples revealed about matchmaking' },
    introText: {
      he: 'ב-2020 פרסמה ד"ר סמנתה ג\'ואל מחקר שהדהים את עולם הפסיכולוגיה. היא ושותפיה השתמשו ב-Machine Learning — הטכנולוגיה החכמה ביותר הקיימת — כדי לנסות לחזות אם שני אנשים ייצרו כימיה, ואם הזוגיות שלהם תצליח. הם ניתחו 43 מחקרים ו-11,000 זוגות. התוצאה: האלגוריתם כמעט לא הצליח. אפילו עם כל הנתונים בעולם — הוא לא יכול לחזות מי יאהב את מי.',
      en: 'In 2020, Dr. Samantha Joel published a study that stunned the psychology world. She and her colleagues used Machine Learning — the most sophisticated technology available — to try to predict whether two people would have chemistry, and whether their relationship would succeed. They analyzed 43 studies and 11,000 couples. The result: the algorithm barely succeeded. Even with all the data in the world — it couldn\'t predict who would love whom.',
    },
    tips: {
      he: [
        { number: '1', title: 'מה המחקר גילה בדיוק', body: 'ג\'ואל גילתה שמאפייני הפרט — אישיות, תחביבים, עמדות, דמוגרפיה — מסבירים אחוז זעיר בלבד מהשונות בתוצאות הזוגיות. במילים אחרות: ידיעה מלאה של "מי אתה" כמעט לא מנבאת "מי יתאים לך". מה כן מנבא? הדינמיקה הספציפית בין שני אנשים ספציפיים — וזה לא ניתן לחיזוי מ"פרופיל".' },
        { number: '2', title: 'מה שאלגוריתם לא יכול לתפוס', body: 'אלגוריתם לא יכול לתפוס: כיצד שני אנשים "מווסתים" זה את העצבים של זה (co-regulation). לא יכול לדעת אם ההומור שלהם "לוקח". לא יכול לחוש את ה"ריח הכימי" שמדענים גילו שהוא גורם משיכה אמיתי. לא יכול להבין הקשר חיים, עיתוי, ובשלות — שכולם חיוניים.' },
        { number: '3', title: 'מה שדכנית כן יכולה', body: 'שדכנית מנוסה רואה דברים שאלגוריתם עיוור להם: "הוא מתאים לה כי שניהם צריכים מישהו שנותן להם מרחב." "היא מתאימה לו כי הם שניהם עמוקים אבל שניהם נוטים להסתיר את זה." "הם שניהם חוו אבדן ויבינו אחד את השני." זו חוכמה אנושית שאין עדיין מחשב שיכול לשכפל אותה.' },
        { number: '4', title: 'ב-NeshamaTech: הטוב מכל העולמות', body: 'זו הסיבה שב-NeshamaTech בחרנו במודל ההיברידי: ה-AI שלנו מנתח 5 עולמות של כל פרופיל ומצמצם את הריבוי לרשימה קצרה של התאמות מעמיקות. לאחר מכן, שדכנים אנושיים — עם שנות ניסיון — מוסיפים את השכבה שהאלגוריתם לא יכול לתת. טכנולוגיה + אנושיות = ההגדרה של NeshamaTech.' },
      ],
      en: [
        { number: '1', title: 'What the Study Precisely Found', body: 'Joel found that individual characteristics — personality, hobbies, attitudes, demographics — explain only a tiny percentage of variance in relationship outcomes. In other words: complete knowledge of "who you are" barely predicts "who will suit you." What does predict? The specific dynamic between two specific people — and that can\'t be predicted from a "profile."' },
        { number: '2', title: 'What an Algorithm Can\'t Capture', body: 'An algorithm can\'t capture: how two people "co-regulate" each other\'s nervous systems. Can\'t know if their humor "lands." Can\'t sense the "chemical scent" that scientists found is a real attraction factor. Can\'t understand life context, timing, and readiness — all of which are essential.' },
        { number: '3', title: 'What a Matchmaker Can', body: 'An experienced matchmaker sees things an algorithm is blind to: "He suits her because they both need someone who gives them space." "She suits him because they\'re both deep but both tend to hide it." "They\'ve both experienced loss and will understand each other." This is human wisdom that no computer can yet replicate.' },
        { number: '4', title: 'At NeshamaTech: The Best of Both Worlds', body: 'This is why at NeshamaTech we chose the hybrid model: our AI analyzes 5 worlds of every profile and narrows the multitude to a short list of deep matches. Then, human matchmakers — with years of experience — add the layer the algorithm can\'t give. Technology + humanity = the NeshamaTech definition.' },
      ],
    },
    quoteText: {
      he: 'אהבה אינה משוואה — היא פגישה',
      en: 'Love is not an equation — it is an encounter',
    },
    quoteSource: 'מרטין בובר, "אני ואתה"',
    closingText: {
      he: 'שום אלגוריתם לא יחליף את המגע האנושי של שדכנית שמכירה אותך. ושום שדכנית לא תיתן לך את הדיוק שה-AI יכול לספק. ב-NeshamaTech — שניהם יחד. 🎯',
      en: 'No algorithm will replace the human touch of a matchmaker who knows you. And no matchmaker will give you the precision that AI can provide. At NeshamaTech — both together. 🎯',
    },
    ctaText: { he: 'לעדכן את הפרופיל שלי', en: 'Update My Profile' },
    ctaNote: { he: 'פרופיל מלא = AI מדויק + שדכנית מדויקת', en: 'Full profile = precise AI + precise matchmaker' },
  },

  {
    id: 'VALUE_26_REPAIR_ATTEMPTS',
    emailNumber: '26',
    subject: {
      he: 'ניסיונות תיקון — הכישרון שמציל כל זוגיות 🛠️',
      en: 'Repair Attempts — The Skill That Saves Every Relationship 🛠️',
    },
    headerEmoji: '🛠️',
    headerTitle: { he: 'ניסיונות תיקון — Repair Attempts', en: 'Repair Attempts — The Art of Coming Back' },
    headerSubtitle: { he: 'מה שזוגות מאושרים עושים אחרי מריבה שזוגות אחרים לא עושים', en: 'What happy couples do after a fight that others don\'t' },
    introText: {
      he: 'גוטמן גילה משהו מפתיע: זוגות מאושרים לא נלחמים פחות — הם מתקנים טוב יותר. הוא הגדיר "ניסיון תיקון" כ"כל אמירה או פעולה — מצחיקה או אחרת — שמונעת מהשליליות להסלים." גוטמן אמר שכישלון ניסיונות התיקון הוא "אחד המנבאים האמינים ביותר לפירוק הזוגיות." המסקנה: הצלחת הזוגיות לא תלויה בהיעדר קונפליקטים — אלא ביכולת לחזור אחרי כל מריבה.',
      en: 'Gottman discovered something surprising: happy couples don\'t fight less — they repair better. He defined a "repair attempt" as "any statement or action — silly or otherwise — that prevents negativity from escalating." Gottman said that the failure of repair attempts is "one of the most reliable predictors of relationship dissolution." The conclusion: relationship success doesn\'t depend on absent conflicts — but on the ability to return after every fight.',
    },
    tips: {
      he: [
        { number: '1', title: 'מה נחשב "ניסיון תיקון"?', body: 'ניסיון תיקון יכול להיות: הומור ("אנחנו שניינו ממש מוצלחים כשאנחנו עצבניים, לא?"), קריאת תיגר עדינה ("רגע, בואו נעצור ונסביר מחדש"), מחווה ("אני הולך להכין לך קפה"), הכרה ("את צודקת, לא שמעתי אותך טוב"), או פשוט הפסקה ("אני צריך 20 דקות, ואז אחזור ונמשיך"). כל אלה ניסיונות תיקון.' },
        { number: '2', title: 'למה הם לא תמיד עובדים', body: 'ניסיון תיקון עובד רק אם "חשבון הבנק הרגשי" ביתרה מספקת. אם החשבון כבר בעומק מינוס — אפילו ניסיון תיקון כנה מתקבל בחשד: "אתה רק מנסה לברוח מהנושא." לכן הקשר בין הפקדות יומיות לבין ניסיונות תיקון הוא ישיר: כדי שהתיקון יעבוד — צריך יתרה שתסמוך עליו.' },
        { number: '3', title: 'ניסיון תיקון ראשוני — לפני שמגיעים לקרב', body: 'הנוסחה הכי חכמה: לנסות תיקון כבר ב"סימני האזהרה הראשונים" — לא לחכות לפיצוץ. "רגע, אני מרגיש שהשיחה שלנו הולכת לכיוון קשה. יש לך כוח שנעצור ונחזיר אותה לאיזשהי גישה שעובדת?" אדם שמזהה מוקדם ומתקן מוקדם — חוסך שניהם ייסורים רבים.' },
        { number: '4', title: 'כיצד תרגל ניסיונות תיקון — עכשיו', body: 'תרגיל: חשוב על שלוש מריבות אחרונות שהיו לך — עם מישהו קרוב. מה עשית? ברחת? נסגרת? האשמת? עכשיו תכתוב: מה יכולת להגיד שהיה "ניסיון תיקון"? אנשים שמתרגלים ניסיונות תיקון בחייהם הרגילים — מגיעים לזוגיות עם כישרון שרוב האנשים לומדים רק אחרי שנים של נישואים.' },
      ],
      en: [
        { number: '1', title: 'What Counts as a "Repair Attempt"?', body: 'A repair attempt can be: humor ("We\'re both so excellent at being angry, aren\'t we?"), a gentle challenge ("Wait, let\'s stop and restate"), a gesture ("I\'m going to make you coffee"), acknowledgment ("You\'re right, I didn\'t listen well"), or simply a pause ("I need 20 minutes, then I\'ll come back and we\'ll continue"). All of these are repair attempts.' },
        { number: '2', title: 'Why They Don\'t Always Work', body: 'A repair attempt only works if the "emotional bank account" has a sufficient positive balance. If the account is already deeply in deficit — even a sincere repair attempt is received with suspicion: "You\'re just trying to escape the topic." That\'s why the connection between daily deposits and repair attempts is direct: for repair to work — there needs to be a balance that trusts it.' },
        { number: '3', title: 'Early Repair Attempt — Before Reaching Combat', body: 'The smartest formula: try repair at the "first warning signs" — don\'t wait for the explosion. "Wait, I feel our conversation is heading in a hard direction. Do you have the energy to pause and bring it back to some approach that works?" A person who identifies early and repairs early — saves both of them much suffering.' },
        { number: '4', title: 'How to Practice Repair Attempts — Now', body: 'Exercise: think of three recent fights you had — with someone close. What did you do? Did you flee? Shut down? Blame? Now write: what could you have said that would have been a "repair attempt"? People who practice repair attempts in their regular lives — arrive at relationships with a skill that most people only learn after years of marriage.' },
      ],
    },
    quoteText: {
      he: 'לא בקרב אנחנו נמדדים — אלא ביכולת לחזור בכבוד אחריו',
      en: 'We are not measured in the fight — but in the ability to return with dignity after it',
    },
    quoteSource: 'עפ"י פרקי אבות',
    closingText: {
      he: 'כישרון התיקון הוא לא כישרון מולד — הוא מיומנות שאפשר ללמוד ולתרגל. ב-NeshamaTech השדכנים שלנו יכולים לעזור גם בשלב הדייטים — לא רק למצוא התאמה, אלא להכין אותך להצלחה בה. 🎯',
      en: 'The repair skill is not an innate talent — it\'s a skill that can be learned and practiced. At NeshamaTech our matchmakers can help even during the dating stage — not just find a match, but prepare you to succeed in it. 🎯',
    },
    ctaText: { he: 'לדבר עם השדכנית שלי', en: 'Talk to My Matchmaker' },
    ctaNote: { he: 'השדכנית שלך כאן — לא רק לשידוכים', en: 'Your matchmaker is here — not just for matching' },
  },

  {
    id: 'VALUE_27_LOVE_MAPS',
    emailNumber: '27',
    subject: {
      he: 'מפות אהבה — כמה אתה באמת מכיר את בן/בת הזוג שלך? 🗺️',
      en: 'Love Maps — How Well Do You Really Know Your Partner? 🗺️',
    },
    headerEmoji: '🗺️',
    headerTitle: { he: 'מפות אהבה — Love Maps', en: 'Love Maps — The First Floor of a Lasting Home' },
    headerSubtitle: { he: 'הבסיס שכל בית יהודי חזק עומד עליו — גם לפי המדע', en: 'The foundation every strong home stands on — according to science too' },
    introText: {
      he: 'הקומה הראשונה ב"בית הזוגיות" של גוטמן — הבסיס של כל השאר — נקראת "מפות אהבה". לא מפות גאוגרפיות. מפות של העולם הפנימי של בן/בת הזוג: החלומות שלו, הפחדים שלה, הזיכרונות שעיצבו אותו, האנשים שחשובים לה, הדברים שמחוללים בו שמחה, מה שמעיק עליה בלילה. ככל שה"מפה" שלך מפורטת יותר — כך הזוגיות שלך יציבה יותר.',
      en: 'The first floor of Gottman\'s "Relationship House" — the foundation of everything else — is called "Love Maps." Not geographical maps. Maps of your partner\'s inner world: his dreams, her fears, the memories that shaped him, the people important to her, what brings him joy, what weighs on her at night. The more detailed your "map" — the more stable your relationship.',
    },
    tips: {
      he: [
        { number: '1', title: 'מה גוטמן גילה על מפות אהבה', body: 'גוטמן גילה שזוגות שחוו משברים חיצוניים — מחלה, פיטורים, אבדן — שרדו הרבה יותר טוב כשהיו להם "מפות אהבה" מפורטות. הסיבה: כשאתה מכיר טוב את העולם הפנימי של בן/בת הזוג — אתה מבין את ההתנהגות שלו/ה בזמן לחץ, לא מפרש אותה כהתקפה. "הוא נסגר כי הוא פוחד" — לא "הוא נסגר כי לא אכפת לו ממני".' },
        { number: '2', title: '36 שאלות שמייצרות קרבה', body: 'פרופ\' ארתור ארון מאוניברסיטת סטוני ברוק פיתח מחקר מפורסם: 36 שאלות שנשאלות בהדרגה — מה שמצחיק אותך, לאיזה זיכרון ילדות אתה חוזר, מה הייתה חלום נסתר שמעולם לא סיפרת — יוצרות קרבה רגשית עמוקה תוך שעות. הוא הוכיח שקרבה אמיתית היא לא פרי של זמן בלבד — אלא פרי של שאלות נכונות.' },
        { number: '3', title: 'שאלות לבניית "מפת אהבה" בדייטים', body: 'במקום: "מה אתה עושה?" ו"מאיפה אתה?" — נסו: "מה היה הרגע שהכי שינה אותך בחמש השנים האחרונות?", "מי האדם שהכי השפיע עליך, ואיך?", "אם יכולת לשנות דבר אחד בחייך — מה היה?", "מה אתה הכי גאה בו שאנשים לא יודעים עליו?". שאלות כאלה בונות מפת אהבה — ויוצרות זיכרון של פגישה.' },
        { number: '4', title: 'הקשר למסורת היהודית: "שמע ישראל"', body: 'הציווי המרכזי ביותר ביהדות הוא שמיעה — "שמע". לדעת את האחר פירושו קודם כל להקשיב לו. המסורת היהודית מלמדת שידיעת אדם — כבוד הבריות — היא ערך עמוק. זוגיות שבה שני הצדדים מחויבים לדעת ולהבין את העולם הפנימי של השני — מגלמת את הרעיון היהודי של "מי שמציל נפש אחת" — נפשות שרואות זו את זו.' },
      ],
      en: [
        { number: '1', title: 'What Gottman Discovered About Love Maps', body: 'Gottman found that couples who experienced external crises — illness, job loss, bereavement — survived much better when they had detailed "love maps." The reason: when you truly know your partner\'s inner world — you understand their behavior under stress, instead of interpreting it as an attack. "He shut down because he\'s scared" — not "He shut down because he doesn\'t care about me."' },
        { number: '2', title: '36 Questions That Create Closeness', body: 'Prof. Arthur Aron of Stony Brook University developed a famous study: 36 questions asked gradually — what makes you laugh, what childhood memory do you return to, what hidden dream have you never shared — create deep emotional closeness within hours. He proved that real closeness isn\'t just the fruit of time — but the fruit of the right questions.' },
        { number: '3', title: 'Questions to Build "Love Maps" on Dates', body: 'Instead of "What do you do?" and "Where are you from?" — try: "What was the moment that most changed you in the last five years?", "Who most influenced you, and how?", "If you could change one thing in your life — what would it be?", "What are you most proud of that people don\'t know about?" Such questions build a love map — and create a memorable meeting.' },
        { number: '4', title: 'The Jewish Connection: "Shema Yisrael"', body: 'The most central commandment in Judaism is hearing — "Shema." To know another person means first to listen to them. Jewish tradition teaches that knowing a person — kavod habriyot — is a deep value. A relationship where both sides are committed to knowing and understanding each other\'s inner world — embodies the Jewish idea of "one who saves a single soul" — souls that truly see each other.' },
      ],
    },
    quoteText: {
      he: 'לדעת אדם — לא שמו ומקצועו — אלא עולמו הפנימי, פחדיו, ותקוותיו — זו האהבה האמיתית',
      en: 'To know a person — not their name and profession — but their inner world, fears, and hopes — that is true love',
    },
    quoteSource: 'עפ"י ד"ר ג\'ון גוטמן',
    closingText: {
      he: 'השאלון של NeshamaTech הוא תחילת "מפת האהבה" שלך — הוא עוזר לנו להבין את העולם הפנימי שלך ולהתאים לך מישהו שיראה אותו. ממלא את השאלון בכנות ובפירוט — ועוזר לנו לעזור לך. 🎯',
      en: 'The NeshamaTech questionnaire is the beginning of your "Love Map" — it helps us understand your inner world and match you with someone who will see it. Fill the questionnaire honestly and in detail — and help us help you. 🎯',
    },
    ctaText: { he: 'למלא את השאלון', en: 'Take the Questionnaire' },
    ctaNote: { he: 'כל תשובה מפרטת = מפה מדויקת יותר', en: 'Every detailed answer = a more accurate map' },
  },

  {
    id: 'VALUE_28_PARADOX_CHOICE_DATING',
    emailNumber: '28',
    subject: {
      he: 'פחות בחירות = יותר אושר — המדע שישנה איך אתה מחפש 🎯',
      en: 'Fewer Choices = More Happiness — The Science That Will Change How You Search 🎯',
    },
    headerEmoji: '🎯',
    headerTitle: { he: 'פרדוקס הבחירה בשידוכים', en: 'The Paradox of Choice in Dating' },
    headerSubtitle: { he: 'למה אפליקציות הכרויות עם מיליוני פרופילים מייצרות פחות זוגות', en: 'Why dating apps with millions of profiles produce fewer couples' },
    introText: {
      he: 'פרופ\' בארי שוורץ מאוניברסיטת סווארתמור הוכיח בספרו "פרדוקס הבחירה" (2004) דבר שמנוגד לאינטואיציה של רובנו: **יותר אפשרויות = פחות שביעות רצון**. לא רק בסופרמרקט — גם בדייטים, בחירת קריירה, ואפילו בבחירת בן/בת זוג. ככל שיש לנו יותר פרופילים לדפדף — כך אנחנו מחליטים פחות טוב ומרגישים פחות מרוצים ממה שבחרנו.',
      en: 'Prof. Barry Schwartz of Swarthmore College proved in his book "The Paradox of Choice" (2004) something that contradicts most people\'s intuition: **more options = less satisfaction**. Not just in supermarkets — in dating, career choice, and even in choosing a life partner. The more profiles we have to swipe — the worse we decide and the less satisfied we feel with what we chose.',
    },
    tips: {
      he: [
        { number: '1', title: 'מחקר הריבה שהסביר הכל', body: 'הפסיכולוגים שנה אייינגר ומארק לפר ביצעו ניסוי בסופרמרקט: שולחן עם 24 סוגי ריבה לעומת שולחן עם 6 סוגים. יותר אנשים עצרו ליד 24 הסוגים — אבל 10 פעמים יותר אנשים קנו מהשולחן עם 6 הסוגים! ריבוי אפשרויות מוביל לשיתוק, לא להחלטה. בדייטינג? אפליקציה עם 10,000 פרופילים "מקפיאה" את המשתמש.' },
        { number: '2', title: 'ה"מקסימייזר" — הפסיכולוגיה שמקלקלת חיי אהבה', body: 'שוורץ הבחין בין "מקסימייזרים" (אנשים שתמיד מחפשים "הטוב ביותר האפשרי") לבין "סטיספייסרים" (אנשים שמחפשים "טוב מספיק"). המפתיע: מקסימייזרים מקבלים לעיתים קרובות תוצאות אובייקטיביות טובות יותר — אבל מרגישים הרבה פחות מאושרים ממה שבחרו. בדייטינג, "מקסימייזר" תמיד חושב "אולי יש מישהו טוב יותר שם בחוץ".' },
        { number: '3', title: 'מה שידוך מסורתי מבין שאפליקציות לא', body: 'שיטת השידוך המסורתית — עם שדכנית שמביאה הצעה אחת מעמיקה בכל פעם — מגלמת בדיוק את "ארכיטקטורת הבחירה" שמדעני ההחלטות ממליצים עליה: מספר קטן של אפשרויות איכותיות, ממוקדות, עם מידע רלוונטי. זה לא עתיק — זה מדעי.' },
        { number: '4', title: 'הפתרון: "מספיק טוב" הוא לא ויתור — הוא חוכמה', body: 'שוורץ ממליץ לאמץ "גישת הסטיספייסר": הגדר מה "מספיק טוב" עבורך, ובחר את האפשרות הראשונה שעומדת בתנאים — במקום לחפש אינסוף. בשידוכים: כשנמצאת הצעה שעומדת בקריטריונים הגרעיניים שלך — תן לה הזדמנות אמיתית, במקום לתהות "אולי יש טוב יותר". הזדמנות אמיתית שינה יותר זוגיויות מ"אפשרות מושלמת".' },
      ],
      en: [
        { number: '1', title: 'The Jam Study That Explained Everything', body: 'Psychologists Sheena Iyengar and Mark Lepper ran an experiment in a supermarket: a table with 24 jam varieties vs. a table with 6. More people stopped at the 24 varieties — but 10 times more people bought from the table with 6! An abundance of options leads to paralysis, not decision. In dating? An app with 10,000 profiles "freezes" the user.' },
        { number: '2', title: 'The "Maximizer" — The Psychology That Ruins Love Lives', body: 'Schwartz distinguished between "maximizers" (always seeking "the absolute best") and "satisficers" (seeking "good enough"). The surprise: maximizers often get objectively better outcomes — but feel much less happy with what they chose. In dating, a "maximizer" always wonders "maybe there\'s someone better out there."' },
        { number: '3', title: 'What Traditional Matchmaking Understands That Apps Don\'t', body: 'The traditional matchmaking method — with a matchmaker bringing one deep proposal at a time — perfectly embodies the "choice architecture" that decision scientists recommend: a small number of quality, focused options, with relevant information. This isn\'t ancient — it\'s scientific.' },
        { number: '4', title: 'The Solution: "Good Enough" Is Not Settling — It\'s Wisdom', body: 'Schwartz recommends adopting a "satisficer approach": define what "good enough" is for you, and choose the first option that meets the criteria — instead of endlessly searching. In matchmaking: when a proposal meets your core criteria — give it a real chance, instead of wondering "maybe there\'s better." A real chance has transformed more relationships than a "perfect option."' },
      ],
    },
    quoteText: {
      he: 'הסוד לאושר הוא ציפיות נמוכות — ולא כי אין לנו יעדים, אלא כי אנחנו מכירים בגבולות המציאות',
      en: 'The secret to happiness is low expectations — not because we have no goals, but because we recognize the limits of reality',
    },
    quoteSource: 'פרופ\' בארי שוורץ, The Paradox of Choice',
    closingText: {
      he: 'ב-NeshamaTech, ה-AI שלנו מגיש לשדכנים רשימה קצרה וממוקדת של ההתאמות הכי מדויקות — לא מאות פרופילים. זה לא מגבלה — זו המתנה. פחות בחירות, יותר עמוקות = יותר סיכויים להצלחה אמיתית. 🎯',
      en: 'At NeshamaTech, our AI presents matchmakers with a short, focused list of the most precise matches — not hundreds of profiles. This isn\'t a limitation — it\'s the gift. Fewer choices, more depth = greater chances of real success. 🎯',
    },
    ctaText: { he: 'לראות את ההתאמות שלי', en: 'See My Matches' },
    ctaNote: { he: 'איכות על פני כמות — תמיד', en: 'Quality over quantity — always' },
  },
];

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export class ValueEmailOrchestrator {

  private static readonly INTERVAL_DAYS = 3;     // minimum days between value emails
  private static readonly BATCH_SIZE = 50;        // users per batch (avoid timeouts)

  // ─── Main Entry Point ────────────────────────────────────────────────────────

  static async runValueCampaign(): Promise<{ processed: number; sent: number }> {
    console.log('🌟 [Value Campaign] Starting value email campaign...');

    const rawUsers = await this.getEligibleUsers();
    console.log(`📊 [Value Campaign] Found ${rawUsers.length} eligible users`);

    const users = rawUsers.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      language: u.language,
      dripCampaign: u.dripCampaign
        ? { sentValueEmailTypes: u.dripCampaign.sentValueEmailTypes, valueEmailsCount: u.dripCampaign.valueEmailsCount }
        : null,
    }));

    let emailsSent = 0;

    for (let i = 0; i < users.length; i += this.BATCH_SIZE) {
      const batch = users.slice(i, i + this.BATCH_SIZE);
      for (const user of batch) {
        try {
          const sent = await this.processUser(user);
          if (sent) emailsSent++;
        } catch (err) {
          console.error(`❌ [Value Campaign] Error processing user ${user.id}:`, err);
        }
      }
    }

    console.log(`🎉 [Value Campaign] Done. Processed: ${users.length}, Sent: ${emailsSent}`);
    return { processed: users.length, sent: emailsSent };
  }

  // ─── Test / Manual send ──────────────────────────────────────────────────────

  static async sendTestToUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dripCampaign: true },
    });
    if (!user) throw new Error(`User not found: ${userId}`);
    return this.processUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      language: user.language,
      dripCampaign: user.dripCampaign
        ? { sentValueEmailTypes: user.dripCampaign.sentValueEmailTypes, valueEmailsCount: user.dripCampaign.valueEmailsCount }
        : null,
    });
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private static async getEligibleUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.INTERVAL_DAYS);

    return prisma.user.findMany({
      where: {
        engagementEmailsConsent: true,
        OR: [
          { dripCampaign: null },
          {
            dripCampaign: {
              OR: [
                { lastValueEmailSent: null },
                { lastValueEmailSent: { lte: cutoff } },
              ],
            },
          },
        ],
      },
      include: { dripCampaign: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private static async processUser(user: {
    id: string;
    email: string | null;
    firstName: string | null;
    language: string;
    dripCampaign: { sentValueEmailTypes: string[]; valueEmailsCount: number } | null;
  }): Promise<boolean> {
    if (!user.email) return false;

    const locale = user.language === 'en' ? 'en' : 'he';
    const firstName = user.firstName || (locale === 'he' ? 'חבר/ה' : 'Friend');

    const nextEmail = this.pickNextEmail(user.dripCampaign?.sentValueEmailTypes ?? []);
    if (!nextEmail) {
      console.log(`ℹ️  [Value Campaign] All emails sent to ${user.id} — resetting cycle`);
      await this.resetUserCycle(user.id);
      return false;
    }

    const unsubscribeUrl = await this.generateUnsubscribeUrl(user.id, user.email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://neshamatech.com';

    const context = {
      firstName,
      locale,
      subject: nextEmail.subject[locale],
      emailNumber: nextEmail.emailNumber,
      headerEmoji: nextEmail.headerEmoji,
      headerTitle: nextEmail.headerTitle[locale],
      headerSubtitle: nextEmail.headerSubtitle[locale],
      introText: nextEmail.introText[locale],
      tips: nextEmail.tips[locale],
      quoteText: nextEmail.quoteText?.[locale],
      quoteSource: nextEmail.quoteSource,
      closingText: nextEmail.closingText[locale],
      ctaText: nextEmail.ctaText[locale],
      ctaNote: nextEmail.ctaNote?.[locale],
      ctaLink: `${baseUrl}/profile`,
      unsubscribeUrl,
      baseUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@neshamatech.com',
      currentYear: new Date().getFullYear(),
    };

    const sent = await emailService.sendTemplateEmail({
      to: user.email,
      subject: nextEmail.subject[locale],
      templateName: 'value_email',
      context,
      locale,
    });

    if (sent) {
      await this.recordSent(user.id, nextEmail.id, user.dripCampaign);
    }

    return sent;
  }

  private static pickNextEmail(sentTypes: string[]): ValueEmailContent | null {
    const remaining = VALUE_EMAILS.filter(e => !sentTypes.includes(e.id));
    if (remaining.length === 0) return null;
    return remaining[0]; // in order; can be randomized if preferred
  }

  private static async recordSent(
    userId: string,
    emailId: string,
    existing: { sentValueEmailTypes: string[]; valueEmailsCount: number } | null,
  ) {
    const now = new Date();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.INTERVAL_DAYS);

    const sentTypes = [...(existing?.sentValueEmailTypes ?? []), emailId];

    await prisma.userDripCampaign.upsert({
      where: { userId },
      create: {
        userId,
        nextSendDate: nextDate,
        lastValueEmailSent: now,
        nextValueEmailDate: nextDate,
        sentValueEmailTypes: sentTypes,
        valueEmailsCount: 1,
      },
      update: {
        lastValueEmailSent: now,
        nextValueEmailDate: nextDate,
        sentValueEmailTypes: sentTypes,
        valueEmailsCount: { increment: 1 },
      },
    });
  }

  private static async resetUserCycle(userId: string) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.INTERVAL_DAYS);

    await prisma.userDripCampaign.upsert({
      where: { userId },
      create: {
        userId,
        nextSendDate: nextDate,
        nextValueEmailDate: nextDate,
        sentValueEmailTypes: [],
        valueEmailsCount: 0,
      },
      update: {
        sentValueEmailTypes: [],
        nextValueEmailDate: nextDate,
      },
    });
  }

  private static async generateUnsubscribeUrl(userId: string, email: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
    const token = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('90d')
      .sign(secret);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://neshamatech.com';
    return `${baseUrl}/api/user/unsubscribe?token=${token}`;
  }
}

export default ValueEmailOrchestrator;
