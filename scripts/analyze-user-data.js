// scripts/analyze-user-data.js
// 🎯 ניתוח הנתונים המיוצאים — הפקת סיכום סטטיסטי לשיפור השאלון

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'exports', 'user-data-analysis_2026-03-23T17-33-26.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const output = [];
const log = (text = '') => { output.push(text); console.log(text); };

log('═'.repeat(80));
log('📊 ניתוח נתוני משתמשים — NeshamaTech');
log('═'.repeat(80));

// ═══════════════════════════════════════════
// Helper: count occurrences
// ═══════════════════════════════════════════
function countValues(arr) {
  const counts = {};
  for (const v of arr) {
    if (v != null && v !== '' && v !== undefined) {
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function countArrayValues(arrOfArrs) {
  const counts = {};
  for (const arr of arrOfArrs) {
    if (Array.isArray(arr)) {
      for (const v of arr) {
        if (v) counts[v] = (counts[v] || 0) + 1;
      }
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function printDistribution(title, sorted, limit = 30) {
  log(`\n### ${title}`);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  for (const [val, count] of sorted.slice(0, limit)) {
    const pct = ((count / total) * 100).toFixed(1);
    log(`   ${val}: ${count} (${pct}%)`);
  }
  if (sorted.length > limit) log(`   ... ועוד ${sorted.length - limit} ערכים`);
}

const { profiles, questionnaires, profileTags, profileMetrics, rejectionFeedback, friendTestimonials } = data;

// ═══════════════════════════════════════════
// 1. דמוגרפיה בסיסית
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 1. דמוגרפיה בסיסית');
log('═'.repeat(80));

printDistribution('מגדר', countValues(profiles.map(p => p.gender)));
printDistribution('גיל', countValues(profiles.map(p => p.age).filter(a => a && a > 16 && a < 80)));
printDistribution('מצב משפחתי', countValues(profiles.map(p => p.maritalStatus)));
printDistribution('רמת דתיות', countValues(profiles.map(p => p.religiousLevel)));
printDistribution('מסע דתי', countValues(profiles.map(p => p.religiousJourney)));
printDistribution('עיר', countValues(profiles.map(p => p.city)));
printDistribution('מוצא', countValues(profiles.map(p => p.origin)));
printDistribution('השכלה', countValues(profiles.map(p => p.education)));
printDistribution('רמת השכלה', countValues(profiles.map(p => p.educationLevel)));
printDistribution('עיסוק', countValues(profiles.map(p => p.occupation)));
printDistribution('סוג שירות', countValues(profiles.map(p => p.serviceType)));
printDistribution('שומר נגיעה', countValues(profiles.map(p => p.shomerNegiah)));

// ═══════════════════════════════════════════
// 2. מאפיינים אישיים
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 2. מאפיינים אישיים');
log('═'.repeat(80));

printDistribution('סוג גוף', countValues(profiles.map(p => p.bodyType)));
printDistribution('גוון עור', countValues(profiles.map(p => p.appearanceTone)));
printDistribution('סגנון הופעה', countValues(profiles.map(p => p.groomingStyle)));
printDistribution('עישון', countValues(profiles.map(p => p.smokingStatus)));
printDistribution('כיסוי ראש (נשים)', countValues(profiles.filter(p => p.gender === 'FEMALE').map(p => p.headCovering)));
printDistribution('סוג כיפה (גברים)', countValues(profiles.filter(p => p.gender === 'MALE').map(p => p.kippahType)));
printDistribution('תכונות אופי (נבחרות)', countArrayValues(profiles.map(p => p.profileCharacterTraits)));
printDistribution('תחביבים (נבחרים)', countArrayValues(profiles.map(p => p.profileHobbies)));
printDistribution('סטטוס הורים', countValues(profiles.map(p => p.parentStatus)));
printDistribution('מספר אחים', countValues(profiles.map(p => p.siblings)));
printDistribution('גובה', countValues(profiles.map(p => p.height).filter(h => h)));

// ═══════════════════════════════════════════
// 3. העדפות בן/בת זוג
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 3. העדפות בן/בת זוג');
log('═'.repeat(80));

printDistribution('רמות דתיות מועדפות', countArrayValues(profiles.map(p => p.preferredReligiousLevels)));
printDistribution('מיקומים מועדפים', countArrayValues(profiles.map(p => p.preferredLocations)));
printDistribution('השכלה מועדפת', countArrayValues(profiles.map(p => p.preferredEducation)));
printDistribution('עיסוקים מועדפים', countArrayValues(profiles.map(p => p.preferredOccupations)));
printDistribution('מוצא מועדף', countArrayValues(profiles.map(p => p.preferredOrigins)));
printDistribution('מצב משפחתי מועדף', countArrayValues(profiles.map(p => p.preferredMaritalStatuses)));
printDistribution('סוגי שירות מועדפים', countArrayValues(profiles.map(p => p.preferredServiceTypes)));
printDistribution('תכונות אופי מועדפות', countArrayValues(profiles.map(p => p.preferredCharacterTraits)));
printDistribution('תחביבים מועדפים', countArrayValues(profiles.map(p => p.preferredHobbies)));
printDistribution('כיסוי ראש מועדף', countArrayValues(profiles.map(p => p.preferredHeadCoverings)));
printDistribution('סוג כיפה מועדף', countArrayValues(profiles.map(p => p.preferredKippahTypes)));
printDistribution('סוגי גוף מועדפים', countArrayValues(profiles.map(p => p.preferredBodyTypes)));
printDistribution('העדפת עישון', countValues(profiles.map(p => p.preferredSmokingStatus)));
printDistribution('שומר נגיעה מועדף', countValues(profiles.map(p => p.preferredShomerNegiah)));

// ═══════════════════════════════════════════
// 4. שדה "אודות" — ניתוח טקסטים חופשיים
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 4. מה אנשים כותבים על עצמם (about) — דוגמאות');
log('═'.repeat(80));

const aboutTexts = profiles.filter(p => p.about && p.about.length > 20).map(p => ({
  gender: p.gender,
  age: p.age,
  religiousLevel: p.religiousLevel,
  text: p.about,
  length: p.about.length,
}));
log(`\n   סה"כ ${aboutTexts.length} פרופילים עם "אודות" (מתוך ${profiles.length})`);
log(`   אורך ממוצע: ${Math.round(aboutTexts.reduce((s, t) => s + t.length, 0) / aboutTexts.length)} תווים`);

// Show sample texts by gender
for (const gender of ['MALE', 'FEMALE']) {
  const gTexts = aboutTexts.filter(t => t.gender === gender);
  log(`\n   --- ${gender === 'MALE' ? 'גברים' : 'נשים'} (${gTexts.length} טקסטים) ---`);
  // Show 15 random samples
  const shuffled = gTexts.sort(() => Math.random() - 0.5).slice(0, 15);
  for (const t of shuffled) {
    log(`\n   [${t.age}, ${t.religiousLevel}]:`);
    log(`   "${t.text.slice(0, 500)}${t.text.length > 500 ? '...' : ''}"`);
  }
}

// ═══════════════════════════════════════════
// 5. פרופיל Headline
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 5. כותרות פרופיל (profileHeadline)');
log('═'.repeat(80));

const headlines = profiles.filter(p => p.profileHeadline).map(p => p.profileHeadline);
log(`   סה"כ ${headlines.length} כותרות`);
for (const h of headlines.slice(0, 30)) {
  log(`   • "${h}"`);
}

// ═══════════════════════════════════════════
// 6. סיפור זוגי מעורר השראה
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 6. סיפורי זוגות מעוררי השראה');
log('═'.repeat(80));

const coupleStories = profiles.filter(p => p.inspiringCoupleStory).map(p => ({
  gender: p.gender,
  text: p.inspiringCoupleStory,
}));
log(`   סה"כ ${coupleStories.length} סיפורים`);
for (const s of coupleStories.slice(0, 20)) {
  log(`\n   [${s.gender}]: "${s.text.slice(0, 400)}${s.text.length > 400 ? '...' : ''}"`);
}

// ═══════════════════════════════════════════
// 7. רב משפיע
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 7. רבנים משפיעים');
log('═'.repeat(80));

const rabbis = profiles.filter(p => p.influentialRabbi).map(p => p.influentialRabbi);
log(`   סה"כ ${rabbis.length} תשובות`);
printDistribution('רבנים (לפי שכיחות)', countValues(rabbis));

// ═══════════════════════════════════════════
// 8. ProfileTags — תגיות טביעת נשמה
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 8. תגיות טביעת נשמה (ProfileTags)');
log('═'.repeat(80));

printDistribution('תגיות סקטור', countArrayValues(profileTags.map(t => t.sectorTags)));
printDistribution('תגיות רקע', countArrayValues(profileTags.map(t => t.backgroundTags)));
printDistribution('תגיות אישיות', countArrayValues(profileTags.map(t => t.personalityTags)));
printDistribution('תגיות קריירה', countArrayValues(profileTags.map(t => t.careerTags)));
printDistribution('תגיות סגנון חיים', countArrayValues(profileTags.map(t => t.lifestyleTags)));
printDistribution('תגיות חזון משפחתי', countArrayValues(profileTags.map(t => t.familyVisionTags)));
printDistribution('תגיות זוגיות', countArrayValues(profileTags.map(t => t.relationshipTags)));
printDistribution('תגיות דיאספורה', countArrayValues(profileTags.map(t => t.diasporaTags)));
printDistribution('תגיות AI', countArrayValues(profileTags.map(t => t.aiDerivedTags)));

// ═══════════════════════════════════════════
// 9. sectionAnswers — ניתוח תשובות גולמיות מטביעת הנשמה
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 9. תשובות גולמיות מטביעת הנשמה (sectionAnswers)');
log('═'.repeat(80));

const allSectionAnswers = profileTags.filter(t => t.sectionAnswers).map(t => t.sectionAnswers);
log(`   סה"כ ${allSectionAnswers.length} רשומות עם sectionAnswers`);

// Aggregate all question IDs and their answer distributions
const questionAnswerMap = {};
for (const sa of allSectionAnswers) {
  if (typeof sa === 'object' && sa !== null) {
    // sectionAnswers can be: { section1: {q1: answer, q2: answer}, section2: ... }
    // or flat: { q1: answer, q2: answer }
    const flatAnswers = {};
    for (const [key, val] of Object.entries(sa)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        // Nested section
        for (const [qId, answer] of Object.entries(val)) {
          flatAnswers[qId] = answer;
        }
      } else {
        flatAnswers[key] = val;
      }
    }
    for (const [qId, answer] of Object.entries(flatAnswers)) {
      if (!questionAnswerMap[qId]) questionAnswerMap[qId] = [];
      if (Array.isArray(answer)) {
        questionAnswerMap[qId].push(...answer);
      } else if (answer !== null && answer !== undefined && answer !== '') {
        questionAnswerMap[qId].push(String(answer));
      }
    }
  }
}

// Print distribution for each question
const sortedQuestions = Object.entries(questionAnswerMap).sort((a, b) => b[1].length - a[1].length);
for (const [qId, answers] of sortedQuestions) {
  const dist = countValues(answers);
  if (dist.length > 0 && answers.length >= 5) {
    printDistribution(`${qId} (${answers.length} תשובות)`, dist, 20);
  }
}

// ═══════════════════════════════════════════
// 10. מטריקות ProfileMetrics — התפלגות
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 10. מטריקות (ProfileMetrics) — התפלגות');
log('═'.repeat(80));

const numericMetrics = [
  'socialEnergy', 'emotionalExpression', 'stabilityVsSpontaneity',
  'independenceLevel', 'optimismLevel', 'careerOrientation',
  'intellectualOrientation', 'financialApproach', 'ambitionLevel',
  'religiousStrictness', 'spiritualDepth', 'cultureConsumption',
  'urbanScore', 'togetherVsAutonomy', 'familyInvolvement',
  'parenthoodPriority', 'growthVsAcceptance', 'nightOwlScore',
  'adventureScore', 'appearancePickiness', 'socioEconomicLevel',
];

for (const metric of numericMetrics) {
  const values = profileMetrics.map(m => m[metric]).filter(v => v != null);
  if (values.length > 10) {
    const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    log(`   ${metric}: avg=${avg}, median=${median}, min=${min}, max=${max}, n=${values.length}`);
  }
}

printDistribution('סגנון הומור', countValues(profileMetrics.map(m => m.humorStyle)));
printDistribution('סגנון תקשורת', countValues(profileMetrics.map(m => m.communicationStyle)));
printDistribution('סגנון קונפליקט', countValues(profileMetrics.map(m => m.conflictStyle)));
printDistribution('סגנון תמיכה', countValues(profileMetrics.map(m => m.supportStyle)));
printDistribution('יחס לחיות', countValues(profileMetrics.map(m => m.petsAttitude)));
printDistribution('סוג אישיות', countValues(profileMetrics.map(m => m.inferredPersonalityType)));
printDistribution('סגנון התקשרות', countValues(profileMetrics.map(m => m.inferredAttachmentStyle)));
printDistribution('רקע אתני', countValues(profileMetrics.map(m => m.ethnicBackground)));
printDistribution('קטגוריית רקע', countValues(profileMetrics.map(m => m.backgroundCategory)));

// ═══════════════════════════════════════════
// 11. AI Summaries — דוגמאות
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 11. סיכומי AI — דוגמאות');
log('═'.repeat(80));

const aiSeeking = profileMetrics.filter(m => m.aiSeekingSummary).map(m => m.aiSeekingSummary);
log(`\n   סה"כ ${aiSeeking.length} סיכומי "מה מחפש":`);
for (const s of aiSeeking.sort(() => Math.random() - 0.5).slice(0, 10)) {
  log(`\n   "${s.slice(0, 400)}${s.length > 400 ? '...' : ''}"`);
}

const aiPersonality = profileMetrics.filter(m => m.aiPersonalitySummary).map(m => m.aiPersonalitySummary);
log(`\n   סה"כ ${aiPersonality.length} סיכומי אישיות:`);
for (const s of aiPersonality.sort(() => Math.random() - 0.5).slice(0, 10)) {
  log(`\n   "${s.slice(0, 400)}${s.length > 400 ? '...' : ''}"`);
}

// ═══════════════════════════════════════════
// 12. Deal Breakers
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 12. Deal Breakers');
log('═'.repeat(80));

const hardDealBreakers = [];
const softDealBreakers = [];
for (const m of profileMetrics) {
  if (m.dealBreakersHard && Array.isArray(m.dealBreakersHard)) {
    hardDealBreakers.push(...m.dealBreakersHard);
  }
  if (m.dealBreakersSoft && Array.isArray(m.dealBreakersSoft)) {
    softDealBreakers.push(...m.dealBreakersSoft);
  }
}
printDistribution('Deal Breakers קשיחים', countValues(hardDealBreakers));
printDistribution('Deal Breakers רכים', countValues(softDealBreakers));

// AI inferred
const aiDealBreakers = [];
const aiMustHaves = [];
for (const m of profileMetrics) {
  if (m.aiInferredDealBreakers && Array.isArray(m.aiInferredDealBreakers)) {
    aiDealBreakers.push(...m.aiInferredDealBreakers);
  }
  if (m.aiInferredMustHaves && Array.isArray(m.aiInferredMustHaves)) {
    aiMustHaves.push(...m.aiInferredMustHaves);
  }
}
printDistribution('AI Deal Breakers', countValues(aiDealBreakers), 30);
printDistribution('AI Must Haves', countValues(aiMustHaves), 30);

// ═══════════════════════════════════════════
// 13. דחיות — קטגוריות
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 13. פידבק דחיות');
log('═'.repeat(80));

printDistribution('קטגוריות דחייה', countValues(rejectionFeedback.map(r => r.category)));
const rejTexts = rejectionFeedback.filter(r => r.freeText).map(r => r.freeText);
log(`\n   טקסטים חופשיים (${rejTexts.length}):`);
for (const t of rejTexts) {
  log(`   • "${t}"`);
}

// ═══════════════════════════════════════════
// 14. המלצות חברים
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 14. המלצות חברים');
log('═'.repeat(80));

log(`   סה"כ ${friendTestimonials.length} המלצות`);
for (const t of friendTestimonials) {
  log(`\n   [${t.relationship}]: "${t.content.slice(0, 400)}${t.content.length > 400 ? '...' : ''}"`);
}

// ═══════════════════════════════════════════
// 15. ניתוח שלמות פרופיל
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 15. ניתוח שלמות פרופיל — שדות ריקים');
log('═'.repeat(80));

const fieldFillRate = {};
const importantFields = [
  'about', 'occupation', 'education', 'educationLevel', 'city', 'origin',
  'religiousLevel', 'religiousJourney', 'height', 'maritalStatus',
  'shomerNegiah', 'serviceType', 'smokingStatus', 'bodyType',
  'profileHeadline', 'inspiringCoupleStory', 'influentialRabbi',
  'parentStatus', 'siblings', 'profileCharacterTraits', 'profileHobbies',
  'headCovering', 'kippahType', 'appearanceTone', 'groomingStyle',
  'nativeLanguage',
];

for (const field of importantFields) {
  const filled = profiles.filter(p => {
    const val = p[field];
    if (val === null || val === undefined) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (val === '') return false;
    return true;
  }).length;
  fieldFillRate[field] = { filled, total: profiles.length, pct: ((filled / profiles.length) * 100).toFixed(1) };
}

const sortedFields = Object.entries(fieldFillRate).sort((a, b) => b[1].pct - a[1].pct);
for (const [field, { filled, total, pct }] of sortedFields) {
  const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
  log(`   ${field.padEnd(30)} ${bar} ${pct}% (${filled}/${total})`);
}

// ═══════════════════════════════════════════
// 16. partnerTags — מה אנשים מחפשים בבן זוג
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 16. partnerTags — העדפות בן זוג מטביעת הנשמה');
log('═'.repeat(80));

const partnerTagsList = profileTags.filter(t => t.partnerTags).map(t => t.partnerTags);
log(`   סה"כ ${partnerTagsList.length} רשומות partnerTags`);

// Aggregate partner tag keys
const partnerTagKeys = {};
for (const pt of partnerTagsList) {
  if (typeof pt === 'object' && pt !== null) {
    for (const [key, val] of Object.entries(pt)) {
      if (!partnerTagKeys[key]) partnerTagKeys[key] = [];
      if (Array.isArray(val)) {
        partnerTagKeys[key].push(...val);
      } else if (val !== null && val !== undefined) {
        partnerTagKeys[key].push(String(val));
      }
    }
  }
}

for (const [key, vals] of Object.entries(partnerTagKeys).sort((a, b) => b[1].length - a[1].length)) {
  if (vals.length >= 3) {
    printDistribution(`partnerTag: ${key} (${vals.length})`, countValues(vals), 15);
  }
}

// ═══════════════════════════════════════════
// 17. שאלון 5 עולמות — התפלגות תשובות
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 17. שאלון 5 עולמות — ניתוח תשובות');
log('═'.repeat(80));

const worlds = ['valuesAnswers', 'personalityAnswers', 'relationshipAnswers', 'partnerAnswers', 'religionAnswers'];

for (const world of worlds) {
  log(`\n--- ${world} ---`);
  const allAnswers = questionnaires.filter(q => q[world]).map(q => q[world]);
  log(`   ${allAnswers.length} תשובות`);

  const qMap = {};
  for (const ans of allAnswers) {
    if (typeof ans === 'object' && ans !== null) {
      for (const [qId, answer] of Object.entries(ans)) {
        if (!qMap[qId]) qMap[qId] = [];
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
          // Could be {value: x} or {selected: [...]}
          if (answer.value !== undefined) qMap[qId].push(String(answer.value));
          else if (answer.selected) qMap[qId].push(...answer.selected.map(String));
          else qMap[qId].push(JSON.stringify(answer));
        } else if (Array.isArray(answer)) {
          qMap[qId].push(...answer.map(String));
        } else if (answer !== null && answer !== undefined) {
          qMap[qId].push(String(answer));
        }
      }
    }
  }

  for (const [qId, vals] of Object.entries(qMap).sort((a, b) => b[1].length - a[1].length)) {
    if (vals.length >= 3) {
      printDistribution(`${qId} (${vals.length})`, countValues(vals), 15);
    }
  }
}

// ═══════════════════════════════════════════
// 18. matchingNotes & matchmakerImpression
// ═══════════════════════════════════════════
log('\n' + '═'.repeat(80));
log('📋 18. הערות שדכנים (matchingNotes + matchmakerImpression)');
log('═'.repeat(80));

const notes = profiles.filter(p => p.matchingNotes).map(p => p.matchingNotes);
log(`\n   matchingNotes — ${notes.length} רשומות:`);
for (const n of notes.slice(0, 20)) {
  log(`   • "${n.slice(0, 300)}${n.length > 300 ? '...' : ''}"`);
}

const impressions = profiles.filter(p => p.matchmakerImpression).map(p => p.matchmakerImpression);
log(`\n   matchmakerImpression — ${impressions.length} רשומות:`);
for (const imp of impressions.slice(0, 20)) {
  log(`   • "${imp.slice(0, 300)}${imp.length > 300 ? '...' : ''}"`);
}

// ═══════════════════════════════════════════
// Save output
// ═══════════════════════════════════════════
const outputPath = path.join(__dirname, '..', 'exports', 'analysis-summary.txt');
fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');
log(`\n📁 הסיכום נשמר ב: ${outputPath}`);
