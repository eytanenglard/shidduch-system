import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- מתחיל תיקון דגלי אימות למשתמשים בסטטוס ACTIVE ---');

  // 1. מוצאים משתמשים שהם ACTIVE אבל חסר להם אימות טלפון או פרופיל
  const stuckUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      OR: [
        { isPhoneVerified: false },
        { isProfileComplete: false }
      ]
    },
    select: {
      id: true,
      email: true
    }
  });

  console.log(`נמצאו ${stuckUsers.length} משתמשים שזקוקים לתיקון דגלים.`);

  if (stuckUsers.length === 0) {
    console.log('לא נמצאו משתמשים לתיקון.');
    return;
  }

  // 2. עדכון הדגלים לכל מי שנמצא
  const result = await prisma.user.updateMany({
    where: {
      id: {
        in: stuckUsers.map(u => u.id)
      }
    },
    data: {
      isVerified: true,        // מוודא שאימות המייל עבר
      isPhoneVerified: true,   // "משחרר" את חסימת ה-WhatsApp
      isProfileComplete: true, // מוודא שלא יחזרו למסך ההרשמה
      updatedAt: new Date()
    }
  });

  console.log(`בוצע תיקון ל-${result.count} משתמשים.`);
  console.log('--- התהליך הסתיים בהצלחה ---');
}

main()
  .catch((e) => {
    console.error('שגיאה:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });