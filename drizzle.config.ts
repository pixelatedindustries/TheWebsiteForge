import { defineConfig } from "drizzle-kit";
import "dotenv/config";

/**
 * Drizzle Kit config — used by the db:* scripts in package.json to generate
 * and apply SQL migrations. Reads DATABASE_URL from your .env.
 */
export default defineConfig({
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
