import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import type { AnalyzeRequest, AnalyzeResult, RiskLevel } from '@/types';

const SYSTEM_PROMPT = `Bạn là trợ lý phòng chống lừa đảo Lá Chắn Số Đồng Nai.
Phân tích nội dung tiếng Việt (hoặc ảnh chụp màn hình tin nhắn nếu có) và trả về JSON hợp lệ theo schema:
{"level":"danger|warn|unknown|safe","badge":"string","title":"string","reasons":["3 lý do ngắn"],"highlights":["từ khóa"],"speech":"1 câu đọc to tiếng Việt","extractedText":"văn bản trích từ ảnh nếu có"}
Quy tắc an toàn: Tuyệt đối KHÔNG khẳng định "100% an toàn" cho số lạ chưa xác thực.`;

async function saveScanHistoryIfLoggedIn(result: AnalyzeResult, rawText: string) {
  const user = await getCurrentUserProfile();
  const supabase = getSupabaseServerClient();
  if (!user || !supabase) return;

  const snippet = (result.extractedText || rawText || result.title).slice(0, 120);
  await supabase.from('scan_history').insert({
    id: `SH-${Date.now()}`,
    user_id: user.id,
    snippet,
    risk_level: result.level,
    title: result.title.slice(0, 100),
    created_at: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeRequest>;
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const imageMimeType = typeof body.imageMimeType === 'string' ? body.imageMimeType : 'image/jpeg';

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'Thiếu nội dung hoặc ảnh cần kiểm tra.' }, { status: 400 });
    }

    const layerOne = runLayerOneRules(text || 'Kiểm tra ảnh chụp màn hình');
    if (body.offline) {
      return NextResponse.json(layerOne);
    }

    const supabase = getSupabaseServerClient();
    const lowerText = text.toLowerCase();

    if (supabase && text) {
      // 1) Check Admin-configured dynamic rules
      const { data: ruleRows } = await supabase
        .from('dynamic_rules')
        .select('pattern, level, note')
        .limit(100);

      const ruleMatch = ruleRows?.find(
        (r) => r.pattern && lowerText.includes(String(r.pattern).toLowerCase())
      );
      if (ruleMatch) {
        const lvl = ruleMatch.level as RiskLevel;
        const ruleResult: AnalyzeResult = {
          level: lvl,
          badge:
            lvl === 'danger'
              ? 'NGUY HIỂM — LUẬT CHẶN ĐỒNG NAI'
              : lvl === 'warn'
              ? 'NGHI NGỜ — CẦN CẢNH GIÁC'
              : 'ĐÃ XÁC THỰC BỞI ĐỘI TNTN',
          title: `Khớp danh sách cập nhật nóng: ${ruleMatch.pattern}`,
          reasons: [
            String(ruleMatch.note),
            'Luật này được Đội Thanh niên tình nguyện Đồng Nai cập nhật trực tiếp lên hệ thống.',
            'Luôn giữ cảnh giác và không chuyển tiền hay đọc mã OTP qua điện thoại.',
          ],
          highlights: [String(ruleMatch.pattern)],
          speech: String(ruleMatch.note),
          source: 'db',
        };
        await saveScanHistoryIfLoggedIn(ruleResult, text);
        return NextResponse.json(ruleResult);
      }

      // 2) Check approved community scam reports
      const { data: approvedRows } = await supabase
        .from('scam_reports')
        .select('id, type, target, area')
        .eq('status', 'approved')
        .limit(100);

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
            'Cảnh báo nguy hiểm! Đối tượng này đã bị cộng đồng Đồng Nai báo cáo lừa đảo và được xác minh.',
          source: 'db',
        };
        await saveScanHistoryIfLoggedIn(dbResult, text);
        return NextResponse.json(dbResult);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      await saveScanHistoryIfLoggedIn(layerOne, text);
      return NextResponse.json(layerOne);
    }

    const parts: Array<Record<string, unknown>> = [
      {
        text: `${SYSTEM_PROMPT}\n\nNội dung văn bản (nếu có): ${
          text || '(Người dùng chỉ gửi ảnh chụp màn hình)'
        }`,
      },
    ];
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64,
        },
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      }
    );

    if (!geminiRes.ok) {
      await saveScanHistoryIfLoggedIn(layerOne, text);
      return NextResponse.json(layerOne);
    }

    const payload = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawJson = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      await saveScanHistoryIfLoggedIn(layerOne, text);
      return NextResponse.json(layerOne);
    }

    const parsed = JSON.parse(rawJson) as Partial<AnalyzeResult>;
    const level = parsed.level ?? layerOne.level;
    const finalLevel = layerOne.level === 'danger' && level === 'safe' ? 'danger' : level;

    const result: AnalyzeResult = {
      level: finalLevel,
      badge: parsed.badge || layerOne.badge,
      title: parsed.title || layerOne.title,
      reasons:
        Array.isArray(parsed.reasons) && parsed.reasons.length > 0
          ? parsed.reasons
          : layerOne.reasons,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : layerOne.highlights,
      speech: parsed.speech || layerOne.speech,
      extractedText: parsed.extractedText,
      source: 'hybrid',
    };

    await saveScanHistoryIfLoggedIn(result, text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(runLayerOneRules(''), { status: 200 });
  }
}
