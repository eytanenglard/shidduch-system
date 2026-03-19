# ProfileCard Component - Full Redesign & Refactor

## Mission
I need you to completely redesign and refactor the `ProfileCard` component located at:
`src/components/profile/`

This is one of the most critical components in my system — it's the component that presents one party's profile details to the other party in a matchmaking (shidduch) flow. It must be **world-class** in design, UX, and code quality.

## Before You Start — Deep Research Phase

Before writing any code or plan, study the following thoroughly:

1. **Prisma Schema** — Read `prisma/schema.prisma` to understand the full data model: User, Profile, QuestionnaireResponse, UserImage, ProfileMetrics, and all related entities.
2. **The Current ProfileCard** — Read every file in `src/components/profile/` and understand the full component tree, props, state, and rendering logic.
3. **Translation Files** — Read `src/dictionaries/he.json` and `src/dictionaries/en.json` to understand all i18n keys used by ProfileCard and related components.
4. **Usage Across the App** — Search for every import and usage of ProfileCard throughout the codebase (`grep -r "ProfileCard" src/`). Understand every context where it's rendered.
5. **Related Services** — Check any services that feed data into ProfileCard (profile services, suggestion services, etc.)

## Requirements

### Design & UX
- Professional, modern, aesthetic design — on par with the best matchmaking/dating platforms in the world
- Intuitive information hierarchy — most important details first
- Beautiful typography, spacing, and visual rhythm
- Smooth transitions and micro-interactions where appropriate
- Perfect RTL (Hebrew) support as the default, with LTR (English) support
- Mobile-responsive design
- Consistent with the app's brand colors: Teal (primary), Orange/Amber (secondary), Rose/Pink (accent)

### Functional
- **Preserve ALL existing fields and values** — do not remove any data point currently being rendered
- Improve how the data is organized, grouped, and visually presented
- Ensure all i18n dictionary keys are used correctly
- Maintain all existing functionality (callbacks, interactions, conditional rendering)

### Code Architecture
- Clean, modular component structure — break into well-named sub-components if the file is too long
- TypeScript strict mode compliance
- Proper typing for all props and state
- Follow existing project patterns (Tailwind CSS, Next.js App Router conventions)
- Ensure every file that imports ProfileCard works correctly after the refactor

## Workflow

1. **Research** — Complete the deep research phase above
2. **Document Findings** — Write a summary of all fields, props, usage contexts, and current issues
3. **Create a Plan** — Write a detailed redesign plan with component structure, layout decisions, and UX improvements
4. **Implement** — Execute the plan step by step
5. **Verify** — Check all imports and usages across the codebase to ensure nothing is broken
