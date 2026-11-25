# NHẬT KÝ BÀN GIAO AI (Cập nhật mỗi 2 giờ hoặc trước khi đổi AI)

## Trạng thái hiện tại
- Giai đoạn: Đã sửa Cún AI nhỏ gọn (không đè thanh đáy), bỏ viền hộp ngoài, thêm hiệu ứng nhấp/nháy trực tiếp trên nút bấm (`cun-btn-active` / `cun-btn-clicked`) + xong Cụm A & Cụm B.
- Tính năng đã chạy ổn định:
  - [x] Cụm A: M01, M01b, M02, Giọng đọc 3 tầng + 13 file `.mp3`
  - [x] `MobileShell`: Khung `h-dvh overflow-hidden` cố định header & 5 tab đáy, nút Cún AI nhỏ gọn `28px` nằm phía trên thanh đáy (`bottom-[74px]`), không che chữ/tab
  - [x] `CunAiGuideOverlay`: Theo sát tọa độ nút sau khi scroll, áp dụng `.cun-btn-clicked` + badge `"Đã bấm"` trực tiếp trên nút, dừng trước nút xác nhận cuối
  - [x] Cụm B: M03, M04 (`POST /api/reports`), M07 (Supabase + `VOLUNTEER_PIN` + Xuất thẻ Zalo PNG)
  - [ ] Cụm C: Hoàn thiện M05 (2 video thật + 10 kịch bản) + M06 (Mini Game 5 màn + 10 bài học) + M08

## Hợp đồng dữ liệu (JSON Contract trong `src/types/index.ts`)
- `POST /api/analyze` -> `{ level, badge, title, reasons, highlights, speech, source }`
- `GET /api/reports` -> `{ stats: RadarStats, queue: ScamReport[], recentApproved: ScamReport[], source }`
- `POST /api/reports` -> `{ report: ScamReport, source }`
- `PATCH /api/reports/[id]` -> `{ report, source }`

## Việc tiếp theo cần làm ngay
- Hoàn thiện Cụm C: M05 (chép 2 video thật + 10 tình huống), M06 (Mini Game 5 màn có đồng hồ 10 giây, 3 lá chắn, chuỗi đúng, huy hiệu + 10 bài học) và M08.

## Nhật ký Công cụ AI & Thư viện
- Công cụ hỗ trợ lập trình: Antigravity (Gemini)
- API & Nền tảng: Next.js 16, TypeScript, Tailwind CSS, Lucide React, Supabase (`@supabase/supabase-js`), Gemini API, Web Speech API, HTML5 Canvas
- Tài nguyên media từ Vòng 1: 13 file giọng đọc `.mp3` trong `public/audio/`
