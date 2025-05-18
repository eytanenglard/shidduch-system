  // Update user images and create new users by gender
// Save this file with .mjs extension

// Import required packages
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
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
 * Function to get quality image from Unsplash by gender and religiosity
 * @param {string} gender - Gender (MALE or FEMALE)
 * @returns {Promise<string>} - URL of the found image
 */
async function getUnsplashImage(gender) {
  try {
    // Queries customized by gender and religious appearance
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
    
    console.log(`Searching for "${randomQuery}" on Unsplash for religious ${gender === 'MALE' ? 'man' : 'woman'}...`);
    
    // Search images with advanced settings
    const result = await unsplash.search.getPhotos({
      query: randomQuery,
      page: Math.floor(Math.random() * 5) + 1, // Random page between 1 and 5
      perPage: 10, // Results per page
      orientation: 'portrait', // Portrait images (suitable for profile pictures)
      contentFilter: 'high', // Inappropriate content filtering
    });
    
    if (!result.response || !result.response.results || result.response.results.length === 0) {
      throw new Error(`No images found in Unsplash response for religious ${gender === 'MALE' ? 'man' : 'woman'}`);
    }
    
    // Random selection of an image from results
    const randomIndex = Math.floor(Math.random() * result.response.results.length);
    const photo = result.response.results[randomIndex];
    
    console.log(`Image found: "${photo.description || photo.alt_description || 'No description'}" by ${photo.user.name}`);
    
    // Use regular version of image (good balance between quality and file size)
    return photo.urls.regular;
  } catch (error) {
    console.error('Error getting image from Unsplash:', error.message);
    throw error;
  }
}

/**
 * Function to upload images by gender
 * @param {string} gender - Gender (MALE or FEMALE)
 * @param {number} count - Number of images to upload
 * @returns {Promise<Array>} - Array of uploaded image data
 */
async function uploadReligiousImages(gender, count) {
  const imageData = [];
  
  console.log(`Starting upload of ${count} images for religious ${gender === 'MALE' ? 'men' : 'women'}...`);
  
  for (let i = 0; i < count; i++) {
    try {
      console.log(`\nProcessing image ${i + 1} of ${count} for ${gender === 'MALE' ? 'man' : 'woman'}...`);
      
      // Get image from Unsplash by gender
      const imageUrl = await getUnsplashImage(gender);
      
      console.log(`Uploading image ${i + 1} to Cloudinary...`);
      
      // Upload image to Cloudinary with improved settings
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'user_photos', // Organized folder for user photos
        public_id: `${gender.toLowerCase()}_profile_${Date.now()}_${i}`, // Unique identifier including gender
        width: 400, // Increased size for better quality
        height: 400, 
        crop: 'fill',
        gravity: 'face', // Focus on face if present in the image
        quality: 'auto', // Automatic quality for balance between size and quality
        fetch_format: 'auto', // Automatic format for optimization
      });
      
      imageData.push({
        publicId: result.public_id,
        url: result.secure_url,
        gender: gender
      });
      
      console.log(`Image ${i + 1} uploaded successfully: ${result.secure_url}`);
      
      // Small delay to avoid exceeding Unsplash API rate limits
      if (i < count - 1) {
        const delay = Math.floor(Math.random() * 500) + 500; // 500-1000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Error processing image ${i + 1} for ${gender}:`, error);
      
      // Decision whether to try again or continue
      if (i >= count - 3) { // If only 3 or fewer images remain, continue without them
        console.log(`Skipping image ${i + 1} and moving to next...`);
      } else {
        console.log(`Trying image ${i + 1} again...`);
        i--; // Retry uploading image
      }
    }
  }
  
  console.log(`Finished uploading ${imageData.length} images successfully for ${gender === 'MALE' ? 'men' : 'women'}!`);
  return imageData;
}

/**
 * Create random data for a new user
 * @param {string} gender - Gender (MALE or FEMALE)
 * @returns {Object} - Object with user data
 */
function generateUserData(gender) {
  // Common Hebrew names
  const maleFirstNames = ['Abraham', 'Isaac', 'Jacob', 'Moses', 'David', 'Solomon', 'Joseph', 'Aaron', 'Nathaniel', 'Elijah', 
                         'Benjamin', 'Samuel', 'Meir', 'Chaim', 'Judah', 'Daniel', 'Menachem', 'Elazar', 'Simon', 'Raphael'];
  const femaleFirstNames = ['Sarah', 'Rebecca', 'Rachel', 'Leah', 'Hannah', 'Esther', 'Miriam', 'Ruth', 'Naomi', 'Dinah', 
                           'Yael', 'Tamar', 'Abigail', 'Michal', 'Eve', 'Zipporah', 'Rachel', 'Gila', 'Efrat', 'Shira'];
  const lastNames = ['Cohen', 'Levi', 'Mizrahi', 'Abrahami', 'Peretz', 'Biton', 'Ochana', 'Dahan', 'Azoulay', 'Almog', 
                    'Ben Ari', 'Goldstein', 'Friedman', 'Rosenberg', 'Shapira', 'Weiss', 'Berkowitz', 'Kaplan', 'Lavi', 'Aboutboul'];

  // Random selection of first name and last name
  const firstName = gender === 'MALE' 
    ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
    : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Create email
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'walla.co.il', 'hotmail.com'];
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;
  
  // Create Israeli phone number
  const phonePrefix = ['050', '052', '053', '054', '055', '058'];
  const prefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
  const phoneNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
  
  return {
    email,
    password: faker.internet.password(12), // Strong random password
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
        nativeLanguage: 'Hebrew',
        additionalLanguages: ['English'],
        height: Math.floor(160 + Math.random() * 30), // Height between 160 and 190 cm
        maritalStatus: 'Single',
        occupation: ['Student', 'Teacher', 'Engineer', 'Doctor', 'Lawyer', 'Entrepreneur'][Math.floor(Math.random() * 6)],
        education: ['Bachelor', 'Master', 'High School', 'Yeshiva/Seminary'][Math.floor(Math.random() * 4)],
        city: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Beer Sheva', 'Ashdod', 'Bnei Brak', 'Petah Tikva'][Math.floor(Math.random() * 7)],
        religiousLevel: ['Religious', 'Ultra-Orthodox', 'Traditional', 'Light Religious'][Math.floor(Math.random() * 4)],
        about: `Hello, my name is ${firstName} and I'm looking for an ${gender === 'MALE' ? 'ultra-orthodox woman' : 'ultra-orthodox man'} to build a faithful home in Israel.`,
        preferredAgeMin: Math.floor(20 + Math.random() * 5),
        preferredAgeMax: Math.floor(30 + Math.random() * 10),
        availabilityStatus: 'AVAILABLE'
      }
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
    
    // Equal division between men and women
    const maleCount = Math.floor(count / 2);
    const femaleCount = count - maleCount;
    
    console.log(`Creating ${maleCount} men and ${femaleCount} women.`);
    
    // Create male users
    let maleImageIndex = 0;
    for (let i = 0; i < maleCount; i++) {
      try {
        // Create new user data
        const userData = generateUserData('MALE');
        console.log(`\nCreating male user ${i + 1}/${maleCount}: ${userData.firstName} ${userData.lastName}`);
        
        // Prepare array for creating images
        const imageCreateArray = [];
        
        // Add defined number of images for each user
        for (let j = 0; j < imagesPerUser; j++) {
          // Check if image is available
          if (maleImageIndex >= maleImages.length) {
            console.log('Not enough male images, returning to the first image');
            maleImageIndex = 0;
          }
          
          const image = maleImages[maleImageIndex++];
          
          imageCreateArray.push({
            url: image.url,
            // Only first image is primary
            isMain: j === 0,
            cloudinaryPublicId: image.publicId,
          });
        }
        
        // Create user with multiple images
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
        
        console.log(`Created male user: ${user.email} with ID: ${user.id} and ${user.images.length} images`);
      } catch (error) {
        console.error(`Error creating male user ${i + 1}:`, error);
      }
    }
    
    // Create female users
    let femaleImageIndex = 0;
    for (let i = 0; i < femaleCount; i++) {
      try {
        // Create new user data
        const userData = generateUserData('FEMALE');
        console.log(`\nCreating female user ${i + 1}/${femaleCount}: ${userData.firstName} ${userData.lastName}`);
        
        // Prepare array for creating images
        const imageCreateArray = [];
        
        // Add defined number of images for each user
        for (let j = 0; j < imagesPerUser; j++) {
          // Check if image is available
          if (femaleImageIndex >= femaleImages.length) {
            console.log('Not enough female images, returning to the first image');
            femaleImageIndex = 0;
          }
          
          const image = femaleImages[femaleImageIndex++];
          
          imageCreateArray.push({
            url: image.url,
            // Only first image is primary
            isMain: j === 0,
            cloudinaryPublicId: image.publicId,
          });
        }
        
        // Create user with multiple images
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
        
        console.log(`Created female user: ${user.email} with ID: ${user.id} and ${user.images.length} images`);
      } catch (error) {
        console.error(`Error creating female user ${i + 1}:`, error);
      }
    }
    
    console.log(`\nFinished creating ${count} new users successfully!`);
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
    
    // Calculate how many images are needed (number of users * number of images per user)
    const maleCount = Math.ceil(newUserCount / 2);
    const femaleCount = Math.ceil(newUserCount / 2);
    const maleImageCount = maleCount * imagesPerUser;
    const femaleImageCount = femaleCount * imagesPerUser;
    
    console.log(`Total required: ${maleImageCount} male images and ${femaleImageCount} female images`);
    
    // Upload religious male images
    const maleImages = await uploadReligiousImages('MALE', maleImageCount);
    console.log(`Uploaded ${maleImages.length} religious male images`);
    
    // Upload religious female images
    const femaleImages = await uploadReligiousImages('FEMALE', femaleImageCount);
    console.log(`Uploaded ${femaleImages.length} religious female images`);
    
    // Create new users with a number of images per user
    await createNewUsers(newUserCount, maleImages, femaleImages, imagesPerUser);
    
    // Create examples of values
    console.log('\n=== Examples of created values ===');
    // Example for religious man
    const maleExample = {
      email: 'david.cohen123@gmail.com',
      firstName: 'David',
      lastName: 'Cohen',
      phone: '0521234567',
      role: 'CANDIDATE',
      status: 'ACTIVE',
      isVerified: true,
      profile: {
        gender: 'MALE',
        birthDate: '1990-05-15',
        nativeLanguage: 'Hebrew',
        height: 178,
        religiousLevel: 'Religious',
        city: 'Jerusalem',
        occupation: 'Software Engineer',
        about: 'Hello, my name is David and I\'m looking for an ultra-orthodox woman to build a faithful home in Israel.'
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
    
    // Example for religious woman
    const femaleExample = {
      email: 'sarah.levi456@walla.co.il',
      firstName: 'Sarah',
      lastName: 'Levi',
      phone: '0541234567',
      role: 'CANDIDATE',
      status: 'ACTIVE',
      isVerified: true,
      profile: {
        gender: 'FEMALE',
        birthDate: '1992-08-23',
        nativeLanguage: 'Hebrew',
        height: 165,
        religiousLevel: 'Ultra-Orthodox',
        city: 'Bnei Brak',
        occupation: 'Teacher',
        about: 'Hello, my name is Sarah and I\'m looking for an ultra-orthodox man to build a faithful home in Israel.'
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
    
    console.log('Example for a religious man:');
    console.log(JSON.stringify(maleExample, null, 2));
    console.log('\nExample for a religious woman:');
    console.log(JSON.stringify(femaleExample, null, 2));
    
    // Return examples
    return { maleExample, femaleExample };
  } catch (error) {
    console.error('Unexpected error in process:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Run the main function with 50 new users and 3 images per user
console.log('=== Starting the process of updating and creating users ===');
console.log('Using Unsplash API to get religious images by gender');
console.log('==========================================');

// You can change the second parameter to define how many images each user will have
const IMAGES_PER_USER = 3; // Number of images per user

updateAndCreateUsers(50, IMAGES_PER_USER)
  .then((examples) => {
    console.log('=== User update and creation process completed ===');
    console.log('Examples of created values:');
    console.log(examples);
  })
  .catch(err => {
    console.error('Unexpected error in process:', err);
  });