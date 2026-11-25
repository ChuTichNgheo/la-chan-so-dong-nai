'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Flag, Lock, PhoneCall, Send } from 'lucide-react';
import { maskSensitiveTarget } from '@/lib/privacy';
import { speakAlertVietnamese } from '@/lib/speech';
import type { AnalyzeResult, ScreenId } from '@/types';

interface FamilyScreenProps {
  scannedText: string;
  scanResult: AnalyzeResult | null;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

const CONTACT_STORAGE_KEY = 'lacd_family_contact_v1';

export function FamilyScreen({
  scannedText,
  scanResult,
  onNavigate,
  onNotify,
}: FamilyScreenProps) {
  const [view, setView] = useState<'sender' | 'receiver'>('sender');
  const [contactName, setContactName] = useState('Chị Lan (Con gái • Ưu tiên 1)');
  const [contactPhone, setContactPhone] = useState('0912345678');
  const [editing, setEditing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
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
  }, []);

  function handleSaveContact() {
    try {
      window.localStorage.setItem(
        CONTACT_STORAGE_KEY,
        JSON.stringify({ name: contactName.trim() || 'Người thân', phone: contactPhone.trim() })
      );
    } catch {
      // Ignore storage error
    }
    setEditing(false);
    onNotify('Đã lưu danh bạ người thân tin cậy trên máy.');
  }

  const displayPhone = showPhone ? contactPhone : maskSensitiveTarget(contactPhone);
  const summarySnippet =
    scannedText.trim() || 'Cuộc gọi tự xưng Công an yêu cầu chuyển 50 triệu để xác minh.';
  const alertMessage = `[KHẨN - LÁ CHẮN SỐ ĐỒNG NAI] Ba vừa gặp nội dung nghi lừa đảo (${
    scanResult?.badge ?? 'Mức NGUY HIỂM'
  }): "${summarySnippet.slice(0, 120)}". Xin con gọi lại xác minh ngay!`;

  async function handleConfirmSend() {
    setSent(true);
    try {
      await navigator.clipboard.writeText(alertMessage);
      onNotify(`Đã tạo & sao chép thẻ cảnh báo gửi ${contactName} (đã che SĐT).`);
    } catch {
      onNotify(`Đã xác nhận gửi thẻ cảnh báo tới ${contactName}.`);
    }
    void speakAlertVietnamese('Đã gửi thẻ cảnh báo sang điện thoại người thân.', 'family');
  }

  return (
    <section className="space-y-3" data-screen="M03">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
          Hỏi người thân xác minh
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9FAF5] px-2.5 py-0.5 text-[11px] font-bold text-[#0D685E]">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Che SĐT mặc định
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#CBE4DC] bg-white p-1">
        <button
          type="button"
          onClick={() => setView('sender')}
          data-screen="M03"
          data-ui="tab-family-sender"
          className={`rounded-lg py-2 text-xs font-bold ${
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
          className={`rounded-lg py-2 text-xs font-bold ${
            view === 'receiver' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn Chị Lan (Nhận)
        </button>
      </div>

      {view === 'sender' ? (
        <div className="space-y-3 rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#F4FBF8] p-2.5">
            <div className="text-xs">
              <div className="font-extrabold text-[#0F172A]">{contactName}</div>
              <div className="tabular-nums mt-0.5 font-bold text-[#0D685E]">{displayPhone}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPhone((p) => !p)}
                aria-label={showPhone ? 'Ẩn số điện thoại' : 'Hiện số điện thoại'}
                className="rounded-lg border border-[#CBE4DC] bg-white p-1.5 text-[#475569]"
              >
                {showPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing((p) => !p)}
                className="rounded-lg border border-[#CBE4DC] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0D685E]"
              >
                {editing ? 'Đóng' : 'Đổi số'}
              </button>
            </div>
          </div>

          {editing && (
            <div className="space-y-2 rounded-xl border border-[#CBE4DC] bg-[#E9FAF5] p-3 text-xs">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Tên người thân (VD: Chị Lan)"
                className="w-full rounded-lg border border-[#CBE4DC] bg-white p-2"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Số điện thoại"
                className="w-full rounded-lg border border-[#CBE4DC] bg-white p-2 tabular-nums"
              />
              <button
                type="button"
                onClick={handleSaveContact}
                className="w-full rounded-lg bg-[#0D685E] py-2 font-bold text-white"
              >
                Lưu người thân tin cậy
              </button>
            </div>
          )}

          <div className="rounded-xl border border-[#F59E0B] bg-[#FFFBEB] p-3 text-xs leading-relaxed text-[#92400E]">
            <strong>Thẻ sẽ gửi đi (Human-in-the-Loop):</strong>
            <p className="mt-1 text-[#0F172A]">{alertMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleConfirmSend()}
            data-screen="M03"
            data-ui="btn-confirm-send-family"
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#B45309] bg-[#F59E0B] font-extrabold text-[#0F172A] shadow-sm"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {sent ? 'Đã gửi & sao chép cho Chị Lan' : 'Xác nhận gửi cho Chị Lan ngay'}
          </button>

          <a
            href={`tel:${contactPhone.replace(/\D/g, '')}`}
            data-screen="M03"
            data-ui="btn-call-family"
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0D685E] bg-white text-xs font-extrabold text-[#0D685E]"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Gọi điện thẳng cho {contactName.split('(')[0].trim()}
          </a>
        </div>
      ) : (
        <div className="space-y-2.5 rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
          <div className="font-extrabold uppercase">Cảnh báo khẩn từ Ba (Bác Tư)</div>
          <p className="rounded-xl bg-white p-2.5 text-[#0F172A]">{alertMessage}</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0D685E] font-bold text-white"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Gọi lại cho Ba
            </a>
            <button
              type="button"
              onClick={() => onNavigate('M04')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DC2626] bg-white font-bold text-[#991B1B]"
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
