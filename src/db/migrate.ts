import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function runMigrate() {
  const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_GgPS0y7FwzRe@ep-rough-pine-b69jev66-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const sql = neon(url);
  const sqlFile = path.join(process.cwd(), "drizzle", "0000_smooth_bill_hollister.sql");
  const content = fs.readFileSync(sqlFile, "utf-8");
  
  const statements = content.split("--> statement-breakpoint");
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      await (sql as any).query(trimmed);
    }
  }
  console.log("Migration executed successfully!");
}

runMigrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
