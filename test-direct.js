// test-direct.js
require('dotenv').config();

// ייבוא ישיר של מודולים כבודדים ללא תלות ב-next-auth
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// פונקציית בדיקה לשליחת אימייל
async function testEmail() {
  console.log('בודק שליחת אימייל...');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const result = await transporter.sendMail({
      from: `מערכת השידוכים <${process.env.GMAIL_USER}>`,
      to: 'eytanenglard@gmail.com', // או כל כתובת אימייל אחרת לבדיקה
      subject: 'הודעת בדיקה',
      text: 'זוהי הודעת בדיקה לשירות האימייל.',
      html: '<div dir="rtl"><h2>הודעת בדיקה</h2><p>זוהי הודעת בדיקה <strong>לשירות האימייל</strong>.</p></div>'
    });
    
    console.log('אימייל נשלח בהצלחה:', {
      messageId: result.messageId,
      response: result.response
    });
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת אימייל:', error);
    return false;
  }
}

// פונקציית בדיקה לשליחת הודעת וואטסאפ
// תיקון פונקציית בדיקת וואטסאפ
async function testWhatsApp() {
    console.log('בודק שליחת וואטסאפ...');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.error('חסרים פרטי Twilio בהגדרות הסביבה!');
      return false;
    }
    
    const client = twilio(accountSid, authToken);
    
    try {
      // החלף את המספר להלן במספר שלך בפורמט בינלאומי
      const toNumber = '+972543210040'; // שנה למספר שלך
      
      // שים לב לפורמט הנכון - אם המספר כבר מתחיל ב-whatsapp: אל תוסיף אותו שוב
      const fromWhatsApp = fromNumber.startsWith('whatsapp:') 
        ? fromNumber 
        : `whatsapp:${fromNumber}`;
      
      const toWhatsApp = `whatsapp:${toNumber}`;
      
      console.log(`מנסה לשלוח מ: ${fromWhatsApp} אל: ${toWhatsApp}`);
      
      const message = await client.messages.create({
        body: 'הודעת וואטסאפ לבדיקה מהמערכת',
        from: fromWhatsApp,
        to: toWhatsApp
      });
      
      console.log('הודעת וואטסאפ נשלחה בהצלחה:', {
        sid: message.sid,
        status: message.status
      });
      return true;
    } catch (error) {
      console.error('שגיאה בשליחת הודעת וואטסאפ:', error);
      return false;
    }
  }
// הרצת הבדיקות
async function runTests() {
  console.log('מתחיל בדיקות...');
  console.log('משתני סביבה הוגדרו:', {
    GMAIL_USER: process.env.GMAIL_USER ? 'מוגדר' : 'חסר',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'מוגדר' : 'חסר',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'מוגדר' : 'חסר',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'מוגדר' : 'חסר',
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? 'מוגדר' : 'חסר',
  });
  
  const emailResult = await testEmail();
  const whatsappResult = await testWhatsApp();
  
  console.log('\nסיכום בדיקות:');
  console.log(`- אימייל: ${emailResult ? '✅ הצליח' : '❌ נכשל'}`);
  console.log(`- וואטסאפ: ${whatsappResult ? '✅ הצליח' : '❌ נכשל'}`);
}

runTests();