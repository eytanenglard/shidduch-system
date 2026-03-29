Debug a hybrid scan issue for: $ARGUMENTS

The hybrid scan (`hybridMatchingService`) is the main matching engine. When a scan fails or returns unexpected results, trace through the full pipeline.

1. **Read the core files:**
   - `src/lib/services/hybridMatchingService.ts` — main pipeline
   - `src/lib/services/compatibilityServiceV2.ts` — compatibility scoring
   - `src/lib/services/vectorMatchingService.ts` — vector similarity (3072-dim)
   - `src/lib/services/metricsExtractionService.ts` — profile metrics extraction
   - `src/lib/services/dualVectorService.ts` — self + seeking vectors
   - `src/lib/services/symmetricScanService.ts` — symmetric pair scanning
   - `src/lib/services/scanSingleUserV2.ts` — single user scan with caching

2. **Trace the pipeline in order:**
   ```
   Step 1: ScannedPair check (cached? stale? cooldown?)
   Step 2: ProfileMetrics extraction (explicit → inferred → defaults)
   Step 3: Deal breaker check (hard = score 0, soft = penalty 5-15)
   Step 4: Tier 2 — Compatibility scoring (metrics + vectors)
   Step 5: Tier 3 — AI First Pass (45% Tier2 + 55% Gemini, batches of 10)
   Step 6: Tier 4 — AI Deep Analysis (top 15 candidates, full Gemini dive)
   Step 7: Save results (MIN_SCORE_TO_SAVE = 65)
   ```

3. **Common issues to check:**
   - ScannedPair blocking rescan (RESCAN_COOLDOWN_DAYS = 7)
   - Stale vectors (STALE_THRESHOLD_HOURS = 2)
   - Missing ProfileMetrics (no questionnaire completed)
   - Deal breakers killing score silently (hard breaker = 0)
   - Inferred values fallback giving wrong data
   - AI batch size issues (AI_BATCH_SIZE = 10, TOP_CANDIDATES_FOR_AI = 25)
   - Score below MIN_SCORE_TO_SAVE (65) — discarded silently
   - Profile not visible (isProfileComplete AND isPhoneVerified must both be true)
   - Availability status not AVAILABLE

4. **Key constants:**
   | Constant | Value |
   |----------|-------|
   | MIN_SCORE_TO_SAVE | 65 |
   | RESCAN_COOLDOWN_DAYS | 7 |
   | STALE_THRESHOLD_HOURS | 2 |
   | AI_BATCH_SIZE | 10 |
   | TOP_CANDIDATES_FOR_AI | 25 |
   | VECTOR_SEARCH_LIMIT | 50 |
   | MAX_CANDIDATES_TO_UPDATE | 30 |

5. **Scoring is asymmetric:** scoreForMale ≠ scoreForFemale. Always check BOTH directions.

6. **All matching is MALE↔FEMALE only.** If users are same gender, they will never match.

IMPORTANT:
- Check ScannedPair table FIRST — most "missing results" are due to cooldown or cached low scores
- Verify the user has completed the Soul Fingerprint questionnaire
- Check if vectors exist and are fresh (< 2 hours old)
- Look at Gemini API errors in the logs if AI tiers return nothing
