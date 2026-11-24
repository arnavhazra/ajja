import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Lighthouse CI config is consumed by @lhci/cli, not app code.
    "lighthouserc.json",
    // Vendored agent skills ship minified demos and third-party sources.
    ".agents/skills/**",
  ]),
]);

export default eslintConfig;
