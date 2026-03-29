Create a Prisma query for: $ARGUMENTS

Follow the project's Prisma patterns:

1. **Read the schema first:** `prisma/schema.prisma` — understand the models and relations involved

2. **Query conventions:**
   - Always import from `@/lib/prisma`
   - Use `select` instead of full model when only a few fields are needed
   - Use `include` only for relations you actually need
   - NEVER include `ProfileVector` unless you specifically need the 3072-dim vectors
   - Use `findFirst` when expecting one result, `findMany` for lists
   - Always add `take`/`skip` for potentially large result sets
   - Use `count()` when you only need the count, not the data

3. **Common patterns in this project:**
   - User with Profile: `include: { profile: true }`
   - User with images: `include: { profile: { include: { images: true } } }`
   - Suggestions with both parties: `include: { firstParty: { include: { profile: true } }, secondParty: { include: { profile: true } } }`
   - Matching candidates: Always filter by `gender`, `availabilityStatus: 'AVAILABLE'`, `isProfileComplete: true`, `isPhoneVerified: true`

4. **Performance rules:**
   - Parallel queries: Use `prisma.$transaction([...])` or `Promise.all([...])`
   - Avoid queries inside loops — batch with `where: { id: { in: ids } }`
   - Use `orderBy` + `take` instead of fetching all and sorting in JS
   - Use `distinct` when appropriate

5. **Filtering patterns:**
   - Date ranges: `{ createdAt: { gte: startDate, lte: endDate } }`
   - Enum filtering: `{ status: { in: ['ACTIVE', 'AVAILABLE'] } }`
   - JSON field queries: `{ questionnaireAnswers: { path: ['worldId'], equals: 'PERSONALITY' } }`
   - Relation filtering: `{ profile: { is: { gender: 'MALE' } } }`

Show the complete TypeScript code with proper types.
