// src/scripts/create-missing-profiles.ts
import { PrismaClient, UserStatus, Gender, AvailabilityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🛠️ תהליך יצירת פרופילים זמניים (מוגזמים) למשתמשים מאומתים ---');

  // 1. איתור משתמשים שיש להם טלפון מאומת אבל אין להם רשומת פרופיל
  const usersToFix = await prisma.user.findMany({
    where: {
      isPhoneVerified: true,
      profile: {
        is: null,
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    },
  });

  if (usersToFix.length === 0) {
    console.log('✅ לא נמצאו משתמשים מאומתים ללא פרופיל.');
    return;
  }

  console.log(`נמצאו ${usersToFix.length} משתמשים. יוצר פרופילים "מוגזמים" כדי שתבחין בהם...`);

  let count = 0;
  for (const user of usersToFix) {
    try {
      await prisma.$transaction([
        // יצירת הפרופיל עם ערכים מוגזמים לזיהוי קל
        prisma.profile.create({
          data: {
            userId: user.id,
            gender: Gender.MALE,           // ברירת מחדל
            birthDate: new Date('1900-01-01'), // גיל 125 - זיהוי מיידי!
            height: 100,                   // גובה 100 ס"מ - זיהוי מיידי!
            maritalStatus: "זמני - דורש עדכון",
            religiousLevel: "זמני - דורש עדכון",
            occupation: "נא לעדכן ידנית",
            about: "⚠️ פרופיל זה נוצר אוטומטית כתיקון נתונים. נא ליצור קשר עם המשתמש לעדכון פרטים.",
            availabilityStatus: AvailabilityStatus.AVAILABLE,
            isProfileVisible: true,
          },
        }),
        // סימון המשתמש כפעיל ומושלם כדי שהמערכת לא תעצור אותו
        prisma.user.update({
          where: { id: user.id },
          data: {
            status: UserStatus.ACTIVE,
            isProfileComplete: true, // "משחרר" אותו לשימוש מלא באתר
            updatedAt: new Date(),
          },
        }),
      ]);
      count++;
      console.log(`✅ תוקן: ${user.firstName} ${user.lastName} (${user.email})`);
    } catch (err) {
      console.error(`❌ שגיאה בתיקון משתמש ${user.email}:`, err);
    }
  }

  console.log(`\nסיכום: שוחררו ${count} משתמשים לשימוש מלא באתר.`);
  console.log('חפש בדשבורד משתמשים שנולדו ב-1900 כדי למצוא אותם.');
}

main()
  .catch((e) => {
    console.error('שגיאה כללית:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });