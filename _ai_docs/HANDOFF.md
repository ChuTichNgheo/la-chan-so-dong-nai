# NHẬT KÝ BÀN GIAO AI (Cập nhật mỗi 2 giờ hoặc trước khi đổi AI)

## Trạng thái hiện tại
- Giai đoạn: Hoàn thiện Cụm A (M01 + M01b + M02 + Cún AI + Giọng đọc 3 tầng + Audio fallback)
- Tính năng đã chạy ổn định:
  - [x] Khung Next.js 16 App Router + Tailwind + Lucide + Supabase client
  - [x] `MobileShell` + 5 tab đáy + toast thông báo + Chế độ 65+
  - [x] M01–M01b–M02: 4 chip mẫu nhanh, Micro giọng nói (`vi-VN`), highlight từ khóa nguy hiểm, chuyển 4 mức cảnh báo, đọc giọng 3 tầng + 13 file `.mp3` trong `public/audio/`
  - [x] Cún AI SVG + `CunAiSheet` (4 luồng dẫn đường, Human-in-the-Loop)
  - [ ] Cụm B: Hoàn thiện sâu M04 + M07 (Supabase + PIN + Canvas Zalo) + M03
  - [ ] Cụm C: Hoàn thiện M05 (Video thật + 10 kịch bản) + M06 (Mini Game 5 màn + 10 bài) + M08

## Hợp đồng dữ liệu (JSON Contract trong `src/types/index.ts` - Không tự ý đổi tên trường)
- `POST /api/analyze`: nhận `{ text: string, offline?: boolean }` -> trả `{ level, badge, title, reasons, highlights, speech, source }`
- `GET /api/reports`: trả `{ stats: RadarStats, queue: ScamReport[], recentApproved: ScamReport[], source }`
- `POST /api/reports`: nhận `{ type, target, area, description }` -> trả `{ report: ScamReport, source }`
- `PATCH /api/reports/[id]`: nhận `{ status: 'approved'|'rejected', pin?: string }` -> trả `{ report, source }`

## Việc tiếp theo cần làm ngay
- Hoàn thiện Cụm B (M04 + M07 + M03) kết nối Supabase thật.

## Nhật ký Công cụ AI & Thư viện
- Công cụ hỗ trợ lập trình: Antigravity (Gemini)
- API & Nền tảng: Next.js 16, TypeScript, Tailwind CSS, Lucide React, Supabase (`@supabase/supabase-js`), Gemini API, Web Speech API, HTML5 Canvas
- Tài nguyên media từ Vòng 1: 13 file giọng đọc `.mp3` trong `public/audio/`
