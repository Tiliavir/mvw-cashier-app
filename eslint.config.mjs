import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/js/**/*.js"],
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
    files: ["src/js/app.js", "src/js/*/create-app.js", "src/js/*/edit-app.js", "src/js/*/settings-app.js", "src/js/*/stats-app.js"],
    languageOptions: {
      globals: {
        Models: "readonly",
        Store: "readonly",
        UI: "readonly",
        Paths: "readonly",
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
    ignores: ["node_modules/", "public/**/*.js"],
  },
  {
    files: ["scripts/**/*.js", "postcss.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
];
