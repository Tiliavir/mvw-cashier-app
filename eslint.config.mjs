import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["public/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
        module: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { "caughtErrorsIgnorePattern": "^_" }],
    },
  },
  {
    // page scripts consume the namespaces defined in the other script files
    files: ["public/js/app.js", "public/*/js/*-app.js"],
    languageOptions: {
      globals: {
        Models: "readonly",
        Store: "readonly",
        UI: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["node_modules/"],
  },
];
