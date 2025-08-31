// src/lib/email/templates/emailTemplates.ts

import { EmailDictionary } from '@/types/dictionary';

// --- הגדרות טיפוסים לקונטקסט של כל תבנית ---

interface BaseTemplateContext {
  supportEmail: string;
  currentYear: string;
  companyName: string;
  baseUrl: string;
  sharedDict: EmailDictionary['shared'];
  name: string;
}

// הגדרות ספציפיות
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
};

// --- פונקציית עזר ליצירת HTML בסיסי ---
const createBaseEmailHtml = (title: string, content: string, context: BaseTemplateContext): string => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif; direction: rtl; text-align: right; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #343a40; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; }
        .email-header { background-color: #06b6d4; color: #ffffff; padding: 25px; text-align: center; border-bottom: 5px solid #0891b2; }
        .email-header h1 { margin: 0; font-size: 26px; font-weight: 600; }
        .email-body { padding: 25px 30px; font-size: 16px; }
        .email-body p { margin-bottom: 1em; }
        .otp-code { font-size: 28px; font-weight: bold; color: #ec4899; text-align: center; margin: 25px 0; padding: 15px; background-color: #fdf2f8; border: 1px dashed #fbcfe8; border-radius: 5px; letter-spacing: 3px; }
        .button { display: inline-block; padding: 12px 25px; background-color: #06b6d4; color: white !important; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: 500; text-align: center; }
        .button:hover { background-color: #0891b2; }
        .footer { background-color: #f1f3f5; padding: 20px; text-align: center; font-size: 0.9em; color: #6c757d; border-top: 1px solid #e9ecef; }
        .footer a { color: #06b6d4; text-decoration: none; }
        .highlight-box { background-color: #fef9e7; border-right: 4px solid #f7c75c; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .attributes-list { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header"><h1>${title}</h1></div>
        <div class="email-body">
            ${content}
            <p style="margin-top: 30px;">${context.sharedDict.closing}<br>${context.sharedDict.team}</p>
        </div>
        <div class="footer">
            <p>${context.sharedDict.supportPrompt} <a href="mailto:${context.supportEmail}">${context.supportEmail}</a></p>
            <p>${context.sharedDict.rightsReserved.replace('{{year}}', context.currentYear)}</p>
        </div>
    </div>
</body>
</html>
`;

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
        context.suggestionDetails.age && `<li><strong>גיל:</strong> ${context.suggestionDetails.age}</li>`,
        context.suggestionDetails.city && `<li><strong>עיר:</strong> ${context.suggestionDetails.city}</li>`,
        context.suggestionDetails.occupation && `<li><strong>עיסוק:</strong> ${context.suggestionDetails.occupation}</li>`,
        context.suggestionDetails.additionalInfo && `<li><strong>מידע נוסף:</strong> ${context.suggestionDetails.additionalInfo}</li>`,
      ].filter(Boolean).join('');
      if (detailsList) {
        detailsHtml = `<ul>${detailsList}</ul>`;
      }
    }
    return createBaseEmailHtml(context.dict.title, `
      <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
      <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
      ${detailsHtml ? `<div class="attributes-list"><h4>${context.dict.previewTitle}</h4>${detailsHtml}</div>` : ''}
      <p>${context.dict.actionPrompt}</p>
      <p style="text-align: center;">
        <a href="${context.dashboardUrl}" class="button">${context.dict.actionButton}</a>
      </p>
      <p>${context.dict.closing}</p>
    `, context);
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
};