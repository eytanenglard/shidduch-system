// src/scripts/bypass-email-verification.ts
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 מתחיל תהליך אימות מייל גורף למשתמשים תקועים ---');

  // 1. ספירת המשתמשים שנמצאים בשלב אימות המייל
  const stuckCount = await prisma.user.count({
    where: {
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
      isVerified: false,
    },
  });

  console.log(`נמצאו ${stuckCount} משתמשים שממתינים לאימות מייל.`);

  if (stuckCount === 0) {
    console.log('לא נמצאו משתמשים לעדכון.');
    return;
  }

  // 2. עדכון גורף
  const result = await prisma.user.updateMany({
    where: {
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
      isVerified: false,
    },
    data: {
      isVerified: true,                        // אישור המייל
      status: UserStatus.PENDING_PHONE_VERIFICATION, // העברה לשלב הבא
      isProfileComplete: false,                // מוודא שהם יצטרכו למלא פרופיל
      updatedAt: new Date(),
    },
  });

  console.log(`✅ בוצע עדכון ל-${result.count} משתמשים.`);
  console.log('מעכשיו הם יכולים להתחבר למערכת ויועברו ישירות להשלמת פרופיל.');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה בסקריפט:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });