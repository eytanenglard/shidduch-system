Analyze and optimize the matching/scanning system for: $ARGUMENTS

Key files to review:
- `src/lib/services/hybridMatchingService.ts` — Main matching engine
- `src/lib/services/compatibilityServiceV2.ts` — Compatibility scoring
- `src/lib/services/vectorMatchingService.ts` — Vector-based matching
- `src/lib/services/matchingAlgorithmService.ts` — Rule-based matching
- `src/lib/services/metricsExtractionService.ts` — ProfileMetrics extraction
- `src/lib/services/symmetricScanService.ts` — Symmetric pair scanning
- `src/lib/services/scanSingleUserV2.ts` — Single user scan

Key models:
- PotentialMatch — stores multi-method scores (hybrid, algorithmic, vector, metricsV2)
- ProfileMetrics — ~30 self metrics + ~15 preference metrics with ranges and weights
- ProfileVector — 3072-dim vectors (self, seeking)
- ScannedPair — dedup tracking

IMPORTANT:
- Matching is always male↔female pairs
- Scores are asymmetric (scoreForMale vs scoreForFemale)
- Multiple scanning methods exist — check which one is relevant
- AI calls use Gemini API — be mindful of rate limits and costs
- ScannedPair prevents re-scanning — respect this mechanism
