require('dotenv').config(); // טעינת משתני סביבה מקובץ .env
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

const prisma = new PrismaClient();

// בדיקת משתני הסביבה לפני הגדרת Cloudinary
console.log('Cloudinary Environment Variables:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// הגדרות Cloudinary ממשתני סביבה
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getPixabayImage() {
  const pixabayApiKey = '23943016-8b833db2271dc5cce6a33c6e2'; // מפתח ה-API החדש שלך מ-Pixabay
  const queries = ['portrait', 'face', 'headshot', 'person casual']; // נושאים צנועים ופשוטים
  const randomQuery = queries[Math.floor(Math.random() * queries.length)]; // בחירה אקראית של נושא
  const randomPage = Math.floor(Math.random() * 5) + 1; // דף אקראי בין 1 ל-5

  try {
    const startTime = Date.now();
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: pixabayApiKey,
        q: randomQuery,
        image_type: 'photo',
        category: 'people',
        per_page: 3, // ערך מינימלי תקין לפי התיעוד של Pixabay (3-200)
        page: randomPage, // דף אקראי להגברת המגוון
        orientation: 'vertical', // התמקדות בפורטרטים אנכיים (מתאים לפנים)
        safesearch: true, // הפעלת חיפוש בטוח (safe search) להגברת הצניעות
      },
    });
    const endTime = Date.now();
    console.log(`Pixabay API request for query '${randomQuery}' took ${endTime - startTime}ms`);
    if (!response.data.hits || response.data.hits.length === 0) {
      throw new Error('No images found in Pixabay response');
    }
    // בחירה אקראית של תמונה מתוך התוצאות (עד 3 תמונות)
    const randomImage = response.data.hits[Math.floor(Math.random() * response.data.hits.length)];
    return randomImage.webformatURL; // קישור לתמונה (כפי שמופיע בדוגמה שלך)
  } catch (error) {
    console.error('Error fetching image from Pixabay:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function uploadFakeImages(count) {
  const imageData = [];
  for (let i = 0; i < count; i++) {
    try {
      console.log(`Fetching image ${i + 1} of ${count}...`);
      const imageUrl = await getPixabayImage();
      console.log(`Uploading image ${i + 1} to Cloudinary...`);
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'fake_users', // תיקייה ב-Cloudinary לארגון התמונות
        public_id: `fake_user_${faker.string.uuid()}`, // מזהה ייחודי
        width: 200, // גודל קבוע לפרופילים (פנים בלבד)
        height: 200, // גודל קבוע לפרופילים (פנים בלבד)
        crop: 'fill', // חיתוך למילוי גודל מסוים
      });
      imageData.push({
        publicId: result.public_id,
        url: result.secure_url,
      });
      console.log(`Image ${i + 1} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
      throw error;
    }
  }
  return imageData;
}

async function updateExistingUsers() {
  try {
    console.log('Starting to update existing users...');

    // קבלת כל המשתמשים הקיימים
    const users = await prisma.user.findMany();

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // העלאת תמונות פיקטיביות עבור כל המשתמשים
    const fakeImages = await uploadFakeImages(users.length);

    // עדכון כל משתמש
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const image = fakeImages[i];

      console.log(`Updating user ${i + 1} of ${users.length} (ID: ${user.id})...`);

      // מחיקת כל התמונות הקיימות של המשתמש ב-UserImage לפני הוספת חדשות
      await prisma.userImage.deleteMany({
        where: { userId: user.id },
      });

      await prisma.user.update({
        where: { id: user.id }, // עדכון לפי ה-ID של המשתמש
        data: {
          status: 'ACTIVE',
          role: 'CANDIDATE',
          isVerified: true,
          images: {
            create: [
              {
                url: image.url,
                isMain: true,
                cloudinaryPublicId: image.publicId,
              },
            ],
          },
        },
      });

      console.log(`Updated user: ${user.email}`);
    }

    console.log('Users updated successfully!');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers();