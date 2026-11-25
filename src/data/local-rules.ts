import { extractUrlsFromText } from '@/lib/url-inspector';
import type { AnalyzeResult, PsychologyMetrics, RiskLevel } from '@/types';

const PANIC_TERMS = [
  'công an',
  'viện kiểm sát',
  'khởi tố',
  'lệnh bắt',
  'tạm giữ',
  'rửa tiền',
  'tai nạn',
  'cấp cứu',
  'khóa sim',
  'cắt điện',
  'phong tỏa',
];

const URGENCY_TERMS = [
  'ngay hôm nay',
  'ngay lập tức',
  'trong 2 giờ',
  'gấp',
  'khẩn',
  'hết hạn',
  'chuyển tiền',
  'nạp trước',
  'mã otp',
  'otp',
];

const ISOLATION_TERMS = [
  'bí mật',
  'đừng nói',
  'không kể',
  'một mình',
  'phòng kín',
  'không báo',
  'xác minh riêng',
  'cài ứng dụng',
  '.apk',
];

export function computePsychologyAndEscape(
  rawText: string,
  level: RiskLevel
): { psychologyMetrics: PsychologyMetrics; escapeScript: string } {
  const lower = rawText.toLowerCase();
  const panicCount = PANIC_TERMS.filter((t) => lower.includes(t)).length;
  const urgencyCount = URGENCY_TERMS.filter((t) => lower.includes(t)).length;
  const isolationCount = ISOLATION_TERMS.filter((t) => lower.includes(t)).length;

  const base =
    level === 'danger' ? { panic: 78, urgency: 76, isolation: 64 }
    : level === 'warn' ? { panic: 44, urgency: 68, isolation: 42 }
    : level === 'unknown' ? { panic: 22, urgency: 28, isolation: 18 }
    : { panic: 5, urgency: 5, isolation: 5 };

  const clamp = (v: number) => Math.max(5, Math.min(98, v));
  const psychologyMetrics: PsychologyMetrics = {
    panic: clamp(base.panic + panicCount * 9),
    urgency: clamp(base.urgency + urgencyCount * 10),
    isolation: clamp(base.isolation + isolationCount * 14),
  };

  if (lower.includes('công an') || lower.includes('khởi tố') || lower.includes('lệnh bắt')) {
    return {
      psychologyMetrics,
      escapeScript:
        'Tôi sẽ gọi trực tiếp lên Công an phường hoặc ra trụ sở làm việc theo giấy mời chính thức. Tôi không chuyển tiền hay cung cấp thông tin qua điện thoại. Xin phép cúp máy!',
    };
  }

  if (lower.includes('việc nhẹ') || lower.includes('ctv') || lower.includes('nạp trước') || lower.includes('nhiệm vụ')) {
    return {
      psychologyMetrics,
      escapeScript:
        'Cảm ơn, tôi không tham gia công việc yêu cầu nạp tiền trước hay bấm đường dẫn ngoài ứng dụng chính thức. Tôi xin dừng trao đổi tại đây.',
    };
  }

  if (lower.includes('khóa sim') || lower.includes('cắt điện') || lower.includes('vneid') || lower.includes('sinh trắc')) {
    return {
      psychologyMetrics,
      escapeScript:
        'Tôi sẽ tự mở ứng dụng chính chủ hoặc gọi tổng đài chính thức để kiểm tra, không bấm đường link lạ hay cài tệp ngoài cửa hàng ứng dụng.',
    };
  }

  if (level === 'safe') {
    return {
      psychologyMetrics,
      escapeScript:
        'Đây là địa chỉ chính thống đã xác thực. Bạn vẫn nên tự kiểm tra kỹ chính tả tên miền trên thanh địa chỉ trước khi đăng nhập.',
    };
  }

  return {
    psychologyMetrics,
    escapeScript:
      'Để tôi tạm dừng và gọi xác minh với người thân hoặc cơ quan chính thức trước, tôi không chuyển tiền và không đọc mã OTP lúc này.',
  };
}

const POLICE_SCAM_KEYWORDS = [
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

const JOB_SCAM_KEYWORDS = [
  'việc nhẹ',
  'lương cao',
  'ctv',
  'cộng tác viên',
  'nạp trước',
  'mở nhiệm vụ',
  'quà tri ân',
];

const LINK_SCAM_KEYWORDS = ['.xyz', '.top', '.apk', '.click', '.icu', 'sinh trắc học'];

const OFFICIAL_SAFE_HOSTS = [
  'gov.vn',
  'ncsc.gov.vn',
  'canhbao.ncsc.gov.vn',
  'bocongan.gov.vn',
  'dichvucong.gov.vn',
  'vneid.gov.vn',
  'dongnai.gov.vn',
  'chinhphu.vn',
];

function getVerifiedOfficialUrls(rawText: string): { matchedHosts: string[]; hasNonOfficialUrl: boolean } {
  const urls = extractUrlsFromText(rawText);
  if (urls.length === 0) {
    return { matchedHosts: [], hasNonOfficialUrl: false };
  }

  const matchedHosts: string[] = [];
  let hasNonOfficialUrl = false;

  for (const url of urls) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      const isOfficial = OFFICIAL_SAFE_HOSTS.some(
        (safe) => host === safe || host.endsWith(`.${safe}`)
      );
      if (isOfficial) {
        matchedHosts.push(host);
      } else {
        hasNonOfficialUrl = true;
      }
    } catch {
      hasNonOfficialUrl = true;
    }
  }

  return { matchedHosts, hasNonOfficialUrl };
}

/**
 * Deterministic Layer-1 rule engine (< 50ms, works 100% offline).
 * Security: NEVER check `.gov.vn` as a raw substring across paths/queries.
 */
export function runLayerOneRules(rawText: string): AnalyzeResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  const policeHits = POLICE_SCAM_KEYWORDS.filter((kw) => lower.includes(kw));
  if (policeHits.length > 0) {
    return {
      level: 'danger',
      badge: 'NGUY HIỂM — DẤU HIỆU LỪA ĐẢO CAO',
      title: 'Dừng lại! Không chuyển tiền ngay lúc này',
      reasons: [
        'Cơ quan Công an, Viện kiểm sát KHÔNG BAO GIỜ yêu cầu chuyển tiền xác minh qua điện thoại.',
        'Đối tượng tạo áp lực thời gian hoặc dọa khởi tố để khiến nạn nhân hoảng loạn.',
        'Khớp từ khóa kịch bản giả danh cơ quan chức năng đã ghi nhận tại Đồng Nai.',
      ],
      highlights: policeHits,
      speech:
        'Cảnh báo nguy hiểm! Công an không bao giờ yêu cầu chuyển tiền qua điện thoại. Bạn hãy tắt máy ngay và hỏi người thân nhé!',
      ...computePsychologyAndEscape(text, 'danger'),
      source: 'offline',
    };
  }

  const jobHits = JOB_SCAM_KEYWORDS.filter((kw) => lower.includes(kw));
  const linkHits = LINK_SCAM_KEYWORDS.filter((kw) => lower.includes(kw));
  if (jobHits.length > 0) {
    return {
      level: 'warn',
      badge: 'NGHI NGỜ — BẪY VIỆC NHẸ LƯƠNG CAO',
      title: 'Cẩn thận bẫy tuyển CTV đòi nạp tiền làm nhiệm vụ',
      reasons: [
        'Kẻ gian thường trả thưởng nhỏ ở nhiệm vụ đầu, sau đó yêu cầu nạp tiền triệu mới cho rút.',
        'Tuyệt đối không nạp tiền trước, không bấm link đuôi lạ (.xyz, .top) đi kèm.',
        'Nên thoát nhóm ngay và báo cho người thân hoặc thầy cô kiểm tra.',
      ],
      highlights: [...jobHits, ...linkHits],
      speech:
        'Cảnh báo nghi ngờ! Đây là dấu hiệu bẫy việc nhẹ lương cao. Tuyệt đối không nạp tiền mở nhiệm vụ hay bấm link lạ.',
      ...computePsychologyAndEscape(text, 'warn'),
      source: 'offline',
    };
  }

  if (linkHits.length > 0) {
    return {
      level: 'warn',
      badge: 'NGHI NGỜ — ĐƯỜNG DẪN / TỆP LẠ',
      title: 'Có dấu hiệu bất thường trong đường dẫn hoặc tệp cài đặt',
      reasons: [
        'Tên miền đuôi lạ (.xyz, .top) hoặc yêu cầu cài tệp .apk ngoài kho ứng dụng chính thức.',
        '35% báo cáo lừa đảo tại Đồng Nai xuất phát từ đường dẫn giả mạo tương tự.',
        'Không đăng nhập ngân hàng, không nhập mã OTP qua đường link được gửi tới.',
      ],
      highlights: linkHits,
      speech:
        'Cảnh báo nghi ngờ! Đường dẫn này có dấu hiệu bất thường. Tuyệt đối không bấm vào hay cài tệp lạ.',
      ...computePsychologyAndEscape(text, 'warn'),
      source: 'offline',
    };
  }

  const { matchedHosts, hasNonOfficialUrl } = getVerifiedOfficialUrls(text);
  if (matchedHosts.length > 0 && !hasNonOfficialUrl) {
    return {
      level: 'safe',
      badge: 'ĐÃ XÁC THỰC CHÍNH CHỦ',
      title: 'Nguồn thuộc danh sách chính thống đã xác minh',
      reasons: [
        `Tên miền chính thức (${matchedHosts[0]}) thuộc hệ thống cơ quan nhà nước (.gov.vn).`,
        'Đã đối chiếu đúng tên miền gốc (không phải đường dẫn giả nhét .gov.vn ở phần sau).',
        'Bạn vẫn nên kiểm tra đúng chính tả thanh địa chỉ trước khi nhập thông tin.',
      ],
      highlights: matchedHosts,
      speech: 'Địa chỉ này thuộc danh sách chính thống đã được xác thực.',
      ...computePsychologyAndEscape(text, 'safe'),
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
      'Chưa ghi nhận cảnh báo với nội dung này, nhưng không đồng nghĩa an toàn một trăm phần trăm. Bạn nhớ giữ cảnh giác nhé!',
    ...computePsychologyAndEscape(text, 'unknown'),
    source: 'offline',
  };
}
