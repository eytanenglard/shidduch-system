// scripts/backup-database.js
//
// 🎯 גיבוי מלא של הדאטאבייס - PostgreSQL
//node scripts/backup-database.js
// הרצה בסיסית:    
// גיבוי SQL:      node scripts/backup-database.js --format=sql
// גיבוי רק דאטה:  node scripts/backup-database.js --data-only
// גיבוי טבלה:     node scripts/backup-database.js --table=User,Profile
//
// דרישות: pg_dump חייב להיות מותקן (מגיע עם PostgreSQL)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// טוען .env מתיקיית shidduch-system גם אם מריצים מבחוץ
const envPath = path.join(__dirname, 'shidduch-system', '.env');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

// ═══════════════════════════════════════════════════════════
// הגדרות
// ═══════════════════════════════════════════════════════════

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ חסר DATABASE_URL בקובץ .env');
  process.exit(1);
}

// תיקיית גיבויים — תמיד ליד הסקריפט, לא תלוי בתיקייה שממנה מריצים
const BACKUP_DIR = path.join(__dirname, 'shidduch-system', 'backups');

// כמה גיבויים לשמור (ישנים יותר נמחקים)
const MAX_BACKUPS = 10;

// ═══════════════════════════════════════════════════════════
// פרסור ארגומנטים
// ═══════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    format: 'custom',   // custom (בינארי, הכי טוב לשחזור) | sql (קריא) | directory
    dataOnly: false,     // רק דאטה, בלי סכמה
    schemaOnly: false,   // רק סכמה, בלי דאטה
    tables: [],          // טבלאות ספציפיות (ריק = הכל)
    compress: true,      // דחיסה
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg === '--data-only') {
      options.dataOnly = true;
    } else if (arg === '--schema-only') {
      options.schemaOnly = true;
    } else if (arg.startsWith('--table=')) {
      options.tables = arg.split('=')[1].split(',').map(t => t.trim());
    } else if (arg === '--no-compress') {
      options.compress = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
📦 NeshamaTech Database Backup Script
======================================

שימוש:
  node scripts/backup-database.js [אופציות]

אופציות:
  --format=custom    גיבוי בינארי (ברירת מחדל, הכי טוב לשחזור)
  --format=sql       גיבוי כקובץ SQL קריא
  --format=directory גיבוי כתיקייה (טוב למקבילי)
  --data-only        גיבוי רק דאטה (בלי CREATE TABLE)
  --schema-only      גיבוי רק סכמה (בלי INSERT)
  --table=User,Profile  גיבוי טבלאות ספציפיות
  --no-compress      בלי דחיסה
  --verbose, -v      הדפסות מפורטות

דוגמאות:
  node scripts/backup-database.js                          # גיבוי מלא
  node scripts/backup-database.js --format=sql             # קובץ SQL קריא
  node scripts/backup-database.js --table=User,Profile     # רק טבלאות מסוימות
  node scripts/backup-database.js --data-only --format=sql # רק דאטה כ-SQL

שחזור:
  pg_restore -d DATABASE_URL backups/backup_XXXX.dump      # מגיבוי custom
  psql DATABASE_URL < backups/backup_XXXX.sql              # מגיבוי SQL
  `);
}

// ═══════════════════════════════════════════════════════════
// יצירת שם קובץ
// ═══════════════════════════════════════════════════════════

function generateBackupFilename(options) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  let suffix = '';
  if (options.dataOnly) suffix = '_data-only';
  if (options.schemaOnly) suffix = '_schema-only';
  if (options.tables.length > 0) suffix += `_tables-${options.tables.join('-')}`;

  const extensions = {
    custom: '.dump',
    sql: '.sql',
    directory: '',  // תיקייה
  };

  const ext = extensions[options.format] || '.dump';
  return `neshamatech_backup_${timestamp}${suffix}${ext}`;
}

// ═══════════════════════════════════════════════════════════
// ניקוי גיבויים ישנים
// ═══════════════════════════════════════════════════════════

function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('neshamatech_backup_'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // מהחדש לישן

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      if (fs.statSync(file.path).isDirectory()) {
        fs.rmSync(file.path, { recursive: true });
      } else {
        fs.unlinkSync(file.path);
      }
      console.log(`   🗑️  נמחק גיבוי ישן: ${file.name}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// בדיקת תקינות pg_dump
// ═══════════════════════════════════════════════════════════

function checkPgDump() {
  try {
    const version = execSync('pg_dump --version', { encoding: 'utf-8' }).trim();
    console.log(`   🔧 ${version}`);
    return true;
  } catch {
    console.error('❌ pg_dump לא נמצא!');
    console.error('   התקן PostgreSQL client:');
    console.error('   macOS:  brew install libpq && brew link --force libpq');
    console.error('   Ubuntu: sudo apt install postgresql-client');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// בניית פקודת pg_dump
// ═══════════════════════════════════════════════════════════

function buildPgDumpCommand(options, outputPath) {
  const parts = ['pg_dump'];

  // מפרקים את ה-URL ומעבירים את הסיסמה דרך PGPASSWORD (לא ב-command line)
  const url = new URL(DATABASE_URL);
  process.env.PGPASSWORD = decodeURIComponent(url.password);
  parts.push(`--host="${url.hostname}"`);
  parts.push(`--port="${url.port || 5432}"`);
  parts.push(`--username="${decodeURIComponent(url.username)}"`);
  parts.push(`--dbname="${url.pathname.slice(1)}"`);
  if (url.searchParams.get('sslmode')) {
    parts.push(`--no-password`); // סיסמה מגיעה מ-PGPASSWORD
  }

  // פורמט
  const formatMap = { custom: 'c', sql: 'p', directory: 'd' };
  parts.push(`--format=${formatMap[options.format] || 'c'}`);

  // דחיסה (רק ל-custom)
  if (options.compress && options.format === 'custom') {
    parts.push('--compress=6');
  }

  // דאטה/סכמה
  if (options.dataOnly) parts.push('--data-only');
  if (options.schemaOnly) parts.push('--schema-only');

  // טבלאות ספציפיות
  for (const table of options.tables) {
    // Prisma שומר שמות טבלאות עם אותיות גדולות
    parts.push(`--table='"${table}"'`);
  }

  // verbose
  if (options.verbose) parts.push('--verbose');

  // no owner (מקל על שחזור בסביבה אחרת)
  parts.push('--no-owner');
  parts.push('--no-privileges');

  // output
  parts.push(`--file="${outputPath}"`);

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════
// סטטיסטיקות מהירות (כמה רשומות בכל טבלה)
// ═══════════════════════════════════════════════════════════

async function getTableStats() {
  // נשתמש ב-Prisma לספירה מהירה
  let PrismaClient;
  try {
    PrismaClient = require('@prisma/client').PrismaClient;
  } catch {
    return null; // אם Prisma לא זמין, נדלג
  }

  const prisma = new PrismaClient();

  try {
    const counts = await Promise.allSettled([
      prisma.user.count().then(c => ({ table: 'User', count: c })),
      prisma.profile.count().then(c => ({ table: 'Profile', count: c })),
      prisma.questionnaireResponse.count().then(c => ({ table: 'QuestionnaireResponse', count: c })),
      prisma.matchSuggestion.count().then(c => ({ table: 'MatchSuggestion', count: c })),
      prisma.potentialMatch.count().then(c => ({ table: 'PotentialMatch', count: c })),
      prisma.profileMetrics.count().then(c => ({ table: 'ProfileMetrics', count: c })),
      prisma.scannedPair.count().then(c => ({ table: 'ScannedPair', count: c })),
      prisma.scanSession.count().then(c => ({ table: 'ScanSession', count: c })),
      prisma.userImage.count().then(c => ({ table: 'UserImage', count: c })),
      prisma.referral.count().then(c => ({ table: 'Referral', count: c })),
      prisma.userAlert.count().then(c => ({ table: 'UserAlert', count: c })),
      prisma.feedback.count().then(c => ({ table: 'Feedback', count: c })),
    ]);

    return counts
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  } catch {
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// ═══════════════════════════════════════════════════════════
// פונקציה ראשית
// ═══════════════════════════════════════════════════════════

async function main() {
  const options = parseArgs();

  console.log('\n' + '═'.repeat(60));
  console.log('📦 NeshamaTech - גיבוי דאטאבייס');
  console.log('═'.repeat(60) + '\n');

  // 1. בדיקת pg_dump
  console.log('🔍 בדיקת כלים...');
  if (!checkPgDump()) process.exit(1);

  // 2. סטטיסטיקות לפני גיבוי
  console.log('\n📊 סטטיסטיקות דאטאבייס:');
  const stats = await getTableStats();
  if (stats) {
    let totalRecords = 0;
    for (const { table, count } of stats) {
      console.log(`   ${table}: ${count.toLocaleString()} רשומות`);
      totalRecords += count;
    }
    console.log(`   ─────────────────────────`);
    console.log(`   סה"כ: ${totalRecords.toLocaleString()} רשומות\n`);
  } else {
    console.log('   (לא ניתן לספור - Prisma לא זמין)\n');
  }

  // 3. יצירת תיקיית גיבויים
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 נוצרה תיקייה: ${BACKUP_DIR}`);
  }

  // 4. שם קובץ
  const filename = generateBackupFilename(options);
  const outputPath = path.join(BACKUP_DIR, filename);

  // 5. הגדרות הגיבוי
  console.log('⚙️  הגדרות:');
  console.log(`   פורמט: ${options.format}`);
  if (options.dataOnly) console.log('   מצב: דאטה בלבד');
  if (options.schemaOnly) console.log('   מצב: סכמה בלבד');
  if (options.tables.length > 0) console.log(`   טבלאות: ${options.tables.join(', ')}`);
  console.log(`   קובץ: ${filename}`);

  // 6. בניית הפקודה
  const command = buildPgDumpCommand(options, outputPath);
  if (options.verbose) {
    console.log(`\n📋 פקודה: ${command}`);
  }

  // 7. ביצוע הגיבוי
  console.log('\n🚀 מתחיל גיבוי...');
  const startTime = Date.now();

  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: options.verbose ? 'inherit' : 'pipe',
      timeout: 5 * 60 * 1000, // 5 דקות timeout
    });
  } catch (error) {
    console.error('\n❌ שגיאה בגיבוי!');
    console.error(error.stderr || error.message);
    process.exit(1);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // 8. אימות תקינות הגיבוי (רק ל-custom format)
  if (options.format === 'custom' && fs.existsSync(outputPath)) {
    console.log('🔍 מאמת תקינות הגיבוי...');
    try {
      execSync(`pg_restore --list "${outputPath}"`, { stdio: 'pipe' });
      console.log('   ✅ הגיבוי תקין');
    } catch {
      console.error('   ❌ הגיבוי פגום! מוחק...');
      fs.unlinkSync(outputPath);
      process.exit(1);
    }
  }

  // 9. בדיקת גודל הקובץ
  let fileSize = 0;
  if (fs.existsSync(outputPath)) {
    const stat = fs.statSync(outputPath);
    if (stat.isDirectory()) {
      // חישוב גודל תיקייה
      let totalSize = 0;
      const walkDir = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile()) totalSize += fs.statSync(fullPath).size;
          else if (entry.isDirectory()) walkDir(fullPath);
        }
      };
      walkDir(outputPath);
      fileSize = totalSize;
    } else {
      fileSize = stat.size;
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // 10. ניקוי ישנים
  cleanOldBackups();

  // 11. סיכום
  console.log('\n' + '═'.repeat(60));
  console.log('✅ גיבוי הושלם בהצלחה!');
  console.log('═'.repeat(60));
  console.log(`   📁 קובץ: ${outputPath}`);
  console.log(`   📦 גודל: ${formatSize(fileSize)}`);
  console.log(`   ⏱️  זמן: ${durationSec} שניות`);
  console.log(`   📅 תאריך: ${new Date().toLocaleString('he-IL')}`);
  console.log('═'.repeat(60));

  // 11. הנחיות שחזור
  console.log('\n📋 לשחזור:');
  if (options.format === 'sql') {
    console.log(`   psql $DATABASE_URL < "${outputPath}"`);
  } else if (options.format === 'custom') {
    console.log(`   pg_restore --clean --if-exists -d $DATABASE_URL "${outputPath}"`);
  } else if (options.format === 'directory') {
    console.log(`   pg_restore --clean --if-exists -d $DATABASE_URL "${outputPath}"`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה:', e.message);
    process.exit(1);
  });