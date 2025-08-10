import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import nodemailer from 'nodemailer';

// --- START: Knowledge Base (משוכתב ומורחב) ---
// מאגר הידע נכתב מחדש כדי לשקף את קול המותג: מקצועי, חם, ממוקד-יתרון ובונה אמון.
const knowledgeBase = [
  {
    question: "מה זה NeshamaTech? מה אתם עושים?",
    answer:
      "NeshamaTech היא פלטפורמת שידוכים שנוסדה מתוך הבנה עמוקה של האתגרים בעולם הדייטים המודרני. אנחנו משלבים טכנולוגיה חכמה עם ליווי אנושי וחם של צוות שדכנים, כדי ליצור חיבורים רציניים ומשמעותיים בקרב הקהילה היהודית בארץ ובעולם.\n\nהמטרה שלנו היא להחזיר את העומק והכבוד לתהליך ההיכרות, ולאפשר לכם לפגוש אנשים על בסיס התאמה אמיתית של אישיות וערכים, ולא רק על סמך תמונה."
  },
  {
    question: "מה השיטה שלכם? איך התהליך עובד?",
    answer:
      "השיטה שלנו בנויה על שלושה יסודות: עומק, טכנולוגיה וליווי אישי.\n\n1.  **היכרות מעמיקה:** התהליך מתחיל עם שאלון ה-'5 עולמות' הייחודי שלנו. זה לא מבחן, אלא מסע היכרות אישי שבו אתם משתפים אותנו בתפיסות עולמכם, באישיותכם ובמה שבאמת חשוב לכם. זה הבסיס שמאפשר לנו להבין אתכם לעומק.\n\n2.  **טכנולוגיה בשירות הלב:** המערכת החכמה שלנו, כולל רכיבי AI, מנתחת את המידע ומאתרת מתוך מאגר רחב ואיכותי את האנשים בעלי פוטנציאל ההתאמה הגבוה ביותר עבורכם. הטכנולוגיה עושה את העבודה המורכבת של סינון, כדי שהצוות שלנו יוכל להתמקד בחיבור האנושי.\n\n3.  **ליווי ושיקול דעת אנושי:** כל הצעה פוטנציאלית עוברת בדיקה ואישור של שדכן אישי. אנחנו לא שולחים הצעות אוטומטיות. תקבלו רק הצעות מנומקות, כאלו שאנחנו מאמינים בהן. השדכן גם מלווה אתכם לאורך כל הדרך, זמין לייעוץ ותמיכה, והכל בדיסקרטיות מוחלטת."
  },
  {
    question: 'במה אתם שונים מאפליקציות היכרויות או משדכנים רגילים?',
    answer:
      "זו שאלה מצוינת, והתשובה היא בבידול המשולב שלנו:\n\n*   **מול אפליקציות:** אנחנו מציעים דיסקרטיות מלאה (הפרופיל שלכם לא חשוף לכל), חוסכים לכם את זמן החיפוש האינסופי (אנחנו עובדים בשבילכם), והמטרה שלנו היא שתמצאו זוגיות ותעזבו אותנו, בניגוד למודל של אפליקציות שרוצות שתשארו כמה שיותר.\n\n*   **מול שדכנות מסורתית:** אנחנו משתמשים בטכנולוגיה כדי לגשת למאגר גדול ורחב הרבה יותר, מה שמגדיל משמעותית את סיכויי ההצלחה. במקביל, אנחנו שומרים על היתרון הגדול של השדכנות – הליווי האישי, שיקול הדעת האנושי והיכולת לראות את מה שמעבר לנתונים היבשים.\n\nבמילים פשוטות, לקחנו את הטוב משני העולמות."
  },
  {
      question: 'איך הפרטיות שלי נשמרת? מי רואה את המידע שלי?',
      answer: "הפרטיות והדיסקרטיות שלכם הן ערך עליון עבורנו, זו הבטחה. הפרופיל שלכם חשוף אך ורק לצוות השדכנים המצומצם שמטפל בכם. הוא אינו חשוף למשתמשים אחרים במאגר. כאשר אנחנו מזהים התאמה, אנו מציגים לכל צד פרופיל מפורט ומכבד של הצד השני, וזאת רק לאחר שקיבלנו את אישורכם המפורש. אתם תמיד בשליטה מלאה על המידע שלכם."
  },
  {
    question: 'מה העלות של השירות?',
    answer:
      'אנו מאמינים במודל הוגן שההצלחה שלכם היא ההצלחה שלנו. לכן, ההרשמה למאגר ומילוי הפרופיל והשאלון הייחודי שלנו הם ללא עלות. אנו גובים דמי הצלחה רק כאשר המסע מסתיים בחתונה. בנוסף, קיימים מסלולי פרימיום לליווי אישי מורחב והצעות נוספות, אך הבסיס הוא הצלחה משותפת.'
  },
  {
    question: 'מה הסיכוי שלי למצוא התאמה וכמה זמן זה לוקח?',
    answer:
      "זו שאלה חשובה מאוד. אין לוח זמנים מדויק לאהבה, אך הגישה הממוקדת שלנו חוסכת זמן יקר ואנרגיה רגשית. במקום מאות שיחות שטחיות, תקבלו מספר מצומצם של הצעות איכותיות ומנומקות. רוב המשתמשים הרציניים שלנו, שמשתפים פעולה עם התהליך, מתחילים לראות הצעות רלוונטיות תוך זמן קצר ומוצאים קשרים משמעותיים מהר יותר מהממוצע בשוק."
  },
  {
    question: 'איך הבינה המלאכותית (AI) עוזרת לי?',
    answer:
      "ה-AI הוא כלי עזר חכם גם עבורכם וגם עבור השדכנים שלנו. עבור השדכנים, הוא מסייע בניתוח מעמיק של אלפי פרופילים כדי לזהות דפוסי התאמה נסתרים. עבורכם, המערכת יכולה להציע תובנות לשיפור הפרופיל שלכם, ובקרוב, תוכלו גם להתייעץ איתה לגבי הצעות שתקבלו כדי להבין טוב יותר את נקודות החוזק והאתגרים הפוטנציאליים בהתאמה."
  },
  {
    question: 'למי השירות מיועד?',
    answer:
      'השירות שלנו מיועד לרווקים ורווקות מהקהילה היהודית (בשלב זה, בעיקר מהמגזר הדתי-לאומי והאקדמי בישראל) המחפשים קשר רציני המוביל לחתונה. אנו פונים לאנשים איכותיים, המעוניינים בתהליך עמוק ומכבד יותר מאשר מה שאפליקציות היכרויות מציעות. המערכת מיועדת כרגע לשידוכים בין גברים לנשים (סטרייטים) בלבד.'
  }
];

const knowledgeContext = knowledgeBase
  .map((item) => `שאלה: ${item.question}\nתשובה: ${item.answer}`)
  .join('\n\n');

// --- בדיקות משתני סביבה (ללא שינוי) ---
if (!process.env.GOOGLE_API_KEY) {
  console.error('[CHAT API ERROR] GOOGLE_API_KEY is not defined!');
}
// ... (שאר הבדיקות ללא שינוי)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function POST(req: NextRequest) {
  try {
    const { message, type, userEmail } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (type === 'email') {
      if (!userEmail || typeof userEmail !== 'string') {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.GMAIL_USER || process.env.EMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'NeshamaTech Chatbot'}" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
        to: 'jewish.matchpoint@gmail.com',
        subject: `פנייה חדשה מהצ'אט באתר: ${userEmail}`,
        replyTo: userEmail,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6; color: #333;">
            <h2 style="color: #0891b2;">פנייה חדשה מהצ'אט-בוט באתר NeshamaTech:</h2>
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
        reply: 'תודה רבה! פנייתך נשלחה בהצלחה. אחד מאנשי הצוות שלנו יחזור אליך באופן אישי בהקדם האפשרי.',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings });

    // --- PROMPT משודרג עם פרסונה וכללים מפורטים ---
    const prompt = `
      **הפרסונה שלך:**
      אתה "העוזר האישי" של NeshamaTech. אתה הנקודה הראשונה במגע עם משתמשים פוטנציאליים שמחפשים קשר רציני. הטון שלך הוא כמו של איש מקצוע ותיק, חם ומהימן.
      - **מקצועי ומרגיע:** השתמש בשפה ברורה, מכבדת ובוטחת.
      - **אמפתי ומבין:** הכר באתגרים של עולם הדייטים, אך הצע תקווה ודרך פעולה.
      - **אמין ודיסקרטי:** הדגש תמיד את חשיבות הפרטיות והאמון.
      - **ממוקד-ערך:** הסבר לא רק *מה* אנחנו עושים, אלא *למה* זה טוב ומועיל למשתמש.
      - **דובר עברית רהוטה בלבד.**

      **הכללים המחייבים שלך:**
      1.  **התבסס אך ורק על מאגר הידע:** אל תמציא מידע בשום אופן. כל תשובה חייבת לנבוע ישירות מהטקסט שסופק לך.
      2.  **אל תבטיח הבטחות:** הימנע מהבטחות כמו "תמצא אהבה". במקום זאת, דבר על "הגדלת הסיכויים", "תהליך יעיל", ו"חיבורים משמעותיים".
      3.  **זיהוי שאלה מחוץ למאגר:** אם השאלה אינה מכוסה במאגר הידע, עליך להשיב באמפתיה ובצורה שירותית. ענה: "זו שאלה חשובה שראויה לתשובה אישית מהצוות שלנו. אין לי מידע מדויק על כך במערכת, אך אני יכול להעביר את פנייתך ישירות לאחד השדכנים. האם תרצה/י לשלוח להם פנייה במייל?".
      4.  **פרשנות שאלות:** הבן את כוונת המשתמש. "כמה עולה" -> התייחס לעלות. "איך זה עובד" -> התייחס לשיטה. "האם זה בטוח?" -> התייחס לפרטיות.
      5.  **הימנע מסופרלטיבים:** אל תגיד "אנחנו הכי טובים". במקום, הסבר *מדוע* הגישה שלנו ייחודית ומועילה.

      --- מאגר הידע המלא (האמת המוחלטת שלך) ---
      ${knowledgeContext}
      --- סוף מאגר הידע ---

      **הבקשה:**
      ענה על שאלת המשתמש הבאה, בהתבסס על הפרסונה והכללים המחמירים שהוגדרו לך.

      שאלת המשתמש: "${message}"

      תשובה בעברית:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    const isFallback = text.includes('לשלוח להם פנייה במייל');

    if (isFallback) {
      return NextResponse.json({
        reply: text,
        isFallback: true,
        actions: [{ type: 'email', label: 'כן, אשמח לשלוח פנייה לצוות' }],
      });
    }

    return NextResponse.json({ reply: text, isFallback: false });
  } catch (error) {
    console.error('Error in /api/chat route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}