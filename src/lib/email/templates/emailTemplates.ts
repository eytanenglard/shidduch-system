// src/lib/email/templates/emailTemplates.ts

import { EmailDictionary } from '@/types/dictionary';
import { Locale } from '../../../../i18n-config';
import { ProfileFeedbackReport } from '@/lib/services/profileFeedbackService';
import Handlebars from 'handlebars';

// Register 'eq' helper for Handlebars
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// ============================================================================
// EMBEDDED TEMPLATES - במקום לקרוא מקבצים, התבניות מוטמעות ישירות בקוד
// ============================================================================

// Footer Template (was: shared/footer.hbs)
const footerTemplateSource = `
<table role="presentation" style="width: 100%; margin-top: 40px; border-top: 2px solid #e5e7eb;">
  <tr>
    <td style="padding: 30px 20px; text-align: center;">
      <!-- Logo -->
      <div style="margin-bottom: 20px;">
        <img 
          src="https://res.cloudinary.com/dmfxoi6g0/image/upload/v1764757309/ChatGPT_Image_Dec_3_2025_12_21_36_PM_qk8mjz.png" 
          alt="NeshamaTech Logo" 
          style="height: 50px; width: auto; display: inline-block;"
        />
      </div>
      
      <!-- Company Name with Gradient Effect -->
      <div style="margin-bottom: 15px;">
        <span style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #0891b2, #f97316, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          NeshamaTech
        </span>
      </div>
      
      <!-- Tagline -->
      <p style="color: #6b7280; font-size: 14px; margin: 10px 0 20px 0; font-style: italic;">
        {{#if (eq locale 'he')}}
          מחברים לבבות, בונים עתיד משותף
        {{else}}
          Connecting Hearts, Building Shared Futures
        {{/if}}
      </p>
      
      <!-- Contact Info -->
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px; display: inline-block;">
        <p style="margin: 5px 0; color: #4b5563; font-size: 13px;">
          <strong>{{#if (eq locale 'he')}}צור קשר:{{else}}Contact:{{/if}}</strong>
        </p>
        <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">
          📧 <a href="mailto:{{supportEmail}}" style="color: #06b6d4; text-decoration: none;">{{supportEmail}}</a>
        </p>
        <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">
          🌐 <a href="{{baseUrl}}" style="color: #06b6d4; text-decoration: none;">{{baseUrl}}</a>
        </p>
      </div>
      
      <!-- Social Links -->
      <div style="margin: 20px 0;">
        <a href="#" style="display: inline-block; margin: 0 10px; color: #06b6d4; text-decoration: none;">
          <span style="font-size: 24px;">📘</span>
        </a>
        <a href="#" style="display: inline-block; margin: 0 10px; color: #06b6d4; text-decoration: none;">
          <span style="font-size: 24px;">📷</span>
        </a>
        <a href="#" style="display: inline-block; margin: 0 10px; color: #06b6d4; text-decoration: none;">
          <span style="font-size: 24px;">🐦</span>
        </a>
      </div>
      
      <!-- Copyright -->
      <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 5px 0;">
        © {{currentYear}} NeshamaTech. 
        {{#if (eq locale 'he')}}
          כל הזכויות שמורות
        {{else}}
          All rights reserved
        {{/if}}
      </p>
      
      <!-- Legal Links -->
      <p style="color: #9ca3af; font-size: 11px; margin: 5px 0;">
        <a href="{{baseUrl}}/privacy" style="color: #6b7280; text-decoration: none; margin: 0 5px;">
          {{#if (eq locale 'he')}}מדיניות פרטיות{{else}}Privacy Policy{{/if}}
        </a> | 
        <a href="{{baseUrl}}/terms" style="color: #6b7280; text-decoration: none; margin: 0 5px;">
          {{#if (eq locale 'he')}}תנאי שימוש{{else}}Terms of Service{{/if}}
        </a>
      </p>
    </td>
  </tr>
</table>
`;

// Profile Feedback Template (was: profile-feedback.hbs)
const profileFeedbackTemplateSource = `
<!DOCTYPE html>
<html dir="{{#if (eq locale 'he')}}rtl{{else}}ltr{{/if}}" lang="{{locale}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{dict.title}}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            direction: {{#if (eq locale 'he')}}rtl{{else}}ltr{{/if}}; 
            text-align: {{#if (eq locale 'he')}}right{{else}}left{{/if}}; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
            color: #374151; 
        }
        
        .email-container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.08); 
            overflow: hidden; 
        }
        
        .email-header { 
            background: linear-gradient(135deg, #06b6d4, #0891b2); 
            color: #ffffff; 
            padding: 30px; 
            text-align: center; 
        }
        
        .email-header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 700; 
            letter-spacing: -0.5px;
        }
        
        .email-body { 
            padding: 30px; 
            font-size: 16px; 
        }
        
        .greeting {
            font-size: 20px;
            color: #1e293b;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .intro-text {
            font-size: 16px;
            color: #475569;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .progress-section {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border: 2px solid #bfdbfe;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .progress-title {
            color: #1e40af;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .progress-number {
            font-size: 48px;
            font-weight: 900;
            color: #06b6d4;
            margin: 10px 0;
        }
        
        .progress-bar-container {
            background-color: #e2e8f0;
            border-radius: 25px;
            height: 20px;
            margin: 20px 0;
            overflow: hidden;
            position: relative;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #06b6d4, #0891b2);
            height: 100%;
            border-radius: 25px;
            transition: width 1s ease-out;
            position: relative;
        }
        
        .progress-text {
            color: #64748b;
            font-size: 15px;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .ai-summary {
            background: linear-gradient(135deg, #fefce8, #fef3c7);
            border-{{#if (eq locale 'he')}}right{{else}}left{{/if}}: 5px solid #f59e0b;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
        }
        
        .ai-summary h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #b45309;
            font-size: 18px;
            font-weight: 700;
        }
        
        .ai-insight {
            background: rgba(255, 255, 255, 0.7);
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .ai-insight strong {
            color: #92400e;
            font-weight: 600;
        }
        
        .ai-disclaimer {
            font-size: 14px;
            color: #6b7280;
            font-style: italic;
            margin-top: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 6px;
        }
        
        .status-section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 22px;
            color: #1e293b;
            margin-bottom: 25px;
            font-weight: 700;
            border-bottom: 3px solid #e2e8f0;
            padding-bottom: 10px;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .status-card {
            border-radius: 12px;
            padding: 20px;
            border: 2px solid;
        }
        
        .completed-card {
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border-color: #22c55e;
        }
        
        .missing-card {
            background: linear-gradient(135deg, #fffbeb, #fef3c7);
            border-color: #f59e0b;
        }
        
        .card-title {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 700;
        }
        
        .completed-card .card-title {
            color: #15803d;
        }
        
        .missing-card .card-title {
            color: #b45309;
        }
        
        .status-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .status-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-icon {
            margin-{{#if (eq locale 'he')}}left{{else}}right{{/if}}: 10px;
            font-size: 18px;
        }
        
        .questionnaire-section {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 2px solid #0ea5e9;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .questionnaire-title {
            color: #0369a1;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .questionnaire-icon {
            margin-{{#if (eq locale 'he')}}left{{else}}right{{/if}}: 10px;
            font-size: 24px;
        }
        
        .question-summary {
            background: rgba(255, 255, 255, 0.8);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            text-align: center;
            font-weight: 600;
            color: #0369a1;
            font-size: 16px;
        }
        
        .question-details {
            color: #0369a1;
            text-align: center;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .cta-section {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            border: 2px solid #94a3b8;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-title {
            font-size: 24px;
            color: #1e293b;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .cta-text {
            color: #64748b;
            margin-bottom: 25px;
            font-size: 16px;
        }
        
        .cta-button {
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 18px;
            display: inline-block;
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
        }
        
        .footer {
            background-color: #f8fafc;
            padding: 25px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer a {
            color: #06b6d4;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .status-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .email-body {
                padding: 20px;
            }
            
            .progress-number {
                font-size: 36px;
            }
            
            .cta-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>{{dict.title}}</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">{{greeting}}</div>
            
            <div class="intro-text">
                {{#if isAutomated}}
                    {{dict.systemIntro}}
                {{else}}
                    {{dict.matchmakerIntro}}
                {{/if}}
            </div>

            <div class="progress-section">
                <div class="progress-title">{{dict.progressHeader}}</div>
                <div class="progress-number">{{report.completionPercentage}}%</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: {{report.completionPercentage}}%;"></div>
                </div>
                <div class="progress-text">
                    השקעת עד כה והגעת ל-<strong>{{report.completionPercentage}}% השלמה</strong>.<br>
                    כל הכבוד! עוד מאמץ קטן והפרופיל שלך יהיה מוכן למצוא את ההתאמה המושלמת.
                </div>
            </div>

            {{#if report.aiSummary}}
            <div class="ai-summary">
                <h3>{{dict.aiSummaryHeader}}</h3>
                
                <div class="ai-insight">
                    <strong>{{dict.aiSummary.personalityTitle}}:</strong><br>
                    "{{report.aiSummary.personality}}"
                </div>
                
                <div class="ai-insight">
                    <strong>{{dict.aiSummary.lookingForTitle}}:</strong><br>
                    "{{report.aiSummary.lookingFor}}"
                </div>
                
                <div class="ai-disclaimer">
                    זוהי רק טעימה מהתובנות שה-AI שלנו יכול להפיק מפרופיל מלא. ככל שתוסיף יותר מידע, כך נוכל לחדד יותר את ההתאמות עבורך.
                </div>
            </div>
            {{/if}}

            <div class="status-section">
                <h2 class="section-title">סטטוס הפרופיל שלך</h2>
                
                <div class="status-grid">
                    <div class="status-card completed-card">
                        <h4 class="card-title">כל הכבוד! מה שכבר השלמת:</h4>
                        <ul class="status-list">
                            {{#each report.completedProfileItems}}
                                <li class="status-item">
                                    <span class="status-icon">✅</span>
                                    {{this}}
                                </li>
                            {{/each}}
                        </ul>
                    </div>
                    
                    <div class="status-card missing-card">
                        <h4 class="card-title">השלב הבא: מה חסר</h4>
                        <ul class="status-list">
                             {{#each report.missingProfileItems}}
                                <li class="status-item">
                                    <span class="status-icon">📝</span>
                                    {{this}}
                                </li>
                            {{/each}}
                        </ul>
                    </div>
                </div>
                
                {{#if report.missingQuestionnaireItems}}
                <div class="questionnaire-section">
                    <div class="questionnaire-title">
                        <span class="questionnaire-icon">📋</span>
                        שאלון המעמיק - הזדמנות זהב!
                    </div>
                    
                    <div class="question-summary">
                        יש לנו {{report.missingQuestionnaireItems.length}} שאלות מעמיקות שמחכות לך!<br>
                        הן יעזרו לנו להכיר אותך טוב יותר ולמצוא התאמות מדויקות.
                    </div>
                    
                    <p class="question-details">
                        השאלות מחולקות לעולמות: אישיות, ערכים, זוגיות, פרטנר ודת ומסורת
                    </p>
                </div>
                {{/if}}
            </div>

            <div class="cta-section">
                <h3 class="cta-title">{{dict.cta.title}}</h3>
                <p class="cta-text">השלמת הפרופיל מגדילה משמעותית את הסיכוי למצוא התאמה איכותית.</p>
                <a href="{{baseUrl}}/profile" class="cta-button">{{dict.cta.button}}</a>
            </div>

        </div>
        
        <div class="footer">
             <p>{{sharedDict.supportPrompt}} <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
             <p>{{sharedDict.rightsReserved}}</p>
        </div>
    </div>
</body>
</html>
`;

// Compile templates once at module load
const footerTemplate = Handlebars.compile(footerTemplateSource);
const profileFeedbackTemplate = Handlebars.compile(profileFeedbackTemplateSource);

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
  greeting?: string;
}

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
  dict: EmailDictionary['profileSummaryUpdate'] & { 
      introMatchmaker: string; 
      introSystem: string; 
  };
  firstName: string;
  matchmakerName?: string;
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
  profileSummaryUpdate: ProfileSummaryUpdateTemplateContext;
  'internal-feedback-notification': InternalFeedbackNotificationTemplateContext;
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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
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
    
    const fontFamily = isRtl 
        ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
        : "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .email-container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.05); 
            overflow: hidden; 
            font-family: ${fontFamily};
            color: #343a40; 
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
            line-height: 1.6;
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
        
        ul, ol {
            padding-${isRtl ? 'right' : 'left'}: 20px;
            padding-${isRtl ? 'left' : 'right'}: 0;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa;">
    <div class="email-container" dir="${direction}" style="direction: ${direction}; text-align: ${textAlign}; font-family: ${fontFamily}; max-width: 600px; margin: 20px auto; background-color: #ffffff;">
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


// --- מיפוי התבניות ---
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
  
profileSummaryUpdate: (context) => {
    const introText = context.matchmakerName
      ? context.dict.introMatchmaker.replace('{{matchmakerName}}', context.matchmakerName)
      : context.dict.introSystem;

    return createBaseEmailHtml(context.dict.title, `
      <p>${context.sharedDict.greeting.replace('{{name}}', context.name)}</p>
      <p>${introText}</p>
      <div class="highlight-box">
        <p><strong>${context.dict.highlight}</strong></p>
      </div>
      <p>${context.dict.encouragement}</p>
      <p style="text-align: center;">
        <a href="${context.dashboardUrl}" class="button">${context.dict.actionButton}</a>
      </p>
    `, context);
  },


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
      <p>${context.dict.guidanceNote}</p>
      <p>${context.sharedDict.closing.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    `, context);
  },

  availabilityCheck: (context) => createBaseEmailHtml(context.dict.title, `
    <p>${context.sharedDict.greeting.replace('{{name}}', context.recipientName)}</p>
    <p>${context.dict.intro.replace('{{matchmakerName}}', context.matchmakerName)}</p>
    <p>${context.dict.actionPrompt}</p>
    <p style="text-align: center;">
      <a href="${context.baseUrl}/messages" class="button">${context.dict.actionButton}</a>
    </p>
    <div class="highlight-box">
      <p><strong>${context.dict.deadline}</strong></p>
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
      <p><strong>${context.dict.securityNote}</strong></p>
    </div>
    <p style="text-align: center;">
      <a href="${context.loginUrl}" class="button">${context.dict.loginButton}</a>
    </p>
  `, context),

  'internal-feedback-notification': (context) => {
    let content = `
      <h1>New ${context.feedbackType} Feedback Received</h1>
      <table>
        <tr><th>Feedback ID</th><td>${context.feedbackId}</td></tr>
        <tr><th>User</th><td>${context.userIdentifier}</td></tr>
        <tr><th>Page URL</th><td><a href="${context.pageUrl}">${context.pageUrl}</a></td></tr>
        <tr><th>Content</th><td><pre>${context.content}</pre></td></tr>
      </table>
    `;
    
    if (context.screenshotUrl) {
      content += `
        <div class="screenshot">
          <h2>Screenshot</h2>
          <img src="${context.screenshotUrl}" alt="User Screenshot" />
        </div>
      `;
    }
    
    return createInternalBaseEmailHtml(`${context.feedbackType} Feedback - NeshamaTech`, content);
  },
};