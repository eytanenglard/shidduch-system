// lib/phoneVerificationService.ts
import twilio from 'twilio';
import crypto from 'crypto';

// ודא שמשתני הסביבה הנדרשים קיימים
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // מספר השולח שלך, למשל +14155238886
const otpTemplateSid = process.env.TWILIO_OTP_TEMPLATE_SID; // ה-SID של התבנית (כרגע של match_suggestion)

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
} else {
    console.error('[PhoneVerificationService] Error: Twilio Account SID or Auth Token not configured.');
}

// פונקציה ליצירת OTP
export function generateOtp(length: number = 6): string {
    const buffer = crypto.randomBytes(Math.ceil(length / 2));
    let code = buffer.toString('hex').slice(0, length);
    if (code.startsWith('0')) {
        code = '1' + code.slice(1);
    }
    while (code.length < length) {
        code = crypto.randomBytes(1).toString('hex').slice(0,1) + code;
    }
     code = code.replace(/[^0-9]/g, '');
     while (code.length < length) {
       code += Math.floor(Math.random() * 10).toString();
     }
     return code.slice(0, length);
}

// פונקציה לשליחת ה-OTP בוואטסאפ
export async function sendOtpViaWhatsApp(phoneNumber: string, otpCode: string, recipientName?: string): Promise<boolean> {
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

    // הוסף קידומת בינלאומית תקינה (לוודא שזה בפורמט E.164)
    // נניח שהמספרים מישראל ומתחילים ב-05. שנה בהתאם לפורמט שלך.
    let formattedPhoneNumber = phoneNumber;
    if (formattedPhoneNumber.startsWith('0')) {
        // נניח קידומת ישראל +972 למספרים שמתחילים ב-0
        formattedPhoneNumber = '+972' + formattedPhoneNumber.substring(1);
    } else if (!formattedPhoneNumber.startsWith('+')) {
        // נניח ברירת מחדל לישראל אם אין קידומת בכלל
        formattedPhoneNumber = '+972' + formattedPhoneNumber;
    }
    // ודא הסרת תווים לא מספריים מלבד ה-+ בהתחלה
    formattedPhoneNumber = '+' + formattedPhoneNumber.substring(1).replace(/[^0-9]/g, '');

    const recipientWhatsAppNumber = `whatsapp:${formattedPhoneNumber}`;
    // ודא ש-TWILIO_WHATSAPP_NUMBER אינו מכיל את הקידומת 'whatsapp:'
    const senderWhatsAppNumber = `whatsapp:${twilioWhatsAppNumber.startsWith('+') ? twilioWhatsAppNumber : '+' + twilioWhatsAppNumber}`;

    console.log(`[PhoneVerificationService] Attempting to send OTP via WhatsApp to ${recipientWhatsAppNumber}. Recipient: ${recipientName || 'N/A'}`);

    try {
        // הגדרת המשתנים שיוחלפו בתבנית
        // אנו שולחים את otpCode למשתנה {{1}}
        const contentVariables = JSON.stringify({
            '1': otpCode,
            // אם התבנית 'match_suggestion_notification' דורשת משתנים נוספים,
            // תצטרך להוסיף אותם כאן (עם ערכי ברירת מחדל במידת הצורך),
            // אחרת הקריאה ל-Twilio תיכשל עם שגיאה מתאימה.
            // לדוגמה, אם היא דורשת {{2}}:
            // '2': recipientName || 'User'
        });

        const message = await twilioClient.messages.create({
            contentSid: otpTemplateSid,
            contentVariables: contentVariables,
            to: recipientWhatsAppNumber,
            from: senderWhatsAppNumber,
        });

        console.log(`[PhoneVerificationService] WhatsApp OTP message sent successfully via Twilio. Message SID: ${message.sid}, Template SID used: ${otpTemplateSid}`);
        return true;
    } catch (error) {
        console.error('[PhoneVerificationService] Error: Failed to send WhatsApp message via Twilio.');
        if (error instanceof Error) {
            console.error(`  Message: ${error.message}`);
            // בדיקה אם המאפיינים הספציפיים של Twilio קיימים לפני הגישה אליהם
            if (typeof error === 'object' && error !== null) {
                if ('code' in error) {
                    console.error(`  Twilio Error Code: ${(error as { code: unknown }).code}`);
                }
                if ('status' in error) {
                    console.error(`  HTTP Status: ${(error as { status: unknown }).status}`);
                }
                if ('moreInfo' in error) {
                    console.error(`  More Info: ${(error as { moreInfo: unknown }).moreInfo}`);
                }
            }
        } else {
            // אם השגיאה אינה מטיפוס Error סטנדרטי
            console.error('  An unexpected error occurred:', error);
        }
        return false;
    }
}