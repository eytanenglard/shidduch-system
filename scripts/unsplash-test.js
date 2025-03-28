// בדיקה ישירה של חיבור ל-Unsplash API
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testUnsplashDirectly() {
  // המפתח מקובץ .env
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  console.log('=== בדיקת חיבור ישיר ל-Unsplash API ===');
  console.log(`משתמש במפתח: ${accessKey.slice(0, 5)}...`);
  
  try {
    // ביצוע בקשה פשוטה לקבלת תמונה אקראית
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${accessKey}`);
    
    // בדיקת קוד התגובה
    console.log('קוד תגובה:', response.status);
    
    // קבלת התוכן כ-JSON
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('החיבור הצליח!');
      console.log('פרטי התמונה:');
      console.log(`- תיאור: ${data.description || data.alt_description || 'אין תיאור'}`);
      console.log(`- צלם: ${data.user.name}`);
      console.log(`- קישור: ${data.urls.small}`);
    } else {
      console.error('שגיאה בתגובה:', data);
    }
  } catch (error) {
    console.error('שגיאה בביצוע הבקשה:', error);
  }
  
  console.log('=== סיום בדיקה ===');
}

testUnsplashDirectly();