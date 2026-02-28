import crypto from "crypto";

/**
 * AES-256-GCM encryption for Shopify access tokens.
 *
 * Key: SHOPIFY_ENCRYPTION_KEY env var (64-char hex string = 32 bytes)
 * Format: base64( iv[12] + ciphertext + authTag[16] )
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.SHOPIFY_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "SHOPIFY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext token string.
 * Returns base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv + ciphertext + authTag
  const packed = Buffer.concat([iv, encrypted, authTag]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded ciphertext back to plaintext.
 */
export function decryptToken(encrypted: string): string {
  const key = getKey();
  const packed = Buffer.from(encrypted, "base64");

  // Unpack: iv (12 bytes) + ciphertext (middle) + authTag (16 bytes)
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(packed.length - TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
