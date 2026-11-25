export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export function isValidVietnamesePhone(raw: string): boolean {
  const normalized = normalizePhoneDigits(raw.trim());
  return /^0(3|5|7|8|9)\d{8}$/.test(normalized);
}
