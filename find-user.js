import db from './src/lib/prisma.js';

async function findUser() {
  const user = await db.user.findUnique({
    where: { email: 'eytanenglard@gmail.com' },
    select: { 
      id: true, 
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      role: true
    }
  });

  console.log('משתמש שנמצא:');
  console.log(JSON.stringify(user, null, 2));

  await db.$disconnect();
}

findUser();