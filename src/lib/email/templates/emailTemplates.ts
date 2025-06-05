// src/lib/email/templates/emailTemplates.ts

// טיפוסים לתבניות השונות
interface BaseTemplateContext {
  supportEmail: string;
  currentYear: number;
  companyName: string; // Added for consistency
  baseUrl: string; // Added for consistency
}

interface WelcomeTemplateContext extends BaseTemplateContext {
  firstName: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  requiresVerification?: boolean;
  dashboardUrl: string;
  unsubscribeUrl?: string;
  privacyNote?: boolean;
}

interface EmailOtpVerificationTemplateContext extends BaseTemplateContext {
  firstName?: string;
  verificationCode: string;
  expiresIn: string;
}

interface AvailabilityCheckTemplateContext extends BaseTemplateContext {
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
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

// Updated for OTP based reset
interface PasswordResetOtpTemplateContext extends BaseTemplateContext {
  firstName?: string;
  otp: string; // Changed from resetLink to otp
  expiresIn: string;
}

// New context for password changed confirmation
interface PasswordChangedConfirmationTemplateContext extends BaseTemplateContext {
    firstName?: string;
    loginUrl: string;
}

interface InvitationTemplateContext extends BaseTemplateContext {
    matchmakerName: string;
    invitationLink: string;
    expiresIn: string;
}


// מיפוי הטיפוסים לתבניות
type TemplateContextMap = {
  'welcome': WelcomeTemplateContext;
  'email-otp-verification': EmailOtpVerificationTemplateContext;
  'availability-check': AvailabilityCheckTemplateContext;
  'share-contact-details': ContactDetailsTemplateContext;
  'suggestion': SuggestionTemplateContext;
  'password-reset-otp': PasswordResetOtpTemplateContext; // Renamed and updated
  'password-changed-confirmation': PasswordChangedConfirmationTemplateContext; // New
  'invitation': InvitationTemplateContext;
  // 'password-reset': PasswordResetLinkTemplateContext; // Keep if old link-based reset is still used elsewhere
};

// --- פונקציית עזר ליצירת תבנית HTML בסיסית ---
// This createBaseEmailHtml function is a good pattern.
// We assume it exists as you provided.
const createBaseEmailHtml = (title: string, content: string, footerText: string): string => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif; direction: rtl; text-align: right; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #343a40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; }
        .email-header { background-color: #06b6d4; /* Default Cyan */ color: #ffffff; padding: 25px; text-align: center; border-bottom: 5px solid #0891b2; /* Darker Cyan */ }
        .email-header.success { background-color: #10b981; border-bottom-color: #059669; } /* Green for success */
        .email-header h1 { margin: 0; font-size: 26px; font-weight: 600; }
        .email-body { padding: 25px 30px; font-size: 16px; }
        .email-body p { margin-bottom: 1em; }
        .email-body strong { color: #0891b2; } /* Darker Cyan */
        .otp-code { font-size: 28px; font-weight: bold; color: #ec4899; /* Pink */ text-align: center; margin: 25px 0; padding: 15px; background-color: #fdf2f8; border: 1px dashed #fbcfe8; border-radius: 5px; letter-spacing: 3px; }
        .button { display: inline-block; padding: 12px 25px; background-color: #06b6d4; /* Cyan */ color: white !important; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: 500; text-align: center; }
        .button:hover { background-color: #0891b2; }
        .footer { background-color: #f1f3f5; padding: 20px; text-align: center; font-size: 0.9em; color: #6c757d; border-top: 1px solid #e9ecef; }
        .footer a { color: #06b6d4; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .highlight-box { background-color: #fef9e7; border-right: 4px solid #f7c75c; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .attributes-list { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        .attributes-list p { margin: 5px 0; }
        .attributes-list li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header {{headerClass}}"><h1>${title}</h1></div>
        <div class="email-body">
            ${content}
        </div>
        <div class="footer">
            ${footerText}
        </div>
    </div>
</body>
</html>
`;
// Modified base HTML to accept a headerClass for dynamic header styling

// --- התבניות הקיימות שלך (עם התאמות קלות להקשר הבסיסי) ---
export const emailTemplates: {
  [K in keyof TemplateContextMap]: (context: TemplateContextMap[K]) => string;
} = {
  'welcome': (context) => {
    const content = `
      <p>שלום <strong>${context.firstName}</strong>,</p>
      <p>אנו שמחים מאוד על הצטרפותך למערכת השידוכים ${context.companyName}! אנו מאחלים לך הצלחה רבה במסע למציאת ההתאמה המושלמת.</p>
      ${context.matchmakerAssigned && context.matchmakerName ? `
        <div class="highlight-box">
          <p><strong>עדכון חשוב:</strong> שדכן/ית אישי/ת, <strong>${context.matchmakerName}</strong>, הוקצה/תה לך ויצור/תיצור עמך קשר בקרוב.</p>
        </div>
      ` : ''}
      ${context.requiresVerification ? `
        <p>כדי להתחיל, אנא אמת/י את כתובת המייל שלך. שלחנו לך מייל נוסף עם קוד אימות.</p>
      ` : `
        <p>חשבונך מוכן לשימוש. אנו ממליצים לך להשלים את הפרופיל האישי שלך כדי שנוכל להתחיל למצוא עבורך הצעות מתאימות.</p>
      `}
      <p style="text-align: center;">
        <a href="${context.dashboardUrl}" class="button">כניסה לאזור האישי</a>
      </p>
      <p>אם יש לך שאלות או שאת/ה זקוק/ה לעזרה, אל תהסס/י לפנות אלינו.</p>
    `;
    const footer = `
      <p>לתמיכה ושאלות, ניתן לפנות אלינו בכתובת: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a></p>
      ${context.unsubscribeUrl ? `<p><a href="${context.unsubscribeUrl}">הסרה מרשימת התפוצה</a></p>` : ''}
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('ברוכים הבאים!', content.replace('{{headerClass}}', ''), footer);
  },

  'email-otp-verification': (context) => {
    const content = `
      <p>שלום ${context.firstName || 'משתמש יקר'},</p>
      <p>השתמש/י בקוד האימות הבא כדי לאשר את כתובת המייל שלך במערכת ${context.companyName}:</p>
      <div class="otp-code">${context.verificationCode}</div>
      <p>הקוד תקף למשך <strong>${context.expiresIn}</strong> מרגע שליחתו.</p>
      <p>אם לא ביקשת לאמת כתובת מייל זו, או שאינך מנסה להירשם לאתר שלנו, אנא התעלם/י מהודעה זו.</p>
      <p>אבטחת חשבונך חשובה לנו. לעולם אל תשתף/י קוד זה עם איש.</p>
    `;
    const footer = `
      <p>נתקלת בבעיה? <a href="mailto:${context.supportEmail}">צור קשר עם התמיכה</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('קוד אימות למייל', content.replace('{{headerClass}}', ''), footer);
  },
  
  'invitation': (context) => {
    const content = `
      <p>שלום,</p>
      <p>השדכן/ית <strong>${context.matchmakerName}</strong> מזמין/ה אותך להצטרף למערכת השידוכים ${context.companyName}.</p>
      <p>אנו מאמינים שנוכל לעזור לך למצוא את ההתאמה המושלמת. אנא לחץ/י על הקישור הבא כדי להשלים את ההרשמה:</p>
      <p style="text-align: center;">
        <a href="${context.invitationLink}" class="button">הצטרפות למערכת</a>
      </p>
      <p>הזמנה זו תקפה למשך <strong>${context.expiresIn}</strong>.</p>
      <p>אנו מצפים לראותך!</p>
    `;
    const footer = `
      <p>אם יש לך שאלות, ניתן לפנות אלינו בכתובת: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('הזמנה להצטרף למערכת השידוכים', content.replace('{{headerClass}}', ''), footer);
  },

  'availability-check': (context) => {
    const content = `
      <p>שלום <strong>${context.recipientName}</strong>,</p>
      <p>השדכן/ית <strong>${context.matchmakerName}</strong> שלח/ה לך בקשה לבדיקת זמינות עבור הצעת שידוך פוטנציאלית.</p>
      <p>אנו מעריכים את תגובתך המהירה. אנא כנס/י לאזור האישי שלך כדי לעיין בפרטים ולהשיב לבקשה:</p>
      <p style="text-align: center;">
        <a href="${context.baseUrl}/dashboard/suggestions?inquiryId=${context.inquiryId}" class="button">צפייה ועדכון זמינות</a>
      </p>
      <p>תודה על שיתוף הפעולה!</p>
    `;
    const footer = `
      <p>לשאלות נוספות, פנה/י לשדכן/ית שלך או לתמיכה בכתובת: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('בקשת בדיקת זמינות', content.replace('{{headerClass}}', ''), footer);
  },

  'share-contact-details': (context) => {
    const contactInfoHtml = [
      context.otherPartyContact.phone && `<p><strong>טלפון:</strong> ${context.otherPartyContact.phone}</p>`,
      context.otherPartyContact.email && `<p><strong>אימייל:</strong> <a href="mailto:${context.otherPartyContact.email}">${context.otherPartyContact.email}</a></p>`,
      context.otherPartyContact.whatsapp && `<p><strong>וואטסאפ:</strong> ${context.otherPartyContact.whatsapp}</p>`,
    ].filter(Boolean).join('');

    const content = `
      <p>שלום <strong>${context.recipientName}</strong>,</p>
      <p>בהמשך להסכמתך, אנו שמחים להעביר לך את פרטי הקשר של <strong>${context.otherPartyName}</strong>. פרטים אלו נשלחו גם לצד השני.</p>
      <div class="attributes-list">
        <h3>פרטי הקשר של ${context.otherPartyName}:</h3>
        ${contactInfoHtml || '<p>לא סופקו פרטי קשר נוספים.</p>'}
      </div>
      <p>הודעה זו נשלחה על ידי השדכן/ית שלך, <strong>${context.matchmakerName}</strong>.</p>
      <p>אנו מאחלים לכם הצלחה רבה ומקווים שתהיה זו התחלה של קשר נפלא!</p>
      <div class="highlight-box">
        <p><strong>טיפ קטן:</strong> מומלץ ליצור קשר ראשוני תוך 24-48 שעות. שיחה נעימה ופתוחה יכולה לעשות הבדל גדול.</p>
      </div>
    `;
    const footer = `
      <p>אם נתקלת בבעיה או שיש לך שאלות, אנא פנה/י לשדכן/ית שלך או לתמיכה: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('העברת פרטי קשר', content.replace('{{headerClass}}', ''), footer);
  },

  'suggestion': (context) => {
    let suggestionDetailsHtml = '';
    if (context.suggestionDetails) {
      const details = [
        context.suggestionDetails.age && `<li><strong>גיל:</strong> ${context.suggestionDetails.age}</li>`,
        context.suggestionDetails.city && `<li><strong>עיר:</strong> ${context.suggestionDetails.city}</li>`,
        context.suggestionDetails.occupation && `<li><strong>עיסוק:</strong> ${context.suggestionDetails.occupation}</li>`,
        context.suggestionDetails.additionalInfo && `<li><strong>מידע נוסף:</strong> ${context.suggestionDetails.additionalInfo}</li>`,
      ].filter(Boolean).join('');
      if (details) {
        suggestionDetailsHtml = `
          <div class="attributes-list">
            <p>הצצה קטנה לפרטי ההצעה:</p>
            <ul>${details}</ul>
          </div>
        `;
      }
    }

    const content = `
      <p>שלום <strong>${context.recipientName}</strong>,</p>
      <p>יש לנו חדשות מרגשות! השדכן/ית שלך, <strong>${context.matchmakerName}</strong>, מצא/ה עבורך הצעת שידוך חדשה שנראית מבטיחה.</p>
      ${suggestionDetailsHtml}
      <p>אנו ממליצים לך להיכנס לאזור האישי שלך כדי לעיין בפרטים המלאים של ההצעה ולהודיע לנו על החלטתך:</p>
      <p style="text-align: center;">
        <a href="${context.dashboardUrl}" class="button">צפייה בהצעה המלאה</a>
      </p>
      <p>נשמח לשמוע ממך בהקדם!</p>
    `;
    const footer = `
      <p>לכל שאלה או התייעצות, השדכן/ית שלך זמין/ה עבורך. ניתן גם לפנות לתמיכה: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    return createBaseEmailHtml('הצעת שידוך חדשה עבורך', content.replace('{{headerClass}}', ''), footer);
  },

  // --- תבניות חדשות ---
  'password-reset-otp': (context) => {
    const content = `
      <p>שלום ${context.firstName || 'משתמש יקר'},</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה שלך עבור חשבונך במערכת ${context.companyName}.</p>
      <p>אנא השתמש בקוד האימות החד-פעמי הבא כדי לאפס את סיסמתך. הזן/הזיני אותו בשדה המתאים בדף איפוס הסיסמה באתר:</p>
      <div class="otp-code">${context.otp}</div>
      <p>הקוד תקף למשך <strong>${context.expiresIn}</strong>.</p>
      <div class="highlight-box">
        <p><strong>חשוב:</strong> אם לא יזמת את הבקשה לאיפוס סיסמה, אין צורך לבצע כל פעולה, וסיסמתך תישאר כפי שהיא. ייתכן שמישהו הזין את כתובת המייל שלך בטעות.</p>
        <p>מטעמי אבטחה, לעולם אל תשתף/י קוד זה עם אף אחד.</p>
      </div>
      <p>במידה ונתקלת בקשיים, צוות התמיכה שלנו זמין לסייע.</p>
    `;
    const footer = `
      <p>לתמיכה נוספת, ניתן לפנות אלינו בכתובת: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    // The headerClass here can be an empty string or a specific class if needed
    return createBaseEmailHtml('קוד לאיפוס סיסמה', content.replace('{{headerClass}}', ''), footer);
  },

  'password-changed-confirmation': (context) => {
    const content = `
      <p>שלום ${context.firstName || 'משתמש יקר'},</p>
      <p>אנו מאשרים שהסיסמה עבור חשבונך במערכת ${context.companyName} שונתה בהצלחה.</p>
      <p>אם לא ביצעת שינוי זה, או אם אתה חושד בפעילות לא מורשית בחשבונך, אנא פנה אלינו באופן מיידי.</p>
      <p>תוכל להתחבר לחשבונך כעת באמצעות הסיסמה החדשה שלך:</p>
      <p style="text-align: center;">
        <a href="${context.loginUrl}" class="button">התחבר לחשבונך</a>
      </p>
    `;
    const footer = `
      <p>לכל שאלה, פנה לתמיכה: <a href="mailto:${context.supportEmail}">${context.supportEmail}</a>.</p>
      <p>© ${context.currentYear} כל הזכויות שמורות ל${context.companyName}.</p>
    `;
    // Use 'success' class for the header of this confirmation email
    return createBaseEmailHtml('הסיסמה שלך שונתה', content.replace('{{headerClass}}', 'success'), footer);
  }

  // If you still had an old 'password-reset' for links:
  // 'password-reset': (context) => { ... your old link-based reset template ... }
};