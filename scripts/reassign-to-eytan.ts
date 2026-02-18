// scripts/reassign-to-eytan.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // מצא את eytan
  const eytan = await prisma.user.findUnique({
    where: { email: 'eytanenglard@gmail.com' },
    select: { id: true, email: true, role: true }
  });

  if (!eytan) {
    console.log('❌ לא נמצא משתמש עם המייל eytanenglard@gmail.com');
    return;
  }

  console.log(`\n👤 נמצא: ${eytan.email} (${eytan.role})`);

  // עדכן את כל המועמדים
  const result = await prisma.$executeRaw`
    UPDATE "User" 
    SET "assignedMatchmakerId" = ${eytan.id}
    WHERE role = 'CANDIDATE';
  `;

  console.log(`✅ עודכנו ${result} מועמדים - כולם משויכים עכשיו ל-${eytan.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());