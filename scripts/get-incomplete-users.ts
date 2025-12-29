import { PrismaClient, UserStatus } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 📋 מתחיל עיבוד נתונים (כולל בדיקת תמונות - images)... ---');

  const users = await prisma.user.findMany({
    where: {
      role: 'CANDIDATE',
      OR: [
        { isVerified: false },            // לא אימת מייל
        { isPhoneVerified: false },       // לא אימת טלפון
        { isProfileComplete: false },     // לא סיים שאלון
        { status: { not: UserStatus.ACTIVE } }, // סטטוס לא פעיל
        { images: { none: {} } }          // <--- תוקן: שימוש ב-images לפי ה-Schema שלך
      ]
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      isVerified: true,
      isPhoneVerified: true,
      isProfileComplete: true,
      createdAt: true,
      _count: {
        select: { images: true }          // <--- תוקן: ספירה של images
      }
    }
  });

  if (users.length === 0) {
    console.log('✅ כולם השלימו הכל (כולל תמונות)! לא נוצר קובץ.');
    return;
  }

  // כותרות ל-CSV
  const headers = ['Email', 'First Name', 'Last Name', 'Stuck At Stage', 'Image Count', 'Created At'];
  
  const rows = users.map(u => {
    let stage = 'Unknown';
    const imageCount = u._count.images; // <--- שימוש בשדה הנכון

    // סדר הבדיקות (המשפך):
    if (!u.isVerified) {
      stage = 'Email Verification';
    } else if (!u.isProfileComplete) {
      stage = 'Profile Questions';
    } else if (imageCount === 0) {
      stage = 'Missing Photos';    // <--- מי שסיים פרופיל אבל אין לו תמונות (images)
    } else if (!u.isPhoneVerified) {
      stage = 'WhatsApp Verification';
    } else if (u.status !== UserStatus.ACTIVE) {
      stage = `Status: ${u.status}`;
    }

    // ניקוי שמות מפסיקים למניעת שבירת ה-CSV
    const cleanFirst = (u.firstName || '').replace(/,/g, ' ');
    const cleanLast = (u.lastName || '').replace(/,/g, ' ');

    return `${u.email},${cleanFirst},${cleanLast},${stage},${imageCount},${u.createdAt.toISOString()}`;
  });

  // יצירת תוכן ה-CSV (עם BOM לעברית)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  const fileName = 'incomplete_users_final.csv';
  fs.writeFileSync(fileName, csvContent);

  console.log(`\n✅ הקובץ נוצר בהצלחה: ${fileName}`);
  console.log(`סה"כ משתמשים שלא סיימו תהליך: ${users.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());