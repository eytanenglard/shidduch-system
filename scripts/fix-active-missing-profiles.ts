import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- מתחיל תיקון משתמשים פעילים ללא פרופיל ---');

  // 1. איתור ה-IDs של המשתמשים הבעייתיים
  const usersToFix = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        is: null,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (usersToFix.length === 0) {
    console.log('✅ לא נמצאו משתמשים לתיקון.');
    return;
  }

  console.log(`נמצאו ${usersToFix.length} משתמשים. מחזיר אותם לשלב מילוי פרופיל...`);

  // 2. עדכון המשתמשים
  // אנחנו משנים להם את הסטטוס ל-PENDING_PHONE_VERIFICATION (השלב שלפני אקטיב)
  // ומסמנים שהפרופיל לא הושלם.
  const result = await prisma.user.updateMany({
    where: {
      id: {
        in: usersToFix.map((u) => u.id),
      },
    },
    data: {
      status: UserStatus.PENDING_PHONE_VERIFICATION, 
      isProfileComplete: false, // זה יגרום למערכת להפנות אותם לדף מילוי פרטים
      isPhoneVerified: false,   // נדרוש מהם גם אימות טלפון בסוף התהליך ליתר ביטחון
      updatedAt: new Date(),
    },
  });

  console.log(`✅ התיקון בוצע בהצלחה ל-${result.count} משתמשים.`);
  console.log('מעכשיו, כשהם יתחברו, הם יתבקשו למלא את פרטיהם מחדש בצורה מסודרת.');
}

main()
  .catch((e) => {
    console.error('שגיאה במהלך התיקון:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });