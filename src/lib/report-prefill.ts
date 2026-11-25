import { extractUrlsFromText } from '@/lib/url-inspector';

export interface ReportPrefillData {
  type: string;
  target: string;
  description: string;
}

export function extractReportPrefill(rawText: string): ReportPrefillData {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let type = 'Đường dẫn giả mạo';
  if (lower.includes('công an') || lower.includes('viện kiểm sát') || lower.includes('khởi tố')) {
    type = 'Giả danh công an / cơ quan';
  } else if (lower.includes('việc nhẹ') || lower.includes('ctv') || lower.includes('nạp trước')) {
    type = 'Tuyển CTV việc nhẹ lương cao';
  } else if (lower.includes('tai nạn') || lower.includes('cấp cứu')) {
    type = 'Người thân gặp tai nạn';
  }

  const urls = extractUrlsFromText(text);
  const phoneMatch = text.match(/(?:\+?84|0)(?:3|5|7|8|9)[\d.\-\s]{7,10}\d/);
  const bankMatch = text.match(/(?:stk|số tài khoản|tài khoản)\s*:?\s*(\d{8,16})/i);

  let target = '';
  if (urls.length > 0) {
    target = urls[0];
  } else if (phoneMatch) {
    target = phoneMatch[0].replace(/[\s.-]/g, '');
  } else if (bankMatch?.[1]) {
    target = `STK ${bankMatch[1]}`;
  }

  return {
    type,
    target,
    description: text,
  };
}
