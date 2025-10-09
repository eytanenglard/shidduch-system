// src/scripts/testDryRun.ts
import 'dotenv/config';
import { SmartEngagementOrchestrator } from '../lib/engagement/SmartEngagementOrchestrator';
import { getEmailDictionary } from '../lib/dictionaries';
import { Language } from '@prisma/client';
import prisma from '../lib/prisma';

const TEST_USER_ID = 'cmefd7ics0000xn0l6z2vcsjm';

async function testDryRun() {
  console.log('\n========================================');
  console.log('🧪 DRY RUN - Testing Email Generation');
  console.log('(No emails will actually be sent)');
  console.log('========================================\n');

  try {
    await prisma.$connect();

    // טען משתמש
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
        dripCampaign: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`Testing for: ${user.firstName} ${user.lastName}`);
    console.log(`Language: ${user.language}\n`);

    // טען מילון
    const dict = await getEmailDictionary(user.language as Language);

    // בנה פרופיל
    const profile = await SmartEngagementOrchestrator['buildUserEngagementProfile'](user.id);

    // קבע מייל
    const emailToSend = await SmartEngagementOrchestrator['decideNextEmail'](profile, dict);

    if (!emailToSend) {
      console.log('❌ No email would be sent (this is unexpected!)');
      process.exit(1);
    }

    console.log('✅ EMAIL GENERATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📧 Email Type: ${emailToSend.type}`);
    console.log(`🎯 Priority: ${emailToSend.priority}`);
    console.log(`🌐 Language: ${user.language}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📝 SUBJECT:');
    console.log(`   "${emailToSend.subject}"\n`);

    console.log('🎣 HOOK (Opening):');
    console.log(`   "${emailToSend.content.hook}"\n`);

    console.log('📄 MAIN MESSAGE:');
    console.log('───────────────────────────────────────────────────');
    console.log(emailToSend.content.mainMessage);
    console.log('───────────────────────────────────────────────────\n');

    if (emailToSend.content.specificAction) {
      console.log('🎯 SPECIFIC ACTION:');
      console.log(`   "${emailToSend.content.specificAction}"\n`);
    }

    if (emailToSend.content.progressVisualization) {
      console.log('📊 PROGRESS:');
      console.log(`   ${emailToSend.content.progressVisualization}\n`);
    }

    console.log('💪 ENCOURAGEMENT:');
    console.log(`   "${emailToSend.content.encouragement}"\n`);

    // בדוק גם מייל ערב
    console.log('\n========================================');
    console.log('🌙 Testing Evening Email');
    console.log('========================================\n');

    const dailyActivity = await SmartEngagementOrchestrator['detectDailyActivity'](user.id);
    
    if (!dailyActivity.hasActivity) {
      console.log('❌ No activity today - evening email would NOT be sent\n');
    } else {
      console.log(`✅ Activity detected: ${dailyActivity.completedToday.join(', ')}\n`);
      
      const eveningEmail = await SmartEngagementOrchestrator['getEveningFeedbackEmail'](
        profile,
        dailyActivity,
        dict
      );

      if (eveningEmail) {
        console.log('✅ EVENING EMAIL GENERATED!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📧 Email Type: ${eveningEmail.type}`);
        console.log(`🌐 Language: ${user.language}`);
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📝 SUBJECT:');
        console.log(`   "${eveningEmail.subject}"\n`);

        console.log('🎣 HOOK:');
        console.log(`   "${eveningEmail.content.hook}"\n`);

        console.log('📄 MAIN MESSAGE:');
        console.log('───────────────────────────────────────────────────');
        console.log(eveningEmail.content.mainMessage);
        console.log('───────────────────────────────────────────────────\n');

        if (eveningEmail.content.todayProgress) {
          console.log('📊 TODAY\'S PROGRESS:');
          console.log(`   Items: ${eveningEmail.content.todayProgress.itemsCompleted.join(', ')}`);
          console.log(`   Progress Delta: ${eveningEmail.content.todayProgress.newCompletion}%\n`);
        }
      }
    }

    console.log('========================================');
    console.log('✅ DRY RUN COMPLETE!');
    console.log('========================================\n');

    console.log('📋 SUMMARY:');
    console.log(`   ✅ Daily email: ${emailToSend.type} in ${user.language}`);
    console.log(`   ${dailyActivity.hasActivity ? '✅' : '❌'} Evening email: ${dailyActivity.hasActivity ? `EVENING_FEEDBACK in ${user.language}` : 'Not sent (no activity)'}`);

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Verify the email content looks correct');
    console.log('   2. Check that language matches user preference');
    console.log('   3. If all good, test actual sending with:');
    console.log('      npm run engagement:daily');
    console.log('      npm run engagement:evening');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during dry run:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDryRun();