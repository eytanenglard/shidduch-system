"use strict";
// src/lib/engagement/emailService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 📧 שירות מיילים משופר עם תמיכה בתבניות Handlebars ותמיכה דו-לשונית
 */
// ✅ רישום Handlebars Helpers
handlebars_1.default.registerHelper('eq', function (a, b) {
    return a === b;
});
handlebars_1.default.registerHelper('getDir', function (locale) {
    return locale === 'he' ? 'rtl' : 'ltr';
});
class EmailService {
    constructor() {
        this.templatesCache = new Map();
        this.transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        this.transporter.verify((error) => {
            if (error) {
                console.error('❌ Email service initialization failed:', error);
            }
            else {
                console.log('✅ Email service ready');
            }
        });
    }
    loadTemplate(templateName) {
        if (this.templatesCache.has(templateName)) {
            return this.templatesCache.get(templateName);
        }
        const templatePath = path_1.default.join(process.cwd(), 'src', 'lib', 'engagement', 'templates', 'email', `${templateName}.hbs`);
        if (!fs_1.default.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateName} at ${templatePath}`);
        }
        const source = fs_1.default.readFileSync(templatePath, 'utf-8');
        const template = handlebars_1.default.compile(source);
        this.templatesCache.set(templateName, template);
        return template;
    }
    async sendTemplateEmail(data) {
        try {
            const enhancedContext = Object.assign(Object.assign({}, data.context), { baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', currentYear: new Date().getFullYear(), locale: data.locale || 'he' });
            const template = this.loadTemplate(data.templateName);
            const htmlContent = template(enhancedContext);
            const info = await this.transporter.sendMail({
                from: `NeshamaTech <${process.env.GMAIL_USER}>`,
                to: data.to,
                subject: data.subject,
                html: htmlContent,
            });
            console.log(`✅ Email sent to ${data.to} | Template: ${data.templateName} | Lang: ${enhancedContext.locale} | ID: ${info.messageId}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to send email to ${data.to}:`, error);
            return false;
        }
    }
    async sendOnboardingDay1(user) {
        return this.sendTemplateEmail({
            to: user.email,
            subject: user.locale === 'he'
                ? `${user.firstName}, ברוך הבא ל-NeshamaTech! 🎉`
                : `Welcome to NeshamaTech, ${user.firstName}! 🎉`,
            templateName: 'onboardingDay1',
            context: Object.assign({ firstName: user.firstName }, user.completionData),
            locale: user.locale,
        });
    }
    async sendProgressUpdate(user) {
        return this.sendTemplateEmail({
            to: user.email,
            subject: user.locale === 'he'
                ? `${user.firstName}, איך מתקדמים? 📊`
                : `How's it going, ${user.firstName}? 📊`,
            templateName: 'progressUpdate',
            context: Object.assign({ firstName: user.firstName }, user.progressData),
            locale: user.locale,
        });
    }
    async sendAlmostDone(user) {
        return this.sendTemplateEmail({
            to: user.email,
            subject: user.locale === 'he'
                ? `${user.firstName}, את/ה כמעט שם! 🎊`
                : `You're almost there, ${user.firstName}! 🎊`,
            templateName: 'almostDone',
            context: Object.assign({ firstName: user.firstName }, user.celebrationData),
            locale: user.locale,
        });
    }
    async sendCustomEmail(to, subject, templateName, context, locale = 'he') {
        return this.sendTemplateEmail({
            to,
            subject,
            templateName,
            context,
            locale,
        });
    }
    clearTemplateCache() {
        this.templatesCache.clear();
        console.log('📦 Template cache cleared');
    }
}
exports.emailService = new EmailService();
exports.default = exports.emailService;
