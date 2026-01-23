import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- מתחיל סריקה ומחיקה של התאמות פוטנציאליות כפולות ---');

  // 1. מציאת קבוצות של כפילויות (זוגות שמופיעים יותר מפעם אחת)
  const duplicatesGroups = await prisma.potentialMatch.groupBy({
    by: ['maleUserId', 'femaleUserId'],
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1, // תביא לי רק את מי שיש לו יותר מרשומה אחת
        },
      },
    },
  });

  console.log(`⚠️ נמצאו ${duplicatesGroups.length} זוגות עם רשומות כפולות.`);

  let totalDeleted = 0;

  // 2. מעבר על כל קבוצה וטיפול בה
  for (const group of duplicatesGroups) {
    const { maleUserId, femaleUserId } = group;

    // שליפת כל הרשומות עבור הזוג הספציפי הזה
    const matches = await prisma.potentialMatch.findMany({
      where: {
        maleUserId,
        femaleUserId,
      },
      // כאן אנחנו קובעים את סדר העדיפויות - מי יישאר ראשון (ולא יימחק)
      orderBy: [
        { suggestionId: 'desc' }, // עדיפות 1: אם יש הצעה מקושרת (null יהיה בסוף)
        { status: 'asc' },        // עדיפות 2: סטטוס (כדי לא למחוק משהו שטופל)
        { aiScore: 'desc' },      // עדיפות 3: ציון גבוה יותר
        { scannedAt: 'desc' },    // עדיפות 4: הסריקה החדשה ביותר
      ],
    });

    // הרשומה הראשונה היא זו שאנחנו רוצים לשמור (בגלל המיון)
    const keepMatch = matches[0];
    
    // כל שאר הרשומות מיועדות למחיקה
    const deleteMatches = matches.slice(1);
    const idsToDelete = deleteMatches.map((m) => m.id);

    if (idsToDelete.length > 0) {
      // ביצוע המחיקה
      await prisma.potentialMatch.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });

      console.log(
        `🧹 זוג: ${maleUserId} + ${femaleUserId} | נשמר ID: ${keepMatch.id} | נמחקו: ${idsToDelete.length}`
      );
      
      totalDeleted += idsToDelete.length;
    }
  }

  console.log('--------------------------------------------------');
  console.log(`✅ התהליך הושלם.`);
  console.log(`🗑️ סה"כ רשומות שנמחקו: ${totalDeleted}`);
}

main()
  .catch((e) => {
    console.error('שגיאה במהלך הניקוי:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });