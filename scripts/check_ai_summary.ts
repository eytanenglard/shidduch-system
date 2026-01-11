const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🤖 בודק נתוני aiProfileSummary (מתוך טבלת Profile)... ---');

  const users = await prisma.user.findMany({
    where: {
      role: 'CANDIDATE',
      isProfileComplete: true,
      profile: {
        isNot: null // מוודא שיש רשומת פרופיל
      }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      // שליפת השדה מתוך ה-Profile המקושר
      profile: {
        select: {
          aiProfileSummary: true
        }
      }
    }
  });

  if (users.length === 0) {
    console.log('❌ לא נמצאו משתמשים עם פרופיל מלא.');
    return;
  }

  // כותרות ל-CSV
  const headers = ['Email', 'Full Name', 'Has AI Summary?', 'Summary Content'];

  const rows = users.map(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().replace(/,/g, ' ');

    // גישה לנתונים דרך u.profile
    const rawSummary = u.profile?.aiProfileSummary;
    
    // בדיקה האם יש תוכן
    const hasSummary = rawSummary ? 'Yes' : 'No';

    // המרת ה-JSON לטקסט קריא ל-CSV
    let summaryContent = '';
    
    if (rawSummary) {
      // אם זה כבר סטרינג, משתמשים בו, אחרת ממירים JSON לסטרינג
      if (typeof rawSummary === 'string') {
        summaryContent = rawSummary;
      } else {
        summaryContent = JSON.stringify(rawSummary);
      }
    }

    // ניקוי: החלפת גרשיים כפולים למניעת שבירת CSV ועטיפה במרכאות
    const safeSummary = `"${summaryContent.replace(/"/g, '""')}"`;

    return `${u.email},${fullName},${hasSummary},${safeSummary}`;
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const fileName = 'ai_summary_report.csv';
  
  fs.writeFileSync(fileName, csvContent);

  console.log(`\n✅ הקובץ נוצר בהצלחה: ${fileName}`);
  console.log(`סה"כ משתמשים שנבדקו: ${users.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());