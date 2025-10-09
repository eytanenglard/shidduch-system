// src/scripts/test-onboarding.ts
import 'dotenv/config';
import { OnboardingEngagementService } from '../lib/engagement/onboardingEngagementService.js';
import db from '../lib/prisma.js';

async function testOnboarding() {
  // משתמש: איתן אנגלרד
  const userId = 'cmefd7ics0000xn016z2vcsjm';
  
  console.log('🧪 Testing Onboarding System');
  console.log('Testing user: Eytan Englard (eytanenglard@gmail.com)\n');
  console.log('='.repeat(70));
  
  try {
    // שלב 1: ניתוח מצב
    console.log('\n📊 Step 1: Analyzing user progress...\n');
    const progress = await OnboardingEngagementService.analyzeOnboardingProgress(userId);
    
    console.log('User ID:', progress.userId);
    console.log('Days in system:', progress.daysInSystem);
    console.log('Completion score:', progress.completionScore + '%');
    console.log('\nCompleted steps:');
    console.log('  📷 Photo:', progress.completed.hasPhoto ? '✅ Yes' : '❌ No');
    console.log('  📝 About:', progress.completed.hasAbout ? '✅ Yes' : '❌ No');
    console.log('  📋 Questionnaire (80%+):', progress.completed.hasQuestionnaire ? '✅ Yes' : '❌ No');
    console.log('  🎯 Preferences:', progress.completed.hasPreferences ? '✅ Yes' : '❌ No');
    console.log('\nNext critical step:', progress.nextCriticalStep);
    
    if (progress.aiMotivation) {
      console.log('\n💡 AI Motivation:');
      console.log('───────────────────────────────────────────────────────────');
      console.log(progress.aiMotivation);
      console.log('───────────────────────────────────────────────────────────');
    } else {
      console.log('\n💡 AI Motivation: Not enough data yet (need 30%+ completion)');
    }
    
    // שלב 2: יצירת מייל
    console.log('\n' + '='.repeat(70));
    console.log('\n📧 Step 2: Creating onboarding email...\n');
    
    // בדיקה אם צריך לשלוח מייל לפי תוכנית (ימים 1,3,7,10,14)
    const shouldSend = [1, 3, 7, 10, 14].includes(progress.daysInSystem);
    
    if (!shouldSend && progress.daysInSystem > 14) {
      console.log(`ℹ️  User is past onboarding period (day ${progress.daysInSystem})`);
      console.log('   Onboarding emails are only sent on days: 1, 3, 7, 10, 14');
      console.log('\n   But let\'s see what email WOULD be sent based on current state...\n');
    } else if (!shouldSend) {
      console.log(`ℹ️  No email scheduled for day ${progress.daysInSystem}`);
      console.log('   Onboarding emails are only sent on days: 1, 3, 7, 10, 14\n');
    }
    
    // צור מייל בכל מקרה כדי לראות מה היה נשלח
    const emailData = await OnboardingEngagementService.createOnboardingEmail(progress);
    
    if (emailData) {
      console.log('📬 Email Details:');
      console.log('───────────────────────────────────────────────────────────');
      console.log('Subject:', emailData.subject);
      console.log('Main message:', emailData.mainMessage);
      console.log('Progress bar:', emailData.progressBar);
      console.log('Specific action:', emailData.specificAction);
      console.log('CTA:', emailData.cta);
      
      if (emailData.aiContent) {
        console.log('\nAI Content included:');
        console.log(emailData.aiContent);
      }
      console.log('───────────────────────────────────────────────────────────');
    } else {
      console.log('ℹ️  Could not create email for this day/state');
    }
    
    // שלב 3: אפשרות לשלוח באמת
    console.log('\n' + '='.repeat(70));
    console.log('\n🚀 Step 3: Send email (DISABLED BY DEFAULT)\n');
    
    const ACTUALLY_SEND = false; // שנה ל-true כדי לשלוח באמת!
    
    if (ACTUALLY_SEND && emailData) {
      console.log('⚠️  SENDING EMAIL...\n');
      
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { firstName: true, email: true, phone: true }
      });
      
      if (user) {
        await OnboardingEngagementService.sendOnboardingEmail(user, emailData);
        console.log('✅ Email sent to:', user.email);
      }
    } else {
      console.log('ℹ️  Email sending is DISABLED');
      console.log('   To actually send, change ACTUALLY_SEND to true in the code');
      console.log('\n   Current recipient would be: eytanenglard@gmail.com');
    }
    
    // סיכום
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 Summary:\n');
    console.log(`User: Eytan (day ${progress.daysInSystem})`);
    console.log(`Profile completion: ${progress.completionScore}%`);
    console.log(`Next step: ${progress.nextCriticalStep}`);
    console.log(`Email would be sent: ${shouldSend ? 'YES' : 'NO (not a scheduled day)'}`);
    
    if (progress.completionScore >= 70) {
      console.log('\n🎉 Profile is ready for matching!');
    } else {
      console.log(`\n📈 ${100 - progress.completionScore}% more to complete profile`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await db.$disconnect();
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completed\n');
}

testOnboarding();