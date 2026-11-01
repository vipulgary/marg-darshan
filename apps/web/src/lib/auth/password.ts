import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt (node:crypto). The stored format is versioned so parameters can be
 * raised later without breaking old hashes: scrypt$v1$<N>$<r>$<p>$<salt b64url>$<hash b64url>.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
export const MAX_PASSWORD = 256;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keylen, { N: n, r, p, maxmem: 256 * n * r + 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, N, R, P, KEYLEN);
  return ["scrypt", "v1", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

// Verified against when the account doesn't exist, so a miss costs as much as a hit.
const DUMMY = "scrypt$v1$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const parts = (stored || DUMMY).split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== "v1") return false;
  const [n, r, p] = parts.slice(2, 5).map(Number);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0) || n > 1 << 20 || r > 32 || p > 16) return false;
  const salt = Buffer.from(parts[5], "base64url");
  const expected = Buffer.from(parts[6], "base64url");
  if (!expected.length || password.length > MAX_PASSWORD) return false;
  const actual = await derive(password, salt, n, r, p, expected.length);
  return timingSafeEqual(actual, expected) && Boolean(stored);
}

export type PasswordProblem = "too_short" | "too_long" | "all_digits";

export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < 8) return "too_short";
  if (password.length > MAX_PASSWORD) return "too_long";
  if (/^\d+$/.test(password)) return "all_digits";
  return null;
}
