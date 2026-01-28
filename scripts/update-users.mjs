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
let embeddingModel; // מודל עבור וקטורים
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  textGenerationModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-latest" });
  embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" }); // הגדרת מודל ההטמעה
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

function getRandomSubset(arr, minCount = 1, maxCount = 3) {
    if (!arr || arr.length === 0) return [];
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


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
    if (!birthDate) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- Data Options (based on Prisma Schema and common sense) ---
const CITIES = ['ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'אשדוד', 'בני ברק', 'פתח תקווה', 'ראשון לציון', 'נתניה', 'חולון', 'רמת גן', 'מודיעין', 'בית שמש', 'כפר סבא', 'הרצליה', 'גבעתיים', 'אילת', 'רעננה', 'רחובות', 'בת ים', 'גוש עציון'];
const NATIVE_LANGUAGES = ['עברית', 'אנגלית', 'רוסית', 'צרפתית', 'ספרדית'];
const ADDITIONAL_LANGUAGES_OPTIONS = ['אנגלית', 'צרפתית', 'רוסית', 'ספרדית', 'גרמנית', 'יידיש'];
const MARITAL_STATUSES = ['single', 'divorced', 'widowed', 'annulled'];
const OCCUPATIONS = ['סטודנט/ית', 'מורה', 'מהנדס/ת תוכנה', 'רופא/ה', 'עורך/ת דין', 'יזם/ית', 'מתכנת/ת', 'רואה/ת חשבון', 'מנהל/ת שיווק', 'איש/אשת מכירות', 'אמן/ית', 'מוזיקאי/ת', 'רב', 'אברך כולל', 'מעצב/ת גרפי/ת', 'מנהל/ת פרויקטים', 'שף/ית', 'עובד/ת סוציאלי/ת'];
const EDUCATION_LEVELS = ["high_school", "some_college", "associates_degree", "academic_ba", "academic_ma", "academic_phd", "professional_degree", "yeshiva_gedola", "kollel", "seminary", "trade_school"];
const ORIGINS = ['צבר', 'אמריקאי', 'אירופאי', 'רוסי/חבר העמים', 'צרפתי', 'דרום אמריקאי', 'צפון אפריקאי (מזרחי)', 'אתיופי', 'אנגלו-סקסי'];
const RELIGIOUS_LEVELS = ['dati_leumi_torani', 'dati_leumi_liberal', 'dati_leumi_standard', 'charedi_modern', 'charedi_standard', 'masorti_strong', 'masorti_lite', 'chabad'];
const RELIGIOUS_JOURNEYS = Object.values(PrismaClient.ReligiousJourney || {});
const SERVICE_TYPES = Object.values(PrismaClient.ServiceType || {});
const HEAD_COVERING_TYPES = Object.values(PrismaClient.HeadCoveringType || {});
const KIPPAH_TYPES = Object.values(PrismaClient.KippahType || {});
const CHARACTER_TRAITS = ["אדיב/ה", "שאפתנ/ית", "מוחצנ/ת", "מופנמ/ת", "מצחיק/ה", "רציני/ת", "אופטימי/ת", "כן/ה", "נאמן/ה", "יצירתי/ת", "סבלני/ת", "מאורגנ/ת", "הרפתקנ/ית", "רגוע/ה", "אנרגטי/ת", "מתחשב/ת", "אינטלקטואל/ית", "מעשי/ת", "חם/ה", "רוחני/ת", "תושייתי/ת", "אחראי/ת", "רחמנ/ית", "שנונ/ה"];
const HOBBIES = ["קריאה", "טיולים בטבע", "בישול", "ספורט", "צפייה בספורט", "נגינה", "האזנה למוזיקה", "נסיעות לחו\"ל", "ציור/רישום", "התנדבות", "לימוד שפות", "גינון", "צילום", "יוגה/מדיטציה", "משחקי קופסה", "סרטים/תיאטרון", "ריקוד", "כתיבה"];
const PARENT_STATUSES = ["נשואים", "גרושים", "פרודים", "אחד ההורים נפטר", "שני ההורים נפטרו"];
const CONTACT_PREFERENCES = ['both', 'matchmaker', 'candidate'];
const PREFERRED_ALIYA_STATUSES = ['oleh_hadash', 'oleh_vatik', 'tzabar', 'no_preference', 'planning_aliya'];
const INFLUENTIAL_RABBIS = ["הרב קוק זצ\"ל", "הרב סולובייצ'יק זצ\"ל", "הרבי מליובאוויטש זצ\"ל", "הרב יונתן זקס זצ\"ל", "הרבנית ימימה מזרחי", "הרב שרקי", "הרב חיים סבתו", "הרב אליעזר מלמד"];


// --- Gemini API Call Function for Text Generation ---
async function generateTextWithGemini(prompt, contextForLog, isJson = false) {
    if (!textGenerationModel) {
        console.error("Gemini text generation model not initialized. Skipping API call for:", contextForLog);
        return isJson ? "{ \"error\": \"Gemini model not available.\" }" : "Error: Gemini model not available.";
    }
    try {
        console.log(`Sending prompt to Gemini for: ${contextForLog}`);
        const generationConfig = isJson ? { responseMimeType: "application/json" } : {};
        const result = await textGenerationModel.generateContent(prompt, generationConfig);
        const response = result.response;

        if (!response || !response.text) {
             console.error(`No response or text received from Gemini for: ${contextForLog}. Full result:`, JSON.stringify(result, null, 2));
             if (result.response && result.response.promptFeedback && result.response.promptFeedback.blockReason) {
                 console.error(`Gemini request blocked. Reason: ${result.response.promptFeedback.blockReason}`);
                 const errorText = `Content generation blocked for: ${contextForLog}. Reason: ${result.response.promptFeedback.blockReason}`;
                 return isJson ? `{ "error": "${errorText}" }` : errorText;
             }
             const errorText = `Error: No response from Gemini for ${contextForLog}.`;
             return isJson ? `{ "error": "${errorText}" }` : errorText;
        }

        const text = response.text();
        console.log(`Gemini generated for ${contextForLog}: "${text.substring(0, 100)}..."`);
        return text.trim();
    } catch (error) {
        console.error(`Error generating text with Gemini for ${contextForLog}:`, error);
        const errorText = `Error during Gemini call for ${contextForLog}.`;
        return isJson ? `{ "error": "${errorText}" }` : errorText;
    }
}


// --- Unsplash & Cloudinary Functions ---
async function getUnsplashImage(gender) {
    try {
        const queries = gender === 'MALE'
            ? ['jewish religious man portrait', 'orthodox jewish man face', 'religious man close up kippah', 'yeshiva bochur portrait', 'smiling religious jewish man']
            : ['religious jewish woman portrait modest', 'jewish orthodox woman face covering', 'modest woman dress headshot', 'traditional jewish woman close up', 'religious woman smiling modest attire'];
        const randomQuery = getRandomElement(queries);
        console.log(`Searching for "${randomQuery}" on Unsplash...`);
        
        const result = await unsplash.search.getPhotos({ 
            query: randomQuery, 
            page: Math.floor(Math.random() * 3) + 1, 
            perPage: 15, 
            orientation: 'portrait', 
            contentFilter: 'high' 
        });

        if (!result.response || result.response.results.length === 0) {
            throw new Error(`No images found for query: ${randomQuery}`);
        }
        
        const photo = getRandomElement(result.response.results);
        console.log(`Image found: "${photo.alt_description || 'No description'}"`);
        return photo.urls.regular;
    } catch (error) {
        console.error('Error getting image from Unsplash:', error.message);
        throw error;
    }
}

async function uploadReligiousImages(gender, count) {
    const imageData = [];
    if (count === 0) return imageData;
    console.log(`Starting upload of ${count} images for religious ${gender === 'MALE' ? 'men' : 'women'}...`);
    for (let i = 0; i < count; i++) {
        try {
            const imageUrl = await getUnsplashImage(gender);
            const result = await cloudinary.uploader.upload(imageUrl, { 
                folder: 'user_photos_generated', 
                public_id: `${gender.toLowerCase()}_profile_${Date.now()}_${i}`, 
                width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' 
            });
            imageData.push({ publicId: result.public_id, url: result.secure_url });
            console.log(`Image ${i + 1}/${count} uploaded successfully: ${result.secure_url}`);
            if (i < count - 1) await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error processing image ${i + 1} for ${gender}:`, error.message);
        }
    }
    return imageData;
}

// --- NEW: Questionnaire Generation ---
function generateBudgetAllocation(categories, traitsPriorities = {}) {
    const allocation = {};
    let totalPoints = 100;
    let weights = categories.map(cat => {
        const priority = traitsPriorities[cat.label] || 1;
        return Math.random() * priority;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => (w / totalWeight) * totalPoints);

    for (let i = 0; i < categories.length - 1; i++) {
        const points = Math.round(weights[i]);
        allocation[categories[i].label] = points;
        totalPoints -= points;
    }
    allocation[categories[categories.length - 1].label] = totalPoints;

    return allocation;
}


async function generateQuestionnaireAnswers(profileData) {
    console.log(`[Q] Generating questionnaire answers for ${profileData.firstName}...`);
    const persona = `
        **User Persona Profile:**
        - **Name:** ${profileData.firstName}
        - **Gender:** ${profileData.gender === 'MALE' ? 'גבר' : 'אישה'}
        - **Age:** ${profileData.age}
        - **Occupation:** ${profileData.occupation}
        - **Religious Level:** ${profileData.religiousLevel}
        - **Key Traits:** ${profileData.profileCharacterTraits.join(', ')}
        - **Hobbies:** ${profileData.profileHobbies.join(', ')}
        - **Personality Summary:** A ${profileData.age}-year-old ${profileData.religiousLevel} ${profileData.occupation} who is ${profileData.profileCharacterTraits[0]} and ${profileData.profileCharacterTraits[1]}.
    `;

    const openTextQuestionsPrompt = `
        Based on the following user persona, please generate short, authentic, in-character answers in Hebrew for the listed questionnaire questions.
        Return the answers in a valid JSON object format where keys are the question IDs and values are the string answers.

        ${persona}

        **Questions to Answer:**
        - personality_self_portrayal_revised
        - personality_good_vs_perfect_day
        - personality_strengths_and_weaknesses_revised
        - values_core_elaboration_revised
        - values_childhood_home_atmosphere
        - values_definition_of_rich_life
        - values_lost_wallet
        - relationship_household_philosophy
        - relationship_deal_breaker_summary_final_revised
        - partner_deal_breakers_open_text_revised
        - partner_must_have_quality_final_revised
        - religion_my_personal_prayer
        - religion_kashrut_observance_details_revised
        - religion_modesty_personal_approach_revised
        - religion_children_education_religious_vision_revised
    `;
    const generatedTextsResponse = await generateTextWithGemini(openTextQuestionsPrompt, `questionnaire texts for ${profileData.firstName}`, true);
    let openAnswers = {};
    try {
        // --- START OF FIX ---
        // Clean the response from Gemini to remove markdown code blocks
        const cleanedResponse = generatedTextsResponse.replace(/^```json\s*/, '').replace(/```$/, '');
        // --- END OF FIX ---
        
        openAnswers = JSON.parse(cleanedResponse); // Use the cleaned response
    } catch (e) {
        console.error(`[Q] Failed to parse JSON from Gemini for ${profileData.firstName}. Using fallbacks. Original response: ${generatedTextsResponse}`);
    }
    // Generate answers for other types
    const answers = {
        personalityAnswers: {
            personality_self_portrayal_revised: openAnswers.personality_self_portrayal_revised || `אני אדם ${profileData.profileCharacterTraits[0]}, שאוהב ${profileData.profileHobbies[0]}.`,
            personality_core_trait_selection_revised: generateBudgetAllocation([{label: 'אמפתי/ת ורגיש/ה'}, {label: 'ישר/ה ואמין/ה'}, {label: 'אופטימי/ת ושמח/ה'}]),
            personality_social_battery_recharge: getRandomElement(['quiet_evening_alone', 'intimate_gathering', 'energetic_social_outing']),
            personality_biological_clock: Math.floor(Math.random() * 10) + 1,
            personality_good_vs_perfect_day: openAnswers.personality_good_vs_perfect_day || 'יום טוב הוא יום עם תחושת סיפוק והתקדמות.',
            personality_daily_structure_revised: getRandomElement(['סדר ותכנון', 'גמישות וזרימה', 'משימתיות', 'איזון']),
            personality_stress_management_revised: getRandomSubset(['תנועה וספורט', 'שיחה ופריקה', 'זמן לבד ושקט'], 1, 3),
            personality_social_situation_revised: getRandomElement(['יוזם/ת ומתחבר/ת', 'מצטרף/ת בעדינות', 'מחפש/ת שיחת עומק']),
            personality_primary_motivation_revised: getRandomElement(['השגת מטרות', 'יצירת קשרים', 'נתינה והשפעה']),
            personality_strengths_and_weaknesses_revised: openAnswers.personality_strengths_and_weaknesses_revised || 'תכונה חזקה היא הנאמנות שלי, והייתי רוצה לעבוד על דחיינות.',
        },
        valuesAnswers: {
            values_core_identification_revised: generateBudgetAllocation([{label: 'משפחה וקשרים קרובים'}, {label: 'יושרה, אמינות וכנות'}, {label: 'צמיחה אישית והתפתחות'}]),
            values_core_elaboration_revised: openAnswers.values_core_elaboration_revised || 'הערך הכי חשוב לי הוא כנות. זה הבסיס לכל מערכת יחסים בריאה.',
            values_health_lifestyle_importance: Math.floor(Math.random() * 10) + 1,
            values_attitude_towards_money_revised: getRandomElement(['כלי לביטחון', 'אמצעי לחוויות', 'איזון ואחריות']),
            values_lost_wallet: openAnswers.values_lost_wallet || 'אחפש תעודה מזהה ואנסה ליצור קשר עם הבעלים. אם לא, אמסור למשטרה.',
            values_education_pursuit_revised: getRandomElement(['למידה היא דרך חיים', 'למידה ממוקדת מטרה', 'למידה חווייתית']),
            values_giving_tzedaka_importance_revised: Math.floor(Math.random() * 10) + 1,
            values_dealing_with_disagreement_partner_revised: getRandomElement(['שיחה והבנה', 'מציאת בסיס משותף', 'חיפוש פשרה']),
            values_non_negotiable_for_partner_revised: openAnswers.values_non_negotiable_for_partner_revised || 'חוסר יושרה הוא קו אדום. חייבת להיות התאמה בערכים בסיסיים.',
        },
        relationshipAnswers: {
            relationship_core_meaning_revised: getRandomSubset(['חיבור רגשי עמוק', 'חברות ותמיכה', 'צמיחה משותפת'], 1, 2),
            relationship_key_feelings_from_partner_revised: getRandomSubset(['תמיכה והבנה', 'הערכה וכבוד', 'ביטחון ואמון'], 1, 3),
            relationship_love_languages: getRandomSubset(['מילים מחזקות', 'זמן איכות', 'עזרה מעשית'], 1, 2),
            relationship_communication_ideal_revised: getRandomElement(['פתיחות וישירות', 'רגישות ואמפתיה', 'התמקדות בפתרון']),
            relationship_handling_partner_disappointment_revised: getRandomElement(['התרחקות ועיבוד', 'שיחה מיידית', 'ניתוח הגיוני']),
            relationship_household_philosophy: openAnswers.relationship_household_philosophy || 'מאמין/ה בשותפות מלאה ותקשורת. כל אחד תורם לפי החוזקות והזמן הפנוי שלו.',
            relationship_daily_togetherness_vs_autonomy_revised: Math.floor(Math.random() * 10) + 1,
            relationship_family_vision_children_revised: getRandomElement(['הורות היא חלק מרכזי', 'רואה את עצמי הורה בעתיד']),
            relationship_deal_breaker_summary_final_revised: openAnswers.relationship_deal_breaker_summary_final_revised || 'דיל ברייקר: חוסר כנות. שאיפה: שותפות אמת.',
        },
        partnerAnswers: {
            partner_initial_impression_priorities_revised: getRandomSubset(['מראה וסגנון', 'חיוך ואנרגיה', 'כימיה בשיחה', 'שנינות ועומק'], 1, 3),
            partner_appearance_importance_scale_revised: Math.floor(Math.random() * 10) + 1,
            partner_core_character_traits_essential_revised: generateBudgetAllocation([{label: 'יושרה, אמינות וכנות'}, {label: 'חום, אמפתיה וטוב לב'}, {label: 'בגרות, יציבות ואחריות'}]),
            partner_lifestyle_pace_preference_revised: getRandomElement(['דינמי ופעיל', 'רגוע ושליו', 'מאוזן']),
            partner_deal_breakers_open_text_revised: openAnswers.partner_deal_breakers_open_text_revised || 'קו אדום עבורי הוא חוסר כבוד לאחרים וזלזול.',
            partner_must_have_quality_final_revised: openAnswers.partner_must_have_quality_final_revised || 'התכונה החשובה ביותר היא טוב לב.',
        },
        religionAnswers: {
            religion_core_feeling_of_faith: getRandomElement(['ביטחון ויציבות', 'משמעות ושייכות', 'שמחה והודיה', 'אתגר וצמיחה']),
            religion_my_personal_prayer: openAnswers.religion_my_personal_prayer || 'שמע ישראל, זו תפילה שמחברת אותי לשורשים.',
            religion_rabbinic_guidance_role_revised: Math.floor(Math.random() * 10) + 1,
            religion_shabbat_experience: getRandomElement(['זמן משפחה', 'התעלות רוחנית', 'מנוחה והטענה']),
            religion_kashrut_observance_details_revised: openAnswers.religion_kashrut_observance_details_revised || 'מקפיד/ה על רבנות מהדרין. אוכל/ת בחוץ רק במקומות כשרים.',
            religion_modesty_personal_approach_revised: openAnswers.religion_modesty_personal_approach_revised || `צניעות עבורי היא מידה פנימית שמתבטאת גם בלבוש מכבד. ${profileData.gender === 'MALE' ? 'אני הולך עם כיפה סרוגה.' : 'אני מקפידה על לבוש צנוע.'}`,
            religion_partner_ideal_religious_profile_revised: openAnswers.religion_partner_ideal_religious_profile_revised || 'מחפש/ת מישהו/י מהעולם הדתי-לאומי עם ראש פתוח.',
            religion_flexibility_religious_differences_partner_revised: Math.floor(Math.random() * 10) + 1,
            religion_children_education_religious_vision_revised: openAnswers.religion_children_education_religious_vision_revised || 'חשוב לי להקים בית עם אווירה של תורה, אהבת ישראל ופתיחות מחשבתית.',
        }
    };

    return {
        ...answers,
        valuesCompleted: true,
        personalityCompleted: true,
        relationshipCompleted: true,
        partnerCompleted: true,
        religionCompleted: true,
        worldsCompleted: ['VALUES', 'RELATIONSHIP', 'PARTNER', 'PERSONALITY', 'RELIGION'],
        completed: true,
        startedAt: new Date(),
        completedAt: new Date(),
        lastSaved: new Date(),
    };
}


// --- User Data Generation ---
async function generateUserData(gender) {
    const maleFirstNames = ['אברהם', 'יצחק', 'יעקב', 'משה', 'דוד', 'שלמה', 'יוסף', 'אהרן', 'נתנאל', 'אליהו', 'בנימין', 'שמואל', 'מאיר', 'חיים', 'יהודה', 'דניאל', 'מנחם', 'אלעזר', 'שמעון', 'רפאל', 'יוסי', 'אבי', 'אריאל', 'נעם', 'איתמר', 'יונתן', 'אוהד', 'איתן'];
    const femaleFirstNames = ['שרה', 'רבקה', 'רחל', 'לאה', 'חנה', 'אסתר', 'מרים', 'רות', 'נעמי', 'דינה', 'יעל', 'תמר', 'אביגיל', 'מיכל', 'חווה', 'צפורה', 'גילה', 'אפרת', 'שירה', 'טליה', 'נועה', 'חני', 'מאיה', 'ליאת', 'הדר', 'עדי', 'רוני'];
    const lastNames = ['כהן', 'לוי', 'מזרחי', 'אברהמי', 'פרץ', 'ביטון', 'אוחנה', 'דיין', 'אזולאי', 'אלמוג', 'בן ארי', 'גולדשטיין', 'פרידמן', 'רוזנברג', 'שפירא', 'וייס', 'ברקוביץ', 'קפלן', 'לביא', 'אבוטבול', 'כץ', 'חדד', 'גבאי', 'שלום', 'רביבו', 'אוחיון', 'ברוך', 'קליין', 'סגל'];
    const firstName = getRandomElement(gender === 'MALE' ? maleFirstNames : femaleFirstNames);
    const lastName = getRandomElement(lastNames);
    const email = `${faker.internet.userName({ firstName, lastName })}${Math.floor(Math.random() * 2000)}@${getRandomElement(['gmail.com', 'walla.co.il'])}`;
    const phonePrefix = ['050', '052', '053', '054', '055', '058'];
    const phoneNumber = `${getRandomElement(phonePrefix)}${Math.floor(1000000 + Math.random() * 9000000)}`;
    const birthDate = faker.date.between({ from: new Date('1985-01-01'), to: new Date('2000-12-31') });
    const age = calculateAge(birthDate);
    const nativeLanguage = getRandomElement(NATIVE_LANGUAGES);
    const additionalLanguages = getRandomSubset(ADDITIONAL_LANGUAGES_OPTIONS.filter(l => l !== nativeLanguage), 1, 2);
    const height = gender === 'MALE' ? Math.floor(170 + Math.random() * 20) : Math.floor(155 + Math.random() * 20);
    const maritalStatus = Math.random() < 0.85 ? 'single' : 'divorced';
    const occupation = getRandomElement(OCCUPATIONS);
    const educationLevel = getRandomElement(EDUCATION_LEVELS);
    const education = `בוגר/ת ${educationLevel.replace(/_/g, ' ')}`;
    const city = getRandomElement(CITIES);
    const origin = getRandomElement(ORIGINS);
    const religiousLevel = getRandomElement(RELIGIOUS_LEVELS);
    const religiousJourney = getRandomElement(RELIGIOUS_JOURNEYS);
    const shomerNegiah = religiousLevel.includes('torani') || religiousLevel.includes('charedi');
    const serviceType = getRandomElement(SERVICE_TYPES);
    const serviceDetails = serviceType ? `שירות משמעותי כ${serviceType.toLowerCase().replace(/_/g, ' ')}.` : null;
    const headCovering = gender === 'FEMALE' ? getRandomElement(HEAD_COVERING_TYPES) : null;
    const kippahType = gender === 'MALE' ? getRandomElement(KIPPAH_TYPES) : null;
    const profileCharacterTraits = getRandomSubset(CHARACTER_TRAITS, 3, 5);
    const profileHobbies = getRandomSubset(HOBBIES, 2, 4);
    const fatherOccupation = getRandomElement(OCCUPATIONS);
    const motherOccupation = getRandomElement(OCCUPATIONS);
    const siblings = Math.floor(Math.random() * 7);
    const position = siblings > 0 ? Math.floor(Math.random() * (siblings + 1)) + 1 : 1;
    const influentialRabbi = getRandomElement(INFLUENTIAL_RABBIS);

    const profileDataForGpt = { firstName, age, gender, occupation, city, religiousLevel, profileCharacterTraits, profileHobbies };
    
    const aboutPrompt = `כתוב קטע "קצת עליי" לפרופיל שידוכים יהודי, 3-4 משפטים, טון חם. פרטים: ${JSON.stringify(profileDataForGpt)}. הפלט יהיה רק הטקסט בעברית.`;
    const aboutText = await generateTextWithGemini(aboutPrompt, `'about' for ${firstName}`);
    
    const profileHeadlinePrompt = `כתוב כותרת קצרה (עד 10 מילים) לפרופיל שידוכים. פרטים: ${JSON.stringify(profileDataForGpt)}. הפלט יהיה רק הכותרת בעברית.`;
    const profileHeadline = await generateTextWithGemini(profileHeadlinePrompt, `'headline' for ${firstName}`);

    const questionnaireAnswers = await generateQuestionnaireAnswers(profileDataForGpt);

    return {
        email, password: faker.internet.password(), firstName, lastName, phone: phoneNumber, isProfileComplete: true,
        profile: {
            create: {
                gender, birthDate, nativeLanguage, additionalLanguages, height, maritalStatus, occupation, education, educationLevel, city, origin, religiousLevel, religiousJourney, shomerNegiah, serviceType, serviceDetails, headCovering, kippahType,
                profileCharacterTraits, profileHobbies, influentialRabbi, fatherOccupation, motherOccupation, siblings, position,
                about: aboutText.startsWith("Error:") ? `שמי ${firstName}, ${occupation} מ${city}.` : aboutText,
                profileHeadline: profileHeadline.startsWith("Error:") ? `מחפש/ת את החצי השני` : profileHeadline,
                preferredAgeMin: Math.max(18, age - 2), preferredAgeMax: age + 5,
                preferredReligiousLevels: getRandomSubset(RELIGIOUS_LEVELS, 1, 3),
                isProfileVisible: true,
                availabilityStatus: 'AVAILABLE',
                lastActive: new Date(),
            }
        },
        questionnaireResponses: {
            create: questionnaireAnswers
        }
    };
}


// --- AI VECTOR FUNCTIONS ---
function generateNarrativeProfileForUser(user) {
  if (!user || !user.profile) return null;
  const profile = user.profile;
  const answers = user.questionnaireResponses?.[0]; // Get the first (and only) response set
  const age = calculateAge(profile.birthDate);

  let narrative = `# פרופיל AI עבור ${user.firstName} ${user.lastName}, ${profile.gender === 'MALE' ? 'גבר' : 'אישה'} בן/בת ${age}\n\n`;

  narrative += `## תמצית הפרופיל\n`;
  narrative += `- **כותרת:** ${formatValue(profile.profileHeadline)}\n`;
  narrative += `- **תקציר (קצת עליי):** "${formatValue(profile.about)}"\n\n`;
  
  narrative += `## נתונים אישיים ודמוגרפיים\n`;
  narrative += `- **גיל:** ${age}, **מצב משפחתי:** ${formatValue(profile.maritalStatus)}\n`;
  narrative += `- **מגורים:** ${formatValue(profile.city)}, **מוצא:** ${formatValue(profile.origin)}\n`;
  narrative += `- **עיסוק והשכלה:** ${formatValue(profile.occupation)}, ${formatValue(profile.education)}\n\n`;

  narrative += `## עולם רוחני ודתי\n`;
  narrative += `- **רמה דתית:** ${formatValue(profile.religiousLevel)}, **מסע דתי:** ${formatValue(profile.religiousJourney)}\n`;
  narrative += `- **שמירת נגיעה:** ${formatValue(profile.shomerNegiah)}\n`;
  narrative += `- **רב/נית משפיע/ה:** ${formatValue(profile.influentialRabbi)}\n\n`;
  
  narrative += `## אישיות ותחביבים\n`;
  narrative += `- **תכונות אופי:** ${formatArray(profile.profileCharacterTraits)}\n`;
  narrative += `- **תחביבים:** ${formatArray(profile.profileHobbies)}\n\n`;

  if (answers) {
      narrative += `## תובנות מפתח מהשאלון\n`;
      narrative += `- **תיאור עצמי:** "${answers.personalityAnswers.personality_self_portrayal_revised || ''}"\n`;
      narrative += `- **הערך החשוב ביותר:** "${answers.valuesAnswers.values_core_elaboration_revised || ''}"\n`;
      narrative += `- **תפיסת הזוגיות:** "${answers.relationshipAnswers.relationship_deal_breaker_summary_final_revised || ''}"\n`;
      narrative += `- **התכונה החשובה בפרטנר:** "${answers.partnerAnswers.partner_must_have_quality_final_revised || ''}"\n`;
      narrative += `- **החזון לבית:** "${answers.religionAnswers.religion_children_education_religious_vision_revised || ''}"\n\n`;
  }
  
  narrative += `## מה אני מחפש/ת (העדפות)\n`;
  narrative += `- **טווח גילאים:** ${formatValue(profile.preferredAgeMin, '?')} - ${formatValue(profile.preferredAgeMax, '?')}\n`;
  narrative += `- **רמות דתיות מועדפות:** ${formatArray(profile.preferredReligiousLevels)}\n`;
  
  return narrative.trim();
}

async function generateAndSaveVector(createdUser) {
    if (!createdUser || !createdUser.profile) {
        console.warn(`[AI] Skipping vector generation for user ${createdUser.id} because profile is missing.`);
        return;
    }
    console.log(`[AI] Starting vector generation for user: ${createdUser.email}`);
    const profileText = generateNarrativeProfileForUser(createdUser);

    if (!profileText) {
        console.error(`[AI] Failed to generate narrative profile for user ${createdUser.id}.`);
        return;
    }
    try {
        const result = await embeddingModel.embedContent(profileText);
        const vector = result.embedding.values;
        if (!vector || vector.length === 0) {
            console.error(`[AI] Failed to generate vector from Gemini for user ${createdUser.id}.`);
            return;
        }
        const profileId = createdUser.profile.id;
        const vectorSqlString = `[${vector.join(',')}]`;
        await prisma.$executeRaw`
            INSERT INTO "profile_vectors" ("profileId", vector, "updatedAt")
            VALUES (${profileId}, ${vectorSqlString}::vector, NOW())
            ON CONFLICT ("profileId") DO UPDATE SET vector = EXCLUDED.vector, "updatedAt" = NOW();
        `;
        console.log(`[AI] SUCCESS: Saved vector for user ${createdUser.email} (Profile ID: ${profileId})`);
    } catch(error) {
        console.error(`[AI] CRITICAL ERROR during vector generation or saving for user ${createdUser.id}:`, error);
    }
}


// --- Main Execution Logic ---
async function createNewUsers(count, maleImages, femaleImages, imagesPerUser = 3) {
  console.log(`Starting creation of ${count} new users...`);
  const maleTargetCount = Math.floor(count / 2);
  const femaleTargetCount = count - maleTargetCount;
  let createdCount = 0;

  for (let i = 0; i < count; i++) {
    const gender = i < maleTargetCount ? 'MALE' : 'FEMALE';
    const imagePool = gender === 'MALE' ? maleImages : femaleImages;
    let imageIndex = 0;

    try {
      console.log(`\n--- Generating data for ${gender} user ${i + 1}/${count} ---`);
      const userData = await generateUserData(gender);
      console.log(`Data generated for: ${userData.firstName} ${userData.lastName}`);

      const imageCreateArray = [];
      for (let j = 0; j < imagesPerUser; j++) {
        if (imagePool.length > 0) {
            if (imageIndex >= imagePool.length) imageIndex = 0;
            const image = imagePool[imageIndex++];
            imageCreateArray.push({ url: image.url, isMain: j === 0, cloudinaryPublicId: image.publicId });
        }
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          images: { create: imageCreateArray },
        },
        include: { profile: true, images: true, questionnaireResponses: true },
      });
      console.log(`SUCCESS: Created user: ${user.email} with ${user.images.length} images and questionnaire.`);
      
      await generateAndSaveVector(user);
      createdCount++;

      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between user creations
    } catch (error) {
      console.error(`ERROR creating user ${i + 1}:`, error.message);
      if (error.code === 'P2002') console.error(`Detail: Unique constraint failed.`);
    }
  }
  console.log(`\nFinished. Total created: ${createdCount}/${count}.`);
}

async function runUserCreationProcess(newUserCount = 10, imagesPerUser = 1) {
  console.log(`\n=== Starting User Creation Process ===\n`);
  try {
    const maleImgCount = Math.ceil(newUserCount / 2) * imagesPerUser;
    const femaleImgCount = Math.floor(newUserCount / 2) * imagesPerUser;

    const [maleImages, femaleImages] = await Promise.all([
        uploadReligiousImages('MALE', maleImgCount),
        uploadReligiousImages('FEMALE', femaleImgCount)
    ]);

    await createNewUsers(newUserCount, maleImages, femaleImages, imagesPerUser);
    
  } catch (error) {
    console.error('Critical error in main process:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\nDatabase connection closed.');
  }
}

// --- Script Execution ---
const NUMBER_OF_NEW_USERS_TO_CREATE = 2; 
const IMAGES_PER_USER = 1;

runUserCreationProcess(NUMBER_OF_NEW_USERS_TO_CREATE, IMAGES_PER_USER);