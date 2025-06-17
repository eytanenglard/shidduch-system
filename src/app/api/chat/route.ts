// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import nodemailer from 'nodemailer';

// --- START: Knowledge Base ---
const knowledgeBase = [
  // ... (כל מאגר הידע נשאר ללא שינוי)
  // --- General & About Matchpoint ---
  {
    question: "מה זה מאצ'פוינט? מה אתם עושים?",
    answer: "מאצ'פוינט (Match Point) היא מערכת שידוכים מתקדמת המיועדת לרווקים ורווקות מהציבור הדתי המחפשים קשר רציני לטווח ארוך. אנו משלבים טכנולוגיית בינה מלאכותית (AI) עם ליווי אישי של שדכנים מקצועיים כדי לספק הצעות מדויקות ואיכותיות המבוססות על ערכים עמוקים והתאמה אישיותית."
  },
  {
    question: "מי המייסדים של החברה?",
    answer: "המייסדים שלנו הם דינה אנגלרד, שדכנית ראשית עם ניסיון עשיר, ואיתן אנגלרד, יזם טכנולוגי ומנכ\"ל החברה, שפיתח את הפלטפורמה הטכנולוגית הייחודית שלנו."
  },
  {
    question: "למי השירות שלכם מיועד?",
    answer: "השירות שלנו מיועד לרווקים ורווקות יהודים מכל הזרמים (דתי-לאומי, חרדי, אורתודוקסי-מודרני, מסורתי ועוד) שמחפשים קשר משמעותי למטרת נישואין. אנו פונים למי שנמאס לו מאפליקציות היכרויות שטחיות ומחפש תהליך רציני, דיסקרטי ויעיל יותר."
  },
  {
    question: "במה אתם שונים מאפליקציות היכרויות או שדכנים אחרים?",
    answer: "הייחוד שלנו הוא השילוב המושלם בין טכנולוגיה למגע אנושי. בניגוד לאפליקציות 'סוואיפ', אצלנו הפרטיות היא ערך עליון והפרופיל שלך גלוי רק לשדכנים. בניגוד לשדכנים מסורתיים, אנו משתמשים ב-AI לניתוח מעל 50 ממדי התאמה, מה שמאפשר לשדכנים שלנו לנהל מאגר גדול יותר ביעילות ולמצוא התאמות מדויקות יותר. כך אנחנו מציעים את הטוב משני העולמות: יעילות ודיוק טכנולוגי לצד הבנה וליווי אנושי."
  },
  // --- Process & Questionnaire ---
  {
    question: "איך התהליך עובד?",
    answer: "התהליך מתחיל בהרשמה ומילוי פרופיל אישי. לאחר מכן, תתבקש/י למלא שאלון מקיף המחולק לחמישה 'עולמות': אישיות, ערכים, זוגיות, העדפות לפרטנר ודת. התשובות שלך מנותחות על ידי מערכת ה-AI שלנו ונסקרות על ידי שדכן אישי. השדכן, בסיוע המערכת, מציע לך התאמות פוטנציאליות. רק לאחר הסכמה הדדית, ובתיווך השדכן, נוצר קשר ראשוני."
  },
  {
    question: "מה זה השאלון ומהם ה'עולמות'?",
    answer: "השאלון שלנו הוא כלי מעמיק שנועד להכיר אותך לעומק. הוא מחולק לחמישה 'עולמות' נושאיים: 'עולם האישיות' (מי אני), 'עולם הערכים' (מה מניע אותי), 'עולם הזוגיות' (מה אני מחפש/ת בקשר), 'עולם הפרטנר' (מי מתאים לי), ו'עולם הדת והמסורת'. מילוי השאלון אורך כ-30-40 דקות, אך ניתן לעשות זאת בחלקים."
  },
  {
    question: "האם אני חייב/ת למלא את כל השאלון בבת אחת?",
    answer: "בהחלט לא. המערכת שומרת את התקדמותך באופן אוטומטי, כך שתוכל/י לעצור בכל שלב ולחזור להשלים את השאלון בזמנך החופשי."
  },
  {
    question: "האם אפשר להירשם כאורח/ת בלי לפתוח חשבון?",
    answer: "כן, ניתן למלא את השאלון גם ללא חשבון כדי להתרשם, אך חשוב לדעת שבמקרה כזה התשובות לא יישמרו במערכת ולא נוכל להציע לך שידוכים. כדי לשמור את ההתקדמות ולהיכנס למאגר, יש צורך בהרשמה והתחברות."
  },
  // --- Pricing & Fees ---
  {
    question: "מה המחיר של השירות? כמה זה עולה?",
    answer: "המודל העסקי שלנו מבוסס על הצלחה. ההרשמה למערכת ומילוי הפרופיל והשאלונים הם ללא עלות. דמי הצלחה בסך 4,000 ש\"ח (כולל מע\"מ) נגבים רק במקרה של חתונה הנובעת משידוך ישיר דרך המערכת שלנו. בנוסף, קיימת אפשרות לחבילת הצעות נוספות וליווי מורחב בתשלום חד-פעמי של 350 ש\"ח."
  },
  {
    question: "האם יש תשלומים חודשיים?",
    answer: "לא, אין אצלנו דמי מנוי חודשיים. התשלום העיקרי הוא דמי הצלחה, רק כאשר מוצאים את הזיווג ומתחתנים. ישנה אפשרות לרכישה חד-פעמית של חבילת הצעות נוספות אם תרצה/י בכך."
  },
  // --- Privacy & Security ---
  {
    question: "מי יכול לראות את המידע והתמונות שלי?",
    answer: "הפרטיות שלך היא ערך עליון עבורנו. בניגוד לאפליקציות אחרות, הפרופיל שלך אינו ציבורי ואינו גלוי למשתמשים אחרים. רק צוות השדכנים המורשה של מאצ'פוינט יכול לצפות בפרופיל המלא שלך. כאשר מוצעת לך התאמה, הצד השני יראה רק פרטים כלליים ותמציתיים. פרטים מלאים ותמונות נחשפים רק לאחר הסכמה הדדית ובהדרגה, בתיווך השדכן."
  },
  {
    question: "איך אתם מאבטחים את המידע שלי?",
    answer: "אנו משתמשים באמצעי אבטחה מתקדמים, כולל הצפנת מידע מקצה לקצה (SSL/TLS), הצפנת סיסמאות, בקרות גישה מבוססות תפקידים, וחומות אש. המידע שלך מאוחסן בשרתים מאובטחים של ספקים מובילים בעולם."
  },
  // --- Features for Matchmakers ---
  {
    question: "אילו כלים יש לשדכנים במערכת?",
    answer: "השדכנים שלנו משתמשים בכלים מתקדמים לניהול מועמדים, כולל: 'Split View' להשוואה נוחה בין גברים לנשים, פאנל פילטרים מפורט, יכולת להוסיף מועמדים באופן ידני, וכלי ניתוח התאמות מבוססי AI."
  },
  {
    question: "איך ה-AI עוזר לשדכנים?",
    answer: "ה-AI מסייע לשדכנים בכמה דרכים: ראשית, הוא מנתח פרופילים על פי עשרות ממדים כדי להציף התאמות פוטנציאליות שהעין האנושית עלולה לפספס. שנית, השדכן יכול לבחור 'מועמד מטרה', והמערכת תמצא עבורו את ההתאמות הטובות ביותר מהמאגר, ממוינות לפי ציון התאמה. לבסוף, כלי 'ניתוח ההתאמה' מספק לשדכן סיכום מפורט על נקודות החוזק והאתגרים הפוטנציאליים בכל שידוך."
  },
  {
    question: "האם שדכן יכול לערוך את הפרופיל שלי?",
    answer: "כן, אחד היתרונות של הליווי האישי הוא שהשדכן יכול לסייע לך להציג את עצמך בצורה הטובה ביותר. הוא יכול לערוך את הפרופיל, לנהל את התמונות, ולעדכן פרטים כדי למקסם את סיכויי ההתאמה שלך."
  },
  // --- Success & Miscellaneous ---
  {
    question: "כמה זמן לוקח למצוא התאמה?",
    answer: "זה משתנה מאדם לאדם, אך בזכות השילוב של טכנולוגיה וליווי אישי, התהליך אצלנו יעיל ומהיר יותר מהממוצע. בעוד הממוצע בשוק עומד על כ-2.5 שנים, רוב המשתמשים שלנו מוצאים התאמות מוצלחות תוך 6-12 חודשים."
  },
  {
    question: "האם יש לכם גם אירועים או מפגשים?",
    answer: "כן, אנו מארגנים מגוון אירועים קהילתיים כמו מפגשים חברתיים, סדנאות והרצאות. זוהי הזדמנות מצוינת להכיר אנשים חדשים בסביבה נעימה ותומכת. חברי המערכת מקבלים גישה מועדפת לאירועים אלו."
  },
  {
    question: "מה קורה אחרי שנמצאה התאמה?",
    answer: "לאחר הסכמה הדדית, השדכן המלווה יוצר את הקשר הראשוני ביניכם, בדרך כלל על ידי העברת מספרי טלפון. השדכן ממשיך ללוות אתכם, נותן עצות ומקבל משוב לאחר הפגישות כדי לסייע לקשר להתקדם בצורה הטובה ביותר."
  },
];
// --- END: Knowledge base section ---

const knowledgeContext = knowledgeBase
  .map(item => `שאלה: ${item.question}\nתשובה: ${item.answer}`)
  .join('\n\n');

// Initialize the Generative AI client
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

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Handle email sending logic
    if (type === 'email') {
      if (!userEmail || typeof userEmail !== "string") {
        return NextResponse.json({ error: "User email is required for this action" }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.GMAIL_USER || process.env.EMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        }
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Match Point Chatbot'}" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
        to: "jewish.matchpoint@gmail.com",
        subject: "פנייה חדשה מהצ'אט-בוט באתר Match Point",
        replyTo: userEmail, // Critical for easy replies
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
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
      return NextResponse.json({ reply: "תודה! הודעתך נשלחה בהצלחה. צוות Match Point ייצור איתך קשר בהקדם." });
    }

    // Default behavior: process question with AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

    const prompt = `
      אתה עוזר וירטואלי מועיל וידידותי של אתר השידוכים "Match Point". 
      תפקידך הוא לענות על שאלות משתמשים בעברית, בצורה תמציתית, ברורה ומנומסת.
      עליך לבסס את תשובתך אך ורק על מאגר הידע שסופק לך.
      אם השאלה נוגעת לנושא שאינו מופיע במאגר הידע, ענה: "זו שאלה מצוינת, אך אין לי תשובה מוכנה במאגר. איך תרצה/י להמשיך?".

      --- מאגר הידע ---
      ${knowledgeContext}
      --- סוף מאגר הידע ---

      שאלת המשתמש: "${message}"

      תשובה:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (text.includes("אין לי תשובה מוכנה במאגר")) {
        return NextResponse.json({
            reply: text,
            isFallback: true,
            actions: [
                { type: 'email', label: 'שלח/י פניה במייל' },
            ]
        });
    }

    return NextResponse.json({ reply: text });

  } catch (error) {
    console.error("Error in /api/chat route:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}