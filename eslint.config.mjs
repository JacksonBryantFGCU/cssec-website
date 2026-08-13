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
    // The approved Claude Design export. Reference material, never built or
    // imported, and deliberately left byte-for-byte as delivered — so it is
    // not ours to lint or fix.
    "design-reference/**",
  ]),
]);

export default eslintConfig;
