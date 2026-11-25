'use client';

import { useEffect, useState } from 'react';
import { Award, History, LogIn, LogOut, Radar, ShieldAlert, ShieldCheck, User, UserPlus } from 'lucide-react';
import type { AppUserProfile, ScamReport, ScanHistoryItem, ScreenId } from '@/types';

interface AccountScreenProps {
  currentUser: AppUserProfile | null;
  onAuthChanged: (user: AppUserProfile | null) => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

export function AccountScreen({
  currentUser,
  onAuthChanged,
  onNavigate,
  onNotify,
}: AccountScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
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

  async function submitAuth(payload: { username: string; password: string; fullName?: string }, isReg: boolean) {
    setBusy(true);
    try {
      const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { user?: AppUserProfile; error?: string };
      if (!res.ok || !data.user) {
        onNotify(data.error || 'Đăng nhập thất bại.');
        return;
      }
      onAuthChanged(data.user);
      onNotify(
        data.user.role === 'admin'
          ? `Xin chào Quản trị viên ${data.user.fullName}!`
          : `Đăng nhập thành công: ${data.user.fullName}`
      );
    } catch {
      onNotify('Lỗi kết nối máy chủ xác thực.');
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

  const systemDiagnosticCard = (
    <button
      type="button"
      onClick={() => onNavigate('M08')}
      data-screen="M09"
      data-ui="btn-open-m08"
      className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-bold text-[#0D685E] shadow-[0_4px_18px_rgba(13,104,94,0.06)]"
    >
      <span className="inline-flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        Kiểm tra Hệ thống &amp; Giả lập Mất mạng (M08)
      </span>
      <span>Mở →</span>
    </button>
  );

  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    return (
      <section className="space-y-4" data-screen="M09">
        <div className="rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  isAdmin ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#E9FAF5] text-[#0D685E]'
                }`}
              >
                {isAdmin ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
                  {currentUser.fullName}
                </h1>
                <div className="text-xs text-[#475569]">
                  @{currentUser.username} •{' '}
                  <strong className={isAdmin ? 'text-[#B45309]' : 'text-[#0D685E]'}>
                    {isAdmin ? 'Quản trị Đội TNTN' : 'Người dân / Học sinh'}
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
              <div className="text-[#475569]">Huy hiệu Mini Game</div>
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

          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('M07')}
              data-screen="M09"
              data-ui="btn-goto-admin-radar"
              className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] text-xs font-extrabold text-[#0F172A] shadow-sm"
            >
              <Radar className="h-4 w-4" aria-hidden="true" />
              Mở Bảng điều khiển Quản trị &amp; Duyệt báo cáo (M07)
            </button>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
          <div className="mb-2.5 flex items-center gap-1.5 font-extrabold text-[#0D685E]">
            <History className="h-4 w-4" aria-hidden="true" />
            Lịch sử quét gần đây ({scanHistory.length})
          </div>
          {scanHistory.length === 0 ? (
            <p className="text-[#475569]">Chưa có lượt quét nào lưu dưới tài khoản này.</p>
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
          <div className="mb-2.5 font-extrabold text-[#0F172A]">Báo cáo tôi đã gửi ({myReports.length})</div>
          {myReports.length === 0 ? (
            <p className="text-[#475569]">Bạn chưa gửi báo cáo nào khi đang đăng nhập.</p>
          ) : (
            <div className="space-y-2">
              {myReports.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between rounded-2xl bg-[#F4FBF8] p-2.5">
                  <div>
                    <div className="font-bold">{rep.id} • {rep.type}</div>
                    <div className="text-[11px] text-[#475569]">{rep.targetMasked}</div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#0D685E]">
                    {rep.status === 'approved' ? 'Đã duyệt' : rep.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {systemDiagnosticCard}
      </section>
    );
  }

  return (
    <section className="space-y-4" data-screen="M09">
      <h1 className="px-1 font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
        Tài khoản &amp; Phân quyền
      </h1>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.06)]">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            mode === 'login' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
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
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên (VD: Bác Tư / Nguyễn Văn A)"
            className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
          />
        )}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tên đăng nhập hoặc SĐT"
          className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0D685E]"
        />
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

      <div className="space-y-2.5 rounded-3xl bg-[#E9FAF5] p-4 text-xs">
        <div className="font-extrabold text-[#0D685E]">Đăng nhập nhanh Demo (cho BGK kiểm thử):</div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitAuth({ username: 'nguoidan', password: '123456' }, false)}
            data-screen="M09"
            data-ui="btn-demo-user"
            className="rounded-2xl bg-white p-2.5 font-bold text-[#0D685E] shadow-sm"
          >
            Người dân (nguoidan)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitAuth({ username: 'doantn', password: 'admin123' }, false)}
            data-screen="M09"
            data-ui="btn-demo-admin"
            className="rounded-2xl bg-[#F59E0B] p-2.5 font-extrabold text-[#0F172A] shadow-sm"
          >
            Quản trị ĐTN (doantn)
          </button>
        </div>
      </div>

      {systemDiagnosticCard}
    </section>
  );
}
