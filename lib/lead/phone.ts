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
 * Normalizes a phone number for consistent storage and robust duplicate detection.
 * Removes spaces, hyphens, parentheses, dots, and prefixes.
 * Handles Indian country code +91 / 91 and leading 0 uniformly.
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
 * Validates whether a phone number string (raw or normalized) is a valid 10-digit number.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  return PHONE_REGEX.test(normalized);
}

/**
 * Extracts the last 10 numerical digits from any phone number string.
 * Uniformly used across call logging, lead matching, and analytics deduplication.
 */
export function toLast10Digits(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Reusable Zod schema for 10-digit phone number validation.
 * Normalizes common phone formatting (+91, leading 0, spaces, hyphens)
 * and strictly validates that exactly 10 digits remain.
 */
export const zodPhoneNumberSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((val) => normalizePhoneNumber(val))
  .refine((val) => PHONE_REGEX.test(val), {
    message: 'Phone number must be a valid 10-digit number (e.g. 9876543210)',
  });
