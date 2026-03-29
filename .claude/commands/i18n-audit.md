Audit i18n translations for: $ARGUMENTS

If no specific area is given, scan the entire `src/components/` directory.

Perform these checks:

1. **Hardcoded Hebrew strings:**
   - Scan components for Hebrew text (Unicode range \u0590-\u05FF) that is NOT inside a dictionary lookup
   - Ignore: comments, console.log, error messages for developers, Prisma enum values
   - For each found: suggest a dictionary key name and the Hebrew + English values

2. **Missing dictionary keys:**
   - Compare `dictionaries/he.json` vs `dictionaries/en.json` — find keys that exist in one but not the other
   - Check `src/dictionaries/soul-fingerprint/he.json` vs `en.json`
   - Check any domain-specific dictionaries under `dictionaries/`

3. **Type definition sync:**
   - Verify that all dictionary keys used in code exist in `src/types/dictionary.d.ts`
   - Check for keys in the type definition that no longer exist in the JSON files

4. **Mobile dictionary sync:**
   - Compare web dictionaries with `../neshamatech-mobile/src/i18n/he.json` and `en.json`
   - Focus on shared keys (suggestions, profile, auth)

Output format:
- 🔴 **Hardcoded strings** (must fix) — list file, line, and the hardcoded text
- 🟡 **Missing translations** (should fix) — list the key and which language is missing
- 🟢 **Type mismatches** (nice to have) — list unused or missing type definitions
- 🔵 **Mobile desync** (check) — list keys that differ between web and mobile

After the audit, offer to fix all found issues automatically.