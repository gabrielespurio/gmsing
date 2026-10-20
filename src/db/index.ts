import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_GgPS0y7FwzRe@ep-rough-pine-b69jev66-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
