import { PrismaClient, UserStatus } from '@prisma/client';
import * as fs from 'fs'; // מייבאים את ספריית הקבצים

const prisma = new PrismaClient();

async function main() {
  console.log('--- 📋 מתחיל עיבוד נתונים... ---');

  const users = await prisma.user.findMany({
    where: {
      role: 'CANDIDATE',
      OR: [
        { isVerified: false },
        { isPhoneVerified: false },
        { isProfileComplete: false },
        { status: { not: UserStatus.ACTIVE } }
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
      createdAt: true
    }
  });

  if (users.length === 0) {
    console.log('✅ כל המשתמשים השלימו את ההרשמה! לא נוצר קובץ.');
    return;
  }

  // הכנת הכותרות לקובץ ה-CSV
  const headers = ['Email', 'First Name', 'Last Name', 'Stuck At Stage', 'Created At'];
  
  // המרת המשתמשים לשורות ב-CSV
  const rows = users.map(u => {
    // זיהוי השלב בו המשתמש נתקע
    let stage = 'Unknown';
    if (!u.isVerified) stage = 'Email Verification';
    else if (!u.isProfileComplete) stage = 'Profile Completion';
    else if (!u.isPhoneVerified) stage = 'WhatsApp Verification';
    else if (u.status !== UserStatus.ACTIVE) stage = `Status: ${u.status}`;

    // ניקוי פסיקים מהשמות כדי לא לשבור את ה-CSV
    const cleanFirst = (u.firstName || '').replace(/,/g, ' ');
    const cleanLast = (u.lastName || '').replace(/,/g, ' ');

    return `${u.email},${cleanFirst},${cleanLast},${stage},${u.createdAt.toISOString()}`;
  });

  // חיבור הכל לטקסט אחד
  // \uFEFF - זה תו מיוחד שגורם לאקסל להבין שמדובר בעברית/יוניקוד
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  // שמירה לקובץ
  const fileName = 'incomplete_users.csv';
  fs.writeFileSync(fileName, csvContent);

  console.log(`\n✅ הקובץ נוצר בהצלחה: ${fileName}`);
  console.log(`נמצאו ${users.length} משתמשים שלא סיימו הרשמה.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());