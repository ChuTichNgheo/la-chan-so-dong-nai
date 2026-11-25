import { NextResponse } from 'next/server';
import { callGeminiJson } from '@/lib/gemini-client';

interface TranscribeResult {
  transcript?: string;
}

/**
 * Universal mobile voice transcription endpoint using Gemini Multimodal Audio.
 * Works on iPhone Safari, Android Chrome, Zalo/Messenger WebView, etc. where Web SpeechRecognition fails.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { audioBase64?: string; mimeType?: string };
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const mimeType = typeof body.mimeType === 'string' && body.mimeType ? body.mimeType : 'audio/webm';

    if (!audioBase64) {
      return NextResponse.json({ error: 'Thiếu dữ liệu âm thanh ghi âm.' }, { status: 400 });
    }

    const aiRes = await callGeminiJson<TranscribeResult>({
      parts: [
        {
          text: 'Hãy chép lại chính xác lời nói tiếng Việt trong đoạn ghi âm sau (giữ nguyên số điện thoại, số tiền, đường dẫn nếu có). Trả về JSON: {"transcript":"nội dung lời nói tiếng Việt, để rỗng nếu không nghe rõ tiếng người"}',
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: audioBase64,
          },
        },
      ],
      temperature: 0.1,
      timeoutMs: 12000,
    });

    if (!aiRes?.data?.transcript?.trim()) {
      return NextResponse.json(
        { error: 'Chưa nghe rõ giọng nói trong đoạn ghi âm — bạn hãy nói gần Micro hơn nhé.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      transcript: aiRes.data.transcript.trim(),
      model: aiRes.model,
    });
  } catch {
    return NextResponse.json({ error: 'Không xử lý được đoạn ghi âm lúc này.' }, { status: 500 });
  }
}
