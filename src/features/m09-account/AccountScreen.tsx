'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  Cpu,
  History,
  LogIn,
  LogOut,
  Radar,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Type,
  User,
  UserPlus,
} from 'lucide-react';
import type { AppUserProfile, ScamReport, ScanHistoryItem, ScreenId, UiMode } from '@/types';

interface AccountScreenProps {
  currentUser: AppUserProfile | null;
  uiMode: UiMode;
  onChangeUiMode: (mode: UiMode) => void;
  onAuthChanged: (user: AppUserProfile | null) => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

export function AccountScreen({
  currentUser,
  uiMode,
  onChangeUiMode,
  onAuthChanged,
  onNavigate,
  onNotify,
}: AccountScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [myReports, setMyReports] = useState<ScamReport[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    void fetch('/api/user/profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { scanHistory?: ScanHistoryItem[]; myReports?: ScamReport[] } | null) => {
        if (!active || !data) return;
        setScanHistory(data.scanHistory ?? []);
        setMyReports(data.myReports ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentUser]);

  function handleSwitchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setUsername('');
    setFullName('');
    setPassword('');
    setFormError('');
  }

  async function submitAuth(
    payload: { username: string; password: string; fullName?: string },
    isReg: boolean,
    skipClientValidation = false
  ) {
    if (!skipClientValidation) {
      const cleanUser = payload.username.trim();
      const cleanPass = payload.password.trim();
      const cleanName = payload.fullName?.trim() ?? '';
      if (isReg && cleanName.length < 2) {
        setFormError('Vui lòng nhập họ và tên (tối thiểu 2 ký tự).');
        return;
      }
      if (cleanUser.length < 3) {
        setFormError('Tên đăng nhập hoặc SĐT phải có ít nhất 3 ký tự.');
        return;
      }
      if (cleanPass.length < 6) {
        setFormError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
    }

    setFormError('');
    setBusy(true);
    try {
      const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.username.trim(),
          password: payload.password.trim(),
          fullName: payload.fullName?.trim(),
        }),
      });
      const data = (await res.json()) as { user?: AppUserProfile; error?: string };
      if (!res.ok || !data.user) {
        setFormError(data.error || 'Đăng nhập thất bại.');
        return;
      }
      onAuthChanged(data.user);
      onNotify(
        data.user.role === 'admin'
          ? `Xin chào Quản trị viên ${data.user.fullName}!`
          : `Đăng nhập thành công: ${data.user.fullName}`
      );
    } catch {
      setFormError('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    onAuthChanged(null);
    setScanHistory([]);
    setMyReports([]);
    onNotify('Đã đăng xuất tài khoản.');
  }

  const modeSelectorCard = (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
      <div>
        <div className="flex items-center gap-2 font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
          <SlidersHorizontal className="h-4 w-4 text-[#0D685E]" aria-hidden="true" />
          Giao diện Thích ứng (theo thói quen dùng máy)
        </div>
        <p className="mt-1 text-[11px] text-[#475569]">
          Không giới hạn theo độ tuổi — chọn mức hiển thị phù hợp nhất với bạn.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onChangeUiMode('minimal')}
          data-screen="M09"
          data-ui="btn-mode-minimal"
          className={`rounded-2xl p-2.5 text-left transition ${
            uiMode === 'minimal'
              ? 'bg-[#0D685E] text-white ring-2 ring-[#14B8A6]'
              : 'bg-[#F4FBF8] text-[#475569] hover:bg-slate-100'
          }`}
        >
          <div className={`flex items-center gap-1 font-extrabold ${uiMode === 'minimal' ? 'text-white' : 'text-[#0D685E]'}`}>
            <Type className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tối giản
          </div>
          <div className={`mt-1 text-[10.5px] leading-snug ${uiMode === 'minimal' ? 'text-[#D1FAE5]' : 'text-[#475569]'}`}>
            Chữ to, 1 chạm, bật Nghe trực tiếp ngay.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChangeUiMode('standard')}
          data-screen="M09"
          data-ui="btn-mode-standard"
          className={`rounded-2xl p-2.5 text-left transition ${
            uiMode === 'standard'
              ? 'bg-[#E9FAF5] ring-2 ring-[#0D685E]'
              : 'bg-[#F4FBF8] text-[#475569] hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1 font-extrabold text-[#0D685E]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tiêu chuẩn
          </div>
          <div className="mt-1 text-[10.5px] leading-snug text-[#475569]">
            Cân bằng, đầy đủ tính năng hằng ngày.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChangeUiMode('pro')}
          data-screen="M09"
          data-ui="btn-mode-pro"
          className={`rounded-2xl p-2.5 text-left transition ${
            uiMode === 'pro'
              ? 'bg-[#0F172A] text-white ring-2 ring-[#0D685E]'
              : 'bg-[#F4FBF8] text-[#475569] hover:bg-slate-100'
          }`}
        >
          <div className={`flex items-center gap-1 font-extrabold ${uiMode === 'pro' ? 'text-[#34D399]' : 'text-[#0F172A]'}`}>
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Chuyên sâu
          </div>
          <div className={`mt-1 text-[10.5px] leading-snug ${uiMode === 'pro' ? 'text-slate-300' : 'text-[#475569]'}`}>
            Phân tích URL, nguồn AI/DB &amp; test hệ thống.
          </div>
        </button>
      </div>
    </div>
  );

  const techOnlyDiagnostic = uiMode === 'pro' && (
    <button
      type="button"
      onClick={() => onNavigate('M08')}
      data-screen="M09"
      data-ui="btn-open-m08"
      className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-bold text-[#0D685E] shadow-[0_4px_18px_rgba(13,104,94,0.06)]"
    >
      <span className="inline-flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        Kiểm tra Hệ thống &amp; Giả lập Mất mạng
      </span>
      <span>Mở →</span>
    </button>
  );

  return (
    <section className="space-y-4" data-screen="M09">
      <h1 className="px-1 font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
        Cài đặt &amp; Tài khoản
      </h1>

      {modeSelectorCard}

      {currentUser ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    currentUser.role === 'admin'
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : 'bg-[#E9FAF5] text-[#0D685E]'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
                    {currentUser.fullName}
                  </h2>
                  <div className="text-xs text-[#475569]">
                    @{currentUser.username} •{' '}
                    <strong
                      className={currentUser.role === 'admin' ? 'text-[#B45309]' : 'text-[#0D685E]'}
                    >
                      {currentUser.role === 'admin' ? 'Quản trị Đội TNTN' : 'Người dân / Học sinh'}
                    </strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                data-screen="M09"
                data-ui="btn-logout"
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#475569]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Thoát
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-2xl bg-[#F4FBF8] p-3">
                <div className="text-[#475569]">Huy hiệu Bắt Bài</div>
                <div className="mt-1 inline-flex items-center gap-1 font-extrabold text-[#0D685E]">
                  <Award className="h-3.5 w-3.5 text-[#F59E0B]" />
                  {currentUser.gameBadge}
                </div>
              </div>
              <div className="rounded-2xl bg-[#F4FBF8] p-3 tabular-nums">
                <div className="text-[#475569]">Điểm cao nhất</div>
                <div className="mt-1 font-extrabold text-[#0D685E]">{currentUser.gameScore} điểm</div>
              </div>
            </div>

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('M07')}
                data-screen="M09"
                data-ui="btn-goto-admin-radar"
                className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] text-xs font-extrabold text-[#0F172A] shadow-sm"
              >
                <Radar className="h-4 w-4" aria-hidden="true" />
                Mở Bảng điều khiển Quản trị &amp; Duyệt báo cáo
              </button>
            )}
          </div>

          <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
            <div className="mb-2.5 flex items-center gap-1.5 font-extrabold text-[#0D685E]">
              <History className="h-4 w-4" aria-hidden="true" />
              Lịch sử kiểm tra gần đây ({scanHistory.length})
            </div>
            {scanHistory.length === 0 ? (
              <p className="text-[#475569]">Chưa có lượt kiểm tra nào lưu dưới tài khoản này.</p>
            ) : (
              <div className="space-y-2">
                {scanHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#F4FBF8] p-2.5">
                    <div className="font-bold text-[#0F172A]">{item.title}</div>
                    <div className="truncate text-[11px] text-[#475569]">{item.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
            <div className="mb-2.5 font-extrabold text-[#0F172A]">
              Báo cáo tôi đã gửi ({myReports.length})
            </div>
            {myReports.length === 0 ? (
              <p className="text-[#475569]">Bạn chưa gửi báo cáo nào khi đang đăng nhập.</p>
            ) : (
              <div className="space-y-2">
                {myReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between rounded-2xl bg-[#F4FBF8] p-2.5"
                  >
                    <div>
                      <div className="font-bold">
                        {rep.id} • {rep.type}
                      </div>
                      <div className="text-[11px] text-[#475569]">{rep.targetMasked}</div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#0D685E]">
                      {rep.status === 'approved'
                        ? 'Đã duyệt'
                        : rep.status === 'rejected'
                        ? 'Từ chối'
                        : 'Chờ duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.06)]">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                mode === 'login' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                mode === 'register' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
              }`}
            >
              Đăng ký Người dân
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitAuth({ username, password, fullName }, mode === 'register');
            }}
            className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]"
          >
            {mode === 'register' && (
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Họ và tên (VD: Bác Tư / Nguyễn Văn A)"
                className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
              />
            )}
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Tên đăng nhập hoặc SĐT"
              className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
            />
            {formError && (
              <p className="rounded-xl bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B91C1C]">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              data-screen="M09"
              data-ui="btn-auth-submit"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D685E] text-sm font-bold text-white shadow-sm"
            >
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản Người dân'}
            </button>
          </form>

          {uiMode === 'pro' && (
            <div className="space-y-2.5 rounded-3xl bg-[#E9FAF5] p-4 text-xs">
              <div className="font-extrabold text-[#0D685E]">
                Đăng nhập nhanh thử nghiệm (Chế độ Chuyên sâu):
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void submitAuth({ username: 'nguoidan', password: '123456' }, false, true)
                  }
                  data-screen="M09"
                  data-ui="btn-demo-user"
                  className="rounded-2xl bg-white p-2.5 font-bold text-[#0D685E] shadow-sm"
                >
                  Người dân (nguoidan)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void submitAuth({ username: 'doantn', password: 'admin123' }, false, true)
                  }
                  data-screen="M09"
                  data-ui="btn-demo-admin"
                  className="rounded-2xl bg-[#F59E0B] p-2.5 font-extrabold text-[#0F172A] shadow-sm"
                >
                  Quản trị ĐTN (doantn)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {techOnlyDiagnostic}
    </section>
  );
}
