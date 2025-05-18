// Update user images and create new users by gender
// Save this file with .mjs extension

// Import required packages
import dotenv from 'dotenv';
import { PrismaClient, UserStatus, UserRole, Gender as PrismaGender, VerificationType, VerificationStatus, AvailabilityStatus } from '@prisma/client'; // Added Prisma Enums
import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import { faker } from '@faker-js/faker';

// Load environment variables from .env file
dotenv.config();

// Create Prisma instance
const prisma = new PrismaClient();

// Check that all API keys loaded properly
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('Error: Missing Unsplash API key in .env file');
  process.exit(1);
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Error: Missing Cloudinary credentials in .env file');
  process.exit(1);
}

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Unsplash API instance
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

/**
 * Function to get quality image from Unsplash by gender
 * @param {string} gender - Gender (MALE or FEMALE)
 * @returns {Promise<string>} - URL of the found image
 */
async function getUnsplashImage(gender) {
  try {
    let queries = [];
    if (gender === PrismaGender.MALE) { // Using Prisma enum
      queries = [
        'jewish religious man', 'orthodox jewish man', 'religious man portrait', 
        'jewish man kippah', 'jewish man traditional'
      ];
    } else {
      queries = [
        'religious jewish woman', 'jewish orthodox woman', 'modest woman dress', 
        'jewish woman portrait', 'traditional jewish woman'
      ];
    }
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    console.log(`Searching for "${randomQuery}" on Unsplash for religious ${gender === PrismaGender.MALE ? 'man' : 'woman'}...`);
    const result = await unsplash.search.getPhotos({
      query: randomQuery,
      page: Math.floor(Math.random() * 5) + 1,
      perPage: 10,
      orientation: 'portrait',
      contentFilter: 'high',
    });
    if (!result.response || !result.response.results || result.response.results.length === 0) {
      throw new Error(`No images found in Unsplash response for religious ${gender === PrismaGender.MALE ? 'man' : 'woman'}`);
    }
    const randomIndex = Math.floor(Math.random() * result.response.results.length);
    const photo = result.response.results[randomIndex];
    console.log(`Image found: "${photo.description || photo.alt_description || 'No description'}" by ${photo.user.name}`);
    return photo.urls.regular;
  } catch (error) {
    console.error('Error getting image from Unsplash:', error.message);
    throw error;
  }
}

/**
 * Function to upload images by gender
 * @param {PrismaGender} gender - Gender (MALE or FEMALE)
 * @param {number} count - Number of images to upload
 * @returns {Promise<Array>} - Array of uploaded image data
 */
async function uploadReligiousImages(gender, count) {
  const imageData = [];
  console.log(`Starting upload of ${count} images for religious ${gender === PrismaGender.MALE ? 'men' : 'women'}...`);
  for (let i = 0; i < count; i++) {
    try {
      console.log(`\nProcessing image ${i + 1} of ${count} for ${gender === PrismaGender.MALE ? 'man' : 'woman'}...`);
      const imageUrl = await getUnsplashImage(gender);
      console.log(`Uploading image ${i + 1} to Cloudinary...`);
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'user_photos',
        public_id: `${gender.toLowerCase()}_profile_${Date.now()}_${i}`,
        width: 400, height: 400, crop: 'fill', gravity: 'face',
        quality: 'auto', fetch_format: 'auto',
      });
      imageData.push({
        publicId: result.public_id,
        url: result.secure_url,
        gender: gender
      });
      console.log(`Image ${i + 1} uploaded successfully: ${result.secure_url}`);
      if (i < count - 1) {
        const delay = Math.floor(Math.random() * 500) + 500; // 500-1000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Error processing image ${i + 1} for ${gender}:`, error.message);
      // Simplified error handling for script: retry once or skip
      if (i > 0 && Math.random() > 0.5) { // Randomly decide to retry
        console.log(`Trying image ${i + 1} again...`);
        i--; 
      } else {
        console.log(`Skipping image ${i + 1} and moving to next...`);
      }
    }
  }
  console.log(`Finished uploading ${imageData.length} images successfully for ${gender === PrismaGender.MALE ? 'men' : 'women'}!`);
  return imageData;
}

/**
 * Generates a random Israeli phone number.
 * @returns {string} A random Israeli phone number.
 */
function generateIsraeliPhoneNumber() {
  const prefixes = ['050', '052', '053', '054', '055', '058', '051', '056']; // Added more prefixes
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${prefix}${number}`;
}


/**
 * Create random data for a new user
 * @param {PrismaGender} gender - Gender (MALE or FEMALE)
 * @returns {Object} - Object with user data for Prisma create
 */
function generateUserData(gender) {
  const maleFirstNames = ['אברהם', 'יצחק', 'יעקב', 'משה', 'דוד', 'שלמה', 'יוסף', 'אהרן', 'נתנאל', 'אליהו', 'בנימין', 'שמואל', 'מאיר', 'חיים', 'יהודה', 'דניאל', 'מנחם', 'אלעזר', 'שמעון', 'רפאל'];
  const femaleFirstNames = ['שרה', 'רבקה', 'רחל', 'לאה', 'חנה', 'אסתר', 'מרים', 'רות', 'נעמי', 'דינה', 'יעל', 'תמר', 'אביגיל', 'מיכל', 'חוה', 'ציפורה', 'גילה', 'אפרת', 'שירה'];
  const lastNames = ['כהן', 'לוי', 'מזרחי', 'אברהמי', 'פרץ', 'ביטון', 'אוחיון', 'דהן', 'אזולאי', 'אלמוג', 'בן ארי', 'גולדשטיין', 'פרידמן', 'רוזנברג', 'שפירא', 'וייס', 'ברקוביץ', 'קפלן', 'לביא', 'אבוטבול'];

  const firstName = gender === PrismaGender.MALE 
    ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
    : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'walla.co.il', 'hotmail.com'];
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  // Using faker for more realistic (but still fake) email structures
  const email = faker.internet.email({ firstName, lastName, provider: domain }).toLowerCase();
  
  const phoneNumber = generateIsraeliPhoneNumber(); // Generate phone number

  const birthDate = faker.date.between({ from: new Date('1975-01-01'), to: new Date('2002-12-31') });
  const religiousLevels = ['Religious', 'Ultra-Orthodox', 'Traditional', 'Light Religious', 'Chabad', 'National-Religious'];
  const currentReligiousLevel = religiousLevels[Math.floor(Math.random() * religiousLevels.length)];
  
  const cities = ['ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'אשדוד', 'בני ברק', 'פתח תקווה', 'נתניה', 'רחובות', 'אשקלון', 'בית שמש'];
  const city = cities[Math.floor(Math.random() * cities.length)];

  const occupations = ['סטודנט/ית', 'מורה', 'מהנדס/ת', 'רופא/ה', 'עו"ד', 'יזם/ית', 'אברך', 'מנהל/ת חשבונות', 'גרפיקאי/ת', 'איש/אשת מכירות'];
  const occupation = occupations[Math.floor(Math.random() * occupations.length)];

  const educations = ['תואר ראשון', 'תואר שני', 'תיכונית', 'ישיבה/סמינר', 'לימודי תעודה', 'דוקטורט'];
  const education = educations[Math.floor(Math.random() * educations.length)];
  
  const origins = ['אשכנזי', 'ספרדי', 'מזרחי', 'תימני', 'מעורב', 'אחר'];
  const origin = origins[Math.floor(Math.random() * origins.length)];

  const hobbiesList = ['קריאה', 'טיולים', 'בישול ואפיה', 'ספורט', 'מוזיקה', 'אומנות', 'התנדבות', 'לימוד תורה', 'צילום'];
  const numHobbies = faker.number.int({ min: 1, max: 3 });
  const hobbies = faker.helpers.arrayElements(hobbiesList, numHobbies);

  const parentStatuses = ['שני ההורים בחיים', 'הורה אחד נפטר', 'שני ההורים נפטרו', 'הורים גרושים'];
  const parentStatus = parentStatuses[Math.floor(Math.random() * parentStatuses.length)];
  const siblings = faker.number.int({ min: 0, max: 10 });

  return {
    email,
    password: faker.internet.password({ length: 12, memorable: false, prefix: 'Pass!' }), // Strong random password
    firstName,
    lastName,
    phone: phoneNumber, // Added phone
    status: UserStatus.ACTIVE, // User is fully active
    role: UserRole.CANDIDATE,
    isVerified: true, // Email is considered verified
    isPhoneVerified: true, // Phone is considered verified
    isProfileComplete: true, // Profile is considered complete
    createdAt: faker.date.past({years: 2}), // Random creation date in the past 2 years
    updatedAt: new Date(),
    lastLogin: faker.date.recent({days: 7}), // Random last login in the past week
    
    profile: {
      create: {
        gender: gender,
        birthDate: birthDate,
        nativeLanguage: 'עברית',
        additionalLanguages: Math.random() > 0.3 ? ['אנגלית'] : (Math.random() > 0.5 ? ['אנגלית', 'צרפתית'] : []),
        height: gender === PrismaGender.MALE ? faker.number.int({ min: 165, max: 195 }) : faker.number.int({ min: 150, max: 180 }),
        maritalStatus: 'רווק/ה', // Defaulting to single for new users, can be expanded
        occupation: occupation,
        education: education,
        city: city,
        address: faker.location.streetAddress({ city, useFullAddress: false }), // Added address
        origin: origin, // Added origin
        religiousLevel: currentReligiousLevel,
        about: `שלום, שמי ${firstName}. אני ${occupation} מ${city}, ${currentReligiousLevel.toLowerCase()}. מחפש/ת קשר רציני לבניית בית נאמן בישראל.`,
        hobbies: hobbies.join(', '), // Added hobbies as a string
        parentStatus: parentStatus, // Added parent status
        siblings: siblings, // Added siblings
        position: siblings > 0 ? faker.number.int({ min: 1, max: siblings + 1 }) : null, // Position among siblings
        preferredAgeMin: faker.number.int({ min: Math.max(18, new Date().getFullYear() - birthDate.getFullYear() - 5), max: new Date().getFullYear() - birthDate.getFullYear() + 2 }),
        preferredAgeMax: faker.number.int({ min: new Date().getFullYear() - birthDate.getFullYear() + 3, max: new Date().getFullYear() - birthDate.getFullYear() + 10 }),
        preferredHeightMin: gender === PrismaGender.MALE ? faker.number.int({min: 150, max: 170}) : faker.number.int({min: 165, max: 185}),
        preferredHeightMax: gender === PrismaGender.MALE ? faker.number.int({min: 170, max: 190}) : faker.number.int({min: 180, max: 200}),
        preferredReligiousLevels: faker.helpers.arrayElements(religiousLevels, faker.number.int({min: 1, max: 3})),
        preferredLocations: faker.helpers.arrayElements(cities, faker.number.int({min: 1, max: 3})),
        preferredEducation: faker.helpers.arrayElements(educations, faker.number.int({min: 1, max: 2})),
        preferredOccupations: faker.helpers.arrayElements(occupations, faker.number.int({min: 1, max: 2})),
        contactPreference: faker.helpers.arrayElement(['PHONE_WHATSAPP', 'EMAIL', 'PHONE']), // Using values similar to VerificationType or custom
        referenceName1: faker.person.fullName(),
        referencePhone1: generateIsraeliPhoneNumber(),
        referenceName2: faker.person.fullName(),
        referencePhone2: generateIsraeliPhoneNumber(),
        isProfileVisible: true,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        lastActive: new Date(),
        matchingNotes: `הערות שדכן לדוגמא עבור ${firstName}: נראה מבטיח, רקע טוב.`
      }
    },
    verifications: { // Added verifications to simulate completed email and phone verification
      create: [
        {
          type: VerificationType.EMAIL,
          token: faker.string.uuid(), // Dummy token
          target: email,
          expiresAt: faker.date.past(), // Expired as it's completed
          status: VerificationStatus.COMPLETED,
          completedAt: faker.date.recent({days: 10}), // Completed recently
        },
        {
          type: VerificationType.PHONE_WHATSAPP, // As per Prisma schema
          token: faker.string.uuid(), // Dummy token
          target: phoneNumber,
          expiresAt: faker.date.past(), // Expired as it's completed
          status: VerificationStatus.COMPLETED,
          completedAt: faker.date.recent({days: 9}), // Completed recently (after email)
        }
      ]
    }
  };
}

/**
 * Function to create new users
 * @param {number} count - Number of users to create
 * @param {Array} maleImages - Array of male images
 * @param {Array} femaleImages - Array of female images
 * @param {number} imagesPerUser - Number of images per user
 */
async function createNewUsers(count, maleImages, femaleImages, imagesPerUser = 3) {
  try {
    console.log(`Starting creation of ${count} new users with ${imagesPerUser} images per user...`);
    
    const maleCount = Math.floor(count / 2);
    const femaleCount = count - maleCount;
    console.log(`Creating ${maleCount} men and ${femaleCount} women.`);
    
    let maleImageIndex = 0;
    for (let i = 0; i < maleCount; i++) {
      try {
        const userData = generateUserData(PrismaGender.MALE);
        console.log(`\nCreating male user ${i + 1}/${maleCount}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
        
        const imageCreateArray = [];
        if (maleImages.length > 0) {
            for (let j = 0; j < imagesPerUser; j++) {
                if (maleImageIndex >= maleImages.length) {
                    console.log('Not enough male images, cycling through available images.');
                    maleImageIndex = 0; 
                }
                if(maleImages[maleImageIndex]) { // Check if image exists
                    const image = maleImages[maleImageIndex++];
                    imageCreateArray.push({
                        url: image.url,
                        isMain: j === 0,
                        cloudinaryPublicId: image.publicId,
                    });
                } else if (maleImages.length > 0) { // If somehow index is out of bounds but images exist
                    maleImageIndex = 0;
                    const image = maleImages[maleImageIndex++];
                     imageCreateArray.push({
                        url: image.url,
                        isMain: j === 0,
                        cloudinaryPublicId: image.publicId,
                    });
                }
            }
        } else {
            console.warn("No male images available to assign.");
        }
        
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
            verifications: true, // Include verifications in the returned object
          },
        });
        console.log(`Created male user: ${user.email} with ID: ${user.id}, ${user.images.length} images, ${user.verifications.length} verifications.`);
      } catch (error) {
        console.error(`Error creating male user ${i + 1} (${error.code || error.name}): ${error.message}`, error.meta ? error.meta : '');
        if (error.code === 'P2002' && error.meta && error.meta.target.includes('phone')) {
            console.warn("Duplicate phone number, skipping this user or retrying with new data might be needed in a production script.");
        }
      }
    }
    
    let femaleImageIndex = 0;
    for (let i = 0; i < femaleCount; i++) {
      try {
        const userData = generateUserData(PrismaGender.FEMALE);
        console.log(`\nCreating female user ${i + 1}/${femaleCount}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
        
        const imageCreateArray = [];
        if (femaleImages.length > 0) {
            for (let j = 0; j < imagesPerUser; j++) {
                if (femaleImageIndex >= femaleImages.length) {
                    console.log('Not enough female images, cycling through available images.');
                    femaleImageIndex = 0;
                }
                if(femaleImages[femaleImageIndex]) { // Check if image exists
                    const image = femaleImages[femaleImageIndex++];
                    imageCreateArray.push({
                        url: image.url,
                        isMain: j === 0,
                        cloudinaryPublicId: image.publicId,
                    });
                } else if (femaleImages.length > 0) {
                     femaleImageIndex = 0;
                    const image = femaleImages[femaleImageIndex++];
                     imageCreateArray.push({
                        url: image.url,
                        isMain: j === 0,
                        cloudinaryPublicId: image.publicId,
                    });
                }
            }
        } else {
            console.warn("No female images available to assign.");
        }
        
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
            verifications: true,
          },
        });
        console.log(`Created female user: ${user.email} with ID: ${user.id}, ${user.images.length} images, ${user.verifications.length} verifications.`);
      } catch (error) {
        console.error(`Error creating female user ${i + 1} (${error.code || error.name}): ${error.message}`, error.meta ? error.meta : '');
         if (error.code === 'P2002' && error.meta && error.meta.target.includes('phone')) {
            console.warn("Duplicate phone number, skipping this user or retrying with new data might be needed in a production script.");
        }
      }
    }
    
    console.log(`\nFinished creating ${count} new users successfully (or attempted to)!`);
  } catch (error) {
    console.error('Error creating new users:', error);
  }
}

/**
 * Main function to update and create new users
 * @param {number} newUserCount - Number of new users to create
 * @param {number} imagesPerUser - Number of images per user
 */
async function updateAndCreateUsers(newUserCount = 50, imagesPerUser = 3) {
  try {
    console.log(`=== Starting process of creating ${newUserCount} new users with ${imagesPerUser} images per user ===`);
    
    const maleUserCount = Math.ceil(newUserCount / 2);
    const femaleUserCount = newUserCount - maleUserCount; // Ensure total is newUserCount
    const maleImageCount = maleUserCount * imagesPerUser;
    const femaleImageCount = femaleUserCount * imagesPerUser;
    
    console.log(`Need to generate data for ${maleUserCount} male users and ${femaleUserCount} female users.`);
    console.log(`Total required: ${maleImageCount} male images and ${femaleImageCount} female images.`);
    
    let maleImages = [], femaleImages = [];

    if (maleImageCount > 0) {
        maleImages = await uploadReligiousImages(PrismaGender.MALE, maleImageCount);
        console.log(`Uploaded ${maleImages.length} religious male images (requested ${maleImageCount})`);
    } else {
        console.log("No male images requested based on user count and images per user.");
    }
    
    if (femaleImageCount > 0) {
        femaleImages = await uploadReligiousImages(PrismaGender.FEMALE, femaleImageCount);
        console.log(`Uploaded ${femaleImages.length} religious female images (requested ${femaleImageCount})`);
    } else {
        console.log("No female images requested based on user count and images per user.");
    }

    if (maleImages.length < maleImageCount && maleUserCount > 0) {
        console.warn(`Warning: Only ${maleImages.length} male images were uploaded, but ${maleImageCount} were needed. Some users might have fewer or no images.`);
    }
    if (femaleImages.length < femaleImageCount && femaleUserCount > 0) {
        console.warn(`Warning: Only ${femaleImages.length} female images were uploaded, but ${femaleImageCount} were needed. Some users might have fewer or no images.`);
    }
    
    await createNewUsers(newUserCount, maleImages, femaleImages, imagesPerUser);
    
    console.log('\n=== Example structure of generated data (values will be random) ===');
    const exampleMaleData = generateUserData(PrismaGender.MALE);
    const exampleFemaleData = generateUserData(PrismaGender.FEMALE);
    
    // Simplified example for console output, actual data is more complex
    console.log('Example for a religious man (structure):');
    console.log(JSON.stringify({
      email: exampleMaleData.email,
      firstName: exampleMaleData.firstName,
      lastName: exampleMaleData.lastName,
      phone: exampleMaleData.phone,
      status: exampleMaleData.status,
      isVerified: exampleMaleData.isVerified,
      isPhoneVerified: exampleMaleData.isPhoneVerified,
      isProfileComplete: exampleMaleData.isProfileComplete,
      profile: {
        gender: exampleMaleData.profile.create.gender,
        city: exampleMaleData.profile.create.city,
        religiousLevel: exampleMaleData.profile.create.religiousLevel,
      },
      verifications: exampleMaleData.verifications.create.map(v => ({type: v.type, status: v.status})),
      // images: "Will be generated and linked"
    }, null, 2));
    
    console.log('\nExample for a religious woman (structure):');
    console.log(JSON.stringify({
      email: exampleFemaleData.email,
      firstName: exampleFemaleData.firstName,
      lastName: exampleFemaleData.lastName,
      phone: exampleFemaleData.phone,
      profile: {
        gender: exampleFemaleData.profile.create.gender,
        city: exampleFemaleData.profile.create.city,
        religiousLevel: exampleFemaleData.profile.create.religiousLevel,
      },
      verifications: exampleFemaleData.verifications.create.map(v => ({type: v.type, status: v.status})),
    }, null, 2));
    
  } catch (error) {
    console.error('Unexpected error in main process:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// --- Script Execution ---
console.log('=== Starting the script to create new users ===');
console.log('This script will fetch images from Unsplash, upload to Cloudinary, and create users in Prisma.');
console.log('==========================================');

const NEW_USER_COUNT = 40; // Number of new users to create (e.g., 20, 50)
const IMAGES_PER_USER = 1; // Number of images per user (e.g., 1, 2, 3)

updateAndCreateUsers(NEW_USER_COUNT, IMAGES_PER_USER)
  .then(() => {
    console.log('=== User creation script completed ===');
  })
  .catch(err => {
    console.error('Critical error during script execution:', err);
    process.exit(1); // Exit with error code if main process fails
  });