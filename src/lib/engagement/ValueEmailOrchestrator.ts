// src/lib/engagement/ValueEmailOrchestrator.ts
//
// 🌟 ארכסטרטור מיילי ערך — שולח תוכן בעל ערך לכל היוזרים כל 3 ימים
//    10 מיילים בסדרה, כל אחד עם תוכן ייחודי ועמוק בנושאי זוגיות ושידוכים

import prisma from '@/lib/prisma';
import { Language } from '@prisma/client';
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
];

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export class ValueEmailOrchestrator {

  private static readonly INTERVAL_DAYS = 3;     // minimum days between value emails
  private static readonly BATCH_SIZE = 50;        // users per batch (avoid timeouts)

  // ─── Main Entry Point ────────────────────────────────────────────────────────

  static async runValueCampaign(): Promise<{ processed: number; sent: number }> {
    console.log('🌟 [Value Campaign] Starting value email campaign...');

    const users = await this.getEligibleUsers();
    console.log(`📊 [Value Campaign] Found ${users.length} eligible users`);

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
    return this.processUser(user as any);
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private static async getEligibleUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.INTERVAL_DAYS);

    return prisma.user.findMany({
      where: {
        engagementEmailsConsent: true,
        email: { not: null },
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
    language: Language;
    dripCampaign: { sentValueEmailTypes: string[]; valueEmailsCount: number } | null;
  }): Promise<boolean> {
    if (!user.email) return false;

    const locale = user.language === Language.EN ? 'en' : 'he';
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
