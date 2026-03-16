# NeshamaTech - Shidduch System (Web App)

## About
מערכת שידוכים מתקדמת לקהל היהודי המשלבת AI עם ליווי אנושי של שדכנים.
זהו חלק הווב של המערכת — דשבורד לשדכנים + ממשק למשתמשים.
קיימת גם אפליקציית מובייל נפרדת (neshamatech-mobile) ב-React Native/Expo שמתחברת דרך `/api/mobile/`.

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **DB:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Google, Apple, Email OTP)
- **Hosting:** Heroku
- **Styling:** Tailwind CSS
- **Images:** Cloudinary
- **Email:** Resend
- **WhatsApp:** Meta Cloud API
- **AI:** Google Gemini API
- **Payments:** Stripe
- **i18n:** Custom dictionary system (Hebrew + English, RTL support)

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── mobile/          # API routes for mobile app
│   │   ├── admin/           # Admin management
│   │   ├── matchmaker/      # Matchmaker operations (candidates, suggestions, matching, AI, chat)
│   │   ├── user/            # User operations (profile, questionnaire, photos, feedback)
│   │   ├── auth/            # Authentication & verification
│   │   ├── suggestions/     # Suggestion management
│   │   ├── chat/            # Chat system
│   │   └── ai/              # AI services
│   └── [he]/                # Hebrew pages (i18n routing)
│       └── [en]/            # English pages
├── components/
│   ├── admin/               # Admin dashboard components
│   ├── matchmaker/          # Matchmaker dashboard & CRM
│   ├── profile/             # User profile components
│   ├── questionnaire/       # 5-worlds questionnaire
│   ├── suggestions/         # Match suggestion cards & flows
│   ├── chat/                # Chat UI
│   ├── auth/                # Login/register components
│   └── ui/                  # Shared UI components
├── lib/
│   ├── services/            # Business logic (see key services below)
│   ├── email/               # Email templates (.hbs) & sending
│   ├── engagement/          # Drip campaigns, orchestrators
│   ├── pdf/                 # PDF generation
│   └── utils/               # Utility functions
├── types/                   # TypeScript types & dictionary types
├── scripts/                 # Maintenance & cron scripts
└── dictionaries/            # i18n translation files (he.json, en.json)
```

## Key Services
| Service | Purpose |
|---------|---------|
| `hybridMatchingService` | Main matching engine - combines multiple methods |
| `compatibilityServiceV2` | Compatibility scoring between profiles |
| `vectorMatchingService` | Vector-based matching (3072-dim embeddings) |
| `matchingAlgorithmService` | Rule-based algorithmic matching |
| `metricsExtractionService` | Extract ProfileMetrics from questionnaire/AI |
| `aiService` | Gemini AI integration for analysis & insights |
| `profileAiService` | AI-powered profile improvement suggestions |
| `questionnaireService` | 5-worlds questionnaire logic |
| `symmetricScanService` | Symmetric pair scanning (both directions) |
| `scanSingleUserV2` | Scan matches for a single user |
| `dashboardService` | Matchmaker dashboard data |
| `rejectionFeedbackService` | Handle rejection feedback & categorization |
| `availabilityService` | User availability status management |
| `priorityService` | User priority scoring |
| `referralService` | Referral campaign tracking |

## Data Model (Key Entities)
- **User** → Profile → QuestionnaireResponse → UserImage
- **MatchSuggestion** (matchmaker → firstParty + secondParty) with ~25 statuses (DRAFT → MARRIED)
- **PotentialMatch** (AI-scored male↔female pairs with multi-method scores)
- **ProfileMetrics** (~30 self metrics + ~15 preference metrics + AI summaries)
- **ProfileVector** (3072-dim vectors: self, seeking)
- **DirectMessage** / **SuggestionMessage** (chat system)
- **ScannedPair** / **ScanSession** (scan tracking to avoid duplicates)

## Important Patterns

### Suggestion Status Flow
```
DRAFT → PENDING_FIRST_PARTY → FIRST_PARTY_APPROVED/INTERESTED/DECLINED
  → PENDING_SECOND_PARTY → SECOND_PARTY_APPROVED/DECLINED
  → CONTACT_DETAILS_SHARED → DATING → ENGAGED → MARRIED
```
Also: RE_OFFERED_TO_FIRST_PARTY, FIRST_PARTY_NOT_AVAILABLE, SECOND_PARTY_NOT_AVAILABLE

### User Roles
- **CANDIDATE** — Regular user (fills questionnaire, receives suggestions)
- **MATCHMAKER** — Manages candidates, sends suggestions, uses AI tools
- **ADMIN** — System management

### i18n
Dictionary-based: `src/dictionaries/he.json` & `en.json`. RTL support built-in.
Use `dictionary.key.path` pattern. Default language: Hebrew.

### Mobile API
All mobile routes under `src/app/api/mobile/` — same DB, separate endpoints optimized for the React Native app.

## Coding Conventions
- **Language:** TypeScript (strict)
- **API Routes:** Next.js App Router route handlers (`route.ts`)
- **DB Access:** Always through Prisma client (`import { prisma } from '@/lib/prisma'`)
- **Components:** React functional components with hooks
- **Styling:** Tailwind CSS utility classes
- **Brand Colors:** Teal (primary), Orange/Amber (secondary), Rose/Pink (accent)
- **Hebrew First:** UI defaults to Hebrew, RTL layout. All user-facing strings via i18n dictionaries
- **Error Handling:** Try/catch in API routes, return appropriate HTTP status codes

## Common Tasks
- **Add new API route:** Create `route.ts` in appropriate `src/app/api/` subfolder
- **Add new component:** Place in relevant `src/components/` subfolder
- **Update DB schema:** Edit `prisma/schema.prisma`, run `npx prisma migrate dev`
- **Add i18n string:** Add to both `he.json` and `en.json`, add type in `src/types/dictionaries/`
- **Run scripts:** `npx ts-node src/scripts/<script>.ts`

## Don'ts
- Don't modify the Prisma schema without understanding the full data model
- Don't hardcode Hebrew strings — use the i18n dictionary system
- Don't create new services without checking if existing ones cover the need
- Don't bypass the suggestion status flow — always use proper state transitions
- Don't forget: this web app serves both matchmakers (primary) and users (secondary)
