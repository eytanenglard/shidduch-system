// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/.vercel/**",
      "**/public/**",
      "**/dist/**",
    ],
  },

  // תצורות בסיס
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  // ================================================================
  // ▼▼▼ הוסף את הבלוק החדש כאן ▼▼▼
  // ================================================================
  {
    files: ["**/*.d.ts"], // החל כללים אלו רק על קבצי הגדרות טיפוסים
    rules: {
      // כבה את הבדיקה הזו, כי בקבצים אלו היא נדרשת
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // ================================================================
  // ▲▲▲ סוף הבלוק החדש ▲▲▲
  // ================================================================


  // כללים מותאמים אישית שלך
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // כללים מומלצים מהפלאגינים
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      
      // הכללים המותאמים אישית שלך
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  }
);