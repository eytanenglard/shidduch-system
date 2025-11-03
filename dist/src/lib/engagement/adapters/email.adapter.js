"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAdapter = void 0;
// src/lib/engagement/adapters/email.adapter.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailAdapter {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    canSend(recipient) {
        return !!recipient.email;
    }
    async send(recipient, content) {
        if (!this.canSend(recipient))
            return false;
        try {
            await this.transporter.sendMail({
                from: `NeshamaTech <${process.env.GMAIL_USER}>`,
                to: recipient.email,
                subject: content.subject,
                html: content.htmlBody || `<p>${content.body.replace(/\n/g, '<br>')}</p>`,
            });
            console.log(`[EmailAdapter] Email sent to ${recipient.email}`);
            return true;
        }
        catch (error) {
            console.error(`[EmailAdapter] Failed to send email to ${recipient.email}:`, error);
            return false;
        }
    }
}
exports.EmailAdapter = EmailAdapter;
