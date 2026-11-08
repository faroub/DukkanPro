// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Route files must stay thin: no direct database access from src/app.
    // Data access belongs in hooks, services, or repositories used by the
    // feature screens the routes render. The previous static test in
    // src/__tests__/security-rules.test.ts enforced this by grepping for raw
    // SQL keywords; this rule enforces the stronger structural boundary.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/database", "@/database/*", "../database*", "../../database*", "../../../database*"],
              message: "Route files must not import the database layer. Access data through hooks or the feature screens rendered by the route.",
            },
          ],
        },
      ],
    },
  },
]);
