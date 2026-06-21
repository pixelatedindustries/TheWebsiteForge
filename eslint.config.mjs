// @ts-check
// Flat config that extends Nuxt's generated, project-aware ESLint config.
// Run `nuxt prepare` (or `pnpm postinstall`) once so `.nuxt/eslint.config.mjs`
// exists, then `pnpm lint` / `pnpm lint:fix`.
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // Prettier owns formatting; keep ESLint focused on correctness.
  },
}).append({
  // Generated SQL migrations and local runtime data aren't ours to lint.
  ignores: ["server/database/migrations/**", ".data/**"],
});
