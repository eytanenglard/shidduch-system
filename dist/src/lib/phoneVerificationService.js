"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.sendOtpViaWhatsApp = sendOtpViaWhatsApp;
// lib/phoneVerificationService.ts
const twilio_1 = __importDefault(require("twilio"));
const crypto_1 = __importDefault(require("crypto"));
// ודא שמשתני הסביבה הנדרשים קיימים
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // מספר השולח שלך, למשל +14155238886
const otpTemplateSid = process.env.TWILIO_OTP_TEMPLATE_SID; // ה-SID של התבנית (כרגע של match_suggestion)
let twilioClient = null;
if (accountSid && authToken) {
    twilioClient = (0, twilio_1.default)(accountSid, authToken);
}
else {
    console.error('[PhoneVerificationService] Error: Twilio Account SID or Auth Token not configured.');
}
// פונקציה ליצירת OTP
function generateOtp(length = 6) {
    const buffer = crypto_1.default.randomBytes(Math.ceil(length / 2));
    let code = buffer.toString('hex').slice(0, length);
    if (code.startsWith('0')) {
        code = '1' + code.slice(1);
    }
    while (code.length < length) {
        code = crypto_1.default.randomBytes(1).toString('hex').slice(0, 1) + code;
    }
    code = code.replace(/[^0-9]/g, '');
    while (code.length < length) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code.slice(0, length);
}
// פונקציה לשליחת ה-OTP בוואטסאפ
async function sendOtpViaWhatsApp(phoneNumber, otpCode, recipientName) {
    if (!twilioClient) {
        console.error('[PhoneVerificationService] Error: Twilio client not initialized.');
        return false;
    }
    if (!twilioWhatsAppNumber) {
        console.error('[PhoneVerificationService] Error: Twilio WhatsApp sender number (TWILIO_WHATSAPP_NUMBER) is not configured.');
        return false;
    }
    if (!otpTemplateSid) {
        console.error('[PhoneVerificationService] Error: WhatsApp OTP Template SID (TWILIO_OTP_TEMPLATE_SID) is not configured. Cannot send templated message.');
        return false;
    }
    // --- התיקון המרכזי ---
    // אנו מניחים שה-phoneNumber כבר מגיע בפורמט E.164 מלא (למשל +14155552671)
    // ולכן מסירים את כל הלוגיקה שניסתה לנחש את הקידומת.
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
        console.error(`[PhoneVerificationService] Error: Invalid phone number format. Expected E.164 format (e.g., +14155552671). Received: ${phoneNumber}`);
        return false;
    }
    const recipientWhatsAppNumber = `whatsapp:${phoneNumber}`;
    const senderWhatsAppNumber = `whatsapp:${twilioWhatsAppNumber}`;
    console.log(`[PhoneVerificationService] Attempting to send OTP via WhatsApp to ${recipientWhatsAppNumber}. Recipient: ${recipientName || 'N/A'}`);
    try {
        const contentVariables = JSON.stringify({
            '1': otpCode,
            // '2': recipientName || 'User' // Add if your template requires it
        });
        const message = await twilioClient.messages.create({
            contentSid: otpTemplateSid,
            contentVariables: contentVariables,
            to: recipientWhatsAppNumber,
            from: senderWhatsAppNumber,
        });
        console.log(`[PhoneVerificationService] WhatsApp OTP message sent successfully. SID: ${message.sid}`);
        return true;
    }
    catch (error) {
        console.error('[PhoneVerificationService] Error: Failed to send WhatsApp message via Twilio.');
        if (error instanceof Error) {
            console.error(`  Message: ${error.message}`);
            // בדיקה אם המאפיינים הספציפיים של Twilio קיימים לפני הגישה אליהם
            if (typeof error === 'object' && error !== null) {
                if ('code' in error) {
                    console.error(`  Twilio Error Code: ${error.code}`);
                }
                if ('status' in error) {
                    console.error(`  HTTP Status: ${error.status}`);
                }
                if ('moreInfo' in error) {
                    console.error(`  More Info: ${error.moreInfo}`);
                }
            }
        }
        else {
            // אם השגיאה אינה מטיפוס Error סטנדרטי
            console.error('  An unexpected error occurred:', error);
        }
        return false;
    }
}
