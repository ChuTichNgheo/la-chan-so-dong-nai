# NHẬT KÝ BÀN GIAO AI (Cập nhật mỗi 2 giờ hoặc trước khi đổi AI)

## Trạng thái hiện tại
- Giai đoạn: Đã hoàn thiện full-stack 9 màn hình (`M01`–`M09`) + Auth & Phân quyền + UX/UI Vòng 1 Hero kết hợp nâng cấp 2026 (`npx tsc --noEmit && npm run lint && npm run build` pass `0` lỗi).
- Tính năng đã chạy ổn định:
  - [x] Hệ thống Auth (`scrypt` + `HttpOnly Cookie`) & Phân quyền Người dân/Quản trị (`M09` + `M07`)
  - [x] `M01` + `M01b` + `M02`: Hero Emerald Gradient + Spotlight Bar (Dán 1 chạm, Micro, Ảnh Gemini Vision), Bento Hỏi người thân & Radar 120 báo cáo, Live 2-Stage Scan Stepper
  - [x] `M05`: Full-bleed Reels vuốt dọc + Segmented Story Progress Bars + Animated Story Cards & Audio Wave cho cả 10 kịch bản
  - [x] `M06`: Interactive Chat Simulator (bong bóng tin nhắn + thanh đếm ngược 10s + phản xạ nhanh) + 10 bài học 1 phút
  - [x] `MobileShell`: Web app gọn `max-w-[430px]` (không thẻ phụ bên ngoài), nút Cún AI nhỏ gọn + hiệu ứng nhấn nút trực tiếp

## Việc tiếp theo cần làm ngay
- Đẩy code lên GitHub, chạy `supabase/schema.sql` trên Supabase SQL Editor, deploy lên Vercel & test quét QR bằng điện thoại thật.
