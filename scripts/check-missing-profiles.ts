import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- בודק האם קיימים משתמשים פעילים ללא רשומת פרופיל ---');

  // 1. מציאת משתמשים שהם ACTIVE אבל אין להם פרופיל משויך
  const usersWithoutProfile = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        is: null, // זה הפילטר שבודק חוסר בקשר (Relation)
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (usersWithoutProfile.length === 0) {
    console.log('✅ הכל תקין! לכל המשתמשים הפעילים יש רשומת פרופיל.');
    return;
  }

  console.log(`⚠️ נמצאו ${usersWithoutProfile.length} משתמשים פעילים ללא פרופיל:`);
  
  usersWithoutProfile.forEach((u, index) => {
    console.log(`${index + 1}. ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName} ${u.lastName}`);
  });

  console.log('\n💡 המלצה: אם נמצאו משתמשים, כדאי למחוק אותם או להעביר אותם חזרה לסטטוס PENDING כדי שימלאו פרטים.');
}

main()
  .catch((e) => {
    console.error('שגיאה במהלך הבדיקה:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });