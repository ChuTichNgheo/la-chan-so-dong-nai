# NHẬT KÝ BÀN GIAO AI (Cập nhật mỗi 2 giờ hoặc trước khi đổi AI)

## Trạng thái hiện tại
- Giai đoạn: Hoàn thiện đủ MVP 8 màn hình (Cụm A + Cụm B + Cụm C).
- Tính năng đã chạy ổn định:
  - [x] Cụm A: M01, M01b, M02, Giọng đọc 3 tầng + 13 file `.mp3`
  - [x] Cún AI thuần hình cún, bay dẫn đường + hiệu ứng nhấn nút thật, dừng trước nút xác nhận cuối
  - [x] Cụm B: M03 (che SĐT, 2 góc nhìn), M04 (`POST /api/reports`), M07 (Supabase + `VOLUNTEER_PIN` + Xuất thẻ Zalo PNG)
  - [x] Cụm C: M05 (2 video `.mp4` thật + 10 kịch bản, phụ đề to, gửi Ba/Mẹ), M06 (Mini Game 5 màn đồng hồ 10s, chuỗi, 3 lá chắn, huy hiệu + 10 bài học 1 phút), M08 (4 trạng thái + giả lập mất mạng)

## Hợp đồng dữ liệu (JSON Contract trong `src/types/index.ts`)
- `POST /api/analyze` -> `{ level, badge, title, reasons, highlights, speech, source }`
- `GET /api/reports` -> `{ stats: RadarStats, queue: ScamReport[], recentApproved: ScamReport[], source }`
- `POST /api/reports` -> `{ report: ScamReport, source }`
- `PATCH /api/reports/[id]` -> `{ report, source }`

## Việc tiếp theo cần làm ngay
- Giai đoạn 2 (Sáng tạo thêm tính năng ăn điểm Tiêu chí 3):
  - Quét ảnh chụp màn hình tin nhắn (Gemini Vision OCR) ở M01.
  - Deploy Vercel + kiểm thử thực tế trên điện thoại qua QR + viết `TECHNICAL_REPORT.md` & Slide ≤ 10 trang.

## Nhật ký Công cụ AI & Thư viện
- Công cụ hỗ trợ lập trình: Antigravity (Gemini)
- API & Nền tảng: Next.js 16, TypeScript, Tailwind CSS, Lucide React, Supabase (`@supabase/supabase-js`), Gemini API, Web Speech API, HTML5 Canvas
- Tài nguyên media từ Vòng 1: 13 file `.mp3` trong `public/audio/` và 2 file `.mp4` trong `public/videos/`
