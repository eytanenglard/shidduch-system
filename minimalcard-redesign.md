# MinimalCard Component — Full Redesign & Refactor

## Goal
Completely redesign and refactor the `MinimalCard` component to world-class professional standards. This component is critical — it's the matchmaker's primary view of candidate profiles in a compact/summary format. It must be visually stunning, highly scannable, and information-dense without feeling cluttered.

**Component location:** `src/components/matchmaker/new/CandidateCard/MinimalCard.tsx`

## Before You Start — Deep Research Phase

Before writing any code or plan, study the following thoroughly:

1. **Prisma Schema** — Read `prisma/schema.prisma` to understand the full data model: User, Profile, QuestionnaireResponse, UserImage, ProfileMetrics, MatchSuggestion, and all related entities.
2. **The Current MinimalCard** — Read `MinimalCard.tsx` and every related file in `src/components/matchmaker/new/CandidateCard/`. Understand the full component tree, props, state, conditional rendering, and all data being displayed.
3. **Parent Components & Context** — Understand where and how MinimalCard is rendered. Search: `grep -r "MinimalCard" src/` — map every import, every usage context, every prop variation.
4. **Translation Files** — Read `src/dictionaries/he.json` and `src/dictionaries/en.json` — understand all i18n keys used by MinimalCard and its parent/sibling components.
5. **Related Services** — Check services that feed data into this component (dashboard service, candidate queries, etc.)
6. **Sibling Components** — Read other components in the same folder to understand the design system and patterns already in use.

## Design Principles

### Information Hierarchy for Matchmakers
This is a **work tool** for matchmakers — optimize for speed and decision-making:
- Profile photo — clear, prominent, but compact
- Name, age, location — instantly visible, zero scanning effort
- Key matchmaking factors (religious level, education, occupation, family background) — scannable at a glance
- Status indicators (availability, priority, last active) — subtle but accessible
- Action buttons (view full profile, create suggestion, etc.) — clear and accessible

### Visual Quality
- Clean, refined typography — optimize sizes, weights, and spacing for scanability
- Generous whitespace — compact does not mean cramped
- Subtle depth — soft shadows, layered elements, clear visual hierarchy
- Consistent border radius and spacing throughout
- Professional color usage:
  - Teal (primary) for key accents, active states, and primary actions
  - Orange/Amber sparingly for highlights, badges, or warnings
  - Rose/Pink for soft accents where appropriate
  - Neutral grays for body text, borders, and backgrounds
  - Strategic color pops on a mostly neutral canvas

### Micro-Interactions & Polish
- Smooth hover states — the card should feel alive and responsive
- Gentle transitions on state changes
- Elegant loading/skeleton states
- Clear visual feedback on all interactive elements

### RTL & Responsiveness
- Hebrew (RTL) is the default — design must be RTL-first
- Text alignment, icon placement, flow direction — all RTL-native
- Responsive across screen sizes — this is primarily a desktop/tablet component for matchmakers but must degrade gracefully on mobile
- Touch-friendly targets where applicable

## Constraints

- **Preserve ALL existing fields and values** — do not remove any data point currently being rendered
- **Do NOT alter business logic** — onClick handlers, conditional rendering logic, data fetching stay as-is
- **Use only Tailwind CSS** — no external CSS files, no inline style objects unless unavoidable
- **Maintain all i18n keys** — use the existing dictionary system, do not hardcode any string
- **Ensure all existing imports continue to work** — verify every usage across the codebase after implementation
- **Keep TypeScript strict** — proper typing for all props and state

## Workflow

1. **Research** — Complete the deep research phase. Read every relevant file.
2. **Document Findings** — Write a brief summary: current fields displayed, current issues/pain points, usage contexts, prop variations.
3. **Create a Plan** — Detailed redesign plan: new layout, component structure, visual hierarchy, specific improvements.
4. **Implement** — Execute step by step. Break into sub-components if the file is too long.
5. **Verify** — Check every import and usage across the codebase. Ensure nothing is broken.

Every pixel matters. Make this component something a matchmaker would love using for hours.
