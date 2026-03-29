Create a new cron job / scheduled script for: $ARGUMENTS

Follow the existing script architecture:

1. **Check existing scripts for patterns:**
   - `src/scripts/runSmartEngagement.ts` — engagement orchestrator
   - `src/scripts/runValueEmails.ts` — segmented email campaigns
   - `src/scripts/runEveningEngagement.ts` — time-specific engagement
   - `src/scripts/activate-pending-users.ts` — maintenance task
   - `src/scripts/create-missing-profiles.ts` — data repair

2. **Script structure:**
   ```typescript
   // src/scripts/<scriptName>.ts
   import { prisma } from '@/lib/prisma';

   async function main() {
     console.log(`[${new Date().toISOString()}] Starting <scriptName>...`);
     try {
       // Business logic here
       console.log('Completed successfully');
     } catch (error) {
       console.error('Failed:', error);
       process.exit(1);
     } finally {
       await prisma.$disconnect();
     }
   }

   main();
   ```

3. **For engagement scripts:**
   - Use or extend existing orchestrators (SmartEngagementOrchestrator, ValueEmailOrchestrator, DailySuggestionOrchestrator)
   - Handle multi-channel: email (Resend) + WhatsApp (Twilio) + push (Expo)
   - Include rate limiting and cooldown logic
   - Log everything — these run unattended

4. **Cron API route (if needed):**
   - Create `src/app/api/cron/<name>/route.ts`
   - Verify `CRON_SECRET` header for security
   - Return structured response: `{ success, processed, errors }`

5. **Running:**
   - Local: `npx tsx src/scripts/<scriptName>.ts`
   - Production: Heroku Scheduler or API cron route
   - Always test locally with a small subset first

IMPORTANT:
- Always add timeout handling for long-running operations
- Prisma disconnect in finally block
- Log start/end times and counts processed
- Handle partial failures — don't let one user's error stop the entire batch
- Be mindful of Gemini API rate limits if the script uses AI
- Check `INTERNAL_API_SECRET` or `CRON_SECRET` for authentication
