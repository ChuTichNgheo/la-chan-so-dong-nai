import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { callGeminiJson, hasGeminiKeyConfigured } from '@/lib/gemini-client';
import { inspectAllUrlsInText } from '@/lib/url-inspector';
import type { ScreenId, UiMode } from '@/types';

export type CunActionType =
  | 'none'
  | 'scan_text'
  | 'ask_family'
  | 'prefill_report'
  | 'set_ui_mode'
  | 'open_live_voice'
  | 'open_qr_scanner'
  | 'open_videos'
  | 'open_learning'
  | 'open_radar';

export interface CunAgentAction {
  type: CunActionType;
  label: string;
  payload?: string;
  /** Safe UI/navigation/scan actions may auto-execute; sensitive actions always require human confirmation */
  autoExecute: boolean;
}

export interface CunHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

export interface CunChatResponse {
  reply: string;
  action: CunAgentAction;
  /** Backward-compatible fields */
  suggestedScreen?: Extract<ScreenId, 'M02' | 'M03' | 'M04' | 'M07'>;
  suggestedActionLabel?: string;
  scanText?: string;
  model?: string;
}

const VALID_ACTIONS = new Set<CunActionType>([
  'none',
  'scan_text',
  'ask_family',
  'prefill_report',
  'set_ui_mode',
  'open_live_voice',
  'open_qr_scanner',
  'open_videos',
  'open_learning',
  'open_radar',
]);

/** Actions that NEVER auto-submit (Human-in-the-Loop) */
const SENSITIVE_ACTIONS = new Set<CunActionType>(['ask_family', 'prefill_report']);

function mapActionToLegacyScreen(
  type: CunActionType
): Extract<ScreenId, 'M02' | 'M03' | 'M04' | 'M07'> | undefined {
  if (type === 'scan_text') return 'M02';
  if (type === 'ask_family') return 'M03';
  if (type === 'prefill_report') return 'M04';
  if (type === 'open_radar') return 'M07';
  return undefined;
}

function detectExplicitCommandIntent(
  message: string,
  history: CunHistoryItem[]
): CunChatResponse | null {
  const lower = message.toLowerCase();
  const lastUserContext =
    [...history].reverse().find((h) => h.role === 'user' && h.text.length > 12)?.text || message;

  // 1. UI Mode switching (chữ to / tối giản / chuyên sâu / tiêu chuẩn)
  if (
    /(chữ to|chữ lớn|phóng to|tối giản|người già|65\+|dễ nhìn|mắt kém)/i.test(lower) &&
    /(bật|chuyển|mở|đổi|giúp|làm|cho|tăng|chế độ)/i.test(lower)
  ) {
    return {
      reply:
        'Dạ Cún đã bật ngay Chế độ Tối giản chữ lớn, nút to dễ bấm cho bác rồi ạ! Bác cần Cún làm thêm gì cứ nói nhé.',
      action: {
        type: 'set_ui_mode',
        label: 'Bật chế độ Chữ to (Tối giản)',
        payload: 'minimal',
        autoExecute: true,
      },
    };
  }
  if (/(chuyên sâu|nâng cao|pro)/i.test(lower) && /(bật|chuyển|mở|đổi|chế độ)/i.test(lower)) {
    return {
      reply:
        'Cún đã chuyển sang Chế độ Chuyên sâu để bạn xem đầy đủ phân tích URL, nguồn AI và công cụ hệ thống nhé!',
      action: {
        type: 'set_ui_mode',
        label: 'Chuyển Chế độ Chuyên sâu',
        payload: 'pro',
        autoExecute: true,
      },
    };
  }
  if (/(tiêu chuẩn|bình thường|mặc định)/i.test(lower) && /(bật|chuyển|đổi|về|chế độ)/i.test(lower)) {
    return {
      reply: 'Cún đã chuyển giao diện về Chế độ Tiêu chuẩn rồi ạ!',
      action: {
        type: 'set_ui_mode',
        label: 'Chuyển Chế độ Tiêu chuẩn',
        payload: 'standard',
        autoExecute: true,
      },
    };
  }

  // 2. Open QR Camera scanner
  if (/(quét qr|mã qr|vietqr|quét mã|camera qr)/i.test(lower)) {
    return {
      reply:
        'Dạ để Cún mở ngay Camera quét mã VietQR cho bác kiểm tra số tài khoản trước khi chuyển tiền nhé!',
      action: {
        type: 'open_qr_scanner',
        label: 'Mở Camera quét mã QR',
        autoExecute: true,
      },
    };
  }

  // 3. Open Live Voice Guard
  if (/(nghe trực tiếp|nghe cuộc gọi|bật loa ngoài|nghe hộ|nghe giúp cuộc gọi|lá chắn nghe)/i.test(lower)) {
    return {
      reply:
        'Cún bật ngay Lá Chắn Nghe Trực Tiếp! Bác cứ bật loa ngoài cuộc gọi lạ, Cún nghe thấy từ khóa lừa đảo sẽ hú còi báo ngay ạ.',
      action: {
        type: 'open_live_voice',
        label: 'Bật Lá Chắn Nghe Trực Tiếp',
        autoExecute: true,
      },
    };
  }

  // 4. Prefill Police / Youth Union Report (Human-in-the-Loop)
  if (/(báo cáo|tố giác|trình báo|lập phiếu|đoàn thanh niên)/i.test(lower)) {
    const reportPayload = message.length > 25 ? message : lastUserContext;
    return {
      reply:
        'Cún đã mở sẵn Phiếu báo cáo & điền giúp nội dung sự việc. Bác kiểm tra lại rồi tự bấm nút Gửi báo cáo để xác nhận nhé!',
      action: {
        type: 'prefill_report',
        label: 'Mở & điền sẵn Phiếu báo cáo',
        payload: reportPayload,
        autoExecute: false,
      },
      suggestedScreen: 'M04',
      suggestedActionLabel: 'Mở & điền sẵn Phiếu báo cáo',
      scanText: reportPayload,
    };
  }

  // 5. Ask Family (Human-in-the-Loop)
  if (/(hỏi người thân|gọi con|nhắn con|báo con|báo gia đình|hỏi chị lan|nhắn người thân)/i.test(lower)) {
    const familyPayload = message.length > 25 ? message : lastUserContext;
    return {
      reply:
        'Đúng rồi ạ, cứ hỏi người thân là an toàn nhất! Cún chuẩn bị sẵn nội dung để bác kiểm tra và tự bấm nút Gửi người thân nhé.',
      action: {
        type: 'ask_family',
        label: 'Dẫn tới nút Hỏi người thân',
        payload: familyPayload,
        autoExecute: false,
      },
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Dẫn tới nút Hỏi người thân',
      scanText: familyPayload,
    };
  }

  // 6. Videos / Learning / Radar
  if (/(xem video|mở video|clip cảnh báo|video hướng dẫn)/i.test(lower)) {
    return {
      reply: 'Dạ Cún mở ngay kho Video cảnh báo ngắn dễ hiểu cho bác xem nhé!',
      action: {
        type: 'open_videos',
        label: 'Mở Video cảnh báo',
        autoExecute: true,
      },
    };
  }
  if (/(đấu trí|học tập|bài học|bắt bài|luyện tập|chơi thử)/i.test(lower)) {
    return {
      reply: 'Tuyệt vời! Cún đưa bạn sang khu Học tập & Đấu trí AI luyện bắt bài kẻ lừa đảo ngay nhé!',
      action: {
        type: 'open_learning',
        label: 'Mở Học tập & Đấu trí AI',
        autoExecute: true,
      },
    };
  }
  if (/(radar|bản đồ|điểm nóng|thẻ zalo|khu phố|thống kê đồng nai)/i.test(lower)) {
    return {
      reply: 'Cún mở ngay Radar cảnh báo Đồng Nai để bạn xem điểm nóng và xuất thẻ Zalo gửi khu phố nhé!',
      action: {
        type: 'open_radar',
        label: 'Mở Radar Đồng Nai & Thẻ Zalo',
        autoExecute: true,
      },
      suggestedScreen: 'M07',
      suggestedActionLabel: 'Mở Radar Đồng Nai',
    };
  }

  // 7. Explicit Scan command ("kiểm tra giúp", "quét giúp", contains phone/link)
  const hasExplicitScanVerb = /(kiểm tra giúp|quét giúp|check giúp|kiểm tra hộ|quét hộ|phân tích giúp|soi giúp)/i.test(
    lower
  );
  if (hasExplicitScanVerb) {
    const targetText =
      message
        .replace(/^(cún ơi|bạn ơi|hãy|giúp bác|giúp tôi|làm ơn|vui lòng)\s*/i, '')
        .trim() || lastUserContext;
    return {
      reply:
        'Dạ để Cún đưa ngay nội dung này sang bộ Quét AI phân tích 2 tầng và đọc rõ mức độ nguy hiểm cho bác nhé!',
      action: {
        type: 'scan_text',
        label: 'Chạy Quét AI phân tích ngay',
        payload: targetText,
        autoExecute: true,
      },
      suggestedScreen: 'M02',
      suggestedActionLabel: 'Chạy Quét AI ngay',
      scanText: targetText,
    };
  }

  return null;
}

function buildSmartFallback(
  message: string,
  speech: string,
  hasRisk: boolean,
  history: CunHistoryItem[]
): CunChatResponse {
  const explicit = detectExplicitCommandIntent(message, history);
  if (explicit) return explicit;

  const lower = message.toLowerCase();
  if (lower.includes('sim') || lower.includes('khóa số') || lower.includes('điện lực')) {
    return {
      reply:
        'Nhà mạng hay Điện lực không gọi điện hù khóa SIM/cắt điện sau 2 giờ hay bắt bấm link lạ đâu ạ. Bác tuyệt đối không chuyển tiền và hãy bấm Hỏi người thân kiểm tra cùng nhé!',
      action: {
        type: 'ask_family',
        label: 'Hỏi người thân xác minh',
        payload: message,
        autoExecute: false,
      },
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Hỏi người thân xác minh',
      scanText: message,
    };
  }
  if (hasRisk) {
    return {
      reply: `${speech} Cún khuyên bác KHÔNG chuyển tiền hay đọc OTP — để Cún đưa sang màn hình Quét AI phân tích chi tiết và soạn câu từ chối giúp bác nhé!`,
      action: {
        type: 'scan_text',
        label: 'Quét AI & xem câu từ chối',
        payload: message,
        autoExecute: false,
      },
      suggestedScreen: 'M02',
      suggestedActionLabel: 'Quét AI & xem câu từ chối',
      scanText: message,
    };
  }
  return {
    reply:
      'Cún nghe rõ rồi ạ! Bác cứ kể thêm nội dung tin nhắn/cuộc gọi, hoặc nói trực tiếp "Cún ơi bật chữ to / quét giúp bác / mở camera QR / báo cáo số này" để Cún thao tác dùm ngay nhé.',
    action: {
      type: 'none',
      label: '',
      autoExecute: false,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: CunHistoryItem[];
      uiMode?: UiMode;
      activeScreen?: ScreenId;
      offline?: boolean;
    };

    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Bạn hãy nhập hoặc nói câu hỏi cho Cún nhé.' }, { status: 400 });
    }

    const history: CunHistoryItem[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is CunHistoryItem =>
              Boolean(item) &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.text === 'string' &&
              item.text.trim().length > 0
          )
          .slice(-6)
      : [];

    const layerOne = runLayerOneRules(message);
    const urls = await inspectAllUrlsInText(message, { expandShortlink: !body.offline });
    const hasRisk =
      layerOne.level === 'danger' ||
      layerOne.level === 'warn' ||
      urls.some((u) => u.risk === 'danger');

    // Fast deterministic command execution for direct UI commands (0ms latency, 100% reliable)
    const explicitCmd = detectExplicitCommandIntent(message, history);
    if (explicitCmd && (body.offline || !hasGeminiKeyConfigured())) {
      return NextResponse.json(explicitCmd);
    }

    const fallbackReply = buildSmartFallback(message, layerOne.speech, hasRisk, history);

    if (!hasGeminiKeyConfigured() || body.offline) {
      return NextResponse.json(fallbackReply);
    }

    const historyText =
      history.length > 0
        ? history
            .map((h) => `${h.role === 'user' ? 'Người dân' : 'Cún AI'}: ${h.text.slice(0, 220)}`)
            .join('\n')
        : '(Chưa có hội thoại trước đó)';

    const prompt = `Bạn là Cún INFINITY — trợ lý AI thân thiện, ấm áp đồng hành cùng người dân Đồng Nai (đặc biệt người cao tuổi và học sinh) phòng chống lừa đảo mạng.
Bạn vừa TRÒ CHUYỆN tự nhiên theo ngữ cảnh, vừa có thể THAO TÁC DÙM các chức năng trong ứng dụng Lá Chắn Số Đồng Nai.

Trạng thái hiện tại: Chế độ giao diện=${body.uiMode || 'standard'}, Màn hình=${body.activeScreen || 'M01'}.
Phân tích sơ bộ tầng luật: mức=${layerOne.level}, tóm tắt="${layerOne.speech}".

Lịch sử hội thoại gần nhất:
${historyText}

Câu nói/tin nhắn mới của người dân:
"${message}"

Danh sách lệnh thao tác dùm (action.type) hợp lệ:
- "none": Chỉ trò chuyện, giải thích, trấn an (không cần chuyển màn hình).
- "scan_text": Mở bộ Quét AI và phân tích nội dung nghi ngờ (đặt nội dung/SĐT/link cần quét vào action.payload, có thể lấy từ câu trước trong lịch sử nếu người dùng nói "quét cái vừa nãy").
- "ask_family": Chuẩn bị nội dung và dẫn tới nút Hỏi người thân (Human-in-the-Loop, KHÔNG tự gửi).
- "prefill_report": Mở Phiếu báo cáo Công an/Đoàn TN và điền sẵn nội dung (Human-in-the-Loop, KHÔNG tự gửi).
- "set_ui_mode": Đổi chế độ giao diện — action.payload PHẢI là "minimal" (chữ to tối giản), "standard" (tiêu chuẩn) hoặc "pro" (chuyên sâu).
- "open_live_voice": Bật Lá Chắn Nghe Trực Tiếp cuộc gọi loa ngoài.
- "open_qr_scanner": Bật Camera quét mã VietQR kiểm tra tài khoản.
- "open_videos": Mở kho Video cảnh báo ngắn.
- "open_learning": Mở khu Học tập & Đấu trí AI.
- "open_radar": Mở Radar cảnh báo Đồng Nai & xuất thẻ Zalo.

QUY TẮC BẮT BUỘC:
1. Trả lời tiếng Việt tự nhiên, ấm áp, xưng "Cún" — gọi "bác/bạn", tối đa 3 câu ngắn gọn, dễ nghe khi đọc thành tiếng.
2. Tuyệt đối KHÔNG nhắc các mã kỹ thuật như "M01", "M02", "M03", "M04", "M07". Tuyệt đối KHÔNG khẳng định số lạ là "100% an toàn".
3. Đặt autoExecute=true CHỈ KHI người dân ra lệnh/nhờ Cún mở hoặc làm giúp ngay một thao tác an toàn ("set_ui_mode", "open_live_voice", "open_qr_scanner", "open_videos", "open_learning", "open_radar", hoặc "scan_text" khi nhờ quét). Với "ask_family" và "prefill_report", autoExecute LUÔN LÀ false (để người dân tự bấm nút xác nhận cuối cùng).

Trả về đúng JSON:
{
  "reply": "câu trả lời thân thiện 1-3 câu",
  "action": {
    "type": "none|scan_text|ask_family|prefill_report|set_ui_mode|open_live_voice|open_qr_scanner|open_videos|open_learning|open_radar",
    "label": "nhãn nút thao tác 3-7 từ tiếng Việt (rỗng nếu type=none)",
    "payload": "nội dung đính kèm nếu cần",
    "autoExecute": true
  }
}`;

    const aiRes = await callGeminiJson<{
      reply?: string;
      action?: Partial<CunAgentAction>;
    }>({
      parts: [{ text: prompt }],
      temperature: 0.35,
      timeoutMs: 9500,
    });

    if (!aiRes?.data) {
      return NextResponse.json(fallbackReply);
    }

    const rawAction = aiRes.data.action;
    let actionType: CunActionType =
      rawAction?.type && VALID_ACTIONS.has(rawAction.type)
        ? rawAction.type
        : explicitCmd?.action.type || fallbackReply.action.type;

    // Preserve explicit deterministic command if user clearly requested one
    if (actionType === 'none' && explicitCmd) {
      actionType = explicitCmd.action.type;
    }

    let payload =
      typeof rawAction?.payload === 'string' && rawAction.payload.trim()
        ? rawAction.payload.trim()
        : explicitCmd?.action.payload || (actionType === 'scan_text' ? message : undefined);

    if (actionType === 'set_ui_mode' && payload !== 'minimal' && payload !== 'standard' && payload !== 'pro') {
      payload = explicitCmd?.action.payload || 'minimal';
    }

    const label =
      typeof rawAction?.label === 'string' && rawAction.label.trim()
        ? rawAction.label.trim()
        : explicitCmd?.action.label || fallbackReply.action.label;

    const autoExecute =
      actionType !== 'none' &&
      !SENSITIVE_ACTIONS.has(actionType) &&
      Boolean(rawAction?.autoExecute ?? explicitCmd?.action.autoExecute ?? false);

    const legacyScreen = mapActionToLegacyScreen(actionType);

    return NextResponse.json<CunChatResponse>({
      reply:
        typeof aiRes.data.reply === 'string' && aiRes.data.reply.trim()
          ? aiRes.data.reply.trim()
          : fallbackReply.reply,
      action: {
        type: actionType,
        label,
        payload,
        autoExecute,
      },
      suggestedScreen: legacyScreen,
      suggestedActionLabel: label || undefined,
      scanText: actionType === 'scan_text' ? payload || message : undefined,
      model: aiRes.model,
    });
  } catch {
    return NextResponse.json<CunChatResponse>({
      reply:
        'Cún khuyên bác bình tĩnh, tuyệt đối không chuyển tiền hoặc đọc mã OTP qua điện thoại nhé! Bác có thể bấm nút bên dưới để Cún dẫn tới người thân ngay.',
      action: {
        type: 'ask_family',
        label: 'Dẫn tới Hỏi người thân ngay',
        autoExecute: false,
      },
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Dẫn tới Hỏi người thân ngay',
    });
  }
}
