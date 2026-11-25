# NHẬT KÝ BÀN GIAO AI (Cập nhật mỗi 2 giờ hoặc trước khi đổi AI)

## Trạng thái hiện tại
- Giai đoạn: Khởi tạo xong khung xương Next.js + API routes khung + `npm run build`
- Tính năng đã có khung:
  - [x] Khung Next.js 16 App Router + Tailwind + Lucide + Supabase client
  - [x] `MobileShell` + 5 tab đáy + nút Chế độ 65+ & Báo cáo
  - [x] API Routes khung: `/api/analyze`, `/api/tts`, `/api/reports`, `/api/reports/[id]`
  - [x] 8 thư mục màn hình `m01-home`..`m08-system` nối vào `src/app/page.tsx`
  - [ ] Tích hợp Gemini API thật trong `/api/analyze` (Dev 1)
  - [ ] Hoàn thiện UI & logic chi tiết từng màn hình M01–M08 (Dev 1 & Dev 2)

## Việc tiếp theo cần làm ngay
- Dev 1 (`feat/dev1-core`): Triển khai Tầng 1 + Gemini API thật ở `src/app/api/analyze/route.ts`, giọng đọc `src/lib/speech.ts`, giao diện `m01-home/`, `m02-scanner/`, `m08-system/`.
- Dev 2 (`feat/dev2-community`): Tạo bảng `scam_reports` từ `supabase/schema.sql`, điền `.env.local`, hoàn thiện `m03-family/`, `m04-report/`, `m05-videos/`, `m06-learning/`, `m07-radar/`.

## Nhật ký Công cụ AI & Thư viện
- Công cụ hỗ trợ lập trình: Antigravity (Gemini)
- API & Nền tảng: Next.js 16, TypeScript, Tailwind CSS, Lucide React, Supabase (`@supabase/supabase-js`), Gemini API, Web Speech API, HTML5 Canvas
