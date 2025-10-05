// src/scripts/process-drip-campaign.ts
import 'dotenv/config'; // Make sure to load environment variables
import { UserEngagementService } from '../lib/engagement/userEngagementService';
import prisma from '../lib/prisma';

async function run() {
  console.log('Starting daily drip campaign processing script...');
  try {
    await UserEngagementService.processScheduledCommunications();
    console.log('Script finished successfully.');
  } catch (error) {
    console.error('An error occurred during script execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();