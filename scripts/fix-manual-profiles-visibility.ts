const { PrismaClient, UserSource } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🔄 מתחיל תהליך תיקון נראות פרופילים (Manual Users) ---');

  // שלב 1: בדיקה מקדימה
  const countToUpdate = await prisma.profile.count({
    where: {
      isProfileVisible: false,
      user: {
        source: UserSource.MANUAL_ENTRY
      }
    }
  });

  console.log(`📊 נמצאו ${countToUpdate} פרופילים ידניים שמוגדרים כרגע כ-false.`);
  console.log('🚀 מבצע עדכון גורף לכל המשתמשים הידניים ל-True...');

  // שלב 2: ביצוע העדכון
  const result = await prisma.profile.updateMany({
    where: {
      user: {
        source: UserSource.MANUAL_ENTRY
      }
    },
    data: {
      isProfileVisible: true
    }
  });

  console.log('--------------------------------------------------');
  console.log(`✅ הסתיים בהצלחה!`);
  console.log(`📝 עודכנו סה"כ: ${result.count} פרופילים.`);
}

main()
  .catch((e) => {
    console.error('❌ שגיאה במהלך הריצה:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });