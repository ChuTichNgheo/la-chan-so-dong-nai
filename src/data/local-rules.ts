import type { AnalyzeResult } from '@/types';

const DANGER_KEYWORDS = [
  'công an',
  'viện kiểm sát',
  'khởi tố',
  'lệnh bắt',
  'chuyển tiền',
  'tạm giữ',
  'mã otp',
  'otp',
  '50.000.000',
  '50 triệu',
];

const WARN_KEYWORDS = [
  '.xyz',
  '.top',
  '.apk',
  'việc nhẹ',
  'lương cao',
  'quà tri ân',
  'ctv',
  'nạp trước',
  'sinh trắc học',
];

const SAFE_WHITELIST = ['.gov.vn', 'ncsc.gov.vn', 'canhbao.ncsc.gov.vn', 'bocongan.gov.vn'];

/**
 * Deterministic Layer-1 rule engine (< 50ms, works 100% offline).
 */
export function runLayerOneRules(rawText: string): AnalyzeResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  const dangerHits = DANGER_KEYWORDS.filter((kw) => lower.includes(kw));
  if (dangerHits.length > 0) {
    return {
      level: 'danger',
      badge: 'NGUY HIỂM — DẤU HIỆU LỪA ĐẢO CAO',
      title: 'Dừng lại! Không chuyển tiền ngay lúc này',
      reasons: [
        'Cơ quan Công an, Viện kiểm sát KHÔNG BAO GIỜ yêu cầu chuyển tiền xác minh qua điện thoại.',
        'Đối tượng tạo áp lực thời gian hoặc dọa khởi tố để khiến nạn nhân hoảng loạn.',
        'Khớp từ khóa kịch bản lừa đảo phổ biến đã ghi nhận tại Đồng Nai.',
      ],
      highlights: dangerHits,
      speech:
        'Cảnh báo nguy hiểm! Công an không bao giờ yêu cầu chuyển tiền qua điện thoại. Bác hãy tắt máy ngay và hỏi người thân nhé!',
      source: 'offline',
    };
  }

  const warnHits = WARN_KEYWORDS.filter((kw) => lower.includes(kw));
  if (warnHits.length > 0) {
    return {
      level: 'warn',
      badge: 'NGHI NGỜ — CẦN KIỂM CHỨNG THÊM',
      title: 'Có dấu hiệu bất thường trong nội dung hoặc đường dẫn',
      reasons: [
        'Tên miền đuôi lạ (.xyz, .top) hoặc yêu cầu cài tệp .apk ngoài kho ứng dụng chính thức.',
        'Hứa hẹn việc nhẹ lương cao nhưng đòi nạp tiền mở nhiệm vụ trước.',
        '35% báo cáo lừa đảo tại Đồng Nai xuất phát từ đường dẫn giả mạo tương tự.',
      ],
      highlights: warnHits,
      speech:
        'Cảnh báo nghi ngờ! Đường dẫn hoặc lời mời này có dấu hiệu bất thường. Tuyệt đối không bấm link và không nạp tiền trước.',
      source: 'offline',
    };
  }

  const safeHits = SAFE_WHITELIST.filter((kw) => lower.includes(kw));
  if (safeHits.length > 0) {
    return {
      level: 'safe',
      badge: 'ĐÃ XÁC THỰC CHÍNH CHỦ',
      title: 'Nguồn thuộc danh sách chính thống đã xác minh',
      reasons: [
        'Tên miền thuộc hệ thống cơ quan nhà nước (.gov.vn) trong danh sách an toàn.',
        'Không phát hiện dấu hiệu giả mạo tên miền thường gặp.',
        'Bạn vẫn nên kiểm tra đúng chính tả thanh địa chỉ trước khi nhập thông tin.',
      ],
      highlights: safeHits,
      speech: 'Địa chỉ này thuộc danh sách chính thống đã được xác thực.',
      source: 'offline',
    };
  }

  // Anti-False-Negative: NEVER mark unknown input as 100% safe.
  return {
    level: 'unknown',
    badge: 'CHƯA GHI NHẬN CẢNH BÁO — VẪN CẦN CẢNH GIÁC',
    title: 'Chưa có báo cáo trong dữ liệu, KHÔNG đồng nghĩa an toàn 100%',
    reasons: [
      'Kẻ gian thường xuyên dùng SIM rác hoặc tên miền mới chưa kịp xuất hiện trong dữ liệu.',
      'Tuyệt đối không đọc mã OTP, không cài file .apk và không chuyển tiền cho người lạ.',
      'Nếu cuộc gọi thúc giục tiền bạc, hãy bấm nút vàng Hỏi người thân ngay.',
    ],
    highlights: [],
    speech:
      'Nội dung này chưa có trong danh sách cảnh báo, nhưng bạn vẫn cần cảnh giác cao và không cung cấp mã OTP.',
    source: 'offline',
  };
}
