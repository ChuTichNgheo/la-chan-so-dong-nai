# BẢN ĐỒ ĐIỀU HƯỚNG & CHỈNH SỬA NHANH

| Mã | Màn hình / Thành phần | Thư mục / File code | Người phụ trách | Vị trí sửa nhanh khi BGK hỏi |
| :--- | :--- | :--- | :--- | :--- |
| Types | Hợp đồng JSON Frontend ↔ Backend | `src/types/index.ts` | Chung | Đổi trường dữ liệu API / DB |
| DB | Kết nối Supabase (Server-only) | `src/lib/db.ts`, `supabase/schema.sql` | Dev 2 | Bảng `scam_reports` & client Supabase |
| Shell | Khung app, Header, 5 tab đáy | `src/components/MobileShell.tsx` | Dev 1 | Đổi thứ tự tab: `src/config/navigation.ts` |
| Logo | Logo thương hiệu & Cún AI | `src/components/BrandLogo.tsx`, `CunAiMascot.tsx` | Dev 1 | Đổi vị trí Cún AI: `right-3` <-> `left-3` |
| M01/M01b | Trang chủ Bento & Chế độ 65+ | `src/features/m01-home/` | Dev 1 | 3 nút 65+: `ElderlyMode.tsx` |
| M02 | Kiểm tra Hybrid 4 mức & Đọc to | `src/features/m02-scanner/` | Dev 1 | Luật offline: `src/data/local-rules.ts`; API + Gemini: `src/app/api/analyze/route.ts` |
| M03 | Hỏi người thân (Bác Tư / Chị Lan) | `src/features/m03-family/` | Dev 2 | Che SĐT: `src/lib/privacy.ts` |
| M04 | Báo cáo 3 bước & Hồ sơ Công an | `src/features/m04-report/` | Dev 2 | Gửi API: `POST /api/reports`; Đường dây nóng: `src/config/hotlines.ts` |
| M05 | Video dọc 1 phút (TikTok) | `src/features/m05-videos/` | Dev 2 | Danh sách video: `src/data/videos-data.ts` |
| M06 | Mini Game 5 màn & 10 bài học | `src/features/m06-learning/` | Dev 2 | Bộ câu hỏi/bài học: `src/data/lessons-game.ts` |
| M07 | Radar Đội TN & Xuất thẻ Zalo | `src/features/m07-radar/` | Dev 2 | API Radar & Duyệt: `src/app/api/reports/`; Zalo Canvas: `src/lib/zalo-card-canvas.ts` |
| M08 | Trạng thái Empty/Loading/Offline | `src/features/m08-system/` | Dev 1 | Nút giả lập mất mạng toàn app |
