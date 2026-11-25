'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Flag, Lock, PhoneCall, Send, Share2 } from 'lucide-react';
import { maskSensitiveTarget } from '@/lib/privacy';
import { speakAlertVietnamese } from '@/lib/speech';
import type { AnalyzeResult, AppUserProfile, ScreenId } from '@/types';

interface FamilyScreenProps {
  scannedText: string;
  scanResult: AnalyzeResult | null;
  currentUser: AppUserProfile | null;
  onUserUpdated: (user: AppUserProfile) => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

const CONTACT_STORAGE_KEY = 'lacd_family_contact_v1';

export function FamilyScreen({
  scannedText,
  scanResult,
  currentUser,
  onUserUpdated,
  onNavigate,
  onNotify,
}: FamilyScreenProps) {
  const [view, setView] = useState<'sender' | 'receiver'>('sender');
  const [contactName, setContactName] = useState(
    currentUser?.trustedName ?? 'Chị Lan (Con gái • Ưu tiên 1)'
  );
  const [contactPhone, setContactPhone] = useState(currentUser?.trustedPhone ?? '0912345678');
  const [editing, setEditing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      if (currentUser) {
        setContactName(currentUser.trustedName);
        setContactPhone(currentUser.trustedPhone);
        return;
      }
      try {
        const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { name?: string; phone?: string };
        if (parsed.name) setContactName(parsed.name);
        if (parsed.phone) setContactPhone(parsed.phone);
      } catch {
        // Keep default contact
      }
    });
    return () => {
      active = false;
    };
  }, [currentUser]);

  async function handleSaveContact() {
    const cleanName = contactName.trim() || 'Người thân';
    const cleanPhone = contactPhone.trim() || '0912345678';
    try {
      window.localStorage.setItem(
        CONTACT_STORAGE_KEY,
        JSON.stringify({ name: cleanName, phone: cleanPhone })
      );
    } catch {
      // Ignore storage error
    }
    if (currentUser) {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trustedName: cleanName, trustedPhone: cleanPhone }),
        });
        if (res.ok) {
          const data = (await res.json()) as { user?: AppUserProfile };
          if (data.user) onUserUpdated(data.user);
        }
      } catch {
        // Ignore network error
      }
    }
    setEditing(false);
    onNotify(currentUser ? 'Đã lưu & đồng bộ lên tài khoản.' : 'Đã lưu danh bạ trên máy.');
  }

  const displayPhone = showPhone ? contactPhone : maskSensitiveTarget(contactPhone);
  const summarySnippet =
    scannedText.trim() || 'Cuộc gọi tự xưng Công an yêu cầu chuyển 50 triệu để xác minh.';
  const alertMessage = `[KHẨN - LÁ CHẮN SỐ ĐỒNG NAI] Ba vừa gặp nội dung nghi lừa đảo (${
    scanResult?.badge ?? 'Mức NGUY HIỂM'
  }): "${summarySnippet.slice(0, 120)}". Xin con gọi lại xác minh ngay!`;

  async function handleConfirmSend() {
    setSent(true);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Cảnh báo khẩn từ Lá Chắn Số', text: alertMessage });
        onNotify(`Đã mở chia sẻ thẻ cảnh báo tới ${contactName}.`);
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(alertMessage);
      onNotify(`Đã tạo & sao chép thẻ cảnh báo gửi ${contactName} (đã che SĐT).`);
    } catch {
      onNotify(`Đã xác nhận gửi thẻ cảnh báo tới ${contactName}.`);
    }
    void speakAlertVietnamese('Đã gửi thẻ cảnh báo sang điện thoại người thân.', 'family');
  }

  return (
    <section className="space-y-4" data-screen="M03">
      <div className="flex items-center justify-between gap-2 px-1">
        <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
          Hỏi người thân
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9FAF5] px-3 py-1 text-[11px] font-bold text-[#0D685E]">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Che SĐT mặc định
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.05)]">
        <button
          type="button"
          onClick={() => setView('sender')}
          data-screen="M03"
          data-ui="tab-family-sender"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            view === 'sender' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn Bác Tư (Gửi)
        </button>
        <button
          type="button"
          onClick={() => setView('receiver')}
          data-screen="M03"
          data-ui="tab-family-receiver"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            view === 'receiver' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn Chị Lan (Nhận)
        </button>
      </div>

      {view === 'sender' ? (
        <div className="space-y-3.5 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#F4FBF8] p-3">
            <div className="text-xs">
              <div className="font-extrabold text-[#0F172A]">{contactName}</div>
              <div className="tabular-nums mt-0.5 font-bold text-[#0D685E]">{displayPhone}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPhone((p) => !p)}
                aria-label={showPhone ? 'Ẩn số điện thoại' : 'Hiện số điện thoại'}
                className="rounded-xl bg-white p-2 text-[#475569] shadow-sm"
              >
                {showPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing((p) => !p)}
                className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-[#0D685E] shadow-sm"
              >
                {editing ? 'Đóng' : 'Đổi số'}
              </button>
            </div>
          </div>

          {editing && (
            <div className="space-y-2 rounded-2xl bg-[#E9FAF5] p-3 text-xs">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Tên người thân (VD: Chị Lan)"
                className="w-full rounded-xl bg-white p-2.5 outline-none"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Số điện thoại"
                className="w-full rounded-xl bg-white p-2.5 tabular-nums outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSaveContact()}
                className="w-full rounded-xl bg-[#0D685E] py-2.5 font-bold text-white"
              >
                Lưu người thân tin cậy
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-[#FFFBEB] p-3.5 text-xs leading-relaxed text-[#92400E]">
            <strong>Thẻ sẽ gửi đi (Human-in-the-Loop):</strong>
            <p className="mt-1 text-[#0F172A]">{alertMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleConfirmSend()}
            data-screen="M03"
            data-ui="btn-confirm-send-family"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] font-extrabold text-[#0F172A] shadow-[0_6px_18px_rgba(245,158,11,0.28)]"
          >
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {sent ? 'Đã gửi & sao chép cho Chị Lan' : 'Xác nhận gửi cho Chị Lan ngay'}
          </button>

          <a
            href={`tel:${contactPhone.replace(/\D/g, '')}`}
            data-screen="M03"
            data-ui="btn-call-family"
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E9FAF5] text-xs font-extrabold text-[#0D685E]"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Gọi điện thẳng cho {contactName.split('(')[0].trim()}
          </a>
        </div>
      ) : (
        <div className="space-y-3 rounded-3xl border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
          <div className="font-extrabold uppercase">Cảnh báo khẩn từ Ba (Bác Tư)</div>
          <p className="rounded-2xl bg-white p-3 text-[#0F172A]">{alertMessage}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] font-bold text-white"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Gọi lại cho Ba
            </a>
            <button
              type="button"
              onClick={() => onNavigate('M04')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-white font-bold text-[#991B1B] shadow-sm"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Lập hồ sơ báo cáo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
