// src/scripts/process-drip-campaign.ts
import 'dotenv/config';
import { UserEngagementService } from '../lib/engagement/userEngagementService.js';
import { OnboardingEngagementService } from '../lib/engagement/onboardingEngagementService.js'; // חדש!
import db from '../lib/prisma.js';

async function run() {
  console.log('Starting daily campaign processing...');
  
  try {
    // שלב 1: טפל במשתמשים ב-onboarding (ימים 1-14)
    console.log('\n[Onboarding] Processing new users...');
    await processOnboardingUsers();
    
    // שלב 2: טפל במשתמשים ותיקים (הקוד הקיים שלך)
    console.log('\n[Regular] Processing regular campaigns...');
    await UserEngagementService.processScheduledCommunications();
    
    console.log('\n✅ All processing completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

/**
 * פונקציה חדשה: טיפול במשתמשים בתקופת onboarding
 */
async function processOnboardingUsers() {
  const campaigns = await db.userDripCampaign.findMany({
    where: {
      status: 'ACTIVE',
      // רק משתמשים חדשים (עד 14 ימים)
      user: {
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      }
    },
    include: { user: true },
  });

  for (const campaign of campaigns) {
    try {
      const progress = await OnboardingEngagementService.analyzeOnboardingProgress(campaign.userId);
      
      // החלט אם לשלוח מייל היום
      const shouldSend = shouldSendOnboardingEmail(progress.daysInSystem, campaign.currentStep);
      
      if (shouldSend) {
        const emailData = await OnboardingEngagementService.createOnboardingEmail(progress);
        
        if (emailData) {
          await OnboardingEngagementService.sendOnboardingEmail(campaign.user, emailData);
          
          // עדכן שנשלח
          await db.userDripCampaign.update({
            where: { id: campaign.id },
            data: {
              currentStep: { increment: 1 },
              lastSentType: 'onboarding',
              nextSendDate: calculateNextOnboardingDate(progress.daysInSystem),
            },
          });
          
          console.log(`✓ Sent onboarding email to user ${campaign.userId} (day ${progress.daysInSystem})`);
        }
      }
    } catch (error) {
      console.error(`Error processing onboarding for ${campaign.userId}:`, error);
    }
  }
}

/**
 * מתי לשלוח מייל onboarding?
 */
function shouldSendOnboardingEmail(daysInSystem: number, currentStep: number): boolean {
  // ימים 1, 3, 7, 10, 14
  const sendDays = [1, 3, 7, 10, 14];
  return sendDays.includes(daysInSystem) && currentStep < sendDays.length;
}

/**
 * מתי המייל הבא?
 */
function calculateNextOnboardingDate(daysInSystem: number): Date {
  const schedule = [
    { day: 1, nextIn: 2 },  // יום 1 -> שלח שוב ביום 3
    { day: 3, nextIn: 4 },  // יום 3 -> שלח ביום 7
    { day: 7, nextIn: 3 },  // יום 7 -> שלח ביום 10
    { day: 10, nextIn: 4 }, // יום 10 -> שלח ביום 14
  ];
  
  const next = schedule.find(s => s.day === daysInSystem);
  const daysToAdd = next ? next.nextIn : 7;
  
  return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
}

run();