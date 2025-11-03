"use strict";
// src/lib/email/templates/emailTemplates.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
// טען את תבניות ה-Handlebars פעם אחת בעת טעינת המודול
const loadTemplate = (filePath) => {
    const fullPath = path.join(process.cwd(), filePath);
    return handlebars_1.default.compile(fs.readFileSync(fullPath, 'utf-8'));
};
const footerTemplate = loadTemplate('src/lib/email/templates/shared/footer.hbs');
const profileFeedbackTemplate = loadTemplate('src/lib/email/templates/profile-feedback.hbs');
// --- פונקציית עזר ליצירת HTML בסיסי לאימיילים פנימיים ---
const createInternalBaseEmailHtml = (title, content) => {
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
const createBaseEmailHtml = (title, content, context) => {
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
exports.emailTemplates = {
    welcome: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
    <p>${context.dict.intro}</p>
    ${context.matchmakerAssigned && context.matchmakerName ? `
      <div class="highlight-box">
        <p><strong>${context.dict.matchmakerAssigned.replace('{{matchmakerName}}', context.matchmakerName)}</strong></p>
      </div>` : ''}
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
        return createBaseEmailHtml(context.dict.title, `
        <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
        <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
        ${detailsHtml}
        <p>${context.dict.actionPrompt}</p>
        <p style="text-align: center;">
            <a href="${context.dashboardUrl}" class="button">${context.dict.actionButton}</a>
        </p>
        <p>${context.dict.closing}</p>
      `, context);
    },
    'profileFeedback': (context) => {
        // התבנית נטענת ומתקמפלת פעם אחת ברמת המודול ליעילות.
        // פונקציה זו פשוט מעבירה את הקונטקסט לתבנית המוכנה.
        return profileFeedbackTemplate(context);
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
