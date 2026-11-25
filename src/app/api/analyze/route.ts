import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { getSupabaseServerClient } from '@/lib/db';
import type { AnalyzeRequest, AnalyzeResult } from '@/types';

const SYSTEM_PROMPT = `Bạn là trợ lý phòng chống lừa đảo Lá Chắn Số Đồng Nai.
Phân tích nội dung tiếng Việt người dùng gửi và trả về JSON hợp lệ theo schema:
{"level":"danger|warn|unknown|safe","badge":"string","title":"string","reasons":["3 lý do ngắn"],"highlights":["từ khóa"],"speech":"1 câu đọc to tiếng Việt"}
Quy tắc an toàn: Tuyệt đối KHÔNG khẳng định "100% an toàn" cho số lạ chưa xác thực.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeRequest>;
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'Thiếu nội dung cần kiểm tra.' }, { status: 400 });
    }

    const layerOne = runLayerOneRules(text);
    if (body.offline) {
      return NextResponse.json(layerOne);
    }

    // Check community-approved scam targets stored in Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: approvedRows } = await supabase
        .from('scam_reports')
        .select('id, type, target, area')
        .eq('status', 'approved')
        .limit(100);

      const lowerText = text.toLowerCase();
      const matched = approvedRows?.find(
        (row) => row.target && lowerText.includes(String(row.target).toLowerCase())
      );
      if (matched) {
        const dbResult: AnalyzeResult = {
          level: 'danger',
          badge: 'NGUY HIỂM — ĐÃ XÁC MINH TỪ CỘNG ĐỒNG',
          title: `Trùng báo cáo đã duyệt (${matched.id})`,
          reasons: [
            `Đối tượng/đường dẫn đã bị người dân báo cáo và Đội TNTN xác minh (${matched.type}).`,
            `Khu vực ghi nhận: ${matched.area}.`,
            'Tuyệt đối không chuyển tiền, không bấm link và không cung cấp mã OTP.',
          ],
          highlights: [String(matched.target)],
          speech:
            'Cảnh báo nguy hiểm! Đối tượng này đã bị cộng đồng Đồng Nai báo cáo lừa đảo và được xác minh. Hãy dừng giao dịch ngay!',
          source: 'db',
        };
        return NextResponse.json(dbResult);
      }
    }

    // Optional Layer-2 Gemini API analysis
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(layerOne);
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nNội dung: ${text}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json(layerOne);
    }

    const payload = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawJson = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return NextResponse.json(layerOne);
    }

    const parsed = JSON.parse(rawJson) as Partial<AnalyzeResult>;
    const level = parsed.level ?? layerOne.level;
    // Anti-False-Negative: never let AI downgrade local danger to safe
    const finalLevel = layerOne.level === 'danger' && level === 'safe' ? 'danger' : level;

    const result: AnalyzeResult = {
      level: finalLevel,
      badge: parsed.badge || layerOne.badge,
      title: parsed.title || layerOne.title,
      reasons: Array.isArray(parsed.reasons) && parsed.reasons.length > 0 ? parsed.reasons : layerOne.reasons,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : layerOne.highlights,
      speech: parsed.speech || layerOne.speech,
      source: 'hybrid',
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(runLayerOneRules(''), { status: 200 });
  }
}
