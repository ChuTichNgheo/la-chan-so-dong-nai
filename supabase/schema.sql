-- Chạy đoạn SQL này trong Supabase SQL Editor để tạo bảng báo cáo cho Lá Chắn Số Đồng Nai
create table if not exists public.scam_reports (
  id text primary key,
  type text not null,
  target text not null,
  target_masked text not null,
  area text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_scam_reports_status on public.scam_reports (status);
create index if not exists idx_scam_reports_created_at on public.scam_reports (created_at desc);

-- Dữ liệu mồi hàng chờ duyệt ban đầu (3 mục chờ xác minh)
insert into public.scam_reports (id, type, target, target_masked, area, description, status)
values
  ('RP-121', 'Đường dẫn giả mạo', 'http://vneid-capnhat-dn.xyz', 'http://vneid-capnhat-dn.xyz', 'P. Trấn Biên', 'Giả mạo tích hợp BHYT VNeID có ảnh chụp tin nhắn.', 'pending'),
  ('RP-122', 'Tuyển CTV việc nhẹ lương cao', '0898111412', '0898 *** 412', 'P. Tân Phong', 'Nhắn tin dụ học sinh THPT nạp 200k làm nhiệm vụ.', 'pending'),
  ('RP-123', 'Giả danh công an / cơ quan', 'STK 109800006621', 'STK 1098 **** 6621', 'TP. Long Khánh', 'Gọi điện dọa người cao tuổi chuyển tiền xác minh.', 'pending')
on conflict (id) do nothing;
