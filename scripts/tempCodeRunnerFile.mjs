// הסבר: קובץ המשמש לבדיקת חיבור ל-Unsplash API - גרסת ESM
// מטרה: אימות שמפתח ה-API עובד כראוי ויכול לקבל תמונות

// ייבוא החבילות הנחוצות
import dotenv from 'dotenv';
import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';

// טעינת משתני סביבה מקובץ .env
dotenv.config();

// בדיקה שמפתח ה-API זמין בקובץ .env
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('שגיאה: חסר מפתח API של Unsplash בקובץ .env');
  console.error('יש להוסיף את השורה הבאה לקובץ .env:');
  console.error('UNSPLASH_ACCESS_KEY=המפתח_שלך');
  process.exit(1);
}

// יצירת מופע של Unsplash API עם מפתח ה-API
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// פונקציה לבדיקת החיבור ל-Unsplash API
async function testUnsplashConnection() {
  try {
    console.log('מתחיל בדיקת חיבור ל-Unsplash API...');
    console.log(`משתמש במפתח: ${process.env.UNSPLASH_ACCESS_KEY.slice(0, 5)}...`);
    
    // ניסיון לקבל תמונה אקראית מהקטגוריה portrait
    const result = await unsplash.search.getPhotos({
      query: 'portrait',
      perPage: 1
    });
    
    // בדיקה אם יש שגיאות בתשובה
    if (result.errors) {
      console.error('שגיאה בחיבור ל-Unsplash API:', result.errors);
      return;
    }
    
    // בדיקה אם התקבלו תוצאות
    if (!result.response) {
      console.error('לא התקבלה תשובה תקינה מ-Unsplash API');
      return;
    }
    
    if (!result.response.results || result.response.results.length === 0) {
      console.error('לא נמצאו תמונות בתשובה מ-Unsplash');
      return;
    }
    
    // מידע על תמונה שהתקבלה
    const photo = result.response.results[0];
    console.log('החיבור הצליח! פרטי תמונה לדוגמה:');
    console.log('--------------------------');
    console.log(`כותרת: ${photo.description || photo.alt_description || 'אין תיאור'}`);
    console.log(`צלם: ${photo.user.name} (@${photo.user.username})`);
    console.log(`תאריך העלאה: ${new Date(photo.created_at).toLocaleDateString()}`);
    console.log(`צפיות: ${photo.views || 'לא זמין'}`);
    console.log(`הורדות: ${photo.downloads || 'לא זמין'}`);
    console.log(`לייקים: ${photo.likes || 0}`);
    console.log(`רוחב: ${photo.width}px, גובה: ${photo.height}px`);
    console.log('\nקישורים לתמונה:');
    console.log(`- רגיל: ${photo.urls.regular}`);
    console.log(`- קטן: ${photo.urls.small}`);
    console.log(`- גדול: ${photo.urls.full}`);
    
    console.log('\nהבדיקה הושלמה בהצלחה!');
    
  } catch (error) {
    // טיפול בשגיאות כלליות
    console.error('שגיאה בבדיקת Unsplash API:');
    console.error(error);
    
    // תיקון שגיאות נפוצות
    if (error.message && error.message.includes('network')) {
      console.log('\nטיפ: בדוק את החיבור לאינטרנט שלך');
    } else if (error.message && error.message.includes('401')) {
      console.log('\nטיפ: מפתח ה-API שלך נראה לא תקין או פג תוקף');
    } else if (error.message && error.message.includes('403')) {
      console.log('\nטיפ: אין לך הרשאות מתאימות. בדוק את סטטוס האפליקציה שלך בפורטל המפתחים');
    }
  }
}

// הרצת פונקציית הבדיקה
console.log('=== בדיקת חיבור ל-Unsplash API ===');
testUnsplashConnection()
  .then(() => {
    console.log('=== סיום בדיקה ===');
  })
  .catch(err => {
    console.error('שגיאה לא צפויה בהרצת הבדיקה:', err);
  });