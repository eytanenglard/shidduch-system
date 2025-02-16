// src/lib/email/emailTemplates.ts

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
    resetLink: string;
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
  
    'password-reset': (context) => createBaseTemplate(`
      <h2>איפוס סיסמה</h2>
      <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
      <p>לחץ/י על הקישור הבא כדי לאפס את הסיסמה:</p>
      <a href="${context.resetLink}" class="button">איפוס סיסמה</a>
      <p>הקישור תקף ל-${context.expiresIn}</p>
      <div class="footer">
        <p>אם לא ביקשת איפוס סיסמה, אנא התעלם/י מהודעה זו או פנה/י לתמיכה: ${context.supportEmail}</p>
      </div>
    `)
  };