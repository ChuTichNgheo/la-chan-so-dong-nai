import { NextResponse } from 'next/server';
import { callGemini, hasGeminiKeyConfigured } from '@/lib/gemini-client';
import type { RadarStats, ScamReport } from '@/types';

interface BulletinRequest {
  area?: string;
  stats?: RadarStats;
  recentApproved?: ScamReport[];
}

function buildFallbackBulletin(area: string, stats?: RadarStats): string {
  const total = stats?.totalReports ?? 120;
  const fakePct = stats?.fakeLinkPercent ?? 35;
  return `🛡️ BẢN TIN CẢNH BÁO AN TOÀN SỐ — ${area.toUpperCase()} (ĐỒNG NAI)

Kính gửi cô chú, anh chị và các bạn đoàn viên khu phố,
Tuần qua, hệ thống Lá Chắn Số Đồng Nai đã ghi nhận ${total} lượt báo cáo xác minh, trong đó ${fakePct}% là đường dẫn giả mạo (.xyz, .top, tệp .apk).

⚠️ 3 ĐIỀU TUYỆT ĐỐI NHỚ:
1️⃣ Công an, Viện kiểm sát, Điện lực KHÔNG BAO GIỜ gọi điện yêu cầu chuyển tiền xác minh hay đọc mã OTP.
2️⃣ KHÔNG bấm link lạ tích hợp BHYT/VNeID, KHÔNG nạp tiền làm nhiệm vụ "việc nhẹ lương cao".
3️⃣ Gặp cuộc gọi hoặc tin nhắn lạ → Dừng lại, mở Lá Chắn Số Đồng Nai kiểm tra miễn phí hoặc bấm nút "Hỏi người thân" ngay!

— Tổ Công nghệ số cộng đồng & Đội TNTN Đồng Nai (INFINITY AI)`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulletinRequest;
    const area = body.area?.trim() || 'Toàn tỉnh Đồng Nai';
    const fallback = buildFallbackBulletin(area, body.stats);

    if (!hasGeminiKeyConfigured()) {
      return NextResponse.json({ bulletin: fallback, source: 'template' });
    }

    const recentText = (body.recentApproved ?? [])
      .slice(0, 4)
      .map((r) => `- ${r.area}: ${r.type} (${r.targetMasked})`)
      .join('\n');

    const prompt = `Bạn là cán bộ Tổ Công nghệ số cộng đồng tỉnh Đồng Nai.
Hãy viết 1 bản tin cảnh báo phòng chống lừa đảo ngắn gọn (tối đa 160 từ, chia gạch đầu dòng dễ đọc có biểu tượng cảm xúc rõ ràng) để gửi vào nhóm Zalo khu phố tại địa bàn: "${area}".
Số liệu thực tế hiện có:
- Tổng báo cáo đã xác minh: ${body.stats?.totalReports ?? 120}
- Tỷ lệ đường dẫn giả mạo: ${body.stats?.fakeLinkPercent ?? 35}%
${recentText ? `- Các vụ việc mới xác minh:\n${recentText}` : ''}

Yêu cầu: Văn phong gần gũi, dễ hiểu cho cả người lớn tuổi lẫn học sinh, nhắc 3 nguyên tắc vàng (không chuyển tiền cho người tự xưng công an, không bấm link/cài apk, gặp nghi vấn bấm Hỏi người thân). Chỉ trả về nội dung tin nhắn thuần túy (không bọc markdown code block).`;

    const aiRes = await callGemini({
      parts: [{ text: prompt }],
      temperature: 0.45,
      timeoutMs: 9000,
      cacheKey: `zalo:${area}:${body.stats?.totalReports ?? 120}`,
      cacheTtlMs: 5 * 60 * 1000,
    });

    if (!aiRes?.text) {
      return NextResponse.json({ bulletin: fallback, source: 'template' });
    }

    return NextResponse.json({ bulletin: aiRes.text, source: 'gemini', model: aiRes.model });
  } catch {
    return NextResponse.json({
      bulletin: buildFallbackBulletin('Đồng Nai'),
      source: 'template',
    });
  }
}
