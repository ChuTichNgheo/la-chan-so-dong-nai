import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import { inspectAllUrlsInText } from '@/lib/url-inspector';
import type { AnalyzeRequest, AnalyzeResult, RiskLevel, UrlInspectionReport } from '@/types';

const SYSTEM_PROMPT = `Bạn là trợ lý phòng chống lừa đảo Lá Chắn Số Đồng Nai.
Phân tích nội dung tiếng Việt hoặc ảnh chụp màn hình (bao gồm tin nhắn SMS/Zalo, bill chuyển khoản, hoặc mã QR nếu có) và trả về JSON hợp lệ theo schema:
{"level":"danger|warn|unknown|safe","badge":"string","title":"string","reasons":["3 lý do ngắn"],"highlights":["từ khóa/SĐT/STK/URL"],"speech":"1 câu đọc to tiếng Việt","extractedText":"văn bản, SĐT, STK hoặc link trích từ ảnh/QR nếu có"}
Quy tắc an toàn: Tuyệt đối KHÔNG khẳng định "100% an toàn" cho số lạ chưa xác thực.`;

function normalizeCompact(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9.]/g, '');
}

function getWorstUrlRisk(reports: UrlInspectionReport[]): RiskLevel | null {
  if (reports.some((r) => r.risk === 'danger')) return 'danger';
  if (reports.some((r) => r.risk === 'warn')) return 'warn';
  return null;
}

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
    const urlReports = text
      ? await inspectAllUrlsInText(text, { expandShortlink: !body.offline })
      : [];

    if (body.offline) {
      const worstUrl = getWorstUrlRisk(urlReports);
      const offlineLevel =
        layerOne.level === 'danger' || worstUrl === 'danger'
          ? 'danger'
          : layerOne.level === 'warn' || worstUrl === 'warn'
          ? 'warn'
          : layerOne.level;
      return NextResponse.json({
        ...layerOne,
        level: offlineLevel,
        urlReports: urlReports.length > 0 ? urlReports : undefined,
      });
    }

    const supabase = getSupabaseServerClient();
    const lowerText = text.toLowerCase();
    const compactText = normalizeCompact(text);
    let communityMatches = 0;

    if (supabase && text) {
      const { data: ruleRows } = await supabase
        .from('dynamic_rules')
        .select('pattern, level, note')
        .limit(100);

      const ruleMatch = ruleRows?.find((r) => {
        const p = String(r.pattern ?? '').trim();
        return p && (lowerText.includes(p.toLowerCase()) || compactText.includes(normalizeCompact(p)));
      });
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
          urlReports: urlReports.length > 0 ? urlReports : undefined,
          source: 'db',
        };
        await saveScanHistoryIfLoggedIn(ruleResult, text);
        return NextResponse.json(ruleResult);
      }

      const { data: approvedRows } = await supabase
        .from('scam_reports')
        .select('id, type, target, area')
        .eq('status', 'approved')
        .limit(200);

      const matchedList =
        approvedRows?.filter((row) => {
          const targetStr = String(row.target ?? '').trim();
          if (!targetStr) return false;
          const normTarget = normalizeCompact(targetStr);
          return (
            lowerText.includes(targetStr.toLowerCase()) ||
            (normTarget.length >= 6 && compactText.includes(normTarget))
          );
        }) ?? [];

      communityMatches = matchedList.length;
      if (matchedList.length > 0) {
        const first = matchedList[0];
        const dbResult: AnalyzeResult = {
          level: 'danger',
          badge: 'NGUY HIỂM — ĐÃ XÁC MINH TỪ CỘNG ĐỒNG',
          title: `Trùng ${matchedList.length} báo cáo đã duyệt (${first.id})`,
          reasons: [
            `Đối tượng/đường dẫn đã bị cộng đồng Đồng Nai tố cáo ${matchedList.length} lần (${first.type}).`,
            `Khu vực ghi nhận gần nhất: ${first.area}.`,
            'Tuyệt đối không chuyển tiền, không bấm link và không cung cấp mã OTP.',
          ],
          highlights: [String(first.target)],
          speech:
            'Cảnh báo nguy hiểm! Đối tượng này đã bị cộng đồng Đồng Nai báo cáo lừa đảo và được xác minh.',
          urlReports: urlReports.length > 0 ? urlReports : undefined,
          communityMatches,
          source: 'db',
        };
        await saveScanHistoryIfLoggedIn(dbResult, text);
        return NextResponse.json(dbResult);
      }
    }

    const worstUrlRisk = getWorstUrlRisk(urlReports);
    if (worstUrlRisk === 'danger' && layerOne.level !== 'danger') {
      const urlDanger: AnalyzeResult = {
        level: 'danger',
        badge: 'NGUY HIỂM — ĐƯỜNG DẪN GIẢ MẠO KỸ THUẬT',
        title: 'Phát hiện đường link có dấu hiệu giả mạo / độc hại',
        reasons: [
          ...urlReports.flatMap((u) => u.flags).slice(0, 2),
          'Tuyệt đối không đăng nhập, không nhập OTP hay cài tệp .apk từ đường dẫn này.',
        ],
        highlights: urlReports.map((u) => u.hostname),
        speech: 'Cảnh báo nguy hiểm! Đường dẫn này có dấu hiệu giả mạo kỹ thuật. Tuyệt đối không bấm vào!',
        urlReports,
        communityMatches,
        source: 'offline',
      };
      await saveScanHistoryIfLoggedIn(urlDanger, text);
      return NextResponse.json(urlDanger);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const enrichedLocal: AnalyzeResult = {
        ...layerOne,
        urlReports: urlReports.length > 0 ? urlReports : undefined,
        communityMatches,
      };
      await saveScanHistoryIfLoggedIn(enrichedLocal, text);
      return NextResponse.json(enrichedLocal);
    }

    const urlSummary =
      urlReports.length > 0
        ? `\nPhân tích kỹ thuật URL: ${JSON.stringify(urlReports)}`
        : '';

    const parts: Array<Record<string, unknown>> = [
      {
        text: `${SYSTEM_PROMPT}\n\nNội dung văn bản (nếu có): ${
          text || '(Người dùng chỉ gửi ảnh chụp màn hình / bill / mã QR)'
        }${urlSummary}`,
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

    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      const fallback = {
        ...layerOne,
        urlReports: urlReports.length > 0 ? urlReports : undefined,
        communityMatches,
      };
      await saveScanHistoryIfLoggedIn(fallback, text);
      return NextResponse.json(fallback);
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
    const extractedUrlReports =
      urlReports.length === 0 && parsed.extractedText
        ? await inspectAllUrlsInText(parsed.extractedText, { expandShortlink: true })
        : urlReports;

    const extractedWorst = getWorstUrlRisk(extractedUrlReports);
    let finalLevel = parsed.level ?? layerOne.level;
    if (
      (layerOne.level === 'danger' || extractedWorst === 'danger') &&
      (finalLevel === 'safe' || finalLevel === 'unknown')
    ) {
      finalLevel = 'danger';
    }

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
      urlReports: extractedUrlReports.length > 0 ? extractedUrlReports : undefined,
      communityMatches,
      source: 'hybrid',
    };

    await saveScanHistoryIfLoggedIn(result, text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(runLayerOneRules(''), { status: 200 });
  }
}
