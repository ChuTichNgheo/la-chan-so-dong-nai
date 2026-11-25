import { NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'Đường dẫn giả mạo',
  'Giả danh công an / cơ quan',
  'Tuyển CTV việc nhẹ lương cao',
  'Người thân gặp tai nạn',
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageBase64?: string; imageMimeType?: string };
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const imageMimeType = typeof body.imageMimeType === 'string' ? body.imageMimeType : 'image/jpeg';

    if (!imageBase64) {
      return NextResponse.json({ error: 'Thiếu ảnh bằng chứng.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trên server để đọc ảnh.' },
        { status: 503 }
      );
    }

    const prompt = `Trích xuất thông tin từ ảnh chụp bằng chứng lừa đảo tại Việt Nam để điền phiếu tố cáo.
Trả về JSON hợp lệ theo schema:
{"type":"một trong 4 giá trị: Đường dẫn giả mạo | Giả danh công an / cơ quan | Tuyển CTV việc nhẹ lương cao | Người thân gặp tai nạn","target":"SĐT, đường link, hoặc STK xuất hiện trong ảnh","area":"địa bàn Đồng Nai nếu thấy hoặc P. Trấn Biên","description":"tóm tắt 1-2 câu hành vi lừa đảo trong ảnh"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inline_data: { mime_type: imageMimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Không đọc được nội dung từ ảnh này.' }, { status: 502 });
    }

    const payload = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return NextResponse.json({ error: 'AI chưa bóc tách được chữ từ ảnh.' }, { status: 422 });
    }

    const parsed = JSON.parse(raw) as {
      type?: string;
      target?: string;
      area?: string;
      description?: string;
    };

    const safeType = ALLOWED_TYPES.includes(parsed.type ?? '')
      ? (parsed.type as string)
      : ALLOWED_TYPES[0];

    return NextResponse.json({
      type: safeType,
      target: String(parsed.target || '').slice(0, 120),
      area: String(parsed.area || 'P. Trấn Biên').slice(0, 80),
      description: String(parsed.description || '').slice(0, 300),
    });
  } catch {
    return NextResponse.json({ error: 'Lỗi phân tích ảnh bằng chứng.' }, { status: 500 });
  }
}
