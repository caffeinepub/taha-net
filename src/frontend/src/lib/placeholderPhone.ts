/**
 * Detects whether a phone number is a backend-generated placeholder.
 * Placeholder phones follow the pattern: "placeholder-{id}"
 */
export function isPlaceholderPhone(phone: string): boolean {
  return phone.startsWith('placeholder-');
}
