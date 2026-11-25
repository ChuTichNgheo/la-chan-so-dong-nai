/**
 * Pure TypeScript VietQR (EMVCo TLV) & URL QR payload parser.
 * Decodes Vietnamese banking QR strings (000201...) into Bank name, Account Number (STK),
 * Transfer Amount, and Description BEFORE the user opens a banking app.
 */

const VIETNAM_BANK_BINS: Record<string, string> = {
  '970436': 'Vietcombank (VCB)',
  '970407': 'Techcombank (TCB)',
  '970422': 'MBBank (MB)',
  '970418': 'BIDV',
  '970415': 'VietinBank',
  '970416': 'ACB',
  '970405': 'Agribank',
  '970432': 'VPBank',
  '970403': 'Sacombank',
  '970423': 'TPBank',
  '970441': 'VIB',
  '970426': 'MSB',
  '970448': 'OCB',
  '970437': 'HDBank',
  '970443': 'SHB',
  '970454': 'BVBank (VietCapital)',
  '970431': 'Eximbank',
  '970428': 'Nam A Bank',
  '970409': 'Bac A Bank',
  '970414': 'OCEANBANK / MBV',
  '970449': 'LPBank',
  '970429': 'SCB',
};

export interface ParsedQrPayload {
  kind: 'vietqr' | 'url' | 'text';
  raw: string;
  bankName?: string;
  bankBin?: string;
  accountNumber?: string;
  amountVnd?: string;
  transferNote?: string;
  scanSummary: string;
}

function parseTlv(input: string): Map<string, string> {
  const map = new Map<string, string>();
  let idx = 0;
  while (idx + 4 <= input.length) {
    const tag = input.slice(idx, idx + 2);
    const len = Number.parseInt(input.slice(idx + 2, idx + 4), 10);
    if (Number.isNaN(len) || len < 0 || idx + 4 + len > input.length) break;
    const val = input.slice(idx + 4, idx + 4 + len);
    map.set(tag, val);
    idx += 4 + len;
  }
  return map;
}

export function parseQrPayload(rawText: string): ParsedQrPayload {
  const raw = rawText.trim();

  if (/^https?:\/\//i.test(raw) || /^[a-z0-9-]+\.(xyz|top|click|vn|com|net|org|gov\.vn)/i.test(raw)) {
    const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    return {
      kind: 'url',
      raw,
      scanSummary: `Mã QR chứa đường dẫn ẩn: ${normalizedUrl}`,
    };
  }

  // Standard EMVCo VietQR payload starts with 000201
  if (raw.startsWith('000201') && raw.length >= 24) {
    const root = parseTlv(raw);
    const merchantInfo = root.get('38') || '';
    const sub38 = parseTlv(merchantInfo);
    const benefInfo = sub38.get('01') || '';
    const subBenef = parseTlv(benefInfo);

    const bankBin = subBenef.get('00') || '';
    const accountNumber = subBenef.get('01') || '';
    const bankName = VIETNAM_BANK_BINS[bankBin] || (bankBin ? `Ngân hàng BIN ${bankBin}` : 'Ngân hàng VN');
    const amountRaw = root.get('54') || '';
    const amountVnd = amountRaw
      ? `${Number(amountRaw).toLocaleString('vi-VN')}đ`
      : undefined;

    const additional = parseTlv(root.get('62') || '');
    const transferNote = additional.get('08') || undefined;

    const parts = [
      `Mã VietQR chuyển khoản: ${bankName}`,
      accountNumber ? `STK ${accountNumber}` : '',
      amountVnd ? `Số tiền: ${amountVnd}` : '',
      transferNote ? `Nội dung: "${transferNote}"` : '',
    ].filter(Boolean);

    return {
      kind: 'vietqr',
      raw,
      bankName,
      bankBin: bankBin || undefined,
      accountNumber: accountNumber || undefined,
      amountVnd,
      transferNote,
      scanSummary: parts.join(' • '),
    };
  }

  return {
    kind: 'text',
    raw,
    scanSummary: `Nội dung từ mã QR: ${raw}`,
  };
}
