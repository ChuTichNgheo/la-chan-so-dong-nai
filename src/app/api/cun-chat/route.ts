import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { callGeminiJson, hasGeminiKeyConfigured } from '@/lib/gemini-client';
import { inspectAllUrlsInText } from '@/lib/url-inspector';
import type { ScreenId } from '@/types';

interface CunChatResponse {
  reply: string;
  suggestedScreen?: Extract<ScreenId, 'M02' | 'M03' | 'M04' | 'M07'>;
  suggestedActionLabel?: string;
  scanText?: string;
}

function buildSmartFallback(message: string, speech: string, hasRisk: boolean): CunChatResponse {
  const lower = message.toLowerCase();
  if (lower.includes('sim') || lower.includes('khóa số') || lower.includes('điện lực')) {
    return {
      reply:
        'Nhà mạng hay Điện lực không gọi điện hù khóa SIM/cắt điện sau 2 giờ hay bắt bấm link lạ đâu ạ. Bạn hãy kiểm tra trực tiếp trên ứng dụng chính chủ hoặc hỏi người thân nhé!',
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Hỏi người thân xác minh',
      scanText: message,
    };
  }
  if (hasRisk) {
    return {
      reply: `${speech} Cún khuyên bạn KHÔNG chuyển tiền hay bấm link, hãy hỏi người thân kiểm tra cùng ngay!`,
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Hỏi người thân ngay',
      scanText: message,
    };
  }
  return {
    reply:
      'Cún đã nghe rõ! Với mọi cuộc gọi giục chuyển tiền, đọc OTP hoặc gửi link lạ, nguyên tắc vàng là TẠM DỪNG và kiểm tra kỹ hoặc hỏi người thân trước nhé.',
    suggestedScreen: 'M02',
    suggestedActionLabel: 'Kiểm tra kỹ hơn ngay',
    scanText: message,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string; offline?: boolean };
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Bạn hãy nhập câu hỏi cho Cún nhé.' }, { status: 400 });
    }

    const layerOne = runLayerOneRules(message);
    const urls = await inspectAllUrlsInText(message, { expandShortlink: !body.offline });
    const hasRisk =
      layerOne.level === 'danger' ||
      layerOne.level === 'warn' ||
      urls.some((u) => u.risk === 'danger');

    const fallbackReply = buildSmartFallback(message, layerOne.speech, hasRisk);

    if (!hasGeminiKeyConfigured() || body.offline) {
      return NextResponse.json(fallbackReply);
    }

    const prompt = `Bạn là Cún INFINITY — trợ lý AI thân thiện bảo vệ người dân Đồng Nai (đặc biệt là người cao tuổi và học sinh) khỏi lừa đảo mạng.
Trả lời câu hỏi dưới đây bằng tiếng Việt ấm áp, rõ ràng, sát nội dung người hỏi, tối đa 3 câu ngắn.
QUAN TRỌNG: Tuyệt đối KHÔNG nhắc các mã kỹ thuật như "M01", "M02", "M03", "M04", "M07". Tuyệt đối KHÔNG khẳng định số lạ là "100% an toàn".
Trả về JSON: {"reply":"câu trả lời ngắn","suggestedScreen":"M02|M03|M04|M07","suggestedActionLabel":"nhãn nút 3-6 từ không chứa mã M0x"}

Câu hỏi của người dân: "${message}"`;

    const aiRes = await callGeminiJson<Partial<CunChatResponse>>({
      parts: [{ text: prompt }],
      temperature: 0.3,
      timeoutMs: 8500,
      cacheKey: `cun:${message.toLowerCase().slice(0, 160)}`,
    });

    if (!aiRes) {
      return NextResponse.json(fallbackReply);
    }

    const parsed = aiRes.data;
    const validScreens = new Set(['M02', 'M03', 'M04', 'M07']);
    const screen = validScreens.has(parsed.suggestedScreen ?? '')
      ? parsed.suggestedScreen
      : fallbackReply.suggestedScreen;

    return NextResponse.json<CunChatResponse>({
      reply: parsed.reply || fallbackReply.reply,
      suggestedScreen: screen,
      suggestedActionLabel: parsed.suggestedActionLabel || fallbackReply.suggestedActionLabel,
      scanText: message,
    });
  } catch {
    return NextResponse.json<CunChatResponse>({
      reply: 'Cún khuyên bác bình tĩnh, tuyệt đối không chuyển tiền hoặc đọc mã OTP qua điện thoại nhé!',
      suggestedScreen: 'M03',
      suggestedActionLabel: 'Hỏi người thân ngay',
    });
  }
}
