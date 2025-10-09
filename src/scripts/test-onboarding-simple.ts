// src/scripts/test-onboarding-simple.ts
import 'dotenv/config';
import db from '../lib/prisma.js';

async function testOnboarding() {
const userId = 'cmefd7ics0000xn0l6z2vcsjm'; // <-- עדכן את זה  
  console.log('🧪 Testing Onboarding System');
  console.log('Testing user: Eytan Englard\n');
  console.log('='.repeat(70));
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { 
          orderBy: { lastSaved: 'desc' }, 
          take: 1 
        },
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const daysInSystem = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // בדיקות
    const hasPhoto = user.images.length >= 1;
    const hasAbout = user.profile?.about && user.profile.about.length >= 50;
    const hasPreferences = user.profile?.preferredAgeMin && user.profile?.preferredAgeMax;
    
    // חישוב שאלון
    let questionnaireScore = 0;
    const qr = user.questionnaireResponses[0];
    if (qr) {
      const worlds = ['valuesAnswers', 'personalityAnswers', 'relationshipAnswers', 
                      'partnerAnswers', 'religionAnswers'];
      let totalAnswered = 0;
      worlds.forEach(w => {
        const answers = qr[w];
        if (Array.isArray(answers)) totalAnswered += answers.length;
      });
      questionnaireScore = Math.min((totalAnswered / 50) * 100, 100);
    }
    const hasQuestionnaire = questionnaireScore >= 80;

    // ציון כולל
    let score = 0;
    if (hasPhoto) score += 30;
    if (hasAbout) score += 25;
    if (hasQuestionnaire) score += 30;
    if (hasPreferences) score += 15;

    // הצעד הבא
    let nextStep = '';
    if (!hasPhoto) nextStep = 'העלאת תמונת פרופיל';
    else if (!hasAbout) nextStep = 'כתיבת תיאור אישי (מינימום 50 תווים)';
    else if (!hasQuestionnaire) nextStep = 'השלמת השאלון (צריך 80%+)';
    else if (!hasPreferences) nextStep = 'הגדרת העדפות גיל';
    else nextStep = 'הפרופיל מוכן!';

    // הצגה
    console.log('\n📊 מצב הפרופיל של איתן:\n');
    console.log('User ID:', userId);
    console.log('ימים במערכת:', daysInSystem);
    console.log('ציון השלמה:', Math.round(score) + '%');
    console.log('\nמה הושלם:');
    console.log('  📷 תמונה:', hasPhoto ? '✅ כן' : '❌ לא');
    console.log('  📝 תיאור אישי:', hasAbout ? '✅ כן' : '❌ לא');
    console.log('  📋 שאלון (80%+):', hasQuestionnaire ? `✅ כן (${Math.round(questionnaireScore)}%)` : `❌ לא (${Math.round(questionnaireScore)}%)`);
    console.log('  🎯 העדפות גיל:', hasPreferences ? '✅ כן' : '❌ לא');
    console.log('\nהצעד הבא שלו:', nextStep);
    
    // פרטי תמונות
    if (user.images.length > 0) {
      console.log(`\nתמונות: ${user.images.length} תמונות`);
    }
    
    // פרטי שאלון
    if (qr) {
      console.log('\nפירוט השאלון:');
      const worlds = {
        valuesAnswers: 'ערכים',
        personalityAnswers: 'אישיות',
        relationshipAnswers: 'זוגיות',
        partnerAnswers: 'פרטנר',
        religionAnswers: 'דת'
      };
      
      Object.entries(worlds).forEach(([key, label]) => {
        const answers = qr[key as keyof typeof qr];
        const count = Array.isArray(answers) ? answers.length : 0;
        console.log(`  ${label}: ${count} תשובות`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📧 מה יקרה במערכת האוטומטית?\n');
    
    if (daysInSystem > 14) {
      console.log(`ℹ️  איתן עבר את תקופת ה-onboarding (יום ${daysInSystem})`);
      console.log('   מיילי onboarding נשלחים רק בימים: 1, 3, 7, 10, 14');
      console.log('\n   עכשיו המערכת תשלח רק:');
      console.log('   • התראות על הצעות שידוך (כשיש)');
      console.log('   • מייל ערך שבועי (אם הפרופיל מוכן)');
    } else {
      const shouldSend = [1, 3, 7, 10, 14].includes(daysInSystem);
      if (shouldSend) {
        console.log(`✅ היום (יום ${daysInSystem}) צריך לשלוח מייל onboarding`);
      } else {
        console.log(`⏭️  יום ${daysInSystem} - אין מייל מתוזמן`);
        console.log('   המייל הבא יהיה ביום:', 
          [1, 3, 7, 10, 14].find(d => d > daysInSystem) || '14 (אחרון)');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📋 סיכום:\n');
    
    if (score >= 70) {
      console.log('🎉 הפרופיל של איתן מוכן להתחיל לקבל הצעות שידוך!');
    } else {
      console.log(`📈 חסרים ${100 - Math.round(score)}% להשלמת הפרופיל`);
      console.log(`   הצעד הבא: ${nextStep}`);
    }
    
  } catch (error) {
    console.error('\n❌ שגיאה:', error);
  } finally {
    await db.$disconnect();
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ בדיקה הסתיימה\n');
}

testOnboarding();