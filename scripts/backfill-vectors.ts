// file: scripts/backfill-vectors.ts

import prisma from '../src/lib/prisma'; // Adjust path if your prisma client is elsewhere
import { updateUserAiProfile } from '../src/lib/services/profileAiService'; // Adjust path if needed

/**
 * This script iterates through all users and triggers the generation of their AI profile vector.
 * It's designed to be run once to populate the database for existing users.
 */
async function main() {
  console.log('Starting backfill process for user AI vectors...');

  try {
    // Fetch only users who do NOT have a vector yet for efficiency on re-runs.
    const usersToProcess = await prisma.user.findMany({
      where: {
        profile: {
          isNot: null, // Ensure the user has a profile record
          // --- START OF FIX ---
          // Use `is: null` to check for the absence of a related record.
          vector: {
            is: null,
          },
          // --- END OF FIX ---
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (usersToProcess.length === 0) {
      console.log('All users with profiles already have an AI profile vector. No action needed.');
      return;
    }

    console.log(`Found ${usersToProcess.length} users to process.`);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      console.log(`\n[${i + 1}/${usersToProcess.length}] Processing user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      
      try {
        // The updateUserAiProfile function already handles narrative generation,
        // embedding, and saving to the database.
        await updateUserAiProfile(user.id);
        console.log(`✅ Successfully updated vector for user ID: ${user.id}`);
        successCount++;
      } catch (e) {
        console.error(`❌ Failed to update vector for user ID: ${user.id}`, e);
        errorCount++;
      }

      // IMPORTANT: Add a delay to avoid hitting API rate limits.
      // 1-2 requests per second is usually safe. 500ms = 2 req/s.
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n---------------------------------');
    console.log('Backfill process completed.');
    console.log(`- Successful updates: ${successCount}`);
    console.log(`- Failed updates: ${errorCount}`);
    console.log('---------------------------------');

  } catch (error) {
    console.error('A critical error occurred during the backfill script:', error);
  } finally {
    // Ensure the Prisma client is disconnected.
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Execute the main function
main().catch((e) => {
  console.error(e);
  process.exit(1);
});