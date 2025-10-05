// src/lib/engagement/userEngagementService.ts
import prisma from '@/lib/prisma';
import { notificationService } from './notificationService';
import { profileFeedbackService } from '@/lib/services/profileFeedbackService';
import aiService from '@/lib/services/aiService';
import { generateNarrativeProfile } from '@/lib/services/profileAiService';
import { getQuestionnaireQuestionsDictionary } from '@/lib/dictionaries';
import { CampaignStatus, User, Profile, UserImage, QuestionnaireResponse } from '@prisma/client';

type FullUser = User & {
  profile: Profile | null;
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
};

export class UserEngagementService {

  static async processScheduledCommunications() {
    console.log('[Cron Job] Starting to process scheduled communications...');
    const now = new Date();
    const campaignsToProcess = await prisma.userDripCampaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        nextSendDate: { lte: now },
      },
      include: {
        user: {
          include: {
            profile: true,
            images: true,
            questionnaireResponses: { orderBy: { lastSaved: 'desc' }, take: 1 },
          },
        },
      },
    });

    console.log(`[Cron Job] Found ${campaignsToProcess.length} campaigns to process.`);
    let communicationsSent = 0;
    
    for (const campaign of campaignsToProcess) {
      if (!campaign.user || !campaign.user.marketingConsent) {
        await this.updateCampaignStatus(campaign.id, CampaignStatus.PAUSED);
        continue;
      }

      const sentType = await this.sendNextCommunicationInSequence(campaign.user as FullUser, campaign.lastSentType);

      if (sentType) {
        communicationsSent++;
        const nextStep = campaign.currentStep + 1;
        const nextDelayDays = this.getDelayForNextStep(nextStep);

        if (nextDelayDays === null) {
          await this.updateCampaignStatus(campaign.id, CampaignStatus.COMPLETED);
        } else {
          await prisma.userDripCampaign.update({
            where: { id: campaign.id },
            data: {
              currentStep: nextStep,
              lastSentType: sentType,
              nextSendDate: new Date(now.getTime() + nextDelayDays * 24 * 60 * 60 * 1000),
            },
          });
        }
      } else {
        await prisma.userDripCampaign.update({
          where: { id: campaign.id },
          data: {
            nextSendDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log(`[Cron Job] Finished processing. Sent ${communicationsSent} communications.`);
    return { processed: campaignsToProcess.length, sent: communicationsSent };
  }

  private static async sendNextCommunicationInSequence(user: FullUser, lastSentType: string | null): Promise<string | null> {
    const profileCompletion = user.isProfileComplete;
    const qr = user.questionnaireResponses[0];
    const hasAnsweredQuestionnaire = qr && (qr.worldsCompleted?.length || 0) > 0;

    // Condition for Profile Nudge (Day ~4)
    if ((!profileCompletion || user.images.length < 3) && lastSentType !== 'profile_nudge') {
      const questionsDict = await getQuestionnaireQuestionsDictionary('he');
      const report = await profileFeedbackService.compileFeedbackReport(user.id, 'he', questionsDict);
      await notificationService.sendProfileNudge(user, report.missingProfileItems.slice(0, 3));
      return 'profile_nudge';
    }

    // Condition for AI Insight (Day ~8)
    if (hasAnsweredQuestionnaire && !profileCompletion && lastSentType !== 'ai_insight') {
      const narrativeProfile = await generateNarrativeProfile(user.id);
      if (narrativeProfile) {
        const analysis = await aiService.getProfileAnalysis(narrativeProfile);
        if (analysis) {
          await notificationService.sendAiInsight(user, analysis.personalitySummary);
          return 'ai_insight';
        }
      }
    }
    
    // Add future conditions here...

    return null;
  }
  
  private static getDelayForNextStep(step: number): number | null {
    const delays: { [key: number]: number } = {
      2: 4, // 4 days after welcome
      3: 4, // 4 days after nudge
      4: 6, // 6 days after AI insight
    };
    return delays[step] || null;
  }

  static async startCampaignForNewUser(userId: string) {
    // This function will be called AFTER the existing welcome email is sent.
    // It only schedules the *first drip email*.
    const firstDripDelay = this.getDelayForNextStep(2);
    if (firstDripDelay) {
      await prisma.userDripCampaign.create({
        data: {
          userId: userId,
          currentStep: 2,
          nextSendDate: new Date(Date.now() + firstDripDelay * 24 * 60 * 60 * 1000),
          status: CampaignStatus.ACTIVE,
          lastSentType: 'welcome',
        },
      });
    }
  }

  private static async updateCampaignStatus(campaignId: string, status: CampaignStatus) {
    await prisma.userDripCampaign.update({
      where: { id: campaignId },
      data: { status },
    });
  }
}