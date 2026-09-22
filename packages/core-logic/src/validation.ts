// Validation rules for Celeplay

/** Minimum characters required in a single name part. */
export const MIN_NAME_LENGTH = 3;

/** Nigerian mobile numbers are 11 digits and start with 0, e.g. 08012345678. */
export const PHONE_PATTERN = /^0\d{10}$/;

/**
 * Validates a full name.
 *
 * Requires BOTH a first and a last name, each at least MIN_NAME_LENGTH
 * characters. A single-word name is rejected, so "Ada" fails but "Ada Obi"
 * passes. Extra middle names are allowed and not length-checked.
 */
export const validateName = (name: string): { valid: boolean; message?: string } => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return { valid: false, message: 'Enter your first name and last name.' };
  }

  const [first, last] = parts;
  if (first.length < MIN_NAME_LENGTH) {
    return { valid: false, message: `First name must be at least ${MIN_NAME_LENGTH} characters.` };
  }
  if (last.length < MIN_NAME_LENGTH) {
    return { valid: false, message: `Last name must be at least ${MIN_NAME_LENGTH} characters.` };
  }

  return { valid: true };
};

/**
 * Validates an email address.
 * Simple regex to ensure valid format (e.g. user@provider.com)
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates a Nigerian mobile number.
 *
 * Exactly 11 digits with a leading zero. Spaces and dashes are stripped first,
 * so "0803 123 4567" is accepted while "+234..." and 10-digit forms are not.
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const digits = phone.trim().replace(/[-\s()]/g, '');
  return PHONE_PATTERN.test(digits);
};
