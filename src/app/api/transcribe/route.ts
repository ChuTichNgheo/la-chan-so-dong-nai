import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini-client';

/**
 * Universal mobile voice transcription endpoint using Gemini Multimodal Audio.
 * Uses plain-text generation (more reliable than forced JSON mode with audio inline_data)
 * and supports audio/webm, audio/mp4, audio/ogg, audio/wav from iPhone Safari & Android.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { audioBase64?: string; mimeType?: string };
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const rawMime = typeof body.mimeType === 'string' && body.mimeType ? body.mimeType : 'audio/webm';
    const cleanMime = rawMime.split(';')[0].trim().toLowerCase() || 'audio/webm';

    if (!audioBase64 || audioBase64.length < 100) {
      return NextResponse.json({ error: 'Đoạn ghi âm quá ngắn — hãy nói rõ trong 2–5 giây rồi dừng.' }, { status: 400 });
    }

    const aiRes = await callGemini({
      parts: [
        {
          text: 'Nghe đoạn ghi âm tiếng Việt đính kèm và chép lại NGUYÊN VĂN lời nói của người nói (giữ nguyên số điện thoại, số tiền, từ khóa như công an, chuyển tiền, OTP nếu có). Chỉ trả về đúng đoạn văn bản lời nói thuần túy, không giải thích thêm. Nếu hoàn toàn im lặng không có tiếng người thì trả về chuỗi rỗng.',
        },
        {
          inline_data: {
            mime_type: cleanMime,
            data: audioBase64,
          },
        },
      ],
      jsonMode: false,
      temperature: 0.1,
      timeoutMs: 18000,
    });

    const transcript = (aiRes?.text || '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .trim();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Chưa nghe rõ giọng nói trong đoạn ghi âm — bạn hãy nói gần Micro hơn nhé.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      transcript,
      model: aiRes?.model,
    });
  } catch {
    return NextResponse.json({ error: 'Không xử lý được đoạn ghi âm lúc này.' }, { status: 500 });
  }
}
