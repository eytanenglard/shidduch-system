// src/scripts/testUserLanguageSupport.ts

import 'dotenv/config';
import prisma from '../lib/prisma';
import { SmartEngagementOrchestrator } from '../lib/engagement/SmartEngagementOrchestrator';
import { getEmailDictionary } from '../lib/dictionaries';
import { Language } from '@prisma/client';

/**
 * 🧪 סקריפט לבדיקת תמיכה רב-לשונית במערכת ה-Engagement
 * 
 * שימוש:
 * npm run test:user-lang <userId>
 * 
 * דוגמה:
 * npm run test:user-lang clxy123abc
 */

async function testUserLanguageSupport(userId: string) {
  console.log('\n========================================');
  console.log('🌍 Testing Multi-Language Support');
  console.log('========================================\n');

  try {
    // 1️⃣ טען את המשתמש
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
        dripCampaign: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Language: ${user.language}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Marketing Consent: ${user.marketingConsent}`);
    console.log(`   Profile Complete: ${user.isProfileComplete}`);

    // 2️⃣ בדוק טעינת מילון
    console.log('\n📚 Loading Dictionary...');
    const dict = await getEmailDictionary(user.language as Language);
    console.log(`   ✅ Dictionary loaded successfully for language: ${user.language}`);
    console.log(`   Sample text (onboardingDay1.subject): ${dict.engagement.onboardingDay1.subject}`);

    // 3️⃣ בנה פרופיל engagement (ללא AI - חשוב!)
    console.log('\n🔨 Building Engagement Profile (without AI)...');
    
    // ✅ קריאה ישירה עם skipAI = true
    const SmartEngagementOrchestratorClass = SmartEngagementOrchestrator as any;
    const profile = await SmartEngagementOrchestratorClass.buildUserEngagementProfile(userId, false);
    
    console.log(`   ✅ Profile built successfully (no AI calls)`);
    console.log(`   Days in system: ${profile.daysInSystem}`);
    console.log(`   Completion: ${profile.completionStatus.overall}%`);
    console.log(`   Photos: ${profile.completionStatus.photos.current}/3`);
    console.log(`   Last email type: ${profile.lastEmailType || 'None'}`);

    // 4️⃣ קבע איזה מייל ייששלח (רק את הטיפוס)
    console.log('\n📧 Determining Email Type...');
    
    // ✅ שימוש בפונקציה הפרטית דרך reflection (או בדיקה ידנית)
    const { daysInSystem, completionStatus, triggers, lastEmailSent } = profile;
    
    let emailType: string | null = null;
    
    // בדוק אם מוקדם מדי לשלוח
    if (lastEmailSent) {
      const daysSinceLastEmail = Math.floor(
        (Date.now() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastEmail < 3) {
        emailType = null;
        console.log(`   ⏭️ Too soon to send (last email ${daysSinceLastEmail} days ago)`);
      }
    }
    
    // קבע טיפוס מייל
    if (emailType === null) {
      if (daysInSystem <= 7) {
        emailType = 'ONBOARDING';
      } else if (triggers.almostDone) {
        emailType = 'CELEBRATION';
      } else if (triggers.stagnant) {
        emailType = 'NUDGE';
      } else if (!completionStatus.photos.isDone) {
        emailType = 'NUDGE';
      } else if (completionStatus.questionnaire.completionPercent < 50) {
        emailType = 'NUDGE';
      } else if (completionStatus.overall >= 40 && completionStatus.overall < 90) {
        emailType = 'AI_SUMMARY';
      } else if (daysInSystem % 14 === 0) {
        emailType = 'VALUE';
      }
    }
    
    if (!emailType) {
      console.log('   ℹ️  No email needed at this time');
    } else {
      console.log(`   ✅ Email type: ${emailType}`);
      console.log(`   Language: ${user.language}`);
    }

    // 5️⃣ בדוק פעילות יומית (עבור מייל ערב)
    console.log('\n🌙 Checking Daily Activity (for Evening Email)...');
    const dailyActivity = await SmartEngagementOrchestrator.testDetectDailyActivity(userId);
    console.log(`   Has activity today: ${dailyActivity.hasActivity ? '✅' : '❌'}`);
    console.log(`   Completed today: ${dailyActivity.completedToday.join(', ') || 'Nothing'}`);
    
    if (dailyActivity.hasActivity) {
      console.log('\n   Evening email would be sent: ✅');
      console.log(`   Language: ${user.language}`);
    } else {
      console.log('\n   Evening email would NOT be sent (no activity)');
    }

    // 6️⃣ סיכום
    console.log('\n========================================');
    console.log('✅ Test Completed Successfully!');
    console.log('========================================');
    console.log('\n📋 Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Language: ${user.language}`);
    console.log(`   Dictionary loaded: ✅`);
    console.log(`   Profile built: ✅`);
    console.log(`   Email decision: ${emailType ? `✅ ${emailType}` : 'ℹ️  None needed'}`);
    console.log(`   Daily activity: ${dailyActivity.hasActivity ? '✅ Active today' : 'ℹ️  Not active'}`);

    // 7️⃣ המלצות
    console.log('\n💡 Recommendations:');
    if (user.language === 'he') {
      console.log('   ✅ Hebrew language detected - emails will be in Hebrew');
    } else if (user.language === 'en') {
      console.log('   ✅ English language detected - emails will be in English');
    } else {
      console.log(`   ⚠️  Unsupported language: ${user.language} (will default to Hebrew)`);
    }
    
    if (!user.marketingConsent) {
      console.log('   ⚠️  Marketing consent is FALSE - user will NOT receive emails');
    }
    
    if (user.isProfileComplete) {
      console.log('   ℹ️  Profile is complete - user may not receive onboarding emails');
    }

    if (emailType === 'AI_SUMMARY') {
      console.log('   💡 This email type requires AI - will trigger Gemini API');
    }

    console.log('\n========================================');
    console.log('🚀 Next Steps:');
    console.log('========================================');
    console.log('To send actual emails:');
    console.log('  npm run engagement:daily    # For daily campaign');
    console.log('  npm run engagement:evening  # For evening feedback\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error(error);
    process.exit(1);
  }
}

// קבל userId משורת פקודה
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: npm run test:user-lang <userId>');
  console.error('Example: npm run test:user-lang cmefd7ics0000xn0l6z2vcsjm');
  process.exit(1);
}

testUserLanguageSupport(userId);