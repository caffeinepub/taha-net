/**
 * Validates and sanitizes a WhatsApp phone number
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Phone number should have at least 7 digits
  return digits.length >= 7;
}

/**
 * Sanitizes a phone number for WhatsApp URL
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number with only digits
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Constructs a WhatsApp wa.me URL
 * @param phone - The phone number
 * @returns The wa.me URL
 */
export function getWhatsAppUrl(phone: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  return `https://wa.me/${sanitized}`;
}

/**
 * Opens WhatsApp chat in a new tab
 * @param phone - The phone number
 */
export function openWhatsAppChat(phone: string): void {
  if (!isValidWhatsAppPhone(phone)) {
    throw new Error('Invalid phone number');
  }
  window.open(getWhatsAppUrl(phone), '_blank', 'noopener,noreferrer');
}
