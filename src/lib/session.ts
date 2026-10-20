import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gmsign_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

// Defina estas variáveis de ambiente na Hostinger para trocar o acesso.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@gmsign.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "GMSign@2026";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "troque-este-segredo-em-producao";

function sign(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkCredentials(email: string, password: string) {
  const emailOk = safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase());
  const passOk = safeEqual(password, ADMIN_PASSWORD);
  return emailOk && passOk;
}

export function createSessionToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
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
    return { email: data.email as string };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
