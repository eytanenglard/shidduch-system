// src/scripts/test-notification.ts
import 'dotenv/config';
import prisma from '../lib/prisma.js'; // שים לב ל-.js בסוף
import { notificationService } from '../lib/engagement/notificationService.js';

// --- הגדרות הבדיקה ---
const TARGET_EMAIL = 'eytanenglard@gmail.com';
const TARGET_PHONE = '+9725XXXXXXXX'; // ✨ החלף למספר שלך!

async function runTest() {
  console.log(`--- Starting Notification Test for ${TARGET_EMAIL} ---`);

  if (!TARGET_PHONE || TARGET_PHONE.length < 10) {
    console.error('💥 ERROR: Please set your TARGET_PHONE in the script before running.');
    return;
  }

  try {
    console.log(`1. Finding user with email: ${TARGET_EMAIL}...`);
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (!user) {
      console.error(`💥 ERROR: User with email ${TARGET_EMAIL} not found in the database.`);
      return;
    }

    if (user.phone !== TARGET_PHONE) {
         console.warn(`⚠️ WARNING: The phone number in the database (${user.phone}) does not match the target phone (${TARGET_PHONE}). The WhatsApp message will be sent to ${TARGET_PHONE}.`);
         user.phone = TARGET_PHONE;
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    console.log('\n2. Sending test "Welcome" notification...');
    await notificationService.sendWelcome(user);
    console.log('✅ "Welcome" notification process completed.');

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