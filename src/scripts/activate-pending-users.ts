// scripts/activate-pending-users.ts
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Start: Activating users stuck in phone verification ---');

  // 1. מציאת כל המשתמשים שנתקעו בשלב זה
  const usersToUpdate = await prisma.user.findMany({
    where: {
      status: UserStatus.PENDING_PHONE_VERIFICATION,
    },
  });

  console.log(`Found ${usersToUpdate.length} users to activate.`);

  if (usersToUpdate.length === 0) {
    console.log('No users found in pending status.');
    return;
  }

  // 2. עדכון קבוצתי (Bulk Update)
  const result = await prisma.user.updateMany({
    where: {
      status: UserStatus.PENDING_PHONE_VERIFICATION,
    },
    data: {
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isProfileComplete: true, // אנחנו מניחים שהם כבר מילאו פרטים והגיעו לשלב האימות
      updatedAt: new Date(),
    },
  });

  console.log(`Successfully updated ${result.count} users.`);
  console.log('--- Finished ---');
}

main()
  .catch((e) => {
    console.error('Error during activation script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });