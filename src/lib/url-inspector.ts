import type { RiskLevel, UrlInspectionReport } from '@/types';

const SHORTENER_HOSTS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'bom.so',
  'rutgon.me',
  's.net.vn',
  'shorturl.at',
  'rebrand.ly',
  'is.gd',
  'rb.gy',
]);

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.icu', '.vip', '.tk', '.ml', '.ga', '.buzz', '.cfd'];

const OFFICIAL_GOV_ALLOWLIST = [
  'ncsc.gov.vn',
  'canhbao.ncsc.gov.vn',
  'bocongan.gov.vn',
  'dichvucong.gov.vn',
  'vneid.gov.vn',
  'dongnai.gov.vn',
  'chinhphu.vn',
];

const BRAND_TOKENS = [
  'vneid',
  'congan',
  'cong-an',
  'bocongan',
  'dichvucong',
  'vietcombank',
  'vcb',
  'mbbank',
  'techcombank',
  'bidv',
  'agribank',
  'vietinbank',
  'shopee',
  'lazada',
  'zalo',
  'evn',
];

export function extractUrlsFromText(text: string): string[] {
  const matches = new Set<string>();
  const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
  for (const m of text.match(urlRegex) ?? []) {
    matches.add(m.replace(/[.,;!?]+$/, ''));
  }

  const domainRegex = /\b(?:[a-z0-9-]+\.)+(?:gov\.vn|com\.vn|vn|xyz|top|click|icu|vip|tk|ly|com|net)\b(?:\/[^\s"'<>()]*)?/gi;
  for (const m of text.match(domainRegex) ?? []) {
    const clean = m.replace(/[.,;!?]+$/, '');
    const withProto = `https://${clean}`;
    if (![...matches].some((u) => u.toLowerCase().includes(clean.toLowerCase()))) {
      matches.add(withProto);
    }
  }

  return [...matches].slice(0, 4);
}

export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

async function unshortenUrlSafely(rawUrl: string): Promise<string | undefined> {
  let current = rawUrl;
  for (let hop = 0; hop < 3; hop += 1) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return undefined;
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || isPrivateOrLoopbackHost(parsed.hostname)) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    try {
      const res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const location = res.headers.get('location');
      if (!location || res.status < 300 || res.status >= 400) {
        return current !== rawUrl ? current : undefined;
      }
      current = new URL(location, current).toString();
    } catch {
      clearTimeout(timer);
      return current !== rawUrl ? current : undefined;
    }
  }
  return current !== rawUrl ? current : undefined;
}

function evaluateSingleUrl(originalUrl: string, resolvedUrl?: string): UrlInspectionReport {
  const effective = resolvedUrl || originalUrl;
  let parsed: URL;
  try {
    parsed = new URL(effective);
  } catch {
    return {
      originalUrl,
      resolvedUrl,
      hostname: effective,
      flags: ['Định dạng đường dẫn không hợp lệ'],
      risk: 'warn',
    };
  }

  const host = parsed.hostname.toLowerCase();
  const fullLower = effective.toLowerCase();
  const flags: string[] = [];
  let risk: RiskLevel = 'unknown';

  const isOfficialGov = OFFICIAL_GOV_ALLOWLIST.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );

  if (resolvedUrl && resolvedUrl !== originalUrl) {
    flags.push(`Link rút gọn chuyển hướng tới: ${host}`);
  }

  if (parsed.protocol === 'http:') {
    flags.push('Dùng HTTP không mã hóa SSL');
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    flags.push('Dùng địa chỉ IP trần thay cho tên miền chính thức');
    risk = 'danger';
  }

  if (host.includes('xn--')) {
    flags.push('Chứa mã Punycode dễ giả mạo ký tự thương hiệu');
    risk = 'danger';
  }

  if (fullLower.includes('.apk') || fullLower.includes('.exe')) {
    flags.push('Liên kết tải tệp cài đặt (.apk/.exe) ngoài kho chính thức');
    risk = 'danger';
  }

  if (
    !isOfficialGov &&
    (host.includes('.gov.vn.') || host.includes('gov-vn') || host.includes('vneid-'))
  ) {
    flags.push('Giả mạo cấu trúc tên miền cơ quan nhà nước (.gov.vn / VNeID)');
    risk = 'danger';
  }

  const matchedTld = SUSPICIOUS_TLDS.find((tld) => host.endsWith(tld));
  if (matchedTld) {
    flags.push(`Đuôi tên miền rủi ro cao (${matchedTld})`);
    if (risk !== 'danger') risk = 'warn';
  }

  const matchedBrand = BRAND_TOKENS.find((b) => host.includes(b));
  if (matchedBrand && !isOfficialGov && !host.endsWith('.com.vn') && !host.endsWith('.vn')) {
    flags.push(`Tên miền lạ chứa từ khóa thương hiệu/cơ quan "${matchedBrand}"`);
    risk = 'danger';
  }

  if (isOfficialGov && flags.length === 0) {
    flags.push('Thuộc danh sách tên miền chính thống (.gov.vn / .chinhphu.vn)');
    risk = 'safe';
  } else if (flags.length === 0) {
    flags.push('Tên miền chưa thuộc danh sách chính thức, cần kiểm tra kỹ trước khi đăng nhập');
  }

  return { originalUrl, resolvedUrl, hostname: host, flags, risk };
}

export async function inspectAllUrlsInText(
  text: string,
  options?: { expandShortlink?: boolean }
): Promise<UrlInspectionReport[]> {
  const urls = extractUrlsFromText(text);
  if (urls.length === 0) return [];

  const reports = await Promise.all(
    urls.map(async (url) => {
      let resolvedUrl: string | undefined;
      if (options?.expandShortlink) {
        try {
          const host = new URL(url).hostname.toLowerCase();
          if (SHORTENER_HOSTS.has(host)) {
            resolvedUrl = await unshortenUrlSafely(url);
          }
        } catch {
          // Ignore malformed URL
        }
      }
      return evaluateSingleUrl(url, resolvedUrl);
    })
  );

  return reports;
}
