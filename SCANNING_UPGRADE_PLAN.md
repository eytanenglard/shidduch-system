# תכנון שדרוג מערכת הסריקה — NeshamaTech v3

## הקדמה: עקרונות אלגוריתמיים

לפני שנצלול לשיפורים הספציפיים, הנה העקרונות שמנחים את החשיבה:

### 1. עקרון חוסר הוודאות (Uncertainty Principle)
כל נתון במערכת נושא עימו **רמת ביטחון** (confidence). ציון שמבוסס על inferredAge עם confidence=60% צריך להיות שונה מציון שמבוסס על birthDate ידוע. מערכת שמתייחסת לכל הנתונים באותה ודאות — משקרת לעצמה.

### 2. עקרון האסימטריה (Asymmetry Principle)
התאמה זוגית היא מטבעה אסימטרית. א' יכול להיות בדיוק מה שב' מחפש/ת, אבל ב' לא בדיוק מה שא' מחפש/ת. שימוש ב-`MIN(scoreA→B, scoreB→A)` כציון סימטרי הוא **הגישה השמרנית ביותר** ומחמיצה הרבה מאוד זוגות טובים. הפתרון: שקלול שמכבד את האסימטריה בלי להתעלם ממנה.

### 3. עקרון הרלוונטיות (Relevance Principle)
לא כל מדד חשוב באותה מידה לכל משתמש. חרדי שרשם ש"רמת דתיות" לא משנה לו — צריך שהמשקל של religiousStrictness ירד מ-15 ל-3 *בשבילו*. משקלות אחידים הם הערכת חסר למורכבות של בני אדם.

### 4. עקרון הריקבון (Decay Principle)
נתונים מתיישנים. וקטור שנוצר לפני 3 חודשים, מטריקות שחושבו לפני חצי שנה, סטטוס שלא עודכן — כל אלה מאבדים ערך עם הזמן. ציון שמבוסס על נתונים מיושנים צריך "עונש ריקבון".

### 5. עקרון המשוב (Feedback Loop Principle)
המערכת לומדת מהמציאות. אם שדכנית שלחה הצעה וזוג אישר — זה מאמת את האלגוריתם. אם הצעה נדחתה — זה מאותת שמשהו בחישוב לא עובד. הצלחות ודחיות של העבר צריכות להשפיע על המשקלות של העתיד.

### 6. עקרון הביצועים (Performance Principle)
אלגוריתם מושלם שרץ שעה — גרוע מאלגוריתם טוב שרץ 10 שניות. כל שדרוג חייב לשמור על ביצועים סבירים. O(n²) זה עדיין סביר ל-1,000 משתמשים, אבל ל-10,000 — לא. צריך לחשוב על scalability.

---

## ניתוח מצב קיים

### מה עובד טוב

1. **הירארכיית Tiers** — Tier 1 (SQL, מהיר) → Tier 2-3 (compatibility, מדויק) → Tier 4 (AI, יקר) היא ארכיטקטורה נכונה. הזולים קודם, היקרים רק כשצריך.

2. **Deal breakers דו-כיווניים** — בדיקה שגם א' מתאים לב' וגם ב' מתאים לא'. זה קריטי ולא טריוויאלי.

3. **מערכת המטריקות** — 30+ מדדים שמכסים את מרבית ממדי ההתאמה: דתיות, אישיות, קריירה, סגנון חיים.

4. **Fallback חכם** — אם אין וקטורים → משקל מטריקות עולה. אם אין AI → מסתפק בציון מטריקות. המערכת לא קורסת כשחסר נתון.

5. **תגיות Soul Fingerprint (חדש)** — שכבת מידע נוספת שמבוססת על הצהרה עצמית מפורטת, לא רק על AI inference.

### מה לא עובד (מוקדי כשל)

#### כשל #1: MIN סימטרי — "ה-Veto הנסתר"

```
נוסחה נוכחית:   symmetricScore = MIN(scoreA→B, scoreB→A)

דוגמה:          דוד → מרים: 88    מרים → דוד: 62
                symmetricScore = 62  ← מרים "חוסמת" את ההתאמה
```

**הבעיה**: במציאות, שדכנית הייתה שולחת את ההצעה הזו. ציון 88 מצד אחד מעיד על פוטנציאל גבוה. ציון 62 מעיד על "לא אידיאלי אבל שווה ניסיון". MIN(88,62)=62 הורס זוגות.

**פתרון מוצע**: Asymmetric Weighted Mean

```
symmetricScore = 0.6 × MAX(scoreA, scoreB) + 0.4 × MIN(scoreA, scoreB)
```

| דוגמה | MIN (ישן) | Weighted (חדש) | שיפור |
|-------|-----------|----------------|-------|
| 88, 62 | 62 | 77.6 | +15.6 |
| 75, 70 | 70 | 73 | +3 |
| 90, 40 | 40 | 62 | +22 |
| 80, 80 | 80 | 80 | 0 |

ערכים מאוזנים (75,70) כמעט לא משתנים. ערכים אסימטריים (88,62) מקבלים boost הוגן.

**הגנה מ-outliers**: אם MIN < 50, עדיין לא רוצים להמליץ:
```
if (MIN(scoreA, scoreB) < 50) symmetricScore = MIN(scoreA, scoreB)  // veto stands
else symmetricScore = 0.6 × MAX + 0.4 × MIN
```

---

#### כשל #2: משקלות קבועים — "One Size Fits All"

```
נוכחי:   religiousStrictness = 15 (קבוע לכולם)
מציאות:  חילוני שרשם "לא משנה לי" → religiousStrictness צריך להיות 2
```

**פתרון**: Personal Weight Adjustment (PWA)

```typescript
function getPersonalWeight(
  metricKey: string,
  baseWeight: number,
  partnerTags: PartnerTagPreferences
): number {
  // אם הקטגוריה שייכת ל-doesntMatterCategories → הורד משקל ל-20%
  const categoryMap: Record<string, string> = {
    religiousStrictness: 'sector',
    careerOrientation: 'career',
    socialEnergy: 'personality',
    urbanScore: 'lifestyle',
    familyInvolvement: 'family',
    // ...
  };

  const category = categoryMap[metricKey];
  if (category && partnerTags?.doesntMatterCategories?.includes(category)) {
    return Math.round(baseWeight * 0.2);
  }

  // אם יש תגיות partner מפורטות בקטגוריה הזו → העלה משקל ב-30%
  const tagCount = getPartnerTagCount(partnerTags, category);
  if (tagCount >= 3) {
    return Math.round(baseWeight * 1.3);
  }

  return baseWeight;
}
```

**השפעה**: משתמש שמלא Soul Fingerprint ורשם "לא משנה" על רקע → background penalty יורד. משתמש שבחר 5 תגי personality → personality weight עולה. **ככל שמילאו יותר SF, האלגוריתם מדויק יותר**.

---

#### כשל #3: עונשים לינאריים — "מצטברים כמו חובות"

```
נוכחי:  height(16) + background(12) + language(8) + appearance(10) = 46 penalty
        ציון 80 → 34. נפסל.
```

**הבעיה**: עונשים שונים בתחומים שונים מצטברים לינארית. אבל במציאות, 4 חיכוכים קטנים ≠ חיכוך אחד ענק. בן-אדם יכול "לסלוח" על גובה אם כל השאר מושלם.

**פתרון**: Diminishing Returns Penalty

```typescript
function applyPenalties(basePenalties: number[]): number {
  // מיין מהגדול לקטן
  const sorted = basePenalties.sort((a, b) => b - a);

  let totalPenalty = 0;
  for (let i = 0; i < sorted.length; i++) {
    // העונש ה-i-י מקבל מקדם 0.8^i
    // הראשון: 100%, השני: 80%, השלישי: 64%, הרביעי: 51%...
    totalPenalty += sorted[i] * Math.pow(0.8, i);
  }

  return Math.round(totalPenalty);
}
```

| עונשים | לינארי (ישן) | Diminishing (חדש) | שיפור |
|--------|-------------|-------------------|-------|
| [16, 12, 8, 10] | 46 | 16 + 10×0.8 + 8×0.64 + 12×(sortfix) → ~35 | -11 |
| [20] | 20 | 20 | 0 |
| [5, 5, 5, 5, 5] | 25 | 5 + 4 + 3.2 + 2.6 + 2 = ~17 | -8 |

עונש בודד גדול — ללא שינוי. הרבה עונשים קטנים — מופחתים.

---

#### כשל #4: תגיות כ"תוספת" — במקום כליבה

```
נוכחי:  metrics 50% + vectors 20% + tags 30%  (best case)
         tags get max 50 points → normalized to 100 → weight 30% → max 30 out of 100
```

**הבעיה**: Soul Fingerprint הוא **ההצהרה הכי מפורטת** של המשתמש על עצמו ועל מה שהוא מחפש. 125 שאלות. 8 קטגוריות. "לא משנה לי" מפורש. זה צריך להיות **הליבה** של ההתאמה, לא תוספת של 30%.

**פתרון**: Tag-First Scoring Architecture

```
Phase 1 (ללא SF):  metrics 70% + vectors 30%     ← כמו היום
Phase 2 (עם SF):   tags 40% + metrics 35% + vectors 25%
Phase 3 (שניהם SF): tags 50% + metrics 30% + vectors 20%
```

הרעיון: ככל ששני הצדדים מילאו SF, התגיות מקבלות יותר משקל. כי:
- תגיות = **הצהרה מפורשת** (אני אומר מה חשוב לי)
- מטריקות = **הסקה** (המערכת מחליטה מה חשוב)
- וקטורים = **דמיון סמנטי** (embedding ממוצע)

הצהרה מפורשת > הסקה > דמיון.

---

#### כשל #5: אין confidence weighting

```
נוכחי:  inferredAge = 30 (confidence: 55%) → treated same as birthDate = 30-01-1996
```

**פתרון**: Confidence-Weighted Scoring

```typescript
interface ScoringInput {
  value: number;
  confidence: number;  // 0-100
  source: 'explicit' | 'questionnaire' | 'ai_inferred' | 'default';
}

function weightedMetricScore(
  candidateValue: ScoringInput,
  seekerRange: { min: number; max: number },
  metricWeight: number
): number {
  const compatibility = calculateRangeCompatibility(candidateValue.value, seekerRange);

  // Confidence discount: low-confidence values contribute less
  // explicit/questionnaire = 100%, ai_inferred = 70-90%, default = 50%
  const confidenceFactor = candidateValue.confidence / 100;
  const adjustedWeight = metricWeight * confidenceFactor;

  return {
    score: compatibility,
    weight: adjustedWeight,
    confidence: candidateValue.confidence,
  };
}
```

**השפעה**: מטריקות שמבוססות על AI inference מקבלות **פחות משקל** מאלו שמבוססות על הזנה ישירה. זה מונע מצב שבו AI שגוי "מרסק" ציון.

---

#### כשל #6: ריקבון נתונים

**פתרון**: Data Freshness Decay

```typescript
function getFreshnessFactor(updatedAt: Date): number {
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= 7) return 1.0;     // שבוע — מלא
  if (daysSinceUpdate <= 30) return 0.95;    // חודש — כמעט מלא
  if (daysSinceUpdate <= 90) return 0.85;    // 3 חודשים — טוב
  if (daysSinceUpdate <= 180) return 0.7;    // חצי שנה — ירידה
  return 0.5;                                 // מעל חצי שנה — ספקני
}
```

כפיל על **ציון הביטחון** של כל מקור נתונים. וקטורים ישנים ← freshness=0.7 ← vector weight * 0.7.

---

## ארכיטקטורה חדשה: Scanning Pipeline v3

```
┌──────────────────────────────────────────────────────────┐
│                    SCAN PIPELINE v3                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 0: Readiness & Data Quality                  │   │
│  │  • Profile exists, metrics exist                  │   │
│  │  • Compute confidence scores per data source      │   │
│  │  • Compute freshness factors                      │   │
│  │  • Flag missing critical data                     │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 1: SQL Hard Filters (unchanged)              │   │
│  │  • Gender, Age (bidirectional), Status            │   │
│  │  • Previous dismissals/rejections                 │   │
│  │  • Returns ~100 candidates                        │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 1.5: Tag Hard Filter + Soft Pre-Score  🆕    │   │
│  │  • Sector tag filter (hard)                       │   │
│  │  • Religious level matrix (soft, configurable)    │   │
│  │  • Quick tag overlap score (0-50)                 │   │
│  │  • Sort by tag score DESC                         │   │
│  │  • Top 80 continue (if >80 pass filter)           │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 2: Full Compatibility (top 80)               │   │
│  │  • Metrics compatibility (confidence-weighted)    │   │
│  │  • Soft penalties (diminishing returns)           │   │
│  │  • Vector similarity (freshness-weighted)         │   │
│  │  • Tag compatibility (full 7-category)            │   │
│  │  • Personal weight adjustment (PWA)               │   │
│  │  • Asymmetric score aggregation                   │   │
│  │  • Bidirectional: A→B and B→A                     │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 2.5: Score Calibration  🆕                   │   │
│  │  • Normalize scores to consistent 0-100 range     │   │
│  │  • Apply confidence discount                      │   │
│  │  • Apply freshness decay                          │   │
│  │  • Compute asymmetric weighted mean               │   │
│  │  • Top 30 continue                                │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 3: AI Deep Analysis (top 10 only)  🔄        │   │
│  │  • Only borderline cases (score 55-80)            │   │
│  │  • Gemini analysis with full context              │   │
│  │  • Cross-validate AI vs explicit data             │   │
│  │  • Score adjustment: ±15 points max               │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TIER 4: Final Ranking & Storage                   │   │
│  │  • Merge scores from all tiers                    │   │
│  │  • Store with breakdown + explanations            │   │
│  │  • Create/update PotentialMatch records           │   │
│  │  • Log scan session metadata                      │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## נוסחת ציון סופי v3

### Phase Selection

```typescript
function getScoreWeights(
  seekerHasSF: boolean,
  candidateHasSF: boolean,
  hasVectors: boolean,
): { metricsW: number; vectorsW: number; tagsW: number } {
  // Phase 3: Both have Soul Fingerprint — tags dominate
  if (seekerHasSF && candidateHasSF) {
    return hasVectors
      ? { metricsW: 0.30, vectorsW: 0.20, tagsW: 0.50 }
      : { metricsW: 0.45, vectorsW: 0.00, tagsW: 0.55 };
  }

  // Phase 2: One side has SF
  if (seekerHasSF || candidateHasSF) {
    return hasVectors
      ? { metricsW: 0.35, vectorsW: 0.25, tagsW: 0.40 }
      : { metricsW: 0.55, vectorsW: 0.00, tagsW: 0.45 };
  }

  // Phase 1: No SF — original behavior
  return hasVectors
    ? { metricsW: 0.70, vectorsW: 0.30, tagsW: 0.00 }
    : { metricsW: 1.00, vectorsW: 0.00, tagsW: 0.00 };
}
```

### Score Calculation

```typescript
function calculateFinalScoreV3(
  metricsScore: number,          // 0-100
  vectorScore: number,           // 0-1 (cosine similarity)
  tagScore: number,              // 0-50
  penalties: number[],           // array of individual penalties
  metricsConfidence: number,     // 0-100
  vectorFreshness: number,       // 0-1
  seekerHasSF: boolean,
  candidateHasSF: boolean,
): { score: number; confidence: number; breakdown: Record<string, number> } {

  const weights = getScoreWeights(seekerHasSF, candidateHasSF, vectorScore > 0);

  // Normalize tag score: 0-50 → 0-100
  const normalizedTagScore = tagScore * 2;

  // Apply confidence discounts
  const adjustedMetrics = metricsScore * (metricsConfidence / 100);
  const adjustedVectors = (vectorScore * 100) * vectorFreshness;
  const adjustedTags = normalizedTagScore;  // tags are always explicit = high confidence

  // Weighted combination
  const baseScore =
    adjustedMetrics * weights.metricsW +
    adjustedVectors * weights.vectorsW +
    adjustedTags * weights.tagsW;

  // Apply diminishing penalties
  const totalPenalty = applyDiminishingPenalties(penalties);

  // Final
  const score = Math.round(Math.max(0, baseScore - totalPenalty));

  // Overall confidence
  const confidence = Math.round(
    (metricsConfidence * weights.metricsW +
     vectorFreshness * 100 * weights.vectorsW +
     100 * weights.tagsW) // tags = 100% confidence (explicit)
  );

  return {
    score,
    confidence,
    breakdown: {
      metrics: Math.round(adjustedMetrics * weights.metricsW),
      vectors: Math.round(adjustedVectors * weights.vectorsW),
      tags: Math.round(adjustedTags * weights.tagsW),
      penalties: -totalPenalty,
      metricsConfidence,
      vectorFreshness: Math.round(vectorFreshness * 100),
    },
  };
}
```

### Asymmetric Aggregation

```typescript
function calculateSymmetricScoreV3(
  scoreAtoB: number,
  scoreBtoA: number,
): number {
  const minScore = Math.min(scoreAtoB, scoreBtoA);
  const maxScore = Math.max(scoreAtoB, scoreBtoA);

  // If the lower score is below viability threshold, use it as-is (veto)
  if (minScore < 50) return minScore;

  // Otherwise: weighted mean that respects both but doesn't kill good matches
  return Math.round(maxScore * 0.6 + minScore * 0.4);
}
```

---

## Tag Matching v2 — שדרוג

### בעיות בגרסה הנוכחית

1. **חפיפה בינארית** — תג תואם (1) או לא (0). אין "קרוב".
2. **אין קרבה סמנטית** — `casual_dress` ו-`sporty_dress` לא מקבלים credit חלקי.
3. **אין "bonus" לחפיפה מצוינת** — 7/7 תגים תואמים = כמו 4/7 ברמת ה-ratio.
4. **doesntMatter רק מדלג** — לא נותן בונוס (כאילו הקטגוריה לא קיימת).

### Tag Matching v2

```typescript
// Semantic proximity: tags that are "close" get partial credit
const TAG_PROXIMITY: Record<string, Record<string, number>> = {
  casual_dress: { sporty_dress: 0.7, creative_dress: 0.5, formal_dress: 0.2 },
  very_sensitive: { balanced_sensitivity: 0.6, thick_skinned: 0.1 },
  embraces_change: { cautious_change: 0.5, stability_seeker: 0.1 },
  career_center: { professional_good: 0.7, balance: 0.4, livelihood_only: 0.1 },
  // ... more pairs
};

function calculateTagOverlapV2(
  seekerPrefs: string[],
  candidateTags: string[],
  maxScore: number,
): { score: number; matchedTags: string[]; partialMatches: string[] } {
  if (seekerPrefs.length === 0 || candidateTags.length === 0) {
    return { score: 0, matchedTags: [], partialMatches: [] };
  }

  let totalCredit = 0;
  const matchedTags: string[] = [];
  const partialMatches: string[] = [];

  for (const pref of seekerPrefs) {
    if (candidateTags.includes(pref)) {
      totalCredit += 1;
      matchedTags.push(pref);
    } else {
      // Check proximity
      const proximities = TAG_PROXIMITY[pref];
      if (proximities) {
        let bestProximity = 0;
        let bestMatch = '';
        for (const cTag of candidateTags) {
          if (proximities[cTag] && proximities[cTag] > bestProximity) {
            bestProximity = proximities[cTag];
            bestMatch = cTag;
          }
        }
        if (bestProximity > 0) {
          totalCredit += bestProximity;
          partialMatches.push(`${pref}≈${bestMatch}`);
        }
      }
    }
  }

  const overlapRatio = totalCredit / seekerPrefs.length;

  // Excellence bonus: 90%+ match gets 10% extra
  const excellenceBonus = overlapRatio >= 0.9 ? 1.1 : 1.0;

  return {
    score: Math.round(Math.min(overlapRatio * excellenceBonus * maxScore, maxScore)),
    matchedTags,
    partialMatches,
  };
}
```

### doesntMatter = Flexibility Bonus

```typescript
// If seeker says "doesn't matter" for a category — they get a flexibility bonus
// Reasoning: they're saying "I'm open" which means MORE people match, not FEWER
function calculateFlexibilityBonus(doesntMatterCategories: string[]): number {
  // Each "doesn't matter" = 2 bonus points (max 10)
  return Math.min(doesntMatterCategories.length * 2, 10);
}
```

---

## Tier 1.5 v2 — Smart Pre-Filter

### בעיה נוכחית
Tier 1.5 רק מסנן sector mismatch. לא עושה שום pre-scoring.

### שדרוג: Quick Score + Smart Cutoff

```typescript
async function tier1_5SmartFilter(
  userId: string,
  tier1Candidates: Candidate[],
  userTags: ProfileTags,
): Promise<{ candidates: Candidate[]; preScores: Map<string, number> }> {

  if (!userTags?.partnerTags) {
    return { candidates: tier1Candidates, preScores: new Map() };
  }

  const partnerPrefs = userTags.partnerTags as PartnerTagPreferences;

  // Batch load all candidate tags
  const candidateTagsMap = await batchLoadProfileTags(
    tier1Candidates.map(c => c.profileId)
  );

  const scored: Array<{ candidate: Candidate; quickScore: number }> = [];

  for (const candidate of tier1Candidates) {
    const cTags = candidateTagsMap.get(candidate.profileId);

    // Hard filter: sector mismatch
    if (!passesTagHardFilter(partnerPrefs, cTags?.sectorTags || [])) {
      continue;
    }

    // Quick score: lightweight tag overlap (no proximity, just exact match)
    let quickScore = 0;
    if (cTags) {
      const sectorOverlap = countOverlap(partnerPrefs.sectorTags, cTags.sectorTags);
      const personalityOverlap = countOverlap(partnerPrefs.personalityTags, [...(cTags.personalityTags || []), ...(cTags.aiDerivedTags || [])]);
      const lifestyleOverlap = countOverlap(partnerPrefs.lifestyleTags, cTags.lifestyleTags);

      quickScore = sectorOverlap * 3 + personalityOverlap * 2 + lifestyleOverlap * 1;
    }

    scored.push({ candidate, quickScore });
  }

  // Sort by quickScore DESC
  scored.sort((a, b) => b.quickScore - a.quickScore);

  // Smart cutoff: take top 80 or all if less than 80
  const maxCandidates = 80;
  const filtered = scored.slice(0, maxCandidates);

  const preScores = new Map<string, number>();
  for (const s of filtered) {
    preScores.set(s.candidate.profileId, s.quickScore);
  }

  return {
    candidates: filtered.map(s => s.candidate),
    preScores,
  };
}
```

---

## AI Analysis v2 — Selective & Validated

### בעיות נוכחיות
1. AI רץ על 30 מועמדים — יקר ($)
2. AI מקבל 40% מהציון — overweight
3. אין cross-validation בין AI לנתונים מפורשים

### שדרוג

```typescript
// Only analyze borderline matches (55-80 score range)
// These are the ones where AI insight actually changes the decision
const AI_ANALYSIS_SCORE_RANGE = { min: 55, max: 80 };
const AI_ANALYSIS_MAX_CANDIDATES = 10;  // was 30 → now 10

// AI can only ADJUST score, not replace it
const AI_MAX_ADJUSTMENT = 15;  // was effectively unlimited

function applyAIAdjustment(
  baseScore: number,
  aiScore: number,
  aiConfidence: number,  // how confident is AI in its score
): number {
  // AI contributes proportional to its confidence
  const aiDelta = aiScore - baseScore;
  const clampedDelta = Math.max(-AI_MAX_ADJUSTMENT, Math.min(AI_MAX_ADJUSTMENT, aiDelta));
  const weightedDelta = clampedDelta * (aiConfidence / 100);

  return Math.round(baseScore + weightedDelta);
}
```

**חיסכון בעלויות**: מ-30 קריאות AI לסריקה → 10. חיסכון של ~67%.

---

## Feedback Loop — Learning from History

### רעיון
כל הצעה שנשלחה היא "ניסוי". התוצאה (אושרה/נדחתה) מלמדת את האלגוריתם.

### מימוש

```typescript
// Scan historical suggestions to compute metric importance
async function learnWeightsFromHistory(): Promise<Record<string, number>> {
  // Fetch all completed suggestions (ACCEPTED + DECLINED)
  const suggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: ['FIRST_PARTY_APPROVED', 'SECOND_PARTY_APPROVED', 'DATING',
                      'ENGAGED', 'MARRIED', 'FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED'] },
    },
    include: {
      firstParty: { include: { ProfileMetrics: true } },
      secondParty: { include: { ProfileMetrics: true } },
    },
  });

  // For each metric: calculate correlation with success
  // If metric X has high gap in declined matches but low gap in accepted → X is important
  // If metric X has no correlation with outcome → X is unimportant

  const metricImportance: Record<string, { successGap: number; failureGap: number }> = {};

  for (const metric of METRIC_KEYS) {
    let successGapSum = 0, successCount = 0;
    let failureGapSum = 0, failureCount = 0;

    for (const s of suggestions) {
      const gap = Math.abs(
        (s.firstParty.ProfileMetrics?.[metric] || 50) -
        (s.secondParty.ProfileMetrics?.[metric] || 50)
      );
      const isSuccess = ['FIRST_PARTY_APPROVED', 'SECOND_PARTY_APPROVED',
                          'DATING', 'ENGAGED', 'MARRIED'].includes(s.status);
      if (isSuccess) { successGapSum += gap; successCount++; }
      else { failureGapSum += gap; failureCount++; }
    }

    metricImportance[metric] = {
      successGap: successCount > 0 ? successGapSum / successCount : 50,
      failureGap: failureCount > 0 ? failureGapSum / failureCount : 50,
    };
  }

  // Convert to weights: higher failure-vs-success gap difference → more important
  const weights: Record<string, number> = {};
  for (const [metric, data] of Object.entries(metricImportance)) {
    const importance = Math.max(0, data.failureGap - data.successGap);
    weights[metric] = Math.round(importance * 0.5); // Scale to reasonable range
  }

  return weights;
}
```

**שימוש**: פעם בשבוע, `learnWeightsFromHistory()` רץ ומעדכן טבלת DEFAULT_METRIC_WEIGHTS. אם אין מספיק data (< 50 הצעות) — נשאר עם defaults.

---

## ביצועים: Batch Pair Cache

### בעיה
סריקה סימטרית: user A נסרק → מחשב A↔B. user B נסרק → מחשב B↔A. **אותו חישוב פעמיים**.

### פתרון: Canonical Pair Key

```typescript
function getPairKey(userId1: string, userId2: string): string {
  // Always use sorted order for canonical key
  return userId1 < userId2 ? `${userId1}:${userId2}` : `${userId2}:${userId1}`;
}

// Before computing compatibility:
const pairKey = getPairKey(userA.id, userB.id);
const cached = pairScoreCache.get(pairKey);
if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
  return cached.result;  // Use cached result (valid for 24h)
}

// Compute and cache
const result = await calculatePairCompatibility(userA.id, userB.id);
pairScoreCache.set(pairKey, { result, timestamp: Date.now() });
```

**השפעה**: 200 משתמשים × 100 מועמדים = 20,000 חישובים → ~10,000 (50% חיסכון).

---

## מדדים חדשים שלא מנוצלים

### מדדים קיימים ב-ProfileMetrics שלא משתתפים בחישוב:

| מדד | קיים ב-schema | משמש בחישוב | פוטנציאל |
|-----|--------------|-------------|---------|
| `inferredPersonalityType` | כן | לא | matching MBTI-like types |
| `inferredAttachmentStyle` | כן | לא | Secure↔Anxious compatibility |
| `inferredLoveLanguages` | כן | לא | Love language overlap |
| `inferredConflictStyle` | כן | לא | Conflict resolution compatibility |
| `socioEconomicLevel` | כן | לא | Financial expectations match |
| `jobSeniorityLevel` | כן | לא | Career stage alignment |
| `educationLevelScore` | כן | לא | Education compatibility |

### הצעה: 4 מדדים חדשים בחישוב

```typescript
const NEW_METRICS_WEIGHTS: Record<string, number> = {
  // Personality type compatibility (complementary types score higher)
  personalityTypeScore: 5,

  // Attachment style (secure+secure best, anxious+avoidant worst)
  attachmentCompatibility: 6,

  // Love language overlap (at least 1 shared)
  loveLanguageOverlap: 4,

  // Socioeconomic alignment (within ±2 levels)
  socioEconomicAlignment: 5,
};
```

---

## Geographic Distance

### בעיה
המערכת לא מחשבת מרחק פיזי. בישראל, ת"א ↔ ירושלים = 60 ק"מ ≠ ת"א ↔ קריית שמונה = 200 ק"מ.

### פתרון: City Distance Matrix

```typescript
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  tel_aviv: { lat: 32.0853, lng: 34.7818 },
  jerusalem: { lat: 31.7683, lng: 35.2137 },
  haifa: { lat: 32.7940, lng: 34.9896 },
  beer_sheva: { lat: 31.2530, lng: 34.7915 },
  bnei_brak: { lat: 32.0833, lng: 34.8333 },
  modiin: { lat: 31.8969, lng: 35.0104 },
  petach_tikva: { lat: 32.0841, lng: 34.8878 },
  netanya: { lat: 32.3215, lng: 34.8532 },
  ashdod: { lat: 31.8014, lng: 34.6434 },
  ashkelon: { lat: 31.6688, lng: 34.5743 },
  // ...
};

function getDistancePenalty(cityA: string, cityB: string): number {
  const a = CITY_COORDINATES[cityA];
  const b = CITY_COORDINATES[cityB];
  if (!a || !b) return 0;  // Unknown city = no penalty

  const km = haversineDistance(a, b);

  if (km <= 20) return 0;      // Same metro area
  if (km <= 50) return 3;      // Commutable
  if (km <= 100) return 6;     // Long commute
  if (km <= 200) return 10;    // Long distance
  return 15;                    // Very far
}
```

---

## Activity Recency Boost

```typescript
function getActivityBoost(lastActive: Date | null): number {
  if (!lastActive) return -5;  // Never active = penalty

  const daysSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= 3) return 5;     // Very active
  if (daysSince <= 7) return 3;     // Active
  if (daysSince <= 30) return 0;    // Normal
  if (daysSince <= 90) return -3;   // Getting stale
  return -8;                         // Dormant
}
```

מועמד פעיל מקבל boost. מועמד ש"נעלם" מקבל penalty.

---

## סדר יישום

### שלב 1 — Quick Wins (שבוע 1)
1. **Asymmetric score** — שינוי MIN → weighted mean (שורה אחת)
2. **Diminishing penalties** — החלפת סכום לינארי (פונקציה אחת)
3. **AI cutoff** — צמצום מ-30 ל-10 מועמדים, טווח 55-80 בלבד
4. **Save error handling** — הוספת confidence ל-breakdown

### שלב 2 — Soul Fingerprint Integration (שבוע 2-3)
5. **Tag-First weights** — Phase selection לפי מילוי SF
6. **Personal Weight Adjustment** — doesntMatter → weight reduction
7. **Tag proximity** — partial credit for similar tags
8. **Flexibility bonus** — doesntMatter = openness bonus
9. **Tier 1.5 pre-scoring** — quick tag score + sort + cutoff

### שלב 3 — Data Quality (שבוע 3-4)
10. **Confidence weighting** — per-metric confidence
11. **Freshness decay** — time-based discount
12. **Missing data handling** — explicit flags in score breakdown

### שלב 4 — New Metrics (שבוע 4-5)
13. **Geographic distance** — city distance penalty
14. **Activity recency** — boost/penalty
15. **Personality type compatibility** — MBTI-like matching
16. **Attachment style** — secure/anxious/avoidant matrix

### שלב 5 — Learning (שבוע 6+)
17. **Feedback loop** — learn weights from history
18. **Batch pair cache** — eliminate duplicate computations
19. **Cross-validation** — AI vs explicit data conflict detection

---

## Verification

| בדיקה | מטריקה | ערך צפוי |
|-------|--------|---------|
| A→B=88, B→A=62 | symmetric score v2 vs v3 | 62 → 77.6 |
| 4 penalties × 10 pts | total penalty v2 vs v3 | 40 → ~30 |
| Both have SF, with vectors | tag weight | 30% → 50% |
| AI analysis candidates | count per scan | 30 → 10 |
| Symmetric scan 200 users | pair calculations | 20,000 → ~10,000 |
| User marked "sector doesn't matter" | religiousStrictness weight | 15 → 3 |
| Profile updated 4 months ago | freshness factor | 1.0 → 0.85 |
| Score 88 + AI score 95, confidence 70% | adjusted score | 88 → 93 (was 95×0.4+88×0.6=92.8) |
