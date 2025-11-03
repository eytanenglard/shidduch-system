"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppAdapter = void 0;
// src/lib/engagement/adapters/whatsapp.adapter.ts
const twilio_1 = __importDefault(require("twilio"));
class WhatsAppAdapter {
    constructor() {
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
        else {
            this.client = null;
            console.warn('[WhatsAppAdapter] Twilio is not configured.');
        }
    }
    canSend(recipient) {
        return !!(this.client && recipient.phone && recipient.phone.startsWith('+'));
    }
    async send(recipient, templateSid, contentVariables) {
        if (!this.canSend(recipient) || !recipient.phone)
            return false;
        try {
            await this.client.messages.create({
                contentSid: templateSid,
                contentVariables: JSON.stringify(contentVariables),
                from: `whatsapp:${this.fromNumber}`,
                to: `whatsapp:${recipient.phone}`,
            });
            console.log(`[WhatsAppAdapter] Message sent to ${recipient.phone}`);
            return true;
        }
        catch (error) {
            console.error(`[WhatsAppAdapter] Failed to send message to ${recipient.phone}:`, error.message);
            return false;
        }
    }
}
exports.WhatsAppAdapter = WhatsAppAdapter;
