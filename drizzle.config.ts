import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_GgPS0y7FwzRe@ep-rough-pine-b69jev66-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
