// src/scripts/test-notification.ts
import 'dotenv/config'; // Ensures environment variables are loaded
import prisma from '../lib/prisma';
import { notificationService } from '../lib/engagement/notificationService';

// --- הגדרות הבדיקה ---
const TARGET_EMAIL = 'eytanenglard@gmail.com';
// ✨ חשוב מאוד: החלף למספר הטלפון שלך בפורמט בינלאומי מלא (E.164) ✨
const TARGET_PHONE = '+972543210040'; // לדוגמה: '+972501234567'

async function runTest() {
  console.log(`--- Starting Notification Test for ${TARGET_EMAIL} ---`);

  if (!TARGET_PHONE || TARGET_PHONE.length < 10) {
    console.error('💥 ERROR: Please set your TARGET_PHONE in the script before running.');
    return;
  }

  try {
    // 1. מצא את המשתמש במסד הנתונים
    console.log(`1. Finding user with email: ${TARGET_EMAIL}...`);
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (!user) {
      console.error(`💥 ERROR: User with email ${TARGET_EMAIL} not found in the database.`);
      console.log('Please make sure this user exists before running the test.');
      return;
    }

    // ודא שלמשתמש יש מספר טלפון תואם לצורך הבדיקה
    if (user.phone !== TARGET_PHONE) {
         console.warn(`⚠️ WARNING: The phone number in the database (${user.phone}) does not match the target phone (${TARGET_PHONE}). The WhatsApp message will be sent to ${TARGET_PHONE}.`);
         // לצורך הבדיקה, נשתמש במספר שהוגדר בסקריפט
         user.phone = TARGET_PHONE;
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    // 2. שלח מייל "ברוכים הבאים" כבדיקה
    console.log('\n2. Sending test "Welcome" notification...');
    await notificationService.sendWelcome(user);
    console.log('✅ "Welcome" notification process completed.');


    // 3. שלח מייל "דחיפה" (Nudge) כבדיקה
    console.log('\n3. Sending test "Profile Nudge" notification...');
    const mockMissingItems = [
      "העלאת תמונות נוספות",
      "כתיבת סיפור אישי ב'אודותיי'",
      "הוספת המלצה מחבר/ה"
    ];
    await notificationService.sendProfileNudge(user, mockMissingItems);
    console.log('✅ "Profile Nudge" notification process completed.');

    console.log('\n--- Test Finished ---');
    console.log('Check your email inbox at eytanenglard@gmail.com and your WhatsApp.');

  } catch (error) {
    console.error('🔥 An error occurred during the test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

runTest();