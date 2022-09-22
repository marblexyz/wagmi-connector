module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    // ESLint rules
    "no-alert": 0,
    "no-underscore-dangle": 0,
    "no-useless-constructor": 0,
    "class-methods-use-this": 0,
    "no-console": ["error", { allow: ["warn", "error"] }],

    // Import rules
    "import/extensions": 0,
    "import/no-extraneous-dependencies": 0,

    // TypeScript rules
    "@typescript-eslint/ban-types": 0,
    "@typescript-eslint/no-unsafe-call": 0,
    "@typescript-eslint/await-thenable": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-unsafe-return": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-floating-promises": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/no-useless-constructor": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "@typescript-eslint/restrict-template-expressions": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-duplicate-imports": ["error"],

    // Fix for no-shadow bug
    // Context: https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    "prettier/prettier": "error",
  },

  settings: {
    "import/resolver": {
      typescript: {
        directory: ["**/tsconfig.json"],
      },
    },
  },
};
