// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import nodemailer from 'nodemailer';

// --- התוספות החדשות לאבטחה ---
import { getToken } from 'next-auth/jwt';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- הגדרת Rate Limiter (זהה לפיצ'ר המשוב) ---
// ודא שמשתני הסביבה מוגדרים
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  // בסביבת פיתוח, זו רק אזהרה. בפרודקשן, זו יכולה להיות שגיאה קריטית.
  console.warn('Upstash Redis credentials are not configured. Rate limiting for CHAT API will not be active.');
}
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// נאפשר 15 בקשות בשעה. זה מאפשר שיחה קצרה ומונע הצפה.
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
});
// --- סוף התוספות לאבטחה ---


// --- START: Internationalized Knowledge Base ---
const KNOWLEDGE_BASES = {
  he: [
      {
        question: "מה זה NeshamaTech? מה אתם עושים?",
        answer:
          "NeshamaTech היא פלטפורמת שידוכים שנוסדה מתוך הבנה עמוקה של האתגרים בעולם הדייטים המודרני. אנחנו משלבים טכנולוגיה חכמה עם ליווי אנושי וחם של צוות שדכנים, כדי ליצור חיבורים רציניים ומשמעותיים.\n\nהמטרה שלנו היא להחזיר את העומק והכבוד לתהליך ההיכרות, ולאפשר לכם לפגוש אנשים על בסיס התאמה אמיתית של אישיות וערכים, ולא רק על סמך תמונה."
      },
      {
        question: "מה השיטה שלכם? איך התהליך עובד?",
        answer:
          "השיטה שלנו בנויה על שלושה יסודות: עומק, טכנולוגיה וליווי אישי.\n\n1.  **היכרות מעמיקה:** התהליך מתחיל עם שאלון 'חמשת העולמות' הייחודי שלנו. זה לא מבחן, אלא מסע היכרות אישי שבו אתם משתפים אותנו בתפיסות עולמכם ובמה שחשוב לכם.\n\n2.  **טכנולוגיה בשירות הלב:** המערכת החכמה שלנו מנתחת את המידע ומאתרת מתוך מאגר רחב את האנשים בעלי פוטנציאל ההתאמה הגבוה ביותר עבורכם.\n\n3.  **ליווי ושיקול דעת אנושי:** כל הצעה פוטנציאלית עוברת בדיקה ואישור של שדכן אישי. תקבלו רק הצעות מנומקות, כאלו שאנחנו מאמינים בהן. השדכן גם מלווה אתכם לאורך כל הדרך, והכל בדיסקרטיות מוחלטת."
      },
      {
          question: 'במה אתם שונים מאפליקציות היכרויות או משדכנים רגילים?',
          answer:
          "זו שאלה מצוינת. אנחנו משלבים את הטוב משני העולמות:\n\n*   **מול אפליקציות:** אנחנו מציעים דיסקרטיות מלאה (הפרופיל שלכם לא חשוף לכל), חוסכים לכם את זמן החיפוש (אנחנו עובדים בשבילכם), והמטרה שלנו היא שתמצאו זוגיות ותעזבו אותנו.\n\n*   **מול שדכנות מסורתית:** אנחנו משתמשים בטכנולוגיה כדי לגשת למאגר גדול ורחב הרבה יותר, מה שמגדיל את סיכויי ההצלחה, תוך שמירה על הליווי האישי והיכולת לראות את מה שמעבר לנתונים היבשים.\n\nבמילים פשוטות, אנחנו שדכנות אישית בעידן הדיגיטלי."
      },
      {
          question: 'איך הפרטיות שלי נשמרת? מי רואה את המידע שלי?',
          answer: "הפרטיות והדיסקרטיות שלכם הן ערך עליון עבורנו. זו הבטחה. הפרופיל שלכם חשוף אך ורק לצוות השדכנים המצומצם שמטפל בכם. הוא אינו חשוף למשתמשים אחרים. כאשר אנחנו מזהים התאמה, אנו מציגים לכל צד פרופיל מפורט ומכבד של הצד השני, וזאת רק לאחר שקיבלנו את אישורכם המפורש. אתם תמיד בשליטה מלאה על המידע שלכם."
      },
      {
        question: 'מה העלות של השירות? כמה זה עולה?',
        answer:
          'כחלק מתקופת ההשקה והרצון שלנו לבנות קהילה איכותית, השירות כרגע מוצע במודל סמלי של 10 ש"ח לחודש (או ללא עלות, בהתאם לתקופה). חשוב להדגיש: בשלב זה, אין אצלנו "דמי הצלחה" כלל, גם אם תתארסו דרכנו. המטרה שלנו היא לאפשר לכם להכיר את הגישה הייחודית שלנו ללא מחסומים. בעתיד, ייתכן ונעבור למודל שיכלול דמי הצלחה, אך כל שינוי כזה יהיה כפוף לעדכון תנאי השימוש ולקבלת הסכמתכם המחודשת.'
      },
      {
        question: 'מה הסיכוי שלי למצוא התאמה וכמה זמן זה לוקח?',
        answer:
          "זו שאלה חשובה. אין לוח זמנים מדויק לאהבה, אך הגישה הממוקדת שלנו חוסכת זמן יקר ואנרגיה רגשית. במקום מאות שיחות שטחיות, תקבלו מספר מצומצם של הצעות איכותיות ומנומקות. המטרה היא איכות על פני כמות, כדי שכל הצעה תהיה משמעותית."
      },
      {
        question: 'איך הבינה המלאכותית (AI) עוזרת לי?',
        answer:
          "ה-AI הוא כלי עזר חכם גם עבורכם וגם עבור השדכנים שלנו. לשדכנים, הוא מסייע בניתוח מעמיק של פרופילים כדי לזהות דפוסי התאמה נסתרים. עבורכם, המערכת יכולה להציע תובנות לשיפור הפרופיל, ולסייע לכם להתייעץ לגבי הצעות שתקבלו כדי להבין טוב יותר את נקודות החוזק בהתאמה."
      },
      {
        question: 'למי השירות מיועד?',
        answer:
          'השירות שלנו מיועד לרווקים ורווקות מהקהילה היהודית המחפשים קשר רציני המוביל לחתונה. בשלב זה, אנו מתמקדים בעיקר בקהל הדתי-לאומי והאקדמי בישראל, אך פתוחים לכל מי שמתחבר לגישה המעמיקה והמכבדת שלנו. המערכת מיועדת כרגע לשידוכים בין גברים לנשים (סטרייטים) בלבד.'
      }
  ],
  en: [
    {
        question: "What is NeshamaTech? What do you do?",
        answer: "NeshamaTech is a matchmaking platform founded on a deep understanding of the challenges in the modern dating world. We combine smart technology with the warm, personal guidance of a team of matchmakers to create serious and meaningful connections.\n\nOur goal is to bring depth and respect back to the process of getting to know someone, allowing you to meet people based on a true compatibility of personality and values, not just a picture."
    },
    {
        question: "What is your method? How does the process work?",
        answer: "Our method is built on three pillars: depth, technology, and personal guidance.\n\n1.  **In-depth acquaintance:** The process begins with our unique 'Five Worlds' questionnaire. It's not a test, but a personal discovery journey where you share your worldviews and what's important to you.\n\n2.  **Technology at the service of the heart:** Our smart system analyzes the information and identifies individuals with the highest potential for compatibility from a wide database.\n\n3.  **Human guidance and judgment:** Every potential suggestion is reviewed and approved by a personal matchmaker. You will only receive well-reasoned suggestions that we believe in. The matchmaker also accompanies you throughout the process, all with complete discretion."
    },
    {
        question: "How are you different from dating apps or regular matchmakers?",
        answer: "That's an excellent question. We combine the best of both worlds:\n\n*   **Compared to apps:** We offer complete discretion (your profile is not public), we save you search time (we do the work for you), and our goal is for you to find a relationship and leave us.\n\n*   **Compared to traditional matchmaking:** We use technology to access a much larger and broader database, which increases the chances of success, while maintaining personal guidance and the ability to see beyond dry data.\n\nSimply put, we are personal matchmaking for the digital age."
    },
    {
        question: "How is my privacy protected? Who sees my information?",
        answer: "Your privacy and discretion are our top priority. This is a promise. Your profile is only visible to the small matchmaking team handling your case. It is not exposed to other users. When we identify a match, we present each side with a detailed and respectful profile of the other, but only after receiving your explicit approval. You are always in full control of your information."
    },
    {
        question: "What is the cost of the service? How much does it cost?",
        answer: "As part of our launch period and our desire to build a quality community, the service is currently offered at a symbolic model of $3/month (or for free, depending on the period). It's important to note: at this stage, we have **no 'success fees' at all**, even if you get engaged through us. Our goal is to let you experience our unique approach without barriers. In the future, we might add premium tracks or another model, but any such change will be subject to updating the terms of use and receiving your renewed consent."
    },
    {
        question: "What are my chances of finding a match and how long does it take?",
        answer: "That's an important question. There's no exact timeline for love, but our focused approach saves significant time and emotional energy. Instead of hundreds of superficial conversations, you'll receive a small number of high-quality, reasoned suggestions. The goal is quality over quantity, so that every suggestion is meaningful."
    },
    {
        question: "How does Artificial Intelligence (AI) help me?",
        answer: "The AI is a smart tool for both you and our matchmakers. For matchmakers, it assists in in-depth profile analysis to identify hidden compatibility patterns. For you, the system can offer insights to improve your profile and help you consult on suggestions you receive to better understand the strengths of a match."
    },
    {
        question: "Who is the service for?",
        answer: "Our service is designed for single men and women from the Jewish community who are looking for a serious relationship leading to marriage. At this stage, we primarily focus on the Religious-Zionist and academic community in Israel, but we are open to anyone who connects with our in-depth and respectful approach. The system is currently intended for heterosexual matchmaking only."
    }
  ]
};
// --- END: Internationalized Knowledge Base ---

const getPrompt = (lang: 'he' | 'en', knowledgeContext: string, message: string) => {
    if (lang === 'en') {
        return `
          **Your Persona:**
          You are the "Personal Assistant" for NeshamaTech. You are the first point of contact for potential users looking for a serious relationship. Your tone is that of a seasoned, warm, and trustworthy professional.
          - **Professional and Reassuring:** Use clear, respectful, and confident language.
          - **Empathetic and Understanding:** Acknowledge the challenges of the dating world but offer hope and a path forward.
          - **Trustworthy and Discreet:** Always emphasize the importance of privacy and trust.
          - **Value-Focused:** Explain not just *what* we do, but *why* it is beneficial for the user.
          - **Fluent and natural English speaker only.**

          **Your Mandatory Rules:**
          1.  **Rely solely on the knowledge base:** Do not invent information. Every answer must come directly from the text provided to you.
          2.  **Do not make promises:** Avoid promises like "you will find love." Instead, talk about "increasing the chances," "an efficient process," and "meaningful connections."
          3.  **Identify out-of-scope questions:** If the question is not covered in the knowledge base, you must respond with empathy and service-orientation. Reply: "That's an important question that deserves a personal answer from our team. I don't have specific information on that in the system, but I can forward your inquiry directly to one of the matchmakers. Would you like to send them a message by email?".
          4.  **Interpret questions:** Understand user intent. "How much" -> address cost. "How it works" -> address the method. "Is it safe?" -> address privacy.
          5.  **Avoid superlatives:** Don't say "we are the best." Instead, explain *why* our approach is unique and beneficial.

          --- Full Knowledge Base (Your absolute truth) ---
          ${knowledgeContext}
          --- End of Knowledge Base ---

          **Request:**
          Answer the following user's question, based on the persona and strict rules defined for you.

          User's question: "${message}"

          Answer in English:
        `;
    }

    // Default to Hebrew
    return `
      **הפרסונה שלך:**
      אתה "העוזר האישי" של NeshamaTech. אתה הנקודה הראשונה במגע עם משתמשים פוטנציאליים שמחפשים קשר רציני. הטון שלך הוא כמו של איש מקצוע ותיק, חם ומהימן.
      - **מקצועי ומרגיע:** השתמש בשפה ברורה, מכבדת ובוטחת. דבר בגובה העיניים.
      - **אמפתי ומבין:** הכר באתגרים של עולם הדייטים, אך הצע תקווה ודרך פעולה.
      - **אמין ודיסקרטי:** הדגש תמיד את חשיבות הפרטיות והאמון.
      - **ממוקד-ערך:** הסבר לא רק *מה* אנחנו עושים, אלא *למה* זה טוב ומועיל למשתמש.
      - **דובר עברית רהוטה וטבעית בלבד.**

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
};

const EMAIL_SUCCESS_MESSAGES = {
    he: 'תודה רבה! פנייתך נשלחה בהצלחה. אחד מאנשי הצוות שלנו יחזור אליך באופן אישי בהקדם האפשרי.',
    en: 'Thank you! Your message has been sent successfully. One of our team members will get back to you personally as soon as possible.'
};

const FALLBACK_PHRASES = {
    he: 'לשלוח להם פנייה במייל',
    en: 'send them a message by email'
};

const FALLBACK_ACTION_LABELS = {
    he: 'כן, אשמח לשלוח פנייה לצוות',
    en: 'Yes, I\'d like to send an email to the team'
};

if (!process.env.GOOGLE_API_KEY) {
  console.error('[CHAT API ERROR] GOOGLE_API_KEY is not defined!');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function POST(req: NextRequest) {
  try {
    // --- הוספת לוגיקת Rate Limiting ---
    if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const ip = req.ip ?? '127.0.0.1';
      const identifier = token?.sub ?? ip;
      const { success } = await ratelimit.limit(identifier);

      if (!success) {
        return new NextResponse('Too many requests. Please try again later.', { status: 429 });
      }
    }
    // --- סוף לוגיקת Rate Limiting ---

    const { message, type, userEmail, locale } = await req.json();
    const lang: 'he' | 'en' = locale === 'en' ? 'en' : 'he';

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
        subject: `New Chat Inquiry: ${userEmail}`,
        replyTo: userEmail,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6; color: #333;">
            <h2 style="color: #0891b2;">פנייה חדשה מהצ'אט-בוט באתר NeshamaTech:</h2>
            <p><strong>מאת:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
            <div style="background-color: #f8f9fa; border-right: 4px solid #06b6d4; padding: 15px; border-radius: 5px; margin-top: 10px;">
              <p style="margin: 0; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="font-size: 12px; color: #6c757d; margin-top: 20px;">
              זוהי הודעה אוטומטית. ניתן להשיב למייל זה ישירות כדי לענות לפונה.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return NextResponse.json({
        reply: EMAIL_SUCCESS_MESSAGES[lang],
      });
    }

    const selectedKnowledgeBase = KNOWLEDGE_BASES[lang];
    const knowledgeContext = selectedKnowledgeBase
        .map((item) => `שאלה: ${item.question}\nתשובה: ${item.answer}`)
        .join('\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings });
    
    const prompt = getPrompt(lang, knowledgeContext, message);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    const isFallback = text.includes(FALLBACK_PHRASES[lang]);

    if (isFallback) {
      return NextResponse.json({
        reply: text,
        isFallback: true,
        actions: [{ type: 'email', label: FALLBACK_ACTION_LABELS[lang] }],
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