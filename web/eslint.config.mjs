/**
 * Flat ESLint config for the Flash web app (Next.js 16 + React 19 + TS).
 *
 * Extends Next's recommended rules (`eslint-config-next`), which bundle
 * Core Web Vitals and TypeScript checks. Run with `pnpm lint`.
 */
import next from "eslint-config-next";

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "*.config.*"] },
  ...next,
  {
    rules: {
      // React Compiler-era rule (Next 16). We hydrate a few dashboard forms from
      // fetched query data via setState-in-effect — a common, working pattern.
      // Keep it as a warning (visible, non-blocking) to revisit during a future
      // React Compiler adoption pass rather than block lint on working code.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
