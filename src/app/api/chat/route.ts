// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import nodemailer from 'nodemailer';

// --- START: Knowledge Base ---
// זהו מאגר הידע המלא שה-AI משתמש בו. כל תשובה תתבסס אך ורק על המידע שכאן.
const knowledgeBase = [
  // --- General & About Matchpoint ---
  {
    question: "מה זה מאצ'פוינט? מה אתם עושים?",
    answer:
      "מאצ'פוינט (Match Point) היא חברת שידוכים ישראלית המיועדת לרווקים ורווקות מהציבור הדתי המחפשים קשר רציני. אנו משלבים באופן ייחודי טכנולוגיית בינה מלאכותית (AI) מתקדמת עם ליווי אישי וחם של צוות שדכנים מקצועי, כדי לספק הצעות מדויקות ואיכותיות.",
  },
  {
    question: 'מה השיטה שלכם? איך התהליך עובד?',
    answer:
      'השיטה שלנו מבוססת על שילוב ייחודי של עומק, טכנולוגיה וליווי אישי, והכל בדיסקרטיות מלאה. התהליך בנוי מכמה שלבים:\n\n1. **היכרות מעמיקה ואיכותית:** קודם כל, אנחנו רוצים להכיר אותך לעומק. המערכת שלנו מאפשרת לך לבנות פרופיל מפורט באמצעות שאלון מקיף שנוגע לאישיות, ערכים, זוגיות ולייפסטייל. זה הבסיס להתאמה איכותית, בניגוד להיכרות שטחית בפלטפורמות אחרות.\n\n2. **עוצמה טכנולוגית:** כאן היתרון הגדול שלנו נכנס לפעולה. מערכת ה-AI שלנו סורקת את מאגר המידע העצום שלנו, המונה מאות אלפי מועמדים, ומאתרת את ההתאמות בעלות הפוטנציאל הגבוה ביותר עבורך. זהו סקייל ששדכן אנושי לבדו לא יכול להגיע אליו.\n\n3. **הצעה מכבדת ודיסקרטית:** כשאנחנו מוצאים התאמה, היא נשלחת אלייך עם כרטיס פרופיל מעוצב ומפורט של הצד השני. זה מאפשר היכרות ראשונית רצינית ומעמיקה. חשוב להדגיש, הפרופיל שלך נחשף רק לאחר סינון והתאמה, ובאישורך. הדיסקרטיות היא ערך עליון אצלנו, מה שמאפשר גם לאנשים שמעדיפים לשמור על פרטיותם להרגיש בנוח.\n\n4. **ליווי אישי וקהילה:** אנחנו לא רק מערכת, אנחנו בית. צוות השדכנים שלנו מלווה אותך, עוזר לך לשפר את הפרופיל ונותן תמיכה לאורך כל הדרך. בנוסף, אנחנו קהילה שלמה שמקיימת אירועים ומפגשים, ונותנת ערך מוסף משמעותי לתהליך חיפוש הזוגיות.',
  },
  {
    question: 'מי המייסדים של החברה?',
    answer:
      'המייסדים שלנו הם דינה אנגלרד, שדכנית ראשית עם ניסיון עשיר, ואיתן אנגלרד, יזם טכנולוגי ומנכ"ל החברה, שפיתח את הפלטפורמה הטכנולוגית הייחודית שלנו.',
  },
  // --- עדכון --- הוספת הבהרה על קהל היעד
  {
    question: 'למי השירות שלכם מיועד?',
    answer:
      'השירות שלנו מיועד לרווקים ורווקות יהודים מכל הזרמים (דתי-לאומי, חרדי, אורתודוקסי-מודרני, מסורתי ועוד) שמחפשים קשר משמעותי למטרת נישואין. חשוב לציין שהמערכת שלנו בנויה כרגע למציאת שידוכים בין גברים לנשים (סטרייטים) בלבד. אנו פונים למי שנמאס לו מאפליקציות היכרויות שטחיות ומחפש תהליך רציני, דיסקרטי ויעיל יותר.',
  },
  {
    question: 'במה אתם שונים מאפליקציות היכרויות או שדכנים אחרים?',
    answer:
      "הייחוד שלנו הוא השילוב המושלם בין טכנולוגיה למגע אנושי. בניגוד לאפליקציות 'סוואיפ', אצלנו הפרטיות היא ערך עליון והפרופיל שלך גלוי רק לשדכנים. בניגוד לשדכנים מסורתיים, אנו משתמשים ב-AI לניתוח מאגר של מאות אלפי אנשים, מה שמאפשר לשדכנים שלנו למצוא התאמות מדויקות יותר. כך אנחנו מציעים את הטוב משני העולמות: יעילות טכנולוגית בסקייל עצום, לצד הבנה וליווי אנושי.",
  },
  // --- Process & Questionnaire ---
  {
    question: "מה זה השאלון ומהם ה'עולמות'?",
    answer:
      "השאלון שלנו הוא כלי מעמיק שנועד להכיר אותך לעומק. הוא מחולק לחמישה 'עולמות' נושאיים: 'עולם האישיות' (מי אני), 'עולם הערכים' (מה מניע אותי), 'עולם הזוגיות' (מה אני מחפש/ת בקשר), 'עולם הפרטנר' (מי מתאים לי), ו'עולם הדת והמסורת'. מילוי השאלון אורך כ-30-40 דקות, אך ניתן לעשות זאת בחלקים.",
  },
  {
    question: 'האם אני חייב/ת למלא את כל השאלון בבת אחת?',
    answer:
      'בהחלט לא. המערכת שומרת את התקדמותך באופן אוטומטי, כך שתוכל/י לעצור בכל שלב ולחזור להשלים את השאלון בזמנך החופשי.',
  },
  // --- Pricing & Fees ---
  {
    question: 'מה המחיר של השירות? כמה זה עולה?',
    answer:
      'המודל העסקי שלנו מבוסס על הצלחה. ההרשמה למערכת ומילוי הפרופיל והשאלונים הם ללא עלות. דמי הצלחה בסך 4,000 ש"ח (כולל מע"מ) נגבים רק במקרה של חתונה הנובעת משידוך ישיר דרך המערכת שלנו. בנוסף, קיימת אפשרות לחבילת הצעות נוספות וליווי מורחב בתשלום חד-פעמי של 350 ש"ח.',
  },
  // --- Privacy & Security ---
  {
    question: 'מי יכול לראות את המידע והתמונות שלי?',
    answer:
      "הפרטיות שלך היא ערך עליון עבורנו. הפרופיל שלך אינו ציבורי. רק צוות השדכנים המורשה של מאצ'פוינט יכול לצפות בפרופיל המלא שלך. כאשר מוצעת לך התאמה, הצד השני יראה רק את כרטיס הפרופיל המעוצב שלך, וזאת רק לאחר הסכמה הדדית ובתיווך השדכן.",
  },
  // --- עדכון --- הוספת שאלה ותשובה חדשות על עזרת ה-AI למשתמש
  {
    question: 'איך ה-AI עוזר לי? האם אני יכול להתייעץ איתו?',
    answer:
      'בהחלט. ה-AI שלנו הוא לא רק כלי לשדכנים, אלא גם עוזר אישי עבורך. לאחר מילוי הפרופיל, תוכל/י להתייעץ עם ה-AI כדי לקבל תובנות על הפרופיל שלך וכיצד ניתן לשפר אותו. בנוסף, כאשר נשלחת אלייך הצעת שידוך, ה-AI יכול לנתח עבורך את ההצעה, להצביע על נקודות התאמה חזקות או על פערים אפשריים, ולעזור לך לקבל החלטה מושכלת. זהו כלי ייחודי שעומד לרשותך בתהליך.',
  },
  // --- Success & Miscellaneous ---
  {
    question: 'מה הסיכוי שלי למצוא התאמה? כמה זמן זה לוקח?',
    answer:
      "זה משתנה מאדם לאדם, אך בזכות השילוב של טכנולוגיה וליווי אישי, התהליך אצלנו יעיל ומהיר יותר מהממוצע. בעוד הממוצע בשוק עומד על כ-2.5 שנים, רוב המשתמשים שלנו מוצאים התאמות מוצלחות תוך 6-12 חודשים. המטרה שלנו היא לא רק למצוא 'מישהו', אלא את האדם הנכון לך.",
  },
  {
    question: 'האם יש לכם גם אירועים או מפגשים?',
    answer:
      'כן, אנחנו קהילה שלמה. אנו מארגנים מגוון אירועים קהילתיים כמו מפגשים חברתיים, סדנאות והרצאות. זוהי הזדמנות מצוינת להכיר אנשים חדשים בסביבה נעימה ותומכת. חברי המערכת מקבלים גישה מועדפת לאירועים אלו.',
  },
];
// --- END: Knowledge base section ---

// יצירת קונטקסט טקסטואלי ממאגר הידע
const knowledgeContext = knowledgeBase
  .map((item) => `שאלה: ${item.question}\nתשובה: ${item.answer}`)
  .join('\n\n');

// בדיקות לווידוא קיום משתני סביבה בעת טעינת השרת
console.log('--- Loading /api/chat route handler ---');
if (!process.env.GOOGLE_API_KEY) {
  console.error('[CHAT API ERROR] GOOGLE_API_KEY is not defined!');
}
if (!process.env.GMAIL_USER && !process.env.EMAIL_USER) {
  console.error('[CHAT API ERROR] GMAIL_USER or EMAIL_USER is not defined!');
}
if (!process.env.GMAIL_APP_PASSWORD && !process.env.EMAIL_PASS) {
  console.error(
    '[CHAT API ERROR] GMAIL_APP_PASSWORD or EMAIL_PASS is not defined!'
  );
}

// אתחול לקוח ה-AI של גוגל
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// הגדרות בטיחות עבור מודל ה-AI
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// פונקציית ה-API הראשית המטפלת בבקשות POST
export async function POST(req: NextRequest) {
  try {
    const { message, type, userEmail } = await req.json();

    // ולידציה בסיסית של הקלט
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // נתיב לוגי לטיפול בשליחת מייל
    if (type === 'email') {
      if (!userEmail || typeof userEmail !== 'string') {
        return NextResponse.json(
          { error: 'User email is required for this action' },
          { status: 400 }
        );
      }

      // הגדרת Nodemailer לשליחת המייל
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.GMAIL_USER || process.env.EMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Match Point Chatbot'}" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
        to: 'jewish.matchpoint@gmail.com',
        subject: `פנייה חדשה מהצ'אט-בוט: ${userEmail}`,
        replyTo: userEmail, // חשוב כדי שאפשר יהיה להשיב ישירות לפונה
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6; color: #333;">
            <h2 style="color: #0891b2;">התקבלה הודעה חדשה מהצ'אט-בוט באתר:</h2>
            <p><strong>מאת:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
            <div style="background-color: #f8f9fa; border-right: 4px solid #06b6d4; padding: 15px; border-radius: 5px; margin-top: 10px;">
              <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="font-size: 12px; color: #6c757d; margin-top: 20px;">
              זוהי הודעה אוטומטית. ניתן להשיב למייל זה ישירות כדי לענות לפונה.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return NextResponse.json({
        reply:
          'תודה! הודעתך נשלחה בהצלחה. צוות Match Point ייצור איתך קשר בהקדם.',
      });
    }

    // נתיב לוגי ברירת מחדל: עיבוד שאלה עם ה-AI
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings,
    });

    // ההנחיה (Prompt) המשופרת והמפורטת עבור ה-AI
    const prompt = `
      **הפרסונה שלך:**
      אתה "העוזר הדיגיטלי" של Match Point, חברת שידוכים ישראלית לציבור הדתי.
      הטון שלך צריך להיות:
      1.  **מקצועי וחם:** השתמש בשפה מכבדת, ידידותית ומכילה.
      2.  **דיסקרטי ובטוח:** הדגש את חשיבות הפרטיות.
      3.  **ממוקד ותמציתי:** ענה בצורה ברורה, ישירה ולעניין.
      4.  **דובר עברית רהוטה:** תקשר אך ורק בעברית.

      **הכללים שלך:**
      1.  **התבסס אך ורק על מאגר הידע:** אל תמציא מידע. תשובותיך חייבות לנבוע ישירות מהמידע שסופק לך למטה.
      2.  **זיהוי שאלה מחוץ למאגר:** אם שאלת המשתמש אינה מכוסה במאגר הידע, ענה בנימוס שאין לך את המידע המבוקש. לדוגמה: "זו שאלה מצוינת, אך אין לי תשובה מוכנה עליה במאגר. אשמח אם תפנה לצוות האנושי שלנו, הם בוודאי יוכלו לעזור."
      3.  **אל תציע יצירת קשר:** אל תציע לשלוח מייל או ליצור קשר. המערכת החיצונית (front-end) תעשה זאת אם צריך. פשוט תענה שאינך יודע.
      4.  **פרשנות שאלות:** נסה להבין את כוונת המשתמש. אם הוא שואל "כמה עולה?", התייחס לשאלת "מה המחיר?". אם הוא שואל "איך זה עובד?", התייחס ל"מה השיטה שלכם?".

      --- מאגר הידע המלא (האמת המוחלטת שלך) ---
      ${knowledgeContext}
      --- סוף מאגר הידע ---

      **הבקשה:**
      ענה על שאלת המשתמש הבאה, בהתבסס על הפרסונה והכללים שהוגדרו לך.

      שאלת המשתמש: "${message}"

      תשובה בעברית:
    `;

    // שליחת הבקשה למודל ה-AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // לוגיקה לטיפול בתשובה שה-AI "לא יודע"
    const isFallback =
      text.includes('אין לי תשובה מוכנה') || text.includes('אין לי מידע');

    if (isFallback) {
      return NextResponse.json({
        reply: text,
        isFallback: true,
        actions: [{ type: 'email', label: 'שלח/י פניה במייל לצוות' }],
      });
    }

    // החזרת תשובה רגילה מה-AI
    return NextResponse.json({ reply: text, isFallback: false });
  } catch (error) {
    // טיפול בשגיאות כלליות ב-API
    console.error('Error in /api/chat route:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
