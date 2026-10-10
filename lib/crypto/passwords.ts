import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generates a cryptographically secure, random temporary password using Node.js `crypto.randomInt`.
 * Guarantees inclusion of at least one uppercase, lowercase, numerical, and special symbol character,
 * and eliminates visually ambiguous glyphs (e.g., 'I', 'l', 'O', '0'). Shuffled via Fisher-Yates.
 *
 * @param length - Total length of the password string to generate (default: 16)
 * @returns {string} The randomly generated plain-text password
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one of each character set
  const password = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Shuffle array using Fisher-Yates
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

/**
 * Hashes a plaintext password string using bcrypt with 10 salt rounds.
 *
 * @param plainText - The raw plain-text password to hash
 * @returns {Promise<string>} The generated bcrypt hash string
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

/**
 * Compares a candidate plaintext password with an existing bcrypt hash.
 *
 * @param plainText - Candidate plain-text password submitted by user
 * @param hash - Stored bcrypt hash string from PostgreSQL Employee record
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
