Run a security audit on: $ARGUMENTS

If no specific area is given, audit the most recently changed files.

Check for these security concerns:

1. **Authentication & Authorization:**
   - 🔴 Missing auth checks (no `getServerSession` or `verifyMobileToken`)
   - 🔴 Role escalation — CANDIDATE accessing MATCHMAKER/ADMIN routes
   - 🔴 Missing role validation after session check
   - 🟡 Mobile routes without `verifyMobileToken` (all `api/mobile/` routes must have it)
   - 🟡 Web routes without `getServerSession(authOptions)` check

2. **Input Validation:**
   - 🔴 Missing Zod validation on request bodies
   - 🔴 SQL injection risk (raw queries or string interpolation in Prisma)
   - 🔴 XSS via unsanitized user input rendered in components
   - 🟡 Missing email normalization (`.toLowerCase()`) before DB queries
   - 🟡 Missing pagination limits (unbounded `findMany`)

3. **Data Exposure:**
   - 🔴 Returning sensitive fields in API responses (password hashes, tokens, internal IDs)
   - 🔴 Exposing other users' private data (profile details to unauthorized roles)
   - 🟡 Returning more data than needed (missing `select` in Prisma queries)
   - 🟡 Leaking user existence via error messages ("user not found" vs generic error)

4. **CORS & Mobile Security:**
   - 🔴 Missing `OPTIONS` handler on mobile routes
   - 🔴 Overly permissive CORS headers
   - 🟡 Mobile token not being validated properly
   - 🟡 Missing rate limiting on sensitive endpoints (login, verification)

5. **Rate Limiting:**
   - Check Upstash Redis rate limiter usage
   - Role-based multipliers: ADMIN 10x, MATCHMAKER 5x, CANDIDATE 1x
   - Sensitive routes (auth, verification, AI) should always have rate limits

6. **File & Media:**
   - 🔴 Unrestricted file upload types/sizes
   - 🟡 Cloudinary URLs exposing original filenames
   - 🟡 Missing image validation before upload

Output format:
- 🔴 Critical (fix immediately)
- 🟡 Important (should fix)
- 🟢 Informational

For each finding, show the file, line, vulnerability type, and specific fix.
