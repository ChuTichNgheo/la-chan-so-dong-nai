<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# QUY TẮC DỰ ÁN — LÁ CHẮN SỐ ĐỒNG NAI (ĐỘI 12 - INFINITY AI)

## 1. Tech Stack & Kiến trúc Backend
- Framework: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React.
- Backend & Database thật:
  - Dùng Next.js Route Handlers (`src/app/api/`) kết nối Supabase (PostgreSQL) qua `src/lib/db.ts` (`@supabase/supabase-js`, chạy phía server để giấu `SUPABASE_SERVICE_ROLE_KEY`).
  - Không dùng SQLite file trên Vercel.
  - Client service `src/lib/report-store.ts` gọi `/api/reports` làm nguồn chính, tự fallback sang `localStorage` + `src/data/mock-radar.ts` khi Offline hoặc chưa cấu hình Supabase.
- AI thật: Gọi Gemini API qua `POST /api/analyze` (`process.env.GEMINI_API_KEY`). Tầng 1 kiểm tra `src/data/local-rules.ts` + báo cáo `approved` trong DB; khi lỗi/mất mạng tự fallback về Tầng 1.
- Giọng đọc (TTS) 3 tầng (`src/lib/speech.ts`): Web Speech API (`vi-VN`) → `/api/tts` (timeout 2s) → `public/audio/*.mp3`.
- Hợp đồng dữ liệu dùng chung: Khai báo tại `src/types/index.ts`.

## 2. Design System — Emerald Trust (WCAG 2.2 AA)
- Font: `Lexend` (tiêu đề) & `Be Vietnam Pro` (nội dung). Số liệu dùng `tabular-nums`.
- Khung ứng dụng: Mobile-first co giãn mềm `w-full max-w-[430px] mx-auto min-h-dvh` (cấm khóa cứng `w-[390px]` hoặc `100vh`). M07 Radar hỗ trợ mở rộng bản Desktop.
- Bảng màu: App BG `#F4FBF8`, Surface `#FFFFFF`, Soft `#E9FAF5`, Border `#CBE4DC`, Primary `#0D685E` (hover `#09524A`), Secondary `#14B8A6` (chỉ icon/viền), Family CTA `#F59E0B` / `#B45309` / `#0F172A`.
- 4 mức cảnh báo (Color-Not-Only): Nguy hiểm (`#FEF2F2`/`#B91C1C`/`#DC2626`/`#991B1B`), Nghi ngờ (`#FFFBEB`/`#D97706`/`#92400E`), Chưa ghi nhận – Vẫn cần cảnh giác (`#F1F5F9`/`#475569`/`#1E293B`), Đã xác thực (`#ECFDF5`/`#059669`/`#065F46`).

## 3. Nguyên tắc An toàn & Luật Code
- Anti-False-Negative: Tuyệt đối KHÔNG gắn nhãn "100% an toàn" cho số lạ chưa có dữ liệu; AI không tự hạ mức `Nguy hiểm` xuống `An toàn`.
- Privacy-by-Design: Luôn che SĐT dạng `0912 *** 678` qua `src/lib/privacy.ts` ở cả Server lẫn Client.
- Chống vu khống: Báo cáo vào trạng thái `pending`; chỉ cộng công khai sau khi Đoàn viên duyệt tại M07.
- Human-in-the-Loop: Cún AI luôn dừng trước nút xác nhận cuối để người dùng tự bấm.
- Chế độ 65+: Chữ lớn (`19px–20px`), nút `>= 50px`, ưu tiên 3 nút lớn tại M01.
- Mỗi file component dưới 200 dòng; mỗi màn hình nằm trong `src/features/m0x-.../`; nút quan trọng gắn `data-screen` và `data-ui`.
- Không tự ý cài thêm thư viện ngoài; không sửa chéo file màn hình khác; chạy `npm run build` / `npx tsc --noEmit` sau khi sửa.
