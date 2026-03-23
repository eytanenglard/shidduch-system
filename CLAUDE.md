# NeshamaTech - Shidduch System (Web App)

## Communication
- דבר איתי בעברית
- Commit messages in Hebrew
- Code & comments in English

## Role & Expertise
Act as a senior full-stack engineer with deep expertise in UI/UX design, matchmaking domain knowledge, marketing psychology, and Hebrew copywriting. Prioritize: clean design, professional quality, and empathy for a sensitive user base.

## Product Context
NeshamaTech is a matchmaking platform for the Jewish community, combining AI-powered matching with human matchmaker oversight. Currently targeting Israel's national-religious/academic segment (students, professionals). Future expansion: US Modern Orthodox, then secular markets worldwide.

**Core differentiators vs dating apps:**
- Users don't browse — matchmakers send curated suggestions. Users only respond.
- Full privacy — profiles are never publicly browsable
- Goal is to find matches fast (not maximize engagement/screen time)
- Deep questionnaire ("Soul Fingerprint") enables high-quality AI matching at scale
- Human matchmakers review every suggestion, maintain personal contact with users

**Two audiences, one system:**
- **Matchmakers (primary):** Dashboard/CRM for managing candidates, sending suggestions, AI-assisted matching
- **Candidates (secondary):** Registration, questionnaire, profile, receive/respond to suggestions

**Marketing & tone guidelines:**
- Target audience: smart, serious, rightfully skeptical people
- Tone: authentic, humble, professional — never arrogant or salesy
- Balance: assertive enough to convert, warm enough to feel personal
- Emphasize the human element alongside technology
- CTAs should feel like invitations, not hard sells
- Never fabricate stats or make unrealistic promises

## Running the Project
```bash
npm run dev          # Start dev server (Next.js, http://localhost:3000)
npm run build        # Production build (prisma generate + next build)
npm run lint         # ESLint
npm test             # Run tests (vitest)
npm run test:watch   # Tests in watch mode
```

### Environment Variables
Copy `.env` and fill in required values. Key groups:
- **Core:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`
- **Auth:** `GOOGLE_CLIENT_ID/SECRET`, `APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY`
- **AI:** `GEMINI_API_KEY`
- **Email:** `RESEND_API_KEY`, `EMAIL_FROM`
- **Media:** `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`
- **Cache:** `UPSTASH_REDIS_REST_URL/TOKEN`
- **Cron:** `CRON_SECRET`, `INTERNAL_API_SECRET`

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **DB:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Google, Apple, Email OTP) — web; Custom JWT (30-day) — mobile
- **Hosting:** Heroku
- **Styling:** Tailwind CSS + Radix UI + shadcn/ui
- **Images:** Cloudinary
- **Email:** Resend
- **WhatsApp:** Twilio
- **AI:** Google Gemini API
- **Cache:** Upstash Redis
- **Validation:** Zod
- **Forms:** React Hook Form
- **Animations:** Framer Motion
- **Font:** Heebo (Hebrew-optimized)
- **i18n:** Custom dictionary system (Hebrew + English, RTL support)

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── mobile/          # ~45 endpoints, JWT auth, CORS headers
│   │   ├── admin/           # Admin management
│   │   ├── matchmaker/      # Matchmaker operations
│   │   ├── user/            # User operations
│   │   ├── auth/            # Authentication & verification
│   │   ├── suggestions/     # Suggestion management
│   │   ├── chat/            # Chat system
│   │   └── ai/              # AI services
│   └── [locale]/            # i18n routing (he/en)
├── components/
│   ├── admin/               # Admin dashboard
│   ├── matchmaker/          # Matchmaker dashboard & CRM
│   ├── profile/             # User profile
│   ├── questionnaire/       # 5-worlds questionnaire (Soul Fingerprint)
│   ├── suggestions/         # Match suggestion cards & flows
│   ├── chat/                # Chat UI
│   ├── auth/                # Login/register
│   └── ui/                  # shadcn/ui components (~45 components)
├── lib/
│   ├── services/            # Business logic
│   ├── email/               # Email templates (.hbs)
│   ├── engagement/          # Drip campaigns
│   ├── pdf/                 # PDF generation
│   └── utils/               # Utilities
├── types/                   # TypeScript types
├── scripts/                 # Cron & maintenance
├── __tests__/               # Vitest tests (minimal coverage)
└── dictionaries/            # he.json, en.json
```

## Testing
- **Framework:** Vitest (node environment)
- **Location:** `src/__tests__/`
- **Coverage:** Minimal — 4 test files (compatibilityServiceV2, sanitize, api-error, rate-limiter)
- **Run:** `npm test` | `npm run test:watch` | `npm run test:coverage`

## Git Workflow
- Working directly on `main` branch
- Commit messages in **Hebrew**
- Deploy to Heroku from main

## The 5 Worlds — Soul Fingerprint (טביעת הנשמה)
The questionnaire is the heart of the system. It's designed as a guided self-discovery journey, not a tedious form. Users choose a religious track (חרדי, דתי, מסורתי, חילוני) and questions adapt accordingly.

| World | WorldId | What it covers |
|-------|---------|----------------|
| אישיות | `PERSONALITY` | Temperament, energy, social style, attachment style. Key: "budget allocation" of 100 points across traits |
| ערכים | `VALUES` | Core value priorities via 100-point budget (family, spirituality, career, growth, etc.). Includes current vs. future-in-relationship comparison |
| זוגיות | `RELATIONSHIP` | Partnership vision, communication style, conflict resolution, love languages, daily dynamics |
| בן/בת זוג | `PARTNER` | Preferences for spouse — mirrors PERSONALITY but for what you seek. Includes deal-breakers and red lines |
| דת ורוחניות | `RELIGION` | Spiritual identity at high resolution (not just "דתי" — but דתי-לאומי תורני, חרדי-מודרני, etc.). Observance, children's education vision |

**Question types:** Multiple choice, open-ended reflection, interactive sliders, budget allocation, depth levels (basic/advanced/expert).
**UX features:** Auto-save, world-specific color themes, intro screens per world, editable answers, accessibility tools.

**How matching uses them:**
- `metricsExtractionService` → `ProfileMetrics` (~30 self + ~15 preference metrics)
- `compatibilityServiceV2` scores across all worlds (symmetric: A→B and B→A separately)
- `vectorMatchingService` uses 3072-dim embeddings for semantic similarity
- Answers stored as: `personalityAnswers`, `valuesAnswers`, `relationshipAnswers`, `partnerAnswers`, `religionAnswers`

## Matching System Architecture
Multi-tiered scoring pipeline:

| Tier | Method | Details |
|------|--------|---------|
| Tier 2 | Compatibility (metrics + vectors) | Rule-based + cosine similarity |
| Tier 3 | AI First Pass | 45% Tier2 + 55% Gemini analysis, batches of 10 |
| Tier 4 | AI Deep Analysis | Full Gemini deep dive on top 15 candidates |

**Key constants:**
| Constant | Value | Purpose |
|----------|-------|---------|
| `MIN_SCORE_TO_SAVE` | 65 | Below this, match is discarded entirely |
| `RESCAN_COOLDOWN_DAYS` | 7 | Failed pairs can't rescan within 7 days |
| `STALE_THRESHOLD_HOURS` | 2 | Vectors older than 2h are recalculated |
| `AI_BATCH_SIZE` | 10 | Candidates per AI batch |
| `TOP_CANDIDATES_FOR_AI` | 25 | Vector results sent to AI |
| `VECTOR_SEARCH_LIMIT` | 50 | First vector query returns top 50 |
| `MAX_CANDIDATES_TO_UPDATE` | 30 | Metrics updated per scan |

**Deal Breakers:**
- **Hard:** Religious level, has children, head covering — score becomes 0
- **Soft:** Height, appearance preferences — penalty of 5-15 points
- Operators: EQUALS, NOT_EQUALS, IN, NOT_IN, MUST_INCLUDE, MUST_EXCLUDE, GREATER_THAN, LESS_THAN

**Dual Vector System:**
- **Self Vector:** 3072-dim embedding of user's personality/profile
- **Seeking Vector:** 3072-dim embedding of user's preferences
- Cosine similarity calculated both ways (selfToSeeking + seekingToSelf)

## Key Services
| Service | Purpose |
|---------|---------|
| `hybridMatchingService` | Main matching engine — combines all tiers |
| `compatibilityServiceV2` | Compatibility scoring (supports symmetric + oneDirectional) |
| `vectorMatchingService` | Vector-based matching (3072-dim) |
| `matchingAlgorithmService` | Rule-based algorithmic matching |
| `metricsExtractionService` | Extract ProfileMetrics from questionnaire/AI |
| `dualVectorService` | Generate & manage self + seeking vectors |
| `aiService` | Gemini AI integration |
| `profileAiService` | AI profile improvement suggestions |
| `questionnaireService` | 5-worlds questionnaire logic |
| `symmetricScanService` | Symmetric pair scanning (both directions) |
| `scanSingleUserV2` | Scan matches for single user with caching |
| `dashboardService` | Matchmaker dashboard data |
| `rejectionFeedbackService` | Rejection feedback & categorization |
| `availabilityService` | User availability status |
| `priorityService` | User priority scoring |
| `referralService` | Referral campaign tracking |
| `StatusTransitionService` | Suggestion status state machine |

## Data Model (Key Entities)
- **User** → Profile → QuestionnaireResponse → UserImage → ProfileMetrics → ProfileVector
- **MatchSuggestion** (matchmaker → firstParty + secondParty) with 27 statuses
- **PotentialMatch** (AI-scored male↔female pairs) — matchmakers create suggestions from these
- **ScannedPair** (lightweight cache — tracks which pairs were scored + cooldown)
- **DirectMessage** / **SuggestionMessage** (chat system)
- **DeviceToken** (mobile push notifications — Expo)

**Important:** PotentialMatch ≠ ScannedPair ≠ MatchSuggestion. These are 3 separate tables:
- ScannedPair = "have we scored this pair?" (cache/dedup)
- PotentialMatch = "AI says these might match" (scored results)
- MatchSuggestion = "matchmaker offered this to users" (actual suggestion with status flow)

### Key Enums (prisma/schema.prisma)
| Enum | Key Values |
|------|------------|
| `Gender` | MALE, FEMALE |
| `UserRole` | CANDIDATE, MATCHMAKER, ADMIN |
| `UserStatus` | PENDING_EMAIL_VERIFICATION, PENDING_PHONE_VERIFICATION, ACTIVE, INACTIVE, BLOCKED |
| `MatchSuggestionStatus` | 27 statuses (see Suggestion Status Flow below) |
| `AvailabilityStatus` | AVAILABLE, UNAVAILABLE, DATING, PAUSED, ENGAGED, MARRIED |
| `PotentialMatchStatus` | PENDING, REVIEWED, SENT, DISMISSED, EXPIRED, SHORTLISTED |
| `Language` | en, he |
| `ReligiousJourney` | BORN_INTO_CURRENT_LIFESTYLE, BAAL_TESHUVA, DATLASH, CONVERT, etc. |
| `UserSource` | REGISTRATION, MANUAL_ENTRY, IMPORTED |
| `ScanSessionStatus` | PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED |
| `RejectionCategory` | AGE_GAP, RELIGIOUS_GAP, NOT_ATTRACTED, GUT_FEELING, etc. (20 categories) |

## Important Patterns

### Suggestion Status Flow
```
DRAFT → PENDING_FIRST_PARTY → FIRST_PARTY_APPROVED/INTERESTED/DECLINED
  → PENDING_SECOND_PARTY → SECOND_PARTY_APPROVED/DECLINED
  → CONTACT_DETAILS_SHARED → DATING → ENGAGED → MARRIED
```
Also: RE_OFFERED_TO_FIRST_PARTY, FIRST_PARTY_NOT_AVAILABLE, SECOND_PARTY_NOT_AVAILABLE
Terminal states: MARRIED, CLOSED, EXPIRED, CANCELLED (no outbound transitions)

**Status transitions enforced by `StatusTransitionService`** — each transition auto-sets timestamps and fires multi-channel notifications (email + WhatsApp + push).
**Matchmaker/Admin bypass:** `skipValidation: true` allows any transition (use with caution).

### Matching is Male↔Female Only
All matching (PotentialMatch, scans, suggestions) pairs a MALE with a FEMALE. Schema enforces this with `maleUser`/`femaleUser` fields.

### User Registration Gates (middleware.ts)
Candidates must pass gates in order:
1. Accept terms → 2. Complete profile → 3. Verify phone → 4. Complete Soul Fingerprint
**MATCHMAKER/ADMIN roles skip all gates.**

### Auth: Web vs Mobile (completely separate)
| | Web | Mobile |
|-|-----|--------|
| **Method** | NextAuth.js (session cookies) | Custom JWT (Bearer token, 30-day expiry) |
| **Validation** | Middleware auto-enforced | Manual `verifyMobileToken(req)` per route |
| **Gates** | Middleware redirects | Must check DB manually |
| **CORS** | N/A | Whitelist: neshamatech.com, localhost, exp:// |

**Mobile route pattern:** Every route exports `OPTIONS` + handler, uses `corsJson()`/`corsError()`.
**Mobile profiles start with `isProfileVisible: false`** — invisible to matchmakers until profile completed.

### Profile Completion = Two Flags
Both `isProfileComplete` AND `isPhoneVerified` must be true for user to appear in matchmaking pools.

### Scan Caching (ScannedPair)
- NEW pair → score it
- STALE pair (profile changed, but within 7-day cooldown) → skip
- FRESH pair (no profile change) → reuse cached score
- **Gotcha:** Manually edited profiles won't rescan for 7 days if the pair previously scored < 65

### Inferred Values Fallback
When explicit profile data is missing, system uses AI-inferred values → then defaults. Example: no birthDate → use inferredAge → default 30.

### Rate Limiting (role-based multipliers)
ADMIN: 10x, MATCHMAKER: 5x, CANDIDATE: 1x. No Upstash = rate limiting disabled silently.

## Design System
- **Components:** shadcn/ui (CVA variants) in `src/components/ui/` (~45 components)
- **Styling:** Tailwind + `cn()` utility for class merging
- **Colors:** HSL CSS variables (primary, secondary, accent, destructive, muted)
- **Brand:** Teal primary, Orange/Amber secondary, Rose/Pink accent
- **Font:** Heebo (loaded via Next.js Google Fonts)
- **RTL:** `<html dir={direction}>` + `.dir-rtl`/`.dir-ltr` utilities
- **Animations:** Framer Motion for presence/list animations; Tailwind keyframes for fade/slide/zoom (200ms)
- **Buttons:** Variants: default, destructive, outline, secondary, ghost, link. Sizes: xs, sm, default, lg, icon
- **Dialogs:** Radix-based, max-height 85vh, `text-right` for RTL
- **Toasts:** Sonner library + custom SimpleToast
- **Loading:** `LoadingSpinner` (sm/md/lg) + skeleton with shimmer
- **Forms:** FormField → FormItem → FormLabel → FormControl → FormMessage pattern
- **Responsive:** Mobile-first (`flex flex-col sm:flex-row`), breakpoint at 2xl: 1400px
- **World themes:** Each questionnaire world has its own color (sky, rose, purple, teal, amber)

## Coding Conventions
- **Language:** TypeScript (strict)
- **API Routes:** Next.js App Router route handlers (`route.ts`)
- **DB Access:** Always through Prisma client (`import { prisma } from '@/lib/prisma'`)
- **Components:** React functional components with hooks
- **Styling:** Tailwind CSS utility classes — use `cn()` for conditional classes
- **Hebrew First:** UI defaults to Hebrew, RTL layout. All user-facing strings via i18n dictionaries
- **Error Handling:** Try/catch in API routes, return appropriate HTTP status codes
- **Validation:** Zod schemas for API input validation
- **Email normalization:** Always `.toLowerCase()` before DB operations

## Common Tasks
- **Add new API route:** Create `route.ts` in appropriate `src/app/api/` subfolder
- **Add new component:** Place in relevant `src/components/` subfolder
- **Update DB schema:** Edit `prisma/schema.prisma`, run `npx prisma migrate dev`
- **Add i18n string:** Add to both `he.json` and `en.json`, add type in `src/types/dictionaries/`
- **Run scripts:** `npx tsx src/scripts/<script>.ts`
- **Add mobile endpoint:** Create route in `src/app/api/mobile/`, export OPTIONS handler, use `verifyMobileToken` + `corsJson`/`corsError`

## Performance & Safety Notes
- Matching scans are heavy — always paginate, use ScannedPair to avoid duplicate work
- Don't load all PotentialMatch records at once — use filters and limits
- ProfileVector has 3072-dim float arrays — avoid loading vectors when not needed
- AI calls have no cost enforcement — be mindful of batch sizes and Gemini API limits
- Notification failures (email/WhatsApp) don't block status transitions — they can partially succeed
- No optimistic locking on MatchSuggestion — concurrent edits = last-write-wins
- Upstash Redis not configured = silent fallback to no rate limiting

## Web ↔ Mobile Sync (CRITICAL)
When modifying questionnaire, profile, or suggestion-related code, changes often need to be applied to **both** the web app and the mobile app (`../neshamatech-mobile/`).

### What MUST stay in sync:
| Item | Web Location | Mobile Location |
|------|-------------|-----------------|
| **Question IDs** | `src/components/questionnaire/questions/*Questions.tsx` | `src/i18n/questions_he.json` + `questions_en.json` |
| **World IDs** | `src/components/questionnaire/types/types.ts` | `src/types/questionnaire.ts` |
| **Question types** | `Question.type` enum | `QuestionDefinition.type` enum |
| **Answer format** | Prisma schema (`Json` fields) | `questionnaireApi.ts` + `questionnaireStore.ts` |
| **Question translations** | `src/dictionaries/he.json` + `en.json` | `src/i18n/questions_he.json` + `questions_en.json` |
| **Profile fields** | `prisma/schema.prisma` (Profile model) | `src/types/mobileProfile.ts` |
| **Suggestion statuses** | `MatchSuggestionStatus` enum | `src/types/index.ts` (status type) |
| **API contracts** | `src/app/api/mobile/*/route.ts` | `src/services/api/*.ts` |

### What is independent (no sync needed):
- UI components & styling (Tailwind vs StyleSheet)
- State management (React state vs Zustand stores)
- Navigation & routing
- Auth implementation (NextAuth vs JWT)

### Sync rule:
**When you add/modify/remove a question, change a question ID, update answer format, add a profile field, or change an API response — always apply the change to both projects.** Ask the user if unsure whether a change affects mobile.

## Don'ts
- Don't modify the Prisma schema without understanding the full data model
- Don't hardcode Hebrew strings — use the i18n dictionary system
- Don't create new services without checking if existing ones cover the need
- Don't bypass the suggestion status flow — always use proper state transitions via `StatusTransitionService`
- Don't create matching logic that isn't male↔female — the entire system assumes this
- Don't skip Zod validation on API inputs
- Don't update Profile without understanding that it triggers rescan logic (via updatedAt)
- Don't assume mobile and web auth work the same way — they are completely separate systems
- Don't trust inferred values as ground truth — they are AI guesses used as fallback
- Don't forget: both `isProfileComplete` AND `isPhoneVerified` must be true for matchmaking
