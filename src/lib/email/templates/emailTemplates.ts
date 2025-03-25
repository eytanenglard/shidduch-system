// src/lib/email/templates/emailTemplates.ts

// טיפוסים לתבניות השונות
interface BaseTemplateContext {
  supportEmail: string;
}

interface WelcomeTemplateContext extends BaseTemplateContext {
  firstName: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  requiresVerification?: boolean;
  dashboardUrl: string;
  unsubscribeUrl?: string;
  privacyNote?: boolean;
  currentYear: number;
}

interface VerificationTemplateContext extends BaseTemplateContext {
  firstName?: string;
  verificationLink: string;
  expiresIn: string;
}

interface AvailabilityCheckTemplateContext extends BaseTemplateContext {
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
  baseUrl: string;
}

interface ContactDetailsTemplateContext extends BaseTemplateContext {
  recipientName: string;
  otherPartyName: string;
  otherPartyContact: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  matchmakerName: string;
}

interface SuggestionTemplateContext extends BaseTemplateContext {
  recipientName: string;
  matchmakerName: string;
  suggestionDetails?: {
    age?: number;
    city?: string;
    occupation?: string;
    additionalInfo?: string | null;
  };
  dashboardUrl: string;
}

interface PasswordResetTemplateContext extends BaseTemplateContext {
  resetLink: string; // זה יהיה קוד האימות המספרי
  expiresIn: string;
}

// מיפוי הטיפוסים לתבניות
type TemplateContextMap = {
  'welcome': WelcomeTemplateContext;
  'email-verification': VerificationTemplateContext;
  'availability-check': AvailabilityCheckTemplateContext;
  'share-contact-details': ContactDetailsTemplateContext;
  'suggestion': SuggestionTemplateContext;
  'password-reset': PasswordResetTemplateContext;
};

const createBaseTemplate = (content: string): string => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>
`;

export const emailTemplates: {
  [K in keyof TemplateContextMap]: (context: TemplateContextMap[K]) => string;
} = {
  welcome: (context) => createBaseTemplate(`
    <h2>ברוכים הבאים ${context.firstName}!</h2>
    <p>תודה שהצטרפת למערכת השידוכים שלנו.</p>
    ${context.matchmakerAssigned ? `
      <p>השדכן/ית ${context.matchmakerName} הוקצה/תה לך.</p>
    ` : ''}
    ${context.requiresVerification ? `
      <p>אנא אמת/י את כתובת האימייל שלך כדי להתחיל להשתמש במערכת.</p>
    ` : `
      <p>אתה מוכן להתחיל להשתמש במערכת.</p>
    `}
    <a href="${context.dashboardUrl}" class="button">כניסה למערכת</a>
    <div class="footer">
      <p>לתמיכה: ${context.supportEmail}</p>
      ${context.unsubscribeUrl ? `
        <p><a href="${context.unsubscribeUrl}">הסרה מרשימת התפוצה</a></p>
      ` : ''}
      ${context.privacyNote ? `
        <p>© ${context.currentYear} כל הזכויות שמורות</p>
      ` : ''}
    </div>
  `),

  'email-verification': (context) => createBaseTemplate(`
    <h2>שלום ${context.firstName || 'משתמש יקר'},</h2>
    <p>אנא לחץ/י על הקישור הבא כדי לאמת את כתובת האימייל שלך:</p>
    <a href="${context.verificationLink}" class="button">אימות אימייל</a>
    <p>הקישור תקף ל-${context.expiresIn}</p>
    <div class="footer">
      <p>אם לא ביקשת אימות זה, אנא התעלם/י מהודעה זו או פנה/י לתמיכה: ${context.supportEmail}</p>
    </div>
  `),

  'availability-check': (context) => createBaseTemplate(`
    <h2>שלום ${context.recipientName},</h2>
    <p>השדכן/ית ${context.matchmakerName} שלח/ה בקשה לבדיקת זמינות עבור הצעת שידוך.</p>
    <p>אנא כנס/י למערכת לצפייה בפרטים נוספים ומענה:</p>
    <a href="${context.baseUrl}/suggestions/${context.inquiryId}" class="button">צפייה בפרטים</a>
  `),

  'share-contact-details': (context) => createBaseTemplate(`
    <h2>שלום ${context.recipientName},</h2>
    <p>להלן פרטי הקשר של ${context.otherPartyName}:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
      ${context.otherPartyContact.phone ? `<p>טלפון: ${context.otherPartyContact.phone}</p>` : ''}
      ${context.otherPartyContact.email ? `<p>אימייל: ${context.otherPartyContact.email}</p>` : ''}
      ${context.otherPartyContact.whatsapp ? `<p>וואטסאפ: ${context.otherPartyContact.whatsapp}</p>` : ''}
    </div>
    <p>נשלח על ידי השדכן/ית ${context.matchmakerName}</p>
    <div class="footer">
      <p>לתמיכה: ${context.supportEmail}</p>
    </div>
  `),

  suggestion: (context) => createBaseTemplate(`
    <h2>שלום ${context.recipientName},</h2>
    <p>השדכן/ית ${context.matchmakerName} שלח/ה לך הצעת שידוך חדשה.</p>
    ${context.suggestionDetails ? `
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        ${context.suggestionDetails.age ? `<p>גיל: ${context.suggestionDetails.age}</p>` : ''}
        ${context.suggestionDetails.city ? `<p>עיר: ${context.suggestionDetails.city}</p>` : ''}
        ${context.suggestionDetails.occupation ? `<p>עיסוק: ${context.suggestionDetails.occupation}</p>` : ''}
        ${context.suggestionDetails.additionalInfo ? `<p>מידע נוסף: ${context.suggestionDetails.additionalInfo}</p>` : ''}
      </div>
    ` : ''}
    <p>לצפייה בפרטים נוספים ומענה:</p>
    <a href="${context.dashboardUrl}" class="button">צפייה בהצעה</a>
    <div class="footer">
      <p>לתמיכה: ${context.supportEmail}</p>
    </div>
  `),

  'password-reset': (context) => `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head>
      <meta charset="UTF-8">
      <style>
          body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
              text-align: center;
              padding: 20px;
              background-color: #4F46E5;
              color: white;
              border-radius: 8px 8px 0 0;
              margin-bottom: 20px;
          }
          .content {
              padding: 20px;
          }
          .verification-code {
              text-align: center;
              padding: 15px;
              background-color: #f0f7ff;
              border-radius: 5px;
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              color: #1a56db;
              border: 1px dashed #a4cafe;
          }
          .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
          }
          .important-note {
              background-color: #fff9e6;
              border-right: 4px solid #fbbf24;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
          }
          .steps {
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
          }
          .step {
              margin-bottom: 10px;
              padding-right: 25px;
              position: relative;
          }
          .step:before {
              content: "✓";
              position: absolute;
              right: 0;
              color: #4F46E5;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>קוד לשינוי סיסמה</h1>
          </div>
          <div class="content">
              <h2>שלום,</h2>
              <p>קיבלנו בקשה לשינוי הסיסמה שלך. להשלמת התהליך, השתמש בקוד האימות הבא:</p>
              
              <div class="verification-code">
                  ${context.resetLink}
              </div>

              <div class="steps">
                  <h3>כיצד להשתמש בקוד:</h3>
                  <div class="step">
                      הזן את הקוד בחלון שינוי הסיסמה במערכת
                  </div>
                  <div class="step">
                      הסיסמה החדשה תיכנס לתוקף לאחר אישור הקוד
                  </div>
              </div>

              <div class="important-note">
                  <strong>🔒 שים לב:</strong>
                  <p>הקוד תקף ל-${context.expiresIn} בלבד ויכול לשמש פעם אחת בלבד.</p>
                  <p>אם לא ביקשת לשנות את הסיסמה שלך, אנא התעלם מהודעה זו והסיסמה הנוכחית תישאר בתוקף.</p>
              </div>
          </div>

          <div class="footer">
              <p>
                  הודעה זו נשלחה אוטומטית, אנא אל תשיב להודעה זו.
                  <br>
                  לתמיכה: ${context.supportEmail}
              </p>
          </div>
      </div>
  </body>
  </html>
  `
};