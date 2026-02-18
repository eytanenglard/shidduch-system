import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "User" 
    SET "assignedMatchmakerId" = (
      SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1
    )
    WHERE role = 'CANDIDATE' 
    AND "assignedMatchmakerId" IS NULL;
  `;
  
  console.log(`✅ עודכנו ${result} מועמדים`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());