import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        process: "readonly",
        test: "readonly",
        expect: "readonly",
        describe: "readonly",
        it: "readonly",
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "coverage/",
      "dist/",
      "build/",
      ".vercel/",
      ".output/",
      "public/",
      "scripts/",
      "prisma/",
      ".husky/",
      ".github/",
      "docs/",
      "*.config.js",
      "*.config.mjs",
      "vitest.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "next.config.*",
    ],
  },
];
