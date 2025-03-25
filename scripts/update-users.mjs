// עדכון תמונות משתמשים ויצירת משתמשים חדשים לפי מגדר
// יש לשמור קובץ זה עם סיומת .mjs

// ייבוא החבילות הנחוצות
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import { faker } from '@faker-js/faker';

// טעינת משתני סביבה מקובץ .env
dotenv.config();

// יצירת מופע של Prisma
const prisma = new PrismaClient();

// בדיקה שכל מפתחות ה-API נטענו כראוי
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('שגיאה: חסר מפתח API של Unsplash בקובץ .env');
  process.exit(1);
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('שגיאה: חסרים פרטי התחברות ל-Cloudinary בקובץ .env');
  process.exit(1);
}

// הגדרות Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// יצירת מופע של Unsplash API
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

/**
 * פונקציה לקבלת תמונה איכותית מ-Unsplash לפי מגדר ודתיות
 * @param {string} gender - המגדר (MALE או FEMALE)
 * @returns {Promise<string>} - כתובת URL של התמונה שנמצאה
 */
async function getUnsplashImage(gender) {
  try {
    // שאילתות מותאמות לפי מגדר ומראה דתי
    let queries = [];
    
    if (gender === 'MALE') {
      queries = [
        'jewish religious man', 
        'orthodox jewish man', 
        'religious man portrait', 
        'jewish man kippah',
        'jewish man traditional'
      ];
    } else {
      queries = [
        'religious jewish woman', 
        'jewish orthodox woman', 
        'modest woman dress', 
        'jewish woman portrait',
        'traditional jewish woman'
      ];
    }
    
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    console.log(`מחפש תמונת "${randomQuery}" ב-Unsplash עבור ${gender === 'MALE' ? 'גבר' : 'אישה'} דתי/ת...`);
    
    // חיפוש תמונות עם הגדרות מתקדמות
    const result = await unsplash.search.getPhotos({
      query: randomQuery,
      page: Math.floor(Math.random() * 5) + 1, // דף אקראי בין 1 ל-5
      perPage: 10, // כמות תוצאות לדף
      orientation: 'portrait', // תמונות לאורך (מתאים לתמונות פרופיל)
      contentFilter: 'high', // סינון תוכן לא הולם
    });
    
    if (!result.response || !result.response.results || result.response.results.length === 0) {
      throw new Error(`לא נמצאו תמונות בתשובה מ-Unsplash עבור ${gender === 'MALE' ? 'גבר' : 'אישה'} דתי/ת`);
    }
    
    // בחירה אקראית של תמונה מהתוצאות
    const randomIndex = Math.floor(Math.random() * result.response.results.length);
    const photo = result.response.results[randomIndex];
    
    console.log(`נמצאה תמונה: "${photo.description || photo.alt_description || 'בלי תיאור'}" מאת ${photo.user.name}`);
    
    // שימוש בגרסה הרגילה של התמונה (איזון טוב בין איכות לגודל קובץ)
    return photo.urls.regular;
  } catch (error) {
    console.error('שגיאה בקבלת תמונה מ-Unsplash:', error.message);
    throw error;
  }
}

/**
 * פונקציה להעלאת תמונות לפי מגדר
 * @param {string} gender - המגדר (MALE או FEMALE)
 * @param {number} count - מספר התמונות שיש להעלות
 * @returns {Promise<Array>} - מערך של נתוני התמונות שהועלו
 */
async function uploadReligiousImages(gender, count) {
  const imageData = [];
  
  console.log(`מתחיל העלאת ${count} תמונות עבור ${gender === 'MALE' ? 'גברים' : 'נשים'} דתיים/ות...`);
  
  for (let i = 0; i < count; i++) {
    try {
      console.log(`\nמעבד תמונה ${i + 1} מתוך ${count} עבור ${gender === 'MALE' ? 'גבר' : 'אישה'}...`);
      
      // קבלת תמונה מ-Unsplash לפי מגדר
      const imageUrl = await getUnsplashImage(gender);
      
      console.log(`מעלה תמונה ${i + 1} ל-Cloudinary...`);
      
      // העלאת התמונה ל-Cloudinary עם הגדרות משופרות
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'user_photos', // תיקייה מסודרת לתמונות משתמשים
        public_id: `${gender.toLowerCase()}_profile_${Date.now()}_${i}`, // מזהה ייחודי כולל מגדר
        width: 400, // גודל מוגדל לאיכות טובה יותר
        height: 400, 
        crop: 'fill',
        gravity: 'face', // מיקוד על פנים אם יש בתמונה
        quality: 'auto', // איכות אוטומטית לאיזון בין גודל לאיכות
        fetch_format: 'auto', // פורמט אוטומטי לאופטימיזציה
      });
      
      imageData.push({
        publicId: result.public_id,
        url: result.secure_url,
        gender: gender
      });
      
      console.log(`תמונה ${i + 1} הועלתה בהצלחה: ${result.secure_url}`);
      
      // השהייה קטנה כדי לא לעבור על מגבלות קצב של Unsplash API
      if (i < count - 1) {
        const delay = Math.floor(Math.random() * 500) + 500; // 500-1000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`שגיאה בעיבוד תמונה ${i + 1} עבור ${gender}:`, error);
      
      // החלטה האם לנסות שוב או להמשיך
      if (i >= count - 3) { // אם נשארו רק 3 תמונות או פחות, נמשיך בלעדיהן
        console.log(`דילוג על תמונה ${i + 1} ומעבר לבאה...`);
      } else {
        console.log(`מנסה שוב תמונה ${i + 1}...`);
        i--; // נסיון חוזר להעלות תמונה
      }
    }
  }
  
  console.log(`סיום העלאת ${imageData.length} תמונות בהצלחה עבור ${gender === 'MALE' ? 'גברים' : 'נשים'}!`);
  return imageData;
}

/**
 * יצירת נתונים אקראיים למשתמש חדש
 * @param {string} gender - המגדר (MALE או FEMALE)
 * @returns {Object} - האובייקט עם נתוני המשתמש
 */
function generateUserData(gender) {
  // שמות עבריים נפוצים
  const maleFirstNames = ['אברהם', 'יצחק', 'יעקב', 'משה', 'דוד', 'שלמה', 'יוסף', 'אהרון', 'נתנאל', 'אליהו', 
                         'בנימין', 'שמואל', 'מאיר', 'חיים', 'יהודה', 'דניאל', 'מנחם', 'אלעזר', 'שמעון', 'רפאל'];
  const femaleFirstNames = ['שרה', 'רבקה', 'רחל', 'לאה', 'חנה', 'אסתר', 'מרים', 'רות', 'נעמי', 'דינה', 
                           'יעל', 'תמר', 'אביגיל', 'מיכל', 'חוה', 'ציפורה', 'רחל', 'גילה', 'אפרת', 'שירה'];
  const lastNames = ['כהן', 'לוי', 'מזרחי', 'אברהמי', 'פרץ', 'ביטון', 'אוחנה', 'דהן', 'אזולאי', 'אלמוג', 
                    'בן ארי', 'גולדשטיין', 'פרידמן', 'רוזנברג', 'שפירא', 'וייס', 'ברקוביץ', 'קפלן', 'לביא', 'אבוטבול'];

  // בחירה אקראית של שם פרטי ושם משפחה
  const firstName = gender === 'MALE' 
    ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
    : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // יצירת אימייל
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'walla.co.il', 'hotmail.com'];
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;
  
  // יצירת מספר טלפון ישראלי
  const phonePrefix = ['050', '052', '053', '054', '055', '058'];
  const prefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
  const phoneNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
  
  return {
    email,
    password: faker.internet.password(12), // סיסמה אקראית חזקה
    firstName,
    lastName,
    phone: phoneNumber,
    status: 'ACTIVE',
    role: 'CANDIDATE',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      create: {
        gender: gender,
        birthDate: faker.date.between({ from: new Date('1980-01-01'), to: new Date('2000-12-31') }),
        nativeLanguage: 'עברית',
        additionalLanguages: ['אנגלית'],
        height: Math.floor(160 + Math.random() * 30), // גובה בין 160 ל-190 ס"מ
        maritalStatus: 'רווק/ה',
        occupation: ['סטודנט/ית', 'מורה', 'מהנדס/ת', 'רופא/ה', 'עורך/ת דין', 'יזם/ית'][Math.floor(Math.random() * 6)],
        education: ['תואר ראשון', 'תואר שני', 'תיכונית', 'ישיבה/סמינר'][Math.floor(Math.random() * 4)],
        city: ['ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'אשדוד', 'בני ברק', 'פתח תקווה'][Math.floor(Math.random() * 7)],
        religiousLevel: ['דתי/ה', 'חרדי/ת', 'מסורתי/ת', 'דתי/ה לייט'][Math.floor(Math.random() * 4)],
        about: `שלום, שמי ${firstName} ואני מחפש/ת בן/בת זוג ${gender === 'MALE' ? 'חרדית' : 'חרדי'} לבניית בית נאמן בישראל.`,
        preferredAgeMin: Math.floor(20 + Math.random() * 5),
        preferredAgeMax: Math.floor(30 + Math.random() * 10),
        availabilityStatus: 'AVAILABLE'
      }
    }
  };
}

/**
 * פונקציה ליצירת משתמשים חדשים
 * @param {number} count - מספר המשתמשים שיש ליצור
 * @param {Array} maleImages - מערך של תמונות גברים
 * @param {Array} femaleImages - מערך של תמונות נשים
 * @param {number} imagesPerUser - מספר התמונות לכל משתמש
 */
async function createNewUsers(count, maleImages, femaleImages, imagesPerUser = 3) {
  try {
    console.log(`מתחיל יצירת ${count} משתמשים חדשים עם ${imagesPerUser} תמונות לכל משתמש...`);
    
    // חלוקה שווה בין גברים ונשים
    const maleCount = Math.floor(count / 2);
    const femaleCount = count - maleCount;
    
    console.log(`יוצר ${maleCount} גברים ו-${femaleCount} נשים.`);
    
    // יצירת משתמשים גברים
    let maleImageIndex = 0;
    for (let i = 0; i < maleCount; i++) {
      try {
        // יצירת נתוני משתמש חדש
        const userData = generateUserData('MALE');
        console.log(`\nיוצר משתמש גבר ${i + 1}/${maleCount}: ${userData.firstName} ${userData.lastName}`);
        
        // הכנת מערך ליצירת תמונות
        const imageCreateArray = [];
        
        // הוספת מספר תמונות שהוגדר לכל משתמש
        for (let j = 0; j < imagesPerUser; j++) {
          // בדיקה שיש תמונה זמינה
          if (maleImageIndex >= maleImages.length) {
            console.log('אין מספיק תמונות גברים, חוזר לתמונה הראשונה');
            maleImageIndex = 0;
          }
          
          const image = maleImages[maleImageIndex++];
          
          imageCreateArray.push({
            url: image.url,
            // רק התמונה הראשונה היא ראשית
            isMain: j === 0,
            cloudinaryPublicId: image.publicId,
          });
        }
        
        // יצירת המשתמש עם מספר תמונות
        const user = await prisma.user.create({
          data: {
            ...userData,
            images: {
              create: imageCreateArray,
            },
          },
          include: {
            profile: true,
            images: true,
          },
        });
        
        console.log(`נוצר משתמש גבר: ${user.email} עם ID: ${user.id} ו-${user.images.length} תמונות`);
      } catch (error) {
        console.error(`שגיאה ביצירת משתמש גבר ${i + 1}:`, error);
      }
    }
    
    // יצירת משתמשים נשים
    let femaleImageIndex = 0;
    for (let i = 0; i < femaleCount; i++) {
      try {
        // יצירת נתוני משתמשת חדשה
        const userData = generateUserData('FEMALE');
        console.log(`\nיוצר משתמשת אישה ${i + 1}/${femaleCount}: ${userData.firstName} ${userData.lastName}`);
        
        // הכנת מערך ליצירת תמונות
        const imageCreateArray = [];
        
        // הוספת מספר תמונות שהוגדר לכל משתמשת
        for (let j = 0; j < imagesPerUser; j++) {
          // בדיקה שיש תמונה זמינה
          if (femaleImageIndex >= femaleImages.length) {
            console.log('אין מספיק תמונות נשים, חוזר לתמונה הראשונה');
            femaleImageIndex = 0;
          }
          
          const image = femaleImages[femaleImageIndex++];
          
          imageCreateArray.push({
            url: image.url,
            // רק התמונה הראשונה היא ראשית
            isMain: j === 0,
            cloudinaryPublicId: image.publicId,
          });
        }
        
        // יצירת המשתמשת עם מספר תמונות
        const user = await prisma.user.create({
          data: {
            ...userData,
            images: {
              create: imageCreateArray,
            },
          },
          include: {
            profile: true,
            images: true,
          },
        });
        
        console.log(`נוצרה משתמשת אישה: ${user.email} עם ID: ${user.id} ו-${user.images.length} תמונות`);
      } catch (error) {
        console.error(`שגיאה ביצירת משתמשת אישה ${i + 1}:`, error);
      }
    }
    
    console.log(`\nסיום יצירת ${count} משתמשים חדשים בהצלחה!`);
  } catch (error) {
    console.error('שגיאה ביצירת משתמשים חדשים:', error);
  }
}

/**
 * פונקציה ראשית לעדכון ויצירת משתמשים חדשים
 * @param {number} newUserCount - מספר המשתמשים החדשים שיש ליצור
 * @param {number} imagesPerUser - מספר התמונות לכל משתמש
 */
async function updateAndCreateUsers(newUserCount = 50, imagesPerUser = 3) {
  try {
    console.log(`=== מתחיל תהליך יצירת ${newUserCount} משתמשים חדשים עם ${imagesPerUser} תמונות לכל משתמש ===`);
    
    // חישוב כמה תמונות צריך (מספר המשתמשים * מספר התמונות לכל משתמש)
    const maleCount = Math.ceil(newUserCount / 2);
    const femaleCount = Math.ceil(newUserCount / 2);
    const maleImageCount = maleCount * imagesPerUser;
    const femaleImageCount = femaleCount * imagesPerUser;
    
    console.log(`סה"כ נדרשות ${maleImageCount} תמונות גברים ו-${femaleImageCount} תמונות נשים`);
    
    // העלאת תמונות גברים דתיים
    const maleImages = await uploadReligiousImages('MALE', maleImageCount);
    console.log(`הועלו ${maleImages.length} תמונות גברים דתיים`);
    
    // העלאת תמונות נשים דתיות
    const femaleImages = await uploadReligiousImages('FEMALE', femaleImageCount);
    console.log(`הועלו ${femaleImages.length} תמונות נשים דתיות`);
    
    // יצירת משתמשים חדשים עם מספר תמונות לכל משתמש
    await createNewUsers(newUserCount, maleImages, femaleImages, imagesPerUser);
    
    // יצירת דוגמאות של ערכים
    console.log('\n=== דוגמאות של ערכים שנוצרו ===');
    // דוגמה לגבר דתי
    const maleExample = {
      email: 'david.cohen123@gmail.com',
      firstName: 'דוד',
      lastName: 'כהן',
      phone: '0521234567',
      role: 'CANDIDATE',
      status: 'ACTIVE',
      isVerified: true,
      profile: {
        gender: 'MALE',
        birthDate: '1990-05-15',
        nativeLanguage: 'עברית',
        height: 178,
        religiousLevel: 'דתי',
        city: 'ירושלים',
        occupation: 'מהנדס תוכנה',
        about: 'שלום, שמי דוד ואני מחפש בת זוג חרדית לבניית בית נאמן בישראל.'
      },
      images: [
        {
          url: maleImages.length > 0 ? maleImages[0].url : 'https://example.com/male-image-1.jpg',
          isMain: true,
          cloudinaryPublicId: maleImages.length > 0 ? maleImages[0].publicId : 'male_image_1'
        },
        {
          url: maleImages.length > 1 ? maleImages[1].url : 'https://example.com/male-image-2.jpg',
          isMain: false,
          cloudinaryPublicId: maleImages.length > 1 ? maleImages[1].publicId : 'male_image_2'
        },
        {
          url: maleImages.length > 2 ? maleImages[2].url : 'https://example.com/male-image-3.jpg',
          isMain: false,
          cloudinaryPublicId: maleImages.length > 2 ? maleImages[2].publicId : 'male_image_3'
        }
      ]
    };
    
    // דוגמה לאישה דתית
    const femaleExample = {
      email: 'sarah.levi456@walla.co.il',
      firstName: 'שרה',
      lastName: 'לוי',
      phone: '0541234567',
      role: 'CANDIDATE',
      status: 'ACTIVE',
      isVerified: true,
      profile: {
        gender: 'FEMALE',
        birthDate: '1992-08-23',
        nativeLanguage: 'עברית',
        height: 165,
        religiousLevel: 'חרדית',
        city: 'בני ברק',
        occupation: 'מורה',
        about: 'שלום, שמי שרה ואני מחפשת בן זוג חרדי לבניית בית נאמן בישראל.'
      },
      images: [
        {
          url: femaleImages.length > 0 ? femaleImages[0].url : 'https://example.com/female-image-1.jpg',
          isMain: true,
          cloudinaryPublicId: femaleImages.length > 0 ? femaleImages[0].publicId : 'female_image_1'
        },
        {
          url: femaleImages.length > 1 ? femaleImages[1].url : 'https://example.com/female-image-2.jpg',
          isMain: false,
          cloudinaryPublicId: femaleImages.length > 1 ? femaleImages[1].publicId : 'female_image_2'
        },
        {
          url: femaleImages.length > 2 ? femaleImages[2].url : 'https://example.com/female-image-3.jpg',
          isMain: false,
          cloudinaryPublicId: femaleImages.length > 2 ? femaleImages[2].publicId : 'female_image_3'
        }
      ]
    };
    
    console.log('דוגמה לגבר דתי:');
    console.log(JSON.stringify(maleExample, null, 2));
    console.log('\nדוגמה לאישה דתית:');
    console.log(JSON.stringify(femaleExample, null, 2));
    
    // החזרת דוגמאות
    return { maleExample, femaleExample };
  } catch (error) {
    console.error('שגיאה לא צפויה בתהליך:', error);
  } finally {
    await prisma.$disconnect();
    console.log('החיבור לבסיס הנתונים נסגר.');
  }
}

// הפעלת הפונקציה הראשית עם 50 משתמשים חדשים ו-3 תמונות לכל משתמש
console.log('=== מתחיל תהליך עדכון ויצירת משתמשים ===');
console.log('שימוש ב-Unsplash API לקבלת תמונות דתיות לפי מגדר');
console.log('==========================================');

// ניתן לשנות את הפרמטר השני כדי להגדיר כמה תמונות יהיו לכל משתמש
const IMAGES_PER_USER = 3; // מספר התמונות לכל משתמש

updateAndCreateUsers(50, IMAGES_PER_USER)
  .then((examples) => {
    console.log('=== תהליך עדכון ויצירת משתמשים הושלם ===');
    console.log('דוגמאות לערכים שנוצרו:');
    console.log(examples);
  })
  .catch(err => {
    console.error('שגיאה לא צפויה בתהליך:', err);
  });