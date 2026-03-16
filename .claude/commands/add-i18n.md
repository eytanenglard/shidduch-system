Add i18n translation strings for: $ARGUMENTS

Follow this workflow:
1. Determine which dictionary section the strings belong to (auth, matchmaker, admin, or general)
2. Add the Hebrew strings to the appropriate section in the Hebrew dictionary file
3. Add the English strings to the matching section in the English dictionary file
4. If a new section/namespace is needed, update the corresponding type file in `src/types/dictionaries/`
5. Ensure RTL compatibility for any UI-facing text
6. Keep translations natural — not word-for-word. Hebrew should feel native, not translated.

IMPORTANT:
- Hebrew is the PRIMARY language — write Hebrew first, then English
- Check existing dictionary files for naming conventions before adding keys
- Use dot notation for nested keys: `section.subsection.key`
- Never hardcode Hebrew strings in components — always use the dictionary
