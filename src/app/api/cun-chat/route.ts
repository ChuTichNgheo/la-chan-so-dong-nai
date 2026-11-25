import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { inspectAllUrlsInText } from '@/lib/url-inspector';
import type { ScreenId } from '@/types';

interface CunChatResponse {
  reply: string;
  suggestedScreen?: Extract<ScreenId, 'M02' | 'M03' | 'M04' | 'M07'>;
  suggestedActionLabel?: string;
  scanText?: string;
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
    const hasRisk = layerOne.level === 'danger' || layerOne.level === 'warn' || urls.some((u) => u.risk === 'danger');

    const fallbackReply: CunChatResponse = hasRisk
      ? {
          reply: `${layerOne.speech} Cún khuyên bác KHÔNG chuyển tiền hay bấm link, hãy hỏi người thân kiểm tra cùng ngay!`,
          suggestedScreen: 'M03',
          suggestedActionLabel: 'Gửi hỏi Chị Lan ngay',
          scanText: message,
        }
      : {
          reply:
            'Cún đã nghe rõ! Với mọi cuộc gọi giục chuyển tiền, đọc OTP hoặc gửi link lạ, nguyên tắc vàng là TẠM DỪNG và kiểm tra kỹ hoặc hỏi người thân trước nhé.',
          suggestedScreen: 'M02',
          suggestedActionLabel: 'Quét kỹ nội dung ở M02',
          scanText: message,
        };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || body.offline) {
      return NextResponse.json(fallbackReply);
    }

    const prompt = `Bạn là Cún INFINITY — trợ lý AI thân thiện bảo vệ người dân Đồng Nai (đặc biệt là người cao tuổi và học sinh) khỏi lừa đảo mạng.
Trả lời câu hỏi dưới đây bằng tiếng Việt ấm áp, rõ ràng, tối đa 3 câu ngắn, thực tế, không dùng thuật ngữ khó. Tuyệt đối KHÔNG khẳng định số lạ là "100% an toàn".
Trả về JSON: {"reply":"câu trả lời ngắn","suggestedScreen":"M02|M03|M04|M07","suggestedActionLabel":"nhãn nút 3-6 từ"}
- M02: Quét kiểm tra tin nhắn/link/SĐT
- M03: Hỏi người thân ngay
- M04: Lập báo cáo Công an / NCSC / 111
- M07: Tra cứu Radar cộng đồng Đồng Nai

Câu hỏi của người dân: "${message}"`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json(fallbackReply);
    }

    const payload = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return NextResponse.json(fallbackReply);
    }

    const parsed = JSON.parse(raw) as Partial<CunChatResponse>;
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
