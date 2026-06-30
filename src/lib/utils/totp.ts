import crypto from "crypto";

// Alphabet for Base32 as per RFC 4648
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Base32 decoder
 * @param input 
 * @returns Buffer
 */
function base32Decode(input: string) {
  const cleanInput = input.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (let i = 0; i < cleanInput.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${cleanInput[i]}`);
    }
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Base32 encoder
 * @param buffer 
 * @returns string
 */
function base32Encode(buffer: Buffer) {
  let bits = "";
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, "0");
  }
  let base32 = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) {
      const paddedChunk = chunk.padEnd(5, "0");
      base32 += BASE32_ALPHABET[parseInt(paddedChunk, 2)];
    } else {
      base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }
  return base32;
}

/**
 * Generates a random Base32 encoded TOTP secret (32 chars / 160 bits)
 * @returns string
 */
export function generateSecret() {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

/**
 * Generates an HOTP code (conforming to RFC 4226)
 * @param secret Base32 encoded secret
 * @param counter The step counter
 * @returns 6-digit OTP code
 */
function generateHOTP(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  
  // Write counter as 64-bit big-endian integer
  let high = Math.floor(counter / 0x100000000);
  let low = counter % 0x100000000;
  buffer.writeUInt32BE(high, 0);
  buffer.writeUInt32BE(low, 4);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  const h = hmac.update(buffer).digest();

  // Dynamic truncation
  const offset = h[h.length - 1] & 0x0f;
  const code = (
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff)
  ) % 1000000; // 6 digits

  return code.toString().padStart(6, "0");
}

/**
 * Verifies a TOTP code (RFC 6238 time step)
 * @param secret Base32 secret key
 * @param token 6-digit OTP code to verify
 * @param window Drift window size (+- steps)
 * @returns True if verified, false otherwise
 */
export function verifyTOTP(secret: string, token: string, window = 1) {
  if (!token || token.length !== 6 || isNaN(Number(token))) {
    return false;
  }
  
  const step = Math.floor(Date.now() / 30000);
  
  // Validate counter steps within the tolerance drift window
  for (let i = -window; i <= window; i++) {
    const expected = generateHOTP(secret, step + i);
    if (expected === token) {
      return true;
    }
  }
  return false;
}
