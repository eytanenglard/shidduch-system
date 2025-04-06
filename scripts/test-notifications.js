// test-notifications.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ייבוא ידני של הדברים שאנחנו צריכים
const { NotificationService } = require('../src/app/components/matchmaker/suggestions/services/notification/NotificationService');
const { EmailAdapter } = require('../src/app/components/matchmaker/suggestions/services/notification/adapters/EmailAdapter');
const { WhatsAppAdapter } = require('../src/app/components/matchmaker/suggestions/services/notification/adapters/WhatsAppAdapter');

// אתחול שירות ההתראות ידנית
const notificationService = NotificationService.getInstance();
notificationService.registerAdapter(EmailAdapter.getInstance());
notificationService.registerAdapter(WhatsAppAdapter.getInstance());

async function testNotifications() {
  try {
    console.log('מתחיל בדיקת שליחת התראות...');
    
    const result = await notificationService.sendNotification(
      {
        email: 'your-email@example.com', // שנה לאימייל שלך
        phone: '+972501234567', // שנה למספר הטלפון שלך בפורמט בינלאומי
        name: 'שם המקבל'
      },
      {
        subject: 'הודעת בדיקה',
        body: 'זוהי הודעת בדיקה לשירות ההתראות החדש.',
        htmlBody: '<div dir="rtl"><h2>הודעת בדיקה</h2><p>זוהי הודעת בדיקה <strong>לשירות ההתראות החדש</strong>.</p></div>'
      },
      { channels: ['email', 'whatsapp'] }
    );

    console.log('תוצאות שליחת ההודעה:', result);
  } catch (error) {
    console.error('שגיאה בזמן בדיקת שליחת התראות:', error);
  }
}

// הפעלת הבדיקה
testNotifications();