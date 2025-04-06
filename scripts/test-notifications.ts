import { NextResponse } from "next/server";
import { initNotificationService } from "@/app/components/matchmaker/suggestions/services/notification/initNotifications";

// שליחת התראת בדיקה
export async function GET() {
  try {
    const notification = initNotificationService();
    
    const result = await notification.sendNotification(
      {
        email: 'eytanenglard@gmail.com', // שנה לאימייל שלך
        phone: '+972543210040', // שנה למספר הטלפון שלך בפורמט בינלאומי
        name: 'שם המקבל'
      },
      {
        subject: 'הודעת בדיקה',
        body: 'זוהי הודעת בדיקה לשירות ההתראות החדש.',
        htmlBody: '<div dir="rtl"><h2>הודעת בדיקה</h2><p>זוהי הודעת בדיקה <strong>לשירות ההתראות החדש</strong>.</p></div>'
      },
      { channels: ['email', 'whatsapp'] }
    );

    return NextResponse.json({
      success: true,
      message: "בדיקת שליחת התראות הושלמה בהצלחה",
      result
    });
  } catch (error) {
    console.error('שגיאה בזמן בדיקת שליחת התראות:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "שגיאה לא ידועה"
    }, { status: 500 });
  }
}