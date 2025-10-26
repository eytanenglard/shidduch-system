import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "eslint-config-next"; // הוסף את השורה הזו

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      // ...שאר התיקיות להתעלמות
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // הוסף את הבלוק הזה עבור תצורת Next.js
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ...nextPlugin, 
  },
  
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      // ... languageOptions
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // העבר את הכללים המותאמים אישית שלך לכאן
      ...nextPlugin.rules, // שלב את כללי Next.js
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      
      // ... שאר הכללים שלך
    },
  },
];