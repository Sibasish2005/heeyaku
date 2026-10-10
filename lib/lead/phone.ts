import { z } from 'zod';

/**
 * Standard 10-digit phone number regex.
 * Enforces exactly 10 numerical digits.
 */
export const PHONE_REGEX = /^[0-9]{10}$/;

/**
 * HTML input pattern attribute for client-side form validation.
 */
export const FRONTEND_PHONE_PATTERN = '[0-9]{10}';

/**
 * Normalizes a telephone number for consistent database storage and robust duplicate detection.
 * Strips all non-digit characters, handles Indian country code (+91 / 91) and leading 0 uniformly,
 * returning the normalized 10-digit number.
 *
 * @param raw - Candidate phone number string (e.g. '+91 98765-43210', '09876543210')
 * @returns {string} The normalized 10-digit numerical string, or empty string if input empty
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  // Strip all non-digits
  const digits = trimmed.replace(/\D/g, '');

  // If 12 digits starting with 91 (e.g. +91 9876543210 or 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
}

/**
 * Validates whether a phone number string (raw or normalized) corresponds to a valid 10-digit number.
 *
 * @param phone - Phone number candidate to test
 * @returns {boolean} True if exactly 10 numerical digits after normalization
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  return PHONE_REGEX.test(normalized);
}

/**
 * Extracts the last 10 numerical digits from any phone number string.
 * Uniformly used across telephony telemetry logging, lead matching, and analytics deduplication.
 *
 * @param phone - Phone number string or null/undefined
 * @returns {string} The trailing 10 digits
 */
export function toLast10Digits(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Reusable Zod schema for 10-digit phone number validation in forms, Server Actions, and API routes.
 * Automatically trims, strips symbols/prefixes via `normalizePhoneNumber`, and enforces `PHONE_REGEX`.
 */
export const zodPhoneNumberSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((val) => normalizePhoneNumber(val))
  .refine((val) => PHONE_REGEX.test(val), {
    message: 'Phone number must be a valid 10-digit number (e.g. 9876543210)',
  });
