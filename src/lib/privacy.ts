/**
 * Masks Vietnamese phone numbers and long account numbers by default (Privacy-by-Design).
 * Example: 0912345678 -> 0912 *** 678
 */
export function maskSensitiveTarget(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const phoneReplaced = trimmed.replace(/\b(0\d{3})[\s.-]?(\d{3})[\s.-]?(\d{3})\b/g, '$1 *** $3');
  if (phoneReplaced !== trimmed) return phoneReplaced;

  // Mask long bank account numbers (8+ digits) when not a URL
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\b(\d{4})(\d{2,})(\d{4})\b/g, '$1 **** $3');
  }

  return trimmed;
}
