import { defineConfig } from "vitest/config";

// Unit tests for pure logic (no Nuxt runtime). Server routes that rely on Nitro
// auto-imports / the database are covered by Playwright + a future test-DB
// integration suite, not here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
