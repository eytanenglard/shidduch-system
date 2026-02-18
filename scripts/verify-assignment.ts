// scripts/verify-assignment.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true }
  });

  const assignedCount = await prisma.user.count({
    where: { 
      role: 'CANDIDATE',
      assignedMatchmakerId: admin?.id 
    }
  });

  const unassignedCount = await prisma.user.count({
    where: { 
      role: 'CANDIDATE',
      assignedMatchmakerId: null 
    }
  });

  console.log(`\n📊 דוח שיוך שדכנים:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 אדמין ראשי: ${admin?.email}`);
  console.log(`✅ מועמדים משויכים: ${assignedCount}`);
  console.log(`⚠️  מועמדים לא משויכים: ${unassignedCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());