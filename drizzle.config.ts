import { defineConfig } from "drizzle-kit";
import { env } from "node:process";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
