import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "dist/**/*",
      "scratch/**/*",
      "src/app_backup_*",
      "src/app_baseline_*",
      "src/app_clean_*",
      "src/app_fully_*",
      "src/app_partially_*",
      "src/app_reconstructed_*",
      "src/app_replayed*"
    ]
  },
  js.configs.recommended,
  {
    files: ["src/app.jsx", "src/main.jsx", "src/components/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        global: "readonly",
        globalThis: "readonly",
        React: "readonly",
        await: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly"
      }
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
      "react/react-in-jsx-scope": "off"
    },
    settings: {
      react: {
        version: "18.2"
      }
    }
  }
];
