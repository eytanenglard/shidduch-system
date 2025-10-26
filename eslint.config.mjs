import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
// ==================== הוספה חשובה ====================
// מייבאים את התצורה המוכנה של Next.js
import nextPlugin from "eslint-config-next";
// ======================================================

export default [
  // חלק 1: הגדרות גלובליות וקבצים להתעלמות
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

  // חלק 2: תצורות בסיס מומלצות
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ==================== השינוי המרכזי ====================
  // חלק 3: הוספת תצורת הליבה של Next.js
  // אובייקט זה מכיל את כל הכללים, הפלאגינים והגדרות המפענח (parser)
  // הנדרשים עבור פרויקט Next.js. זה פותר את האזהרה שהופיעה ב-build.
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ...nextPlugin,
  },
  // ==========================================================

  // חלק 4: הגדרות מותאמות אישית שלך (Custom Rules & Overrides)
  // בלוק זה מגיע *אחרי* הגדרות הבסיס ו-Next.js כדי להבטיח
  // שהכללים הספציפיים שלך ידרסו את ברירות המחדל במידת הצורך.
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],

    plugins: {
      // למרות ש-Next.js כבר כולל אותם, הגדרה מפורשת כאן
      // מבטיחה שהכללים שלך יזוהו כראוי.
      'react': pluginReact,
      'react-hooks': pluginReactHooks,
    },

    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },

    settings: {
      react: {
        version: "detect", // מזהה אוטומטית את גרסת ה-React
      },
    },

    // כאן נמצאים כל הכללים שהגדרת במקור.
    rules: {
      // תחילה, אנו כוללים את הכללים המומלצים מהפלאגינים
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      
      // --- הכללים המותאמים אישית שלך ---

      // כלל זה מיותר בגרסאות Next.js ו-React האחרונות
      "react/react-in-jsx-scope": "off",

      // כלל זה מיותר בפרויקטי TypeScript, כי המערכת בודקת טיפוסים
      "react/prop-types": "off",
      
      // הכללים שהגדרת עבור TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn", // משנה את רמת החומרה לאזהרה במקום שגיאה
        { 
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true 
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      
      // כללים כלליים
      "no-case-declarations": "warn",

      // כללי React Hooks שהגדרת (חשובים מאוד)
      "react-hooks/exhaustive-deps": "warn", // מתריע על תלויות חסרות ב-hooks
      "react-hooks/rules-of-hooks": "error", // אוכף את כללי השימוש ב-hooks
    },
  },
];