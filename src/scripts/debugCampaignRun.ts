// src/scripts/debugCampaignRun.ts
import 'dotenv/config';
import prisma from '../lib/prisma';

async function debugCampaignRun() {
  console.log('\n========================================');
  console.log('🔍 Debug: Why didn\'t campaign run?');
  console.log('========================================\n');

  try {
    await prisma.$connect();

    // בדוק כמה משתמשים מתאימים לקריטריונים
    const eligibleUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        marketingConsent: true,
        isProfileComplete: false,
      },
      include: {
        dripCampaign: true,
      },
    });

    console.log(`✅ Found ${eligibleUsers.length} eligible users\n`);

    if (eligibleUsers.length === 0) {
      console.log('❌ NO USERS FOUND!');
      console.log('\nPossible reasons:');
      console.log('  1. All users have isProfileComplete: true');
      console.log('  2. No users have marketingConsent: true');
      console.log('  3. No users have status: ACTIVE');
      console.log('\nTo fix:');
      console.log('  Run: npm run test:force');
      console.log('  This will set the test user to incomplete profile');
    } else {
      console.log('Users that SHOULD receive emails:\n');
      eligibleUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Language: ${user.language}`);
        console.log(`   Has Campaign: ${user.dripCampaign ? '✅' : '❌ NO'}`);
        
        if (user.dripCampaign) {
          console.log(`   Last Email: ${user.dripCampaign.lastSentType || 'None'}`);
          console.log(`   Last Sent: ${user.dripCampaign.updatedAt.toLocaleString('he-IL')}`);
        }
        console.log('');
      });

      console.log('========================================');
      console.log('💡 Next Steps:');
      console.log('========================================\n');
      console.log('To send emails to these users:');
      console.log('  npm run engagement:daily\n');
      console.log('To test with evening campaign:');
      console.log('  npm run engagement:evening\n');
    }

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debugCampaignRun();