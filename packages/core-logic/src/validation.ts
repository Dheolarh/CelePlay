// Validation rules for Celeplay

/**
 * Validates a name (must be at least 3 characters)
 */
export const validateName = (name: string): boolean => {
  return name.trim().length >= 3;
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
 * Validates a phone number based on country.
 * In a real-world scenario, we'd use libphonenumber-js for robust validation.
 * For now, we use a regex that ensures it starts with a '+' and has 7-15 digits.
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  // E.164 format: + followed by 1 to 15 digits
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  // Allow local format as fallback (just digits, 10-11 usually)
  const localPhoneRegex = /^0\d{9,10}$/;
  
  const cleanPhone = phone.trim().replace(/[-\s]/g, '');
  return phoneRegex.test(cleanPhone) || localPhoneRegex.test(cleanPhone);
};
