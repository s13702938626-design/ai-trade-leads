import { defineConfig } from "drizzle-kit";

const databaseFile = process.env.DATABASE_FILE ?? "./data/ai-trade-leads.db";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseFile,
  },
});
