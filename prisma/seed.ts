// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // כאן ניתן להוסיף בעתיד קוד לאכלוס הדאטהבייס.
  // כרגע, נשאיר את זה ריק כדי רק למנוע את השגיאה.
  console.log('Seeding script ran, but no data was seeded.');
}

main()
  .catch((e) => {
    console.error('An error occurred while attempting to seed the database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  });