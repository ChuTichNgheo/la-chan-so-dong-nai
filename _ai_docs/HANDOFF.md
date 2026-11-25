# NHẬT KÝ BÀN GIAO AI (Cập nhật 25/11/2026)

## Trạng thái hiện tại
- Giai đoạn: Đã hoàn thiện full-stack 9 màn hình (`M01`–`M09`) + toàn bộ 3 đợt nâng cấp đột phá cho Vòng Chung kết (hạn 04:30 ngày 26/11/2026).
- Tính năng nổi bật đã hoàn thiện:
  - [x] **3 Chế độ Giao diện Thích ứng** (`Tối giản` / `Tiêu chuẩn` / `Chuyên sâu`) không giới hạn tuổi tác, hỗ trợ mở thẳng `/?mode=minimal`.
  - [x] **Lá Chắn Nghe Trực Tiếp (`LiveVoiceGuardModal`)**: Nghe Micro tiếng Việt liên tục, bắt từ khóa lừa đảo tức thì + đọc to báo động + 2 luồng giả lập dự phòng sân khấu.
  - [x] **Trang chủ `M01` mới**: Thanh 3 chế độ + Hero Command Center + Live Ticker Đồng Nai + Thanh Độ An Toàn Cá Nhân + Bento 2×2 + Carousel thủ đoạn đang rộ.
  - [x] **`M02` Scanner nâng cấp**: 3 thanh đo Đòn Tâm Lý Thao Túng (`Gây hoảng loạn / Ép chuyển gấp / Cô lập`), Câu nói mẫu thoát thân an toàn (Đọc to / Copy), nút 1 chạm đẩy nhanh về hàng chờ duyệt Admin.
  - [x] **`M07` Radar & Tự động hóa**: API `POST /api/admin/sync-intel` (quét RSS báo chí VN + Gemini chuẩn hóa → tự đẩy `pending` cho Admin duyệt 1 chạm + combo *Duyệt & Chặn nóng*), Bản đồ/Lưới Điểm nóng 6 địa bàn Đồng Nai, `POST /api/admin/zalo-bulletin` (AI soạn bản tin Zalo 1 chạm), Xuất **Poster QR Dán Tủ Lạnh (.png)** mở thẳng chế độ Tối giản.
  - [x] **`M06` Học tập & Đấu trí AI**: API `POST /api/roleplay` cho phép chat qua lại 3 lượt với Gemini nhập vai kẻ lừa đảo → chấm điểm Độ Tỉnh Táo `0–100` & chỉ lỗi sơ hở + Xuất **Thẻ Huy Hiệu PNG thật** cho cả Đấu trí AI lẫn Mini Game 10 giây.

## Việc tiếp theo cần làm ngay trước 04:30 sáng 26/11
- Đẩy code lên GitHub, kiểm tra bảng trên Supabase (`supabase/schema.sql`), deploy lên Vercel (cài 4 biến môi trường), test trực tiếp trên điện thoại thật (QR, Micro, Share PNG), quay video demo ≤ 3 phút, hoàn thiện Slide ≤ 10 trang & `TECHNICAL_REPORT.md`.
