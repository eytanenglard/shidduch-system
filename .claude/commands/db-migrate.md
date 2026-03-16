I need to make changes to the database schema for: $ARGUMENTS

Follow this workflow:
1. First, read `prisma/schema.prisma` to understand the current schema
2. Propose the schema changes and explain the impact on existing data and relations
3. WAIT for my approval before making any changes
4. After approval, edit `prisma/schema.prisma`
5. Show me the exact migration command to run: `npx prisma migrate dev --name <descriptive-name>`
6. If the change affects existing API routes or services, list all files that need updating
7. Check for any TypeScript type files in `src/types/` that need updating

IMPORTANT: 
- Never drop columns or tables without explicit confirmation
- Always consider the mobile app (`api/mobile/`) impact
- Check if ProfileMetrics or ProfileVector models are affected
- Consider index additions for query performance
