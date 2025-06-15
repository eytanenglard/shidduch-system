// update-users.mjs

// Import required packages
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import { faker } from '@faker-js/faker';

// Load environment variables from .env file
dotenv.config();

// --- Prisma Client ---
const prisma = new PrismaClient();

// --- API Keys and Configuration Checks ---
if (!process.env.DATABASE_URL) {
  console.error('Error: Missing DATABASE_URL in .env file');
  process.exit(1);
}
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('Error: Missing UNSPLASH_ACCESS_KEY in .env file');
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Error: Missing Cloudinary credentials in .env file');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: Missing GEMINI_API_KEY in .env file. Please add it.');
  process.exit(1);
}

// --- Google Gemini AI Client Setup ---
let textGenerationModel;
let embeddingModel; // <<<< מודל חדש עבור וקטורים
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  textGenerationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" }); // <<<< הגדרת מודל ההטמעה
  console.log('Successfully connected to Google Gemini AI for both text generation and embeddings.');
} catch (error) {
  console.error('Failed to initialize Google Gemini AI client:', error);
  process.exit(1);
}


// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Unsplash API Instance ---
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// --- Helper Functions ---
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, maxCount = 3) {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * maxCount) + 1);
}

// <<<< הוספת פונקציות עזר חדשות עבור נרטיב ה-AI >>>>
function formatValue(value, fallback = "לא צוין") {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value ? "כן" : "לא";
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('he-IL');
  }
  return String(value);
}

function formatArray(arr, fallback = "לא צוין") {
  if (!arr || arr.length === 0) {
    return fallback;
  }
  return arr.join(', ');
}

const calculateAge = (birthDate) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
    }
    return age;
};
// <<<< סוף הוספת פונקציות עזר >>>>


// --- Data Options (based on Prisma Schema and common sense) ---
const CITIES = ['Jerusalem', 'Tel Aviv', 'Haifa', 'Beer Sheva', 'Ashdod', 'Bnei Brak', 'Petah Tikva', 'Rishon LeZion', 'Netanya', 'Holon', 'Ramat Gan', 'Modiin', 'Beit Shemesh', 'Kfar Saba', 'Herzliya', 'Givatayim', 'Eilat', 'Ra\'anana', 'Rehovot', 'Bat Yam'];
const NATIVE_LANGUAGES = ['Hebrew', 'English', 'Russian', 'French', 'Spanish', 'Arabic', 'Yiddish', 'Amharic'];
const ADDITIONAL_LANGUAGES_OPTIONS = ['English', 'French', 'Russian', 'Spanish', 'German', 'Yiddish', 'Amharic', 'Italian', 'Portuguese'];
const MARITAL_STATUSES = ['Single', 'Divorced', 'Widowed', 'Annulled'];
const OCCUPATIONS = ['Student', 'Teacher', 'Software Engineer', 'Doctor', 'Lawyer', 'Entrepreneur', 'Programmer', 'Accountant', 'Marketing Manager', 'Salesperson', 'Artist', 'Musician', 'Rabbi', 'Kollel Avreich', 'Graphic Designer', 'Project Manager', 'Chef', 'Social Worker', 'Journalist', 'Architect', 'Scientist'];
const EDUCATION_LEVELS = ["High School Diploma", "Some College", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Professional Degree (MD, JD)", "Yeshiva Gedola", "Kollel", "Seminary", "Trade School certificate"];
const ORIGINS = ['Israeli (Sabra)', 'American', 'European', 'Russian/CIS', 'French', 'South American', 'North African (Mizrahi)', 'Ethiopian', 'Bukharin', 'Anglo-Saxon', 'Persian', 'Yemenite'];
const RELIGIOUS_LEVELS = ['Religious (Dati Leumi)', 'Ultra-Orthodox (Charedi)', 'Traditional (Masorti)', 'Light Religious (Dati Lite)', 'Chabad', 'Modern Orthodox', 'Secular (Hiloni) but open to tradition', 'Spiritual but not religious'];
const SERVICE_TYPES = Object.values(PrismaClient.ServiceType || {});
const HEAD_COVERING_TYPES = Object.values(PrismaClient.HeadCoveringType || {});
const KIPPAH_TYPES = Object.values(PrismaClient.KippahType || {});
const CHARACTER_TRAITS = ["Kind", "Ambitious", "Outgoing", "Introverted", "Funny", "Serious", "Optimistic", "Honest", "Loyal", "Creative", "Patient", "Organized", "Adventurous", "Calm", "Energetic", "Thoughtful", "Intellectual", "Practical", "Warm", "Spiritual", "Resourceful", "Dependable", "Compassionate", "Witty"];
const HOBBIES = ["Reading", "Hiking", "Cooking", "Playing sports", "Watching sports", "Playing musical instruments", "Listening to music", "Traveling", "Painting/Drawing", "Volunteering", "Learning languages", "Gardening", "Photography", "Yoga/Meditation", "Board games", "Movies/Theater", "Dancing", "Writing", "Coding", "Chess"];
const PARENT_STATUSES = ["Both alive and well", "One parent deceased", "Both parents deceased", "Parents divorced", "Complicated relationship with parents"];
const CONTACT_PREFERENCES = ['Whatsapp', 'Phone Call', 'Email', 'Text Message'];
const PREFERRED_ALIYA_STATUSES = ["Oleh/Olah Hadash/a", "Vatik/a (long-time Oleh/Olah)", "Tzabar/it (Israeli born)", "No Preference", "Planning Aliya"];
const AVAILABILITY_STATUSES = Object.values(PrismaClient.AvailabilityStatus || {});

// --- Gemini API Call Function for Text Generation ---
async function generateTextWithGemini(prompt, contextForLog) {
  if (!textGenerationModel) {
    console.error("Gemini text generation model not initialized. Skipping API call for:", contextForLog);
    return "Error: Gemini model not available.";
  }
  try {
    console.log(`Sending prompt to Gemini for: ${contextForLog}`);
    const result = await textGenerationModel.generateContent(prompt);
    const response = result.response;
    if (!response) {
        console.error(`No response received from Gemini for: ${contextForLog}. Full result:`, JSON.stringify(result, null, 2));
        if (result.response && result.response.promptFeedback && result.response.promptFeedback.blockReason) {
            console.error(`Gemini request blocked. Reason: ${result.response.promptFeedback.blockReason}`);
            return `Content generation blocked by safety settings for: ${contextForLog}. Reason: ${result.response.promptFeedback.blockReason}`;
        }
        return `Error: No response from Gemini for ${contextForLog}.`;
    }
    const text = response.text();
    console.log(`Gemini generated for ${contextForLog}: "${text.substring(0, 70)}..."`);
    return text.trim();
  } catch (error) {
    console.error(`Error generating text with Gemini for ${contextForLog}:`, error);
    return `Error during Gemini call for ${contextForLog}.`;
  }
}

// --- Unsplash & Cloudinary Functions (no changes needed) ---
async function getUnsplashImage(gender) {
    // ... (Your existing getUnsplashImage function remains here, unchanged)
    try {
        let queries = [];
        if (gender === 'MALE') {
            queries = ['jewish religious man portrait', 'orthodox jewish man face', 'religious man close up kippah', 'jewish man traditional attire headshot', 'hasidic man portrait', 'yeshiva bochur portrait', 'smiling religious jewish man'];
        } else {
            queries = ['religious jewish woman portrait modest', 'jewish orthodox woman face covering', 'modest woman dress headshot', 'traditional jewish woman close up', 'hasidic woman portrait', 'religious woman smiling modest attire', 'jewish seminary girl portrait'];
        }
        const randomQuery = getRandomElement(queries);
        console.log(`Searching for "${randomQuery}" on Unsplash for religious ${gender === 'MALE' ? 'man' : 'woman'}...`);
        const result = await unsplash.search.getPhotos({ query: randomQuery, page: Math.floor(Math.random() * 3) + 1, perPage: 15, orientation: 'portrait', contentFilter: 'high' });
        if (!result.response || !result.response.results || result.response.results.length === 0) {
            throw new Error(`No images found in Unsplash response for ${randomQuery}`);
        }
        const randomIndex = Math.floor(Math.random() * result.response.results.length);
        const photo = result.response.results[randomIndex];
        console.log(`Image found on Unsplash: "${photo.description || photo.alt_description || 'No description'}" by ${photo.user.name}`);
        return photo.urls.regular;
    } catch (error) {
        console.error('Error getting image from Unsplash:', error.message);
        throw error;
    }
}

async function uploadReligiousImages(gender, count) {
    // ... (Your existing uploadReligiousImages function remains here, unchanged)
    const imageData = [];
    if (count === 0) return imageData;
    console.log(`Starting upload of ${count} images for religious ${gender === 'MALE' ? 'men' : 'women'}...`);
    for (let i = 0; i < count; i++) {
        try {
            console.log(`\nProcessing image ${i + 1} of ${count} for ${gender === 'MALE' ? 'man' : 'woman'}...`);
            const imageUrl = await getUnsplashImage(gender);
            console.log(`Uploading image ${i + 1} (${imageUrl}) to Cloudinary...`);
            const result = await cloudinary.uploader.upload(imageUrl, { folder: 'user_photos_generated', public_id: `${gender.toLowerCase()}_profile_${Date.now()}_${i}`, width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' });
            imageData.push({ publicId: result.public_id, url: result.secure_url, gender: gender });
            console.log(`Image ${i + 1} uploaded successfully: ${result.secure_url}`);
            if (i < count - 1) {
                const delay = Math.floor(Math.random() * 800) + 700;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            console.error(`Error processing image ${i + 1} for ${gender}:`, error.message);
            console.log(`Skipping image ${i + 1} due to error.`);
        }
    }
    console.log(`Finished uploading. Successfully uploaded ${imageData.length} of ${count} targeted images for ${gender === 'MALE' ? 'men' : 'women'}.`);
    return imageData;
}


// --- User Data Generation (no major changes needed, it's the input for the AI) ---
async function generateUserData(gender) {
    // ... (Your existing generateUserData function remains here, unchanged)
    const maleFirstNames = ['Abraham', 'Isaac', 'Jacob', 'Moses', 'David', 'Solomon', 'Joseph', 'Aaron', 'Nathaniel', 'Elijah', 'Benjamin', 'Samuel', 'Meir', 'Chaim', 'Judah', 'Daniel', 'Menachem', 'Elazar', 'Simon', 'Raphael', 'Yossi', 'Shlomo', 'Avi', 'Moshe', 'Ariel', 'Noam', 'Itamar', 'Yonatan', 'Ohad', 'Eitan'];
    const femaleFirstNames = ['Sarah', 'Rebecca', 'Rachel', 'Leah', 'Hannah', 'Esther', 'Miriam', 'Ruth', 'Naomi', 'Dinah', 'Yael', 'Tamar', 'Abigail', 'Michal', 'Eve', 'Zipporah', 'Gila', 'Efrat', 'Shira', 'Talia', 'Noa', 'Chana', 'Rivka', 'Avigail', 'Maya', 'Liat', 'Hadar', 'Adi', 'Roni'];
    const lastNames = ['Cohen', 'Levi', 'Mizrahi', 'Abrahami', 'Peretz', 'Biton', 'Ochana', 'Dahan', 'Azoulay', 'Almog', 'Ben Ari', 'Goldstein', 'Friedman', 'Rosenberg', 'Shapira', 'Weiss', 'Berkowitz', 'Kaplan', 'Lavi', 'Aboutboul', 'Katz', 'Hadad', 'Gabai', 'Shalom', 'Revivo', 'Ohayon', 'Dayan', 'Baruch', 'Klein', 'Segal'];
    const firstName = getRandomElement(gender === 'MALE' ? maleFirstNames : femaleFirstNames);
    const lastName = getRandomElement(lastNames);
    const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'walla.co.il', 'hotmail.com', 'protonmail.com', 'icloud.com'];
    const domain = getRandomElement(emailDomains);
    const email = `${firstName.toLowerCase().replace(/\s+/g, '.')}.${lastName.toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 2000)}@${domain}`;
    const phonePrefix = ['050', '052', '053', '054', '055', '058', '051', '056'];
    const prefix = getRandomElement(phonePrefix);
    const phoneNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
    const birthDate = faker.date.between({ from: new Date('1978-01-01'), to: new Date('2004-12-31') });
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const nativeLanguage = getRandomElement(NATIVE_LANGUAGES);
    const additionalLanguages = getRandomSubset(ADDITIONAL_LANGUAGES_OPTIONS.filter(l => l !== nativeLanguage), 2);
    const height = gender === 'MALE' ? Math.floor(168 + Math.random() * 27) : Math.floor(152 + Math.random() * 25);
    const maritalStatus = Math.random() < 0.80 ? 'Single' : getRandomElement(MARITAL_STATUSES.filter(s => s !== 'Single'));
    const occupation = getRandomElement(OCCUPATIONS);
    const education = getRandomElement(EDUCATION_LEVELS);
    const educationLevel = education;
    const city = getRandomElement(CITIES);
    const origin = getRandomElement(ORIGINS);
    const religiousLevel = getRandomElement(RELIGIOUS_LEVELS);
    const shomerNegiah = religiousLevel?.toLowerCase().includes('orthodox') || religiousLevel?.toLowerCase().includes('charedi') || religiousLevel?.toLowerCase().includes('religious') ? (Math.random() > 0.2) : (Math.random() > 0.6 ? (Math.random() > 0.5) : null);
    const madeAliya = origin !== 'Israeli (Sabra)' && Math.random() < 0.4;
    const aliyaCountry = madeAliya ? getRandomElement(['USA', 'France', 'UK', 'Russia', 'Canada', 'Argentina', 'Ukraine', 'South Africa', 'Australia']) : null;
    const aliyaYear = madeAliya ? faker.date.between({ from: new Date('1990-01-01'), to: new Date('2023-12-31') }).getFullYear() : null;
    const serviceType = Math.random() > 0.35 ? getRandomElement(SERVICE_TYPES) : null;
    const serviceDetails = serviceType ? `Completed ${serviceType.toLowerCase().replace(/_/g, ' ')} service.` : null;
    const headCovering = gender === 'FEMALE' && (religiousLevel?.toLowerCase().includes('orthodox') || religiousLevel?.toLowerCase().includes('charedi') || religiousLevel?.toLowerCase().includes('religious')) ? getRandomElement(HEAD_COVERING_TYPES) : null;
    const kippahType = gender === 'MALE' && (religiousLevel?.toLowerCase().includes('orthodox') || religiousLevel?.toLowerCase().includes('charedi') || religiousLevel?.toLowerCase().includes('religious')) ? getRandomElement(KIPPAH_TYPES) : null;
    const hasChildrenFromPrevious = maritalStatus !== 'Single' ? (Math.random() > 0.55) : false;
    const profileCharacterTraits = getRandomSubset(CHARACTER_TRAITS, 5);
    const profileHobbies = getRandomSubset(HOBBIES, 4);
    const parentStatus = getRandomElement(PARENT_STATUSES);
    const siblings = Math.floor(Math.random() * 7);
    const position = siblings > 0 ? Math.floor(Math.random() * (siblings + 1)) + 1 : null;
    const aboutPrompt = `You are an assistant writing a compelling 'about me' section for a Jewish dating profile. The person's details: - Name: ${firstName} - Age: ${age} - Gender: ${gender} - Occupation: ${occupation} - City: ${city} - Religious Level: ${religiousLevel || 'not clearly specified'} - Key Character Traits: ${profileCharacterTraits.slice(0,3).join(', ') || 'positive person'} - Main Hobbies/Interests: ${profileHobbies.slice(0,2).join(', ') || 'various interests'} - Native Language: ${nativeLanguage} - Additional Languages: ${additionalLanguages.join(', ') || 'none'}. Instructions for the 'about me' text: 1.  Write in a warm, friendly, and approachable tone. 2.  Length: 3-5 sentences. 3.  Highlight 1-2 positive aspects based on the details. 4.  Mention something about what they might be looking for (e.g., "a meaningful connection", "someone to share life's adventures", "building a Bayit Ne'eman b'Yisrael"). 5.  Sound natural and not overly formulaic. 6.  Do NOT include placeholders like "[insert hobby here]". Use the provided details. 7.  Output only the 'about me' text itself, no introductory or concluding phrases from you. Example of desired style: "Shalom! I'm ${firstName}, a ${age}-year-old ${occupation} based in ${city}. I'd describe myself as ${profileCharacterTraits.length > 0 ? profileCharacterTraits[0].toLowerCase() : 'easy-going'} and I really enjoy ${profileHobbies.length > 0 ? profileHobbies[0].toLowerCase() : 'spending time outdoors'}. My ${religiousLevel ? religiousLevel.toLowerCase() : 'Jewish values'} are important to me. Looking to meet someone genuine for a lasting relationship."`;
    const aboutText = await generateTextWithGemini(aboutPrompt, `'about' text for ${firstName} ${lastName}`);
    if (aboutText.startsWith("Error:") || aboutText.startsWith("Content generation blocked")) { console.warn(`Using fallback 'about' text for ${firstName} ${lastName} due to Gemini issue.`); }
    const matchingNotesPrompt = `You are an assistant writing 'matching notes' for a matchmaker about a candidate on a Jewish dating site. The candidate's details: - Name: ${firstName} ${lastName} - Age: ${age} - Gender: ${gender} - Religious Level: ${religiousLevel || 'not clearly specified'} - Occupation: ${occupation} - City: ${city} - Key Character Traits: ${profileCharacterTraits.join(', ')} - Briefly, what they said in their 'about me': "${aboutText.substring(0, 100)}..." (if available, otherwise assume general positive profile). Instructions for the 'matching notes': 1.  Write 2-3 concise sentences from the perspective of what a matchmaker should know or highlight when suggesting this person. 2.  Focus on their key strengths or what makes them a good candidate. 3.  Mention a type of person they might be compatible with or what they are looking for in a partner, if inferable. 4.  Maintain a professional but positive tone. 5.  Output only the matching notes text, no introductory phrases. Example: "${firstName} is a ${religiousLevel ? religiousLevel.toLowerCase() : ''} ${occupation} who seems ${profileCharacterTraits.length > 0 ? profileCharacterTraits[0].toLowerCase() : 'grounded'} and ${profileCharacterTraits.length > 1 ? profileCharacterTraits[1].toLowerCase() : 'sincere'}. Values family and looking for a serious, committed relationship with someone who shares similar values. Might connect well with someone ${gender === 'MALE' ? 'who is family-oriented and kind' : 'who is ambitious and supportive'}."`;
    const matchingNotes = await generateTextWithGemini(matchingNotesPrompt, `'matchingNotes' for ${firstName} ${lastName}`);
    if (matchingNotes.startsWith("Error:") || matchingNotes.startsWith("Content generation blocked")) { console.warn(`Using fallback 'matchingNotes' for ${firstName} ${lastName} due to Gemini issue.`); }
    const preferredAgeMin = Math.max(18, age - 2 + Math.floor(Math.random() * 4));
    const preferredAgeMax = age + 3 + Math.floor(Math.random() * 7);
    const preferredHeightMin = gender === 'MALE' ? Math.floor(150 + Math.random() * 15) : Math.floor(165 + Math.random() * 15);
    const preferredHeightMax = gender === 'MALE' ? Math.floor(170 + Math.random() * 25) : Math.floor(185 + Math.random() * 20);
    return {
        email, password: faker.internet.password({ length: 14, memorable: false, prefix: 'Pwd!' }), firstName, lastName, phone: phoneNumber, status: 'ACTIVE', role: 'CANDIDATE', isVerified: true, isPhoneVerified: true, isProfileComplete: true, lastLogin: faker.date.recent({ days: 45 }), source: 'REGISTRATION',
        profile: {
            create: {
                gender: gender, birthDate, nativeLanguage, additionalLanguages, height, maritalStatus, occupation, education, educationLevel, city, origin, religiousLevel, shomerNegiah, serviceType: serviceType || undefined, serviceDetails, headCovering: headCovering || undefined, kippahType: kippahType || undefined, hasChildrenFromPrevious, profileCharacterTraits, profileHobbies, aliyaCountry, aliyaYear,
                about: aboutText.startsWith("Error:") || aboutText.startsWith("Content generation blocked") ? `My name is ${firstName} and I live in ${city}. I work as a ${occupation} and consider myself ${religiousLevel}. I enjoy ${profileHobbies.join(', ')} and my friends say I am ${profileCharacterTraits.join(', ')}. Looking for a serious relationship.` : aboutText,
                parentStatus, siblings, position, preferredAgeMin, preferredAgeMax, preferredHeightMin: Math.random() > 0.25 ? preferredHeightMin : null, preferredHeightMax: Math.random() > 0.25 ? preferredHeightMax : null,
                preferredReligiousLevels: getRandomSubset(RELIGIOUS_LEVELS, 3), preferredLocations: getRandomSubset(CITIES, 3), preferredEducation: getRandomSubset(EDUCATION_LEVELS, 2), preferredOccupations: getRandomSubset(OCCUPATIONS, 2),
                contactPreference: getRandomElement(CONTACT_PREFERENCES), preferredHasChildrenFromPrevious: maritalStatus === 'Single' ? (Math.random() > 0.6 ? false : null) : (Math.random() > 0.4), preferredMaritalStatuses: getRandomSubset(MARITAL_STATUSES, 2),
                preferredShomerNegiah: Math.random() > 0.3 ? getRandomElement(['yes', 'no', 'flexible', 'important']) : null, preferredPartnerHasChildren: Math.random() > 0.3 ? getRandomElement(['yes_ok', 'no_preferred', 'does_not_matter', 'open_to_it']) : null,
                preferredOrigins: getRandomSubset(ORIGINS, 2), preferredServiceTypes: getRandomSubset(SERVICE_TYPES, 2).map(st => st || undefined).filter(Boolean), preferredHeadCoverings: gender === 'MALE' ? getRandomSubset(HEAD_COVERING_TYPES, 2).map(hc => hc || undefined).filter(Boolean) : [],
                preferredKippahTypes: gender === 'FEMALE' ? getRandomSubset(KIPPAH_TYPES, 2).map(kt => kt || undefined).filter(Boolean) : [], preferredCharacterTraits: getRandomSubset(CHARACTER_TRAITS, 4), preferredHobbies: getRandomSubset(HOBBIES, 3),
                preferredAliyaStatus: getRandomElement(PREFERRED_ALIYA_STATUSES), isProfileVisible: true, preferredMatchmakerGender: Math.random() > 0.5 ? getRandomElement(['MALE', 'FEMALE']) : null,
                matchingNotes: matchingNotes.startsWith("Error:") || matchingNotes.startsWith("Content generation blocked") ? `Candidate ${firstName} ${lastName} appears to be a solid match for individuals seeking a ${religiousLevel} partner in the ${city} area. They value ${profileCharacterTraits[0] || 'honesty'} and enjoy ${profileHobbies[0] || 'meaningful conversations'}.` : matchingNotes,
                availabilityStatus: 'AVAILABLE', availabilityNote: Math.random() > 0.65 ? `Actively looking and available to meet.` : null, availabilityUpdatedAt: new Date(), lastActive: new Date(),
            }
        }
    };
}

// =========================================================================
// <<<<<<<<<<<<<<<<<<<< START: NEW AI VECTOR FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>
// =========================================================================

/**
 * Generates a comprehensive narrative profile text for a given user object.
 * This text is used to create the vector embedding.
 * @param {object} user - The user object with profile data, as created by generateUserData.
 * @returns {string | null} A narrative string, or null if essential data is missing.
 */
function generateNarrativeProfileForUser(user) {
  if (!user || !user.profile || !user.profile.create) {
    console.error(`Cannot generate narrative: User or Profile data is missing.`);
    return null;
  }

  const profile = user.profile.create;
  const age = calculateAge(profile.birthDate);

  let narrative = `# פרופיל AI עבור ${user.firstName} ${user.lastName}, ${profile.gender === 'MALE' ? 'גבר' : 'אישה'} בן/בת ${age}\n\n`;

  // --- Section: General Summary ---
  narrative += `## סיכום כללי\n`;
  narrative += `- **שם:** ${user.firstName} ${user.lastName}\n`;
  narrative += `- **גיל:** ${age}\n`;
  narrative += `- **מצב משפחתי:** ${formatValue(profile.maritalStatus)}\n`;
  narrative += `- **מגורים:** ${formatValue(profile.city)}\n`;
  narrative += `- **רמה דתית:** ${formatValue(profile.religiousLevel)}\n`;
  narrative += `- **עיסוק:** ${formatValue(profile.occupation)}\n`;
  narrative += `- **השכלה:** ${formatValue(profile.educationLevel)}, ${formatValue(profile.education)}\n`;
  narrative += `- **שומר/ת נגיעה:** ${formatValue(profile.shomerNegiah)}\n\n`;

  // --- Section: About Me (From Profile) ---
  if (profile.about) {
    narrative += `## קצת עליי (מהפרופיל)\n`;
    narrative += `"${profile.about}"\n\n`;
  }
  
  // --- Section: Personal Traits and Hobbies ---
  narrative += `## תכונות אופי ותחביבים\n`;
  narrative += `- **תכונות בולטות:** ${formatArray(profile.profileCharacterTraits)}\n`;
  narrative += `- **תחביבים עיקריים:** ${formatArray(profile.profileHobbies)}\n\n`;
  
  // --- Section: Partner Preferences (From Profile) ---
  narrative += `## מה אני מחפש/ת בבן/בת הזוג (העדפות מהפרופיל)\n`;
  narrative += `- **תיאור כללי:** ${formatValue(profile.matchingNotes)}\n`;
  narrative += `- **טווח גילאים מועדף:** ${formatValue(profile.preferredAgeMin, '?')} - ${formatValue(profile.preferredAgeMax, '?')}\n`;
  narrative += `- **רמות דתיות מועדפות:** ${formatArray(profile.preferredReligiousLevels)}\n`;
  narrative += `- **רמות השכלה מועדפות:** ${formatArray(profile.preferredEducation)}\n`;
  narrative += `- **מוצאים מועדפים:** ${formatArray(profile.preferredOrigins)}\n\n`;
  
  // Note: Questionnaire answers are omitted as this script does not generate them.
  // In a real scenario, this part would be included.

  return narrative.trim();
}

/**
 * Generates and saves a vector embedding for a newly created user.
 * @param {object} createdUser - The full user object returned from prisma.user.create, including profile.
 */
async function generateAndSaveVector(createdUser) {
    if (!createdUser || !createdUser.profile) {
        console.warn(`[AI] Skipping vector generation for user ${createdUser.id} because profile is missing.`);
        return;
    }
    console.log(`[AI] Starting vector generation for user: ${createdUser.email}`);

    // Re-create the data structure that generateNarrativeProfileForUser expects
    const userForNarrative = {
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        profile: { create: createdUser.profile }
    };
    
    // 1. Generate the narrative profile text
    const profileText = generateNarrativeProfileForUser(userForNarrative);

    if (!profileText) {
        console.error(`[AI] Failed to generate narrative profile for user ${createdUser.id}. Aborting vector creation.`);
        return;
    }

    try {
        // 2. Generate the embedding vector
        console.log(`[AI] Generating embedding for user ${createdUser.id}...`);
        const result = await embeddingModel.embedContent(profileText);
        const vector = result.embedding.values;

        if (!vector || vector.length === 0) {
            console.error(`[AI] Failed to generate vector from Gemini for user ${createdUser.id}. Received empty vector.`);
            return;
        }

        // 3. Save the vector to the database using a raw query
        const profileId = createdUser.profile.id;
        const vectorSqlString = `[${vector.join(',')}]`;
        
        console.log(`[AI] Saving vector to DB for profileId: ${profileId}`);
        await prisma.$executeRaw`
            INSERT INTO "profile_vectors" ("profileId", vector, "updatedAt")
            VALUES (${profileId}, ${vectorSqlString}::vector, NOW())
            ON CONFLICT ("profileId")
            DO UPDATE SET
                vector = EXCLUDED.vector,
                "updatedAt" = NOW();
        `;

        console.log(`[AI] SUCCESS: Saved vector for user ${createdUser.email} (Profile ID: ${profileId})`);

    } catch(error) {
        console.error(`[AI] CRITICAL ERROR during vector generation or saving for user ${createdUser.id}:`, error);
    }
}
// =========================================================================
// <<<<<<<<<<<<<<<<<<<< END: NEW AI VECTOR FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>
// =========================================================================


// --- Create New Users in Database ---
async function createNewUsers(count, maleImages, femaleImages, imagesPerUser = 3) {
  console.log(`Starting creation of ${count} new users with up to ${imagesPerUser} images per user...`);
  const maleTargetCount = Math.floor(count / 2);
  const femaleTargetCount = count - maleTargetCount;
  console.log(`Targeting ${maleTargetCount} men and ${femaleTargetCount} women.`);

  let createdCount = 0;

  // Create Male Users
  let maleImageIndex = 0;
  for (let i = 0; i < maleTargetCount; i++) {
    try {
      console.log(`\n--- Generating data for male user ${i + 1}/${maleTargetCount} ---`);
      const userData = await generateUserData('MALE');
      console.log(`Data generated for: ${userData.firstName} ${userData.lastName} (${userData.email})`);

      const imageCreateArray = [];
      if (imagesPerUser > 0 && maleImages.length > 0) {
        for (let j = 0; j < imagesPerUser; j++) {
          if (maleImageIndex >= maleImages.length) maleImageIndex = 0;
          const image = maleImages[maleImageIndex++];
          if (image) {
            imageCreateArray.push({ url: image.url, isMain: j === 0, cloudinaryPublicId: image.publicId });
          } else if (j === 0) {
             console.warn(`Main male image expected but not found for user ${userData.firstName}. User will have fewer images.`);
          }
        }
      } else if (imagesPerUser > 0) {
        console.warn(`No male images available for user ${userData.firstName}. User will have no images.`);
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          images: imageCreateArray.length > 0 ? { create: imageCreateArray } : undefined,
        },
        include: { profile: true, images: true },
      });
      console.log(`SUCCESS: Created male user: ${user.email} (ID: ${user.id}) with ${user.images.length} images.`);
      
      // <<<< Call the AI vector generation function >>>>
      await generateAndSaveVector(user);
      
      createdCount++;
      if (i < maleTargetCount - 1) await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`ERROR creating male user ${i + 1}:`, error.message);
      if (error.code === 'P2002' && error.meta && error.meta.target) {
        console.error(`Detail: Unique constraint failed for fields: ${error.meta.target.join(', ')}`);
      } else if (error.message.includes("Gemini")) {
        console.error("This error might be related to Gemini API call failing within generateUserData.");
      }
    }
  }

  // Create Female Users
  let femaleImageIndex = 0;
  for (let i = 0; i < femaleTargetCount; i++) {
    try {
      console.log(`\n--- Generating data for female user ${i + 1}/${femaleTargetCount} ---`);
      const userData = await generateUserData('FEMALE');
      console.log(`Data generated for: ${userData.firstName} ${userData.lastName} (${userData.email})`);

      const imageCreateArray = [];
      if (imagesPerUser > 0 && femaleImages.length > 0) {
        for (let j = 0; j < imagesPerUser; j++) {
          if (femaleImageIndex >= femaleImages.length) femaleImageIndex = 0;
          const image = femaleImages[femaleImageIndex++];
          if (image) {
            imageCreateArray.push({ url: image.url, isMain: j === 0, cloudinaryPublicId: image.publicId });
          } else if (j===0) {
            console.warn(`Main female image expected but not found for user ${userData.firstName}. User will have fewer images.`);
          }
        }
      } else if (imagesPerUser > 0) {
        console.warn(`No female images available for user ${userData.firstName}. User will have no images.`);
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          images: imageCreateArray.length > 0 ? { create: imageCreateArray } : undefined,
        },
        include: { profile: true, images: true },
      });
      console.log(`SUCCESS: Created female user: ${user.email} (ID: ${user.id}) with ${user.images.length} images.`);

      // <<<< Call the AI vector generation function >>>>
      await generateAndSaveVector(user);
      
      createdCount++;
      if (i < femaleTargetCount - 1) await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`ERROR creating female user ${i + 1}:`, error.message);
       if (error.code === 'P2002' && error.meta && error.meta.target) {
        console.error(`Detail: Unique constraint failed for fields: ${error.meta.target.join(', ')}`);
      } else if (error.message.includes("Gemini")) {
        console.error("This error might be related to Gemini API call failing within generateUserData.");
      }
    }
  }
  console.log(`\nFinished creating users. Total created: ${createdCount} out of ${count} targeted.`);
}

// --- Main Execution Function ---
async function runUserCreationProcess(newUserCount = 10, imagesPerUser = 1) {
  console.log(`\n=== Starting User Creation Process: ${newUserCount} new users, ${imagesPerUser} images/user ===\n`);
  try {
    const maleTargetCount = Math.floor(newUserCount / 2);
    const femaleTargetCount = newUserCount - maleTargetCount;
    const maleImageCountToFetch = maleTargetCount * imagesPerUser;
    const femaleImageCountToFetch = femaleTargetCount * imagesPerUser;

    let maleImages = [];
    let femaleImages = [];

    if (maleImageCountToFetch > 0) {
      console.log(`Fetching ${maleImageCountToFetch} male images...`);
      maleImages = await uploadReligiousImages('MALE', maleImageCountToFetch);
    }
    if (femaleImageCountToFetch > 0) {
      console.log(`Fetching ${femaleImageCountToFetch} female images...`);
      femaleImages = await uploadReligiousImages('FEMALE', femaleImageCountToFetch);
    }

    await createNewUsers(newUserCount, maleImages, femaleImages, imagesPerUser);
    
    // The example data generation is removed from here to avoid confusion,
    // as it was only for demonstrating the structure.
    
  } catch (error) {
    console.error('Critical error in main user creation process:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\nDatabase connection closed.');
    console.log('=== User Creation Process Ended ===');
  }
}

// --- Script Execution ---
const NUMBER_OF_NEW_USERS_TO_CREATE = 16; 
const IMAGES_PER_USER = 1;

console.log(`
======================================================================
  User Creation Script with Google Gemini AI & Unsplash/Cloudinary
======================================================================
`);

runUserCreationProcess(NUMBER_OF_NEW_USERS_TO_CREATE, IMAGES_PER_USER)
  .then(() => {
    console.log("Script execution finished.");
  })
  .catch(err => {
    console.error("Unhandled error during script execution:", err);
  });