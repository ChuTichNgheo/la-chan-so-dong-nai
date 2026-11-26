-- ============================================================================
-- SEED DỮ LIỆU TRẢI NGHIỆM KHÁN GIẢ & BGK — LÁ CHẮN SỐ ĐỒNG NAI
-- An toàn tuyệt đối (idempotent: ON CONFLICT DO NOTHING — không ghi đè dữ liệu cũ)
-- Cách chạy: Copy toàn bộ → dán vào Supabase SQL Editor → bấm Run (10 giây xong, lên Live Vercel ngay!)
-- ============================================================================

-- 1. Phủ đều 12 báo cáo ĐÃ XÁC MINH (approved) trên cả 6 địa bàn trọng điểm Đồng Nai
-- Giúp khán giả bấm vào BẤT KỲ địa bàn nào trên Bản đồ Điểm nóng (M07) cũng thấy cảnh báo chi tiết
-- và Live Ticker trên Trang chủ (M01) chạy đa dạng, sinh động!
insert into public.scam_reports (id, type, target, target_masked, area, description, status, created_at)
values
  ('RP-DN-01', 'Đường dẫn giả mạo', 'http://vneid-capnhat-dn.xyz', 'http://vneid-capnhat-dn.xyz', 'P. Trấn Biên', 'Nhắn tin giả mạo hướng dẫn tích hợp BHYT VNeID mức 2, dụ cài tệp .apk chiếm quyền điện thoại.', 'approved', now() - interval '2 hours'),
  ('RP-DN-02', 'Giả danh công an / cơ quan', '0909888123', '0909 *** 123', 'P. Trấn Biên', 'Gọi video mặc sắc phục mờ tự xưng Công an TP. Biên Hòa, dọa liên quan vụ án rửa tiền ép chuyển 50 triệu.', 'approved', now() - interval '5 hours'),
  ('RP-DN-03', 'Tuyển CTV việc nhẹ lương cao', 'http://nhanqua-shopee-vn.xyz', 'http://nhanqua-shopee-vn.xyz', 'P. Tân Phong', 'Nhắn tin Zalo dụ học sinh THPT like video, nạp trước 200k mở nhiệm vụ hoàn tiền rồi khóa nhóm.', 'approved', now() - interval '7 hours'),
  ('RP-DN-04', 'Tuyển CTV việc nhẹ lương cao', '0898111412', '0898 *** 412', 'P. Tân Phong', 'Gọi mời cộng tác viên chốt đơn sàn TMĐT 300k–500k/ngày, yêu cầu chụp CCCD và chuyển tiền cọc.', 'approved', now() - interval '12 hours'),
  ('RP-DN-05', 'Giả danh công an / cơ quan', 'STK 109800006621', 'STK 1098 **** 6621', 'TP. Long Khánh', 'Ép người cao tuổi giữ bí mật với con cháu, chuyển tiền tiết kiệm vào tài khoản tạm giữ xác minh.', 'approved', now() - interval '16 hours'),
  ('RP-DN-06', 'Người thân gặp tai nạn', '0384772915', '0384 *** 915', 'TP. Long Khánh', 'Giả bác sĩ gọi báo con bị tai nạn đang mổ gấp, thúc giục chuyển 30 triệu vào STK cá nhân lạ.', 'approved', now() - interval '1 day'),
  ('RP-DN-07', 'Đường dẫn giả mạo', 'http://dienluc-dongnai-hddt.top', 'http://dienluc-dongnai-hddt.top', 'H. Long Thành', 'Giả nhân viên Điện lực Đồng Nai dọa cắt điện sau 2 giờ nếu không bấm link thanh toán hóa đơn.', 'approved', now() - interval '1 day 4 hours'),
  ('RP-DN-08', 'Giả danh công an / cơ quan', '0976441209', '0976 *** 209', 'H. Long Thành', 'Dùng video Deepfake 3 giây giả mặt người thân nhờ chuyển gấp tiền đặt cọc hàng.', 'approved', now() - interval '2 days'),
  ('RP-DN-09', 'Đường dẫn giả mạo', 'https://vietcombank-xacminh.top', 'https://vietcombank-xacminh.top', 'H. Nhơn Trạch', 'Giả nhân viên ngân hàng yêu cầu cập nhật sinh trắc học qua link lạ và đọc mã OTP.', 'approved', now() - interval '2 days 6 hours'),
  ('RP-DN-10', 'Tuyển CTV việc nhẹ lương cao', '0865339104', '0865 *** 104', 'H. Nhơn Trạch', 'Dụ công nhân và thanh niên mở rồi cho thuê tài khoản ngân hàng với giá 1 triệu đồng/tài khoản.', 'approved', now() - interval '3 days'),
  ('RP-DN-11', 'Đường dẫn giả mạo', 'http://quatang-tri-an-dn.click', 'http://quatang-tri-an-dn.click', 'H. Trảng Bom', 'Gửi tin trúng thưởng quà tri ân miễn phí, yêu cầu nhập thông tin thẻ và phí vận chuyển.', 'approved', now() - interval '3 days 8 hours'),
  ('RP-DN-12', 'Người thân gặp tai nạn', '0918554702', '0918 *** 702', 'H. Trảng Bom', 'Chiếm quyền Zalo bạn thân nhắn mượn 3 triệu chuyển vào STK người lạ, lấy lý do hỏng mic không gọi được.', 'approved', now() - interval '4 days')
on conflict (id) do nothing;

-- 2. Thêm 8 Luật chặn nóng (dynamic_rules) để khán giả quét/tra cứu khớp tức thì < 50ms (giảm tải Gemini!)
insert into public.dynamic_rules (id, pattern, level, note, created_by, created_at)
values
  ('DR-DN-01', 'vneid-capnhat-dn.xyz', 'danger', 'Tên miền giả mạo VNeID tích hợp BHYT phát tán tệp .apk tại P. Trấn Biên.', 'adm-demo-01', now()),
  ('DR-DN-02', 'nhanqua-shopee-vn.xyz', 'danger', 'Đường dẫn bẫy tuyển CTV việc nhẹ lương cao nhắm vào học sinh THPT.', 'adm-demo-01', now()),
  ('DR-DN-03', 'vietcombank-xacminh.top', 'danger', 'Trang giả mạo cập nhật sinh trắc học ngân hàng để đánh cắp mật khẩu & OTP.', 'adm-demo-01', now()),
  ('DR-DN-04', 'dienluc-dongnai-hddt.top', 'danger', 'Link giả Điện lực Đồng Nai hù dọa cắt điện trong 2 giờ.', 'adm-demo-01', now()),
  ('DR-DN-05', '109800006621', 'danger', 'Số tài khoản đã bị cộng đồng TP. Long Khánh tố cáo nhận tiền lừa đảo giả Công an.', 'adm-demo-01', now()),
  ('DR-DN-06', '0909888123', 'danger', 'Số điện thoại giả danh cán bộ Công an TP. Biên Hòa gọi dọa khởi tố.', 'adm-demo-01', now()),
  ('DR-DN-07', '0898111412', 'warn', 'Số điện thoại thường xuyên nhắn tin dụ học sinh nạp 200k làm nhiệm vụ CTV.', 'adm-demo-01', now()),
  ('DR-DN-08', 'canhbao.ncsc.gov.vn', 'safe', 'Cổng cảnh báo an toàn thông tin chính thức của Trung tâm Giám sát an toàn không gian mạng quốc gia (NCSC).', 'adm-demo-01', now())
on conflict (id) do nothing;

-- 3. Thêm 2 tin Cảnh báo gia đình mẫu (family_alerts) để khán giả mở tab "Người thân nhận" (M03) thấy sinh động ngay
insert into public.family_alerts (id, sender_id, sender_name, target_phone, risk_level, snippet, status, acknowledged_by, created_at)
values
  ('FA-DN-01', 'usr-demo-01', 'Bác Tư (P. Trấn Biên)', '0912345678', 'danger', '[KHẨN - LÁ CHẮN SỐ ĐỒNG NAI] Ba vừa nhận cuộc gọi tự xưng Công an Biên Hòa đòi chuyển 50 triệu xác minh. Xin con gọi lại ngay!', 'sent', null, now() - interval '25 minutes'),
  ('FA-DN-02', 'usr-demo-01', 'Bác Tư (P. Trấn Biên)', '0912345678', 'warn', '[CẢNH GIÁC - LÁ CHẮN SỐ ĐỒNG NAI] Ba nhận tin nhắn báo cắt điện sau 2 giờ kèm link lạ http://dienluc-dongnai-hddt.top.', 'acknowledged', 'Chị Lan', now() - interval '3 hours')
on conflict (id) do nothing;
