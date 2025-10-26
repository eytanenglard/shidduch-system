// --- START OF FILE eslint.config.mjs ---

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

// שימוש ב-defineConfig אינו חובה אך מומלץ לאינטליסנס
export default tseslint.config(
  // הגדרה גלובלית שחלה על כל הקבצים
  {
    ignores: ["node_modules", ".next"],
  },

  // הגדרות ברירת המחדל של ESLint
  js.configs.recommended,

  // ...tseslint.configs.recommended - הגדרות מומלצות ל-TypeScript
  ...tseslint.configs.recommended,

  // הגדרות עבור React
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // לא נדרש ב-Next.js וב-React 17+
    },
    settings: {
      react: {
        version: "detect", // מזהה אוטומטית את גרסת ה-React
      },
    },
  }
);