const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function generateFakeUsers(count = 100) {
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const phone = faker.phone.number('05########'); // פורמט ישראלי לדוגמה
    const password = faker.internet.password(); // סיסמה אקראית

    users.push({
      email,
      password,
      firstName,
      lastName,
      phone,
      createdAt: faker.date.past(),
      status: faker.helpers.arrayElement(['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED']),
      role: faker.helpers.arrayElement(['CANDIDATE', 'MATCHMAKER', 'ADMIN']),
      isVerified: faker.datatype.boolean(),
      profile: {
        create: {
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
          birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
          nativeLanguage: faker.helpers.arrayElement(['Hebrew', 'English', 'Arabic']),
          additionalLanguages: faker.helpers.arrayElements(['English', 'French', 'Spanish'], { min: 0, max: 2 }),
          height: faker.number.int({ min: 150, max: 200 }),
          maritalStatus: faker.helpers.arrayElement(['Single', 'Divorced', 'Widowed']),
          occupation: faker.person.jobTitle(),
          education: faker.helpers.arrayElement(['High School', 'Bachelor', 'Master', 'PhD']),
          city: faker.location.city(),
          religiousLevel: faker.helpers.arrayElement(['Secular', 'Traditional', 'Religious', 'Orthodox']),
          about: faker.lorem.sentence(),
          hobbies: faker.lorem.words(3),
          availabilityStatus: faker.helpers.arrayElement(['AVAILABLE', 'UNAVAILABLE', 'DATING']),
        },
      },
    });
  }

  return users;
}

async function seed() {
  try {
    console.log('Starting to seed fake users...');
    const fakeUsers = await generateFakeUsers(100);

    for (const user of fakeUsers) {
      await prisma.user.create({
        data: user,
      });
      console.log(`Created user: ${user.email}`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();