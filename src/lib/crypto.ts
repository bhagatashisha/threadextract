import crypto from "crypto";

// Encrypts third-party API tokens (Slack bot token, Notion integration token)
// before they hit Postgres. Unrelated to user auth — NextAuth/Prisma-adapter
// handles user credentials separately.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function loadKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64) — generate one with `openssl rand -base64 32`",
    );
  }
  return key;
}

// Lazy singleton so a missing/invalid key fails loudly on first real use
// rather than crashing every route that merely imports this module.
let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) cachedKey = loadKey();
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Failed to decrypt token — payload is not in the expected iv:tag:ciphertext shape");
  }
  const [ivB64, tagB64, ciphertextB64] = parts;
  try {
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Failed to decrypt token — wrong key or corrupted ciphertext");
  }
}

export function isEncrypted(value: string): boolean {
  return /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(value);
}

/**
 * Best-effort decrypt for reading tokens written before encryption was
 * introduced. Existing plaintext rows keep working until they're next
 * written (oauth reconnect / dashboard save), at which point they're
 * re-encrypted — no backfill migration needed.
 */
export function safeDecrypt(value: string): string {
  try {
    return decrypt(value);
  } catch {
    console.warn("safeDecrypt: value did not decrypt, treating as legacy plaintext");
    return value;
  }
}
