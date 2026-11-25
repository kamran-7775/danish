/**
 * Admin authentication: one password (ADMIN_PASSWORD), session in a signed, http-only cookie.
 * The signature includes the password, so changing ADMIN_PASSWORD logs out every session.
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "dn_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET is missing or too short. See .env.example.");
  return s;
}

const sign = (value: string) =>
  createHmac("sha256", secret()).update(`${value}.${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");

function verify(token: string | undefined) {
  if (!token) return false;
  const [value, sig] = token.split(".");
  if (!value || !sig || !/^[0-9a-f]+$/.test(sig)) return false;
  const expires = Number(value);
  if (!expires || expires < Date.now()) return false;
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(sign(value), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Constant-time password check. */
export function checkPassword(input: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const h = (s: string) => createHmac("sha256", "pw-compare").update(s).digest();
  return timingSafeEqual(h(input), h(real));
}

export async function isAdmin() {
  return verify((await cookies()).get(COOKIE)?.value);
}

/** Call at the top of every admin action / API route. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in.");
}

export async function startSession() {
  const value = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}
