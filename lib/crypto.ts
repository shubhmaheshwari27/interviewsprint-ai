import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto"

/**
 * AES-256-GCM encryption for secrets stored in the database (users' AI keys).
 *
 * The 32-byte key comes from ENCRYPTION_KEY (base64, 32 bytes) if set, otherwise
 * it is derived from AUTH_SECRET with HKDF and a fixed, purpose-specific salt.
 * Rotating AUTH_SECRET without setting ENCRYPTION_KEY makes stored keys
 * unreadable; users would simply re-enter them.
 *
 * Stored format: "v1:<iv b64>:<auth tag b64>:<ciphertext b64>"
 */

function encryptionKey(): Buffer {
  const explicit = process.env.ENCRYPTION_KEY?.trim()
  if (explicit) {
    const key = Buffer.from(explicit, "base64")
    if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded")
    return key
  }
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("Set AUTH_SECRET or ENCRYPTION_KEY to store secrets")
  return Buffer.from(hkdfSync("sha256", secret, "interviewsprint-ai-key-store", "ai-provider-keys:v1", 32))
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return ["v1", iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":")
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(":")
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format")
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
}

/** "…a3F9": enough to recognise a key, useless to anyone else. */
export function keyHint(key: string): string {
  return `…${key.trim().slice(-4)}`
}

/** One-way hash for API tokens (the token itself is only shown once). */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

/** Random personal access token, e.g. "isp_3Jx…". */
export function newApiToken(): string {
  return `isp_${randomBytes(24).toString("base64url")}`
}
