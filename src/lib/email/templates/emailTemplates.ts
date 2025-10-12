// src/lib/email/templates/emailTemplates.ts

import { EmailDictionary } from '@/types/dictionary';
import { Locale } from '../../../../i18n-config'; // ודא שהנתיב נכון
import { ProfileFeedbackReport } from '@/lib/services/profileFeedbackService'; // ייבוא חדש
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

// טען את תבנית ה-Footer פעם אחת
const footerTemplate = Handlebars.compile(
  fs.readFileSync(
    path.join(process.cwd(), 'src/lib/email/templates/shared/footer.hbs'),
    'utf-8'
  )
);

// --- הגדרות טיפוסים לקונטקסט של כל תבנית ---
interface BaseTemplateContext {
  locale: Locale;
  supportEmail: string;
  currentYear: string;
  companyName: string;
  baseUrl: string;
  sharedDict: EmailDictionary['shared'];
  name: string;
}

export interface ProfileFeedbackTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['profileFeedback'];
  report: ProfileFeedbackReport;
  isAutomated: boolean;
  matchmakerName: string;
  greeting?: string; // הוספת שדה greeting אופציונלי
}

// שאר הטיפוסים נשארים זהים...
export interface WelcomeTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['welcome'];
  firstName: string;
  matchmakerAssigned?: boolean;
  matchmakerName?: string;
  dashboardUrl: string;
}

export interface AccountSetupTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['accountSetup'];
  firstName: string;
  matchmakerName: string;
  setupLink: string;
  expiresIn: string;
}

export interface EmailOtpVerificationTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['emailOtpVerification'];
  verificationCode: string;
  expiresIn: string;
}

export interface InvitationTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['invitation'];
  matchmakerName: string;
  invitationLink: string;
  expiresIn: string;
}
export interface ProfileSummaryUpdateTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['profileSummaryUpdate'];
  firstName: string;
  matchmakerName: string;
  dashboardUrl: string;
}

export interface SuggestionTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['suggestion'];
  recipientName: string;
  matchmakerName: string;
  suggestionDetails?: { age?: number; city?: string; occupation?: string; additionalInfo?: string | null; };
  dashboardUrl: string;
}

export interface ContactDetailsTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['shareContactDetails'];
  recipientName: string;
  otherPartyName: string;
  otherPartyContact: { phone?: string; email?: string; whatsapp?: string; };
  matchmakerName: string;
}

export interface AvailabilityCheckTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['availabilityCheck'];
  recipientName: string;
  matchmakerName: string;
  inquiryId: string;
}

export interface PasswordResetOtpTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['passwordResetOtp'];
  otp: string;
  expiresIn: string;
}

export interface PasswordChangedConfirmationTemplateContext extends BaseTemplateContext {
  dict: EmailDictionary['passwordChangedConfirmation'];
  loginUrl: string;
}

export interface InternalFeedbackNotificationTemplateContext {
    feedbackType: string;
    userIdentifier: string;
    content: string;
    pageUrl: string;
    screenshotUrl?: string;
    feedbackId: string;
}

// מפה בין שם התבנית לסוג הקונטקסט שלה
export type TemplateContextMap = {
  welcome: WelcomeTemplateContext;
  accountSetup: AccountSetupTemplateContext;
  emailOtpVerification: EmailOtpVerificationTemplateContext;
  invitation: InvitationTemplateContext;
  suggestion: SuggestionTemplateContext;
  shareContactDetails: ContactDetailsTemplateContext;
  availabilityCheck: AvailabilityCheckTemplateContext;
  passwordResetOtp: PasswordResetOtpTemplateContext;
  passwordChangedConfirmation: PasswordChangedConfirmationTemplateContext;
    profileSummaryUpdate: ProfileSummaryUpdateTemplateContext; // ✨ הוספת התבנית החדשה למפה

  'internal-feedback-notification': InternalFeedbackNotificationTemplateContext;
  // שים לב: אנחנו משאירים את הטיפוס כאן, אך לא נגדיר עבורו פונקציה
  'profileFeedback': ProfileFeedbackTemplateContext;
};

// --- פונקציית עזר ליצירת HTML בסיסי לאימיילים פנימיים ---
const createInternalBaseEmailHtml = (title: string, content: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff; }
        h1 { color: #06b6d4; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; vertical-align: top; }
        th { background-color: #f7f7f7; font-weight: 600; width: 150px; }
        pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
        .screenshot { margin-top: 25px; }
        .screenshot h2 { font-size: 18px; color: #333; margin-bottom: 10px; }
        .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
        a { color: #06b6d4; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
};

// --- פונקציית עזר ליצירת HTML בסיסי ---
const createBaseEmailHtml = (title: string, content: string, context: BaseTemplateContext): string => {
    const isRtl = context.locale === 'he';
    const direction = isRtl ? 'rtl' : 'ltr';
    const textAlign = isRtl ? 'right' : 'left';
    
    // יצירת ה-footer עם הקונטקסט
    const footerHtml = footerTemplate(context);

    return `
<!DOCTYPE html>
<html dir="${direction}" lang="${context.locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif; 
            direction: ${direction}; 
            text-align: ${textAlign}; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
            color: #343a40; 
        }
        .email-container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.05); 
            overflow: hidden; 
        }
        .email-header { 
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: #ffffff; 
            padding: 25px; 
            text-align: center; 
            border-bottom: 5px solid #0891b2; 
        }
        .email-header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 600; 
        }
        .email-body { 
            padding: 25px 30px; 
            font-size: 16px; 
        }
        .email-body p { 
            margin-bottom: 1em; 
        }
        .otp-code { 
            font-size: 28px; 
            font-weight: bold; 
            color: #ec4899; 
            text-align: center; 
            margin: 25px 0; 
            padding: 15px; 
            background-color: #fdf2f8; 
            border: 1px dashed #fbcfe8; 
            border-radius: 5px; 
            letter-spacing: 3px; 
        }
        .button { 
            display: inline-block; 
            padding: 12px 25px; 
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 15px 0; 
            font-weight: 500; 
            text-align: center; 
            transition: transform 0.2s;
        }
        .button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }
        .highlight-box { 
            background-color: #fef9e7; 
            border-${isRtl ? 'right' : 'left'}: 4px solid #f7c75c; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 5px; 
        }
        .attributes-list { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 15px; 
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${title}</h1>
        </div>
        <div class="email-body">
            ${content}
        </div>
        ${footerHtml}
    </div>
</body>
</html>
`;
};


// --- מיפוי התבניות עם הטיפוס המדויק ---
export const emailTemplates: {
  [K in keyof TemplateContextMap]: (context: TemplateContextMap[K]) => string;
} = {
  welcome: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
    <p>${context.dict.intro}</p>
    ${context.matchmakerAssigned && context.matchmakerName ? `
      <div class="highlight-box">
        <p><strong>${context.dict.matchmakerAssigned.replace('{{matchmakerName}}', context.matchmakerName)}</strong></p>
      </div>` : ''
    }
    <p>${context.dict.getStarted}</p>
    <p style="text-align: center;">
      <a href="${context.dashboardUrl}" class="button">${context.dict.dashboardButton}</a>
    </p>
  `, context),

  accountSetup: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
    <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    <p>${context.dict.actionPrompt}</p>
    <p style="text-align: center;">
      <a href="${context.setupLink}" class="button">${context.dict.actionButton}</a>
    </p>
    <div class="highlight-box">
      <p><strong>${context.dict.notice.replace('{{expiresIn}}', context.expiresIn)}</strong></p>
    </div>
    <p>${context.dict.nextStep}</p>
  `, context),
  
    profileSummaryUpdate: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
    <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    <div class="highlight-box">
      <p><strong>${context.dict.highlight}</strong></p>
    </div>
    <p>${context.dict.encouragement}</p>
    <p style="text-align: center;">
      <a href="${context.dashboardUrl}" class="button">${context.dict.actionButton}</a>
    </p>
  `, context),
  // ✨ END: הוספת לוגיקת תבנית חדשה

  emailOtpVerification: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name || 'משתמש יקר')}</p>
    <p>${context.dict.intro}</p>
    <p>${context.dict.codeInstruction}</p>
    <div class="otp-code">${context.verificationCode}</div>
    <p>${context.dict.expiryNotice.replace('{{expiresIn}}', context.expiresIn)}</p>
    <p>${context.dict.securityNote}</p>
  `, context),

  invitation: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
    <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    <p>${context.dict.actionPrompt}</p>
    <p style="text-align: center;">
      <a href="${context.invitationLink}" class="button">${context.dict.actionButton}</a>
    </p>
    <p>${context.dict.expiryNotice.replace('{{expiresIn}}', context.expiresIn)}</p>
  `, context),
  
  suggestion: (context) => {
    let detailsHtml = '';
    if (context.suggestionDetails) {
      const detailsList = [
        context.suggestionDetails.age && `<li><strong>${context.dict.details.age}:</strong> ${context.suggestionDetails.age}</li>`,
        context.suggestionDetails.city && `<li><strong>${context.dict.details.city}:</strong> ${context.suggestionDetails.city}</li>`,
        context.suggestionDetails.occupation && `<li><strong>${context.dict.details.occupation}:</strong> ${context.suggestionDetails.occupation}</li>`,
        context.suggestionDetails.additionalInfo && `<li><strong>${context.dict.details.additionalInfo}:</strong> ${context.suggestionDetails.additionalInfo}</li>`,
      ].filter(Boolean).join('');
      
      if (detailsList) {
        detailsHtml = `
          <div class="attributes-list">
            <h4>${context.dict.previewTitle}</h4>
            <ul>${detailsList}</ul>
          </div>`;
      }
    }
    
     return createBaseEmailHtml(
       context.dict.title, 
       `
        <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
        <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
        ${detailsHtml}
        <p>${context.dict.actionPrompt}</p>
        <p style="text-align: center;">
            <a href="${context.dashboardUrl}" class="button">${context.dict.actionButton}</a>
        </p>
        <p>${context.dict.closing}</p>
      `, 
      context
    );
  },
'profileFeedback': (context) => {
    // כאן, במקום לבנות HTML ידנית, אנו משתמשים במנוע התבניות
    // שנטען על ידי השרת שלך (למשל, hbs). הלוגיקה עצמה נמצאת בקובץ ה-hbs.
    // הקוד כאן רק צריך להעביר את האובייקט 'context' למנוע העיבוד.
    // לצורך הדוגמה, אני מדמה את זה. ודא שהתשתית שלך תומכת בזה.
    const Handlebars = require('handlebars'); // ייבוא סימבולי
    const templateSource = require('./profile-feedback.hbs'); // טעינה סימבולית של הקובץ
    const compiledTemplate = Handlebars.compile(templateSource);
    return compiledTemplate(context);
},
  shareContactDetails: (context) => {
    const contactInfoHtml = [
      context.otherPartyContact.phone && `<p><strong>טלפון:</strong> ${context.otherPartyContact.phone}</p>`,
      context.otherPartyContact.email && `<p><strong>אימייל:</strong> <a href="mailto:${context.otherPartyContact.email}">${context.otherPartyContact.email}</a></p>`,
      context.otherPartyContact.whatsapp && `<p><strong>וואטסאפ:</strong> ${context.otherPartyContact.whatsapp}</p>`,
    ].filter(Boolean).join('');

    return createBaseEmailHtml(context.dict.title, `
      <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
      <p>${context.dict.intro}</p>
      <div class="attributes-list">
        <h3>${context.dict.detailsOf.replace('{{otherPartyName}}', context.otherPartyName)}</h3>
        ${contactInfoHtml || '<p>לא סופקו פרטי קשר.</p>'}
      </div>
      <div class="highlight-box">
        <p><strong>${context.dict.tipTitle}</strong> ${context.dict.tipContent}</p>
      </div>
      <p>${context.dict.goodLuck}</p>
    `, context);
  },

  availabilityCheck: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
    <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    <p>${context.dict.actionPrompt}</p>
    <p style="text-align: center;">
      <a href="${context.baseUrl}/dashboard/suggestions?inquiryId=${context.inquiryId}" class="button">${context.dict.actionButton}</a>
    </p>
    <div class="highlight-box">
      <p><strong>${context.dict.noticeTitle}</strong> ${context.dict.noticeContent}</p>
    </div>
  `, context),

  passwordResetOtp: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name || 'משתמש יקר')}</p>
    <p>${context.dict.intro}</p>
    <p>${context.dict.codeInstruction}</p>
    <div class="otp-code">${context.otp}</div>
    <p>${context.dict.expiryNotice.replace('{{expiresIn}}', context.expiresIn)}</p>
    <p>${context.dict.securityNote}</p>
  `, context),

  passwordChangedConfirmation: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name || 'משתמש יקר')}</p>
    <p>${context.dict.intro}</p>
    <div class="highlight-box">
      <p>${context.dict.securityNote}</p>
    </div>
    <p style="text-align: center;">
      <a href="${context.loginUrl}" class="button">${context.dict.actionButton}</a>
    </p>
  `, context),
  
  // ============================ הוספת התבנית החדשה כאן ============================
  'internal-feedback-notification': (context) => createInternalBaseEmailHtml('New Feedback Received', `
    <h1>New Feedback Received</h1>
    <p>A new piece of feedback has been submitted through the website widget.</p>
    
    <table>
        <tr>
            <th>Feedback ID</th>
            <td>${context.feedbackId}</td>
        </tr>
        <tr>
            <th>Type</th>
            <td><strong>${context.feedbackType}</strong></td>
        </tr>
        <tr>
            <th>Submitted By</th>
            <td>${context.userIdentifier}</td>
        </tr>
        <tr>
            <th>Page URL</th>
            <td><a href="${context.pageUrl}" target="_blank">${context.pageUrl}</a></td>
        </tr>
        <tr>
            <th>Content</th>
            <td><pre>${context.content}</pre></td>
        </tr>
    </table>

    ${context.screenshotUrl ? `
    <div class="screenshot">
        <h2>Screenshot Attached</h2>
        <a href="${context.screenshotUrl}" target="_blank">
            <img src="${context.screenshotUrl}" alt="User-submitted screenshot">
        </a>
    </div>
    ` : ''}
  `),
  // ==============================================================================
};