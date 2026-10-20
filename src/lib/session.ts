import { createHmac, timingSafeEqual, scryptSync } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "gmsign_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 horas

const SESSION_SECRET =
  process.env.SESSION_SECRET || "gmsign-super-secret-key-prod-2026";

function sign(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export async function checkCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !user.active) {
    return null;
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function createSessionToken(user: { id: string; email: string; name: string; role: string }) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return {
      id: data.id as string,
      email: data.email as string,
      name: data.name as string,
      role: data.role as string,
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
