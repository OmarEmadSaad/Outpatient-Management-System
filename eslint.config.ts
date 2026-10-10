import type { Linter } from "eslint";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const TYPESCRIPT_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const UNUSED_VARS_OPTIONS = {
  varsIgnorePattern: "^_",
  argsIgnorePattern: "^_",
};

const eslintConfig: Linter.Config[] = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "max-lines": ["error", { max: 300 }],
      "no-unused-vars": ["error", UNUSED_VARS_OPTIONS],
    },
  },
  {
    files: TYPESCRIPT_FILES,
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", UNUSED_VARS_OPTIONS],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "max-lines": ["error", { max: 300 }],
    },
  },
];

export default eslintConfig;
