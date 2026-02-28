import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["*.js"],
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
    // app.js consumes the namespaces defined in the other script files
    files: ["app.js"],
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
