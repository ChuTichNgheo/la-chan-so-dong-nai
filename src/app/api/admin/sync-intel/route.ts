import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { ScamReport } from '@/types';

interface RssHeadline {
  title: string;
  summary: string;
  link: string;
  source: string;
}

interface ExtractedDraft {
  type: string;
  target: string;
  area: string;
  description: string;
}

const RSS_SOURCES = [
  { name: 'VnExpress Pháp luật', url: 'https://vnexpress.net/rss/phap-luat.rss' },
  { name: 'VnExpress Số hóa', url: 'https://vnexpress.net/rss/so-hoa.rss' },
  { name: 'Tuổi Trẻ Pháp luật', url: 'https://tuoitre.vn/rss/phap-luat.rss' },
  { name: 'Thanh Niên Thời sự', url: 'https://thanhnien.vn/rss/thoi-su.rss' },
];

const SCAM_KEYWORDS = [
  'lừa đảo',
  'chiếm đoạt',
  'giả danh',
  'công an',
  'đường link',
  'mã otp',
  'otp',
  'việc nhẹ',
  'tài khoản',
  'deepfake',
  'vneid',
  'ngân hàng',
  'đồng nai',
  'an ninh mạng',
  'mạo danh',
  'chuyển tiền',
  'tín dụng đen',
];

const CURATED_FALLBACK_DRAFTS: ExtractedDraft[] = [
  {
    type: 'Đường dẫn giả mạo',
    target: 'http://dichvucong-dongnai-bhyt.xyz',
    area: 'P. Trấn Biên',
    description:
      '[Tổng hợp AI] Thủ đoạn nhắn tin giả mạo cập nhật VNeID / tích hợp BHYT dẫn sang tên miền .xyz yêu cầu cài file .apk.',
  },
  {
    type: 'Giả danh công an / cơ quan',
    target: 'Cuộc gọi Video Deepfake Công an tỉnh',
    area: 'H. Long Thành',
    description:
      '[Tổng hợp AI] Đối tượng dùng công nghệ Deepfake giả mặc sắc phục, gọi video đe dọa liên quan vụ án để ép chuyển tiền xác minh.',
  },
  {
    type: 'Tuyển CTV việc nhẹ lương cao',
    target: 'Nhóm Telegram nhiệm vụ hoàn tiền 200k',
    area: 'P. Tân Phong',
    description:
      '[Tổng hợp AI] Tuyển học sinh, sinh viên làm CTV nghe nhạc/thả tim online, trả thưởng nhỏ rồi dụ nạp tiền triệu.',
  },
];

function stripCdataAndTags(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssItems(xml: string, source: string): RssHeadline[] {
  const items: RssHeadline[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemMatches.slice(0, 25)) {
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const title = stripCdataAndTags(titleMatch?.[1] ?? '');
    const summary = stripCdataAndTags(descMatch?.[1] ?? '').slice(0, 220);
    const link = stripCdataAndTags(linkMatch?.[1] ?? '');
    if (!title) continue;
    const combined = `${title} ${summary}`.toLowerCase();
    if (SCAM_KEYWORDS.some((kw) => combined.includes(kw))) {
      items.push({ title, summary, link, source });
    }
  }
  return items;
}

async function fetchVietnameseScamRss(): Promise<RssHeadline[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(src.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'LaChanSoDongNai/1.0 (+https://dongnai.gov.vn)' },
          cache: 'no-store',
        });
        if (!res.ok) return [] as RssHeadline[];
        const xml = await res.text();
        return parseRssItems(xml, src.name);
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const collected: RssHeadline[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') collected.push(...r.value);
  }
  return collected.slice(0, 8);
}

function mapHeadlineLocally(h: RssHeadline): ExtractedDraft {
  const lower = `${h.title} ${h.summary}`.toLowerCase();
  let type = 'Thủ đoạn lừa đảo mới';
  if (lower.includes('link') || lower.includes('apk') || lower.includes('vneid') || lower.includes('web')) {
    type = 'Đường dẫn giả mạo';
  } else if (lower.includes('công an') || lower.includes('ngân hàng') || lower.includes('giả danh')) {
    type = 'Giả danh công an / cơ quan';
  } else if (lower.includes('việc nhẹ') || lower.includes('ctv') || lower.includes('nhiệm vụ')) {
    type = 'Tuyển CTV việc nhẹ lương cao';
  }

  const area = lower.includes('đồng nai') || lower.includes('biên hòa')
    ? 'P. Trấn Biên'
    : 'Toàn tỉnh Đồng Nai (Cảnh báo sớm)';

  return {
    type,
    target: h.title.slice(0, 68),
    area,
    description: `[${h.source}] ${h.title}${h.summary ? ` — ${h.summary.slice(0, 130)}` : ''}`,
  };
}

async function normalizeWithGemini(headlines: RssHeadline[]): Promise<ExtractedDraft[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || headlines.length === 0) return null;

  const prompt = `Bạn là hệ thống thu thập tình báo phòng chống lừa đảo cho Đội Thanh niên tình nguyện tỉnh Đồng Nai.
Dưới đây là các tin tức mới nhất từ báo chí chính thống Việt Nam:
${headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title} — ${h.summary}`).join('\n')}

Hãy tổng hợp thành đúng 3 bản ghi cảnh báo lừa đảo ngắn gọn để đưa vào hàng chờ Quản trị viên soát duyệt.
Trả về JSON array hợp lệ theo đúng schema:
[{"type":"Đường dẫn giả mạo | Giả danh công an / cơ quan | Tuyển CTV việc nhẹ lương cao | Giả người thân / thủ đoạn mới","target":"tên thủ đoạn / link / SĐT ngắn gọn (dưới 55 ký tự)","area":"P. Trấn Biên | P. Tân Phong | TP. Long Khánh | H. Long Thành | Toàn tỉnh Đồng Nai","description":"[Nguồn báo] tóm tắt rõ thủ đoạn và cảnh báo trong 1-2 câu tiếng Việt"}]`;

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;

    const payload = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const valid: ExtractedDraft[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Partial<ExtractedDraft>;
      if (obj.type && obj.target && obj.description) {
        valid.push({
          type: String(obj.type).trim().slice(0, 60),
          target: String(obj.target).trim().slice(0, 80),
          area: String(obj.area || 'Toàn tỉnh Đồng Nai').trim().slice(0, 50),
          description: String(obj.description).trim().slice(0, 260),
        });
      }
    }
    return valid.length > 0 ? valid.slice(0, 3) : null;
  } catch {
    return null;
  }
}

export async function POST() {
  const user = await getCurrentUserProfile();
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Chỉ Quản trị viên Đội TNTN mới được đồng bộ tin cảnh báo tự động.' },
      { status: 403 }
    );
  }

  const headlines = await fetchVietnameseScamRss();
  let sourceMode: 'rss+gemini' | 'rss-local' | 'curated-intel' = 'curated-intel';
  let drafts: ExtractedDraft[] = [];

  if (headlines.length > 0) {
    const aiDrafts = await normalizeWithGemini(headlines);
    if (aiDrafts && aiDrafts.length > 0) {
      drafts = aiDrafts;
      sourceMode = 'rss+gemini';
    } else {
      drafts = headlines.slice(0, 3).map(mapHeadlineLocally);
      sourceMode = 'rss-local';
    }
  } else {
    drafts = CURATED_FALLBACK_DRAFTS;
    sourceMode = 'curated-intel';
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const inserted: ScamReport[] = [];

  if (!supabase) {
    for (let i = 0; i < drafts.length; i += 1) {
      const d = drafts[i];
      inserted.push({
        id: `AI-${Date.now().toString().slice(-4)}${i}`,
        type: d.type,
        target: d.target,
        targetMasked: maskSensitiveTarget(d.target),
        area: d.area,
        description: d.description,
        status: 'pending',
        reporterId: user.id,
        createdAt: now,
      });
    }
    return NextResponse.json({
      insertedCount: inserted.length,
      inserted,
      feedScannedCount: headlines.length,
      sourceMode,
      storage: 'fallback',
      message: `Đã gom ${inserted.length} cảnh báo mới vào hàng chờ duyệt (chế độ cục bộ).`,
    });
  }

  const { data: existingRows } = await supabase
    .from('scam_reports')
    .select('target')
    .order('created_at', { ascending: false })
    .limit(60);

  const existingTargets = new Set(
    (existingRows ?? []).map((r) => String(r.target ?? '').trim().toLowerCase())
  );

  for (let i = 0; i < drafts.length; i += 1) {
    const d = drafts[i];
    if (existingTargets.has(d.target.trim().toLowerCase())) continue;

    const report: ScamReport = {
      id: `AI-${Math.floor(1000 + Math.random() * 8900)}`,
      type: d.type,
      target: d.target,
      targetMasked: maskSensitiveTarget(d.target),
      area: d.area,
      description: d.description,
      status: 'pending',
      reporterId: user.id,
      createdAt: now,
    };

    const { error } = await supabase.from('scam_reports').insert({
      id: report.id,
      type: report.type,
      target: report.target,
      target_masked: report.targetMasked,
      area: report.area,
      description: report.description,
      status: 'pending',
      reporter_id: user.id,
      created_at: report.createdAt,
    });

    if (!error) {
      inserted.push(report);
      existingTargets.add(d.target.trim().toLowerCase());
    }
  }

  return NextResponse.json({
    insertedCount: inserted.length,
    inserted,
    feedScannedCount: headlines.length,
    sourceMode,
    storage: 'supabase',
    message:
      inserted.length > 0
        ? `Đã tự động quét ${headlines.length} tin báo chí & đẩy ${inserted.length} cảnh báo mới vào hàng chờ Admin soát duyệt!`
        : 'Các cảnh báo mới nhất đều đã có trong hệ thống, không có tin trùng lặp cần thêm.',
  });
}
