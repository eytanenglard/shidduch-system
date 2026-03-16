Debug and fix: $ARGUMENTS

Follow this approach:
1. First, understand the bug — ask me clarifying questions if needed
2. Search for relevant files using the codebase (check API routes, services, components)
3. Trace the data flow: Component → API Route → Service → Prisma query
4. For mobile-related bugs, check both `src/app/api/mobile/` AND the corresponding web routes
5. Identify the root cause before proposing a fix
6. Explain what's wrong and propose the fix
7. WAIT for my approval before making changes
8. After fixing, check for:
   - TypeScript errors: `npx tsc --noEmit`
   - Related components/routes that might be affected
   - Whether the fix needs to be applied to both web and mobile API routes

IMPORTANT:
- Check MatchSuggestionStatus transitions — many bugs relate to incorrect status flows
- Check Prisma includes/selects — missing relations are a common issue
- For UI bugs, check RTL/Hebrew layout issues
- For auth bugs, check NextAuth session handling
