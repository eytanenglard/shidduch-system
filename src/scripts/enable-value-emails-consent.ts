// src/scripts/enable-value-emails-consent.ts
//
// One-time script to enable engagementEmailsConsent for all active, verified users.
// This allows the Value Email campaign to start sending to existing users.
//
// Usage:
//   npx tsx src/scripts/enable-value-emails-consent.ts          (dry run — shows count only)
//   npx tsx src/scripts/enable-value-emails-consent.ts --apply   (actually updates the database)

import 'dotenv/config';
import db from '../lib/prisma';

async function main() {
  const isDryRun = !process.argv.includes('--apply');

  console.log('\n========================================');
  console.log('📧 Enable Value Email Consent');
  console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (use --apply to execute)' : 'APPLYING CHANGES'}`);
  console.log('========================================\n');

  await db.$connect();
  console.log('✅ Database connected\n');

  // Count users who will be affected
  const affectedCount = await db.user.count({
    where: {
      status: 'ACTIVE',
      isVerified: true,
      engagementEmailsConsent: false,
    },
  });

  const alreadyEnabled = await db.user.count({
    where: {
      engagementEmailsConsent: true,
    },
  });

  const totalActive = await db.user.count({
    where: { status: 'ACTIVE' },
  });

  console.log(`📊 Total active users:           ${totalActive}`);
  console.log(`✅ Already have consent enabled:  ${alreadyEnabled}`);
  console.log(`🔄 Will be updated:              ${affectedCount}`);

  if (affectedCount === 0) {
    console.log('\n✨ No users to update. All eligible users already have consent enabled.');
    await db.$disconnect();
    return;
  }

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN — no changes made.');
    console.log('   Run with --apply to update the database:');
    console.log('   npx tsx src/scripts/enable-value-emails-consent.ts --apply\n');
    await db.$disconnect();
    return;
  }

  // Apply the update
  const result = await db.user.updateMany({
    where: {
      status: 'ACTIVE',
      isVerified: true,
      engagementEmailsConsent: false,
    },
    data: {
      engagementEmailsConsent: true,
    },
  });

  console.log(`\n✅ Updated ${result.count} users — engagementEmailsConsent set to true.`);
  console.log('========================================\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('💥 Error:', err);
  process.exit(1);
});
