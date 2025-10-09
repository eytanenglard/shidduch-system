// src/scripts/testUserSimple.ts
import 'dotenv/config';
import prisma from '../lib/prisma';
import { Language } from '@prisma/client';

// 🔧 שנה את זה ל-ID של המשתמש שאתה רוצה לבדוק
const TEST_USER_ID = 'cmefd7ics0000xn0l6z2vcsjm';

async function testUser() {
  console.log('\n========================================');
  console.log('🧪 Testing User Language Support');
  console.log('========================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // 1️⃣ טען משתמש
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { 
          orderBy: { lastSaved: 'desc' },
          take: 1 
        },
        dripCampaign: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${TEST_USER_ID}`);
      process.exit(1);
    }

    // 2️⃣ הצג מידע על המשתמש
    console.log('👤 USER INFO:');
    console.log('─────────────────────────────');
    console.log(`ID:                ${user.id}`);
    console.log(`Name:              ${user.firstName} ${user.lastName}`);
    console.log(`Email:             ${user.email}`);
    console.log(`Language:          ${user.language} ${user.language === 'he' ? '🇮🇱 Hebrew' : '🇺🇸 English'}`);
    console.log(`Status:            ${user.status}`);
    console.log(`Marketing Consent: ${user.marketingConsent ? '✅ YES' : '❌ NO'}`);
    console.log(`Profile Complete:  ${user.isProfileComplete ? '✅ YES' : '❌ NO'}`);
    console.log(`Created:           ${user.createdAt.toLocaleString('he-IL')}`);
    console.log(`Last Login:        ${user.lastLogin?.toLocaleString('he-IL') || 'Never'}`);

    const daysInSystem = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`Days in system:    ${daysInSystem}`);

    // 3️⃣ בדוק סטטוס פרופיל
    console.log('\n📊 PROFILE STATUS:');
    console.log('─────────────────────────────');
    console.log(`Photos:            ${user.images.length}/3 ${user.images.length >= 3 ? '✅' : '❌'}`);
    
    if (user.profile) {
      const profileFields = [
        'birthDate',
        'city',
        'occupation',
        'education',
        'religiousLevel',
        'about',
      ];
      
      let filledFields = 0;
      profileFields.forEach(field => {
        const value = user.profile![field as keyof typeof user.profile];
        if (value) filledFields++;
      });
      
      console.log(`Profile Fields:    ${filledFields}/${profileFields.length} ${filledFields === profileFields.length ? '✅' : '❌'}`);
      console.log(`About Text:        ${user.profile.about ? '✅' : '❌'} ${user.profile.about ? `(${user.profile.about.length} chars)` : ''}`);
    } else {
      console.log('Profile:           ❌ Not created');
    }

    const questionnaire = user.questionnaireResponses[0];
    if (questionnaire) {
      console.log(`Questionnaire:     ${questionnaire.completed ? '✅ Complete' : '⏳ In progress'}`);
      console.log(`  - Values:        ${questionnaire.valuesCompleted ? '✅' : '❌'}`);
      console.log(`  - Personality:   ${questionnaire.personalityCompleted ? '✅' : '❌'}`);
      console.log(`  - Relationship:  ${questionnaire.relationshipCompleted ? '✅' : '❌'}`);
      console.log(`  - Partner:       ${questionnaire.partnerCompleted ? '✅' : '❌'}`);
      console.log(`  - Religion:      ${questionnaire.religionCompleted ? '✅' : '❌'}`);
    } else {
      console.log('Questionnaire:     ❌ Not started');
    }

    // 4️⃣ בדוק פעילות היום
    console.log('\n🌙 TODAY\'S ACTIVITY:');
    console.log('─────────────────────────────');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentPhotos = await prisma.userImage.count({
      where: {
        userId: user.id,
        createdAt: { gte: today }
      }
    });
    
    const recentQuestionnaire = await prisma.questionnaireResponse.count({
      where: {
        userId: user.id,
        lastSaved: { gte: today }
      }
    });
    
    const profileUpdatedToday = user.profile && user.profile.updatedAt >= today;
    
    const hasActivity = recentPhotos > 0 || recentQuestionnaire > 0 || profileUpdatedToday;
    
    console.log(`Active today:      ${hasActivity ? '✅ YES' : '❌ NO'}`);
    if (recentPhotos > 0) console.log(`  - Photos uploaded:  ${recentPhotos}`);
    if (recentQuestionnaire > 0) console.log(`  - Questionnaire updated: ✅`);
    if (profileUpdatedToday) console.log(`  - Profile updated: ✅`);

    // 5️⃣ בדוק מצב קמפיין
    console.log('\n📧 CAMPAIGN STATUS:');
    console.log('─────────────────────────────');
    
    if (user.dripCampaign) {
      console.log(`Campaign Status:   ${user.dripCampaign.status}`);
      console.log(`Current Step:      ${user.dripCampaign.currentStep}`);
      console.log(`Last Email Type:   ${user.dripCampaign.lastSentType || 'None'}`);
      console.log(`Last Email Sent:   ${user.dripCampaign.updatedAt.toLocaleString('he-IL')}`);
      console.log(`Next Send Date:    ${user.dripCampaign.nextSendDate.toLocaleString('he-IL')}`);
      
      const daysSinceLastEmail = Math.floor(
        (Date.now() - user.dripCampaign.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`Days since last:   ${daysSinceLastEmail}`);
      
      if (user.dripCampaign.eveningEmailsCount) {
        console.log(`Evening Emails:    ${user.dripCampaign.eveningEmailsCount}`);
        if (user.dripCampaign.lastEveningEmailSent) {
          console.log(`Last Evening:      ${user.dripCampaign.lastEveningEmailSent.toLocaleString('he-IL')}`);
        }
      }
      
      if (user.dripCampaign.aiSummaryCount) {
        console.log(`AI Summary Emails: ${user.dripCampaign.aiSummaryCount}`);
        if (user.dripCampaign.lastAiSummarySent) {
          console.log(`Last AI Summary:   ${user.dripCampaign.lastAiSummarySent.toLocaleString('he-IL')}`);
        }
      }
    } else {
      console.log('Campaign:          ❌ Not enrolled');
    }

    // 6️⃣ תחזית - איזה מיילים יישלחו
    console.log('\n🔮 EMAIL FORECAST:');
    console.log('─────────────────────────────');
    
    if (!user.marketingConsent) {
      console.log('❌ BLOCKED: User has not given marketing consent');
      console.log('   This user will NOT receive ANY emails');
    } else if (user.isProfileComplete) {
      console.log('ℹ️  Profile is complete - may not receive onboarding emails');
    } else {
      // קבע איזה מייל יישלח
      let willSendDaily = false;
      let emailType = '';
      
      const daysSinceLastEmail = user.dripCampaign 
        ? Math.floor((Date.now() - user.dripCampaign.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (daysSinceLastEmail >= 3) {
        if (daysInSystem === 1) {
          willSendDaily = true;
          emailType = 'ONBOARDING_DAY_1';
        } else if (daysInSystem === 3) {
          willSendDaily = true;
          emailType = 'ONBOARDING_DAY_3';
        } else if (daysInSystem === 7) {
          willSendDaily = true;
          emailType = 'ONBOARDING_DAY_7_INSIGHT';
        } else if (user.images.length < 3) {
          willSendDaily = true;
          emailType = 'PHOTO_NUDGE';
        } else if (!questionnaire?.completed) {
          willSendDaily = true;
          emailType = 'QUESTIONNAIRE_NUDGE';
        }
      }
      
      console.log('Daily Campaign:');
      if (willSendDaily) {
        console.log(`  ✅ Will send: ${emailType}`);
        console.log(`  📧 Language: ${user.language}`);
      } else if (daysSinceLastEmail < 3) {
        console.log(`  ⏳ Too soon (last email ${daysSinceLastEmail} days ago)`);
      } else {
        console.log(`  ℹ️  No email needed at this time`);
      }
      
      console.log('\nEvening Campaign:');
      if (hasActivity) {
        console.log(`  ✅ Will send: EVENING_FEEDBACK`);
        console.log(`  📧 Language: ${user.language}`);
      } else {
        console.log(`  ❌ Won't send (no activity today)`);
      }
    }

    // 7️⃣ סיכום והמלצות
    console.log('\n========================================');
    console.log('✅ Test Complete!');
    console.log('========================================\n');

    console.log('📋 SUMMARY:');
    console.log(`✅ Language: ${user.language}`);
    console.log(`${user.marketingConsent ? '✅' : '❌'} Marketing Consent: ${user.marketingConsent ? 'Enabled' : 'DISABLED'}`);
    console.log(`${user.images.length >= 3 ? '✅' : '❌'} Photos: ${user.images.length}/3`);
    console.log(`${questionnaire?.completed ? '✅' : '❌'} Questionnaire: ${questionnaire?.completed ? 'Complete' : 'Incomplete'}`);
    console.log(`${hasActivity ? '✅' : '❌'} Active Today: ${hasActivity ? 'Yes' : 'No'}`);

    console.log('\n💡 RECOMMENDATIONS:');
    if (!user.marketingConsent) {
      console.log('⚠️  Enable marketing consent to receive emails');
    }
    if (user.language !== 'he' && user.language !== 'en') {
      console.log(`⚠️  Unsupported language: ${user.language} (will default to Hebrew)`);
    }
    if (user.images.length < 3) {
      console.log('💡 User should upload more photos for better matches');
    }
    if (!questionnaire?.completed) {
      console.log('💡 User should complete the questionnaire');
    }

    await prisma.$disconnect();
    console.log('\n🔌 Database disconnected\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testUser();