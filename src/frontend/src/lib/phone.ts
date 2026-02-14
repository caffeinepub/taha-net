/**
 * Phone number utilities for subscriber claim flow.
 * Validates and sanitizes Iraqi phone numbers starting with "09".
 */

/**
 * Sanitizes input to digits only
 */
export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Validates that phone is exactly 10 digits and starts with "09"
 */
export function isValidPhone(phone: string): boolean {
  const sanitized = sanitizePhone(phone);
  return sanitized.length === 10 && sanitized.startsWith('09');
}

/**
 * Formats phone for display (adds spaces for readability)
 */
export function formatPhoneDisplay(phone: string): string {
  const sanitized = sanitizePhone(phone);
  if (sanitized.length !== 10) return phone;
  // Format as: 09XX XXX XXXX
  return `${sanitized.slice(0, 4)} ${sanitized.slice(4, 7)} ${sanitized.slice(7)}`;
}

/**
 * Gets validation error message for phone input
 */
export function getPhoneValidationError(phone: string): string | null {
  const sanitized = sanitizePhone(phone);
  
  if (sanitized.length === 0) {
    return 'يرجى إدخال رقم الهاتف';
  }
  
  if (!sanitized.startsWith('09')) {
    return 'يجب أن يبدأ الرقم بـ 09';
  }
  
  if (sanitized.length < 10) {
    return `يجب إدخال ${10 - sanitized.length} أرقام إضافية`;
  }
  
  if (sanitized.length > 10) {
    return 'الرقم يجب أن يكون 10 أرقام فقط';
  }
  
  return null;
}
