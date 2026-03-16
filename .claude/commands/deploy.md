Prepare and deploy the current changes to Heroku production.

Follow this checklist:
1. Run `npx tsc --noEmit` to check for TypeScript errors — fix any errors found
2. Run `npx next lint` to check for linting issues
3. Check for any uncommitted changes with `git status`
4. Review the diff of changes: `git diff --stat`
5. Show me a summary of all changes being deployed
6. WAIT for my approval before proceeding

After approval:
7. Stage and commit with a descriptive Hebrew+English message
8. Push to Heroku: `git push heroku main`
9. If there are Prisma schema changes, remind me to run migrations on production:
   `heroku run npx prisma migrate deploy -a matchpoint`
10. Check build logs for errors

IMPORTANT:
- The Heroku app name is `matchpoint`
- Build script runs: `prisma generate && next build && npm run build:scripts`
- Production removes source files and .next cache to save slug size
- Console logs are stripped in production except `console.error`
