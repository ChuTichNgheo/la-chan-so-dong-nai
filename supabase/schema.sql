-- Chạy toàn bộ file này trong Supabase SQL Editor để cập nhật DB đầy đủ cho Lá Chắn Số Đồng Nai

-- 1. Bảng Tài khoản người dùng & Quản trị viên
create table if not exists public.app_users (
  id text primary key,
  username text unique not null,
  full_name text not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_locked boolean not null default false,
  trusted_name text not null default 'Chị Lan (Con gái)',
  trusted_phone text not null default '0912345678',
  game_score integer not null default 0,
  game_badge text not null default 'Tân Binh Số',
  created_at timestamptz not null default now()
);

-- 2. Bảng Báo cáo lừa đảo cộng đồng
create table if not exists public.scam_reports (
  id text primary key,
  type text not null,
  target text not null,
  target_masked text not null,
  area text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reporter_id text references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.scam_reports
  add column if not exists reporter_id text references public.app_users(id) on delete set null;

create index if not exists idx_scam_reports_status on public.scam_reports (status);
create index if not exists idx_scam_reports_created_at on public.scam_reports (created_at desc);
create index if not exists idx_scam_reports_reporter on public.scam_reports (reporter_id);

-- 3. Bảng Lịch sử quét của người dùng
create table if not exists public.scan_history (
  id text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  snippet text not null,
  risk_level text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scan_history_user on public.scan_history (user_id, created_at desc);

-- 4. Bảng Luật chặn nóng do Quản trị viên quản lý
create table if not exists public.dynamic_rules (
  id text primary key,
  pattern text not null,
  level text not null check (level in ('danger', 'warn', 'safe')),
  note text not null,
  created_by text references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. Bảng Cảnh báo Gia đình xuyên thiết bị (M03)
create table if not exists public.family_alerts (
  id text primary key,
  sender_id text references public.app_users(id) on delete set null,
  sender_name text not null,
  target_phone text not null,
  risk_level text not null default 'danger',
  snippet text not null,
  status text not null default 'sent' check (status in ('sent', 'acknowledged')),
  acknowledged_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_family_alerts_phone on public.family_alerts (target_phone, created_at desc);

-- Tài khoản Demo mặc định:
-- Người dân: nguoidan / 123456
-- Quản trị (Đội TNTN): doantn / admin123
insert into public.app_users (id, username, full_name, password_hash, role, trusted_name, trusted_phone, game_score, game_badge)
values
  ('usr-demo-01', 'nguoidan', 'Bác Tư (P. Trấn Biên)', 'lacd_seed_user:56c34b43af3de728b39ca03b99f2476b401905c0d2785502d35f95ddadf90b21aa32257fdc24fe8a90c3bc1ca15ed9d0584655266a3aa2df09fd63e3b15d50c7', 'user', 'Chị Lan (Con gái)', '0912345678', 225, 'Thám Tử Số Tiềm Năng'),
  ('adm-demo-01', 'doantn', 'Quản trị Đội TNTN Đồng Nai', 'lacd_seed_admin:29cf765ef27fe01c5fd3134b3288aef8a879f3754407f893a324e70db167324aff9fe28264c8b63b35154023c0f4397ee5f3eff697ef3404a52938371fc6a20e', 'admin', 'Tổng đài Thành đoàn', '0343551251', 500, 'Siêu Lá Chắn Đồng Nai')
on conflict (id) do nothing;

-- Dữ liệu mồi 3 báo cáo chờ duyệt ban đầu
insert into public.scam_reports (id, type, target, target_masked, area, description, status)
values
  ('RP-121', 'Đường dẫn giả mạo', 'http://vneid-capnhat-dn.xyz', 'http://vneid-capnhat-dn.xyz', 'P. Trấn Biên', 'Giả mạo tích hợp BHYT VNeID có ảnh chụp tin nhắn.', 'pending'),
  ('RP-122', 'Tuyển CTV việc nhẹ lương cao', '0898111412', '0898 *** 412', 'P. Tân Phong', 'Nhắn tin dụ học sinh THPT nạp 200k làm nhiệm vụ.', 'pending'),
  ('RP-123', 'Giả danh công an / cơ quan', 'STK 109800006621', 'STK 1098 **** 6621', 'TP. Long Khánh', 'Gọi điện dọa người cao tuổi chuyển tiền xác minh.', 'pending')
on conflict (id) do nothing;
