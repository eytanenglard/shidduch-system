const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// פונקציית עזר לניקוי טקסט ל-CSV
const cleanText = (text: any) => {
  if (text === null || text === undefined) return '';
  const str = String(text);
  // אם יש פסיק, ירידת שורה או מרכאות - עוטפים במרכאות כדי לא לשבור את ה-CSV
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// פונקציה שמפרקת את ה-JSON לעמודות שטוחות
// דוגמה: { "hobby": "sport" } נהפך לעמודה "prefix_hobby" עם ערך "sport"
const flattenObject = (obj: any, prefix: string) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const flattened: Record<string, string> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = `${prefix}_${key}`; // שם העמודה החדש

    if (Array.isArray(value)) {
      // אם זה מערך (למשל רשימת תחביבים), נחבר אותם עם נקודה-פסיק
      flattened[newKey] = value.join('; ');
    } else if (typeof value === 'object' && value !== null) {
      // אם זה אובייקט פנימי, נהפוך לטקסט (נדיר בשאלונים שטוחים)
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = String(value);
    }
  });

  return flattened;
};

async function main() {
  console.log('--- 🧹 מתחיל עיבוד וסידור נתונים ל-CSV שטוח... ---');

  try {
    const users = await prisma.user.findMany({
      where: {
        profile: { isNot: null }, 
        questionnaireResponses: { some: {} }
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            gender: true,
            birthDate: true,
            religiousLevel: true, // הוספתי שדות שימושיים מהפרופיל
            maritalStatus: true
          }
        },
        questionnaireResponses: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            valuesAnswers: true,
            personalityAnswers: true,
            relationshipAnswers: true,
            partnerAnswers: true,
            religionAnswers: true,
            updatedAt: true
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('⚠️ לא נמצאו משתמשים.');
      return;
    }

    console.log(`✅ מעבד ${users.length} משתמשים...`);

    // שלב 1: יצירת רשימה של כל המשתמשים כשהם "שטוחים"
    const processedRows = users.map((u: any) => {
      const p = u.profile || {};
      const q = u.questionnaireResponses[0] || {};

      // חישוב גיל
      let age = '';
      if (p.birthDate) {
        const diff = Date.now() - new Date(p.birthDate).getTime();
        age = Math.abs(new Date(diff).getUTCFullYear() - 1970).toString();
      }

      // פירוק התשובות לעמודות נפרדות
      const flatValues = flattenObject(q.valuesAnswers, 'Val');
      const flatPersonality = flattenObject(q.personalityAnswers, 'Pers');
      const flatRelationship = flattenObject(q.relationshipAnswers, 'Rel');
      const flatPartner = flattenObject(q.partnerAnswers, 'Part');
      const flatReligion = flattenObject(q.religionAnswers, 'Faith');

      // יצירת אובייקט אחד גדול לכל שורה
      return {
        ID: u.id,
        Email: u.email,
        Gender: p.gender,
        Age: age,
        Status: p.maritalStatus,
        ReligiousLevel: p.religiousLevel,
        LastUpdated: q.updatedAt ? new Date(q.updatedAt).toISOString() : '',
        ...flatValues,
        ...flatPersonality,
        ...flatRelationship,
        ...flatPartner,
        ...flatReligion
      };
    });

    // שלב 2: איסוף כל הכותרות (Headers) האפשריות מכל המשתמשים
    // (כי למשתמש אחד יכולה להיות תשובה שאין לאחר)
    const allHeadersSet = new Set<string>();
    // קודם נוסיף את שדות הבסיס כדי שיהיו בהתחלה
    ['ID', 'Email', 'Gender', 'Age', 'Status', 'ReligiousLevel', 'LastUpdated'].forEach(h => allHeadersSet.add(h));
    
    // אחר כך נוסיף את כל שאר השאלות שמצאנו
    processedRows.forEach(row => {
      Object.keys(row).forEach(key => allHeadersSet.add(key));
    });

    const headers = Array.from(allHeadersSet);

    // שלב 3: יצירת ה-CSV
    const csvLines = [
      headers.join(','), // שורת כותרת
      ...processedRows.map(row => {
        return headers.map(header => {
            // לכל עמודה, נבדוק אם יש ערך בשורה הזו, ואם לא נשים ריק
            // @ts-ignore
            return cleanText(row[header] || ''); 
        }).join(',');
      })
    ];

    const fileName = 'organized_users_data.csv';
    const csvContent = '\uFEFF' + csvLines.join('\n'); // BOM לעברית

    fs.writeFileSync(fileName, csvContent);
    console.log(`\n✅ הקובץ המסודר נוצר בהצלחה: ${fileName}`);
    console.log(`📊 מספר עמודות (שאלות): ${headers.length}`);

  } catch (error) {
    console.error('❌ שגיאה:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());