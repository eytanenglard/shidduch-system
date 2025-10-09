// src/scripts/checkEmailLogs.ts
import 'dotenv/config';
import prisma from '../lib/prisma';

const TEST_USER_ID = 'cmefd7ics0000xn0l6z2vcsjm';

async function checkEmailLogs() {
  console.log('\n========================================');
  console.log('📧 Email Campaign Status Check');
  console.log('========================================\n');

  try {
    await prisma.$connect();

    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      include: {
        dripCampaign: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`User: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}\n`);

    // בדוק אם הקמפיין קיים
    if (!user.dripCampaign) {
      console.log('❌ PROBLEM FOUND: No campaign record exists!');
      console.log('\n💡 This means:');
      console.log('   - The user is NOT enrolled in the email campaign');
      console.log('   - The campaign scripts will SKIP this user');
      console.log('\n🔧 Solution:');
      console.log('   Run the daily campaign once to auto-enroll:');
      console.log('   npm run engagement:daily');
      console.log('\n   Or manually enroll:');
      console.log(`   npx prisma studio`);
      console.log(`   Create UserDripCampaign for userId: ${TEST_USER_ID}`);
      
      await prisma.$disconnect();
      process.exit(1);
    }

    // אם הקמפיין קיים, הצג פרטים
    console.log('✅ Campaign Record Found!\n');
    console.log('Campaign Details:');
    console.log('─────────────────────────────────────');
    console.log(`Status:           ${user.dripCampaign.status}`);
    console.log(`Current Step:     ${user.dripCampaign.currentStep}`);
    console.log(`Last Email Type:  ${user.dripCampaign.lastSentType || 'None yet'}`);
    console.log(`Last Updated:     ${user.dripCampaign.updatedAt.toLocaleString('he-IL')}`);
    console.log(`Next Send Date:   ${user.dripCampaign.nextSendDate.toLocaleString('he-IL')}`);

    const now = new Date();
    const nextSend = user.dripCampaign.nextSendDate;
    
    if (nextSend > now) {
      const hoursUntil = Math.floor((nextSend.getTime() - now.getTime()) / (1000 * 60 * 60));
      console.log(`\n⏰ Next email scheduled in: ${hoursUntil} hours`);
    } else {
      console.log(`\n✅ Next email is DUE NOW (or overdue)`);
    }

    // Evening campaign counters
    if (user.dripCampaign.eveningEmailsCount && user.dripCampaign.eveningEmailsCount > 0) {
      console.log('\nEvening Emails:');
      console.log(`  Count:      ${user.dripCampaign.eveningEmailsCount}`);
      console.log(`  Last Sent:  ${user.dripCampaign.lastEveningEmailSent?.toLocaleString('he-IL') || 'Never'}`);
    }

    // AI Summary counters
    if (user.dripCampaign.aiSummaryCount && user.dripCampaign.aiSummaryCount > 0) {
      console.log('\nAI Summary Emails:');
      console.log(`  Count:      ${user.dripCampaign.aiSummaryCount}`);
      console.log(`  Last Sent:  ${user.dripCampaign.lastAiSummarySent?.toLocaleString('he-IL') || 'Never'}`);
    }

    // בדוק אם היו מיילים היום
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailsSentToday = user.dripCampaign.updatedAt >= today;
    
    console.log('\n📊 Today\'s Activity:');
    console.log(`  Emails sent today: ${emailsSentToday ? '✅ YES' : '❌ NO'}`);
    
    if (emailsSentToday) {
      console.log(`  Last email: ${user.dripCampaign.lastSentType}`);
      console.log(`  Sent at: ${user.dripCampaign.updatedAt.toLocaleTimeString('he-IL')}`);
    }

    console.log('\n========================================');
    console.log('💡 What to do next:');
    console.log('========================================\n');

    if (!emailsSentToday) {
      console.log('📧 To send emails NOW:');
      console.log('   npm run engagement:daily    # For daily campaign');
      console.log('   npm run engagement:evening  # For evening feedback\n');
    }

    console.log('🔍 To verify email delivery:');
    console.log(`   1. Check inbox: ${user.email}`);
    console.log('   2. Check spam/junk folder');
    console.log('   3. Check Gmail logs (if using Gmail)');
    console.log('   4. Verify GMAIL_USER and GMAIL_APP_PASSWORD in .env');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkEmailLogs();